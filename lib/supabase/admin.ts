import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * 管理者権限（RLSを無視できる）クライアント。
 * secret key を使うため、絶対にクライアントコンポーネントやAPIレスポンスに
 * このインスタンスや鍵を渡してはいけない。
 *
 * 使いどころの例: 通知バッチ処理、集計処理、管理画面の特権操作など。
 * 通常の投稿・いいね・コメントなどユーザー操作は、RLSに守られた
 * client.ts / server.ts 経由のクライアントを使うこと。
 *
 * "server-only" パッケージにより、誤ってクライアントバンドルに
 * 混入した場合はビルドエラーになる。
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
