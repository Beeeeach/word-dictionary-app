"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileResult = { error?: string; success?: boolean } | undefined;

/**
 * ユーザーの表示名を更新する。
 * これまではGoogleログイン時に取得した名前がそのまま display_name として
 * 使われ続けていたが、ここから任意の名前に変更できるようにする。
 * アプリ内での表示（投稿カードのユーザー名など）はすべて display_name を
 * 優先的に参照しているため、ここを変更すれば全画面に反映される。
 */
export async function updateDisplayName(
  _prevState: UpdateProfileResult,
  formData: FormData
): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!displayName) {
    return { error: "表示名を入力してください" };
  }
  if (displayName.length > 30) {
    return { error: "表示名は30文字以内で入力してください" };
  }

  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    return { error: "表示名の更新に失敗しました" };
  }

  revalidatePath("/");
  revalidatePath("/profile");
  return { success: true };
}

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB（Storageバケット側の制限と合わせる）
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * ユーザーのアバター画像を更新する。
 * これまではGoogleログイン時のアイコンがそのまま avatar_url として
 * 使われ続けていたが、ここから任意の画像に差し替えられるようにする。
 * 同じファイル名(avatar.拡張子)でupsertすることで、Storage内に
 * 古い画像が溜まり続けないようにしている。
 */
export async function updateAvatar(
  _prevState: UpdateProfileResult,
  formData: FormData
): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const photo = formData.get("avatar");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "画像を選択してください" };
  }
  if (photo.size > MAX_AVATAR_SIZE) {
    return { error: "画像のサイズは2MB以下にしてください" };
  }
  if (!ALLOWED_AVATAR_TYPES.includes(photo.type)) {
    return { error: "画像はJPEG・PNG・WEBP形式のみ対応しています" };
  }

  const ext = photo.name.split(".").pop() ?? "jpg";
  // ファイル名を固定(avatar.ext)し upsert することで、
  // 差し替えるたびにStorageの容量が無限に増えるのを防ぐ。
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, photo, {
      contentType: photo.type,
      upsert: true,
    });

  if (uploadError) {
    return { error: "画像のアップロードに失敗しました" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // キャッシュを回避するため、更新のたびに一意なクエリパラメータを付与する。
  // (同じURLのままだとブラウザ/next-imageのキャッシュで古い画像が表示され続けるため)
  const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: cacheBustedUrl })
    .eq("id", user.id);

  if (updateError) {
    return { error: "プロフィールの更新に失敗しました" };
  }

  revalidatePath("/");
  revalidatePath("/profile");
  return { success: true };
}
