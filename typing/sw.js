// キッズタイピング — Service Worker
// オフライン動作とPWAインストールのためのキャッシュ。
// アセットを更新したら CACHE のバージョン番号を上げる(v1->v2...)。
const CACHE = 'typing-cache-v1';
const ASSETS = [
  './',
  './2nen/data.js',
  './2nen/index.html',
  './3nen/data.js',
  './3nen/index.html',
  './4nen/data.js',
  './4nen/index.html',
  './5nen/data.js',
  './5nen/index.html',
  './6nen/data.js',
  './6nen/index.html',
  './app.compiled.js',
  './fonts.css',
  './fonts/MochiyPopOne-Regular.woff2',
  './fonts/ZenMaruGothic-Black.woff2',
  './fonts/ZenMaruGothic-Bold.woff2',
  './fonts/ZenMaruGothic-Regular.woff2',
  './index.html',
  './nagare2nen.html',
  './nagare3nen.html',
  './nagare4nen.html',
  './nagare5nen.html',
  './nagare6nen.html',
  './preflight.js',
  './shop.html',
  './tailwind.css',
  './tokkun70/index.html',
  './tokkun70/level01.html',
  './tokkun70/level02.html',
  './tokkun70/level03.html',
  './tokkun70/level04.html',
  './tokkun70/level05.html',
  './tokkun70/level06.html',
  './tokkun70/level07.html',
  './tokkun70/level08.html',
  './tokkun70/level09.html',
  './tokkun70/level10.html',
  './tokkun70/level11.html',
  './tokkun70/level12.html',
  './tokkun70/level13.html',
  './tokkun70/level14.html',
  './tokkun70/level15.html',
  './tokkun70/level16.html',
  './tokkun70/level17.html',
  './tokkun70/level18.html',
  './tokkun70/level19.html',
  './tokkun70/level20.html',
  './tokkun70/level21.html',
  './tokkun70/level22.html',
  './tokkun70/level23.html',
  './tokkun70/level24.html',
  './tokkun70/level25.html',
  './tokkun70/level26.html',
  './tokkun70/level27.html',
  './tokkun70/level28.html',
  './tokkun70/level29.html',
  './tokkun70/level30.html',
  './tokkun70/level31.html',
  './tokkun70/level32.html',
  './tokkun70/level33.html',
  './tokkun70/level34.html',
  './tokkun70/level35.html',
  './tokkun70/level36.html',
  './tokkun70/level37.html',
  './tokkun70/level38.html',
  './tokkun70/level39.html',
  './tokkun70/level40.html',
  './tokkun70/level41.html',
  './tokkun70/level42.html',
  './tokkun70/level43.html',
  './tokkun70/level44.html',
  './tokkun70/level45.html',
  './tokkun70/level46.html',
  './tokkun70/level47.html',
  './tokkun70/level48.html',
  './tokkun70/level49.html',
  './tokkun70/level50.html',
  './tokkun70/level51.html',
  './tokkun70/level52.html',
  './tokkun70/level53.html',
  './tokkun70/level54.html',
  './tokkun70/level55.html',
  './tokkun70/level56.html',
  './tokkun70/level57.html',
  './tokkun70/level58.html',
  './tokkun70/level59.html',
  './tokkun70/level60.html',
  './tokkun70/level61.html',
  './tokkun70/level62.html',
  './tokkun70/level63.html',
  './tokkun70/level64.html',
  './tokkun70/level65.html',
  './tokkun70/level66.html',
  './tokkun70/level67.html',
  './tokkun70/level68.html',
  './tokkun70/level69.html',
  './tokkun70/level70.html',
  './tokkun70/tokkun-storage.js',
  './vendor/lucide.min.js',
  './vendor/react-dom.production.min.js',
  './vendor/react.production.min.js',
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
      Promise.all(keys.filter((k) => k.startsWith('typing-cache-') && k !== CACHE).map((k) => caches.delete(k)))
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
          return caches.match('./index.html');
        }
        return Response.error();
      })
  );
});
