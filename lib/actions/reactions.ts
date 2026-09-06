"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/create";

export type ToggleReactionResult = { reacted: boolean; error?: string };

/**
 * 閲覧者による反応タグのON/OFFを切り替える。
 * reaction_tagsは (post_id, user_id, emotion_tag_id) のunique制約があるので、
 * 同じ組み合わせが既にあれば削除、なければ追加するトグル動作にする。
 * 投稿者自身が付けたタグ(post_emotion_tags)とは別テーブルなので混同しないこと。
 */
export async function toggleReaction(
  postId: string,
  emotionTagId: number
): Promise<ToggleReactionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { reacted: false, error: "ログインが必要です" };
  }

  const { data: existing } = await supabase
    .from("reaction_tags")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("emotion_tag_id", emotionTagId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("reaction_tags")
      .delete()
      .eq("id", existing.id);

    if (error) return { reacted: true, error: "反応の取り消しに失敗しました" };
    revalidatePath("/");
    return { reacted: false };
  } else {
    const { error } = await supabase.from("reaction_tags").insert({
      post_id: postId,
      user_id: user.id,
      emotion_tag_id: emotionTagId,
    });

    if (error) return { reacted: false, error: "反応に失敗しました" };

    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single<{ user_id: string }>();

    if (post) {
      await createNotification({
        userId: post.user_id,
        actorId: user.id,
        type: "reaction",
        postId,
      });
    }

    revalidatePath("/");
    return { reacted: true };
  }
}
