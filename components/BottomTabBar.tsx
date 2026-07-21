"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: "🏠", isPost: false },
  { href: "/search", label: "検索", icon: "🔍", isPost: false },
  { href: "/post/new", label: "投稿", icon: "＋", isPost: true },
  { href: "/mydictionary", label: "自分の辞書", icon: "📖", isPost: false },
  { href: "/profile", label: "プロフィール", icon: "👤", isPost: false },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 left-0 right-0 border-t backdrop-blur-sm"
      style={{ borderColor: "var(--color-line)", background: "rgba(253, 251, 244, 0.95)" }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;

          if (item.isPost) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <span
                  className="flex items-center justify-center w-12 h-12 rounded-full text-white text-xl shadow-lg"
                  style={{ background: "var(--color-coral)" }}
                >
                  {item.icon}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-2.5 px-3 min-w-[56px]"
            >
              <span
                className="text-lg"
                style={{ opacity: active ? 1 : 0.55 }}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span
                className="text-[10px] font-bold"
                style={{ color: active ? "var(--color-ink)" : "var(--color-slate-light)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
