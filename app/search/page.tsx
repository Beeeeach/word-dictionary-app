import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getEmotionTags } from "@/lib/data/emotion-tags";
import { getTrendingWords } from "@/lib/data/trending";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SearchView } from "./SearchView";

/**
 * 検索ページ。企画書7-3章:
 * 「自分の辞書」と「みんなの辞書」をタブで切り替え。
 * 検索はキーワード検索を中心とし、同じ単語の複数投稿も名寄せせず個別カード表示。
 * 左カラムには急上昇ワードTOP5を表示する。
 */
export default async function SearchPage() {
  const [user, emotionTags, trendingWords] = await Promise.all([
    getCurrentUser(),
    getEmotionTags(),
    getTrendingWords(5),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-xl mx-auto w-full px-4 pt-6 pb-2">
        <h1 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          検索
        </h1>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 pb-4">
        <SearchView
          currentUserId={user.id}
          allEmotionTags={emotionTags}
          trendingWords={trendingWords}
        />
      </main>

      <BottomTabBar />
    </div>
  );
}
