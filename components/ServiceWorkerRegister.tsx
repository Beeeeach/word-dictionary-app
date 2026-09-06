"use client";

import { useEffect } from "react";

/**
 * PWA用Service Worker(public/sw.js)を登録する。
 * OneSignalのService Worker登録(components/OneSignalInit.tsx)とは
 * 別ファイル・別スコープなので、互いに独立して動作する。
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // 登録失敗はアプリの主機能に影響しないため静かに無視する
    });
  }, []);

  return null;
}
