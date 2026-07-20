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
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  const addCommentWithPostId = addComment.bind(null, postId);
  const [state, formAction, pending] = useActionState<
    AddCommentResult,
    FormData
  >(addCommentWithPostId, undefined);

  // 開いた時、投稿成功時にコメント一覧を取得し直す
  useEffect(() => {
    if (!expanded) return;
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
  }, [expanded, postId, state]);

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
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        💬 {commentCount}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
          {loading && (
            <p className="text-xs text-neutral-300">読み込み中...</p>
          )}

          {!loading && comments && comments.length === 0 && (
            <p className="text-xs text-neutral-300">
              まだコメントがありません
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
                      <span className="font-medium text-neutral-700 text-xs">
                        {name}
                      </span>
                      <span className="text-[10px] text-neutral-300">
                        {timeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-neutral-600 whitespace-pre-wrap">
                      {comment.body}
                    </p>
                  </div>
                  {isMine && (
                    <button
                      type="button"
                      disabled={deletePending}
                      onClick={() => handleDelete(comment.id)}
                      className="text-[10px] text-neutral-300 hover:text-red-500 shrink-0"
                    >
                      削除
                    </button>
                  )}
                </div>
              );
            })}

          {currentUserId ? (
            <form action={formAction} className="flex gap-2 pt-1">
              <input
                name="body"
                required
                maxLength={500}
                placeholder="コメントする..."
                className="flex-1 rounded-full border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-neutral-900 transition-colors"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-neutral-900 text-white px-4 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                送信
              </button>
            </form>
          ) : (
            <p className="text-xs text-neutral-300">
              コメントするにはログインしてください
            </p>
          )}
          {state?.error && (
            <p className="text-xs text-red-500">{state.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
