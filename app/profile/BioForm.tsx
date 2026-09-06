"use client";

import { useActionState, useState } from "react";
import { updateBio, type UpdateProfileResult } from "@/lib/actions/profile";
import { getDictionary } from "@/lib/i18n/dictionary";

export function BioForm({
  currentBio,
  learnerMode = false,
}: {
  currentBio: string;
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);
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
          {currentBio || t.profile.bioNotSet}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-bold underline underline-offset-2"
          style={{ color: "var(--color-indigo)" }}
        >
          {t.profile.editBio}
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
        {t.profile.bioFieldLabel}
      </label>
      <textarea
        id="bio"
        name="bio"
        defaultValue={currentBio}
        maxLength={160}
        rows={3}
        placeholder={t.profile.bioPlaceholder}
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
          {t.profile.bioUpdated}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full text-white px-5 py-2 text-sm font-bold disabled:opacity-50"
          style={{ background: "var(--color-ink)" }}
        >
          {pending ? t.common.saving : t.common.save}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full px-5 py-2 text-sm font-bold border-2"
          style={{ borderColor: "var(--color-line)", color: "var(--color-slate)" }}
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
