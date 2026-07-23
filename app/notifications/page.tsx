import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/data/notifications";
import { BottomTabBar } from "@/components/BottomTabBar";
import { NotificationList } from "./NotificationList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const notifications = await getNotifications(user.id);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2 flex items-center gap-3">
        <Link href="/" className="text-sm font-bold" style={{ color: "var(--color-slate)" }}>
          ← もどる
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          通知
        </h1>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-4">
        <NotificationList notifications={notifications} />
      </main>

      <BottomTabBar />
    </div>
  );
}
