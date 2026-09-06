import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * 禁止ワードリスト。表示名・自己紹介・投稿(単語/意味/文脈/ひとこと)・コメントの
 * 保存前チェックに使う。
 *
 * 運用上の注意:
 *  - ここでは代表的なパターンのみ列挙する。実運用では管理画面や
 *    別テーブル(banned_words等)に外出しして増減できるようにするのが望ましいが、
 *    まずはコード管理のリストとして実装し、必要に応じて拡張する。
 *  - 大文字・小文字、全角・半角を区別せずに判定する。
 *  - 誤検知（正当な単語が禁止ワードの部分文字列に一致するなど）を避けるため、
 *    ここには明確に問題のある語のみを含め、一般的すぎる短い語は避ける。
 */
const BANNED_WORDS: string[] = [
  // 暴力・脅迫を扇動する表現
  "死ね",
  "殺す",
  "殺害",
  // 差別・侮辱表現（代表的なもの。必要に応じて追加）
  "きもい死ね",
  "消えろ",
  // なりすまし・信頼詐称防止（表示名向け）
  "運営",
  "公式",
  "administrator",
  "admin",
  // スパム・詐欺的表現
  "儲かる",
  "副業で稼ぐ",
  "無料プレゼント",
  "今すぐ登録",
  // 露骨な性的表現（代表語のみ、詳細な列挙はしない）
  "セックス",
  "ポルノ",
];

function normalize(text: string): string {
  // 全角英数字を半角に、大文字を小文字に統一して比較する
  return text
    .normalize("NFKC")
    .toLowerCase();
}

/**
 * テキストに禁止ワードが含まれるかチェックする。
 * 含まれる場合、該当した単語を返す（ログ・デバッグ用途、UIには出さない）。
 */
export function containsBannedWord(text: string): string | null {
  const normalized = normalize(text);
  for (const word of BANNED_WORDS) {
    if (normalized.includes(normalize(word))) {
      return word;
    }
  }
  return null;
}

/** 投稿・コメント・プロフィールの保存前に呼ぶ簡易バリデーション。問題があればエラーメッセージを返す */
export function validateNoBannedWords(text: string | null | undefined): string | null {
  if (!text) return null;
  const hit = containsBannedWord(text);
  if (hit) {
    return "不適切な表現が含まれているため保存できません。内容を見直してください。";
  }
  return null;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分
const RATE_LIMIT_MAX_COUNT = 3; // 1分間に3件まで

/**
 * 荒らし防止: 直近1分間の投稿/コメント数が上限(3件)を超えていないか確認する。
 * 超えている場合はエラーメッセージを返す（呼び出し側はこれをチェックして中断する）。
 *
 * "table" は "posts" または "comments" を渡す。RLSの都合上、
 * サーバー側クライアント(cookieベースの認証つき)であればuser_idで
 * 絞り込んでcountを取れる。
 */
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  table: "posts" | "comments"
): Promise<string | null> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) {
    // レート制限のチェック自体が失敗した場合は、投稿をブロックしない
    // (誤ってサービス全体を止めないことを優先する)
    return null;
  }

  if ((count ?? 0) >= RATE_LIMIT_MAX_COUNT) {
    return "投稿の間隔が短すぎます。少し時間を置いてからもう一度お試しください。";
  }

  return null;
}

/**
 * 荒らし防止: 直近の投稿/コメントと全く同じ内容を連投していないか確認する。
 * 短時間(レート制限と同じ1分間)に同一ユーザーが同一内容を繰り返し投稿するのを防ぐ。
 *
 * "content" は posts なら word (単語) 、comments なら body を渡す。
 */
export async function checkDuplicateContent(
  supabase: SupabaseClient<Database>,
  userId: string,
  table: "posts" | "comments",
  content: string
): Promise<string | null> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  if (table === "posts") {
    const { count, error } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("word", content)
      .gte("created_at", since);

    if (error) {
      return null;
    }

    if ((count ?? 0) > 0) {
      return "同じ内容の投稿が直前にあります。内容を変えて投稿してください。";
    }

    return null;
  }

  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("body", content)
    .gte("created_at", since);

  if (error) {
    return null;
  }

  if ((count ?? 0) > 0) {
    return "同じ内容の投稿が直前にあります。内容を変えて投稿してください。";
  }

  return null;
}

/** Server Action内で使う簡易ヘルパー: 現在のSupabaseクライアントを生成する */
export async function getServerSupabase() {
  return createClient();
}
