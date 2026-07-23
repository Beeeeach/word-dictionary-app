"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreatePollResult = { error: string } | undefined;

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

/**
 * 投票投稿を作成する。
 * タイトルはposts.wordに、選択肢はpoll_optionsに、締切はpoll_settingsに保存する。
 * 単一選択・タイトルのみのシンプルな仕様。
 */
export async function createPoll(
  _prevState: CreatePollResult,
  formData: FormData
): Promise<CreatePollResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const durationHours = Number(formData.get("duration_hours") ?? 24);
  const options = formData
    .getAll("option")
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);

  if (!title) {
    return { error: "投票のタイトルを入力してください" };
  }
  if (title.length > 100) {
    return { error: "タイトルは100文字以内で入力してください" };
  }
  if (options.length < MIN_OPTIONS) {
    return { error: `選択肢は${MIN_OPTIONS}個以上入力してください` };
  }
  if (options.length > MAX_OPTIONS) {
    return { error: `選択肢は${MAX_OPTIONS}個までです` };
  }
  if (![1, 6, 24, 72, 168].includes(durationHours)) {
    return { error: "締切時間の指定が不正です" };
  }

  const closesAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      word: title,
      visibility,
      post_type: "poll",
    })
    .select("id")
    .single<{ id: string }>();

  if (postError || !post) {
    return { error: "投票の作成に失敗しました。時間をおいて再度お試しください" };
  }

  const { error: optionsError } = await supabase.from("poll_options").insert(
    options.map((label, i) => ({
      post_id: post.id,
      label,
      sort_order: i,
    }))
  );

  if (optionsError) {
    return { error: "選択肢の保存に失敗しました" };
  }

  const { error: settingsError } = await supabase.from("poll_settings").insert({
    post_id: post.id,
    closes_at: closesAt,
  });

  if (settingsError) {
    return { error: "締切設定の保存に失敗しました" };
  }

  revalidatePath("/");
  redirect("/");
}

export type CastVoteResult = { error?: string } | undefined;

/**
 * 投票を投じる。締切後はRLS(poll_votes_insert_own_before_deadline)が
 * INSERTを拒否するため、ここでもアプリ側で事前にエラーメッセージを返す。
 * 1ユーザー1投稿につき1票の制約はDBの複合主キーで担保している。
 */
export async function castVote(
  postId: string,
  optionId: string
): Promise<CastVoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const { data: settings } = await supabase
    .from("poll_settings")
    .select("closes_at")
    .eq("post_id", postId)
    .single<{ closes_at: string }>();

  if (settings && new Date(settings.closes_at).getTime() <= Date.now()) {
    return { error: "この投票はすでに締め切られています" };
  }

  const { error } = await supabase.from("poll_votes").insert({
    post_id: postId,
    user_id: user.id,
    option_id: optionId,
  });

  if (error) {
    // 既に投票済み(複合主キー違反)の場合もここに来る
    return { error: "投票に失敗しました。すでに投票済みかもしれません" };
  }

  revalidatePath("/");
}
