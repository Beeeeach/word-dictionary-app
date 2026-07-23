import Image from "next/image";
import Link from "next/link";
import type { NotificationWithActor } from "@/lib/data/notifications";

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  return `${Math.floor(diffHour / 24)}日前`;
}

const TYPE_LABEL: Record<NotificationWithActor["type"], string> = {
  like: "さんがいいねしました",
  reaction: "さんが反応しました",
  comment: "さんがコメントしました",
  follow: "さんにフォローされました",
};

const TYPE_ICON: Record<NotificationWithActor["type"], string> = {
  like: "❤️",
  reaction: "✨",
  comment: "💬",
  follow: "👤",
};

export function NotificationItem({
  notification,
}: {
  notification: NotificationWithActor;
}) {
  const name =
    notification.actor.display_name ||
    notification.actor.username ||
    "名無し";

  const content = (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02]"
      style={{
        background: notification.is_read
          ? "transparent"
          : "var(--color-paper-raised)",
      }}
    >
      <span className="text-lg shrink-0">{TYPE_ICON[notification.type]}</span>
      <div
        className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: "var(--color-line)" }}
      >
        {notification.actor.avatar_url ? (
          <Image
            src={notification.actor.avatar_url}
            alt=""
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm">👤</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: "var(--color-ink)" }}>
          <span className="font-bold">{name}</span>
          {TYPE_LABEL[notification.type]}
          {notification.post_word && (
            <span style={{ color: "var(--color-slate)" }}>
              {" "}
              「{notification.post_word}」
            </span>
          )}
        </p>
        <p className="text-xs" style={{ color: "var(--color-slate-light)" }}>
          {timeAgo(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: "var(--color-coral)" }}
        />
      )}
    </div>
  );

  if (notification.type === "follow") {
    return <Link href={`/u/${notification.actor.username}`}>{content}</Link>;
  }

  // 投稿系の通知は、現状は投稿単体ページが無いためホームへ遷移する
  return <Link href="/">{content}</Link>;
}
