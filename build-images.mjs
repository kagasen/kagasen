/* =====================================================================
   build-images.mjs — アプリ同梱画像(png/jpg)の WebP 生成
   実行: node build-images.mjs <アプリのフォルダ名> [--apply]
         node build-images.mjs --all [--apply]
   前提: python3 と Pillow（pip3 install --user pillow）

   なぜ必要か:
     生成AIで作った PNG は 1枚1MB を超えることがあり、sw.js で全部
     precache すると オリジン（kagasen.github.io）の保存容量を食いつぶす。
     Safari は容量を超えると **オリジンごと** データを捨てるので、
     localStorage に入っている子どもの記録まで道づれになる。
     絵はそのままに、ファイルだけ軽くするのが目的。

   やること:
     1. アプリの中の png/jpg を WebP（品質90・長辺1600pxまで）に変換する。
        見た目は変えない。元ファイルより大きくなる場合は変換しない。
     2. --apply をつけると、html/js/json の中の「〜.png」という参照を
        「〜.webp」に書きかえる。sw.js の ASSETS もこれで一緒に直る。
     3. `${...}.png` のように名前を組み立てている場所は機械で直せないので、
        「手で直すところ」として最後に一覧で出す。

   さわらないもの（SNS・ホーム画面用は png/jpg のままである必要がある）:
     ogp / icon / favicon / apple-touch / manifest.json から参照される画像
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const QUALITY = 90;      // 見た目が変わらない範囲でいちばん小さくなる値（実測で元の4〜8%）
const MAX_SIDE = 1600;   // iPad(dpr2)の最大表示幅より十分大きい。これ以上は見分けがつかない

const SRC_EXT = /\.(html|js|mjs|jsx|json|css)$/i;
const IMG_EXT = /\.(png|jpe?g)$/i;
// SNS・ホーム画面アイコンなど、png/jpg のままにしておくもの。
// ★ファイル名だけで判定する（フォルダ名で見ると home-icons のような
//   ふつうの絵まで巻きこむ。実際に一度やらかした）。
const PROTECT_NAME = /^(ogp|favicon|apple-touch-icon|icon)([-_.]|$)/i;
const SKIP_DIR = new Set(['node_modules', 'vendor', '.git', '.cache', 'fonts']);

function walk(dir, hit) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, hit);
    else hit(p);
  }
}

function convert(files) {
  // python(Pillow)へ一括で渡す。1枚ずつ起動すると遅いため。
  const py = `
import sys, json, os
from PIL import Image
jobs = json.loads(sys.stdin.read())
out = []
for src, dst, q, mx in jobs:
    try:
        im = Image.open(src)
        if im.mode not in ('RGB', 'RGBA'):
            im = im.convert('RGBA' if 'A' in im.getbands() or im.mode == 'P' else 'RGB')
        im.thumbnail((mx, mx), Image.LANCZOS)
        im.save(dst, 'WEBP', quality=q, method=6)
        out.append([src, dst, os.path.getsize(src), os.path.getsize(dst), None])
    except Exception as e:
        out.append([src, dst, 0, 0, str(e)])
print(json.dumps(out))
`;
  const jobs = files.map(f => [f, f.replace(IMG_EXT, '.webp'), QUALITY, MAX_SIDE]);
  const res = execFileSync('python3', ['-c', py], { input: JSON.stringify(jobs), maxBuffer: 1 << 28 });
  return JSON.parse(res.toString());
}

function build(appDir, apply) {
  const abs = path.join(ROOT, appDir);
  if (!fs.statSync(abs).isDirectory()) return null;

  let images = []; const sources = [];
  walk(abs, p => {
    if (IMG_EXT.test(p) && !PROTECT_NAME.test(path.basename(p))) images.push(p);
    else if (SRC_EXT.test(p)) sources.push(p);
  });
  if (!images.length) return null;

  // git が無視するファイル（作業用の素材フォルダなど）は公開されないので変換しない
  try {
    // -z（NUL区切り）で受け渡す。日本語のファイル名だと git が出力を
    // クォート・エスケープしてしまい、照合に失敗するため。
    const rel = images.map(p => path.relative(ROOT, p)).join('\0');
    const out = execFileSync('git', ['check-ignore', '-z', '--stdin'], { cwd: ROOT, input: rel })
      .toString().split('\0').filter(Boolean);
    if (out.length) {
      const ignored = new Set(out.map(f => path.join(ROOT, f)));
      images = images.filter(p => !ignored.has(p));
    }
  } catch (e) { /* 無視されるファイルが1つもないと git は終了コード1を返す */ }

  // git がまだ知らないファイル（作業中のスクリーンショットなど）も変換しない。
  // 公開するつもりの画像は先に git add してから実行する。
  const untracked = [];
  try {
    const tracked = new Set(execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, maxBuffer: 1 << 28 })
      .toString().split('\0').filter(Boolean).map(f => path.join(ROOT, f)));
    const keep = images.filter(p => tracked.has(p));
    untracked.push(...images.filter(p => !tracked.has(p)));
    images = keep;
  } catch (e) { /* git が使えない場所ではそのまま進む */ }
  if (!images.length) return null;

  // すでに新しい .webp があるものは飛ばす（何度実行しても同じ結果になるように）
  const todo = images.filter(p => {
    const w = p.replace(IMG_EXT, '.webp');
    return !fs.existsSync(w) || fs.statSync(w).mtimeMs < fs.statSync(p).mtimeMs;
  });

  let before = 0, after = 0, failed = [];
  if (todo.length) {
    for (const r of convert(todo)) {
      if (r[4]) { failed.push([r[0], r[4]]); continue; }
      // 逆に大きくなるものは webp を捨てて元のまま使う
      if (r[3] >= r[2]) { fs.unlinkSync(r[1]); continue; }
    }
  }
  // 変換できた画像＝webpが存在するもの
  const done = images.filter(p => fs.existsSync(p.replace(IMG_EXT, '.webp')));
  for (const p of done) {
    before += fs.statSync(p).size;
    after += fs.statSync(p.replace(IMG_EXT, '.webp')).size;
  }

  // 参照の書きかえ
  const names = new Set(done.map(p => path.basename(p)));
  let rewritten = 0;
  const manual = [];
  for (const s of sources) {
    if (path.basename(s) === 'manifest.json') continue;   // ホーム画面アイコンはさわらない
    let txt = fs.readFileSync(s, 'utf8');
    const orig = txt;
    for (const n of names) {
      if (!txt.includes(n)) continue;
      // og:image / apple-touch-icon の行はさわらない
      txt = txt.split('\n').map(line =>
        /og:image|twitter:image|apple-touch-icon|rel=["']icon/.test(line) ? line
          : line.split(n).join(n.replace(IMG_EXT, '.webp'))
      ).join('\n');
    }
    if (txt !== orig) { rewritten++; if (apply) fs.writeFileSync(s, txt); }
    // 名前を組み立てている場所（機械では直せない）を拾う
    const t = apply ? txt : orig;
    t.split('\n').forEach((line, i) => {
      if (/\$\{[^}]*\}[^'"`]*\.(png|jpe?g)/.test(line) && !/og:image|apple-touch|favicon/.test(line))
        manual.push(`${path.relative(ROOT, s)}:${i + 1}  ${line.trim().slice(0, 100)}`);
    });
  }
  return { appDir, count: done.length, before, after, rewritten, manual, failed, untracked };
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
let targets = args.filter(a => !a.startsWith('--'));
// --all の対象外。images/ はポータルのサムネイルで、OGP生成(build-ogp.mjs)と
// apps.js の参照が絡むため、まとめ処理には入れない（必要なら名指しで実行する）。
const ALL_SKIP = new Set(['images', 'tmp']);
if (args.includes('--all')) {
  targets = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIR.has(e.name) && !ALL_SKIP.has(e.name))
    .map(e => e.name);
}
if (!targets.length) {
  console.log('使い方: node build-images.mjs <アプリのフォルダ名> [--apply] / --all');
  process.exit(1);
}

const MB = n => (n / 1024 / 1024).toFixed(1) + 'MB';
let tb = 0, ta = 0;
const allManual = [];
for (const t of targets) {
  const r = build(t, apply);
  if (!r) continue;
  tb += r.before; ta += r.after;
  console.log(`■ ${r.appDir}  ${r.count}枚  ${MB(r.before)} → ${MB(r.after)}  (${(r.after / r.before * 100).toFixed(1)}%)  参照書きかえ ${r.rewritten}ファイル${apply ? '' : '（下見のみ）'}`);
  r.failed.forEach(([f, e]) => console.log(`   ⚠ 変換できず: ${path.relative(ROOT, f)} — ${e}`));
  if (r.untracked.length) console.log(`   ・git 未追跡のため対象外 ${r.untracked.length}枚（公開するなら git add してから再実行）`);
  allManual.push(...r.manual);
}
console.log(`\n合計: ${MB(tb)} → ${MB(ta)}  (${tb ? (ta / tb * 100).toFixed(1) : 0}%)`);
if (allManual.length) {
  console.log('\n★ 名前を組み立てている参照＝手で .webp に直すところ:');
  [...new Set(allManual)].forEach(m => console.log('   ' + m));
}
if (!apply) console.log('\n（--apply をつけると参照の書きかえも実行します）');
