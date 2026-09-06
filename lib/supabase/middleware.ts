import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware.ts から呼ばれる、ログインセッションのcookieを
 * 毎リクエスト自動でリフレッシュするための処理。
 * これがないとログインが数十分〜数時間で切れてしまう。
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()を呼ぶことでセッションの検証・自動更新が走る。
  // ここで呼ばないと、サーバー側でセッション切れが検知されないことがある。
  await supabase.auth.getUser();

  return supabaseResponse;
}
