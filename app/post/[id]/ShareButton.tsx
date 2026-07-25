"use client";

import { useState } from "react";

export function ShareButton({
  word,
  shareUrl,
}: {
  word: string;
  shareUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = `「${word}」ってどんな言葉？ DicDicで見つけた言葉 📖`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードAPIが使えない環境では何もしない
    }
  }

  return (
    <div className="flex gap-2">
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center rounded-full py-3 text-sm font-bold text-white transition-colors"
        style={{ background: "#1C1B29" }}
      >
        𝕏 でシェア
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full px-4 py-3 text-sm font-bold border-2 transition-colors"
        style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
      >
        {copied ? "コピーしました" : "リンクをコピー"}
      </button>
    </div>
  );
}
