"use server";

import { createClient } from "@/lib/supabase/server";
import { isAlphabeticWord } from "@/lib/utils/language";

export type MeaningSuggestion = {
  meaning: string;
  source: "dictionary" | "translation" | "past-post";
};

export type SuggestMeaningResult =
  | { suggestions: MeaningSuggestion[]; error?: undefined }
  | { suggestions: []; error: string };

interface DictionaryApiEntry {
  meanings?: {
    partOfSpeech?: string;
    definitions?: { definition?: string }[];
  }[];
}

/**
 * 英単語の英英定義をFree Dictionary API(無料・APIキー不要)から取得する。
 * https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 * 見つからない場合は空配列を返す（エラーにはしない。日本語圏の造語などは
 * ヒットしないのが普通のため）。
 */
async function fetchEnglishDefinition(word: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as DictionaryApiEntry[];
    const firstDefinition = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
    return firstDefinition ?? null;
  } catch {
    return null;
  }
}

/**
 * MyMemory Translation API(無料・APIキー不要、1日一定件数まで)を使って
 * 英語の定義文を日本語に翻訳する。翻訳に失敗した場合は元の英文をそのまま返す。
 */
async function translateToJapanese(text: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ja`,
      { cache: "no-store" }
    );
    if (!res.ok) return text;

    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
    };
    return data.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

/**
 * 過去に投稿された同じ単語(表記ゆれ込みではなく完全一致)の「意味」を検索する。
 * 日本語の単語には信頼できる無料辞書APIがないため、代わりにこの方式で
 * 入力の手間を減らす。自分の投稿・他人の公開投稿の両方から候補を集める。
 */
async function fetchPastMeanings(word: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("meaning")
    .eq("word", word)
    .eq("visibility", "public")
    .not("meaning", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const meanings = (data ?? [])
    .map((row) => row.meaning)
    .filter((m): m is string => !!m && m.trim().length > 0);

  // 重複を除去
  return Array.from(new Set(meanings));
}

/**
 * 「意味を提案」ボタンから呼ばれるServer Action。
 * 単語がアルファベットのみ(=英語とみなす)なら英英辞書+日本語訳を、
 * それ以外(日本語等)なら過去の投稿から意味の候補を返す。
 */
export async function suggestMeaning(word: string): Promise<SuggestMeaningResult> {
  const trimmed = word.trim();
  if (!trimmed) {
    return { suggestions: [], error: "単語を入力してください" };
  }

  if (isAlphabeticWord(trimmed)) {
    const definition = await fetchEnglishDefinition(trimmed);
    if (!definition) {
      // 辞書にヒットしなかった場合は、日本語投稿と同様に過去の投稿からも探す
      const pastMeanings = await fetchPastMeanings(trimmed);
      if (pastMeanings.length === 0) {
        return { suggestions: [], error: "この単語の意味は見つかりませんでした" };
      }
      return {
        suggestions: pastMeanings.map((m) => ({ meaning: m, source: "past-post" as const })),
      };
    }

    const translated = await translateToJapanese(definition);
    const suggestions: MeaningSuggestion[] = [
      { meaning: translated, source: "translation" },
      { meaning: definition, source: "dictionary" },
    ];
    return { suggestions };
  }

  // 日本語などアルファベット以外の単語: 過去の投稿から意味を探す
  const pastMeanings = await fetchPastMeanings(trimmed);
  if (pastMeanings.length === 0) {
    return {
      suggestions: [],
      error: "まだ他の投稿にこの単語の意味が見つかりませんでした",
    };
  }

  return {
    suggestions: pastMeanings.map((m) => ({ meaning: m, source: "past-post" as const })),
  };
}
