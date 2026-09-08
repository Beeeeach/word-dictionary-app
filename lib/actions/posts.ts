"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bumpStreak } from "@/lib/actions/streaks";
import { MAX_POST_TAGS } from "@/lib/data/emotion-tags";
import {
  validateNoBannedWords,
  checkRateLimit,
  checkDuplicateContent,
} from "@/lib/moderation/content-safety";

export type CreatePostResult = { error: string } | undefined;

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB（Storageバケット側の制限と合わせる）
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * 投稿を作成する。
 * 単語のみ必須、意味・写真・タグは任意。
 * 「出会った文脈」欄はUI改善により廃止したため、ここでは扱わない
 * (DBのcontextカラム自体は残っているが、常にnullで保存される)。
 * 写真がある場合は先にStorageへアップロードしてからpostsに保存する。
 *
 * タグ(post_emotion_tags)は「テーマ/感情/目的/雰囲気/形式/対象/シーン」の
 * 7カテゴリから選ぶカテゴリタグで、最大 MAX_POST_TAGS(5) 個まで。
 *
 * 荒らし防止のため、以下を保存前にチェックする:
 *  - 直近1分間の投稿数が3件を超えていないか(レート制限)
 *  - 直近1分間に全く同じ単語を投稿していないか(連打防止)
 *  - 禁止ワードを含んでいないか(単語・意味・ひとこと)
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
  const note = String(formData.get("note") ?? "").trim();
  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const emotionTagIds = Array.from(
    new Set(
      formData
        .getAll("emotion_tags")
        .map((v) => Number(v))
        .filter((v) => Number.isInteger(v))
    )
  );
  const photo = formData.get("photo");

  if (!word) {
    return { error: "単語を入力してください" };
  }
  if (word.length > 100) {
    return { error: "単語は100文字以内で入力してください" };
  }
  if (note.length > 200) {
    return { error: "ひとことは200文字以内で入力してください" };
  }
  if (emotionTagIds.length > MAX_POST_TAGS) {
    return { error: `タグは最大${MAX_POST_TAGS}個までです` };
  }

  // --- 荒らし防止チェック ---
  const bannedWordError =
    validateNoBannedWords(word) ||
    validateNoBannedWords(meaning) ||
    validateNoBannedWords(note);
  if (bannedWordError) {
    return { error: bannedWordError };
  }

  const rateLimitError = await checkRateLimit(supabase, user.id, "posts");
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  const duplicateError = await checkDuplicateContent(supabase, user.id, "posts", word);
  if (duplicateError) {
    return { error: duplicateError };
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
      context: null,
      photo_url: photoUrl,
      note: note || null,
      visibility,
    })
    .select("id")
    .single<{ id: string }>();

  if (postError || !post) {
    return { error: "投稿の作成に失敗しました。時間をおいて再度お試しください" };
  }

  // --- ストリーク（連続投稿日数）を更新 ---
  await bumpStreak(supabase, user.id);

  // --- 投稿者のタグを保存（任意・最大5個） ---
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

/**
 * 自分の投稿を削除する（RLSにより本人のもの以外は削除できない）。
 * 関連する post_emotion_tags, likes, reaction_tags, comments 等は
 * DB側の外部キー制約(on delete cascade)で連動して削除される想定。
 */
export async function deletePost(postId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "投稿の削除に失敗しました" };
  }

  revalidatePath("/");
  revalidatePath("/mydictionary");
  return {};
}
