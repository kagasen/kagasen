// ひらがなれんしゅう — Service Worker
// オフライン動作とPWAインストールのためのキャッシュ。
// アセットを更新したら CACHE のバージョン番号を上げる(v1->v2...)。
const CACHE = 'hiraganarensyu-cache-v1';
const ASSETS = [
  './',
  './fonts.css',
  './fonts/MochiyPopOne-Regular.woff2',
  './fonts/ZenMaruGothic-Black.woff2',
  './fonts/ZenMaruGothic-Bold.woff2',
  './fonts/ZenMaruGothic-Medium.woff2',
  './fonts/ZenMaruGothic-Regular.woff2',
  './index.html',
  './kana/ぁ.json',
  './kana/あ.json',
  './kana/ぃ.json',
  './kana/い.json',
  './kana/ぅ.json',
  './kana/う.json',
  './kana/ぇ.json',
  './kana/え.json',
  './kana/ぉ.json',
  './kana/お.json',
  './kana/か.json',
  './kana/が.json',
  './kana/き.json',
  './kana/ぎ.json',
  './kana/く.json',
  './kana/ぐ.json',
  './kana/け.json',
  './kana/げ.json',
  './kana/こ.json',
  './kana/ご.json',
  './kana/さ.json',
  './kana/ざ.json',
  './kana/し.json',
  './kana/じ.json',
  './kana/す.json',
  './kana/ず.json',
  './kana/せ.json',
  './kana/ぜ.json',
  './kana/そ.json',
  './kana/ぞ.json',
  './kana/た.json',
  './kana/だ.json',
  './kana/ち.json',
  './kana/ぢ.json',
  './kana/っ.json',
  './kana/つ.json',
  './kana/づ.json',
  './kana/て.json',
  './kana/で.json',
  './kana/と.json',
  './kana/ど.json',
  './kana/な.json',
  './kana/に.json',
  './kana/ぬ.json',
  './kana/ね.json',
  './kana/の.json',
  './kana/は.json',
  './kana/ば.json',
  './kana/ぱ.json',
  './kana/ひ.json',
  './kana/び.json',
  './kana/ぴ.json',
  './kana/ふ.json',
  './kana/ぶ.json',
  './kana/ぷ.json',
  './kana/へ.json',
  './kana/べ.json',
  './kana/ぺ.json',
  './kana/ほ.json',
  './kana/ぼ.json',
  './kana/ぽ.json',
  './kana/ま.json',
  './kana/み.json',
  './kana/む.json',
  './kana/め.json',
  './kana/も.json',
  './kana/ゃ.json',
  './kana/や.json',
  './kana/ゅ.json',
  './kana/ゆ.json',
  './kana/ょ.json',
  './kana/よ.json',
  './kana/ら.json',
  './kana/り.json',
  './kana/る.json',
  './kana/れ.json',
  './kana/ろ.json',
  './kana/ゎ.json',
  './kana/わ.json',
  './kana/ゐ.json',
  './kana/ゑ.json',
  './kana/を.json',
  './kana/ん.json',
  './kana/ゔ.json',
  './kana/ゕ.json',
  './kana/ゖ.json',
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
      Promise.all(keys.filter((k) => k.startsWith('hiraganarensyu-cache-') && k !== CACHE).map((k) => caches.delete(k)))
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
