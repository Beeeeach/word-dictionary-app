import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getPostById } from "@/lib/data/posts";
import { getEmotionTags } from "@/lib/data/emotion-tags";
import { PostCard } from "@/components/PostCard";
import { BottomTabBar } from "@/components/BottomTabBar";
import { ShareButton } from "./ShareButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id, null);

  if (!post) {
    return { title: "投稿が見つかりません | DicDic" };
  }

  return {
    title: `${post.word} | DicDic`,
    description: post.meaning || "DicDicで見つけた言葉",
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, emotionTags] = await Promise.all([
    getCurrentUser(),
    getEmotionTags(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const post = await getPostById(id, user.id);
  if (!post) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const shareUrl = `${siteUrl}/post/${post.id}`;

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--color-paper)" }}>
      <header className="max-w-lg mx-auto w-full px-4 pt-6 pb-2 flex items-center gap-3">
        <Link href="/" className="text-sm font-bold" style={{ color: "var(--color-slate)" }}>
          ← もどる
        </Link>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-4 space-y-4">
        <PostCard post={post} currentUserId={user.id} allEmotionTags={emotionTags} />
        <ShareButton word={post.word} shareUrl={shareUrl} />
      </main>

      <BottomTabBar />
    </div>
  );
}
