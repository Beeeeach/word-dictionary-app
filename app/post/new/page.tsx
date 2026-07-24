import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getEmotionTags } from "@/lib/data/emotion-tags";
import { PostForm } from "./PostForm";

export default async function NewPostPage() {
  const [user, emotionTags] = await Promise.all([
    getCurrentUser(),
    getEmotionTags(),
  ]);

  if (!user) {
    redirect("/login");
  }

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
          ← もどる
        </Link>
        <h1 className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
          新しい単語を投稿
        </h1>
        <div className="w-10" />
      </div>

      <PostForm emotionTags={emotionTags} />

      <div className="text-center mt-6">
        <Link
          href="/poll/new"
          className="text-sm font-bold underline underline-offset-2"
          style={{ color: "var(--color-indigo)" }}
        >
          🗳️ 単語ではなく投票を作りたい
        </Link>
      </div>
    </main>
  );
}
