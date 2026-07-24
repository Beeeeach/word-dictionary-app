import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * 現在ログイン中のユーザーを取得する。
 * React の cache() でラップすることで、同一リクエスト内(1回のページ
 * 遷移)であれば layout.tsx と各 page.tsx の両方から呼ばれても
 * Supabase Authサーバーへの検証は1回だけで済む。
 *
 * これまでは layout.tsx と page.tsx がそれぞれ独立して
 * supabase.auth.getUser() を呼んでおり、1回のページ表示のたびに
 * 認証確認が重複して発生し、体感速度を悪化させていた。
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
