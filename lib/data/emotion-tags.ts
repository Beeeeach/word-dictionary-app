import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database, EmotionTag } from "@/lib/types/database.types";

/**
 * emotion_tagsマスタを sort_order 順に取得する。
 * ほぼ変更されないマスタデータのため、unstable_cacheで10分間キャッシュし、
 * フィード表示のたびに毎回DBへ問い合わせるのを防ぐ(N+1回避)。
 * タグ自体を追加・変更した場合は、最大10分のタイムラグでアプリに反映される。
 *
 * 注意: unstable_cacheの中では cookies() に依存するクライアント(server.ts)は
 * 使えない(Next.jsの制約)。emotion_tagsはRLSで「誰でも閲覧可」なマスタデータ
 * なので、publishable keyのみのシンプルなクライアントで問題ない。
 */
export const getEmotionTags = unstable_cache(
  async (): Promise<EmotionTag[]> => {
    const supabase = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const { data } = await supabase
      .from("emotion_tags")
      .select("id, name, emoji, sort_order")
      .order("sort_order", { ascending: true });

    return (data ?? []) as EmotionTag[];
  },
  ["emotion-tags"],
  { revalidate: 600 }
);
