"use client";

import { useActionState, useState } from "react";
import { createPoll, type CreatePollResult } from "@/lib/actions/polls";
import { getDictionary } from "@/lib/i18n/dictionary";

const DURATION_KEYS = ["1h", "6h", "1d", "3d", "1w"] as const;
const DURATION_HOURS: Record<(typeof DURATION_KEYS)[number], number> = {
  "1h": 1,
  "6h": 6,
  "1d": 24,
  "3d": 72,
  "1w": 168,
};

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

export function PollForm({ learnerMode = false }: { learnerMode?: boolean }) {
  const t = getDictionary(learnerMode);
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
          {t.poll.titlePlaceholder}
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={100}
          placeholder={t.poll.titlePlaceholder}
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
          {t.poll.optionsLabel(MIN_OPTIONS, MAX_OPTIONS)}
        </span>
        {Array.from({ length: optionCount }).map((_, i) => (
          <input
            key={i}
            name="option"
            required
            maxLength={50}
            placeholder={t.poll.optionPlaceholder(i + 1)}
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
              {t.poll.addOption}
            </button>
          )}
          {optionCount > MIN_OPTIONS && (
            <button
              type="button"
              onClick={() => setOptionCount((c) => c - 1)}
              className="text-xs font-bold"
              style={{ color: "var(--color-slate-light)" }}
            >
              {t.poll.removeOption}
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
          {t.poll.deadline}
        </span>
        <div className="flex flex-wrap gap-2">
          {DURATION_KEYS.map((key) => {
            const hours = DURATION_HOURS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDuration(hours)}
                className="rounded-full px-3 py-1.5 text-sm font-bold border-2 transition-colors"
                style={
                  duration === hours
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
                {t.poll.durations[key]}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="duration_hours" value={duration} />
      </div>

      {/* 公開範囲 */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: "#F3F1E9" }}
      >
        <span className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
          {t.poll.visibility}
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
            {t.poll.public}
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
            {t.poll.private}
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
        {pending ? t.poll.creating : t.poll.submit}
      </button>
    </form>
  );
}
