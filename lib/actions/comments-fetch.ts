"use server";

import { getCommentsForPost, type CommentWithAuthor } from "@/lib/data/comments";

/** クライアントコンポーネントからコメント一覧を取得するためのラッパー */
export async function getComments(postId: string): Promise<CommentWithAuthor[]> {
  return getCommentsForPost(postId);
}
