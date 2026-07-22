import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 投稿ごとの base_score を再計算するバッチ処理。
 * GitHub Actionsから15分おきに呼ばれる想定。
 * CRON_SECRET と一致するトークンが無いと実行できないようにして、
 * 誰でもこのエンドポイントを叩けてしまわないようにしている。
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("recalculate_post_scores");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
