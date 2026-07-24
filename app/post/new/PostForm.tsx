"use client";

import { useActionState, useState } from "react";
import { createPost, type CreatePostResult } from "@/lib/actions/posts";
import type { EmotionTag } from "@/lib/types/database.types";

export function PostForm({ emotionTags }: { emotionTags: EmotionTag[] }) {
  const [state, formAction, pending] = useActionState<
    CreatePostResult,
    FormData
  >(createPost, undefined);

  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  function toggleTag(id: number) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* 単語（最重要・最大強調） */}
      <div>
        <label htmlFor="word" className="sr-only">
          単語
        </label>
        <input
          id="word"
          name="word"
          required
          maxLength={100}
          placeholder="出会った単語は？"
          autoFocus
          className="w-full text-2xl font-extrabold border-b-2 outline-none py-3 transition-colors bg-transparent"
          style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
        />
      </div>

      {/* 意味（任意） */}
      <div>
        <label
          htmlFor="meaning"
          className="block text-xs font-bold mb-1"
          style={{ color: "var(--color-slate)" }}
        >
          意味（任意・自分なりの解釈でOK）
        </label>
        <textarea
          id="meaning"
          name="meaning"
          rows={2}
          placeholder="どういう意味だと思う？"
          className="w-full rounded-xl border-2 px-3 py-2 text-sm outline-none transition-colors resize-none"
          style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-indigo)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
        />
      </div>

      {/* 出会った文脈（任意） */}
      <div>
        <label
          htmlFor="context"
          className="block text-xs font-bold mb-1"
          style={{ color: "var(--color-slate)" }}
        >
          出会った文脈（任意）
        </label>
        <textarea
          id="context"
          name="context"
          rows={2}
          placeholder="どこで・誰から・どんな場面で聞いた？"
          className="w-full rounded-xl border-2 px-3 py-2 text-sm outline-none transition-colors resize-none"
          style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-indigo)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
        />
      </div>

      {/* 感情タグ（任意・複数選択可） */}
      {emotionTags.length > 0 && (
        <div>
          <span
            className="block text-xs font-bold mb-1.5"
            style={{ color: "var(--color-slate)" }}
          >
            この単語の印象は？（任意・複数選択可）
          </span>
          <div className="flex flex-wrap gap-2">
            {emotionTags.map((tag) => {
              const selected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="rounded-full px-3 py-1.5 text-sm font-bold border-2 transition-colors"
                  style={
                    selected
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
                  {tag.emoji} {tag.name}
                </button>
              );
            })}
          </div>
          {selectedTags.map((id) => (
            <input key={id} type="hidden" name="emotion_tags" value={id} />
          ))}
        </div>
      )}

      {/* 写真（任意） */}
      <div>
        <label
          htmlFor="photo"
          className="block text-xs font-bold mb-1.5"
          style={{ color: "var(--color-slate)" }}
        >
          写真（任意）
        </label>
        {photoPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="プレビュー"
              className="w-full max-h-64 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={() => {
                setPhotoPreview(null);
                const input = document.getElementById(
                  "photo"
                ) as HTMLInputElement;
                if (input) input.value = "";
              }}
              className="absolute top-2 right-2 rounded-full bg-black/60 text-white w-7 h-7 text-sm"
            >
              ×
            </button>
          </div>
        ) : (
          <label
            htmlFor="photo"
            className="flex items-center justify-center rounded-xl border-2 border-dashed py-6 text-sm font-bold cursor-pointer transition-colors"
            style={{ borderColor: "var(--color-line)", color: "var(--color-slate)" }}
          >
            + 写真を追加する
          </label>
        )}
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      {/* 自由記述欄（意味・文脈とは別枠のひとこと） */}
      <div>
        <label
          htmlFor="note"
          className="block text-xs font-bold mb-1"
          style={{ color: "var(--color-slate)" }}
        >
          ひとこと（任意・自由に書いてOK）
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          maxLength={200}
          placeholder="伝えたいことを自由に書いてみましょう"
          className="w-full rounded-xl border-2 px-3 py-2 text-sm outline-none transition-colors resize-none"
          style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-indigo)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
        />
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
        {pending ? "投稿中..." : "投稿する"}
      </button>
    </form>
  );
}
