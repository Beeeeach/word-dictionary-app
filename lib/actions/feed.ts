"use server";

import { createClient } from "@/lib/supabase/server";
import { getFeedPosts, type FeedSort } from "@/lib/data/posts";
import type { PostWithRelations } from "@/lib/types/database.types";

/** 無限スクロール用: クライアントコンポーネントから追加ページを取得するためのAction */
export async function fetchMoreFeedPosts(
  sort: FeedSort,
  page: number
): Promise<{ posts: PostWithRelations[]; hasMore: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return getFeedPosts(user?.id ?? null, { sort, page });
}
