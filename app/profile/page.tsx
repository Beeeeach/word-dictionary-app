import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { BottomTabBar } from "@/components/BottomTabBar";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .single<{
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    }>();

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <h1 className="text-lg font-bold text-neutral-900 mb-6">
          プロフィール
        </h1>

        <div className="rounded-2xl border border-neutral-200 p-5 text-sm space-y-2 mb-6">
          <p>
            <span className="text-neutral-400">メール: </span>
            {user.email ?? "(Googleアカウント)"}
          </p>
          <p>
            <span className="text-neutral-400">ユーザー名: </span>
            {profile?.username ?? "(未取得)"}
          </p>
          <p>
            <span className="text-neutral-400">表示名: </span>
            {profile?.display_name ?? "(未設定)"}
          </p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full border border-neutral-300 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            ログアウト
          </button>
        </form>
      </main>
      <BottomTabBar />
    </div>
  );
}
