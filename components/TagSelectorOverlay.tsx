"use client";

import { useState } from "react";
import type { EmotionTag, EmotionTagCategory } from "@/lib/types/database.types";
import { EMOTION_TAG_CATEGORIES, MAX_POST_TAGS, getTagDisplayName } from "@/lib/data/emotion-tags";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * 投稿フォームから開く、カテゴリ別タグ選択オーバーレイ。
 * 7カテゴリ(テーマ/感情/目的/雰囲気/形式/対象/シーン)をタブ切り替えで表示し、
 * 合計 MAX_POST_TAGS(5) 個までタグを選択できる。
 *
 * 選択状態は親コンポーネント(PostForm)がリフトアップして持ち、
 * このコンポーネントは「開いている間だけ」の一時編集用ローカル状態を持つ。
 * 「決定」を押した時にのみ親へ反映することで、閉じずに×で閉じた場合に
 * 変更を破棄できるようにしている。
 */
export function TagSelectorOverlay({
  tagsByCategory,
  initialSelectedIds,
  onConfirm,
  onClose,
  learnerMode = false,
}: {
  tagsByCategory: Record<EmotionTagCategory, EmotionTag[]>;
  initialSelectedIds: number[];
  onConfirm: (ids: number[]) => void;
  onClose: () => void;
  /** 英語学習者モード。true の場合、オーバーレイ内の文言が英語になる */
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);
  const [activeCategory, setActiveCategory] = useState<EmotionTagCategory>(
    EMOTION_TAG_CATEGORIES[0].key
  );
  const [selected, setSelected] = useState<number[]>(initialSelectedIds);

  const atLimit = selected.length >= MAX_POST_TAGS;

  function toggle(id: number) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((t) => t !== id);
      }
      if (prev.length >= MAX_POST_TAGS) {
        return prev;
      }
      return [...prev, id];
    });
  }

  const tagIdToName = new Map<number, string>();
  for (const cat of EMOTION_TAG_CATEGORIES) {
    for (const tag of tagsByCategory[cat.key] ?? []) {
      tagIdToName.set(tag.id, getTagDisplayName(tag, learnerMode));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--color-paper)" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--color-line)" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-bold"
          style={{ color: "var(--color-slate)" }}
        >
          {t.common.cancel}
        </button>
        <span className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
          {t.tagSelector.title}（{selected.length}/{MAX_POST_TAGS}）
        </span>
        <button
          type="button"
          onClick={() => onConfirm(selected)}
          className="text-sm font-bold"
          style={{ color: "var(--color-coral)" }}
        >
          {t.tagSelector.confirm}
        </button>
      </div>

      {/* 選択済みタグのプレビュー */}
      {selected.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5 px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--color-line)" }}
        >
          {selected.map((id) => (
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

      {/* カテゴリタブ */}
      <div
        className="flex gap-1 px-3 py-2 overflow-x-auto border-b shrink-0"
        style={{ borderColor: "var(--color-line)" }}
      >
        {EMOTION_TAG_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveCategory(cat.key)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
            style={
              activeCategory === cat.key
                ? { background: "var(--color-ink)", color: "#fff" }
                : {
                    background: "var(--color-paper-raised)",
                    color: "var(--color-slate)",
                    border: "1px solid var(--color-line)",
                  }
            }
          >
            {t.tagSelector.categories[cat.key]}
          </button>
        ))}
      </div>

      {/* タグ一覧（選択中カテゴリのみ表示） */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {(tagsByCategory[activeCategory] ?? []).map((tag) => {
            const isSelected = selected.includes(tag.id);
            const disabled = !isSelected && atLimit;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                disabled={disabled}
                className="rounded-full px-3 py-1.5 text-sm font-bold border-2 transition-colors"
                style={
                  isSelected
                    ? {
                        background: "#FFF0EC",
                        color: "var(--color-coral-dark)",
                        borderColor: "var(--color-coral)",
                      }
                    : {
                        background: "var(--color-paper-raised)",
                        color: disabled ? "var(--color-line)" : "var(--color-slate)",
                        borderColor: "var(--color-line)",
                        opacity: disabled ? 0.5 : 1,
                      }
                }
              >
                #{getTagDisplayName(tag, learnerMode)}
              </button>
            );
          })}
        </div>
        {atLimit && (
          <p className="text-xs mt-4" style={{ color: "var(--color-slate-light)" }}>
            {t.tagSelector.limitHint}
          </p>
        )}
      </div>
    </div>
  );
}
