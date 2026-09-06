import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import {
  getUserByUsername,
  getPublicPostsByUser,
  getPublicDictionaryStats,
} from "@/lib/data/dictionary";
import { getReactionTags } from "@/lib/data/emotion-tags";
import { isFollowing, getFollowCounts } from "@/lib/data/follows";
import { getDictionary } from "@/lib/i18n/dictionary";
import { DictionaryStats } from "@/components/DictionaryStats";
import { PostCard } from "@/components/PostCard";
import { BottomTabBar } from "@/components/BottomTabBar";
import { FollowButton } from "@/components/FollowButton";
import { BlockButton } from "@/components/BlockButton";
import { isBlocking as checkIsBlocking } from "@/lib/actions/blocks";

/**
 * 他人(または自分)の公開プロフィール・辞書ページ。
 * /u/[username] でアクセスする。
 * 投稿カードの投稿者名・アイコンからここへ遷移する導線を想定。
 *
 * PostCardに渡すタグは閲覧者の反応タグ(絵文字リアクション、category = null)
 * のみ。投稿者向けカテゴリタグは投稿作成画面専用のため含めない。
 *
 * 学習者モードは「閲覧者(自分)」の設定を使ってUI言語・フィルタを決める。
 */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [viewer, profile, viewerProfile] = await Promise.all([
    getCurrentUser(),
    getUserByUsername(username),
    getCurrentUserProfile(),
  ]);

  if (!viewer) {
    redirect("/login");
  }
  if (!profile) {
    notFound();
  }

  const learnerMode = viewerProfile?.learner_mode ?? false;
  const t = getDictionary(learnerMode);
  const isOwnProfile = profile.id === viewer.id;

  const [posts, stats, reactionTags, following, followCounts, blocked] = await Promise.all([
    getPublicPostsByUser(profile.id, viewer.id, learnerMode),
    getPublicDictionaryStats(profile.id),
    getReactionTags(),
    isFollowing(viewer.id, profile.id),
    getFollowCounts(profile.id),
    checkIsBlocking(viewer.id, profile.id),
  ]);

  const displayName = profile.display_name || profile.username;

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* プロフィールヘッダー */}
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: "var(--color-line)" }}
          >
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="text-lg font-extrabold truncate"
              style={{ color: "var(--color-ink)" }}
            >
              {displayName}
            </h1>
            <p className="text-xs" style={{ color: "var(--color-slate-light)" }}>
              @{profile.username}
            </p>
          </div>
          {!isOwnProfile && (
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              <FollowButton
                targetUserId={profile.id}
                initiallyFollowing={following}
                learnerMode={learnerMode}
              />
              <BlockButton
                targetUserId={profile.id}
                initiallyBlocked={blocked}
                learnerMode={learnerMode}
              />
            </div>
          )}
        </div>

        {/* 自己紹介 */}
        {profile.bio && (
          <p
            className="text-sm whitespace-pre-wrap mb-3"
            style={{ color: "var(--color-ink)" }}
          >
            {profile.bio}
          </p>
        )}

        {/* フォロワー数・フォロー中数（タップで一覧へ） */}
        <div className="flex gap-4 mb-6 text-sm">
          <Link href={`/u/${profile.username}/followers`}>
            <span style={{ color: "var(--color-slate)" }}>
              <span className="font-bold" style={{ color: "var(--color-ink)" }}>
                {followCounts.followerCount}
              </span>{" "}
              {t.profile.followers}
            </span>
          </Link>
          <Link href={`/u/${profile.username}/following`}>
            <span style={{ color: "var(--color-slate)" }}>
              <span className="font-bold" style={{ color: "var(--color-ink)" }}>
                {followCounts.followingCount}
              </span>{" "}
              {t.profile.following}
            </span>
          </Link>
        </div>

        <DictionaryStats
          wordCount={stats.wordCount}
          reactionCount={stats.reactionCount}
          categoryCount={stats.categoryCount}
          learnerMode={learnerMode}
        />

        {posts.length === 0 ? (
          <p className="text-center text-sm py-16" style={{ color: "var(--color-slate)" }}>
            {t.publicProfile.noPublicPosts}
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={viewer.id}
                allEmotionTags={reactionTags}
                learnerMode={learnerMode}
              />
            ))}
          </div>
        )}
      </main>
      <BottomTabBar learnerMode={learnerMode} />
    </div>
  );
}
