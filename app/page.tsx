import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createClient } from "@/lib/supabase/server";
import { getFeedPosts } from "@/lib/data/posts";
import { getEmotionTags } from "@/lib/data/emotion-tags";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { Feed } from "@/components/Feed";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { StreakBadge } from "@/components/StreakBadge";

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

  const supabase = await createClient();

  const [{ posts, hasMore }, emotionTags, unreadCount, { data: streakData }] =
    await Promise.all([
      getFeedPosts(user.id, { sort: "recommended", page: 0 }),
      getEmotionTags(),
      getUnreadNotificationCount(user.id),
      supabase
        .from("users")
        .select("current_streak")
        .eq("id", user.id)
        .single<{ current_streak: number }>(),
    ]);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <StreakBadge currentStreak={streakData?.current_streak ?? 0} />
          <NotificationBell unreadCount={unreadCount} />
        </div>
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
