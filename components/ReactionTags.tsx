"use client";

import { useState, useTransition } from "react";
import { toggleReaction } from "@/lib/actions/reactions";
import type { EmotionTag } from "@/lib/types/database.types";

export function ReactionTags({
  postId,
  allTags,
  initialSummary,
  initialMyTagIds,
  disabled,
}: {
  postId: string;
  allTags: EmotionTag[];
  initialSummary: { emotion_tag: EmotionTag; count: number }[];
  initialMyTagIds: number[];
  disabled?: boolean;
}) {
  const [myTagIds, setMyTagIds] = useState<Set<number>>(
    new Set(initialMyTagIds)
  );
  const [counts, setCounts] = useState<Map<number, number>>(
    new Map(initialSummary.map((s) => [s.emotion_tag.id, s.count]))
  );
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  function handleToggle(tagId: number) {
    if (disabled || isPending) return;

    const reacted = myTagIds.has(tagId);
    // 楽観的更新
    setMyTagIds((prev) => {
      const next = new Set(prev);
      if (reacted) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
    setCounts((prev) => {
      const next = new Map(prev);
      const current = next.get(tagId) ?? 0;
      next.set(tagId, Math.max(0, current + (reacted ? -1 : 1)));
      return next;
    });

    startTransition(async () => {
      const result = await toggleReaction(postId, tagId);
      if (result.error) {
        // 失敗時はロールバック
        setMyTagIds((prev) => {
          const next = new Set(prev);
          if (reacted) next.add(tagId);
          else next.delete(tagId);
          return next;
        });
        setCounts((prev) => {
          const next = new Map(prev);
          const current = next.get(tagId) ?? 0;
          next.set(tagId, Math.max(0, current + (reacted ? 1 : -1)));
          return next;
        });
      }
    });
  }

  const hasAnyReaction = Array.from(counts.values()).some((c) => c > 0);

  return (
    <div className="space-y-1.5">
      {/* 反応タグの内訳表示（誰かが反応していれば常に見える） */}
      {hasAnyReaction && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex flex-wrap gap-1.5"
        >
          {allTags.map((tag) => {
            const count = counts.get(tag.id) ?? 0;
            if (count === 0) return null;
            const mine = myTagIds.has(tag.id);
            return (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                style={
                  mine
                    ? { background: "#EEF0FC", color: "var(--color-indigo-dark)" }
                    : { background: "#F3F1E9", color: "var(--color-slate)" }
                }
              >
                {tag.emoji} {count}
              </span>
            );
          })}
        </button>
      )}

      {/* タップで展開: 全タグから選んで反応できるUI */}
      {expanded && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => {
            const count = counts.get(tag.id) ?? 0;
            const mine = myTagIds.has(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggle(tag.id)}
                disabled={disabled}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border-2 transition-colors ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={
                  mine
                    ? {
                        background: "#EEF0FC",
                        color: "var(--color-indigo-dark)",
                        borderColor: "var(--color-indigo)",
                      }
                    : {
                        background: "var(--color-paper-raised)",
                        color: "var(--color-slate)",
                        borderColor: "var(--color-line)",
                      }
                }
              >
                {tag.emoji} {tag.name}
                {count > 0 && <span className="ml-0.5">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {!hasAnyReaction && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          disabled={disabled}
          className="text-xs font-bold transition-colors"
          style={{ color: "var(--color-slate-light)" }}
        >
          + 反応する
        </button>
      )}
    </div>
  );
}
