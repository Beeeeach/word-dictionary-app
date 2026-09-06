import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import { getCategorizedPostTags } from "@/lib/data/emotion-tags";
import { getDictionary } from "@/lib/i18n/dictionary";
import { PostForm } from "./PostForm";

export default async function NewPostPage() {
  const [user, tagsByCategory, profile] = await Promise.all([
    getCurrentUser(),
    getCategorizedPostTags(),
    getCurrentUserProfile(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const learnerMode = profile?.learner_mode ?? false;
  const t = getDictionary(learnerMode);

  return (
    <main
      className="flex-1 px-4 py-6 max-w-lg mx-auto w-full"
      style={{ background: "var(--color-paper)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="text-sm font-bold"
          style={{ color: "var(--color-slate)" }}
        >
          {t.common.back}
        </Link>
        <h1 className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
          {t.post.newPostTitle}
        </h1>
        <div className="w-10" />
      </div>

      <PostForm tagsByCategory={tagsByCategory} learnerMode={learnerMode} />

      <div className="text-center mt-6">
        <Link
          href="/poll/new"
          className="text-sm font-bold underline underline-offset-2"
          style={{ color: "var(--color-indigo)" }}
        >
          {t.post.pollLink}
        </Link>
      </div>
    </main>
  );
}
