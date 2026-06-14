/* 漢字の冒険：小6ストロークデータ・ビルドスクリプト（KanjiVG版）
 * 小6配当漢字 191字（視〜済・授業の順番どおり）の SVG を取得し
 * grade6-strokes.js として同梱する（実行時 通信なし）。
 *
 * 出典: KanjiVG (c) Ulrich Apel / CC BY-SA 3.0  http://kanjivg.tagaini.net
 * 使い方:  node kanji-bouken/build-grade6.mjs
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GH = 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/';

/* 小6配当漢字 191字（授業の順番どおり） */
const KANJI = [
  '視','砂','腹','段','並','降','認','洗','異','純',
  '射','背','捨','舌','乱','域','誌','映','拡','展',
  '蔵','訪','我','承','蒸','処','就','臨','従','恩',
  '裁','律','脳','臓','腸','肺','胃','私','密','呼',
  '吸','存','刻','激','簡','机','難','疑','券','障',
  '派','警','署','銭','勤','諸','供','収','納','枚',
  '染','宣','暮','探','座','幼','著','権','尊','庁',
  '装','届','沿','冊','宇','宙','俳','誤','幕','晩',
  '模','窓','延','論','樹','覧','値','源','退','厳',
  '優','推','貴','策','縮','棒','熟','尺','寸','揮',
  '痛','批','傷','若','閉','遺','翌','縦','頂','忠',
  '誠','敵','蚕','己','除','仁','泉','裏','系','盟',
  '欲','株','善','班','危','割','否','至','宅','糖',
  '紅','卵','乳','創','奏','誕','困','看','筋','盛',
  '骨','巻','宝','郷','敬','秘','聖','絹','拝','鋼',
  '亡','干','衆','郵','賃','孝','預','穀','俵','訳',
  '忘','暖','詞','朗','胸','片','劇','将','皇','后',
  '陛','憲','党','閣','革','宗','垂','層','磁','操',
  '補','担','姿','討','専','潮','針','穴','灰','奮',
  '済'
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

/* 重複・字数ガード（191字ユニーク） */
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
`/* 自動生成：build-grade6.mjs（編集しないでください）
 * 出典: KanjiVG (c) Ulrich Apel / CC BY-SA 3.0  http://kanjivg.tagaini.net
 * 座標系: 109×109（Y下向き・反転不要）
 * stroke=中心線パスd / median=平坦化サンプル座標
 * 漢字 ${ok}字 / 生成日時 ${new Date().toISOString()}
 */
const GRADE6_STROKES = ${JSON.stringify(data)};
if (typeof module !== 'undefined') module.exports = GRADE6_STROKES;
`;

await writeFile(join(__dirname, 'grade6-strokes.js'), out, 'utf8');
console.log(`\n書き出し完了: grade6-strokes.js (${ok}/${KANJI.length}字)`);
