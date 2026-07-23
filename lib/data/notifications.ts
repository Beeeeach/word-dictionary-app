import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/notifications/create";

export interface NotificationWithActor {
  id: string;
  type: NotificationType;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  post_word: string | null;
}

/**
 * 自分宛の通知一覧を新しい順で取得する（直近5日分のみDBに存在する前提）。
 */
export async function getNotifications(
  userId: string
): Promise<NotificationWithActor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      id, type, post_id, is_read, created_at,
      actor:actor_id ( id, username, display_name, avatar_url ),
      posts:post_id ( word )
      `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return (
    data as unknown as {
      id: string;
      type: NotificationType;
      post_id: string | null;
      is_read: boolean;
      created_at: string;
      actor: NotificationWithActor["actor"];
      posts: { word: string } | null;
    }[]
  ).map((row) => ({
    id: row.id,
    type: row.type,
    post_id: row.post_id,
    is_read: row.is_read,
    created_at: row.created_at,
    actor: row.actor,
    post_word: row.posts?.word ?? null,
  }));
}

/** 未読通知の件数を取得する（通知ベルのバッジ表示用） */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return count ?? 0;
}
