"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBlock } from "@/lib/actions/blocks";
import { getDictionary } from "@/lib/i18n/dictionary";

export function BlockButton({
  targetUserId,
  initiallyBlocked,
  learnerMode = false,
}: {
  targetUserId: string;
  initiallyBlocked: boolean;
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);
  const router = useRouter();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (isPending) return;
    if (!blocked && !confirm(t.block.confirmBlock)) return;

    startTransition(async () => {
      const result = await toggleBlock(targetUserId);
      if (!result.error && typeof result.blocked === "boolean") {
        setBlocked(result.blocked);
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full px-3 py-1 text-xs font-bold border-2 transition-colors disabled:opacity-50"
      style={{
        borderColor: "var(--color-line)",
        color: blocked ? "var(--color-coral-dark)" : "var(--color-slate-light)",
      }}
    >
      {blocked ? t.block.blocked : t.block.block}
    </button>
  );
}
