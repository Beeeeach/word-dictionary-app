import { createClient } from "@/lib/supabase/server";

export interface TrendingWord {
  word: string;
  postCount: number;
  totalLikes: number;
}

/**
 * 急上昇ワードTOP5を取得する。
 * 過去24時間に投稿された単語を対象に、
 * 「投稿された回数」+「集めたいいね数」を合算したスコアで順位付けする。
 * 同じ単語が複数回投稿されている場合はグルーピングして集計する。
 */
export async function getTrendingWords(limit = 5): Promise<TrendingWord[]> {
  const supabase = await createClient();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("posts")
    .select("word, like_count")
    .eq("visibility", "public")
    .gte("created_at", since);

  if (error || !data) return [];

  const grouped = new Map<string, { postCount: number; totalLikes: number }>();
  for (const row of data as { word: string; like_count: number }[]) {
    const current = grouped.get(row.word) ?? { postCount: 0, totalLikes: 0 };
    current.postCount += 1;
    current.totalLikes += row.like_count;
    grouped.set(row.word, current);
  }

  return Array.from(grouped.entries())
    .map(([word, stats]) => ({ word, ...stats }))
    .sort((a, b) => {
      const scoreA = a.postCount * 2 + a.totalLikes;
      const scoreB = b.postCount * 2 + b.totalLikes;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}
