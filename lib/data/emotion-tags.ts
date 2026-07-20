import { createClient } from "@/lib/supabase/server";
import type { EmotionTag } from "@/lib/types/database.types";

/** emotion_tagsマスタを sort_order 順に取得する */
export async function getEmotionTags(): Promise<EmotionTag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("emotion_tags")
    .select("id, name, emoji, sort_order")
    .order("sort_order", { ascending: true });

  return (data ?? []) as EmotionTag[];
}
