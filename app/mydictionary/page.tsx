import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import { getMyPosts, getMyDictionaryStats } from "@/lib/data/dictionary";
import { getReactionTags } from "@/lib/data/emotion-tags";
import { getDictionary } from "@/lib/i18n/dictionary";
import { BottomTabBar } from "@/components/BottomTabBar";
import { DictionaryStats } from "@/components/DictionaryStats";
import { MyDictionaryView } from "./MyDictionaryView";

/**
 * 自分の辞書ページ。企画書7-3章:
 * 登録単語数・もらった反応数・カテゴリ数などの統計サマリーを表示し、
 * 蓄積している実感を持たせる。
 *
 * 英語学習者モードがオンの場合、一覧は英語投稿(単語がアルファベットのみ)
 * のみに絞られ、UI文言も英語になる。
 */
export default async function MyDictionaryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  const learnerMode = profile?.learner_mode ?? false;
  const t = getDictionary(learnerMode);

  const [posts, stats, reactionTags] = await Promise.all([
    getMyPosts(user.id, undefined, learnerMode),
    getMyDictionaryStats(user.id),
    getReactionTags(),
  ]);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2">
        <h1 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          {t.myDictionary.title}
        </h1>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-4">
        <DictionaryStats
          wordCount={stats.wordCount}
          reactionCount={stats.reactionCount}
          categoryCount={stats.categoryCount}
          learnerMode={learnerMode}
        />
        <MyDictionaryView
          userId={user.id}
          initialPosts={posts}
          allEmotionTags={reactionTags}
          learnerMode={learnerMode}
        />
      </main>

      <BottomTabBar learnerMode={learnerMode} />
    </div>
  );
}
