"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ToggleBlockResult = { error?: string; blocked?: boolean };

/**
 * 対象ユーザーをブロック/ブロック解除する（トグル）。
 * ブロックすると、ブロックした側(自分)のフィード・検索結果から
 * 相手の投稿が非表示になる（lib/data/posts.ts, lib/data/dictionary.ts側で除外）。
 * 相互ブロックではなく片方向。
 */
export async function toggleBlock(targetUserId: string): Promise<ToggleBlockResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }
  if (user.id === targetUserId) {
    return { error: "自分をブロックすることはできません" };
  }

  const { data: existing } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", targetUserId);

    if (error) return { error: "ブロック解除に失敗しました" };
    revalidatePath("/");
    return { blocked: false };
  }

  const { error } = await supabase.from("blocks").insert({
    blocker_id: user.id,
    blocked_id: targetUserId,
  });

  if (error) return { error: "ブロックに失敗しました" };
  revalidatePath("/");
  return { blocked: true };
}

/** 自分が対象ユーザーをブロック済みかどうか判定する */
export async function isBlocking(
  viewerId: string,
  targetUserId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", viewerId)
    .eq("blocked_id", targetUserId)
    .maybeSingle();

  return !!data;
}

/** 自分がブロックしているユーザーIDの一覧を取得する（フィード等の除外用） */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);

  return (data ?? []).map((b) => b.blocked_id);
}
