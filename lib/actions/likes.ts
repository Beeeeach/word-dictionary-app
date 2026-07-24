"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/notifications/send";
import { createNotification } from "@/lib/notifications/create";

export type ToggleLikeResult = { liked: boolean; error?: string };

/**
 * いいねのON/OFFを切り替える。
 * likesテーブルは (post_id, user_id) の複合主キーなので、
 * 既に存在すれば削除、なければ追加するトグル動作にする。
 * like_countはStep2で作成したDBトリガーが自動更新するため、ここでは触らない。
 */
export async function toggleLike(postId: string): Promise<ToggleLikeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { liked: false, error: "ログインが必要です" };
  }

  const { data: existing } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (error) return { liked: true, error: "いいねの取り消しに失敗しました" };

    revalidatePath("/");
    return { liked: false };
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ post_id: postId, user_id: user.id });

    if (error) return { liked: false, error: "いいねに失敗しました" };

    // 投稿情報と、いいねした本人の表示名を並列取得する
    // (互いに依存しないクエリのため)
    const [{ data: post }, { data: liker }] = await Promise.all([
      supabase
        .from("posts")
        .select("user_id, word")
        .eq("id", postId)
        .single<{ user_id: string; word: string }>(),
      supabase
        .from("users")
        .select("display_name, username")
        .eq("id", user.id)
        .single<{ display_name: string | null; username: string }>(),
    ]);

    if (post && post.user_id !== user.id) {
      const likerName = liker?.display_name || liker?.username || "誰か";

      await createNotification({
        userId: post.user_id,
        actorId: user.id,
        type: "like",
        postId,
      });

      // 外部API(OneSignal)への通知送信はレスポンスを待たずに実行する。
      // awaitしてしまうと、外部APIの応答が遅い場合にいいね操作自体の
      // 体感速度が悪化するため(ユーザーには即座に結果を返したい)。
      sendPushNotification({
        toUserId: post.user_id,
        title: "いいねが届きました",
        message: `${likerName}さんが「${post.word}」にいいねしました`,
        url: "/",
      });
    }

    revalidatePath("/");
    return { liked: true };
  }
}
