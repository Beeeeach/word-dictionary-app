import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import { getUserByUsername } from "@/lib/data/dictionary";
import { getFollowingUsers } from "@/lib/data/follows";
import { getDictionary } from "@/lib/i18n/dictionary";
import { UserList } from "@/components/UserList";
import { BottomTabBar } from "@/components/BottomTabBar";

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [viewer, profile, viewerProfile] = await Promise.all([
    getCurrentUser(),
    getUserByUsername(username),
    getCurrentUserProfile(),
  ]);

  if (!viewer) {
    redirect("/login");
  }
  if (!profile) {
    notFound();
  }

  const learnerMode = viewerProfile?.learner_mode ?? false;
  const t = getDictionary(learnerMode);

  const following = await getFollowingUsers(profile.id);
  const name = profile.display_name || profile.username;

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2 flex items-center gap-3">
        <Link href={`/u/${profile.username}`} className="text-sm font-bold" style={{ color: "var(--color-slate)" }}>
          {t.common.back}
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
          {t.follow.followingOf(name)}
        </h1>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-4">
        <UserList users={following} learnerMode={learnerMode} />
      </main>

      <BottomTabBar learnerMode={learnerMode} />
    </div>
  );
}
