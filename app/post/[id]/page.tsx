import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import { getPostById } from "@/lib/data/posts";
import { getReactionTags } from "@/lib/data/emotion-tags";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isFollowing } from "@/lib/data/follows";
import { PostCard } from "@/components/PostCard";
import { BottomTabBar } from "@/components/BottomTabBar";
import { ShareButton } from "./ShareButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id, null);

  if (!post) {
    return { title: "投稿が見つかりません | DicDic" };
  }

  return {
    title: `${post.word} | DicDic`,
    description: post.meaning || "DicDicで見つけた言葉",
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 閲覧者の反応タグ(絵文字リアクション、category = null)のみを取得する。
  // 投稿者向けのカテゴリタグ(テーマ/感情/目的/雰囲気/形式/対象/シーン)は
  // ReactionTagsコンポーネントの選択肢には含めない。
  const [user, reactionTags, profile] = await Promise.all([
    getCurrentUser(),
    getReactionTags(),
    getCurrentUserProfile(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const learnerMode = profile?.learner_mode ?? false;
  const t = getDictionary(learnerMode);

  const post = await getPostById(id, user.id);
  if (!post) {
    notFound();
  }

  // 投稿詳細ページでのみ、投稿カードにフォローボタンを表示する
  // (企画: フィード・検索結果では出さず、詳細ページに限定する)。
  const followingAuthor = await isFollowing(user.id, post.user_id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const shareUrl = `${siteUrl}/post/${post.id}`;

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2 flex items-center gap-3">
        <Link href="/" className="text-sm font-bold" style={{ color: "var(--color-slate)" }}>
          {t.common.back}
        </Link>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-4 space-y-4">
        <PostCard
          post={post}
          currentUserId={user.id}
          allEmotionTags={reactionTags}
          learnerMode={learnerMode}
          showFollowButton
          initiallyFollowingAuthor={followingAuthor}
        />
        <ShareButton word={post.word} shareUrl={shareUrl} learnerMode={learnerMode} />
      </main>

      <BottomTabBar learnerMode={learnerMode} />
    </div>
  );
}
