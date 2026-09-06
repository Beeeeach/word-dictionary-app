import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * 投稿(単語投稿・投票投稿どちらも)が作成された直後に呼び出し、
 * 投稿者のストリーク(連続投稿日数)を更新する。
 * 失敗してもメイン機能(投稿自体)を止めないよう、エラーは握りつぶす。
 */
export async function bumpStreak(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  try {
    await supabase.rpc("update_user_streak", { target_user_id: userId });
  } catch {
    // ストリーク更新の失敗は投稿自体を妨げない
  }
}
