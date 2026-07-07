// 漢字の冒険 — Service Worker
// オフライン動作とPWAインストールのためのキャッシュ。
// アセット（データ.js・フォント・index.html等）を更新したら CACHE のバージョン番号を上げる(v1->v2...)。
// 注意: データ.jsの ?v= と、ここのURLの ?v= は index.html の読み込みと一致させること。
const CACHE = 'kanji-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './backup-kit.js?v=1',
  './grade1-strokes.js?v=1', './grade1-data.js?v=2',
  './grade2-strokes.js?v=4', './grade2-data.js?v=5',
  './grade3-strokes.js?v=1', './grade3-data.js?v=2',
  './grade4-strokes.js?v=1', './grade4-data.js?v=2',
  './grade5-strokes.js?v=1', './grade5-data.js?v=2',
  './grade6-strokes.js?v=1', './grade6-data.js?v=2',
  './three.min.js',
  './fonts/ZenMaruGothic-Regular.woff2?v=2',
  './fonts/ZenMaruGothic-Bold.woff2?v=2',
  './fonts/ZenMaruGothic-Black.woff2?v=2',
  './fonts/KleeOne-Regular.woff2?v=2',
  './fonts/KleeOne-SemiBold.woff2?v=2',
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
      Promise.all(keys.filter((k) => k.startsWith('kanji-cache-') && k !== CACHE).map((k) => caches.delete(k)))
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
