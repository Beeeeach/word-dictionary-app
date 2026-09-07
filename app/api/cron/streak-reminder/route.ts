import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/notifications/send";
import { isValidCronRequest } from "@/lib/cron-auth";

/**
 * ストリークが途切れそうなユーザーに、夜にリマインド通知を送るバッチ処理。
 * 対象: current_streak > 0 かつ、今日まだ投稿していない(last_posted_date が昨日以前)ユーザー。
 * GitHub Actionsから1日1回、日本時間の夜(21時頃)に呼ばれる想定。
 */
export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const today = new Date();
  const jstToday = new Date(today.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: users, error } = await supabase
    .from("users")
    .select("id, current_streak")
    .gt("current_streak", 0)
    .lt("last_posted_date", jstToday);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const u of users ?? []) {
    await sendPushNotification({
      toUserId: u.id,
      title: "連続記録が途切れそうです🔥",
      message: `${u.current_streak}日連続の記録があります。今日も一言投稿してみませんか？`,
      url: "/post/new",
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent, at: new Date().toISOString() });
}
