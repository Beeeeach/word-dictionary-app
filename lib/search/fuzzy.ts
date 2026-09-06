/**
 * 検索用の文字列正規化・あいまい一致ロジック。
 *
 * 対応する「ゆらぎ」:
 *   - ひらがな/カタカナの違いを吸収(「ぱそこん」で「パソコン」がヒットする等)
 *   - 全角/半角英数字の違いを吸収
 *   - 大文字/小文字の違いを吸収
 *   - 1〜2文字程度の入力ミス・表記ゆれを許容(レーベンシュタイン距離ベース)
 */

/** カタカナをひらがなに変換する */
function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/** 全角英数字を半角に変換する */
function fullWidthToHalfWidth(str: string): string {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}

/** 検索比較用に文字列を正規化する（ひらがな化・半角化・小文字化） */
export function normalizeForSearch(str: string): string {
  return katakanaToHiragana(fullWidthToHalfWidth(str)).toLowerCase().trim();
}

/**
 * レーベンシュタイン距離（編集距離）を計算する。
 * 2つの文字列がどれだけ違うかを、挿入・削除・置換の最小回数で表す。
 * 短い単語同士の比較が中心のため、素朴なDP実装で十分な速度が出る。
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // 削除
        dp[i][j - 1] + 1, // 挿入
        dp[i - 1][j - 1] + cost // 置換
      );
    }
  }

  return dp[a.length][b.length];
}

/**
 * 検索キーワードが対象の単語にマッチするか判定する。
 * 以下のいずれかを満たせばマッチとみなす:
 *   1. 正規化した文字列同士で部分一致する（ひらがな/カタカナ・全角半角・大小文字を無視）
 *   2. キーワードと単語全体の編集距離が、キーワードの長さに応じた許容範囲内
 *      （1〜3文字: 誤差0、4〜6文字: 誤差1、7文字以上: 誤差2）
 */
export function fuzzyMatch(keyword: string, target: string): boolean {
  const normalizedKeyword = normalizeForSearch(keyword);
  const normalizedTarget = normalizeForSearch(target);

  if (!normalizedKeyword) return false;

  // 部分一致（最も一般的なケース）
  if (normalizedTarget.includes(normalizedKeyword)) return true;

  // あいまい一致（1〜2文字程度の表記ゆれ・入力ミスを許容）
  const allowedDistance =
    normalizedKeyword.length <= 3 ? 0 : normalizedKeyword.length <= 6 ? 1 : 2;

  if (allowedDistance === 0) return false;

  // 単語全体との距離に加え、単語内のスライディングウィンドウとも比較し、
  // 「単語の一部にキーワードが近い形で含まれている」ケースも拾う。
  if (levenshteinDistance(normalizedKeyword, normalizedTarget) <= allowedDistance) {
    return true;
  }

  const windowSize = normalizedKeyword.length;
  for (let i = 0; i <= normalizedTarget.length - windowSize; i++) {
    const window = normalizedTarget.slice(i, i + windowSize);
    if (levenshteinDistance(normalizedKeyword, window) <= allowedDistance) {
      return true;
    }
  }

  return false;
}

/**
 * 入力文字列が有効な正規表現として解釈できるかを判定し、
 * 有効であればRegExpオブジェクトを返す。無効な場合はnull。
 */
export function tryParseRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, "i");
  } catch {
    return null;
  }
}

/**
 * 正規表現特有の記号(., *, +, ?, [], (), |, ^, $ 等)を含むかどうかで、
 * ユーザーが正規表現のつもりで入力したかを簡易的に判定する。
 * 含まない場合は通常のあいまい検索のみを行う（誤判定によるノイズを避けるため）。
 */
export function looksLikeRegex(str: string): boolean {
  return /[.*+?^${}()|[\]\\]/.test(str);
}
