"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportReason = "spam" | "harassment" | "inappropriate" | "hate_speech" | "other";
export type ReportResult = { error?: string; success?: boolean } | undefined;

/**
 * 投稿を通報する。
 * reports.target_type='post' として保存する。DB側のトリガー
 * (auto_hide_on_report_threshold, supabase/18_report_auto_hide_and_admin.sql)が
 * 3件以上の通報を検知すると自動で posts.is_hidden = true にする。
 */
export async function reportPost(
  postId: string,
  reason: ReportReason,
  detail?: string
): Promise<ReportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: "post",
    target_post_id: postId,
    reason,
    detail: detail?.trim() || null,
  });

  if (error) {
    return { error: "通報の送信に失敗しました" };
  }

  return { success: true };
}

/**
 * コメントを通報する。
 * reports.target_type='comment' として保存する。DB側のトリガーが
 * 3件以上の通報を検知すると自動で comments.is_hidden = true にする。
 */
export async function reportComment(
  commentId: string,
  reason: ReportReason,
  detail?: string
): Promise<ReportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: "comment",
    target_comment_id: commentId,
    reason,
    detail: detail?.trim() || null,
  });

  if (error) {
    return { error: "通報の送信に失敗しました" };
  }

  return { success: true };
}
