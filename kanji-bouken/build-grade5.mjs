/* 漢字の冒険：小5ストロークデータ・ビルドスクリプト（KanjiVG版）
 * 小5配当漢字 193字（像〜堂・授業の順番どおり／「永」は「久」の前に挿入）の SVG を取得し
 * grade5-strokes.js として同梱する（実行時 通信なし）。
 *
 * 出典: KanjiVG (c) Ulrich Apel / CC BY-SA 3.0  http://kanjivg.tagaini.net
 * 使い方:  node kanji-bouken/build-grade5.mjs
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GH = 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/';

/* 小5配当漢字 193字（授業の順番どおり・「永」は「久」の前） */
const KANJI = [
  '像','経','情','象','絶','厚','賞','状','喜','解',
  '容','技','術','適','許','可','複','構','桜','銅',
  '破','修','復','眼','停','祖','準','備','貿','易',
  '際','潔','質','報','告','属','確','識','因','造',
  '似','限','留','現','接','応','勢','河','歴','史',
  '幹','招','句','常','序','武','士','資','査','性',
  '非','総','測','舎','往','演','刊','肥','製','謝',
  '罪','暴','防','鉱','績','志','航','夢','編','険',
  '断','境','態','逆','判','圧','得','比','政','興',
  '示','張','個','支','迷','在','独','弁','検','提',
  '寄','余','仏','貸','効','条','件','保','評','価',
  '賛','妻','混','雑','略','採','禁','能','過','程',
  '豊','布','減','護','再','増','証','責','任','統',
  '酸','素','設','授','紀','財','脈','織','築','旧',
  '規','則','貯','型','液','基','額','故','婦','救',
  '格','職','移','墓','義','殺','貧','版','述','仮',
  '飼','綿','居','永','久','毒','営','犯','講','師',
  '精','慣','囲','益','災','枝','費','税','制','衛',
  '耕','損','粉','均','輸','団','務','快','燃','率',
  '領','導','堂'
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

/* 重複・字数ガード（193字ユニーク） */
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
}
console.log(`取得 ${ok}/${KANJI.length}字`);

const out =
`/* 自動生成：build-grade5.mjs（編集しないでください）
 * 出典: KanjiVG (c) Ulrich Apel / CC BY-SA 3.0  http://kanjivg.tagaini.net
 * 座標系: 109×109（Y下向き・反転不要）
 * stroke=中心線パスd / median=平坦化サンプル座標
 * 漢字 ${ok}字 / 生成日時 ${new Date().toISOString()}
 */
const GRADE5_STROKES = ${JSON.stringify(data)};
if (typeof module !== 'undefined') module.exports = GRADE5_STROKES;
`;

await writeFile(join(__dirname, 'grade5-strokes.js'), out, 'utf8');
console.log(`\n書き出し完了: grade5-strokes.js (${ok}/${KANJI.length}字)`);
