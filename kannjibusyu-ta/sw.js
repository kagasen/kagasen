// 漢字部首シューティング — Service Worker
// オフライン動作とPWAインストールのためのキャッシュ。
// アセットを更新したら CACHE のバージョン番号を上げる(v1->v2...)。
const CACHE = 'kannjibusyu-ta-cache-v1';
const ASSETS = [
  './',
  './kanjibusyu-ta.html',
  './tailwind.css',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

// 注意: Cache Storage はオリジン単位で全アプリ共有(GitHub Pages)。
// 自分のアプリのキャッシュ(旧バージョン)だけ消すこと。他アプリのは消さない。
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('kannjibusyu-ta-cache-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ネットワーク優先 + 失敗時キャッシュ(オフライン)。同一オリジンのGETだけ扱う。
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(e.request);
        if (hit) return hit;
        if (e.request.mode === 'navigate') {
          const u = new URL(e.request.url);
          if (u.pathname.endsWith('/')) {
            const idx = await caches.match(u.pathname + 'index.html');
            if (idx) return idx;
          }
          return caches.match('./kanjibusyu-ta.html');
        }
        return Response.error();
      })
  );
});
