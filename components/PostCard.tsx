import Image from "next/image";
import type { EmotionTag, PostWithRelations } from "@/lib/types/database.types";
import { LikeButton } from "@/components/LikeButton";
import { ReactionTags } from "@/components/ReactionTags";
import { CommentSection } from "@/components/CommentSection";

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
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
      {/* ヘッダー: 投稿者・時刻・非公開バッジ */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          {post.users?.avatar_url ? (
            <Image
              src={post.users.avatar_url}
              alt=""
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-neutral-200" />
          )}
          <span className="text-neutral-600 font-medium">{authorName}</span>
          <span>・{timeAgo(post.created_at)}</span>
        </div>
        {post.visibility === "private" && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
            非公開
          </span>
        )}
      </div>

      {/* 単語（最も強調） */}
      <h2 className="text-2xl font-bold text-neutral-900 leading-snug">
        {post.word}
      </h2>

      {/* 投稿者が付けた感情タグ */}
      {posterTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {posterTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs text-orange-700"
            >
              {tag.emoji} {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* 意味（入力があれば表示） */}
      {post.meaning && (
        <p className="text-sm text-neutral-700 whitespace-pre-wrap">
          {post.meaning}
        </p>
      )}

      {/* 出会った文脈（入力があれば表示） */}
      {post.context && (
        <p className="text-xs text-neutral-400 whitespace-pre-wrap border-l-2 border-neutral-200 pl-3">
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

      {/* 閲覧者による反応タグ */}
      <ReactionTags
        postId={post.id}
        allTags={allEmotionTags}
        initialSummary={post.reaction_summary ?? []}
        initialMyTagIds={post.my_reaction_tag_ids ?? []}
        disabled={!currentUserId}
      />

      {/* フッター: いいね・コメント */}
      <div className="flex items-center gap-4 pt-2 border-t border-neutral-100">
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
