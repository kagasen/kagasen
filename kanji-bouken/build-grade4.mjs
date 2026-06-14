/* 漢字の冒険：小4ストロークデータ・ビルドスクリプト（KanjiVG版）
 * 小4配当漢字 202字（信〜唱・授業の順番どおり）の SVG を取得し
 * grade4-strokes.js として同梱する（実行時 通信なし）。
 *
 * 出典: KanjiVG (c) Ulrich Apel / CC BY-SA 3.0  http://kanjivg.tagaini.net
 * 使い方:  node kanji-bouken/build-grade4.mjs
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GH = 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/';

/* 小4配当漢字 202字（授業の順番どおり） */
const KANJI = [
  '信','達','飛','席','建','菜','例','料','良','照',
  '熱','府','児','関','辞','典','成','訓','類','順',
  '愛','昨','城','覚','伝','説','好','印','要','的',
  '必','初','案','街','試','選','観','静','旗','材',
  '栃','群','埼','潟','井','梨','岡','茨','奈','富',
  '岐','阜','季','節','別','郡','戦','争','最','給',
  '機','包','帯','泣','勇','軍','兵','隊','輪','特',
  '夫','衣','氏','祝','徒','競','約','清','完','法',
  '滋','阪','徳','香','佐','賀','崎','熊','沖','縄',
  '媛','鹿','未','希','望','民','働','健','康','散',
  '令','位','置','欠','満','栄','養','卒','単','結',
  '果','漁','径','副','臣','梅','灯','貨','変','種',
  '続','折','積','飯','松','不','議','差','念','連',
  '景','末','司','録','参','加','挙','協','験','極',
  '芸','無','械','以','博','管','便','孫','量','借',
  '仲','底','浅','焼','利','笑','省','残','周','課',
  '然','浴','芽','改','共','願','失','辺','低','敗',
  '老','束','票','陸','各','産','求','付','固','塩',
  '側','労','標','官','巣','候','察','兆','億','鏡',
  '害','刷','治','努','倉','札','功','器','英','牧',
  '冷','唱'
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

/* 重複・字数ガード（202字ユニーク） */
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
`/* 自動生成：build-grade4.mjs（編集しないでください）
 * 出典: KanjiVG (c) Ulrich Apel / CC BY-SA 3.0  http://kanjivg.tagaini.net
 * 座標系: 109×109（Y下向き・反転不要）
 * stroke=中心線パスd / median=平坦化サンプル座標
 * 漢字 ${ok}字 / 生成日時 ${new Date().toISOString()}
 */
const GRADE4_STROKES = ${JSON.stringify(data)};
if (typeof module !== 'undefined') module.exports = GRADE4_STROKES;
`;

await writeFile(join(__dirname, 'grade4-strokes.js'), out, 'utf8');
console.log(`\n書き出し完了: grade4-strokes.js (${ok}/${KANJI.length}字)`);
