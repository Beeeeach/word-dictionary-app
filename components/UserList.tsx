import Image from "next/image";
import Link from "next/link";
import type { FollowListUser } from "@/lib/data/follows";
import { getDictionary } from "@/lib/i18n/dictionary";

export function UserList({
  users,
  learnerMode = false,
}: {
  users: FollowListUser[];
  learnerMode?: boolean;
}) {
  const t = getDictionary(learnerMode);

  if (users.length === 0) {
    return (
      <p className="text-center text-sm py-16" style={{ color: "var(--color-slate)" }}>
        {t.follow.empty}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {users.map((u) => (
        <Link
          key={u.id}
          href={`/u/${u.username}`}
          className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-black/[0.02]"
        >
          <div
            className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: "var(--color-line)" }}
          >
            {u.avatar_url ? (
              <Image
                src={u.avatar_url}
                alt=""
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: "var(--color-ink)" }}>
              {u.display_name || u.username}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--color-slate-light)" }}>
              @{u.username}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
