// 部首穴（ぶしゅあな） — Service Worker
// オフライン動作とPWAインストールのためのキャッシュ。
// アセットを更新したら CACHE のバージョン番号を上げる(v1->v2...)。
const CACHE = 'bushu-ana-cache-v22';
const ASSETS = [
  './',
  './index.html',
  './three.min.js',
  './bushu-data.js?v=2',
  './backup-kit.js?v=1',
  './manifest.json',
  './icon.svg',
  './assets/bgm/kanji1.m4a?v=1',
  './assets/bgm/kanji2.m4a?v=1',
  './assets/bgm/kanji3.m4a?v=1',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      // Cache Storageは全アプリ共有(同一オリジン)。自分の旧キャッシュだけ消す。
      Promise.all(keys.filter((k) => k.startsWith('bushu-ana-cache-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ネットワーク優先 + 失敗時キャッシュ(オフライン)。
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // BGMの 曲は Range（とちゅうから よむ）で くるので、キャッシュからも 206 で かえす（iPad の Safari は これが ないと オフラインで ならない）
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
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});

// 音源の途中読み込み（ひっさんフィーバーの sw.js と同じ作り）
async function serveSongRange(request) {
  let response = await caches.match(request.url);
  if (!response) {
    response = await fetch(request.url);
    if (response.ok && response.status === 200) {
      const copy = response.clone();
      caches.open(CACHE).then((c) => c.put(request.url, copy)).catch(() => {});
    }
  }
  if (!response.ok || response.status !== 200) return response;
  const body = await response.arrayBuffer(), length = body.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  const invalid = () => new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + length } });
  if (!match || (!match[1] && !match[2])) return invalid();
  let start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]));
  let end = match[1] && match[2] ? Math.min(length - 1, Number(match[2])) : length - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= length || start > end) return invalid();
  return new Response(body.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': response.headers.get('content-type') || 'audio/mp4',
    'Content-Range': 'bytes ' + start + '-' + end + '/' + length,
    'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes'
  } });
}
