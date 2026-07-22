import { createClient } from "@/lib/supabase/server";

/** 自分(viewerId)が対象ユーザー(targetUserId)をフォロー中かどうか */
export async function isFollowing(
  viewerId: string | null,
  targetUserId: string
): Promise<boolean> {
  if (!viewerId || viewerId === targetUserId) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", viewerId)
    .eq("followee_id", targetUserId)
    .maybeSingle();

  return !!data;
}

/** 対象ユーザーのフォロワー数・フォロー中の数を取得 */
export async function getFollowCounts(
  userId: string
): Promise<{ followerCount: number; followingCount: number }> {
  const supabase = await createClient();

  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("followee_id", userId),
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);

  return {
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
  };
}

/** 自分がフォローしているユーザーのID一覧 */
export async function getFollowingIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", userId);

  return (data ?? []).map((f) => f.followee_id);
}
