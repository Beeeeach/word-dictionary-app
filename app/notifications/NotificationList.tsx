"use client";

import { useEffect } from "react";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { NotificationItem } from "@/components/NotificationItem";
import type { NotificationWithActor } from "@/lib/data/notifications";
import { getDictionary } from "@/lib/i18n/dictionary";

export function NotificationList({
  notifications,
  learnerMode = false,
}: {
  notifications: NotificationWithActor[];
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);

  // ページを開いた時点で未読を全部既読にする
  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  if (notifications.length === 0) {
    return (
      <p className="text-center text-sm py-16" style={{ color: "var(--color-slate)" }}>
        {t.notifications.empty}
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
          <NotificationItem notification={n} learnerMode={learnerMode} />
        </div>
      ))}
    </div>
  );
}
