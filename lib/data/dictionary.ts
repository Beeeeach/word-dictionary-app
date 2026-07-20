import { createClient } from "@/lib/supabase/server";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";
import { getEmotionTags } from "@/lib/data/emotion-tags";

const POST_SELECT = `
  id, user_id, word, meaning, context, photo_url, visibility,
  like_count, comment_count, created_at, updated_at,
  users:user_id ( id, username, display_name, avatar_url ),
  post_emotion_tags ( emotion_tags ( id, name, emoji, sort_order ) )
`;

/**
 * 投稿データに反応タグの内訳・自分のいいね/反応状態を付与する共通処理。
 * lib/data/posts.ts の getFeedPosts と同じロジックを、検索・自分の辞書ページでも使う。
 */
async function enrichPosts(
  rawPosts: unknown[],
  currentUserId: string | null
): Promise<PostWithRelations[]> {
  const supabase = await createClient();
  const postIds = rawPosts.map((p) => (p as { id: string }).id);

  let likedPostIds = new Set<string>();
  if (currentUserId && postIds.length > 0) {
    const { data: likes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", postIds);
    likedPostIds = new Set((likes ?? []).map((l) => l.post_id));
  }

  const reactionSummaryByPost = new Map<string, Map<number, number>>();
  const myReactionsByPost = new Map<string, Set<number>>();

  if (postIds.length > 0) {
    const { data: reactions } = await supabase
      .from("reaction_tags")
      .select("post_id, user_id, emotion_tag_id")
      .in("post_id", postIds);

    for (const r of reactions ?? []) {
      const row = r as { post_id: string; user_id: string; emotion_tag_id: number };
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
  }

  const emotionTags = await getEmotionTags();
  const emotionTagById = new Map<number, EmotionTag>(
    emotionTags.map((t) => [t.id, t])
  );

  return (rawPosts as PostWithRelations[]).map((post) => {
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
}

/**
 * 「みんなの辞書」検索。
 * 企画書7-3章: 同じ単語が複数ユーザーから投稿されていても名寄せせず、
 * 投稿ごとに個別のカードとして表示する。
 */
export async function searchAllPosts(
  keyword: string,
  currentUserId: string | null
): Promise<PostWithRelations[]> {
  if (!keyword.trim()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .ilike("word", `%${keyword.trim()}%`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return enrichPosts(data, currentUserId);
}

/** 自分の投稿一覧（自分の辞書ページ用）。キーワードがあれば絞り込む。 */
export async function getMyPosts(
  userId: string,
  keyword?: string
): Promise<PostWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (keyword?.trim()) {
    query = query.ilike("word", `%${keyword.trim()}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return enrichPosts(data, userId);
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
