"use client";

import { useState, useTransition } from "react";
import { dismissReport, deleteReportedContent, type PendingReport } from "@/lib/actions/admin";
import { getDictionary } from "@/lib/i18n/dictionary";

export function AdminReportList({
  reports,
  learnerMode = false,
}: {
  reports: PendingReport[];
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);
  const [localReports, setLocalReports] = useState(reports);
  const [isPending, startTransition] = useTransition();

  function handleDismiss(report: PendingReport) {
    if (report.target_type === "user" || !report.target_post_id && !report.target_comment_id) return;
    const targetId = report.target_type === "post" ? report.target_post_id! : report.target_comment_id!;

    startTransition(async () => {
      await dismissReport(report.id, report.target_type as "post" | "comment", targetId);
      setLocalReports((prev) => prev.filter((r) => r.id !== report.id));
    });
  }

  function handleDelete(report: PendingReport) {
    if (report.target_type === "user" || !report.target_post_id && !report.target_comment_id) return;
    const targetId = report.target_type === "post" ? report.target_post_id! : report.target_comment_id!;

    if (!confirm(learnerMode ? "Delete this content?" : "この内容を削除しますか？")) return;

    startTransition(async () => {
      await deleteReportedContent(report.id, report.target_type as "post" | "comment", targetId);
      setLocalReports((prev) => prev.filter((r) => r.id !== report.id));
    });
  }

  if (localReports.length === 0) {
    return (
      <p className="text-center text-sm py-16" style={{ color: "var(--color-slate)" }}>
        {t.admin.noReports}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {localReports.map((report) => {
        const reporterName =
          report.reporter?.display_name || report.reporter?.username || t.admin.deletedUser;
        const authorName =
          report.content_author?.display_name ||
          report.content_author?.username ||
          t.admin.deletedUser;

        return (
          <div
            key={report.id}
            className="rounded-2xl p-4 text-sm space-y-2"
            style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold rounded-full px-2 py-0.5"
                style={{ background: "#FFF0EC", color: "var(--color-coral-dark)" }}
              >
                {report.target_type === "post" ? t.admin.typePost : t.admin.typeComment}
              </span>
              <span className="text-xs" style={{ color: "var(--color-slate-light)" }}>
                {new Date(report.created_at).toLocaleString(learnerMode ? "en-US" : "ja-JP")}
              </span>
            </div>

            <p style={{ color: "var(--color-ink)" }}>
              <span className="font-bold">{t.admin.content}: </span>
              {report.content ?? "-"}
            </p>
            <p className="text-xs" style={{ color: "var(--color-slate)" }}>
              {authorName}
            </p>

            <div className="text-xs space-y-0.5" style={{ color: "var(--color-slate)" }}>
              <p>
                <span className="font-bold">{t.admin.reason}: </span>
                {t.report.reasons[report.reason as keyof typeof t.report.reasons] ?? report.reason}
              </p>
              {report.detail && (
                <p>
                  <span className="font-bold">{t.admin.detail}: </span>
                  {report.detail}
                </p>
              )}
              <p>
                <span className="font-bold">{t.admin.reportedBy}: </span>
                {reporterName}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(report)}
                className="rounded-full px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                style={{ background: "var(--color-coral)" }}
              >
                {t.admin.deleteContent}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDismiss(report)}
                className="rounded-full px-4 py-1.5 text-xs font-bold border-2 disabled:opacity-50"
                style={{ borderColor: "var(--color-line)", color: "var(--color-slate)" }}
              >
                {t.admin.dismiss}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
