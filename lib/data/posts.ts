import { createClient } from "@/lib/supabase/server";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";
import { getEmotionTags } from "@/lib/data/emotion-tags";
import { getFollowingIds } from "@/lib/data/follows";
import { attachPollData } from "@/lib/data/polls";

export type FeedSort = "recommended" | "following";

const PAGE_SIZE = 10;

const POST_SELECT = `
  id, user_id, word, meaning, context, photo_url, note, visibility, post_type,
  like_count, comment_count, created_at, updated_at,
  users:user_id ( id, username, display_name, avatar_url ),
  post_emotion_tags ( emotion_tags ( id, name, emoji, sort_order ) )
`;

/**
 * 取得済みの投稿データ(生のJOIN結果)に、いいね状態・反応タグの内訳・
 * (投票投稿の場合は)投票情報を付与する共通処理。
 *
 * パフォーマンス上の注意: likes・reaction_tags・emotion_tagsの取得と
 * attachPollDataは互いに依存しないため、Promise.allで並列実行する。
 * 直列で書くと1回のフィード表示でDBラウンドトリップが積み重なり、
 * 画面遷移の体感速度に直結するため。
 */
async function attachReactionData(
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
 * フィード用の投稿一覧をページ単位で取得する。
 * RLSにより、公開投稿 + 自分の非公開投稿のみが返る。
 *
 * sort:
 *  - "recommended": いいね数優先、同数は新着順の簡易ロジック。
 *    本格的なパーソナライズアルゴリズムは将来の拡張事項。
 *  - "following": 自分がフォローしているユーザーの投稿のみを新着順で表示。
 *    フォローしている人がいない場合は空になる(その旨はUI側でメッセージ表示)。
 */
export async function getFeedPosts(
  currentUserId: string | null,
  { sort, page }: { sort: FeedSort; page: number }
): Promise<{ posts: PostWithRelations[]; hasMore: boolean }> {
  const supabase = await createClient();
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  if (sort === "following") {
    if (!currentUserId) {
      return { posts: [], hasMore: false };
    }
    const followingIds = await getFollowingIds(currentUserId);
    if (followingIds.length === 0) {
      return { posts: [], hasMore: false };
    }

    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error || !data) {
      return { posts: [], hasMore: false };
    }

    const posts = await attachReactionData(data, currentUserId);
    return { posts, hasMore: data.length === PAGE_SIZE };
  }

  // "recommended": 事前計算済みスコア(post_scores)とユーザーの好み(affinity)を
  // 掛け合わせた最終スコア順に投稿を取得する。DB側の関数(get_personalized_feed)で
  // 完結させることで、投稿数が増えてもアプリ側の負荷を増やさない設計にしている。
  if (currentUserId) {
    const { data: rankedIds, error: rpcError } = await supabase.rpc(
      "get_personalized_feed",
      {
        viewer_id: currentUserId,
        page_size: PAGE_SIZE,
        page_offset: from,
      }
    );

    if (!rpcError && rankedIds) {
      const ids = (rankedIds as { post_id: string }[]).map((r) => r.post_id);
      if (ids.length === 0) {
        return { posts: [], hasMore: false };
      }

      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .in("id", ids);

      if (!error && data) {
        // RPCが返した順序(スコア順)を保ったまま並べ替える
        // (in句のクエリ結果は順序が保証されないため)
        const postById = new Map(
          (data as unknown as { id: string }[]).map((p) => [p.id, p])
        );
        const orderedRaw = ids
          .map((id) => postById.get(id))
          .filter((p): p is NonNullable<typeof p> => p !== undefined);

        const posts = await attachReactionData(orderedRaw, currentUserId);
        return { posts, hasMore: ids.length === PAGE_SIZE };
      }
    }
    // RPC失敗時は下のフォールバック(人気順)に進む
  }

  // フォールバック: 未ログイン、またはRPC失敗時は素直な人気順で表示
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    return { posts: [], hasMore: false };
  }

  const posts = await attachReactionData(data, currentUserId);
  return { posts, hasMore: data.length === PAGE_SIZE };
}

export { PAGE_SIZE };
