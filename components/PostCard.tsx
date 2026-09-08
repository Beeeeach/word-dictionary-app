"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getTagDisplayName } from "@/lib/data/emotion-tags";
import { LikeButton } from "@/components/LikeButton";
import { ReactionTags } from "@/components/ReactionTags";
import { CommentSection } from "@/components/CommentSection";
import { PollCard } from "@/components/PollCard";
import { PostCardMenu } from "@/components/PostCardMenu";
import { FollowButton } from "@/components/FollowButton";

function timeAgo(dateString: string, learnerMode: boolean): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (learnerMode) {
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(dateString).toLocaleDateString("en-US");
  }

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  return new Date(dateString).toLocaleDateString("ja-JP");
}

/**
 * カード内の対話要素(リンク・ボタン・フォーム)をラップし、
 * クリックがカード全体のonClickまで伝播しないようにするための薄いラッパー。
 * カード全体をタップ可能にしつつ、内部のいいね・コメント・Weblioリンク等が
 * 意図せず投稿詳細への遷移を引き起こさないようにするために必要。
 */
function StopPropagation({ children }: { children: React.ReactNode }) {
  return (
    <div onClick={(e) => e.stopPropagation()} className="contents">
      {children}
    </div>
  );
}

export function PostCard({
  post,
  currentUserId,
  allEmotionTags,
  learnerMode = false,
  initiallyFollowingAuthor = false,
  showFollowButton = false,
}: {
  post: PostWithRelations;
  currentUserId: string | null;
  allEmotionTags: EmotionTag[];
  /** 英語学習者モード。true の場合、投稿カード内の文言(時刻表示・非公開バッジ等)も英語になる */
  learnerMode?: boolean;
  /**
   * 投稿者を自分が既にフォロー中かどうか。
   * 投稿詳細ページなど、事前にフォロー関係を取得できる画面から渡す。
   */
  initiallyFollowingAuthor?: boolean;
  /**
   * 投稿者へのフォローボタンをヘッダーに表示するかどうか。
   * フィード・検索結果など一覧表示では出さず、投稿詳細ページ
   * (app/post/[id]/page.tsx)でのみ true を渡す運用とする。
   * (一覧側でフォロー中IDを都度取得するコストを避けるため)
   */
  showFollowButton?: boolean;
}) {
  const router = useRouter();
  const t = getDictionary(learnerMode);
  const authorName =
    post.users?.display_name || post.users?.username || (learnerMode ? "Anonymous" : "名無し");
  const posterTags = post.post_emotion_tags?.map((pt) => pt.emotion_tags) ?? [];
  const isOwnPost = currentUserId === post.user_id;

  return (
    <article
      onClick={() => router.push(`/post/${post.id}`)}
      className="rounded-2xl p-5 space-y-3 cursor-pointer transition-colors hover:bg-black/[0.015]"
      style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
    >
      {/* ヘッダー: 投稿者・時刻・フォローボタン・非公開バッジ・メニュー */}
      <div className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--color-slate-light)" }}>
        <StopPropagation>
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
            <span className="shrink-0">・{timeAgo(post.created_at, learnerMode)}</span>
          </Link>
        </StopPropagation>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* 投稿者を自分がフォローしていなければ、投稿詳細ページから直接フォローできるようにする */}
          {showFollowButton && currentUserId && !isOwnPost && (
            <StopPropagation>
              <FollowButton
                targetUserId={post.user_id}
                initiallyFollowing={initiallyFollowingAuthor}
                size="sm"
                learnerMode={learnerMode}
              />
            </StopPropagation>
          )}

          {post.visibility === "private" && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0"
              style={{ background: "var(--color-line)", color: "var(--color-slate)" }}
            >
              {t.postCard.private}
            </span>
          )}

          <StopPropagation>
            <PostCardMenu
              postId={post.id}
              postAuthorId={post.user_id}
              currentUserId={currentUserId}
              learnerMode={learnerMode}
            />
          </StopPropagation>
        </div>
      </div>

      {/* 単語（またはpoll_typeが投票の場合は投票タイトル） */}
      <div className="flex items-baseline justify-between gap-2">
        <h2
          className="text-2xl font-extrabold leading-snug"
          style={{ color: "var(--color-ink)" }}
        >
          {post.post_type === "poll" && "🗳️ "}
          {post.word}
        </h2>
        {post.post_type !== "poll" && (
          <StopPropagation>
            <a
              href={`https://www.weblio.jp/content/${encodeURIComponent(post.word)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs"
              style={{ color: "var(--color-slate-light)" }}
              title="Weblio辞書で調べる"
            >
              {t.post.weblioLink}
            </a>
          </StopPropagation>
        )}
      </div>

      {post.post_type === "poll" && post.poll ? (
        <StopPropagation>
          <PollCard
            postId={post.id}
            closesAt={post.poll.closesAt}
            options={post.poll.options}
            myVoteOptionId={post.poll.myVoteOptionId}
            totalVotes={post.poll.totalVotes}
            disabled={!currentUserId}
            learnerMode={learnerMode}
          />
        </StopPropagation>
      ) : (
        <>
          {/* 投稿者が付けたタグ（テーマ/感情/目的/雰囲気/形式/対象/シーン、#表記） */}
          {posterTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {posterTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ background: "#FFF0EC", color: "var(--color-coral-dark)" }}
                >
                  #{getTagDisplayName(tag, learnerMode)}
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

          {/* ひとこと（入力があれば表示。「出会った文脈」項目は廃止したため、noteのみ表示する） */}
          {post.note && (
            <p
              className="text-xs whitespace-pre-wrap"
              style={{ color: "var(--color-slate)" }}
            >
              {post.note}
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
      <StopPropagation>
        <ReactionTags
          postId={post.id}
          allTags={allEmotionTags}
          initialSummary={post.reaction_summary ?? []}
          initialMyTagIds={post.my_reaction_tag_ids ?? []}
          disabled={!currentUserId}
          learnerMode={learnerMode}
        />
      </StopPropagation>

      {/* フッター: いいね・コメント */}
      {/* UI改善: いいねボタンは以前 pt-2 の余白の中に埋もれてタップしづらかったため、
          コメント欄と同じ行の高さに正しく揃え、ボタン自体の当たり判定も
          LikeButton側で拡張する。border-topの直下に十分な余白(py-1)を持たせ、
          指の腹でも押しやすい縦位置に調整した。 */}
      <StopPropagation>
        <div
          className="flex items-center gap-1 pt-3 mt-1 border-t"
          style={{ borderColor: "var(--color-line)" }}
        >
          <LikeButton
            postId={post.id}
            initialCount={post.like_count}
            initiallyLiked={post.liked_by_me ?? false}
            disabled={!currentUserId}
            learnerMode={learnerMode}
          />
          <div className="flex-1 min-w-0">
            <CommentSection
              postId={post.id}
              commentCount={post.comment_count}
              currentUserId={currentUserId}
              learnerMode={learnerMode}
            />
          </div>
        </div>
      </StopPropagation>
    </article>
  );
}
