"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/notifications/send";
import { createNotification } from "@/lib/notifications/create";

export type AddCommentResult = { error?: string } | undefined;

/** コメント（リプライ）を投稿する。comment_countはDBトリガーが自動更新する。 */
export async function addComment(
  postId: string,
  _prevState: AddCommentResult,
  formData: FormData
): Promise<AddCommentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { error: "コメントを入力してください" };
  }
  if (body.length > 500) {
    return { error: "コメントは500文字以内で入力してください" };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    body,
  });

  if (error) {
    return { error: "コメントの投稿に失敗しました" };
  }

  // 投稿情報と、コメントした本人の表示名を並列取得する
  const [{ data: post }, { data: commenter }] = await Promise.all([
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
    const commenterName =
      commenter?.display_name || commenter?.username || "誰か";

    await createNotification({
      userId: post.user_id,
      actorId: user.id,
      type: "comment",
      postId,
    });

    // 外部API(OneSignal)への通知送信はレスポンスを待たずに実行する
    sendPushNotification({
      toUserId: post.user_id,
      title: "コメントが届きました",
      message: `${commenterName}さんが「${post.word}」にコメントしました`,
      url: "/",
    });
  }

  revalidatePath("/");
}

/** 自分のコメントを削除する（RLSにより本人のもの以外は削除できない） */
export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath("/");
}
