import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Google OAuthなど、外部プロバイダーでのログイン後に
 * Supabaseからリダイレクトされてくるエンドポイント。
 * URLの ?code=... を実際のセッションに交換し、
 * 完了したらアプリのホーム画面へ転送する。
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // ログイン後に本来行きたかったページがあれば、そこに戻す
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 失敗した場合はエラー内容が分かるようにログイン画面へ戻す
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
