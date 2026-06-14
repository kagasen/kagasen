/* 漢字の冒険：ストロークデータ・ビルドスクリプト（KanjiVG版）
 * KanjiVG(日本語字形・筆順つき) の SVG を取得し、
 *   - stroke: 元のパス d（中心線。お手本描画にそのまま使う）
 *   - median: パスを平坦化サンプリングした中心線座標 [[x,y]...]（採点・アニメ用）
 * を 109×109 座標系のまま grade2-strokes.js としてリポジトリ同梱する（実行時 通信なし）。
 *
 * 出典: KanjiVG (c) Ulrich Apel / CC BY-SA 3.0  http://kanjivg.tagaini.net
 * 使い方:  node kanji-bouken/build-strokes.mjs
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GH = 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/';

/* 小2配当漢字 160字（授業の順番どおり・全字） */
const KANJI = [
  '読','雪','言','行','南','書','絵','図','分','方',
  '春','思','記','曜','肉','話','聞','黄','色','黒',
  '太','毛','高','風','晴','多','形','長','数','体',
  '近','同','今','会','社','刀','切','内','店','姉',
  '妹','線','汽','海','回','歩','魚','広','前','元',
  '岩','教','光','知','考','室','組','後','丸','点',
  '買','友','羽','雲','夏','公','園','通','万','頭',
  '鳥','朝','顔','毎','家','当','間','昼','半','電',
  '外','声','楽','親','父','母','兄','弟','午','夜',
  '国','語','算','紙','来','時','帰','何','里','食',
  '明','池','週','番','東','京','古','寺','西','止',
  '道','場','台','新','船','米','秋','合','活','理',
  '作','馬','画','用','首','細','角','工','科','鳴',
  '戸','麦','茶','地','市','自','歌','心','答','野',
  '原','冬','星','少','走','交','遠','強','才','門',
  '弓','矢','谷','北','牛','引','売','弱','計','直'
];

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

/* 重複・字数ガード（160字ユニーク） */
const uniq = new Set(KANJI);
if (uniq.size !== KANJI.length){
  const seen = {}, dups = [];
  KANJI.forEach((c,i)=>{ if(seen[c]!=null)dups.push(c); else seen[c]=i; });
  console.error(`✗ 重複あり: ${dups.join('')}`); process.exit(1);
}
console.log(`字数: ${KANJI.length}（ユニーク ${uniq.size}）`);

const data = {};
let ok = 0;
for (const ch of KANJI){
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
`/* 自動生成：build-strokes.mjs（編集しないでください）
 * 出典: KanjiVG (c) Ulrich Apel / CC BY-SA 3.0  http://kanjivg.tagaini.net
 * 座標系: 109×109（Y下向き・反転不要）
 * stroke=中心線パスd / median=平坦化サンプル座標
 * ${ok}字 / 生成日時 ${new Date().toISOString()}
 */
const GRADE2_STROKES = ${JSON.stringify(data)};
if (typeof module !== 'undefined') module.exports = GRADE2_STROKES;
`;

await writeFile(join(__dirname, 'grade2-strokes.js'), out, 'utf8');
console.log(`\n書き出し完了: grade2-strokes.js (${ok}/${KANJI.length}字)`);
