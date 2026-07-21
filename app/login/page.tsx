import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandHeader } from "@/components/Logo";
import { AuthForm } from "./AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 既にログイン済みならホームへ
  if (user) {
    redirect("/");
  }

  const { message, error } = await searchParams;

  return (
    <main
      className="flex-1 flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "var(--color-paper)" }}
    >
      <div className="w-full max-w-sm mx-auto mb-10 text-center">
        <BrandHeader />
      </div>

      {message === "confirm_email" && (
        <div
          className="w-full max-w-sm mx-auto mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: "#EEF0FC", color: "var(--color-indigo-dark)" }}
        >
          確認メールを送信しました。メール内のリンクをクリックしてログインを完了してください。
        </div>
      )}

      {error === "auth_callback_failed" && (
        <div
          className="w-full max-w-sm mx-auto mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: "#FDECEA", color: "var(--color-coral-dark)" }}
        >
          ログインに失敗しました。もう一度お試しください。
        </div>
      )}

      {error === "google_oauth_failed" && (
        <div
          className="w-full max-w-sm mx-auto mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: "#FDECEA", color: "var(--color-coral-dark)" }}
        >
          Googleログインの開始に失敗しました。もう一度お試しください。
        </div>
      )}

      <AuthForm />
    </main>
  );
}
