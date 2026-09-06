"use client";

import { useState, useTransition } from "react";
import { PostCard } from "@/components/PostCard";
import { searchMyDictionary } from "@/lib/actions/search";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";
import { getDictionary } from "@/lib/i18n/dictionary";

export function MyDictionaryView({
  userId,
  initialPosts,
  allEmotionTags,
  learnerMode = false,
}: {
  userId: string;
  initialPosts: PostWithRelations[];
  allEmotionTags: EmotionTag[];
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);
  const [keyword, setKeyword] = useState("");
  const [posts, setPosts] = useState(initialPosts);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await searchMyDictionary(keyword);
      // 空欄で検索した場合は全件（初期表示）に戻す
      setPosts(keyword.trim() ? result : initialPosts);
    });
  }

  return (
    <div>
      {/* 自分の辞書内のキーワード検索 */}
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t.myDictionary.searchPlaceholder}
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
            {t.myDictionary.searchButton}
          </button>
        </div>
      </form>

      {isPending && (
        <p className="text-center text-xs py-8" style={{ color: "var(--color-slate-light)" }}>
          {t.myDictionary.searching}
        </p>
      )}

      {!isPending && posts.length === 0 && (
        <p className="text-center text-sm py-16" style={{ color: "var(--color-slate)" }}>
          {keyword.trim() ? t.myDictionary.noResultsFor(keyword) : t.myDictionary.empty}
        </p>
      )}

      {!isPending && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              allEmotionTags={allEmotionTags}
              learnerMode={learnerMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
