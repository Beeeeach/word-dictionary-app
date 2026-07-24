import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getMyPosts, getMyDictionaryStats } from "@/lib/data/dictionary";
import { getEmotionTags } from "@/lib/data/emotion-tags";
import { BottomTabBar } from "@/components/BottomTabBar";
import { DictionaryStats } from "@/components/DictionaryStats";
import { MyDictionaryView } from "./MyDictionaryView";

/**
 * 自分の辞書ページ。企画書7-3章:
 * 登録単語数・もらった反応数・カテゴリ数などの統計サマリーを表示し、
 * 蓄積している実感を持たせる。
 */
export default async function MyDictionaryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [posts, stats, emotionTags] = await Promise.all([
    getMyPosts(user.id),
    getMyDictionaryStats(user.id),
    getEmotionTags(),
  ]);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2">
        <h1 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          自分の辞書
        </h1>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-4">
        <DictionaryStats
          wordCount={stats.wordCount}
          reactionCount={stats.reactionCount}
          categoryCount={stats.categoryCount}
        />
        <MyDictionaryView
          userId={user.id}
          initialPosts={posts}
          allEmotionTags={emotionTags}
        />
      </main>

      <BottomTabBar />
    </div>
  );
}
