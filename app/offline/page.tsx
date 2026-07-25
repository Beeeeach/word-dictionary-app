import { Logo } from "@/components/Logo";

/**
 * ネットワーク接続がない時、Service Worker(public/sw.js)によって
 * ページ遷移のフォールバック先として表示されるページ。
 */
export default function OfflinePage() {
  return (
    <main
      className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center"
      style={{ background: "var(--color-paper)" }}
    >
      <Logo size="lg" />
      <p className="text-lg font-bold mt-8" style={{ color: "var(--color-ink)" }}>
        オフラインです
      </p>
      <p className="text-sm mt-2" style={{ color: "var(--color-slate)" }}>
        インターネット接続を確認して、もう一度お試しください
      </p>
    </main>
  );
}
