import { createClient } from "@/lib/supabase/server";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";
import { getEmotionTags } from "@/lib/data/emotion-tags";

export type FeedSort = "recommended" | "recent";

const PAGE_SIZE = 10;

const POST_SELECT = `
  id, user_id, word, meaning, context, photo_url, visibility,
  like_count, comment_count, created_at, updated_at,
  users:user_id ( id, username, display_name, avatar_url ),
  post_emotion_tags ( emotion_tags ( id, name, emoji, sort_order ) )
`;

/**
 * フィード用の投稿一覧をページ単位で取得する。
 * RLSにより、公開投稿 + 自分の非公開投稿のみが返る。
 *
 * sort:
 *  - "recent": 新着順（投稿日時の降順）。企画書7-4章の「フォロー中」タブに相当するが、
 *    フォロー機能自体は9章の「今後の検討事項」のためMVPでは新着順で代替する。
 *  - "recommended": いいね数優先、同数は新着順の簡易ロジック。
 *    本格的なアルゴリズムは9章の検討事項のため、まずは反応が多い投稿が
 *    埋もれない程度のシンプルな重み付けにとどめる。
 */
export async function getFeedPosts(
  currentUserId: string | null,
  { sort, page }: { sort: FeedSort; page: number }
): Promise<{ posts: PostWithRelations[]; hasMore: boolean }> {
  const supabase = await createClient();
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase.from("posts").select(POST_SELECT);

  if (sort === "recommended") {
    query = query
      .order("like_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.range(from, to);

  if (error || !data) {
    return { posts: [], hasMore: false };
  }

  const postIds = data.map((p) => (p as { id: string }).id);

  // --- 自分のいいね状態 ---
  let likedPostIds = new Set<string>();
  if (currentUserId && postIds.length > 0) {
    const { data: likes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", postIds);
    likedPostIds = new Set((likes ?? []).map((l) => l.post_id));
  }

  // --- 反応タグ（閲覧者による反応）の内訳と、自分の反応状態 ---
  const reactionSummaryByPost = new Map<
    string,
    Map<number, number>
  >();
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

  const posts = (data as unknown as PostWithRelations[]).map((post) => {
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

  return { posts, hasMore: data.length === PAGE_SIZE };
}

export { PAGE_SIZE };
