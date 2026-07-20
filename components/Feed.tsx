"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { fetchMoreFeedPosts } from "@/lib/actions/feed";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";
import type { FeedSort } from "@/lib/data/posts";

export function Feed({
  initialPosts,
  initialHasMore,
  currentUserId,
  allEmotionTags,
}: {
  initialPosts: PostWithRelations[];
  initialHasMore: boolean;
  currentUserId: string | null;
  allEmotionTags: EmotionTag[];
}) {
  const [sort, setSort] = useState<FeedSort>("recommended");
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // タブ切り替え時: 一覧をリセットして1ページ目を取り直す
  async function handleSortChange(next: FeedSort) {
    if (next === sort) return;
    setSort(next);
    setLoading(true);
    const result = await fetchMoreFeedPosts(next, 0);
    setPosts(result.posts);
    setHasMore(result.hasMore);
    setPage(0);
    setLoading(false);
  }

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    const result = await fetchMoreFeedPosts(sort, nextPage);
    setPosts((prev) => [...prev, ...result.posts]);
    setHasMore(result.hasMore);
    setPage(nextPage);
    setLoading(false);
  }, [loading, hasMore, page, sort]);

  // 画面下端の監視要素が見えたら次ページを読み込む
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
      {/* おすすめ/フォロー中 切り替えタブ */}
      <div className="flex mb-5 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => handleSortChange("recommended")}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            sort === "recommended"
              ? "text-neutral-900 border-b-2 border-neutral-900"
              : "text-neutral-400"
          }`}
        >
          おすすめ
        </button>
        <button
          type="button"
          onClick={() => handleSortChange("recent")}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            sort === "recent"
              ? "text-neutral-900 border-b-2 border-neutral-900"
              : "text-neutral-400"
          }`}
        >
          フォロー中
        </button>
      </div>

      {posts.length === 0 && !loading ? (
        <p className="text-center text-sm text-neutral-400 py-16">
          まだ投稿がありません。最初の単語を投稿してみましょう。
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              allEmotionTags={allEmotionTags}
            />
          ))}
        </div>
      )}

      {/* 無限スクロール監視用の要素 */}
      <div ref={sentinelRef} className="h-10" />

      {loading && (
        <p className="text-center text-xs text-neutral-300 py-4">
          読み込み中...
        </p>
      )}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-neutral-300 py-4">
          すべての投稿を表示しました
        </p>
      )}
    </div>
  );
}
