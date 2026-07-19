import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database.types";

/**
 * Server Components / Route Handlers / Server Actions から使うSupabaseクライアント。
 * cookieを介してユーザーのログインセッションを引き継ぐ。
 * こちらも publishable key を使う（RLSで保護されている前提）。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Componentから呼ばれた場合はsetできないことがあるが、
            // middlewareでセッションを更新していれば問題ない。
          }
        },
      },
    }
  );
}
