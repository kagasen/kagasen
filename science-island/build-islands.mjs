#!/usr/bin/env node
/* =====================================================================
   build-islands.mjs — src/ から「島ごとのアプリ」と「全部入り」を 組み立てる

   使い方:  node science-island/build-islands.mjs
           node science-island/build-islands.mjs --check   （書かずに 差分だけ 見る）

   なぜ こうして いるか（CLAUDE.md §4・§8）:
     ・エンジン（ならべる型・みつける型・じっけん型…）は 3つの島が 共有して いる。
       島ごとに ファイルを 分けて コピーすると、1つの バグ直しが 3か所に なる。
       だから **ソースは src/ の 1か所だけ**に して、ここで 5つに 組み立てる。
     ・出てくる ものは どれも 「CSS/JSこみの 単一 index.html」。
       ビルドが 要るのは 作る人だけで、子どもの 端末には ふつうの HTML が とどく。

   ★ src/ を 直すこと。生成された index.html を 手で 直さない（次の ビルドで 消える）。

   出力:
     science-island/index.html        全部入り（今までと 同じ。verify.mjs は これを 見る）
     energy-no-shima/index.html       ⚡エネルギーの島 ＋ 🔬かんがえかたの島
     tsubutsubu-no-shima/index.html   🧪つぶつぶの島 ＋ 🔬かんがえかたの島
     inochi-no-shima/index.html       🌱いのちの島 ＋ 🔬かんがえかたの島
     chikyu-no-shima/index.html       🌏ちきゅうの島 ＋ 🔬かんがえかたの島

   セーブは 4アプリとも 'science-island-save-v1' を 共有する（同一オリジンなので
   localStorage は つながって いる）。だから どのアプリで クリアしても 記録は 1つに たまり、
   「4島 クリアで かんがえかたの島が ひらく」も そのまま はたらく（CLAUDE.md §3）。
   ===================================================================== */
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seoHead, SITE, SITE_NAME, GENERATED } from '../build-seo.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const SRC  = path.join(HERE, 'src');
const CHECK = process.argv.includes('--check');

/* ---- ブロックの ならび順。ここの じゅんばんが そのまま ファイルの じゅんばんに なる ----
   need:null … かならず 入れる／need:'island:x' … その島を 入れる ときだけ
   need:'engine:x' … その型（エンジン）を つかう ステージが ある ときだけ            */
const ORDER = [
  { f:'00-head.html'             , need:null },
  { f:'01-intro.js'              , need:null },
  { f:'@manifest'                , need:null },   /* ← ここは ファイルでは なく 下で 組み立てる */
  { f:'02-stagevars.js'          , need:null },
  { f:'_games-open.js'           , need:null },
  { f:'stages/energy.js'         , need:'island:energy' },
  { f:'stages/particle.js'       , need:'island:particle' },
  { f:'stages/life.js'           , need:'island:life' },
  { f:'stages/earth.js'          , need:'island:earth' },
  { f:'stages/method.js'         , need:'island:method' },
  { f:'_games-close.js'          , need:null },
  { f:'03-gamehelpers.js'        , need:null },
  { f:'10-save.js'               , need:null },
  { f:'engines/circuit-solver.js', need:'engine:tsunagu' },
  { f:'engines/tsunagu-board.js' , need:'engine:tsunagu' },
  { f:'20-shell.js'              , need:null },
  { f:'engines/tsunagu.js'       , need:'engine:tsunagu' },
  { f:'engines/moon-art.js'      , need:'art' },          /* itemArt/shuffled。ならべる・むすぶ・すいり が つかう */
  { f:'engines/naraberu.js'      , need:'engine:naraberu' },
  { f:'engines/musubu.js'        , need:'engine:musubu' },
  { f:'engines/tsuriai.js'       , need:'engine:tsuriai' },
  { f:'engines/tenbin.js'        , need:'engine:tenbin' },
  { f:'engines/jikken.js'        , need:'engine:jikken' },
  { f:'engines/mitsukeru.js'     , need:'engine:mitsukeru' },
  { f:'engines/suiri.js'         , need:'engine:suiri' },
  { f:'engines/factory.js'       , need:'engine:factory' },
  { f:'engines/hatsuden.js'      , need:'engine:hatsuden' },
  { f:'engines/jishaku.js'       , need:'engine:jishaku' },
  { f:'engines/sodate.js'        , need:'engine:sodate' },
  { f:'engines/swing.js'         , need:'engine:swing' },
  { f:'90-clear.js'              , need:null },
  { f:'91-home.js'               , need:null },
  { f:'92-boot.js'               , need:null },
  { f:'99-tail.html'             , need:null },
];

/* ほんとうに ある エンジンの 名まえ。ステージデータの kind: を これと つき合わせて
   「その島に 要る エンジン」を 自動で 出す（エンジンを ふやしても ここに 1つ 足すだけ）。 */
const ENGINE_NAMES = ORDER
  .filter((b) => b.need && b.need.startsWith('engine:'))
  .map((b) => b.need.slice(7));

/* moon-art は この3つの エンジンの どれかが いれば 要る */
const ART_USERS = ['naraberu', 'musubu', 'suiri', 'tenbin'];

/* ---- 出力の 定義。島を ふやす ときは ここに 1つ 足す ---- */
const TARGETS = [
  { dir:'science-island', sub:'5つの島をめぐって、りかの ちからを つけよう！', islands:['energy','particle','life','earth','method'],
    name:'サイエンスアイランド', short:'りかの島', theme:'#1B7FA8', pwa:false,
    desc:'小学校理科を5つの島でめぐる学習ゲーム。電気回路・てこ・月と太陽など、中学・高校まで役立つ内容を、さわって確かめながら身につける。' },
  { dir:'energy-no-shima', sub:'でんき・じしゃく・てこ・ふりこ を たしかめよう！', islands:['energy','method'],
    name:'エネルギーの島', short:'エネルギーの島', theme:'#F2A33C', pwa:true, motif:'bolt',
    desc:'でんき回路・じしゃく・てこ・ふりこ・発電。さわって たしかめる 小学校理科の エネルギー分野。' },
  { dir:'tsubutsubu-no-shima', sub:'とけ方・水よう液・もえ方・重さ を たしかめよう！', islands:['particle','method'],
    name:'つぶつぶの島', short:'つぶつぶの島', theme:'#8B7BE8', pwa:true, motif:'flask',
    desc:'もののとけ方・水よう液・もえ方・ものの重さ。目に 見えない つぶで 考える 小学校理科。' },
  { dir:'inochi-no-shima', sub:'からだ・しょくぶつ・生きもの を たしかめよう！', islands:['life','method'],
    name:'いのちの島', short:'いのちの島', theme:'#4FC46A', pwa:true, motif:'sprout',
    desc:'人のからだ・植物の育ち・食べもののつながり・受粉。生きものの しくみを たしかめる 小学校理科。' },
  { dir:'chikyu-no-shima', sub:'月と太陽・天気・大地 を たしかめよう！', islands:['earth','method'],
    name:'ちきゅうの島', short:'ちきゅうの島', theme:'#3EA7D8', pwa:true, motif:'moon',
    desc:'月と太陽・天気・流れる水・大地のつくり。空と 大地を 見る 小学校理科。' },

  /* ---- ⚡エネルギーの島の 中みを、ゲーム 1つずつの アプリにも する（2026-09-10 ユーザー合意）----
     game: を 書くと その ゲームだけの アプリに なる。地図も 島の 一覧も なく、
     ひらくと いきなり その ゲームが はじまる。ポータルが ゲームえらびを する。
     セーブは ほかの りかアプリと 同じ 'science-island-save-v1' を 見て いるので、
     ここで クリアした ぶんも 「4島 クリアで 🔬かんがえかたの島」に ちゃんと 入る。 */
  { dir:'denki-kairo', game:'energy-denki', islands:['energy'], motif:'bulb',
    name:'でんき回路', short:'でんき回路', sub:'つないで たしかめよう', theme:'#F2A33C', pwa:true,
    desc:'かん電池・豆電球・スイッチを つないで あかりを つける 全31もん。直列・並列・ショートまで、さわって たしかめる 小学校理科。' },
  { dir:'teko-no-hataraki', game:'energy-teko', islands:['energy'], motif:'lever',
    name:'てこのはたらき', short:'てこ', sub:'つり合いの きまりを 見つけよう', theme:'#F2A33C', pwa:true,
    desc:'おもりを つるして てこを つり合わせる 全35もん。「おもさ×きょり」の きまりを じぶんで 見つける 小学校6年の理科。' },
  { dir:'furiko-goal', game:'energy-swing', islands:['energy'], motif:'pendulum',
    name:'ふりこゴール', short:'ふりこ', sub:'ふりこで ゴールを めざそう', theme:'#F2A33C', pwa:true,
    desc:'ふりこを ゆらして ゴールに とめる 全30もん。長さ・おもさ・ふれはばを かえて、1おうふくの 時間の きまりを たしかめる。' },
  { dir:'recycle-koujou', game:'energy-jishaku', islands:['energy'], motif:'crate',
    name:'リサイクル工場', short:'リサイクル工場', sub:'同じ ごみを つないで 加工品に！', theme:'#F2A33C', pwa:true,
    desc:'同じ ごみを つないで けして 加工品を つくる パズル。もえる・もえない・きけんの 分けかたを あそびながら おぼえる。' },
  { dir:'guruguru-hatsuden', game:'energy-hatsuden', islands:['energy'], motif:'battery',
    name:'ぐるぐる発電', short:'ぐるぐる発電', sub:'10びょう れんだ！ どこまで もつ？', theme:'#F2A33C', pwa:true,
    desc:'手回し発電機を 10びょう まわして 電気を ためる アクション。ためた 電気で 豆電球・モーターを どこまで 動かせる？' },
  { dir:'denjishaku-battle', game:'energy-cluster', islands:['energy'], motif:'magnet',
    name:'でんじしゃくバトル', short:'でんじしゃくバトル', sub:'でんじしゃくを 先に 置ききれ！', theme:'#F2A33C', pwa:true,
    desc:'N極・S極の しりぞけ合う 力で こまを はじく 対戦ゲーム。近いほど 力が 強い ことを 手で たしかめる 小学校理科。' },
];

/* ---- PWAの ファイル（4つの 島アプリぶん を 作る）----
   science-island の manifest.json と icon.svg は 手で 作った ものを そのまま つかう
   （pwa:false）。sw.js だけは キャッシュ名を 中身から 出したいので ぜんぶ 作りなおす。 */
const MOTIF = {
  bolt:   '<path d="M286 176 L196 300 h52 l-22 96 90 -132 h-52 Z" fill="#FFF3D0" stroke="#8A5A12" stroke-width="12" stroke-linejoin="round"/>',
  flask:  '<path d="M240 186 h32 v42 l40 66 a20 20 0 0 1 -17 30 h-78 a20 20 0 0 1 -17 -30 l40 -66 Z" fill="#FFFDF6" stroke="#3B2E6E" stroke-width="12" stroke-linejoin="round"/>' +
          '<path d="M210 288 h92 a20 20 0 0 1 -17 36 h-58 a20 20 0 0 1 -17 -36 Z" fill="#8B7BE8"/>' +
          '<line x1="232" y1="186" x2="280" y2="186" stroke="#3B2E6E" stroke-width="14" stroke-linecap="round"/>',
  sprout: '<path d="M256 330 V216" stroke="#2E7D46" stroke-width="16" stroke-linecap="round"/>' +
          '<path d="M256 250 q-58 -14 -74 -66 q56 -8 74 66 Z" fill="#4FC46A" stroke="#2E7D46" stroke-width="10" stroke-linejoin="round"/>' +
          '<path d="M256 228 q58 -18 76 -70 q-58 -6 -76 70 Z" fill="#7BD98F" stroke="#2E7D46" stroke-width="10" stroke-linejoin="round"/>',
  /* ⚡の 中の ゲームごとの アイコン。島の えは 同じで、まん中の えだけ かえる */
  bulb:   '<path d="M256 176 a56 56 0 0 1 34 100 v18 h-68 v-18 a56 56 0 0 1 34 -100 Z" fill="#FFF3D0" stroke="#8A5A12" stroke-width="12" stroke-linejoin="round"/>' +
          '<rect x="230" y="298" width="52" height="30" rx="8" fill="#C9B283" stroke="#8A5A12" stroke-width="10"/>' +
          '<path d="M256 214 v46" stroke="#F2A33C" stroke-width="12" stroke-linecap="round"/>',
  lever:  '<rect x="150" y="232" width="212" height="20" rx="10" fill="#FFF3D0" stroke="#8A5A12" stroke-width="12" transform="rotate(-12 256 242)"/>' +
          '<path d="M256 250 L206 330 h100 Z" fill="#C9B283" stroke="#8A5A12" stroke-width="12" stroke-linejoin="round"/>' +
          '<rect x="126" y="266" width="52" height="46" rx="8" fill="#8A5A12"/>',   /* ひだり端に ぶら下がる おもり */
  pendulum:'<path d="M256 168 L212 276" stroke="#8A5A12" stroke-width="12" stroke-linecap="round"/>' +
          '<circle cx="256" cy="168" r="14" fill="#8A5A12"/>' +
          '<circle cx="206" cy="298" r="34" fill="#FFF3D0" stroke="#8A5A12" stroke-width="12"/>' +
          '<path d="M296 214 a86 86 0 0 1 14 54" stroke="#FFF3D0" stroke-width="12" fill="none" stroke-linecap="round"/>',
  crate:  '<path d="M186 300 l-24 -84 h188 l-24 84 Z" fill="#FFF3D0" stroke="#8A5A12" stroke-width="12" stroke-linejoin="round"/>' +
          '<path d="M212 246 h88" stroke="#8A5A12" stroke-width="12" stroke-linecap="round"/>' +
          '<path d="M214 190 l24 -32 h36 l24 32" fill="none" stroke="#8A5A12" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>',
  battery:'<rect x="196" y="188" width="120" height="140" rx="16" fill="#FFF3D0" stroke="#8A5A12" stroke-width="12"/>' +
          '<rect x="232" y="164" width="48" height="26" rx="8" fill="#8A5A12"/>' +
          '<path d="M266 214 l-30 52 h34 l-22 48 54 -66 h-34 Z" fill="#F2A33C" stroke="#8A5A12" stroke-width="8" stroke-linejoin="round"/>',
  magnet: '<path d="M182 302 v-46 a74 74 0 0 1 148 0 v46 h-46 v-46 a28 28 0 0 0 -56 0 v46 Z" fill="#FFF3D0" stroke="#8A5A12" stroke-width="12" stroke-linejoin="round"/>' +
          '<rect x="176" y="296" width="58" height="40" rx="6" fill="#E24B4B" stroke="#8A5A12" stroke-width="10"/>' +
          '<rect x="278" y="296" width="58" height="40" rx="6" fill="#4A79D8" stroke="#8A5A12" stroke-width="10"/>',
  moon:   '<circle cx="256" cy="252" r="74" fill="#FFF3C4" stroke="#7A6A2E" stroke-width="10"/>' +
          '<path d="M256 178 a74 74 0 0 0 0 148 a56 74 0 0 1 0 -148 Z" fill="#E7D48A"/>' +
          '<circle cx="232" cy="228" r="13" fill="#E7D48A"/><circle cx="272" cy="286" r="9" fill="#E7D48A"/>',
};

function iconSvg(t) {
  const isl = islandLook()[t.islands[0]];
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="' + t.name + 'のアイコン">\n' +
    '  <defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#5FC6E8"/><stop offset="1" stop-color="#0E5B7C"/></linearGradient></defs>\n' +
    '  <rect width="512" height="512" fill="url(#sea)"/>\n' +
    '  <path d="M0 372 q42 -20 84 0 t84 0 t84 0 t84 0 t84 0 t84 0 V512 H0 Z" fill="#0E5B7C" opacity=".45"/>\n' +
    '  <path d="M0 412 q42 -20 84 0 t84 0 t84 0 t84 0 t84 0 t84 0 V512 H0 Z" fill="#0B4A66" opacity=".55"/>\n' +
    '  <ellipse cx="256" cy="368" rx="176" ry="34" fill="#083C55" opacity=".35"/>\n' +
    '  <path d="M72 356 Q96 288 168 276 Q206 200 268 210 Q356 220 382 296 Q436 308 440 356 Z" fill="' + isl.sand + '"/>\n' +
    '  <path d="M126 314 Q182 224 258 232 Q340 240 368 314 Z" fill="' + isl.color + '"/>\n' +
    '  ' + MOTIF[t.motif] + '\n</svg>\n';
}

/* 島の いろは src/01-intro.js の ISLANDS から そのまま とる（2か所に 書かない） */
let _look = null;
function islandLook() {
  if (_look) return _look;
  _look = {};
  const txt = read('01-intro.js');
  for (const m of txt.matchAll(/id:'([a-z]+)',[\s\S]*?color:'(#[0-9A-Fa-f]{6})', sand:'(#[0-9A-Fa-f]{6})'/g))
    _look[m[1]] = { color: m[2], sand: m[3] };
  return _look;
}

function manifestJson(t) {
  return JSON.stringify({
    name: t.name, short_name: t.short, description: t.desc, lang: 'ja',
    start_url: './index.html', scope: './', display: 'standalone', orientation: 'any',
    background_color: t.theme, theme_color: t.theme,
    icons: [{ src: './icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  }, null, 2) + '\n';
}

function swJs(t, html, images) {
  /* キャッシュ名は 中身から 出す。手で v1→v2 と 上げるのを 忘れて
     子どもの 端末に とどかない、という 事故（CLAUDE.md §4）が おきなく なる。 */
  const ver = crypto.createHash('sha1').update(html).digest('hex').slice(0, 8);
  const assets = ["'./'", "'./index.html'", "'./manifest.json'", "'./icon.svg'"]
    .concat(images.map((f) => "'./images/" + f + "'"));
  return '// ' + t.name + ' — Service Worker（build-islands.mjs が 作る。手で 直さない）\n' +
    '// キャッシュ名は index.html の 中身から 出して いる ので、中身が かわれば かならず かわる。\n' +
    "const CACHE = '" + t.dir + "-cache-" + ver + "';\n" +
    'const ASSETS = [\n  ' + assets.join(',\n  ') + ',\n];\n\n' +
    "self.addEventListener('install', (e) => {\n" +
    '  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));\n});\n\n' +
    "self.addEventListener('activate', (e) => {\n  e.waitUntil(\n    caches.keys().then((keys) =>\n" +
    '      // Cache Storageは全アプリ共有(同一オリジン)。自分の旧キャッシュだけ消す。\n' +
    "      Promise.all(keys.filter((k) => k.startsWith('" + t.dir + "-cache-') && k !== CACHE).map((k) => caches.delete(k)))\n" +
    '    ).then(() => self.clients.claim())\n  );\n});\n\n' +
    '// ネットワーク優先 + 失敗時キャッシュ(オフライン)。\n' +
    "self.addEventListener('fetch', (e) => {\n  if (e.request.method !== 'GET') return;\n  e.respondWith(\n" +
    '    fetch(e.request)\n      .then((res) => {\n        const copy = res.clone();\n' +
    '        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});\n        return res;\n      })\n' +
    "      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))\n  );\n});\n";
}

const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

/* ---- その アプリに 入れる ステージデータ ----
   ふつうは 島の ファイル まるごと。t.game が ある ときは その ゲームの ぶんだけ 切りだす。
   まるごと 入れると つかわない エンジン（リサイクル工場 63KB・でんじしゃく 60KB）まで
   ついて きて、1ゲームの アプリが 3ばい 重く なる。
   切り目は 「行あたま 2文字下げの { id:'○○'」。stages/*.js は ぜんぶ この 書き方。 */
function readStages(isl, t) {
  const txt = read('stages/' + isl + '.js');
  if (!t.game) return txt;
  const heads = [...txt.matchAll(/^  \{ id:'([a-z0-9-]+)'/gm)].map((m) => ({ id: m[1], i: m.index }));
  const want = [t.game];
  const out = [];
  for (let k = 0; k < heads.length; k++) {
    if (want.indexOf(heads[k].id) < 0) continue;
    const end = (k + 1 < heads.length) ? heads[k + 1].i : txt.length;
    out.push(txt.slice(heads[k].i, end).replace(/\s+$/, '') + '\n');
  }
  if (out.length !== want.length)
    throw new Error(t.dir + ': stages/' + isl + '.js に ' + want.join('・') + ' が 見つからない');
  return out.join('');
}

/* え（png）は それを つかう エンジンが 入って いる アプリだけに おく */
const ENGINE_IMAGES = {
  factory: 'recycle-transform-machine-v1.png',   /* リサイクル工場の 加工機 */
  jishaku: 'magnet-arena-texture.png',           /* でんじしゃくバトルの ばん */
};
function imagesFor(engines) {
  return Object.keys(ENGINE_IMAGES).filter((e) => engines.has(e)).map((e) => ENGINE_IMAGES[e]);
}

/* 見出し・タイトル・テーマ色を その アプリの ものに 入れかえる。
   （中身は 同じ src から 作るので、ここだけ 島ごとに ちがう） */
function headFor(t) {
  const rep = [
    ['<meta name="theme-color" content="#1B7FA8">', '<meta name="theme-color" content="' + t.theme + '">'],
    /* タイトル＋検索用タグ（description / canonical / OGP）。中身は ../build-seo.mjs が 1か所で 持つ */
    ['<title>サイエンスアイランド</title>',
     '<title>' + t.name + '｜' + SITE_NAME + '</title>\n' +
     seoHead({ title: t.name + '｜' + SITE_NAME,
               desc: t.desc + '｜小学校の先生「かがせん」が作った無料の教育・知育アプリ（広告なし・登録なし）。',
               url: SITE + t.dir + '/' })],
    ['<h1 class="home-title">サイエンスアイランド</h1>', '<h1 class="home-title">' + t.name + '</h1>'],
    ['<p class="home-sub">5つの島をめぐって、りかの ちからを つけよう！</p>',
     '<p class="home-sub">' + t.sub + '</p>'],
  ];
  let s = read('00-head.html');
  for (const [a, b] of rep) {
    if (!s.includes(a)) throw new Error('00-head.html に 見つからない: ' + a);
    s = s.replace(a, b);
  }
  if (t.islands.length < ALL_ISLANDS.length) {
    /* 島が じぶんの 1つだけの アプリからは、海の 地図を まるごと とりのぞく。
       島が 1つしか ない 地図は 見せる いみが なく、「◀ 地図」で そこへ 行けて しまうと
       行き止まりに なる（2026-08-30 ユーザー指てき）。
       🔬かんがえかたの島は 島の がめんの 下（methodSection）に 出す。 */
    const cut = (a, b, why) => {
      const i = s.indexOf(a);
      if (i < 0) throw new Error('00-head.html から ' + why + ' を とりのぞけない: ' + a);
      const j = s.indexOf(b, i) + b.length;
      s = s.slice(0, i) + s.slice(j);
    };
    cut('<!-- ========== ホーム：5つの島の地図 ========== -->', '<div class="map-wrap"><div class="map-inner" id="map-inner"></div></div>\n</div>\n', '地図の がめん');
    const back = '    <button class="back" onclick="go(\'home\')">◀ 地図</button>\n';
    if (!s.includes(back)) throw new Error('00-head.html から 「◀ 地図」ボタンを とりのぞけない');
    s = s.replace(back, '');
    /* 地図が ない ので、島の がめんが さいしょに 出る がめんに なる */
    s = s.replace('<div id="screen-island" class="screen">', '<div id="screen-island" class="screen on">');
  }
  if (t.game) {
    /* ゲームが 1つだけの アプリからは、島の がめん（ゲームの 一覧）も とりのぞく。
       ならぶ カードが 1まいしか ない 一覧は 見せる いみが なく、「◀ もどる」で
       そこへ 行けて しまうと 行き止まりに なる（地図を とりのぞいたのと 同じ 理由）。 */
    cutOut(() => s, (v) => { s = v; },
      '<!-- ========== 島：ミニゲームの一覧 ========== -->',
      '<div class="game-list" id="game-list"></div>\n</div>\n', '島の がめん');
    const back = '    <button class="back" id="game-back">◀ もどる</button>\n';
    if (!s.includes(back)) throw new Error('00-head.html から ゲームの「◀ もどる」を とりのぞけない');
    s = s.replace(back, '');
    s = s.replace('<div id="screen-game" class="screen">', '<div id="screen-game" class="screen on">');
    s = s.replace('<div id="screen-island" class="screen on">', '<div id="screen-island" class="screen">');
  }
  return s;
}
/* 「ここから ここまで」を まるごと 切りとる（getter/setter で 文字列を うけわたす） */
function cutOut(get, set, a, b, why) {
  const s = get();
  const i = s.indexOf(a);
  if (i < 0) throw new Error('00-head.html から ' + why + ' を とりのぞけない: ' + a);
  const j = s.indexOf(b, i) + b.length;
  set(s.slice(0, i) + s.slice(j));
}
const ALL_ISLANDS = ['energy', 'particle', 'life', 'earth', 'method'];

/* ぜんぶの ゲームの 「id と どの島か」。島ごとに アプリを 分けても
   「4島 クリアで かんがえかたの島が ひらく」を 見分けられる ように、
   どの アプリにも この 一覧を 入れる（判定は セーブの 図かんを 見る）。 */
function allGamesTable() {
  const rows = [];
  for (const isl of ALL_ISLANDS) {
    const txt = read('stages/' + isl + '.js');
    for (const m of txt.matchAll(/\{\s*id:'([^']+)',\s*island:'([^']+)'([\s\S]{0,400}?)stages:/g)) {
      if (/\bsoon:\s*true/.test(m[3])) continue;      /* じゅんびちゅうは 数えない */
      rows.push([m[1], m[2]]);
    }
  }
  return rows;
}

/* 島を しぼりこむ ブロック。5島 ぜんぶの ときは しぼりこまない。 */
function manifestBlock(t) {
  const islands = t.islands;
  const rows = allGamesTable();
  const table = rows.map((r) => "['" + r[0] + "','" + r[1] + "']").join(',');
  let s = '\n/* ---- ここは build-islands.mjs が 書きこむ。手で 直さない ---- */\n' +
          'var ALL_GAMES = [' + table + '];\n';
  /* きどう したとき いきなり ひらく 島。島えらびは ポータルが する ので、
     じぶんの 島が 1つだけの アプリは 海の 地図を とばして 島の 中を 見せる。
     地図（と 🔬かんがえかたの島）は 島の がめんの「◀ 地図」で 見に いける。 */
  s += 'var HOME_ISLAND = ' +
       (islands.length < ALL_ISLANDS.length ? "'" + islands[0] + "'" : 'null') + ';\n';
  /* ゲームが 1つだけの アプリは、ひらいた とたん その ゲームが はじまる。
     島の 一覧も 地図も ない（ゲームえらびは ポータルが する）。 */
  s += 'var HOME_GAME = ' + (t.game ? "'" + t.game + "'" : 'null') + ';\n';
  if (islands.length < ALL_ISLANDS.length) {
    s += '/* この アプリに 出す 島。島えらびは ポータル（かがせんのHAPPYアプリ集）が するので、\n' +
         '   ここでは じぶんの 島と、4島 クリアで ひらく かんがえかたの島だけを 出す。 */\n' +
         'var ONLY_ISLANDS = ' + JSON.stringify(islands) + ';\n' +
         'ISLANDS = ISLANDS.filter(function(i){ return ONLY_ISLANDS.indexOf(i.id) >= 0; });\n' +
         '/* 島が 2つの ときの 地図の おきどころ（5つの ときの ざひょうだと はしに よって しまう） */\n' +
         'if (ISLANDS.length === 2){\n' +
         '  ISLANDS[0].mx = 32; ISLANDS[0].my = 38; ISLANDS[0].nx = 32; ISLANDS[0].ny = 14;\n' +
         '  ISLANDS[1].mx = 68; ISLANDS[1].my = 66; ISLANDS[1].nx = 68; ISLANDS[1].ny = 89;\n' +
         '}\n';
  }
  return s;
}

/* その島たちの ステージデータから、つかって いる エンジンを ひろう */
function enginesFor(t) {
  const used = new Set();
  for (const isl of t.islands) {
    const txt = readStages(isl, t);
    for (const m of txt.matchAll(/kind:\s*'([a-zA-Z0-9_]+)'/g)) {
      if (ENGINE_NAMES.includes(m[1])) used.add(m[1]);
    }
  }
  return used;
}

/* ---- できた ものを ほんとうに 読みこんで たしかめる ----
   ブラウザの まねを した から っぽの がめんの 上で index.html の JS を 走らせ、
   ENGINES に 型が ぜんぶ そろうかを 見る。

   なぜ 要るか: 「ならべる」「みつける」など エンジンの 中みが、もとの 1ファイルでは
   よその エンジンの ところに まぎれて いる ことが ある（renderMitsukeru が そだて型の
   ところに あった）。文字を さがす だけでは 気づけず、その島だけ 遊べなく なる。
   じっさいに 走らせれば かならず つかまる。 */
/* きほんの そうさが つながって いるか。ここに 名まえを 足すと 見はりが ふえる。
   ev  … その id に addEventListener した か
   prop… その id に onclick などを 入れた か                                        */
const MUST_WIRE = [
  { id:'board',       ev:'click',   why:'ばんめんを タップしても 何も おきない' },
  { id:'stage-strip', ev:'click',   why:'1 2 3 の もんだいえらびが 効かない' },
  { id:'btn-hint',    prop:'onclick', why:'ヒントの ボタンが 効かない' },
  { id:'btn-reset',   prop:'onclick', why:'「はじめから」が 効かない' },
  { id:'modal-next',  prop:'onclick', why:'クリア後の「つぎへ」が 効かない' },
  { id:'modal-again', prop:'onclick', why:'クリア後の「もういちど」が 効かない' },
  { id:'modal-look', prop:'onclick', why:'クリア後の「見なおす」が 効かない' },
  { id:'cb-back',    prop:'onclick', why:'見なおし中の「けっかに もどる」が 効かない' },
  { id:'cb-next',    prop:'onclick', why:'見なおし中の「つぎへ すすむ」が 効かない' },
];

function checkEngines(t, html, want) {
  const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  const el = new Proxy({}, { get: (o, k) => (k === 'getAttribute' ? () => null
    : (k === 'setAttribute' || k === 'addEventListener' || k === 'appendChild') ? () => {} : el), set: () => true });
  /* id ごとに 「どんな そうさを つないだか」を おぼえる にせの 要素。
     型の コードが よその ファイルに まぎれて listener ごと 消えても、
     エラーは 出ない ので これで つかまえる（2026-09-10）。 */
  const wired = new Map();
  const cache = new Map();
  const byId = (id) => {
    if (cache.has(id)) return cache.get(id);
    const rec = { evs: new Set(), props: new Set() };
    wired.set(id, rec);
    const self = new Proxy({}, {
      get: (o, k) => (k === 'getAttribute' ? () => null
        : k === 'addEventListener' ? (ev) => rec.evs.add(ev)
        : (k === 'setAttribute' || k === 'appendChild') ? () => {} : self),
      set: (o, k) => { rec.props.add(k); return true; },
    });
    cache.set(id, self);
    return self;
  };
  const doc = { getElementById: byId, querySelector: () => el, querySelectorAll: () => [],
    addEventListener: () => {}, createElement: () => el, body: el, documentElement: el };
  const win = { addEventListener: () => {}, document: doc, scrollTo: () => {}, innerWidth: 1024, innerHeight: 768,
    matchMedia: () => ({ matches: false, addEventListener: () => {} }) };
  const ctx = { document: doc, window: win, navigator: {}, scrollTo: () => {}, matchMedia: win.matchMedia,
    localStorage: { getItem: () => null, setItem: () => {} }, console,
    setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {}, alert: () => {}, Math, JSON, parseInt, parseFloat, isNaN };
  try {
    vm.createContext(ctx);
    new vm.Script(js).runInContext(ctx);
  } catch (e) {
    throw new Error(t.dir + ': 読みこみで とまった ── ' + e.message +
      '\n   （その 型の 中みが よその エンジンの ファイルに まぎれて いないか 見ること）');
  }
  const got = Object.keys(ctx.ENGINES || {});
  const miss = [...want].filter((e) => !got.includes(e));
  if (miss.length) throw new Error(t.dir + ': ' + miss.join('・') + ' の ステージは ある のに ENGINES に とうろくされて いない');

  const dead = MUST_WIRE.filter((w) => {
    const rec = wired.get(w.id);
    if (!rec) return true;
    return w.ev ? !rec.evs.has(w.ev) : !rec.props.has(w.prop);
  });
  if (dead.length) throw new Error(t.dir + ': そうさが つながって いない ── ' +
    dead.map((d) => '#' + d.id + '（' + d.why + '）').join('・') +
    '\n   （その しょりが どこかの エンジンの ファイルの 中に 書いて ない か 見ること。' +
    '型に かんけいない そうさは 20-shell.js へ）');
}

/* ---- エンジンを またいだ よび出しの 見はり（2026-09-10 追加）----
   「その型の コードが よその エンジンの ファイルに 書いて ある」と、その型を つかわない
   アプリでだけ 動かなく なる。しかも **エラーは 出ない**（ボタンを おしても 何も
   おきないだけ）ので checkEngines では つかまらない。
   じっさい リサイクル工場の そうさボタン 一式が swing.js に あり、ふりこの 入って
   いない リサイクル工場の アプリで ぜんぶ 死んで いた。
   ここでは 「その アプリに 入れなかった エンジンファイルの 名まえ」を、
   入れた ファイルが よんで いないかを 見る。 */
function checkCrossEngine(t, usedFiles) {
  const engFiles = ORDER.map((b) => b.f).filter((f) => f.startsWith('engines/'));
  const defsOf = (f) => {
    const txt = read(f);
    const names = new Set();
    for (const m of txt.matchAll(/^function ([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
    for (const m of txt.matchAll(/^var ([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
    return names;
  };
  const outNames = new Map();                     /* 名まえ → どの ファイルの ものか */
  for (const f of engFiles) if (!usedFiles.includes(f)) for (const n of defsOf(f)) outNames.set(n, f);
  if (!outNames.size) return;
  const body = usedFiles.filter((f) => f.endsWith('.js') || f.startsWith('engines/'))
    .map((f) => read(f)).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  const bad = [];
  for (const [n, f] of outNames) if (new RegExp('\\b' + n + '\\b').test(body)) bad.push(n + '（' + f + '）');
  if (bad.length) throw new Error(t.dir + ': この アプリに 入って いない エンジンの ものを よんで いる ── ' +
    bad.join('・') + '\n   （その 型の コードは その 型の ファイルに うつす こと）');
}

function build(t) {
  const target = t;
  const islands = new Set(target.islands);
  const engines = enginesFor(target);
  const needArt = ART_USERS.some((e) => engines.has(e));
  const parts = [];
  const usedFiles = [];
  for (const b of ORDER) {
    if (b.f === '00-head.html') { parts.push(headFor(target)); continue; }
    if (b.f === '@manifest') { parts.push(manifestBlock(target)); continue; }
    if (b.need === null) { parts.push(read(b.f)); usedFiles.push(b.f); continue; }
    if (b.need === 'art') { if (needArt) { parts.push(read(b.f)); usedFiles.push(b.f); } continue; }
    const [kindOf, name] = b.need.split(':');
    if (kindOf === 'island') { if (islands.has(name)) parts.push(readStages(name, target)); continue; }
    if (engines.has(name)) { parts.push(read(b.f)); usedFiles.push(b.f); }
  }
  const html = parts.join('\n');
  checkEngines(t, html, engines);
  checkCrossEngine(t, usedFiles);
  return { html, engines: [...engines].sort(), images: imagesFor(engines) };
}

/* ここで 作る フォルダは build-seo.mjs の GENERATED に 入って いないと いけない。
   入って いないと build-seo が 生成物に SEOタグを 書きこんで しまい、
   つぎの --check が ずっと「ちがう」と 言う（2026-09-10 に じっさい やった）。 */
const forgot = TARGETS.map((t) => t.dir).filter((d) => !GENERATED.has(d));
if (forgot.length) {
  console.error('❌ build-seo.mjs の GENERATED に 足りない: ' + forgot.join('・'));
  process.exit(1);
}

let ng = 0;
for (const t of TARGETS) {
  const { html, engines, images } = build(t);
  const out = path.join(ROOT, t.dir, 'index.html');
  const before = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
  const same = before === html;
  const kb = Math.round(html.length / 1024);

  if (CHECK) {
    console.log((same ? '  = ' : '  ≠ ') + t.dir.padEnd(20) + kb + 'KB  エンジン: ' + engines.join(' '));
    if (!same && before !== null) ng++;
  } else {
    const dir = path.dirname(out);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(out, html);
    fs.writeFileSync(path.join(dir, 'sw.js'), swJs(t, html, images));
    if (t.pwa) {                                  /* science-island の は 手作りを のこす */
      fs.writeFileSync(path.join(dir, 'manifest.json'), manifestJson(t));
      fs.writeFileSync(path.join(dir, 'icon.svg'), iconSvg(t));
    }
    if (images.length) {                          /* え は それを つかう エンジンが 入った アプリだけ */
      fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
      for (const f of images) fs.copyFileSync(path.join(HERE, 'images', f), path.join(dir, 'images', f));
    }
    console.log('  ' + (same ? '（変化なし）' : '書きだし　　') + ' ' + t.dir.padEnd(20) + kb + 'KB  エンジン: ' + engines.join(' '));
  }
}
if (CHECK && ng) { console.log('\n❌ ' + ng + ' 件 ちがいが ある'); process.exit(1); }
if (CHECK) console.log('\n✅ 生成物は src/ と 一致して いる');
