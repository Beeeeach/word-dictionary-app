"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/current-user";
import { searchAllPosts, getMyPosts } from "@/lib/data/dictionary";
import type { PostWithRelations } from "@/lib/types/database.types";

/** 「みんなの辞書」タブでのキーワード検索 */
export async function searchDictionary(
  keyword: string
): Promise<PostWithRelations[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getCurrentUserProfile();
  return searchAllPosts(keyword, user?.id ?? null, profile?.learner_mode ?? false);
}

/** 「自分の辞書」タブでのキーワード検索 */
export async function searchMyDictionary(
  keyword: string
): Promise<PostWithRelations[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const profile = await getCurrentUserProfile();
  return getMyPosts(user.id, keyword, profile?.learner_mode ?? false);
}
