"use client";

import { useActionState, useState } from "react";
import { updateBio, type UpdateProfileResult } from "@/lib/actions/profile";

export function BioForm({ currentBio }: { currentBio: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<
    UpdateProfileResult,
    FormData
  >(updateBio, undefined);

  if (!editing) {
    return (
      <div>
        <p
          className="text-sm whitespace-pre-wrap mb-2"
          style={{ color: currentBio ? "var(--color-ink)" : "var(--color-slate-light)" }}
        >
          {currentBio || "自己紹介はまだ設定されていません"}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-bold underline underline-offset-2"
          style={{ color: "var(--color-indigo)" }}
        >
          自己紹介を編集する
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <label
        htmlFor="bio"
        className="block text-xs font-bold"
        style={{ color: "var(--color-slate)" }}
      >
        自己紹介（任意・160文字まで）
      </label>
      <textarea
        id="bio"
        name="bio"
        defaultValue={currentBio}
        maxLength={160}
        rows={3}
        placeholder="どんな言葉が好き？自己紹介してみましょう"
        className="w-full rounded-xl border-2 px-4 py-2.5 text-sm outline-none transition-colors resize-none"
        style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
      />
      {state?.error && (
        <p className="text-sm font-medium" style={{ color: "var(--color-coral-dark)" }}>
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm font-medium" style={{ color: "var(--color-indigo)" }}>
          自己紹介を更新しました
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full text-white px-5 py-2 text-sm font-bold disabled:opacity-50"
          style={{ background: "var(--color-ink)" }}
        >
          {pending ? "保存中..." : "保存する"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full px-5 py-2 text-sm font-bold border-2"
          style={{ borderColor: "var(--color-line)", color: "var(--color-slate)" }}
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
