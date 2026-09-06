import type { TrendingWord } from "@/lib/data/trending";
import { getDictionary } from "@/lib/i18n/dictionary";
import { TrendingWordButton } from "./TrendingWordButton";

export function TrendingWords({
  words,
  learnerMode = false,
}: {
  words: TrendingWord[];
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);

  return (
    <div>
      <h2
        className="text-xs font-bold mb-2 tracking-wide"
        style={{ color: "var(--color-slate)" }}
      >
        {t.search.trendingTitle}
      </h2>
      {words.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--color-slate-light)" }}>
          {t.search.trendingEmpty}
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
