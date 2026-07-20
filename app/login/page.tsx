import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm mx-auto mb-10 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          みんなの言葉辞書
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          見つけた言葉を投稿して、みんなで辞書を育てよう
        </p>
      </div>

      {message === "confirm_email" && (
        <div className="w-full max-w-sm mx-auto mb-6 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          確認メールを送信しました。メール内のリンクをクリックしてログインを完了してください。
        </div>
      )}

      {error === "auth_callback_failed" && (
        <div className="w-full max-w-sm mx-auto mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          ログインに失敗しました。もう一度お試しください。
        </div>
      )}

      {error === "google_oauth_failed" && (
        <div className="w-full max-w-sm mx-auto mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Googleログインの開始に失敗しました。もう一度お試しください。
        </div>
      )}

      <AuthForm />
    </main>
  );
}
