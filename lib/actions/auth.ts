"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** フォームのバリデーション・処理結果として画面に返す型 */
export type AuthActionResult = {
  error?: string;
} | undefined;

/**
 * メールアドレス + パスワードでの新規登録。
 * usernameはpublic.usersテーブルのunique制約があるため、
 * 簡易的にメールアドレスのローカル部+ランダム文字列で自動生成する。
 * (ユーザーが後でプロフィール画面から変更できるようにするのは将来対応)
 */
export async function signUpWithEmail(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください" };
  }
  if (password.length < 6) {
    return { error: "パスワードは6文字以上で入力してください" };
  }

  const supabase = await createClient();
  const originHeader = (await headers()).get("origin");

  const localPart = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
  const randomSuffix = Math.random().toString(36).slice(2, 6);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${originHeader}/auth/callback`,
      data: {
        username: `${localPart || "user"}_${randomSuffix}`,
      },
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  redirect("/login?message=confirm_email");
}

/** メールアドレス + パスワードでのログイン */
export async function signInWithEmail(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  redirect("/");
}

/** Googleでのログイン開始（Supabase→GoogleのOAuth画面へ転送する） */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const originHeader = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${originHeader}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google_oauth_failed");
  }

  redirect(data.url);
}

/** ログアウト */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Supabaseのエラーメッセージを日本語の分かりやすい文言に変換する簡易マッピング */
function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません";
  }
  if (message.includes("User already registered")) {
    return "このメールアドレスは既に登録されています";
  }
  if (message.includes("Email not confirmed")) {
    return "メールアドレスの確認が完了していません。届いたメールのリンクを確認してください";
  }
  return "エラーが発生しました。時間をおいて再度お試しください";
}
