"use client";

import { useState, useTransition } from "react";
import type { ReportReason } from "@/lib/actions/reports";
import { getDictionary } from "@/lib/i18n/dictionary";

const REASON_KEYS: ReportReason[] = [
  "spam",
  "harassment",
  "inappropriate",
  "hate_speech",
  "other",
];

/**
 * 通報理由を選ぶ小さなオーバーレイ。投稿カード・コメントの両方から使う汎用コンポーネント。
 * 実際の送信処理(reportPost/reportComment)は呼び出し側から渡してもらう。
 */
export function ReportDialog({
  onSubmit,
  onClose,
  learnerMode = false,
}: {
  onSubmit: (reason: ReportReason, detail?: string) => Promise<{ error?: string; success?: boolean } | undefined>;
  onClose: () => void;
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(reason, detail);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5"
        style={{ background: "var(--color-paper)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-4">
            <p className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
              {t.report.thanks}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full px-5 py-2 text-sm font-bold border-2"
              style={{ borderColor: "var(--color-line)", color: "var(--color-slate)" }}
            >
              {t.common.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
              {t.report.title}
            </h2>
            <div className="space-y-1.5">
              {REASON_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--color-ink)" }}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={key}
                    checked={reason === key}
                    onChange={() => setReason(key)}
                  />
                  {t.report.reasons[key]}
                </label>
              ))}
            </div>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder={t.report.detailPlaceholder}
              className="w-full rounded-xl border-2 px-3 py-2 text-sm outline-none resize-none"
              style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
            />
            {error && (
              <p className="text-xs font-medium" style={{ color: "var(--color-coral-dark)" }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-full py-2.5 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "var(--color-coral)" }}
              >
                {isPending ? t.common.processing : t.report.submit}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-2.5 text-sm font-bold border-2"
                style={{ borderColor: "var(--color-line)", color: "var(--color-slate)" }}
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
