import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import { getNotifications } from "@/lib/data/notifications";
import { getDictionary } from "@/lib/i18n/dictionary";
import { BottomTabBar } from "@/components/BottomTabBar";
import { NotificationList } from "./NotificationList";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  const learnerMode = profile?.learner_mode ?? false;
  const t = getDictionary(learnerMode);

  const notifications = await getNotifications(user.id);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2 flex items-center gap-3">
        <Link href="/" className="text-sm font-bold" style={{ color: "var(--color-slate)" }}>
          {t.common.back}
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          {t.notifications.title}
        </h1>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-4">
        <NotificationList notifications={notifications} learnerMode={learnerMode} />
      </main>

      <BottomTabBar learnerMode={learnerMode} />
    </div>
  );
}
