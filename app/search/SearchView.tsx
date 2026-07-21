"use client";

import { useState, useTransition } from "react";
import { PostCard } from "@/components/PostCard";
import { TabBar } from "@/components/TabBar";
import { searchDictionary, searchMyDictionary } from "@/lib/actions/search";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";

type Tab = "all" | "mine";

export function SearchView({
  currentUserId,
  allEmotionTags,
}: {
  currentUserId: string | null;
  allEmotionTags: EmotionTag[];
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<PostWithRelations[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);

  function runSearch(nextKeyword: string, nextTab: Tab) {
    if (!nextKeyword.trim()) {
      setResults(null);
      setSearched(false);
      return;
    }
    setSearched(true);
    startTransition(async () => {
      const data =
        nextTab === "all"
          ? await searchDictionary(nextKeyword)
          : await searchMyDictionary(nextKeyword);
      setResults(data);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(keyword, tab);
  }

  function handleTabChange(nextTab: string) {
    setTab(nextTab as Tab);
    if (keyword.trim()) runSearch(keyword, nextTab as Tab);
  }

  return (
    <div>
      {/* 自分の辞書/みんなの辞書 タブ */}
      <TabBar
        tabs={[
          { key: "all", label: "みんなの辞書" },
          { key: "mine", label: "自分の辞書", disabled: !currentUserId },
        ]}
        active={tab}
        onChange={handleTabChange}
      />

      {/* キーワード検索フォーム */}
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="単語を検索..."
            className="flex-1 rounded-full border-2 px-4 py-2.5 text-sm outline-none transition-colors"
            style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-indigo)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-line)")}
          />
          <button
            type="submit"
            className="rounded-full text-white px-5 py-2.5 text-sm font-bold"
            style={{ background: "var(--color-ink)" }}
          >
            検索
          </button>
        </div>
      </form>

      {/* 検索結果 */}
      {isPending && (
        <p className="text-center text-xs py-8" style={{ color: "var(--color-slate-light)" }}>
          検索中...
        </p>
      )}

      {!isPending && searched && results && results.length === 0 && (
        <p className="text-center text-sm py-16" style={{ color: "var(--color-slate)" }}>
          「{keyword}」に一致する単語は見つかりませんでした
        </p>
      )}

      {!isPending && !searched && (
        <p className="text-center text-sm py-16" style={{ color: "var(--color-slate-light)" }}>
          気になる単語を検索してみましょう
        </p>
      )}

      {!isPending && results && results.length > 0 && (
        <div className="space-y-4">
          {results.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              allEmotionTags={allEmotionTags}
            />
          ))}
        </div>
      )}
    </div>
  );
}
