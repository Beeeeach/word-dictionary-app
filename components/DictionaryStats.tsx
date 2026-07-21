export function DictionaryStats({
  wordCount,
  reactionCount,
  categoryCount,
}: {
  wordCount: number;
  reactionCount: number;
  categoryCount: number;
}) {
  const items = [
    { label: "登録した単語数", value: wordCount },
    { label: "もらった反応数", value: reactionCount },
    { label: "使ったカテゴリ数", value: categoryCount },
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
