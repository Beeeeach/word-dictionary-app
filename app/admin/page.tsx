import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import { isCurrentUserAdmin, getPendingReports } from "@/lib/actions/admin";
import { getDictionary } from "@/lib/i18n/dictionary";
import { AdminReportList } from "./AdminReportList";

/**
 * 管理画面。通報(reports)がstatus='pending'のものを一覧表示し、
 * 管理者が「削除する」か「却下する」かを選べる。
 * アクセス制御: users.is_admin = true のユーザーのみ閲覧可能。
 * is_adminはコードから変更する手段を用意せず、Supabase側で直接
 * 特定ユーザーのIDに対して手動でtrueに設定する運用とする。
 */
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [isAdmin, profile] = await Promise.all([
    isCurrentUserAdmin(),
    getCurrentUserProfile(),
  ]);

  const learnerMode = profile?.learner_mode ?? false;
  const t = getDictionary(learnerMode);

  if (!isAdmin) {
    return (
      <main
        className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center"
        style={{ background: "var(--color-paper)" }}
      >
        <p className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
          {t.admin.noAccess}
        </p>
        <Link
          href="/"
          className="mt-4 text-sm font-bold underline underline-offset-2"
          style={{ color: "var(--color-indigo)" }}
        >
          {t.common.back}
        </Link>
      </main>
    );
  }

  const reports = await getPendingReports();

  return (
    <main
      className="flex-1 max-w-2xl mx-auto w-full px-4 py-6"
      style={{ background: "var(--color-paper)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-sm font-bold" style={{ color: "var(--color-slate)" }}>
          {t.common.back}
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          {t.admin.title}
        </h1>
        <div className="w-10" />
      </div>

      <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-slate)" }}>
        {t.admin.pendingReports} ({reports.length})
      </h2>

      <AdminReportList reports={reports} learnerMode={learnerMode} />
    </main>
  );
}
