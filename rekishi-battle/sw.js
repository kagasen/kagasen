// レキシバトル — Service Worker
// オフライン動作とPWAインストールのためのキャッシュ。
// ★アセット（index.html / chars-data.js / 曲 / 絵）を更新したら
//   CACHE のバージョン番号を上げる（v1 -> v2 …）。CLAUDE.md §4 の儀式。
// ★chars-data.js の ?v= は index.html の <script src> と **同じ数字**にすること。
//   ちがうと、キャッシュに入っていない別URLを毎回とりに行くことになる。
const CACHE = 'rekishi-cache-v8';

// ① かならず要るもの（小さい・約0.5MB）。ここが1つでも取れないと install は失敗させる
//    ＝「中途はんぱに入って 動かない」より「入っていない」ほうが 安全。
const SHELL = [
  './',
  './index.html',
  './chars-data.js?v=24',
  './fonts/KleeOne-title.woff2?v=1',
  './manifest.json',
  './icon.svg',
];

// ② 大きいけれど 先に入れておきたいもの（曲 3.0MB）。
//    ★1つずつ入れて、失敗しても install は 止めない（学校のWiFiが 細いことがある）。
//    ★絵（images/ 7.5MB・51ステージぶん）は **ここに入れない**。
//      ぜんぶ先に落とすと 初回が重すぎるので、下の fetch で **見たものから順に**キャッシュする。
const EXTRA = [
  './bgm/home_yayoinosorani.mp3',
  './bgm/battle_bakumatsubukyoku_ikusa.mp3',
];

// 中身が変わらないもの＝キャッシュ優先（毎回とりに行かない。曲と絵は とくに重い）
const CACHE_FIRST = /\/(bgm|images|fonts)\//;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL).then(() => {
        EXTRA.forEach((u) => { c.add(u).catch(() => {}); });   // 失敗しても にぎりつぶす
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      // Cache Storageは全アプリ共有(同一オリジン)。自分の旧キャッシュだけ消す。
      Promise.all(keys.filter((k) => k.startsWith('rekishi-cache-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ★キャッシュに入れてよい返事かを 見る。
//   206（部分だけ）は Cache API に **入れられない**（例外になる）。
//   曲の mp3 は Safari が Range で とりに来るので 206 が よく来る。
//   ここで はじいておかないと、毎回 例外が出る。
function putSafe(req, res) {
  if (!res || res.status !== 200 || res.type === 'opaque') return;
  const copy = res.clone();
  caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // 曲・絵・字＝キャッシュ優先（あればネットに行かない。無ければ とりに行って ためる）
  if (CACHE_FIRST.test(new URL(e.request.url).pathname)) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        putSafe(e.request, res);
        return res;
      }))
    );
    return;
  }

  // それ以外（index.html・chars-data.js）＝ネットワーク優先＋失敗時キャッシュ（オフライン）
  e.respondWith(
    fetch(e.request)
      .then((res) => { putSafe(e.request, res); return res; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
