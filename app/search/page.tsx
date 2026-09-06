import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import { getReactionTags } from "@/lib/data/emotion-tags";
import { getTrendingWords } from "@/lib/data/trending";
import { getDictionary } from "@/lib/i18n/dictionary";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SearchView } from "./SearchView";

/**
 * 検索ページ。企画書7-3章:
 * 「自分の辞書」と「みんなの辞書」をタブで切り替え。
 * 検索はキーワード検索を中心とし、同じ単語の複数投稿も名寄せせず個別カード表示。
 * 左カラムには急上昇ワードTOP5を表示する。
 *
 * PostCardに渡すタグは閲覧者の反応タグ(絵文字リアクション)のみ。
 */
export default async function SearchPage() {
  const [user, reactionTags, trendingWords, profile] = await Promise.all([
    getCurrentUser(),
    getReactionTags(),
    getTrendingWords(5),
    getCurrentUserProfile(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const learnerMode = profile?.learner_mode ?? false;
  const t = getDictionary(learnerMode);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-xl mx-auto w-full px-4 pt-6 pb-2">
        <h1 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          {t.search.title}
        </h1>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 pb-4">
        <SearchView
          currentUserId={user.id}
          allEmotionTags={reactionTags}
          trendingWords={trendingWords}
          learnerMode={learnerMode}
        />
      </main>

      <BottomTabBar learnerMode={learnerMode} />
    </div>
  );
}
