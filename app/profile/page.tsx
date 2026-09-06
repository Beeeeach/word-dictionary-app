import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import { signOut } from "@/lib/actions/auth";
import { getFollowCounts } from "@/lib/data/follows";
import { getDictionary } from "@/lib/i18n/dictionary";
import { BottomTabBar } from "@/components/BottomTabBar";
import { LearnerModeToggle } from "@/components/LearnerModeToggle";
import { DisplayNameForm } from "./DisplayNameForm";
import { AvatarForm } from "./AvatarForm";
import { BioForm } from "./BioForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const currentProfile = await getCurrentUserProfile();
  const learnerMode = currentProfile?.learner_mode ?? false;
  const t = getDictionary(learnerMode);

  const [{ data: profile }, followCounts] = await Promise.all([
    supabase
      .from("users")
      .select(
        "username, display_name, avatar_url, bio, current_streak, longest_streak"
      )
      .eq("id", user.id)
      .single<{
        username: string;
        display_name: string | null;
        avatar_url: string | null;
        bio: string | null;
        current_streak: number;
        longest_streak: number;
      }>(),
    getFollowCounts(user.id),
  ]);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <h1
          className="text-lg font-bold mb-6"
          style={{ color: "var(--color-ink)" }}
        >
          {t.profile.title}
        </h1>

        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <AvatarForm currentAvatarUrl={profile?.avatar_url ?? null} learnerMode={learnerMode} />
        </div>

        {/* フォロワー数・フォロー中数（タップで一覧へ） */}
        {profile?.username && (
          <div className="flex gap-4 mb-4 text-sm px-1">
            <Link href={`/u/${profile.username}/followers`}>
              <span style={{ color: "var(--color-slate)" }}>
                <span className="font-bold" style={{ color: "var(--color-ink)" }}>
                  {followCounts.followerCount}
                </span>{" "}
                {t.profile.followers}
              </span>
            </Link>
            <Link href={`/u/${profile.username}/following`}>
              <span style={{ color: "var(--color-slate)" }}>
                <span className="font-bold" style={{ color: "var(--color-ink)" }}>
                  {followCounts.followingCount}
                </span>{" "}
                {t.profile.following}
              </span>
            </Link>
          </div>
        )}

        {/* 連続投稿記録 */}
        {(profile?.current_streak ?? 0) > 0 && (
          <div
            className="rounded-2xl p-5 mb-4 flex items-center justify-between"
            style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
          >
            <div>
              <p className="text-2xl font-extrabold" style={{ color: "var(--color-coral)" }}>
                🔥 {t.profile.daysStreak(profile?.current_streak ?? 0)}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-slate)" }}>
                {t.profile.bestStreak}: {profile?.longest_streak}
              </p>
            </div>
          </div>
        )}

        {/* 英語学習者モード切り替え */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <LearnerModeToggle initialEnabled={learnerMode} learnerMode={learnerMode} />
        </div>

        <div
          className="rounded-2xl p-5 text-sm space-y-3 mb-4"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <p>
            <span className="font-medium" style={{ color: "var(--color-slate)" }}>
              {t.profile.email}:{" "}
            </span>
            <span style={{ color: "var(--color-ink)" }}>
              {user.email ?? "(Google Account)"}
            </span>
          </p>
          <p>
            <span className="font-medium" style={{ color: "var(--color-slate)" }}>
              {t.profile.username}:{" "}
            </span>
            <span style={{ color: "var(--color-ink)" }}>
              {profile?.username ?? "-"}
            </span>
          </p>
          <p>
            <span className="font-medium" style={{ color: "var(--color-slate)" }}>
              {t.profile.displayName}:{" "}
            </span>
            <span className="font-bold" style={{ color: "var(--color-ink)" }}>
              {profile?.display_name ?? "-"}
            </span>
          </p>
        </div>

        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <DisplayNameForm
            currentDisplayName={profile?.display_name ?? ""}
            learnerMode={learnerMode}
          />
        </div>

        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <BioForm currentBio={profile?.bio ?? ""} learnerMode={learnerMode} />
        </div>

        {profile?.username && (
          <Link
            href={`/u/${profile.username}`}
            className="block w-full text-center rounded-full py-3 text-sm font-bold border-2 mb-3 transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          >
            {t.profile.viewPublicProfile}
          </Link>
        )}

        {currentProfile?.is_admin && (
          <Link
            href="/admin"
            className="block w-full text-center rounded-full py-3 text-sm font-bold border-2 mb-3 transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: "var(--color-line)", color: "var(--color-indigo)" }}
          >
            {t.admin.title}
          </Link>
        )}

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full py-3 text-sm font-bold border-2 transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          >
            {t.profile.logout}
          </button>
        </form>
      </main>
      <BottomTabBar learnerMode={learnerMode} />
    </div>
  );
}
