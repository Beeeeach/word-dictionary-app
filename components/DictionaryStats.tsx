import { getDictionary } from "@/lib/i18n/dictionary";

export function DictionaryStats({
  wordCount,
  reactionCount,
  categoryCount,
  learnerMode = false,
}: {
  wordCount: number;
  reactionCount: number;
  categoryCount: number;
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);

  const items = [
    { label: t.dictionaryStats.wordCount, value: wordCount },
    { label: t.dictionaryStats.reactionCount, value: reactionCount },
    { label: t.dictionaryStats.categoryCount, value: categoryCount },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl px-3 py-4 text-center"
          style={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-line)" }}
        >
          <p className="text-2xl font-extrabold" style={{ color: "var(--color-coral)" }}>
            {item.value}
          </p>
          <p
            className="text-[11px] font-bold mt-1 leading-tight"
            style={{ color: "var(--color-slate)" }}
          >
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
