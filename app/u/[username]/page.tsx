import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getUserByUsername,
  getPublicPostsByUser,
  getPublicDictionaryStats,
} from "@/lib/data/dictionary";
import { getEmotionTags } from "@/lib/data/emotion-tags";
import { isFollowing, getFollowCounts } from "@/lib/data/follows";
import { DictionaryStats } from "@/components/DictionaryStats";
import { PostCard } from "@/components/PostCard";
import { BottomTabBar } from "@/components/BottomTabBar";
import { FollowButton } from "@/components/FollowButton";

/**
 * 他人(または自分)の公開プロフィール・辞書ページ。
 * /u/[username] でアクセスする。
 * 投稿カードの投稿者名・アイコンからここへ遷移する導線を想定。
 */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  if (!viewer) {
    redirect("/login");
  }

  const profile = await getUserByUsername(username);
  if (!profile) {
    notFound();
  }

  const isOwnProfile = profile.id === viewer.id;

  const [posts, stats, emotionTags, following, followCounts] = await Promise.all([
    getPublicPostsByUser(profile.id, viewer.id),
    getPublicDictionaryStats(profile.id),
    getEmotionTags(),
    isFollowing(viewer.id, profile.id),
    getFollowCounts(profile.id),
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
            <FollowButton targetUserId={profile.id} initiallyFollowing={following} />
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
              フォロワー
            </span>
          </Link>
          <Link href={`/u/${profile.username}/following`}>
            <span style={{ color: "var(--color-slate)" }}>
              <span className="font-bold" style={{ color: "var(--color-ink)" }}>
                {followCounts.followingCount}
              </span>{" "}
              フォロー中
            </span>
          </Link>
        </div>

        <DictionaryStats
          wordCount={stats.wordCount}
          reactionCount={stats.reactionCount}
          categoryCount={stats.categoryCount}
        />

        {posts.length === 0 ? (
          <p className="text-center text-sm py-16" style={{ color: "var(--color-slate)" }}>
            まだ公開されている投稿がありません
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={viewer.id}
                allEmotionTags={emotionTags}
              />
            ))}
          </div>
        )}
      </main>
      <BottomTabBar />
    </div>
  );
}
