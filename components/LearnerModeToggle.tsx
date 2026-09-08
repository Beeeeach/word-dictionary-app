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
 *
 * UI修正: 以前はTailwindのユーティリティクラス(w-12 h-7等)と
 * インラインstyleのtranslateXを併用しており、環境によっては
 * トラック幅とつまみの移動距離の計算が合わず、つまみが右端から
 * はみ出て表示される不具合があった。
 * 数値をすべてインラインstyleに寄せて直接pxで管理し、
 * トラック幅(52px) - つまみ直径(24px) - 左右マージン(2px x2) = 24px を
 * 移動距離として明示的に計算することで、どの環境でも必ず内側に収まるようにする。
 */
const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 24;
const THUMB_MARGIN = 3;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2; // = 22px

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
          className="relative shrink-0 transition-colors disabled:opacity-50"
          style={{
            width: `${TRACK_WIDTH}px`,
            height: `${TRACK_HEIGHT}px`,
            borderRadius: `${TRACK_HEIGHT}px`,
            background: initialEnabled ? "var(--color-coral)" : "var(--color-line)",
            padding: 0,
            border: "none",
            flexShrink: 0,
          }}
        >
          <span
            className="absolute bg-white transition-transform"
            style={{
              top: `${THUMB_MARGIN}px`,
              left: `${THUMB_MARGIN}px`,
              width: `${THUMB_SIZE}px`,
              height: `${THUMB_SIZE}px`,
              borderRadius: "9999px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              transform: initialEnabled
                ? `translateX(${THUMB_TRAVEL}px)`
                : "translateX(0px)",
            }}
          />
        </button>
      </form>
    </div>
  );
}
