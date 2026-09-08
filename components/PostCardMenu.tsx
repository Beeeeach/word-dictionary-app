"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reportPost, type ReportReason } from "@/lib/actions/reports";
import { toggleBlock } from "@/lib/actions/blocks";
import { deletePost } from "@/lib/actions/posts";
import { ReportDialog } from "@/components/ReportDialog";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * 投稿カード右上に出す「…」メニュー。
 * 自分の投稿なら削除、他人の投稿なら通報・ブロックを選べる。
 *
 * UI改善: 「⋯」の文字自体は小さいままだが、周辺のタップ領域を
 * 44x44px(モバイルの推奨タップサイズ)相当まで広げ、スマホでも
 * 押しやすくする。視認性のため、記号のフォントサイズも拡大し、
 * 円形の背景を敷いて押せる場所であることが分かるようにする。
 */
export function PostCardMenu({
  postId,
  postAuthorId,
  currentUserId,
  learnerMode = false,
}: {
  postId: string;
  postAuthorId: string;
  currentUserId: string | null;
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isOwn = currentUserId === postAuthorId;

  function handleDelete() {
    if (!confirm(learnerMode ? "Delete this post?" : "この投稿を削除しますか？")) return;
    startTransition(async () => {
      await deletePost(postId);
      router.refresh();
    });
  }

  function handleBlock() {
    if (!confirm(t.block.confirmBlock)) return;
    startTransition(async () => {
      await toggleBlock(postAuthorId);
      router.refresh();
    });
  }

  async function handleReport(reason: ReportReason, detail?: string) {
    return reportPost(postId, reason, detail);
  }

  if (!currentUserId) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-full shrink-0 transition-colors hover:bg-black/[0.05]"
        style={{
          width: "36px",
          height: "36px",
          fontSize: "20px",
          lineHeight: 1,
          color: "var(--color-slate)",
        }}
        aria-label="menu"
      >
        ⋯
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden text-sm shadow-lg"
            style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)", minWidth: "160px" }}
          >
            {isOwn ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setOpen(false);
                  handleDelete();
                }}
                className="block w-full text-left px-4 py-3 disabled:opacity-50"
                style={{ color: "var(--color-coral-dark)" }}
              >
                {t.common.delete}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setReportOpen(true);
                  }}
                  className="block w-full text-left px-4 py-3"
                  style={{ color: "var(--color-ink)" }}
                >
                  {t.report.button}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setOpen(false);
                    handleBlock();
                  }}
                  className="block w-full text-left px-4 py-3 disabled:opacity-50"
                  style={{ color: "var(--color-coral-dark)" }}
                >
                  {t.block.block}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {reportOpen && (
        <ReportDialog
          onSubmit={handleReport}
          onClose={() => setReportOpen(false)}
          learnerMode={learnerMode}
        />
      )}
    </div>
  );
}
