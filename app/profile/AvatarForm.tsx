"use client";

import { useActionState, useState } from "react";
import { updateAvatar, type UpdateProfileResult } from "@/lib/actions/profile";
import { getDictionary } from "@/lib/i18n/dictionary";

export function AvatarForm({
  currentAvatarUrl,
  learnerMode = false,
}: {
  currentAvatarUrl: string | null;
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<
    UpdateProfileResult,
    FormData
  >(updateAvatar, undefined);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  const displayImage = preview ?? currentAvatarUrl;

  return (
    <form action={formAction} className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: "var(--color-line)" }}
      >
        {displayImage ? (
          // プレビューはdata URLの場合もあるため、next/imageではなくimgタグを使う
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">👤</span>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <label
          htmlFor="avatar"
          className="inline-block rounded-full px-4 py-2 text-xs font-bold border-2 cursor-pointer transition-colors"
          style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
        >
          {t.profile.selectImage}
        </label>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview && (
          <button
            type="submit"
            disabled={pending}
            className="ml-2 rounded-full px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            style={{ background: "var(--color-coral)" }}
          >
            {pending ? t.common.updating : t.profile.changeToThisImage}
          </button>
        )}

        {state?.error && (
          <p className="text-xs font-medium" style={{ color: "var(--color-coral-dark)" }}>
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-xs font-medium" style={{ color: "var(--color-indigo)" }}>
            {t.profile.avatarUpdated}
          </p>
        )}
      </div>
    </form>
  );
}
