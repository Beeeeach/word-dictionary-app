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
    <nav className="sticky bottom-0 left-0 right-0 border-t border-neutral-200 bg-white/95 backdrop-blur-sm">
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
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 text-white text-xl shadow-lg">
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
                className={`text-lg ${active ? "" : "opacity-40"}`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] ${
                  active ? "text-neutral-900 font-medium" : "text-neutral-400"
                }`}
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
