"use client";

export function TrendingWordButton({ rank, word }: { rank: number; word: string }) {
  function handleClick() {
    // SearchView側でこのカスタムイベントを購読し、検索欄に反映する
    window.dispatchEvent(
      new CustomEvent("trending-word-selected", { detail: word })
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 w-full text-left rounded-lg px-2 py-1.5 transition-colors hover:bg-black/[0.03]"
    >
      <span
        className="text-xs font-extrabold w-4 shrink-0"
        style={{ color: rank <= 3 ? "var(--color-coral)" : "var(--color-slate-light)" }}
      >
        {rank}
      </span>
      <span className="text-sm font-bold truncate" style={{ color: "var(--color-ink)" }}>
        {word}
      </span>
    </button>
  );
}
