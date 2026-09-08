"use client";

import { useActionState, useState, useTransition } from "react";
import { createPost, type CreatePostResult } from "@/lib/actions/posts";
import { suggestMeaning, type MeaningSuggestion } from "@/lib/actions/word-meaning";
import type { EmotionTag, EmotionTagCategory } from "@/lib/types/database.types";
import { TagSelectorOverlay } from "@/components/TagSelectorOverlay";
import { MAX_POST_TAGS, getTagDisplayName } from "@/lib/data/emotion-tags";
import { isAlphabeticWord } from "@/lib/utils/language";
import { getDictionary } from "@/lib/i18n/dictionary";

export function PostForm({
  tagsByCategory,
  learnerMode = false,
}: {
  /**
   * カテゴリごとにグルーピング済みの投稿者向けタグ。
   * lib/data/emotion-tags.ts の getCategorizedPostTags() で取得したものを渡す。
   */
  tagsByCategory: Record<EmotionTagCategory, EmotionTag[]>;
  /** 英語学習者モード。true の場合、フォーム内の文言が英語になる */
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);

  const [state, formAction, pending] = useActionState<
    CreatePostResult,
    FormData
  >(createPost, undefined);

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagOverlayOpen, setTagOverlayOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  // --- 意味の自動提案（企画: 意味を書く手間を減らす工夫） ---
  // 英単語(アルファベットのみ)は無料辞書API + 翻訳APIから、
  // それ以外(日本語など)は過去に同じ単語へ付けられた意味から提案する。
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [suggestions, setSuggestions] = useState<MeaningSuggestion[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [isSuggesting, startSuggestTransition] = useTransition();

  const canSuggest = word.trim().length > 0;

  function handleSuggest() {
    setSuggestError(null);
    setSuggestions([]);
    startSuggestTransition(async () => {
      const result = await suggestMeaning(word);
      if (result.error) {
        setSuggestError(result.error);
        return;
      }
      setSuggestions(result.suggestions);
      // 候補が1件だけの場合は、迷わせず意味欄にそのまま反映する（手で編集可能）
      if (result.suggestions.length === 1) {
        setMeaning(result.suggestions[0].meaning);
      }
    });
  }

  function applySuggestion(text: string) {
    setMeaning(text);
    setSuggestions([]);
  }

  const allTags = Object.values(tagsByCategory).flat();
  const tagIdToName = new Map(allTags.map((tag) => [tag.id, getTagDisplayName(tag, learnerMode)]));

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
          {t.post.wordPlaceholder}
        </label>
        <input
          id="word"
          name="word"
          required
          maxLength={100}
          placeholder={t.post.wordPlaceholder}
          autoFocus
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className="w-full text-2xl font-extrabold border-b-2 outline-none py-3 transition-colors bg-transparent"
          style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
        />
      </div>

      {/* 意味（任意） */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="meaning"
            className="block text-xs font-bold"
            style={{ color: "var(--color-slate)" }}
          >
            {t.post.meaningLabel}
          </label>
          <button
            type="button"
            onClick={handleSuggest}
            disabled={!canSuggest || isSuggesting}
            className="text-xs font-bold shrink-0 disabled:opacity-40 transition-colors"
            style={{ color: "var(--color-indigo)" }}
          >
            {isSuggesting
              ? t.post.suggesting
              : isAlphabeticWord(word)
                ? t.post.suggestMeaningDictionary
                : t.post.suggestMeaningPastPost}
          </button>
        </div>
        <textarea
          id="meaning"
          name="meaning"
          rows={2}
          placeholder={t.post.meaningPlaceholder}
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          className="w-full rounded-xl border-2 px-3 py-2 text-sm outline-none transition-colors resize-none"
          style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-indigo)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
        />

        {suggestError && (
          <p className="text-xs mt-1" style={{ color: "var(--color-slate-light)" }}>
            {suggestError}
          </p>
        )}

        {/* 候補が複数ある場合はタップ選択式で表示（自動で書き換えず選ばせる） */}
        {suggestions.length > 1 && (
          <div className="mt-2 space-y-1.5">
            <p className="text-[11px] font-bold" style={{ color: "var(--color-slate-light)" }}>
              {t.post.suggestionsHint}
            </p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applySuggestion(s.meaning)}
                className="block w-full text-left rounded-lg px-3 py-2 text-xs transition-colors"
                style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)", color: "var(--color-ink)" }}
              >
                {s.meaning}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* タグ（任意・最大5個・カテゴリ別オーバーレイから選択） */}
      <div>
        <span
          className="block text-xs font-bold mb-1.5"
          style={{ color: "var(--color-slate)" }}
        >
          {t.post.tagsLabel}
        </span>

        {selectedTagIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedTagIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: "#FFF0EC", color: "var(--color-coral-dark)" }}
              >
                #{tagIdToName.get(id) ?? ""}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setTagOverlayOpen(true)}
          className="rounded-full px-4 py-2 text-sm font-bold border-2 transition-colors"
          style={{ borderColor: "var(--color-line)", color: "var(--color-slate)" }}
        >
          {t.post.selectTags}
        </button>

        {selectedTagIds.map((id) => (
          <input key={id} type="hidden" name="emotion_tags" value={id} />
        ))}
      </div>

      {tagOverlayOpen && (
        <TagSelectorOverlay
          tagsByCategory={tagsByCategory}
          initialSelectedIds={selectedTagIds}
          onClose={() => setTagOverlayOpen(false)}
          onConfirm={(ids) => {
            setSelectedTagIds(ids);
            setTagOverlayOpen(false);
          }}
          learnerMode={learnerMode}
        />
      )}

      {/* 写真（任意） */}
      <div>
        <label
          htmlFor="photo"
          className="block text-xs font-bold mb-1.5"
          style={{ color: "var(--color-slate)" }}
        >
          {t.post.photoLabel}
        </label>
        {photoPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt=""
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
            {t.post.addPhoto}
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

      {/* 自由記述欄（意味とは別枠のひとこと） */}
      <div>
        <label
          htmlFor="note"
          className="block text-xs font-bold mb-1"
          style={{ color: "var(--color-slate)" }}
        >
          {t.post.noteLabel}
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          maxLength={200}
          placeholder={t.post.notePlaceholder}
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
          {t.post.visibility}
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
            {t.post.public}
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
            {t.post.private}
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
        {pending ? t.post.submitting : t.post.submit}
      </button>
    </form>
  );
}
