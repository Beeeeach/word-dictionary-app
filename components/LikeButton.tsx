"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/lib/actions/likes";
import { getDictionary } from "@/lib/i18n/dictionary";

export function LikeButton({
  postId,
  initialCount,
  initiallyLiked,
  disabled,
  learnerMode = false,
}: {
  postId: string;
  initialCount: number;
  initiallyLiked: boolean;
  disabled?: boolean;
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (disabled || isPending) return;

    // 楽観的更新: サーバーの応答を待たずに即座に見た目を反映する
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const result = await toggleLike(postId);
      if (result.error) {
        // 失敗時は元の状態に戻す
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
      } else if (result.liked !== nextLiked) {
        // サーバー側の実際の状態に合わせて補正（念のため）
        setLiked(result.liked);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-1 font-bold transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={{ color: liked ? "var(--color-coral)" : "var(--color-slate)" }}
      title={disabled ? t.postCard.loginToLike : undefined}
    >
      <span>{liked ? "❤️" : "🤍"}</span>
      <span>{count}</span>
    </button>
  );
}
