import { createClient } from "@/lib/supabase/server";
import type { PostWithRelations, PollOptionWithVotes } from "@/lib/types/database.types";

/**
 * 投稿一覧(PostWithRelations[])のうち post_type = 'poll' のものに、
 * 選択肢・得票数・自分の投票状況・締切時刻を付与する。
 * 通常の単語投稿(post_type = 'word')には何もしない。
 */
export async function attachPollData(
  posts: PostWithRelations[],
  currentUserId: string | null
): Promise<PostWithRelations[]> {
  const pollPostIds = posts
    .filter((p) => p.post_type === "poll")
    .map((p) => p.id);

  if (pollPostIds.length === 0) return posts;

  const supabase = await createClient();

  const [{ data: settingsRows }, { data: optionRows }, { data: voteRows }] =
    await Promise.all([
      supabase
        .from("poll_settings")
        .select("post_id, closes_at")
        .in("post_id", pollPostIds),
      supabase
        .from("poll_options")
        .select("id, post_id, label, sort_order")
        .in("post_id", pollPostIds)
        .order("sort_order", { ascending: true }),
      supabase
        .from("poll_votes")
        .select("post_id, user_id, option_id")
        .in("post_id", pollPostIds),
    ]);

  const closesAtByPost = new Map(
    (settingsRows ?? []).map((r) => [r.post_id, r.closes_at])
  );

  const optionsByPost = new Map<string, PollOptionWithVotes[]>();
  for (const row of optionRows ?? []) {
    if (!optionsByPost.has(row.post_id)) {
      optionsByPost.set(row.post_id, []);
    }
    optionsByPost.get(row.post_id)!.push({
      id: row.id,
      label: row.label,
      sort_order: row.sort_order,
      vote_count: 0,
    });
  }

  const myVoteByPost = new Map<string, string>();
  for (const row of voteRows ?? []) {
    const options = optionsByPost.get(row.post_id);
    const option = options?.find((o) => o.id === row.option_id);
    if (option) option.vote_count += 1;

    if (currentUserId && row.user_id === currentUserId) {
      myVoteByPost.set(row.post_id, row.option_id);
    }
  }

  return posts.map((post) => {
    if (post.post_type !== "poll") return post;

    const options = optionsByPost.get(post.id) ?? [];
    const totalVotes = options.reduce((sum, o) => sum + o.vote_count, 0);

    return {
      ...post,
      poll: {
        closesAt: closesAtByPost.get(post.id) ?? new Date().toISOString(),
        options,
        myVoteOptionId: myVoteByPost.get(post.id) ?? null,
        totalVotes,
      },
    };
  });
}
