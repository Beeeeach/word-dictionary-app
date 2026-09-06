import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database, EmotionTag, EmotionTagCategory } from "@/lib/types/database.types";

/**
 * emotion_tagsマスタを sort_order 順に取得する。
 * ほぼ変更されないマスタデータのため、unstable_cacheで10分間キャッシュし、
 * フィード表示のたびに毎回DBへ問い合わせるのを防ぐ(N+1回避)。
 * タグ自体を追加・変更した場合は、最大10分のタイムラグでアプリに反映される。
 *
 * 注意: unstable_cacheの中では cookies() に依存するクライアント(server.ts)は
 * 使えない(Next.jsの制約)。emotion_tagsはRLSで「誰でも閲覧可」なマスタデータ
 * なので、publishable keyのみのシンプルなクライアントで問題ない。
 *
 * このテーブルには2種類のタグが混在している:
 *  - category = null: 閲覧者の反応タグ（絵文字リアクション、ReactionTags.tsxで使用）
 *  - category = 'theme' | 'emotion' | ... : 投稿者が付けるカテゴリタグ（TagSelectorOverlayで使用）
 */
export const getEmotionTags = unstable_cache(
  async (): Promise<EmotionTag[]> => {
    const supabase = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const { data } = await supabase
      .from("emotion_tags")
      .select("id, name, emoji, sort_order, category, name_en")
      .order("sort_order", { ascending: true });

    return (data ?? []) as EmotionTag[];
  },
  ["emotion-tags"],
  { revalidate: 600 }
);

/** 閲覧者の反応タグ（従来の絵文字タグ、category = null）のみを取得する */
export const getReactionTags = unstable_cache(
  async (): Promise<EmotionTag[]> => {
    const all = await getEmotionTags();
    return all.filter((t) => t.category === null);
  },
  ["reaction-tags"],
  { revalidate: 600 }
);

export const EMOTION_TAG_CATEGORIES: {
  key: EmotionTagCategory;
  label: string;
}[] = [
  { key: "theme", label: "テーマ" },
  { key: "emotion", label: "感情" },
  { key: "purpose", label: "目的" },
  { key: "mood", label: "雰囲気" },
  { key: "format", label: "形式" },
  { key: "target", label: "対象" },
  { key: "scene", label: "シーン" },
];

export const MAX_POST_TAGS = 5;

/**
 * タグの表示名を決定する。英語学習者モードがオンかつ英訳(name_en)が
 * 設定されている場合はそちらを、それ以外は日本語名(name)を返す。
 * 閲覧者の反応タグ(category = null)には name_en が無いため、
 * 学習者モードでも常に name (絵文字+日本語) のままになる。
 */
export function getTagDisplayName(
  tag: Pick<EmotionTag, "name" | "name_en">,
  learnerMode: boolean
): string {
  if (learnerMode && tag.name_en) return tag.name_en;
  return tag.name;
}


/**
 * 投稿者が選べるカテゴリタグ（category が設定されているもの）を
 * カテゴリごとにグルーピングして取得する。
 * TagSelectorOverlay（タグ選択オーバーレイ）で使用する。
 */
export const getCategorizedPostTags = unstable_cache(
  async (): Promise<Record<EmotionTagCategory, EmotionTag[]>> => {
    const all = await getEmotionTags();
    const grouped = Object.fromEntries(
      EMOTION_TAG_CATEGORIES.map((c) => [c.key, [] as EmotionTag[]])
    ) as Record<EmotionTagCategory, EmotionTag[]>;

    for (const tag of all) {
      if (tag.category && grouped[tag.category]) {
        grouped[tag.category].push(tag);
      }
    }
    return grouped;
  },
  ["categorized-post-tags"],
  { revalidate: 600 }
);
