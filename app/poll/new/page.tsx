import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import { getDictionary } from "@/lib/i18n/dictionary";
import { PollForm } from "./PollForm";

export default async function NewPollPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  const learnerMode = profile?.learner_mode ?? false;
  const t = getDictionary(learnerMode);

  return (
    <main
      className="flex-1 px-4 py-6 max-w-lg mx-auto w-full"
      style={{ background: "var(--color-paper)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/post/new"
          className="text-sm font-bold"
          style={{ color: "var(--color-slate)" }}
        >
          {t.common.back}
        </Link>
        <h1 className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
          {t.poll.newPollTitle}
        </h1>
        <div className="w-10" />
      </div>

      <PollForm learnerMode={learnerMode} />
    </main>
  );
}
