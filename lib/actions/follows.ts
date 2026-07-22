"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/notifications/send";

export type ToggleFollowResult = { following: boolean; error?: string };

/**
 * フォロー/フォロー解除を切り替える。
 * followsテーブルは(follower_id, followee_id)の複合主キーなので、
 * 既に存在すれば削除、なければ追加するトグル動作にする。
 */
export async function toggleFollow(followeeId: string): Promise<ToggleFollowResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { following: false, error: "ログインが必要です" };
  }

  if (user.id === followeeId) {
    return { following: false, error: "自分自身はフォローできません" };
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followee_id", followeeId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", followeeId);

    if (error) return { following: true, error: "フォロー解除に失敗しました" };

    revalidatePath("/");
    return { following: false };
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, followee_id: followeeId });

    if (error) return { following: false, error: "フォローに失敗しました" };

    const { data: follower } = await supabase
      .from("users")
      .select("display_name, username")
      .eq("id", user.id)
      .single<{ display_name: string | null; username: string }>();
    const followerName = follower?.display_name || follower?.username || "誰か";

    await sendPushNotification({
      toUserId: followeeId,
      title: "新しいフォロワー",
      message: `${followerName}さんにフォローされました`,
      url: "/",
    });

    revalidatePath("/");
    return { following: true };
  }
}
