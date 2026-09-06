"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

let initialized = false;

/**
 * OneSignal Web PushのSDK初期化。
 * layout.tsxに一度だけマウントし、通知の購読許可を求める。
 * ログインユーザーとOneSignalの購読者を紐付けるため、
 * ログイン中のみ external_id(=Supabaseのuser.id)を設定する。
 */
export function OneSignalInit({ userId }: { userId: string | null }) {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return;

    async function init() {
      if (!initialized) {
        await OneSignal.init({
          appId: appId!,
          allowLocalhostAsSecureOrigin: true,
        });
        initialized = true;
      }
      if (userId) {
        // Supabaseのユーザーidをexternal_idとして紐付ける。
        // これにより、サーバー側からuser_idを指定して通知を送れるようになる。
        await OneSignal.login(userId);
      }
    }

    init();
  }, [userId]);

  return null;
}
