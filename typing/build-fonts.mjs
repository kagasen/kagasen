/* =====================================================================
   build-fonts.mjs — typing の同梱フォント(fonts/*.woff2)生成
   実行: node typing/build-fonts.mjs
   前提: python3 と fontTools（pip3 install --user fonttools brotli）

   kanji-bouken/build-fonts.mjs と同じ流儀。typing 配下の全 html/js から
   表示しうる文字を機械収集し、Mochiy Pop One / Zen Maru Gothic を
   その文字だけにサブセット化して fonts/ に出力する。
   各ページは fonts.css（@font-face定義）を読む。
   ★出題語・UI文言を増やしたら再実行すること（未収録字はシステムフォント代替）。
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'fonts');

/* ---------- 1. 使用文字の収集（typing配下の全 html/js。vendor/ は表示文字なしのため除外） ---------- */
const files = [];
(function walk(d) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) { if (ent.name !== 'vendor' && ent.name !== 'fonts') walk(p); }
    else if (/\.(html|js)$/.test(ent.name) && ent.name !== 'build-fonts.mjs') files.push(p);
  }
})(DIR);
const chars = new Set();
for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCodePoint(c));
for (const f of files) {
  for (const ch of fs.readFileSync(f, 'utf8')) {
    const cp = ch.codePointAt(0);
    if (cp > 0x7e && cp !== 0xfeff) chars.add(ch);
  }
}
fs.mkdirSync(OUT, { recursive: true });
const textFile = path.join(OUT, 'chars.txt');
fs.writeFileSync(textFile, [...chars].sort().join(''));
console.log(`使用文字: ${chars.size}字（${files.length}ファイルから収集）→ fonts/chars.txt`);

/* ---------- 2. TTF取得（SIL OFL）→ 3. サブセット化 ---------- */
const GF = 'https://github.com/google/fonts/raw/main/ofl';
const FONTS = [
  { url: `${GF}/mochiypopone/MochiyPopOne-Regular.ttf`,   out: 'MochiyPopOne-Regular.woff2' },
  { url: `${GF}/zenmarugothic/ZenMaruGothic-Regular.ttf`, out: 'ZenMaruGothic-Regular.woff2' },
  { url: `${GF}/zenmarugothic/ZenMaruGothic-Bold.ttf`,    out: 'ZenMaruGothic-Bold.woff2' },
  { url: `${GF}/zenmarugothic/ZenMaruGothic-Black.ttf`,   out: 'ZenMaruGothic-Black.woff2' },
];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'typing-fonts-'));
for (const f of FONTS) {
  const ttf = path.join(tmp, path.basename(f.url));
  console.log(`取得: ${path.basename(f.url)}`);
  const res = await fetch(f.url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${f.url} → HTTP ${res.status}`);
  fs.writeFileSync(ttf, Buffer.from(await res.arrayBuffer()));
  const out = path.join(OUT, f.out);
  execFileSync('python3', ['-m', 'fontTools.subset', ttf,
    `--text-file=${textFile}`, '--flavor=woff2', `--output-file=${out}`,
    '--layout-features=*', '--no-hinting', '--desubroutinize']);
  console.log(`  → fonts/${f.out} (${Math.round(fs.statSync(out).size / 1024)}KB)`);
}
console.log('完了。各ページの fonts.css がこれらを読む。');
