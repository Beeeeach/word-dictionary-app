"use client";

import { useEffect, useState, useTransition } from "react";
import { castVote } from "@/lib/actions/polls";
import type { PollOptionWithVotes } from "@/lib/types/database.types";

function formatTimeLeft(closesAt: string): string {
  const diffMs = new Date(closesAt).getTime() - Date.now();
  if (diffMs <= 0) return "締切";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `あと${diffMin}分`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `あと${diffHour}時間`;
  return `あと${Math.floor(diffHour / 24)}日`;
}

export function PollCard({
  postId,
  closesAt,
  options,
  myVoteOptionId,
  totalVotes,
  disabled,
}: {
  postId: string;
  closesAt: string;
  options: PollOptionWithVotes[];
  myVoteOptionId: string | null;
  totalVotes: number;
  disabled?: boolean;
}) {
  const [isClosed, setIsClosed] = useState(
    () => new Date(closesAt).getTime() <= Date.now()
  );
  const [myVote, setMyVote] = useState(myVoteOptionId);
  const [localOptions, setLocalOptions] = useState(options);
  const [localTotal, setLocalTotal] = useState(totalVotes);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 締切タイミングを1分おきに再チェックし、結果表示に自動で切り替える
  useEffect(() => {
    const timer = setInterval(() => {
      if (new Date(closesAt).getTime() <= Date.now()) {
        setIsClosed(true);
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [closesAt]);

  function handleVote(optionId: string) {
    if (disabled || isPending || myVote || isClosed) return;

    // 楽観的更新
    setMyVote(optionId);
    setLocalOptions((prev) =>
      prev.map((o) => (o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o))
    );
    setLocalTotal((t) => t + 1);

    startTransition(async () => {
      const result = await castVote(postId, optionId);
      if (result?.error) {
        setError(result.error);
        setMyVote(null);
        setLocalOptions((prev) =>
          prev.map((o) =>
            o.id === optionId ? { ...o, vote_count: Math.max(0, o.vote_count - 1) } : o
          )
        );
        setLocalTotal((t) => Math.max(0, t - 1));
      }
    });
  }

  const showResults = isClosed || myVote !== null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-slate-light)" }}>
        <span>🗳️ 投票</span>
        <span>{isClosed ? "締切済み" : formatTimeLeft(closesAt)}</span>
      </div>

      <div className="space-y-2">
        {localOptions.map((option) => {
          const percentage =
            localTotal > 0 ? Math.round((option.vote_count / localTotal) * 100) : 0;
          const isMyChoice = myVote === option.id;

          if (showResults) {
            return (
              <div
                key={option.id}
                className="relative rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--color-line)" }}
              >
                <div
                  className="absolute inset-y-0 left-0 transition-all"
                  style={{
                    width: `${percentage}%`,
                    background: isMyChoice ? "#FFF0EC" : "var(--color-paper)",
                  }}
                />
                <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                  <span
                    className="font-bold flex items-center gap-1"
                    style={{ color: "var(--color-ink)" }}
                  >
                    {isMyChoice && "✓ "}
                    {option.label}
                  </span>
                  <span style={{ color: "var(--color-slate)" }}>
                    {percentage}%（{option.vote_count}票）
                  </span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              disabled={disabled || isPending}
              className="w-full text-left rounded-xl px-3 py-2 text-sm font-bold transition-colors border-2"
              style={{
                borderColor: "var(--color-line)",
                color: "var(--color-ink)",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs" style={{ color: "var(--color-slate-light)" }}>
        {localTotal}票
      </p>

      {error && (
        <p className="text-xs font-medium" style={{ color: "var(--color-coral-dark)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
