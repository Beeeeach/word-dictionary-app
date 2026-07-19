import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

/**
 * クライアントコンポーネント（"use client"）から使うSupabaseクライアント。
 * ブラウザで動くので、必ず publishable key（旧: anon key）のみを使う。
 * 呼び出すたびに新しいインスタンスを作る軽量な設計。
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
