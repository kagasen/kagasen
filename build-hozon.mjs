// build-hozon.mjs — 保存の見はり（hozon-guard.js）を 各ページの <head> 先頭に 埋めこむ（2026-09-16）
//
//   node build-hozon.mjs          埋めこむ／原本が かわっていれば 入れかえる
//   node build-hozon.mjs --check  埋めこみが 原本と ちがうページを 出すだけ（書きこまない）
//
// ★原本は hozon-guard.js。ページの中の <!-- kagasen-hozon --> … <!-- /kagasen-hozon --> は 手で直さない。
// ★外部ファイルにせず 埋めこむ理由: <head> で ほかのスクリプトより先に・オフラインでも かならず動かすため
//   （キャッシュの取りこぼしで 見はりだけ 抜ける、が おきない）。
// ★ページが かわったアプリは sw.js の CACHE を 自動で 繰り上げる（CLAUDE.md §4）。
//   りかの島（build-islands.mjs の 生成物）は src/00-head.html にも 入れて、
//   sw.js の CACHE は build-islands と 同じ計算（index.html の sha1 先頭8文字）で 出しなおす。
// ★対象は「localStorage に 書くページ」だけ。新しく 記録を持つアプリを 作ったら PAGES に足す。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CHECK = process.argv.includes('--check');

const SIMPLE = [
  'classroom-board', 'kanji-bouken', 'kannjibusyu-ta', 'kotobasagashi', 'level-up-adventure',
  'rekishi-battle', 'sakkanojikan', 'sekai-o-mawarou', 'shinmatorikusu', 'shukudai',
  'sikou-tool-app', 'taiiku-relay', 'todofuken-bouken', 'ugoki-no-kiroku',
];
const ISLANDS = [   /* build-islands.mjs の TARGETS と 同じ（セーブは全部 science-island-save-v1） */
  'science-island', 'energy-no-shima', 'tsubutsubu-no-shima', 'inochi-no-shima', 'chikyu-no-shima',
  'denki-kairo', 'teko-no-hataraki', 'furiko-goal', 'recycle-koujou', 'guruguru-hatsuden', 'denjishaku-battle',
];

function typingPages() {
  const out = [];
  (function walk(d) {
    for (const f of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = d + '/' + f.name;
      if (f.isDirectory()) { if (f.name !== 'vendor' && f.name !== 'fonts' && f.name !== 'images') walk(p); }
      else if (f.name.endsWith('.html')) out.push(p);
    }
  })('typing');
  return out.sort();
}

/* { file, sw: 'bump' | 'island' | null } */
const PAGES = [{ file: 'index.html', sw: null }]   /* ポータル（sw.js なし。kagasen_click_* を書く） */
  .concat(SIMPLE.map((d) => ({ file: d + '/index.html', sw: 'bump' })))
  .concat(typingPages().map((f) => ({ file: f, sw: 'bump' })))
  .concat([{ file: 'science-island/src/00-head.html', sw: null }])
  .concat(ISLANDS.map((d) => ({ file: d + '/index.html', sw: 'island' })));

const OPEN = '<!-- kagasen-hozon -->';
const CLOSE = '<!-- /kagasen-hozon -->';
const guard = fs.readFileSync(path.join(ROOT, 'hozon-guard.js'), 'utf8').trim();
const BLOCK = OPEN + '\n<script>\n' + guard + '\n</script>\n' + CLOSE;

function inject(html, file) {
  const a = html.indexOf(OPEN);
  if (a >= 0) {
    const b = html.indexOf(CLOSE, a);
    if (b < 0) throw new Error(file + ': ' + OPEN + ' の とじが ない');
    return html.slice(0, a) + BLOCK + html.slice(b + CLOSE.length);
  }
  /* 最初の <head> の すぐ後ろ。★<header> や テンプレート文字列の中の </head>（shukudai 等）に 入れない */
  const m = /<head(\s[^>]*)?>/i.exec(html);
  if (!m) throw new Error(file + ': <head> が 見つからない');
  const at = m.index + m[0].length;
  return html.slice(0, at) + '\n' + BLOCK + html.slice(at);
}

const changedDirs = new Map();   /* dir → 'bump' | 'island' */
let ng = 0;
for (const p of PAGES) {
  const full = path.join(ROOT, p.file);
  const before = fs.readFileSync(full, 'utf8');
  const after = inject(before, p.file);
  if (before === after) { if (!CHECK) console.log('  = ' + p.file); continue; }
  if (CHECK) { console.log('  ≠ ' + p.file); ng++; continue; }
  fs.writeFileSync(full, after);
  console.log('  ✎ ' + p.file);
  if (p.sw) changedDirs.set(p.file.split('/')[0], p.sw);
}

if (!CHECK) {
  for (const [dir, kind] of changedDirs) {
    const swPath = path.join(ROOT, dir, 'sw.js');
    const sw = fs.readFileSync(swPath, 'utf8');
    let next;
    if (kind === 'island') {
      const html = fs.readFileSync(path.join(ROOT, dir, 'index.html'), 'utf8');
      const ver = crypto.createHash('sha1').update(html).digest('hex').slice(0, 8);
      next = sw.replace(/(const CACHE = '[\w-]+-cache-)[0-9a-f]{8}(';)/, '$1' + ver + '$2');
    } else {
      /* ★コミット前に 何回 走らせても +1 だけにする（HEAD と もう ちがう＝繰り上げずみ なら さわらない） */
      const cacheOf = (t) => { const m = /const CACHE = '([^']+)'/.exec(t); return m ? m[1] : null; };
      let head = null;
      try { head = cacheOf(execFileSync('git', ['show', 'HEAD:' + dir + '/sw.js'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch (e) {}
      if (head && head !== cacheOf(sw)) { console.log('  = ' + dir + '/sw.js  ' + cacheOf(sw) + '（繰り上げずみ）'); continue; }
      next = sw.replace(/(const CACHE = '[\w-]+-v)(\d+)(';)/, (_, a, n, b) => a + (Number(n) + 1) + b);
    }
    if (next === sw) { if (kind === 'island') continue; throw new Error(dir + '/sw.js の CACHE を 繰り上げられない'); }
    fs.writeFileSync(swPath, next);
    console.log('  ⬆ ' + dir + '/sw.js  ' + /const CACHE = '([^']+)'/.exec(next)[1]);
  }
}
if (CHECK && ng) { console.error('❌ 埋めこみが 古いページ: ' + ng + '（node build-hozon.mjs を 走らせる）'); process.exit(1); }
