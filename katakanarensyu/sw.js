// カタカナれんしゅう — Service Worker
// オフライン動作とPWAインストールのためのキャッシュ。
// アセットを更新したら CACHE のバージョン番号を上げる(v1->v2...)。
const CACHE = 'katakanarensyu-cache-v1';
const ASSETS = [
  './',
  './fonts.css',
  './fonts/MochiyPopOne-Regular.woff2',
  './fonts/ZenMaruGothic-Black.woff2',
  './fonts/ZenMaruGothic-Bold.woff2',
  './fonts/ZenMaruGothic-Medium.woff2',
  './fonts/ZenMaruGothic-Regular.woff2',
  './index.html',
  './kana/ァ.json',
  './kana/ア.json',
  './kana/ィ.json',
  './kana/イ.json',
  './kana/ゥ.json',
  './kana/ウ.json',
  './kana/ェ.json',
  './kana/エ.json',
  './kana/ォ.json',
  './kana/オ.json',
  './kana/カ.json',
  './kana/ガ.json',
  './kana/キ.json',
  './kana/ギ.json',
  './kana/ク.json',
  './kana/グ.json',
  './kana/ケ.json',
  './kana/ゲ.json',
  './kana/コ.json',
  './kana/ゴ.json',
  './kana/サ.json',
  './kana/ザ.json',
  './kana/シ.json',
  './kana/ジ.json',
  './kana/ス.json',
  './kana/ズ.json',
  './kana/セ.json',
  './kana/ゼ.json',
  './kana/ソ.json',
  './kana/ゾ.json',
  './kana/タ.json',
  './kana/ダ.json',
  './kana/チ.json',
  './kana/ヂ.json',
  './kana/ッ.json',
  './kana/ツ.json',
  './kana/ヅ.json',
  './kana/テ.json',
  './kana/デ.json',
  './kana/ト.json',
  './kana/ド.json',
  './kana/ナ.json',
  './kana/ニ.json',
  './kana/ヌ.json',
  './kana/ネ.json',
  './kana/ノ.json',
  './kana/ハ.json',
  './kana/バ.json',
  './kana/パ.json',
  './kana/ヒ.json',
  './kana/ビ.json',
  './kana/ピ.json',
  './kana/フ.json',
  './kana/ブ.json',
  './kana/プ.json',
  './kana/ヘ.json',
  './kana/ベ.json',
  './kana/ペ.json',
  './kana/ホ.json',
  './kana/ボ.json',
  './kana/ポ.json',
  './kana/マ.json',
  './kana/ミ.json',
  './kana/ム.json',
  './kana/メ.json',
  './kana/モ.json',
  './kana/ャ.json',
  './kana/ヤ.json',
  './kana/ュ.json',
  './kana/ユ.json',
  './kana/ョ.json',
  './kana/ヨ.json',
  './kana/ラ.json',
  './kana/リ.json',
  './kana/ル.json',
  './kana/レ.json',
  './kana/ロ.json',
  './kana/ヮ.json',
  './kana/ワ.json',
  './kana/ヰ.json',
  './kana/ヱ.json',
  './kana/ヲ.json',
  './kana/ン.json',
  './kana/ヴ.json',
  './kana/ヵ.json',
  './kana/ヶ.json',
  './kana/ヷ.json',
  './kana/ヸ.json',
  './kana/ヹ.json',
  './kana/ヺ.json',
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
      Promise.all(keys.filter((k) => k.startsWith('katakanarensyu-cache-') && k !== CACHE).map((k) => caches.delete(k)))
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
