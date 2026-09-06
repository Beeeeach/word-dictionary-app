import "server-only";

const ONESIGNAL_API_URL = "https://onesignal.com/api/v1/notifications";

/**
 * 特定ユーザー(external_id = SupabaseのユーザーID)宛にWeb push通知を送る。
 * OneSignalの認証情報が未設定の場合は何もしない(通知機能自体をオプトインにするため)。
 * 通知送信の失敗はアプリの主機能(いいね・コメント等)を妨げてはいけないため、
 * 例外を投げず、失敗時はログのみ出す設計にしている。
 */
export async function sendPushNotification({
  toUserId,
  title,
  message,
  url,
}: {
  toUserId: string;
  title: string;
  message: string;
  url?: string;
}): Promise<void> {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restApiKey) {
    // OneSignal未設定の環境(ローカル開発の初期段階など)では静かにスキップする
    return;
  }

  try {
    await fetch(ONESIGNAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: [toUserId] },
        target_channel: "push",
        headings: { en: title, ja: title },
        contents: { en: message, ja: message },
        url,
      }),
    });
  } catch {
    // 通知送信の失敗はサイレントに無視する(本体機能に影響させない)
  }
}
