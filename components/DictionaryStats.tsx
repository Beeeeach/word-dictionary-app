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
          className="rounded-2xl bg-neutral-50 px-3 py-4 text-center"
        >
          <p className="text-xl font-bold text-neutral-900">{item.value}</p>
          <p className="text-[11px] text-neutral-400 mt-1 leading-tight">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
