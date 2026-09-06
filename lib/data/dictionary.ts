import { createClient } from "@/lib/supabase/server";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";
import { getEmotionTags } from "@/lib/data/emotion-tags";
import { attachPollData } from "@/lib/data/polls";
import { fuzzyMatch, tryParseRegex, looksLikeRegex } from "@/lib/search/fuzzy";
import { isAlphabeticWord } from "@/lib/utils/language";
import { getBlockedUserIds } from "@/lib/actions/blocks";

const POST_SELECT = `
  id, user_id, word, meaning, context, photo_url, note, visibility, post_type,
  like_count, comment_count, is_hidden, created_at, updated_at,
  users:user_id ( id, username, display_name, avatar_url ),
  post_emotion_tags ( emotion_tags ( id, name, emoji, sort_order, category, name_en ) )
`;

/**
 * 英語学習者モード用: 単語がアルファベットのみ(=英語投稿)の行だけを残す。
 * lib/data/posts.ts の同名ロジックと同じ判定基準を使う。
 */
function filterEnglishOnly<T extends { word: string }>(
  rows: T[],
  learnerMode: boolean
): T[] {
  if (!learnerMode) return rows;
  return rows.filter((row) => isAlphabeticWord(row.word));
}

/**
 * 通報自動非表示(is_hidden)・ブロックユーザーの投稿を取り除く。
 * lib/data/posts.ts の同名ロジックと同じ判定基準を使う。
 */
function filterHiddenAndBlocked<T extends { user_id: string; is_hidden?: boolean }>(
  rows: T[],
  blockedUserIds: Set<string>
): T[] {
  return rows.filter((row) => !row.is_hidden && !blockedUserIds.has(row.user_id));
}

/**
 * 投稿データに反応タグの内訳・自分のいいね/反応状態・(投票投稿の場合は)
 * 投票情報を付与する共通処理。
 * lib/data/posts.ts の getFeedPosts と同じロジックを、検索・自分の辞書ページでも使う。
 *
 * likes・reaction_tags・emotion_tagsの取得は互いに依存しないためPromise.allで並列化する。
 */
async function enrichPosts(
  rawPosts: unknown[],
  currentUserId: string | null
): Promise<PostWithRelations[]> {
  const supabase = await createClient();
  const postIds = rawPosts.map((p) => (p as { id: string }).id);

  const [likesResult, reactionsResult, emotionTags] = await Promise.all([
    currentUserId && postIds.length > 0
      ? supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUserId)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    postIds.length > 0
      ? supabase
          .from("reaction_tags")
          .select("post_id, user_id, emotion_tag_id")
          .in("post_id", postIds)
      : Promise.resolve({
          data: [] as { post_id: string; user_id: string; emotion_tag_id: number }[],
        }),
    getEmotionTags(),
  ]);

  const likedPostIds = new Set((likesResult.data ?? []).map((l) => l.post_id));

  const reactionSummaryByPost = new Map<string, Map<number, number>>();
  const myReactionsByPost = new Map<string, Set<number>>();

  for (const row of reactionsResult.data ?? []) {
    if (!reactionSummaryByPost.has(row.post_id)) {
      reactionSummaryByPost.set(row.post_id, new Map());
    }
    const tagCounts = reactionSummaryByPost.get(row.post_id)!;
    tagCounts.set(row.emotion_tag_id, (tagCounts.get(row.emotion_tag_id) ?? 0) + 1);

    if (currentUserId && row.user_id === currentUserId) {
      if (!myReactionsByPost.has(row.post_id)) {
        myReactionsByPost.set(row.post_id, new Set());
      }
      myReactionsByPost.get(row.post_id)!.add(row.emotion_tag_id);
    }
  }

  const emotionTagById = new Map<number, EmotionTag>(
    emotionTags.map((t) => [t.id, t])
  );

  const posts = (rawPosts as PostWithRelations[]).map((post) => {
    const tagCounts = reactionSummaryByPost.get(post.id);
    const reaction_summary = tagCounts
      ? Array.from(tagCounts.entries())
          .map(([tagId, count]) => {
            const emotion_tag = emotionTagById.get(tagId);
            return emotion_tag ? { emotion_tag, count } : null;
          })
          .filter((v): v is { emotion_tag: EmotionTag; count: number } => v !== null)
      : [];

    return {
      ...post,
      liked_by_me: likedPostIds.has(post.id),
      reaction_summary,
      my_reaction_tag_ids: Array.from(myReactionsByPost.get(post.id) ?? []),
    };
  });

  return attachPollData(posts, currentUserId);
}

/**
 * 「みんなの辞書」検索。
 * 企画書7-3章: 同じ単語が複数ユーザーから投稿されていても名寄せせず、
 * 投稿ごとに個別のカードとして表示する。
 *
 * 検索の柔軟性:
 *   - キーワードに正規表現特有の記号(., *, ?, [] 等)が含まれる場合、
 *     まず正規表現として解釈を試み、有効ならそれで単語をマッチさせる。
 *   - それ以外は、ひらがな/カタカナ・全角半角・大文字小文字を無視した
 *     あいまい一致(1〜2文字程度の表記ゆれ・入力ミスも許容)で判定する。
 *   - PostgreSQL側の ilike では上記の柔軟な一致を表現できないため、
 *     直近の投稿を一定件数取得した上で、アプリ側でフィルタする方式にしている。
 *
 * learnerMode: true の場合、英語の投稿(単語がアルファベットのみ)だけを返す。
 * 通報自動非表示(is_hidden)の投稿、自分がブロックしたユーザーの投稿は常に除外する。
 */
export async function searchAllPosts(
  keyword: string,
  currentUserId: string | null,
  learnerMode = false
): Promise<PostWithRelations[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const supabase = await createClient();

  const blockedUserIds = new Set(
    currentUserId ? await getBlockedUserIds(currentUserId) : []
  );

  // 検索対象の母集団: 直近500件の公開投稿(+自分の非公開投稿)を取得してから
  // アプリ側でフィルタする。全文検索エンジンではないため、この規模を上限とする。
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) return [];

  const regex = looksLikeRegex(trimmed) ? tryParseRegex(trimmed) : null;

  const matched = (
    data as unknown as { word: string; user_id: string; is_hidden?: boolean }[]
  ).filter((row) => (regex ? regex.test(row.word) : fuzzyMatch(trimmed, row.word)));

  const notHiddenOrBlocked = filterHiddenAndBlocked(matched, blockedUserIds);
  const filtered = filterEnglishOnly(notHiddenOrBlocked, learnerMode);
  const limited = filtered.slice(0, 50);
  return enrichPosts(limited, currentUserId);
}

/**
 * 自分の投稿一覧（自分の辞書ページ用）。キーワードがあれば絞り込む。
 * 検索ロジックは searchAllPosts と同様（あいまい一致・正規表現対応）。
 *
 * learnerMode: true の場合、英語の投稿(単語がアルファベットのみ)だけを返す。
 * 自分の投稿でも学習者モード中は日本語投稿を一時的に隠す仕様とする
 * （企画: 学習者モードがオンの間は英語の投稿しか見えない）。
 * is_hidden(通報自動非表示)の自分の投稿は、自分自身には表示したままにする
 * （自分では気づけないまま存在が見えなくなるのを避けるため）。
 */
export async function getMyPosts(
  userId: string,
  keyword?: string,
  learnerMode = false
): Promise<PostWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const trimmed = keyword?.trim();
  if (!trimmed) {
    const filtered = filterEnglishOnly(data as unknown as { word: string }[], learnerMode);
    return enrichPosts(filtered, userId);
  }

  const regex = looksLikeRegex(trimmed) ? tryParseRegex(trimmed) : null;
  const matched = (data as unknown as { word: string }[]).filter((row) =>
    regex ? regex.test(row.word) : fuzzyMatch(trimmed, row.word)
  );

  const filtered = filterEnglishOnly(matched, learnerMode);
  return enrichPosts(filtered, userId);
}

/** 自分の辞書ページの統計サマリー */
export async function getMyDictionaryStats(userId: string): Promise<{
  wordCount: number;
  reactionCount: number;
  categoryCount: number;
}> {
  const supabase = await createClient();

  const { count: wordCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  // もらった反応数 = 自分の投稿に付いたいいね + 反応タグの合計
  const { data: myPostIds } = await supabase
    .from("posts")
    .select("id")
    .eq("user_id", userId);
  const postIds = (myPostIds ?? []).map((p) => p.id);

  let likeTotal = 0;
  let reactionTotal = 0;
  let categoryCount = 0;

  if (postIds.length > 0) {
    const { count: likeCount } = await supabase
      .from("likes")
      .select("post_id", { count: "exact", head: true })
      .in("post_id", postIds);
    likeTotal = likeCount ?? 0;

    const { count: reactionCount } = await supabase
      .from("reaction_tags")
      .select("id", { count: "exact", head: true })
      .in("post_id", postIds);
    reactionTotal = reactionCount ?? 0;

    // カテゴリ数 = 投稿者自身が付けた感情タグの種類数（重複なし）
    const { data: postTags } = await supabase
      .from("post_emotion_tags")
      .select("emotion_tag_id")
      .in("post_id", postIds);
    categoryCount = new Set((postTags ?? []).map((t) => t.emotion_tag_id)).size;
  }

  return {
    wordCount: wordCount ?? 0,
    reactionCount: likeTotal + reactionTotal,
    categoryCount,
  };
}

export interface PublicUserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

/** usernameから公開プロフィール情報を取得する（他人の辞書ページ用） */
export async function getUserByUsername(
  username: string
): Promise<PublicUserProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, bio")
    .eq("username", username)
    .maybeSingle<PublicUserProfile>();

  return data ?? null;
}

/**
 * 対象ユーザーの公開投稿一覧を取得する（他人の辞書ページ用）。
 * RLS上、他人が閲覧できるのは元々公開投稿のみだが、
 * ここでも明示的に visibility = 'public' で絞り、意図を明確にしている。
 *
 * learnerMode: true の場合、英語の投稿(単語がアルファベットのみ)だけを返す。
 * 通報自動非表示(is_hidden)の投稿は、他人からは常に除外する。
 * currentUserIdがtargetUserIdをブロックしている場合、通常はこの関数を
 * 呼ぶ前段でページ側がブロック状態を見て遷移を止める想定だが、
 * 念のためここでもブロック関係を確認して空配列を返す。
 */
export async function getPublicPostsByUser(
  targetUserId: string,
  currentUserId: string | null,
  learnerMode = false
): Promise<PostWithRelations[]> {
  const supabase = await createClient();

  if (currentUserId) {
    const blockedUserIds = new Set(await getBlockedUserIds(currentUserId));
    if (blockedUserIds.has(targetUserId)) {
      return [];
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", targetUserId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const notHidden = (data as unknown as { is_hidden?: boolean }[]).filter(
    (row) => !row.is_hidden
  );
  const filtered = filterEnglishOnly(notHidden as unknown as { word: string }[], learnerMode);
  return enrichPosts(filtered, currentUserId);
}

/** 対象ユーザーの公開投稿に関する統計サマリー（他人の辞書ページ用） */
export async function getPublicDictionaryStats(targetUserId: string): Promise<{
  wordCount: number;
  reactionCount: number;
  categoryCount: number;
}> {
  const supabase = await createClient();

  const { data: publicPostIdsRaw, count: wordCount } = await supabase
    .from("posts")
    .select("id", { count: "exact" })
    .eq("user_id", targetUserId)
    .eq("visibility", "public");

  const postIds = (publicPostIdsRaw ?? []).map((p) => p.id);

  let likeTotal = 0;
  let reactionTotal = 0;
  let categoryCount = 0;

  if (postIds.length > 0) {
    const { count: likeCount } = await supabase
      .from("likes")
      .select("post_id", { count: "exact", head: true })
      .in("post_id", postIds);
    likeTotal = likeCount ?? 0;

    const { count: reactionCount } = await supabase
      .from("reaction_tags")
      .select("id", { count: "exact", head: true })
      .in("post_id", postIds);
    reactionTotal = reactionCount ?? 0;

    const { data: postTags } = await supabase
      .from("post_emotion_tags")
      .select("emotion_tag_id")
      .in("post_id", postIds);
    categoryCount = new Set((postTags ?? []).map((t) => t.emotion_tag_id)).size;
  }

  return {
    wordCount: wordCount ?? 0,
    reactionCount: likeTotal + reactionTotal,
    categoryCount,
  };
}
