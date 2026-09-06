import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getDictionary } from "@/lib/i18n/dictionary";
import { BrandHeader } from "@/components/Logo";
import { AuthForm } from "./AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const user = await getCurrentUser();

  // 既にログイン済みならホームへ
  if (user) {
    redirect("/");
  }

  // 未ログイン状態のため学習者モード設定を参照できない。ログイン画面は常に日本語。
  const t = getDictionary(false);

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
          {t.login.confirmEmailMessage}
        </div>
      )}

      {error === "auth_callback_failed" && (
        <div
          className="w-full max-w-sm mx-auto mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: "#FDECEA", color: "var(--color-coral-dark)" }}
        >
          {t.login.authCallbackFailed}
        </div>
      )}

      {error === "google_oauth_failed" && (
        <div
          className="w-full max-w-sm mx-auto mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: "#FDECEA", color: "var(--color-coral-dark)" }}
        >
          {t.login.googleOauthFailed}
        </div>
      )}

      <AuthForm />
    </main>
  );
}
