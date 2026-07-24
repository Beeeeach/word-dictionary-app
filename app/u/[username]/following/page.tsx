import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getUserByUsername } from "@/lib/data/dictionary";
import { getFollowingUsers } from "@/lib/data/follows";
import { UserList } from "@/components/UserList";
import { BottomTabBar } from "@/components/BottomTabBar";

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [viewer, profile] = await Promise.all([
    getCurrentUser(),
    getUserByUsername(username),
  ]);

  if (!viewer) {
    redirect("/login");
  }
  if (!profile) {
    notFound();
  }

  const following = await getFollowingUsers(profile.id);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2 flex items-center gap-3">
        <Link href={`/u/${profile.username}`} className="text-sm font-bold" style={{ color: "var(--color-slate)" }}>
          ← もどる
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          {profile.display_name || profile.username} のフォロー中
        </h1>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-4">
        <UserList users={following} />
      </main>

      <BottomTabBar />
    </div>
  );
}
