"use client";

import { useActionState, useState } from "react";
import { updateDisplayName, type UpdateProfileResult } from "@/lib/actions/profile";

export function DisplayNameForm({
  currentDisplayName,
}: {
  currentDisplayName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<
    UpdateProfileResult,
    FormData
  >(updateDisplayName, undefined);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm font-bold underline underline-offset-2"
        style={{ color: "var(--color-indigo)" }}
      >
        表示名を変更する
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        const result = await formAction(formData);
        return result;
      }}
      className="space-y-2"
    >
      <label
        htmlFor="display_name"
        className="block text-xs font-bold"
        style={{ color: "var(--color-slate)" }}
      >
        表示名（アプリ内でみんなに見える名前）
      </label>
      <input
        id="display_name"
        name="display_name"
        defaultValue={currentDisplayName}
        maxLength={30}
        required
        className="w-full rounded-xl border-2 px-4 py-2.5 text-sm outline-none transition-colors"
        style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
      />
      {state?.error && (
        <p className="text-sm font-medium" style={{ color: "var(--color-coral-dark)" }}>
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm font-medium" style={{ color: "var(--color-indigo)" }}>
          表示名を更新しました
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
