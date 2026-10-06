// 語彙線（ゴイセン） — Service Worker
// オフライン動作とPWAインストールのためのキャッシュ。
// アセットを更新したら CACHE のバージョン番号を上げる(v1->v2...)。
const CACHE = 'goisen-cache-v18';
const ASSETS = [
  './',
  './index.html',
  './goi-data.js?v=2',
  './backup-kit.js?v=1',
  './sfx.js?v=2',
  './assets/monsters/mori1.webp',
  './assets/monsters/mori2.webp',
  './assets/monsters/mori_boss.webp',
  './assets/monsters/kazan1.webp',
  './assets/monsters/kazan2.webp',
  './assets/monsters/kazan_boss.webp',
  './assets/monsters/umi1.webp',
  './assets/monsters/umi2.webp',
  './assets/monsters/umi_boss.webp',
  './assets/monsters/sora1.webp',
  './assets/monsters/sora2.webp',
  './assets/monsters/sora_boss.webp',
  './assets/monsters/maou1.webp',
  './assets/monsters/maou2.webp',
  './assets/monsters/maou_boss.webp',
  './assets/bg/mori.webp',
  './assets/bg/kazan.webp',
  './assets/bg/umi.webp',
  './assets/bg/sora.webp',
  './assets/bg/maou.webp',
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
      Promise.all(keys.filter((k) => k.startsWith('goisen-cache-') && k !== CACHE).map((k) => caches.delete(k)))
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
