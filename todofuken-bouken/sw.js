// 都道府県の冒険 — Service Worker
// オフライン動作とPWAインストールのためのキャッシュ。
// アセット（データ.js・index.html等）を更新したら CACHE のバージョン番号を上げる(v1->v2...)。
// 注意: データ.jsの ?v= は index.html の読み込みと一致させること。
const CACHE = 'todofuken-cache-v3';
const ASSETS = [
  './',
  './index.html',
  './map-data.js?v=2',
  './pref-data.js?v=3',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      // Cache Storageは全アプリ共有(同一オリジン)。自分の旧キャッシュだけ消す。
      Promise.all(keys.filter((k) => k.startsWith('todofuken-cache-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ネットワーク優先 + 失敗時キャッシュ(オフライン)。
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
