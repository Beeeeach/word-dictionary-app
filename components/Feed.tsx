"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { TabBar } from "@/components/TabBar";
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
      <TabBar
        tabs={[
          { key: "recommended", label: "おすすめ" },
          { key: "recent", label: "フォロー中" },
        ]}
        active={sort}
        onChange={(key) => handleSortChange(key as FeedSort)}
      />

      {posts.length === 0 && !loading ? (
        <p className="text-center text-sm py-16" style={{ color: "var(--color-slate)" }}>
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
        <p className="text-center text-xs py-4" style={{ color: "var(--color-slate-light)" }}>
          読み込み中...
        </p>
      )}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs py-4" style={{ color: "var(--color-slate-light)" }}>
          すべての投稿を表示しました
        </p>
      )}
    </div>
  );
}
