import type { TrendingWord } from "@/lib/data/trending";
import { TrendingWordButton } from "./TrendingWordButton";

export function TrendingWords({ words }: { words: TrendingWord[] }) {
  return (
    <div>
      <h2
        className="text-xs font-bold mb-2 tracking-wide"
        style={{ color: "var(--color-slate)" }}
      >
        🔥 急上昇ワード
      </h2>
      {words.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--color-slate-light)" }}>
          まだ急上昇ワードがありません
        </p>
      ) : (
        <ol className="space-y-1.5">
          {words.map((w, i) => (
            <li key={w.word}>
              <TrendingWordButton rank={i + 1} word={w.word} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
