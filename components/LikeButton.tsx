"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/lib/actions/likes";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * UI改善: 以前はテキストと同じ高さのインラインボタンで、
 * コメント欄と並んだ際に上下位置がずれて見えたり、
 * タップ領域が文字とアイコンの実サイズ分しかなくスマホで押しづらかった。
 * 縦方向に十分なpaddingを確保して44px相当のタップ領域に近づけ、
 * 角丸の背景(ホバー/押下時)を敷いて「押せる場所」であることを分かりやすくする。
 */
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
      className={`flex items-center gap-1.5 font-bold rounded-full transition-colors shrink-0 ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-black/[0.05]"
      }`}
      style={{
        color: liked ? "var(--color-coral)" : "var(--color-slate)",
        padding: "8px 12px",
        marginLeft: "-8px", // 見た目の左端をカード全体の内側マージンに揃えるための補正
      }}
      title={disabled ? t.postCard.loginToLike : undefined}
    >
      <span style={{ fontSize: "18px", lineHeight: 1 }}>{liked ? "❤️" : "🤍"}</span>
      <span className="text-sm">{count}</span>
    </button>
  );
}
