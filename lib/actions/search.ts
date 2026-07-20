"use server";

import { createClient } from "@/lib/supabase/server";
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

  return searchAllPosts(keyword, user?.id ?? null);
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
  return getMyPosts(user.id, keyword);
}
