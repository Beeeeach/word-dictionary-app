import { createClient } from "@/lib/supabase/server";

export interface CommentWithAuthor {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  users: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/** 特定の投稿へのコメント一覧を古い順で取得する */
export async function getCommentsForPost(
  postId: string
): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id, post_id, user_id, body, created_at,
      users:user_id ( id, username, display_name, avatar_url )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as unknown as CommentWithAuthor[];
}
