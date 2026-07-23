import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PollForm } from "./PollForm";

export default async function NewPollPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          href="/post/new"
          className="text-sm font-bold"
          style={{ color: "var(--color-slate)" }}
        >
          ← もどる
        </Link>
        <h1 className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
          投票を作成
        </h1>
        <div className="w-10" />
      </div>

      <PollForm />
    </main>
  );
}
