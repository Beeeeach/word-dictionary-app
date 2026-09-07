"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PendingReport {
  id: string;
  target_type: "post" | "comment" | "user";
  target_post_id: string | null;
  target_comment_id: string | null;
  reason: string;
  detail: string | null;
  created_at: string;
  reporter: { username: string; display_name: string | null } | null;
  content: string | null;
  content_author: { username: string; display_name: string | null } | null;
}

/**
 * 現在のユーザーが管理者(users.is_admin = true)かどうかを判定する。
 * 管理画面(/admin)へのアクセス制御・管理者向けActionの実行可否チェックに使う。
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();

  return data?.is_admin ?? false;
}

/**
 * 未対応(status='pending')の通報一覧を、対象の内容・投稿者情報つきで取得する。
 * 管理者専用。
 *
 * セキュリティ監査での修正: RLSに reports_select_admin ポリシー
 * (supabase/19_security_audit_fixes.sql) を追加したことで、is_admin=trueの
 * ユーザーは自分の通常セッション(cookieベースのclient)から全件を取得できる。
 * そのため、ここではservice_role(secret key)を使わず、通常のcreateClient()で
 * 完結させる。isCurrentUserAdmin()での事前チェックも維持し、二重に保護する。
 */
export async function getPendingReports(): Promise<PendingReport[]> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return [];

  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, target_type, target_post_id, target_comment_id, reason, detail, created_at, reporter_id"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!reports || reports.length === 0) return [];

  const reporterIds = Array.from(new Set(reports.map((r) => r.reporter_id)));
  const postIds = reports
    .filter((r) => r.target_type === "post" && r.target_post_id)
    .map((r) => r.target_post_id as string);
  const commentIds = reports
    .filter((r) => r.target_type === "comment" && r.target_comment_id)
    .map((r) => r.target_comment_id as string);

  const [{ data: reporters }, { data: posts }, { data: comments }] = await Promise.all([
    supabase.from("users").select("id, username, display_name").in("id", reporterIds),
    postIds.length > 0
      ? supabase.from("posts").select("id, word, meaning, user_id").in("id", postIds)
      : Promise.resolve({ data: [] as { id: string; word: string; meaning: string | null; user_id: string }[] }),
    commentIds.length > 0
      ? supabase.from("comments").select("id, body, user_id").in("id", commentIds)
      : Promise.resolve({ data: [] as { id: string; body: string; user_id: string }[] }),
  ]);

  const authorIds = Array.from(
    new Set([
      ...(posts ?? []).map((p) => p.user_id),
      ...(comments ?? []).map((c) => c.user_id),
    ])
  );
  const { data: authors } =
    authorIds.length > 0
      ? await supabase.from("users").select("id, username, display_name").in("id", authorIds)
      : { data: [] as { id: string; username: string; display_name: string | null }[] };

  const reporterById = new Map((reporters ?? []).map((r) => [r.id, r]));
  const postById = new Map((posts ?? []).map((p) => [p.id, p]));
  const commentById = new Map((comments ?? []).map((c) => [c.id, c]));
  const authorById = new Map((authors ?? []).map((a) => [a.id, a]));

  return reports.map((r) => {
    let content: string | null = null;
    let authorId: string | null = null;

    if (r.target_type === "post" && r.target_post_id) {
      const post = postById.get(r.target_post_id);
      content = post ? `${post.word}${post.meaning ? ` — ${post.meaning}` : ""}` : null;
      authorId = post?.user_id ?? null;
    } else if (r.target_type === "comment" && r.target_comment_id) {
      const comment = commentById.get(r.target_comment_id);
      content = comment?.body ?? null;
      authorId = comment?.user_id ?? null;
    }

    return {
      id: r.id,
      target_type: r.target_type,
      target_post_id: r.target_post_id,
      target_comment_id: r.target_comment_id,
      reason: r.reason,
      detail: r.detail,
      created_at: r.created_at,
      reporter: reporterById.get(r.reporter_id) ?? null,
      content,
      content_author: authorId ? authorById.get(authorId) ?? null : null,
    };
  });
}

/**
 * 通報を却下する(status='dismissed')。対象コンテンツは削除しない。
 * is_hiddenで自動非表示になっていた場合は、この操作で表示を復元する。
 *
 * セキュリティ監査での修正: reports_update_admin / posts_update_admin /
 * comments_update_admin ポリシー(supabase/19_security_audit_fixes.sql)を
 * 追加したことで、管理者は通常セッションのままこれらのUPDATEを実行できる。
 * service_role(secret key)は「削除」のような取り消せない操作にのみ限定し、
 * 復元可能な操作はできる限り通常のRLS経由にすることで、
 * secret keyを使うコードパスを最小限に保つ。
 */
export async function dismissReport(
  reportId: string,
  targetType: "post" | "comment",
  targetId: string
): Promise<{ error?: string }> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { error: "権限がありません" };

  const supabase = await createClient();

  const { error: reportError } = await supabase
    .from("reports")
    .update({ status: "dismissed" })
    .eq("id", reportId);

  if (reportError) {
    return { error: "通報の却下に失敗しました" };
  }

  if (targetType === "post") {
    await supabase.from("posts").update({ is_hidden: false }).eq("id", targetId);
  } else {
    await supabase.from("comments").update({ is_hidden: false }).eq("id", targetId);
  }

  revalidatePath("/admin");
  return {};
}

/**
 * 通報された投稿またはコメントを削除する。
 * 削除に伴い、その対象への他の通報レコードもまとめて reviewed 済みにする
 * （対象が存在しなくなるため、それらを未対応のまま残さないようにする）。
 *
 * 削除は取り消しがきかない操作のため、意図的にservice_role(secret key)経由の
 * まま維持する。一般の管理者向けRLSポリシーには delete を許可しているが
 * (posts_delete_admin等)、二重チェックとしてisCurrentUserAdmin()の
 * サーバー側検証を必ず経由させ、万一のポリシー設定ミスの影響を抑える。
 */
export async function deleteReportedContent(
  reportId: string,
  targetType: "post" | "comment",
  targetId: string
): Promise<{ error?: string }> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { error: "権限がありません" };

  const admin = createAdminClient();

  if (targetType === "post") {
    await admin.from("posts").delete().eq("id", targetId);
    await admin
      .from("reports")
      .update({ status: "reviewed" })
      .eq("target_type", "post")
      .eq("target_post_id", targetId);
  } else {
    await admin.from("comments").delete().eq("id", targetId);
    await admin
      .from("reports")
      .update({ status: "reviewed" })
      .eq("target_type", "comment")
      .eq("target_comment_id", targetId);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}
