// DicDic PWA用 Service Worker
//
// 役割:
//   1. アプリシェル(ロゴ・アイコン・オフラインページ)を事前キャッシュする
//   2. ネットワークが繋がらない時、ページ遷移をオフラインページへフォールバックする
//   3. 静的アセット(アイコン画像など)は Cache First で高速化する
//
// 注意:
//   - このアプリはリアルタイム性の高いSNSのため、投稿一覧やAPIレスポンス
//     などの動的データは意図的にキャッシュしない(常に最新をサーバーから取得する)。
//   - OneSignalの Service Worker(/OneSignalSDKWorker.js) とは別ファイル・
//     別スコープで動作するため、互いに干渉しない。
const CACHE_VERSION = "dicdic-v1";
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;

const APP_SHELL_URLS = [
  "/offline",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("dicdic-") && key !== APP_SHELL_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // ページ遷移(HTMLナビゲーション): オフライン時はオフラインページを返す
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline"))
    );
    return;
  }

  // 静的アセット(自分のオリジンの画像・manifest等)は Cache First
  const url = new URL(request.url);
  const isStaticAsset =
    url.origin === self.location.origin &&
    (request.destination === "image" || url.pathname === "/manifest.json");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
  }

  // それ以外(API・投稿データ等)は常にネットワークから取得する(キャッシュしない)
});
