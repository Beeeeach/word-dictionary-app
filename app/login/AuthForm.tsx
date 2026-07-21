"use client";

import { useActionState, useState } from "react";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  type AuthActionResult,
} from "@/lib/actions/auth";

type Mode = "signin" | "signup";

/** Googleの4色ロゴ（公式ブランドガイドラインの配色そのままの単純なSVG） */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");

  const [signInState, signInAction, signInPending] = useActionState<
    AuthActionResult,
    FormData
  >(signInWithEmail, undefined);

  const [signUpState, signUpAction, signUpPending] = useActionState<
    AuthActionResult,
    FormData
  >(signUpWithEmail, undefined);

  const state = mode === "signin" ? signInState : signUpState;
  const action = mode === "signin" ? signInAction : signUpAction;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* モード切替タブ */}
      <div
        className="flex mb-8 border-b-2"
        style={{ borderColor: "var(--color-line)" }}
      >
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="flex-1 pb-3 text-[15px] font-bold transition-colors"
          style={{
            color: mode === "signin" ? "var(--color-ink)" : "var(--color-slate-light)",
            borderBottom:
              mode === "signin" ? "2px solid var(--color-coral)" : "2px solid transparent",
            marginBottom: "-2px",
          }}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className="flex-1 pb-3 text-[15px] font-bold transition-colors"
          style={{
            color: mode === "signup" ? "var(--color-ink)" : "var(--color-slate-light)",
            borderBottom:
              mode === "signup" ? "2px solid var(--color-coral)" : "2px solid transparent",
            marginBottom: "-2px",
          }}
        >
          はじめる
        </button>
      </div>

      {/* Googleログイン */}
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 rounded-full border-2 py-3 text-sm font-bold transition-colors hover:bg-black/[0.03]"
          style={{ borderColor: "var(--color-line)", color: "var(--color-ink)", background: "var(--color-paper-raised)" }}
        >
          <GoogleIcon />
          Googleで{mode === "signin" ? "ログイン" : "はじめる"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1" style={{ background: "var(--color-line)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--color-slate)" }}>
          または
        </span>
        <div className="h-px flex-1" style={{ background: "var(--color-line)" }} />
      </div>

      {/* メール/パスワードフォーム */}
      <form action={action} className="space-y-3">
        <div>
          <label htmlFor="email" className="sr-only">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="メールアドレス"
            className="w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-colors"
            style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-indigo)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="パスワード（6文字以上）"
            className="w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-colors"
            style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-indigo)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
          />
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
          style={{ background: "var(--color-ink)" }}
        >
          {pending
            ? "処理中..."
            : mode === "signin"
              ? "ログイン"
              : "アカウントを作成"}
        </button>
      </form>
    </div>
  );
}
