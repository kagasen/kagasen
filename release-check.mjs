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
     7. 全HTMLのインラインJSの構文チェック（構文エラー=アプリ全滅の検出）
     8. 外部JS（HTMLから読み込まれる .js）の構文チェック
     9. CSS順序の hidden×display 衝突
    10. 古いiPadで死ぬ新しめJS構文（?. ?? 等 ES2020+）の検出
    11. build-seo.mjs の走らせ忘れ（検索用タグ・sitemap.xml が apps.js とずれている）

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
  // mainitimondai は 2026-07-07 に Firebase 撤去（未使用の死にコードだった）。再発したら❌検出される。
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
    /<iframe[^>]*\ssrc=["'](https?:\/\/[^"']+)/gi,
    /@import\s+url\(\s*["']?(https?:\/\/[^"')]+)/gi,
    /url\(\s*["']?(https?:\/\/[^"')]+)/gi,
  ];
  for (const re of res) for (const m of html.matchAll(re)) out.add(m[1]);
  /* <link> だけは rel を 見る。canonical / alternate は 「このページの 正しいURLは これ」と
     検索エンジンに 伝える 印で、ページを 開くときに 読みに 行く ものでは ない
     （＝オフラインでも 動く）。ここを 外部読み込み扱いすると SEOタグが 全部 ❌に なる。 */
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = (tag.match(/\srel=["']([^"']*)["']/i) || [, ''])[1].toLowerCase();
    if (rel === 'canonical' || rel === 'alternate') continue;
    const href = tag.match(/\shref=["'](https?:\/\/[^"']+)/i);
    if (href) out.add(href[1]);
  }
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

/* ---------- 7. インラインJSの構文チェック ---------- */
/* 前例: 2026-07-06の脱CDNフォント置換で classroom-board / kannjibusyu-ta の
   インラインJSがクォート崩れ（'px 'Hiragino…）の構文エラーになり、
   スクリプト全体が死んで「何も押せない」事故が起きた（発覚は翌日）。
   構文エラーは1個でもスクリプト全体を殺すので、サブページ含む全HTMLを検査する。 */
function* walkHtml(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name) || ent.name === 'vendor' || ent.name.startsWith('.')) continue;
      yield* walkHtml(path.join(dir, ent.name));
    } else if (ent.name.endsWith('.html')) {
      yield path.join(dir, ent.name);
    }
  }
}
for (const file of walkHtml(ROOT)) {
  const rel = path.relative(ROOT, file);
  const app = rel.includes(path.sep) ? rel.split(path.sep)[0] : '.';
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;                       // 外部ファイルは対象外
    const type = (attrs.match(/type\s*=\s*["']([^"']+)/i) || [])[1] || '';
    if (type && !/module|javascript/i.test(type)) continue;       // text/babel(JSX)・JSON等はスキップ
    const code = m[2];
    if (!code.trim()) continue;
    if (/module/i.test(type)) {
      // ESモジュールは import/export があるため node --check で検査
      const tmp = path.join(ROOT, `.rc-tmp-${Math.random().toString(36).slice(2)}.mjs`);
      fs.writeFileSync(tmp, code);
      try { execFileSync(process.execPath, ['--check', tmp], { stdio: ['pipe', 'pipe', 'pipe'] }); }
      catch (e) {
        const firstLine = String(e.stderr).split('\n').find(l => l.includes('Error')) || '構文エラー';
        err(app, `${rel} のインラインJS(module)に構文エラー: ${firstLine.trim()}（スクリプト全体が動かなくなる）`);
      }
      finally { fs.unlinkSync(tmp); }
    } else {
      // new Function はパース（構文検査）だけに使い、実行はしない（返り値を呼ばない）
      try { new Function(code); }
      catch (e) { err(app, `${rel} のインラインJSに構文エラー: ${e.message}（スクリプト全体が死んで「何も押せない」状態になる）`); }
    }
  }
}

/* ---------- 8. 外部JS（HTMLから読み込まれる .js）の構文チェック ---------- */
/* インライン(項目7)だけでなく <script src="…local.js"> の実体も検査する。
   実際に読み込まれるファイルだけを対象にするので、JSXソース(typing/app.js は
   app.compiled.js だけが読まれる)やビルドスクリプトは自然に除外される。 */
const localScripts = new Map();  // 絶対パス -> 参照元(rel)
for (const file of walkHtml(ROOT)) {
  const dir = path.dirname(file);
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) {
    const ref = m[1];
    if (/^(https?:)?\/\//i.test(ref)) continue;            // 外部URLは項目2で扱う
    const abs = path.resolve(dir, ref.split('?')[0]);      // ?v= を除去
    if (abs.includes('/vendor/') || abs.includes('/node_modules/')) continue;
    if (!abs.endsWith('.js') || !fs.existsSync(abs)) continue;
    if (!localScripts.has(abs)) localScripts.set(abs, path.relative(ROOT, file));
  }
}
for (const [abs, referrer] of localScripts) {
  const rel = path.relative(ROOT, abs);
  const app = rel.includes(path.sep) ? rel.split(path.sep)[0] : '.';
  try { execFileSync(process.execPath, ['--check', abs], { stdio: ['pipe', 'pipe', 'pipe'] }); }
  catch (e) {
    const firstLine = String(e.stderr).split('\n').find(l => l.includes('Error')) || '構文エラー';
    err(app, `${rel}（${referrer} から読込）に構文エラー: ${firstLine.trim()}（アプリ全体が動かなくなる）`);
  }
}

/* ---------- 9. CSS順序による hidden×display 衝突 ---------- */
/* 前例: 2026-07-06の脱CDNで tailwind.css を<head>先頭に置いたため、後に来る
   カスタムCSS（.victory-overlay/.message-modal 等の display:flex）が Tailwind の
   .hidden（display:none）に勝ち、オーバーレイ/モーダルが起動時から出っぱなしに
   なって操作不能になった（taiiku-tournament / shukudai）。
   検出: ①tailwind.css の<link>がインライン<style>より前 ②<style>内に display を
   設定するカスタムクラス ③そのクラスが要素上で単独の「hidden」と同居。→ 該当は❌。
   直し方: tailwind.css の<link>を </style> の後（=最後）へ移す（CDN時代と同じ順序）。 */
for (const file of walkHtml(ROOT)) {
  const rel = path.relative(ROOT, file);
  const app = rel.includes(path.sep) ? rel.split(path.sep)[0] : '.';
  const src = fs.readFileSync(file, 'utf8');
  const head = src.split('</head>')[0];
  const mLink = head.match(/<link[^>]*href="[^"]*tailwind\.css"/i);
  const mStyle = head.match(/<style/i);
  if (!mLink || !mStyle) continue;
  if (head.indexOf(mLink[0]) >= head.indexOf(mStyle[0])) continue;   // 順序OK（tailwindが後）
  const styleTxt = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  const displayClasses = new Set();
  for (const b of styleTxt.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (/display\s*:\s*(flex|grid|block|inline-flex|table)/.test(b[2]))
      for (const c of b[1].matchAll(/\.([a-zA-Z0-9_-]+)/g)) displayClasses.add(c[1]);
  }
  if (displayClasses.size === 0) continue;
  const conflicts = new Set();
  for (const t of src.matchAll(/class="([^"]*)"/g)) {
    const classes = new Set(t[1].split(/\s+/));
    if (!classes.has('hidden')) continue;                            // 単独の hidden のみ
    for (const c of classes) if (displayClasses.has(c)) conflicts.add(c);
  }
  if (conflicts.size)
    err(app, `${rel}: tailwind.css を<style>より先に読み込むため .hidden が効かない（.${[...conflicts].join(' .')} の display が勝つ→モーダル/オーバーレイが出っぱなし）。tailwindの<link>を</style>の後へ移すこと`);
}

/* ---------- 10. 古いiPadで死ぬ新しめJS構文（ES2020+）の検出 ---------- */
/* 前例: 2026-07-10「iPadでいくつかのアプリが開けない」報告。原因は ?.（オプショナル
   チェーン）や ??（Null合体）＝ES2020構文。iPadOS 13.3以前のSafariはこれを
   パースできず、**1箇所でもあるとそのスクリプト全体が構文エラーで死ぬ**。
   Node(項目7・8)は最新構文を通してしまうので、ここで別途検出する。
   text/babel(JSX) も対象（ブラウザ内Babelは JSXだけ変換し ?. 等は素通しするため）。
   注意: 文字列・コメントは除外するが、テンプレートリテラル内の ${式} は検査対象に
   残す（実際に level-up-adventure のバグは `${state.profile?.name}` だった）。 */
function stripStringsAndComments(code) {
  let out = '';
  let i = 0;
  const n = code.length;
  // tplDepth: `${` で code に戻った回数をスタックで管理（` の中の ${…} は検査対象）
  const stack = [];  // 'tpl' が積まれている間はテンプレートリテラル内
  let mode = 'code';
  while (i < n) {
    const c = code[i], c2 = code.slice(i, i + 2);
    if (mode === 'code') {
      if (c2 === '//') { mode = 'line'; out += '  '; i += 2; continue; }
      if (c2 === '/*') { mode = 'block'; out += '  '; i += 2; continue; }
      if (c === "'") { mode = 'sq'; out += ' '; i++; continue; }
      if (c === '"') { mode = 'dq'; out += ' '; i++; continue; }
      if (c === '`') { mode = 'tpl'; out += ' '; i++; continue; }
      if (c === '}' && stack[stack.length - 1] === 'tpl') { stack.pop(); mode = 'tpl'; out += ' '; i++; continue; }
      if (c === '{') { stack.push('brace'); out += c; i++; continue; }
      out += c; i++; continue;
    }
    if (mode === 'line') { if (c === '\n') { mode = 'code'; out += '\n'; } else out += ' '; i++; continue; }
    if (mode === 'block') { if (c2 === '*/') { mode = 'code'; out += '  '; i += 2; } else { out += (c === '\n' ? '\n' : ' '); i++; } continue; }
    if (mode === 'sq' || mode === 'dq') {
      if (c === '\\') { out += '  '; i += 2; continue; }
      if ((mode === 'sq' && c === "'") || (mode === 'dq' && c === '"')) { mode = 'code'; out += ' '; i++; continue; }
      out += (c === '\n' ? '\n' : ' '); i++; continue;
    }
    if (mode === 'tpl') {
      if (c === '\\') { out += '  '; i += 2; continue; }
      if (c2 === '${') { stack.push('tpl'); mode = 'code'; out += '  '; i += 2; continue; }
      if (c === '`') { mode = 'code'; out += ' '; i++; continue; }
      out += (c === '\n' ? '\n' : ' '); i++; continue;
    }
  }
  return out;
}
const ES_KILLERS = [
  { re: /\(\?<[=!]/, label: '正規表現の後読み (?<=…)', min: 'iPadOS 16.4' },
  { re: /\bstatic\s*\{/, label: 'クラスの static ブロック', min: 'iPadOS 16.4' },
  { re: /\?\?=|\|\|=|&&=/, label: '論理代入演算子 (??= ||= &&=)', min: 'iPadOS 14' },
  { re: /\?\?/, label: 'Null合体演算子 (??)', min: 'iPadOS 13.4' },
  { re: /(^|[^?.])\?\.(?![0-9])/, label: 'オプショナルチェーン (?.)', min: 'iPadOS 13.4' },
];
function checkEsKillers(app, label, code) {
  const stripped = stripStringsAndComments(code);
  const reported = new Set();
  for (const k of ES_KILLERS) {
    if (reported.has('??') && k.label.includes('Null合体')) continue;  // ??= を報告済みなら ?? は重複
    const m = stripped.match(k.re);
    if (!m) continue;
    if (k.re.source.includes('\\?\\?=')) reported.add('??');
    const line = stripped.slice(0, m.index).split('\n').length;
    err(app, `${label} の${line}行目付近に ${k.label} がある（${k.min}未満のSafariで構文エラー→スクリプト全体が死んでアプリが開けない）。古い書き方に直すこと`);
  }
}
for (const file of walkHtml(ROOT)) {
  const rel = path.relative(ROOT, file);
  const app = rel.includes(path.sep) ? rel.split(path.sep)[0] : '.';
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = (attrs.match(/type\s*=\s*["']([^"']+)/i) || [])[1] || '';
    if (type && !/module|javascript|babel/i.test(type)) continue;  // JSON等はスキップ・babelは対象
    if (!m[2].trim()) continue;
    checkEsKillers(app, `${rel} のインラインJS${/babel/i.test(type) ? '(JSX)' : ''}`, m[2]);
  }
}
for (const [abs, referrer] of localScripts) {
  const rel = path.relative(ROOT, abs);
  const app = rel.includes(path.sep) ? rel.split(path.sep)[0] : '.';
  checkEsKillers(app, `${rel}（${referrer} から読込）`, fs.readFileSync(abs, 'utf8'));
}

/* ---------- 11. 検索用タグ・sitemap.xml の作りなおし忘れ ---------- */
/* アプリを足したのに `node build-seo.mjs` を走らせないと、そのアプリは
   <title>・description・canonical が入らず sitemap.xml にも載らない＝検索に出ない。
   ここで比べるのではなく、生成する本人（build-seo.mjs --check）に聞く。
   そうすれば「生成の決まりごと」が2か所に散らばらない（CLAUDE.md §8）。 */
if (exists('build-seo.mjs')) {
  let out = '';
  let stale = false;
  try {
    out = execFileSync('node', ['build-seo.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    /* --check は 差分が あると 終了コード1 で おわる */
    out = (e.stdout || '') + (e.stderr || '');
    stale = true;
  }
  if (stale) {
    const files = out.split('\n').filter(l => /^\s{2,}\S/.test(l)).map(l => l.trim());
    err('SEO', 'apps.js と 検索用タグ／sitemap.xml がずれている（`node build-seo.mjs` の走らせ忘れ）'
      + (files.length ? `: ${files.join(', ')}` : ''));
  }
  const draft = out.match(/まだ 公開しない アプリ .*/);
  if (draft) warn('SEO', draft[0] + '（意図どおりならOK）');
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
