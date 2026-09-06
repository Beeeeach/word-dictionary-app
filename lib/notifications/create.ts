import { createClient } from "@/lib/supabase/server";

export type NotificationType = "like" | "reaction" | "comment" | "follow";

/**
 * 通知レコードをDBに保存する。
 * 自分自身の行動（自分の投稿への自分のいいね等）は呼び出し側で
 * 除外してから呼ぶこと。失敗してもメイン機能を止めないよう、
 * エラーは投げずに握りつぶす。
 */
export async function createNotification({
  userId,
  actorId,
  type,
  postId,
}: {
  userId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
}): Promise<void> {
  if (userId === actorId) return;

  try {
    const supabase = await createClient();
    await supabase.from("notifications").insert({
      user_id: userId,
      actor_id: actorId,
      type,
      post_id: postId ?? null,
    });
  } catch {
    // 通知記録の失敗はアプリの主機能を妨げない
  }
}
