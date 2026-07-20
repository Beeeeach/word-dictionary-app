"use client";

import { useState, useTransition } from "react";
import { PostCard } from "@/components/PostCard";
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

  function handleTabChange(nextTab: Tab) {
    setTab(nextTab);
    if (keyword.trim()) runSearch(keyword, nextTab);
  }

  return (
    <div>
      {/* 自分の辞書/みんなの辞書 タブ */}
      <div className="flex mb-5 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => handleTabChange("all")}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            tab === "all"
              ? "text-neutral-900 border-b-2 border-neutral-900"
              : "text-neutral-400"
          }`}
        >
          みんなの辞書
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("mine")}
          disabled={!currentUserId}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            tab === "mine"
              ? "text-neutral-900 border-b-2 border-neutral-900"
              : "text-neutral-400"
          } ${!currentUserId ? "opacity-40" : ""}`}
        >
          自分の辞書
        </button>
      </div>

      {/* キーワード検索フォーム */}
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="単語を検索..."
            className="flex-1 rounded-full border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-900 transition-colors"
          />
          <button
            type="submit"
            className="rounded-full bg-neutral-900 text-white px-5 py-2.5 text-sm font-medium"
          >
            検索
          </button>
        </div>
      </form>

      {/* 検索結果 */}
      {isPending && (
        <p className="text-center text-xs text-neutral-300 py-8">検索中...</p>
      )}

      {!isPending && searched && results && results.length === 0 && (
        <p className="text-center text-sm text-neutral-400 py-16">
          「{keyword}」に一致する単語は見つかりませんでした
        </p>
      )}

      {!isPending && !searched && (
        <p className="text-center text-sm text-neutral-300 py-16">
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
