"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/lib/actions/follows";

export function FollowButton({
  targetUserId,
  initiallyFollowing,
  disabled,
  size = "md",
}: {
  targetUserId: string;
  initiallyFollowing: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (disabled || isPending) return;

    const next = !following;
    setFollowing(next);

    startTransition(async () => {
      const result = await toggleFollow(targetUserId);
      if (result.error) {
        setFollowing(!next);
      } else {
        setFollowing(result.following);
      }
    });
  }

  const padding = size === "sm" ? "px-3 py-1" : "px-5 py-2";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`rounded-full ${padding} ${textSize} font-bold border-2 transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={
        following
          ? {
              background: "var(--color-paper-raised)",
              color: "var(--color-slate)",
              borderColor: "var(--color-line)",
            }
          : {
              background: "var(--color-coral)",
              color: "#fff",
              borderColor: "var(--color-coral)",
            }
      }
    >
      {following ? "フォロー中" : "フォローする"}
    </button>
  );
}
