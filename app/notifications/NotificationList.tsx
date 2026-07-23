"use client";

import { useEffect } from "react";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { NotificationItem } from "@/components/NotificationItem";
import type { NotificationWithActor } from "@/lib/data/notifications";

export function NotificationList({
  notifications,
}: {
  notifications: NotificationWithActor[];
}) {
  // ページを開いた時点で未読を全部既読にする
  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  if (notifications.length === 0) {
    return (
      <p className="text-center text-sm py-16" style={{ color: "var(--color-slate)" }}>
        まだ通知がありません
      </p>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--color-line)" }}
    >
      {notifications.map((n, i) => (
        <div
          key={n.id}
          style={
            i > 0 ? { borderTop: "1px solid var(--color-line)" } : undefined
          }
        >
          <NotificationItem notification={n} />
        </div>
      ))}
    </div>
  );
}
