"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreatePostResult = { error: string } | undefined;

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB（Storageバケット側の制限と合わせる）
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * 投稿を作成する。
 * 企画書4-1: 単語のみ必須、意味・文脈・写真・感情タグは任意。
 * 写真がある場合は先にStorageへアップロードしてからpostsに保存する。
 */
export async function createPost(
  _prevState: CreatePostResult,
  formData: FormData
): Promise<CreatePostResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const word = String(formData.get("word") ?? "").trim();
  const meaning = String(formData.get("meaning") ?? "").trim();
  const context = String(formData.get("context") ?? "").trim();
  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const emotionTagIds = formData
    .getAll("emotion_tags")
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v));
  const photo = formData.get("photo");

  if (!word) {
    return { error: "単語を入力してください" };
  }
  if (word.length > 100) {
    return { error: "単語は100文字以内で入力してください" };
  }

  // --- 写真アップロード（任意項目） ---
  let photoUrl: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_SIZE) {
      return { error: "写真のサイズは5MB以下にしてください" };
    }
    if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
      return { error: "写真はJPEG・PNG・WEBP・GIF形式のみ対応しています" };
    }

    const ext = photo.name.split(".").pop() ?? "jpg";
    // RLSポリシー(03_storage.sql)が「フォルダの先頭 = 自分のuser_id」を要求するため、
    // このパス構造は必ず守る必要がある。
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("post-photos")
      .upload(path, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: "写真のアップロードに失敗しました" };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("post-photos").getPublicUrl(path);
    photoUrl = publicUrl;
  }

  // --- 投稿本体を保存 ---
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      word,
      meaning: meaning || null,
      context: context || null,
      photo_url: photoUrl,
      visibility,
    })
    .select("id")
    .single<{ id: string }>();

  if (postError || !post) {
    return { error: "投稿の作成に失敗しました。時間をおいて再度お試しください" };
  }

  // --- 投稿者の感情タグを保存（任意・複数選択可） ---
  if (emotionTagIds.length > 0) {
    const rows = emotionTagIds.map((emotion_tag_id) => ({
      post_id: post.id,
      emotion_tag_id,
    }));
    // タグの保存失敗は投稿自体の失敗にはしない（軽微なエラーとして許容する）
    await supabase.from("post_emotion_tags").insert(rows);
  }

  revalidatePath("/");
  redirect("/");
}
