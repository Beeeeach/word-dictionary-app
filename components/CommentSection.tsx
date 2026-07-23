"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { addComment, deleteComment, type AddCommentResult } from "@/lib/actions/comments";
import { getComments } from "@/lib/actions/comments-fetch";
import type { CommentWithAuthor } from "@/lib/data/comments";

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  return `${Math.floor(diffHour / 24)}日前`;
}

export function CommentSection({
  postId,
  commentCount,
  currentUserId,
}: {
  postId: string;
  commentCount: number;
  currentUserId: string | null;
}) {
  // コメント欄が「あること」自体を分かりやすくするため、
  // 入力フォームは常に表示し、既存コメントの一覧だけを開閉式にする。
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  const addCommentWithPostId = addComment.bind(null, postId);
  const [state, formAction, pending] = useActionState<
    AddCommentResult,
    FormData
  >(addCommentWithPostId, undefined);

  // 一覧を開いた時、投稿成功時にコメント一覧を取得し直す
  useEffect(() => {
    if (!showComments) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await getComments(postId);
      if (!cancelled) {
        setComments(result);
        setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [showComments, postId, state]);

  function handleDelete(commentId: string) {
    setComments(
      (prev) => prev?.filter((c) => c.id !== commentId) ?? prev
    );
    startDeleteTransition(async () => {
      await deleteComment(commentId);
    });
  }

  return (
    <div>
      {commentCount > 0 ? (
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1 text-sm font-bold transition-colors mb-2"
          style={{ color: "var(--color-slate)" }}
        >
          💬 {showComments ? "コメントを隠す" : `コメント${commentCount}件を見る`}
        </button>
      ) : (
        <p
          className="flex items-center gap-1 text-sm font-bold mb-2"
          style={{ color: "var(--color-slate-light)" }}
        >
          💬 まだコメントがありません
        </p>
      )}

      {showComments && (
        <div className="space-y-3 mb-3">
          {loading && (
            <p className="text-xs" style={{ color: "var(--color-slate-light)" }}>
              読み込み中...
            </p>
          )}

          {!loading &&
            comments?.map((comment) => {
              const name =
                comment.users?.display_name || comment.users?.username || "名無し";
              const isMine = comment.user_id === currentUserId;
              return (
                <div key={comment.id} className="flex gap-2 text-sm">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-bold text-xs"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {name}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--color-slate-light)" }}>
                        {timeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap" style={{ color: "var(--color-ink)" }}>
                      {comment.body}
                    </p>
                  </div>
                  {isMine && (
                    <button
                      type="button"
                      disabled={deletePending}
                      onClick={() => handleDelete(comment.id)}
                      className="text-[10px] font-bold shrink-0 transition-colors"
                      style={{ color: "var(--color-slate-light)" }}
                    >
                      削除
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* コメント入力フォームは常に表示し、コメントできることを分かりやすくする */}
      {currentUserId ? (
        <form action={formAction} className="flex gap-2">
          <input
            name="body"
            required
            maxLength={500}
            placeholder="コメントする..."
            className="flex-1 rounded-full border-2 px-3 py-1.5 text-sm outline-none transition-colors"
            style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-indigo)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full text-white px-4 py-1.5 text-xs font-bold disabled:opacity-50 shrink-0"
            style={{ background: "var(--color-ink)" }}
          >
            送信
          </button>
        </form>
      ) : (
        <p className="text-xs" style={{ color: "var(--color-slate-light)" }}>
          コメントするにはログインしてください
        </p>
      )}
      {state?.error && (
        <p className="text-xs font-medium mt-1" style={{ color: "var(--color-coral-dark)" }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
