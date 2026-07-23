import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { getFollowCounts } from "@/lib/data/follows";
import { BottomTabBar } from "@/components/BottomTabBar";
import { DisplayNameForm } from "./DisplayNameForm";
import { AvatarForm } from "./AvatarForm";
import { BioForm } from "./BioForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, followCounts] = await Promise.all([
    supabase
      .from("users")
      .select("username, display_name, avatar_url, bio")
      .eq("id", user.id)
      .single<{
        username: string;
        display_name: string | null;
        avatar_url: string | null;
        bio: string | null;
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
          プロフィール
        </h1>

        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <AvatarForm currentAvatarUrl={profile?.avatar_url ?? null} />
        </div>

        {/* フォロワー数・フォロー中数（タップで一覧へ） */}
        {profile?.username && (
          <div className="flex gap-4 mb-4 text-sm px-1">
            <Link href={`/u/${profile.username}/followers`}>
              <span style={{ color: "var(--color-slate)" }}>
                <span className="font-bold" style={{ color: "var(--color-ink)" }}>
                  {followCounts.followerCount}
                </span>{" "}
                フォロワー
              </span>
            </Link>
            <Link href={`/u/${profile.username}/following`}>
              <span style={{ color: "var(--color-slate)" }}>
                <span className="font-bold" style={{ color: "var(--color-ink)" }}>
                  {followCounts.followingCount}
                </span>{" "}
                フォロー中
              </span>
            </Link>
          </div>
        )}

        <div
          className="rounded-2xl p-5 text-sm space-y-3 mb-4"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <p>
            <span className="font-medium" style={{ color: "var(--color-slate)" }}>
              メール:{" "}
            </span>
            <span style={{ color: "var(--color-ink)" }}>
              {user.email ?? "(Googleアカウント)"}
            </span>
          </p>
          <p>
            <span className="font-medium" style={{ color: "var(--color-slate)" }}>
              ユーザー名:{" "}
            </span>
            <span style={{ color: "var(--color-ink)" }}>
              {profile?.username ?? "(未取得)"}
            </span>
          </p>
          <p>
            <span className="font-medium" style={{ color: "var(--color-slate)" }}>
              表示名:{" "}
            </span>
            <span className="font-bold" style={{ color: "var(--color-ink)" }}>
              {profile?.display_name ?? "(未設定)"}
            </span>
          </p>
        </div>

        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <DisplayNameForm currentDisplayName={profile?.display_name ?? ""} />
        </div>

        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <BioForm currentBio={profile?.bio ?? ""} />
        </div>

        {profile?.username && (
          <Link
            href={`/u/${profile.username}`}
            className="block w-full text-center rounded-full py-3 text-sm font-bold border-2 mb-3 transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          >
            公開プロフィールを見る
          </Link>
        )}

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full py-3 text-sm font-bold border-2 transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          >
            ログアウト
          </button>
        </form>
      </main>
      <BottomTabBar />
    </div>
  );
}
