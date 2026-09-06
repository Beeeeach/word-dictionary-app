"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/current-user";
import { getFeedPosts, type FeedSort } from "@/lib/data/posts";
import type { PostWithRelations } from "@/lib/types/database.types";

// 無限スクロール用。
// クライアントコンポーネントから追加ページを取得するための Server Action。
export async function fetchMoreFeedPosts(
  sort: FeedSort,
  page: number
): Promise<{ posts: PostWithRelations[]; hasMore: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 英語学習者モードがオンなら、以降のページも英語投稿のみを返す
  const profile = await getCurrentUserProfile();
  const learnerMode = profile?.learner_mode ?? false;

  return getFeedPosts(user?.id ?? null, { sort, page }, learnerMode);
}
