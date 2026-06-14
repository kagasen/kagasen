/* 漢字の冒険：小1ストロークデータ・ビルドスクリプト（KanjiVG版）
 * ひらがな（あ〜ん46字）→ カタカナ（ア〜ン46字）→ 漢字（木〜力80字）の順で
 * KanjiVG の SVG を取得し grade1-strokes.js として同梱する（実行時 通信なし）。
 *
 * 出典: KanjiVG (c) Ulrich Apel / CC BY-SA 3.0  http://kanjivg.tagaini.net
 * 使い方:  node kanji-bouken/build-grade1.mjs
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GH = 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/';

/* ひらがな あ〜ん（46字・五十音順） */
const HIRA = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'];
/* カタカナ ア〜ン（46字・五十音順） */
const KATA = [...'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'];
/* 小1配当漢字 80字（授業の順番どおり） */
const KANJI = [
  '木','大','小','一','二','三','四','五','六','七','八','九','十',
  '子','空','男','女','手','天','青','見','学','校',
  '虫','文','正','字','山','水','雨','上','下','日',
  '火','田','川','竹','月','車','人','気','本','森',
  '出','中','町','入','名','夕','百','円','千','花',
  '休','金','土','糸','目','玉','村','白','音','赤',
  '生','耳','王','口','年','立','草','先','犬','早',
  '貝','林','右','足','石','左','力'
];
const CHARS = [...HIRA, ...KATA, ...KANJI];

const fileFor = ch => ch.codePointAt(0).toString(16).padStart(5,'0') + '.svg';

/* d文字列を絶対座標のポリライン（中心線サンプル）へ平坦化 */
function flattenPath(d, steps = 12){
  const tok = d.match(/[MmLlHhVvCcSsQqTtZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const pts = [];
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = '';
  let px = 0, py = 0; // 直前の制御点（S/T用）
  const num = () => parseFloat(tok[i++]);
  const add = (x, y) => { const l = pts[pts.length-1]; if (!l || Math.hypot(x-l[0], y-l[1]) > 0.4) pts.push([+x.toFixed(2), +y.toFixed(2)]); };
  const cubic = (x1,y1,x2,y2,x,y) => {
    for (let s = 1; s <= steps; s++){
      const t = s/steps, u = 1-t;
      add(u*u*u*cx + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x,
          u*u*u*cy + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y);
    }
    px = x2; py = y2; cx = x; cy = y;
  };
  const quad = (x1,y1,x,y) => {
    for (let s = 1; s <= steps; s++){
      const t = s/steps, u = 1-t;
      add(u*u*cx + 2*u*t*x1 + t*t*x, u*u*cy + 2*u*t*y1 + t*t*y);
    }
    px = x1; py = y1; cx = x; cy = y;
  };
  while (i < tok.length){
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase();
    const bx = rel ? cx : 0, by = rel ? cy : 0;
    switch (cmd.toUpperCase()){
      case 'M': cx = bx+num(); cy = by+num(); sx=cx; sy=cy; add(cx,cy); cmd = rel?'l':'L'; break;
      case 'L': cx = bx+num(); cy = by+num(); add(cx,cy); break;
      case 'H': cx = bx+num(); add(cx,cy); break;
      case 'V': cy = by+num(); add(cx,cy); break;
      case 'C': { const x1=bx+num(),y1=by+num(),x2=bx+num(),y2=by+num(),x=bx+num(),y=by+num(); cubic(x1,y1,x2,y2,x,y); break; }
      case 'S': { const x1=2*cx-px,y1=2*cy-py,x2=bx+num(),y2=by+num(),x=bx+num(),y=by+num(); cubic(x1,y1,x2,y2,x,y); break; }
      case 'Q': { const x1=bx+num(),y1=by+num(),x=bx+num(),y=by+num(); quad(x1,y1,x,y); break; }
      case 'T': { const x1=2*cx-px,y1=2*cy-py,x=bx+num(),y=by+num(); quad(x1,y1,x,y); break; }
      case 'Z': cx=sx; cy=sy; add(cx,cy); break;
      default: i++; // 不明トークンはスキップ
    }
  }
  return pts;
}

/* SVGから筆順どおりの stroke パス d を抽出 */
function extractStrokes(svg){
  const re = /<path[^>]*\bid="kvg:[0-9a-f]+-s\d+"[^>]*\bd="([^"]+)"/g;
  const out = []; let m;
  while ((m = re.exec(svg))) out.push(m[1]);
  return out;
}

const data = {};
let ok = 0;
for (const ch of CHARS){
  const url = GH + fileFor(ch);
  const res = await fetch(url);
  if (!res.ok){ console.error(`✗ ${ch}: HTTP ${res.status}`); continue; }
  const svg = await res.text();
  const ds = extractStrokes(svg);
  if (!ds.length){ console.error(`✗ ${ch}: strokeパス無し`); continue; }
  data[ch] = {
    code: ch.codePointAt(0),
    strokes: ds,
    medians: ds.map(d => flattenPath(d))
  };
  ok++;
  console.log(`✓ ${ch}  (${ds.length}画)`);
}

const out =
`/* 自動生成：build-grade1.mjs（編集しないでください）
 * 出典: KanjiVG (c) Ulrich Apel / CC BY-SA 3.0  http://kanjivg.tagaini.net
 * 座標系: 109×109（Y下向き・反転不要）
 * stroke=中心線パスd / median=平坦化サンプル座標
 * ひらがな46＋カタカナ46＋漢字80 ＝ ${ok}字 / 生成日時 ${new Date().toISOString()}
 */
const GRADE1_STROKES = ${JSON.stringify(data)};
if (typeof module !== 'undefined') module.exports = GRADE1_STROKES;
`;

await writeFile(join(__dirname, 'grade1-strokes.js'), out, 'utf8');
console.log(`\n書き出し完了: grade1-strokes.js (${ok}/${CHARS.length}字)`);
