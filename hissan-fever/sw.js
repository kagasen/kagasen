// ひっさんフィーバー — Service Worker
// オフライン動作とPWAインストールのためのキャッシュ。
// アセットを更新したら CACHE のバージョン番号を上げる(v1->v2...)。
const CACHE = 'hissan-fever-cache-v25';
const ASSETS = [
  './',
  './index.html',
  './backup-kit.js',
  './manifest.json',
  './icon.svg',
  './assets/poko-friends-2d-v1.png',
  './assets/japan-map.js?v=1',
  './assets/world-map.js?v=1',
  './assets/bgm/kuku-kuru.m4a?v=1',
  './assets/bgm/zukei-koushiki.m4a?v=1',
  './assets/bgm/kumowa-hajiki.m4a?v=1',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

// 注意: Cache Storage はオリジン単位で全アプリ共有(GitHub Pages)。
// 自分のアプリのキャッシュ(旧バージョン)だけ消すこと。他アプリのは消さない。
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('hissan-fever-cache-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ネットワーク優先 + 失敗時キャッシュ(オフライン)。同一オリジンのGETだけ扱う。
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;
  if (e.request.headers.has('range') && /\/assets\/bgm\/[^/]+\.m4a$/.test(new URL(e.request.url).pathname)) {
    e.respondWith(serveSongRange(e.request)); return;
  }
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

// 音源の途中読み込み。キャッシュした曲もRange(206)で返せるようにする。
async function serveSongRange(request) {
  let response = await caches.match(request.url);
  if (!response) {
    response = await fetch(request.url);
    if (response.ok && response.status === 200) {
      const copy = response.clone();
      caches.open(CACHE).then(c => c.put(request.url, copy)).catch(() => {});
    }
  }
  if (!response.ok || response.status !== 200) return response;
  const body = await response.arrayBuffer(), length = body.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  const invalid = () => new Response(null, { status:416, headers:{'Content-Range':'bytes */' + length} });
  if (!match || (!match[1] && !match[2])) return invalid();
  let start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]));
  let end = match[1] && match[2] ? Math.min(length - 1, Number(match[2])) : length - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= length || start > end) return invalid();
  return new Response(body.slice(start, end + 1), {status:206,headers:{
    'Content-Type':response.headers.get('content-type') || 'audio/mp4',
    'Content-Range':'bytes ' + start + '-' + end + '/' + length,
    'Content-Length':String(end - start + 1),'Accept-Ranges':'bytes'
  }});
}
