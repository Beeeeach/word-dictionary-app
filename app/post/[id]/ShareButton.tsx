"use client";

import { useState } from "react";
import { getDictionary } from "@/lib/i18n/dictionary";

export function ShareButton({
  word,
  shareUrl,
  learnerMode = false,
}: {
  word: string;
  shareUrl: string;
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);
  const [copied, setCopied] = useState(false);

  const shareText = t.share.shareText(word);
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
        {t.share.shareOnX}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full px-4 py-3 text-sm font-bold border-2 transition-colors"
        style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
      >
        {copied ? t.share.copied : t.share.copyLink}
      </button>
    </div>
  );
}
