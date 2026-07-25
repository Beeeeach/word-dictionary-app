"use client";

import { useEffect, useState } from "react";

/** beforeinstallprompt イベントの型(標準のTypeScript libには含まれないため独自定義) */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "dicdic-install-banner-dismissed";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safariの独自プロパティ
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  // 初期値をuseStateの初期化関数内で判定することで、
  // effect内での同期的なsetState呼び出し(カスケードレンダリング)を避ける。
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return isStandalone() || localStorage.getItem(DISMISSED_KEY) === "1";
  });
  const [showIosHint] = useState(() => isIos());

  useEffect(() => {
    if (dismissed || showIosHint) return;

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [dismissed, showIosHint]);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    handleDismiss();
  }

  if (dismissed || (!deferredPrompt && !showIosHint)) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto rounded-2xl p-4 shadow-lg z-50 flex items-center gap-3"
      style={{ background: "var(--color-ink)", color: "#fff" }}
    >
      <span className="text-2xl shrink-0">📖</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">DicDicをホーム画面に追加</p>
        <p className="text-xs mt-0.5" style={{ color: "#C8C8D8" }}>
          {showIosHint
            ? "共有ボタン → 「ホーム画面に追加」からインストールできます"
            : "アプリのようにすぐ開けるようになります"}
        </p>
      </div>
      {!showIosHint && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="rounded-full px-3 py-1.5 text-xs font-bold shrink-0"
          style={{ background: "var(--color-coral)" }}
        >
          追加
        </button>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="閉じる"
        className="text-lg shrink-0 opacity-60"
      >
        ×
      </button>
    </div>
  );
}
