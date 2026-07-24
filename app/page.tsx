import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getFeedPosts } from "@/lib/data/posts";
import { getEmotionTags } from "@/lib/data/emotion-tags";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { Feed } from "@/components/Feed";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";

/**
 * ホーム画面。企画書7-4章:
 * 上部に「フォロー中/おすすめ」切り替えタブ、デフォルトは「おすすめ」。
 * 下部にタブバー(ホーム・検索・投稿・自分の辞書・プロフィール)。
 */
export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [{ posts, hasMore }, emotionTags, unreadCount] = await Promise.all([
    getFeedPosts(user.id, { sort: "recommended", page: 0 }),
    getEmotionTags(),
    getUnreadNotificationCount(user.id),
  ]);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2 flex items-center justify-between">
        <Logo size="md" />
        <NotificationBell unreadCount={unreadCount} />
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-4">
        <Feed
          initialPosts={posts}
          initialHasMore={hasMore}
          currentUserId={user.id}
          allEmotionTags={emotionTags}
        />
      </main>

      <BottomTabBar />
    </div>
  );
}
