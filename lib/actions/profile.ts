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
