import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFeedPosts } from "@/lib/data/posts";
import { getEmotionTags } from "@/lib/data/emotion-tags";
import { Feed } from "@/components/Feed";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Logo } from "@/components/Logo";

/**
 * ホーム画面。企画書7-4章:
 * 上部に「フォロー中/おすすめ」切り替えタブ、デフォルトは「おすすめ」。
 * 下部にタブバー(ホーム・検索・投稿・自分の辞書・プロフィール)。
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ posts, hasMore }, emotionTags] = await Promise.all([
    getFeedPosts(user.id, { sort: "recommended", page: 0 }),
    getEmotionTags(),
  ]);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2">
        <Logo size="md" />
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
