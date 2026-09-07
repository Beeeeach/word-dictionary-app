import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * cron用エンドポイント(app/api/cron/*)の共通認証チェック。
 *
 * セキュリティ監査での修正: 各ルートで個別に
 * `authHeader !== \`Bearer ${process.env.CRON_SECRET}\`` という
 * 文字列の単純比較(!==)を行っていたが、これは短絡評価により
 * 比較にかかる時間がシークレットの一致度によって微妙に変わるため、
 * 理論上タイミング攻撃でトークンを推測される余地がある。
 * (GitHub Actions以外からの外部アクセスにも晒される可能性があるエンドポイントのため、
 * 実務上のリスクは低いが、定数時間比較にしておくに越したことはない)
 *
 * crypto.timingSafeEqual を使い、長さが同じ場合は比較にかかる時間を
 * 一定にする。長さが違う場合は即falseを返してよい(それ自体は情報漏洩にならない)。
 */
export function isValidCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // シークレット自体が未設定の環境では、誰にも実行を許可しない
    return false;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expected);

  if (authBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(authBuffer, expectedBuffer);
}
