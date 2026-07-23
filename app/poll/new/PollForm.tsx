"use client";

import { useActionState, useState } from "react";
import { createPoll, type CreatePollResult } from "@/lib/actions/polls";

const DURATION_OPTIONS = [
  { value: 1, label: "1時間" },
  { value: 6, label: "6時間" },
  { value: 24, label: "1日" },
  { value: 72, label: "3日" },
  { value: 168, label: "1週間" },
];

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

export function PollForm() {
  const [state, formAction, pending] = useActionState<
    CreatePollResult,
    FormData
  >(createPoll, undefined);

  const [optionCount, setOptionCount] = useState(MIN_OPTIONS);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [duration, setDuration] = useState(24);

  return (
    <form action={formAction} className="space-y-5">
      {/* タイトル */}
      <div>
        <label htmlFor="title" className="sr-only">
          投票のタイトル
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={100}
          placeholder="今日の天気は？"
          autoFocus
          className="w-full text-2xl font-extrabold border-b-2 outline-none py-3 transition-colors bg-transparent"
          style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
        />
      </div>

      {/* 選択肢 */}
      <div className="space-y-2">
        <span
          className="block text-xs font-bold"
          style={{ color: "var(--color-slate)" }}
        >
          選択肢（{MIN_OPTIONS}〜{MAX_OPTIONS}個）
        </span>
        {Array.from({ length: optionCount }).map((_, i) => (
          <input
            key={i}
            name="option"
            required
            maxLength={50}
            placeholder={`選択肢 ${i + 1}`}
            className="w-full rounded-xl border-2 px-3 py-2 text-sm outline-none transition-colors"
            style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-indigo)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
          />
        ))}
        <div className="flex gap-2">
          {optionCount < MAX_OPTIONS && (
            <button
              type="button"
              onClick={() => setOptionCount((c) => c + 1)}
              className="text-xs font-bold"
              style={{ color: "var(--color-indigo)" }}
            >
              + 選択肢を追加
            </button>
          )}
          {optionCount > MIN_OPTIONS && (
            <button
              type="button"
              onClick={() => setOptionCount((c) => c - 1)}
              className="text-xs font-bold"
              style={{ color: "var(--color-slate-light)" }}
            >
              − 選択肢を減らす
            </button>
          )}
        </div>
      </div>

      {/* 締切時間 */}
      <div>
        <span
          className="block text-xs font-bold mb-1.5"
          style={{ color: "var(--color-slate)" }}
        >
          締切時間
        </span>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDuration(d.value)}
              className="rounded-full px-3 py-1.5 text-sm font-bold border-2 transition-colors"
              style={
                duration === d.value
                  ? {
                      background: "#FFF0EC",
                      color: "var(--color-coral-dark)",
                      borderColor: "var(--color-coral)",
                    }
                  : {
                      background: "var(--color-paper-raised)",
                      color: "var(--color-slate)",
                      borderColor: "var(--color-line)",
                    }
              }
            >
              {d.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="duration_hours" value={duration} />
      </div>

      {/* 公開範囲 */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: "#F3F1E9" }}
      >
        <span className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
          公開範囲
        </span>
        <div
          className="flex rounded-full p-0.5"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className="rounded-full px-3 py-1 text-xs font-bold transition-colors"
            style={
              visibility === "public"
                ? { background: "var(--color-ink)", color: "#fff" }
                : { color: "var(--color-slate)" }
            }
          >
            公開
          </button>
          <button
            type="button"
            onClick={() => setVisibility("private")}
            className="rounded-full px-3 py-1 text-xs font-bold transition-colors"
            style={
              visibility === "private"
                ? { background: "var(--color-ink)", color: "#fff" }
                : { color: "var(--color-slate)" }
            }
          >
            非公開
          </button>
        </div>
        <input type="hidden" name="visibility" value={visibility} />
      </div>

      {state?.error && (
        <p className="text-sm font-medium" style={{ color: "var(--color-coral-dark)" }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full py-3 text-sm font-bold text-white transition-colors disabled:opacity-50"
        style={{ background: "var(--color-coral)" }}
      >
        {pending ? "作成中..." : "投票を作成する"}
      </button>
    </form>
  );
}
