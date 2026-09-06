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

export interface CurrentUserProfile {
  learner_mode: boolean;
  is_admin: boolean;
}

/**
 * 現在ログイン中のユーザーの、users テーブル側のプロフィール情報を取得する。
 * 主に英語学習者モード(learner_mode)の判定に使う。
 * cache() でラップし、同一リクエスト内での重複クエリを避ける
 * （例: layout.tsxでUI言語を決めるために呼び、page.tsxでもフィード
 * フィルタのために呼んでも、実際のDB問い合わせは1回で済む）。
 *
 * 未ログインの場合は null を返す。
 */
export const getCurrentUserProfile = cache(
  async (): Promise<CurrentUserProfile | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("learner_mode, is_admin")
      .eq("id", user.id)
      .maybeSingle<CurrentUserProfile>();

    return data ?? { learner_mode: false, is_admin: false };
  }
);
