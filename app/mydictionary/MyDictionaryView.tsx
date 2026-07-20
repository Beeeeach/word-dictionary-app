"use client";

import { useState, useTransition } from "react";
import { PostCard } from "@/components/PostCard";
import { searchMyDictionary } from "@/lib/actions/search";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";

export function MyDictionaryView({
  userId,
  initialPosts,
  allEmotionTags,
}: {
  userId: string;
  initialPosts: PostWithRelations[];
  allEmotionTags: EmotionTag[];
}) {
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
            placeholder="自分の辞書から検索..."
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

      {isPending && (
        <p className="text-center text-xs text-neutral-300 py-8">検索中...</p>
      )}

      {!isPending && posts.length === 0 && (
        <p className="text-center text-sm text-neutral-400 py-16">
          {keyword.trim()
            ? `「${keyword}」に一致する単語は見つかりませんでした`
            : "まだ単語を投稿していません。最初の単語を投稿してみましょう。"}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
