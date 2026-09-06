"use client";

import { useActionState } from "react";
import { toggleLearnerMode, type UpdateProfileResult } from "@/lib/actions/profile";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * 英語学習者モードのオン/オフを切り替えるトグルスイッチ。
 * オンにすると:
 *  - フィード等に英語投稿(単語がアルファベットのみ)のみが表示される
 *  - アプリ全体のUIが英語表示になる
 * 設定は users.learner_mode に保存され、端末をまたいで同期される。
 */
export function LearnerModeToggle({
  initialEnabled,
  learnerMode,
}: {
  initialEnabled: boolean;
  /** 表示言語の切り替え用。initialEnabled と同じ値を渡す想定 */
  learnerMode: boolean;
}) {
  const t = getDictionary(learnerMode);
  const [state, formAction, pending] = useActionState<
    UpdateProfileResult,
    FormData
  >(toggleLearnerMode, undefined);

  // フォーム送信のたびに現在の値を反転させて送る
  const nextValue = !initialEnabled;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
          {t.profile.learnerMode}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-slate)" }}>
          {t.profile.learnerModeDescription}
        </p>
        {state?.error && (
          <p className="text-xs font-medium mt-1" style={{ color: "var(--color-coral-dark)" }}>
            {state.error}
          </p>
        )}
      </div>

      <form action={formAction} className="shrink-0">
        <input type="hidden" name="learner_mode" value={String(nextValue)} />
        <button
          type="submit"
          disabled={pending}
          aria-pressed={initialEnabled}
          aria-label={t.profile.learnerMode}
          className="relative w-12 h-7 rounded-full transition-colors disabled:opacity-50"
          style={{
            background: initialEnabled ? "var(--color-coral)" : "var(--color-line)",
          }}
        >
          <span
            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
            style={{
              transform: initialEnabled ? "translateX(22px)" : "translateX(2px)",
            }}
          />
        </button>
      </form>
    </div>
  );
}
