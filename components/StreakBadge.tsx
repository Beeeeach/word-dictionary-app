import { getDictionary } from "@/lib/i18n/dictionary";

export function StreakBadge({
  currentStreak,
  size = "md",
  learnerMode = false,
}: {
  currentStreak: number;
  size?: "sm" | "md";
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);

  if (currentStreak <= 0) return null;

  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold ${textSize}`}
      style={{ background: "#FFF0EC", color: "var(--color-coral-dark)" }}
    >
      🔥 {t.profile.daysStreak(currentStreak)}
    </span>
  );
}
