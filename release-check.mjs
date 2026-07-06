#!/usr/bin/env node
/* =====================================================================
   release-check.mjs — 公開前チェック（検出して日本語で報告するだけ。修正はしない）

   使い方:  node release-check.mjs        （詳細は RELEASE-CHECK.md）
   終了コード: エラーあり=1 / 警告のみ・すべてOK=0

   検査項目:
     1. apps.js の link/image の実在 ＋ 未登録アプリフォルダの検出
     2. 各 index.html の外部読み込み（CDN・Webフォント等）＝オフライン原則違反
     3. PWAファイル（manifest.json / sw.js / icon.svg）の有無
     4. ?v= 付きで読まれる .js が変更されたのに ?v= が据え置きのケース
     5. アプリ内ファイルが変更されたのに sw.js の CACHE が据え置きのケース
     6. 出典・ライセンスクレジットの存在（KanjiVG／栃木県チャレンジカード集）

   エラー（❌ 公開を止めるべき）と 警告（⚠️ 既知の負債・要らない心配かも）を区別する。
   Node標準機能のみ・外部パッケージなし（このリポジトリのオフライン主義に合わせる）。
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/* --- 既知の負債（2026-07-04時点で外部読み込みが残っているアプリ）。
       ここに載っているアプリの外部読み込みは「警告」、載っていないアプリで
       新たに見つかったら「エラー」。解消できたらこのリストから削ること。
       '.' はルートのポータル index.html。 --- */
const KNOWN_EXTERNAL = new Set([
  // 2026-07-06 の脱CDNで全アプリの Tailwind/フォント/ライブラリを同梱化済み。
  // 残る外部参照は Firebase（オンライン機能＝サービス依存で同梱不可）だけ。
  '.',              // ポータル: 訪問カウンター（オフライン時はガードでスキップ）
  'typing',         // 訪問カウンター（同上）
  'mainitimondai',  // 2〜6年ページの成績記録（firebase v11 ESM）
]);

/* --- クレジット表記（消えていたらエラー）。アプリを増やしたらここに足す --- */
const CREDITS = [
  { app: 'kanji-bouken', file: 'index.html', patterns: [/KanjiVG/, /Ulrich Apel|CC BY[-\s]?SA/i],
    label: 'KanjiVG（© Ulrich Apel / CC BY-SA 3.0）のクレジット' },
  { app: 'ugoki-no-kiroku', file: 'index.html', patterns: [/チャレンジカード/, /栃木/],
    label: '栃木県「みんなが使えるチャレンジカード集」の出典表記' },
];

/* アプリフォルダ扱いしないディレクトリ */
const IGNORE_DIRS = new Set(['node_modules', 'images', '.git', '.claude']);

const findings = [];  // {level:'error'|'warn', app, msg}
const err  = (app, msg) => findings.push({ level: 'error', app, msg });
const warn = (app, msg) => findings.push({ level: 'warn',  app, msg });

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

function git(...args) {
  // stderrは捨てる（BASEに無い新規ファイルの git show が fatal を出すのは想定内）
  try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }); }
  catch { return null; }
}

/* ---------- アプリ一覧 ---------- */
const appDirs = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && !IGNORE_DIRS.has(d.name) && !d.name.startsWith('.'))
  .map(d => d.name)
  .filter(name => exists(path.join(name, 'index.html')))
  .sort();

/* ---------- 1. apps.js の整合 ---------- */
/* apps.js は「フラットなオブジェクトの配列」なので、コードとして評価せず
   正規表現で {…} ブロックごとに id/title/link/image だけ抜き出す（eval不使用） */
let entries = [];
try {
  const src = read('apps.js');
  const field = (block, key) => {
    const m = block.match(new RegExp(`${key}\\s*:\\s*["']([^"']*)["']`));
    return m ? m[1] : null;
  };
  entries = [...src.matchAll(/\{[^{}]*\}/g)].map(([block]) => ({
    id: field(block, 'id'), title: field(block, 'title'),
    link: field(block, 'link'), image: field(block, 'image'),
  })).filter(e => e.id || e.link);
  if (entries.length === 0) err('apps.js', 'apps.js からエントリを1件も読み取れなかった（形式が変わった？）');
} catch (e) {
  err('apps.js', `apps.js を読み取れない: ${e.message}`);
}
const registered = new Set();
for (const ent of entries) {
  const name = ent.title || ent.id || '(名無し)';
  if (!ent.link) { err('apps.js', `「${name}」に link がない`); }
  else {
    registered.add(ent.link.split('/')[0]);
    if (!exists(ent.link)) err('apps.js', `「${name}」の link 先が存在しない: ${ent.link}`);
  }
  if (!ent.image) warn('apps.js', `「${name}」に image がない`);
  else if (!exists(ent.image)) err('apps.js', `「${name}」の image が存在しない: ${ent.image}`);
}
for (const dir of appDirs) {
  if (!registered.has(dir)) warn(dir, 'index.html があるのに apps.js（ポータル）に未登録');
}

/* ---------- 2. 外部読み込み（オフライン原則） ---------- */
function externalRefs(html) {
  const out = new Set();
  const res = [
    /<script[^>]*\ssrc=["'](https?:\/\/[^"']+)/gi,
    /<link[^>]*\shref=["'](https?:\/\/[^"']+)/gi,
    /<iframe[^>]*\ssrc=["'](https?:\/\/[^"']+)/gi,
    /@import\s+url\(\s*["']?(https?:\/\/[^"')]+)/gi,
    /url\(\s*["']?(https?:\/\/[^"')]+)/gi,
  ];
  for (const re of res) for (const m of html.matchAll(re)) out.add(m[1]);
  // タグ以外（JS内の fetch 等）から既知CDNホストへの参照も拾う
  // 前例: hiraganarensyu が かな筆順データを 実行時に cdn.jsdelivr.net から fetch していた
  const cdnHosts = /https?:\/\/(cdn\.jsdelivr\.net|fastly\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)[^"'`\s)\\]*/g;
  for (const m of html.matchAll(cdnHosts)) out.add(m[0]);
  return [...out];
}
/* 検査対象HTML: ポータル・各アプリの index.html に加え、apps.js の link 先が
   index.html 以外のアプリ（例: kannjibusyu-ta/kanjibusyu-ta.html）も拾う */
const htmlTargets = new Map([['.', 'index.html']]);
for (const dir of appDirs) htmlTargets.set(dir, path.join(dir, 'index.html'));
for (const ent of entries) {
  const dir = ent.link && ent.link.split('/')[0];
  if (dir && !htmlTargets.has(dir) && exists(ent.link)) htmlTargets.set(dir, ent.link);
}
for (const [dir, htmlPath] of htmlTargets) {
  const label = dir === '.' ? 'ルート(ポータル)' : dir;
  const refs = externalRefs(read(htmlPath));
  if (refs.length === 0) continue;
  const hosts = [...new Set(refs.map(u => { try { return new URL(u).host; } catch { return u; } }))];
  const msg = `外部読み込みあり（完全オフライン原則に反する）: ${hosts.join(', ')}`;
  if (KNOWN_EXTERNAL.has(dir)) warn(label, msg + '（既知の負債）');
  else err(label, msg + '（新規！ オフラインで開けないおそれ）');
}

/* ---------- 3. PWAファイルの有無 ---------- */
for (const dir of [...htmlTargets.keys()].filter(d => d !== '.')) {
  const missing = ['manifest.json', 'sw.js', 'icon.svg'].filter(f => !exists(path.join(dir, f)));
  if (missing.length) warn(dir, `PWAファイルなし: ${missing.join(' / ')}（ホーム追加・オフライン起動が不完全）`);
}

/* ---------- 4・5. git差分と ?v= / CACHE の繰り上げ ---------- */
/* 公開＝origin/main への push とみなし、それ以降の変更（ローカルコミット＋未コミット）を対象にする */
const BASE = git('rev-parse', '--verify', '-q', 'origin/main') ? 'origin/main' : 'HEAD';
const changed = (git('diff', '--name-only', BASE) || '').split('\n').filter(Boolean);
const showAt = (p) => git('show', `${BASE}:${p}`);  // BASE時点の中身（無ければ null＝新規）

const verOf = (html, base) => {
  const m = html && html.match(new RegExp(`["'](?:\\./)?${base.replace('.', '\\.')}\\?v=(\\d+)["']`));
  return m ? m[1] : null;
};
for (const f of changed) {
  const m = f.match(/^([^/]+)\/([^/]+\.js)$/);
  if (!m || m[2] === 'sw.js') continue;
  const [, dir, jsName] = m;
  if (!appDirs.includes(dir)) continue;
  const nowHtml = read(path.join(dir, 'index.html'));
  const newV = verOf(nowHtml, jsName);
  if (newV === null) continue;                       // ?v= 付きで読まれていないjsは対象外
  const oldV = verOf(showAt(`${dir}/index.html`), jsName);
  if (oldV !== null && oldV === newV)
    err(dir, `${jsName} が変更されたのに index.html の ?v=${newV} が据え置き（子どもの端末に反映されない）`);
}

const cacheOf = (sw) => { const m = sw && sw.match(/CACHE\s*=\s*["']([^"']+)["']/); return m ? m[1] : null; };
for (const dir of appDirs) {
  if (!exists(path.join(dir, 'sw.js'))) continue;
  const appChanges = changed.filter(f => f.startsWith(dir + '/') && !f.endsWith('/sw.js') && !f.endsWith('.md'));
  if (appChanges.length === 0) continue;
  const oldSw = showAt(`${dir}/sw.js`);
  if (oldSw === null) continue;                      // sw.js自体が新規なら繰り上げ不要
  const oldC = cacheOf(oldSw), newC = cacheOf(read(path.join(dir, 'sw.js')));
  if (oldC && newC && oldC === newC)
    err(dir, `ファイル変更あり（${appChanges.length}件）なのに sw.js の CACHE「${newC}」が据え置き（PWAに反映されない）`);
}

/* ---------- 6. クレジット表記 ---------- */
for (const c of CREDITS) {
  const p = path.join(c.app, c.file);
  if (!exists(p)) { err(c.app, `${c.file} が存在しない（クレジット確認不能）`); continue; }
  const html = read(p);
  if (!c.patterns.every(re => re.test(html)))
    err(c.app, `${c.label} が見つからない（ライセンス上、絶対に消してはいけない表記）`);
}

/* ---------- 結果表示 ---------- */
const errors = findings.filter(f => f.level === 'error');
const warns  = findings.filter(f => f.level === 'warn');
const byApp = new Map();
for (const f of findings) {
  if (!byApp.has(f.app)) byApp.set(f.app, []);
  byApp.get(f.app).push(f);
}
console.log('================ 公開前チェック（release-check） ================');
console.log(`対象: アプリ ${appDirs.length}こ / apps.js 登録 ${entries.length}件 / 比較基準 ${BASE}\n`);
for (const [app, list] of [...byApp.entries()].sort()) {
  console.log(`■ ${app}`);
  for (const f of list) console.log(`  ${f.level === 'error' ? '❌ エラー' : '⚠️  警告'}: ${f.msg}`);
  console.log('');
}
if (findings.length === 0) {
  console.log('✅ すべてOK！ 問題は見つかりませんでした。');
} else {
  console.log('----------------------------------------------------------------');
  console.log(`結果: ❌ エラー ${errors.length}件（公開前に直す） / ⚠️ 警告 ${warns.length}件（既知の負債・確認のみ）`);
  if (errors.length === 0) console.log('エラーはありません。警告は既知のものか確認のうえ公開してOKです。');
}
process.exit(errors.length ? 1 : 0);
