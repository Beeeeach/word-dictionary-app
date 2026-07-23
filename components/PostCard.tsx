import Image from "next/image";
import Link from "next/link";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";
import { LikeButton } from "@/components/LikeButton";
import { ReactionTags } from "@/components/ReactionTags";
import { CommentSection } from "@/components/CommentSection";
import { PollCard } from "@/components/PollCard";

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  return new Date(dateString).toLocaleDateString("ja-JP");
}

export function PostCard({
  post,
  currentUserId,
  allEmotionTags,
}: {
  post: PostWithRelations;
  currentUserId: string | null;
  allEmotionTags: EmotionTag[];
}) {
  const authorName = post.users?.display_name || post.users?.username || "名無し";
  const posterTags = post.post_emotion_tags?.map((t) => t.emotion_tags) ?? [];

  return (
    <article
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
    >
      {/* ヘッダー: 投稿者・時刻・非公開バッジ */}
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-slate-light)" }}>
        <Link
          href={`/u/${post.users?.username}`}
          className="flex items-center gap-2 min-w-0"
        >
          {post.users?.avatar_url ? (
            <Image
              src={post.users.avatar_url}
              alt=""
              width={20}
              height={20}
              className="rounded-full shrink-0"
            />
          ) : (
            <div
              className="w-5 h-5 rounded-full shrink-0"
              style={{ background: "var(--color-line)" }}
            />
          )}
          <span className="font-bold truncate" style={{ color: "var(--color-slate)" }}>
            {authorName}
          </span>
          <span className="shrink-0">・{timeAgo(post.created_at)}</span>
        </Link>
        {post.visibility === "private" && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0"
            style={{ background: "var(--color-line)", color: "var(--color-slate)" }}
          >
            非公開
          </span>
        )}
      </div>

      {/* 単語（またはpoll_typeが投票の場合は投票タイトル） */}
      <h2
        className="text-2xl font-extrabold leading-snug"
        style={{ color: "var(--color-ink)" }}
      >
        {post.post_type === "poll" && "🗳️ "}
        {post.word}
      </h2>

      {post.post_type === "poll" && post.poll ? (
        <PollCard
          postId={post.id}
          closesAt={post.poll.closesAt}
          options={post.poll.options}
          myVoteOptionId={post.poll.myVoteOptionId}
          totalVotes={post.poll.totalVotes}
          disabled={!currentUserId}
        />
      ) : (
        <>
          {/* 投稿者が付けた感情タグ */}
          {posterTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {posterTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ background: "#FFF0EC", color: "var(--color-coral-dark)" }}
                >
                  {tag.emoji} {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* 意味（入力があれば表示） */}
          {post.meaning && (
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-ink)" }}>
              {post.meaning}
            </p>
          )}

          {/* 出会った文脈（入力があれば表示） */}
          {post.context && (
            <p
              className="text-xs whitespace-pre-wrap border-l-2 pl-3"
              style={{ color: "var(--color-slate)", borderColor: "var(--color-line)" }}
            >
              {post.context}
            </p>
          )}

          {/* 写真（入力があれば表示） */}
          {post.photo_url && (
            <div className="rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.photo_url}
                alt={post.word}
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
        </>
      )}

      {/* 閲覧者による反応タグ */}
      <ReactionTags
        postId={post.id}
        allTags={allEmotionTags}
        initialSummary={post.reaction_summary ?? []}
        initialMyTagIds={post.my_reaction_tag_ids ?? []}
        disabled={!currentUserId}
      />

      {/* フッター: いいね・コメント */}
      <div
        className="flex items-center gap-4 pt-2 border-t"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="pt-2">
          <LikeButton
            postId={post.id}
            initialCount={post.like_count}
            initiallyLiked={post.liked_by_me ?? false}
            disabled={!currentUserId}
          />
        </div>
        <div className="pt-2 flex-1">
          <CommentSection
            postId={post.id}
            commentCount={post.comment_count}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </article>
  );
}
