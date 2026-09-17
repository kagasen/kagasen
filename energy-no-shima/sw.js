// エネルギーの島 — Service Worker（build-islands.mjs が 作る。手で 直さない）
// キャッシュ名は index.html の 中身から 出して いる ので、中身が かわれば かならず かわる。
const CACHE = 'energy-no-shima-cache-8e0dbe6e';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './images/recycle-transform-machine-v1.webp',
  './images/magnet-arena-texture.webp',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      // Cache Storageは全アプリ共有(同一オリジン)。自分の旧キャッシュだけ消す。
      Promise.all(keys.filter((k) => k.startsWith('energy-no-shima-cache-') && k !== CACHE).map((k) => caches.delete(k)))
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
