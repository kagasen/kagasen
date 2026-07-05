/* =====================================================================
   build-fonts.mjs — 同梱フォント(fonts/*.woff2)の生成
   実行: node kanji-bouken/build-fonts.mjs
   前提: python3 と fontTools（pip3 install --user fonttools brotli）

   なにをするか:
   1. アプリが実際に表示しうる文字を kanji-bouken 内のファイルから機械収集
      （index.html / grade*-data.js / grade*-strokes.js / backup-kit.js。
        strokesのキー＝収録全字も文字としてファイルに現れるので拾える）
   2. Google Fonts の公式リポジトリ(github.com/google/fonts, SIL OFL)から
      Zen Maru Gothic(400/700/900) と Klee One(400/600) のTTFを取得
   3. 収集した文字だけにサブセット化した woff2 を fonts/ に出力
      （全字収録だと5書体で数十MBになるため。index.html の @font-face が読む）

   ★漢字・語句データを増やしたら（build-gradeN.mjs 再生成後）これも再実行して
     fonts/*.woff2 を作り直し、sw.js の CACHE を繰り上げること。
     未収録の文字はシステムフォントで表示される（崩れはしないが字体が変わる）。
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'fonts');

/* ---------- 1. 使用文字の収集 ---------- */
const SOURCES = fs.readdirSync(DIR).filter(f =>
  f === 'index.html' || f === 'backup-kit.js' || /^grade\d-(data|strokes)\.js$/.test(f));
const chars = new Set();
for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCodePoint(c)); // ASCII一式
for (const f of SOURCES) {
  for (const ch of fs.readFileSync(path.join(DIR, f), 'utf8')) {
    const cp = ch.codePointAt(0);
    if (cp > 0x7e && cp !== 0xfeff) chars.add(ch);
  }
}
fs.mkdirSync(OUT, { recursive: true });
const textFile = path.join(OUT, 'chars.txt');
fs.writeFileSync(textFile, [...chars].sort().join(''));
console.log(`使用文字: ${chars.size}字（${SOURCES.length}ファイルから収集）→ fonts/chars.txt`);

/* ---------- 2. TTF取得（SIL OFL） ---------- */
const GF = 'https://github.com/google/fonts/raw/main/ofl';
const FONTS = [
  { url: `${GF}/zenmarugothic/ZenMaruGothic-Regular.ttf`, out: 'ZenMaruGothic-Regular.woff2' },
  { url: `${GF}/zenmarugothic/ZenMaruGothic-Bold.ttf`,    out: 'ZenMaruGothic-Bold.woff2' },
  { url: `${GF}/zenmarugothic/ZenMaruGothic-Black.ttf`,   out: 'ZenMaruGothic-Black.woff2' },
  { url: `${GF}/kleeone/KleeOne-Regular.ttf`,             out: 'KleeOne-Regular.woff2' },
  { url: `${GF}/kleeone/KleeOne-SemiBold.ttf`,            out: 'KleeOne-SemiBold.woff2' },
];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kanji-fonts-'));
for (const f of FONTS) {
  const ttf = path.join(tmp, path.basename(f.url));
  console.log(`取得: ${path.basename(f.url)}`);
  const res = await fetch(f.url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${f.url} → HTTP ${res.status}`);
  fs.writeFileSync(ttf, Buffer.from(await res.arrayBuffer()));

  /* ---------- 3. サブセット化 → woff2 ---------- */
  const out = path.join(OUT, f.out);
  execFileSync('python3', ['-m', 'fontTools.subset', ttf,
    `--text-file=${textFile}`, '--flavor=woff2', `--output-file=${out}`,
    '--layout-features=*', '--no-hinting', '--desubroutinize']);
  console.log(`  → fonts/${f.out} (${Math.round(fs.statSync(out).size / 1024)}KB)`);
}
console.log('完了。index.html の @font-face がこれらを読む。sw.js の CACHE 繰り上げを忘れずに。');
