// build-goi.mjs — ゴイセン（語彙線）の じしょ（goi-data.js）を つくる
//
//   node goisen/build-goi.mjs
//
// ★goi-data.js は 生成物。手で直さず、ここか 材料を 直して つくりなおす（CLAUDE.md §4）。
//   つくりなおしたら index.html の goi-data.js?v=N と sw.js の CACHE を 繰り上げる。
//
// 材料（上ほど 優先。同じ よみ・同じ書きかたなら 上の いみを つかう）:
//   A1. goisen/words-extra.txt               … 手書きの みぢかな ことば
//   A2. kanji-bouken/gradeN-data.js の quiz  … 1026語（子どもむけの いみ）
//   A3. shiritori/dictionary_output.js       … 約5600語（子どもむけの いみ）
//   B.  kotobasagashi/kotoba-dict.js          … 約4.3万語（SudachiDict＋ウィクショナリーの いみ・不適切語は除外ずみ）
//   （kanji-bouken の words「木（き）・大木（たいぼく）」は いみが ないので、B に 同じ書きかたが あるときだけ つかう）
//
// ★方針（言葉さがしと 同じ）: いみを 出せない ことばは 入れない。
// ★2もじの ことばは A（子どもむけ辞書）に ある ものだけ。B の 2もじまで 入れると
//   となりの 2マスの 65%が ことばに なり、なぞれば かならず「2つ いじょう」＝れんけつ必殺技 に なって しまうため。
// 学年 g = 書きかたの 漢字の いちばん高い 配当学年（かなだけ=1／配当外の漢字=7）
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.join(HERE, '..');
const MIN = 2, MAX = 8;
const OK = new RegExp('^[ぁ-ゖ]{' + MIN + ',' + MAX + '}$');

/* ---- 1026字の 配当学年 ---- */
const KANJI_G = {};
const KB = [];
for (let g = 1; g <= 6; g++) {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'kanji-bouken', `grade${g}-data.js`), 'utf8').replace(/\bconst (\w+)\s*=/g, 'globalThis.$1 ='), ctx);
  for (const [ch, v] of Object.entries(ctx[`GRADE${g}_INFO`])) { if (v.kana) continue; KANJI_G[ch] = g; KB.push(v); }
}
function gradeOf(w) {
  let g = 1;
  for (const ch of w) if (/[\u3400-\u9fff々]/.test(ch)) g = Math.max(g, KANJI_G[ch] || 7);
  return g;
}

/* ---- 子どもむけに 出さない ことば（大辞書の 不適切語 403語は 言葉さがし側で 除外ずみ。それでも のこった 俗語などを ここに 足す）
   書きかたで はじく。足しても 減らさないこと ---- */
const NG_SURFACE = new Set(['タイマン']);

/* ---- よみ → [{w, m, tier}] ---- */
const DICT = new Map();
const cnt = { A1: 0, A2: 0, A3: 0, B: 0, KBw: 0 };
function add(r, w, m, tier, src) {
  r = (r || '').trim(); w = (w || '').trim() || r; m = (m || '').trim();
  if (!OK.test(r) || !m || NG_SURFACE.has(w)) return false;
  const list = DICT.get(r) || [];
  if (list.some((x) => x.w === w)) return false;   // 上の 材料が 先に いれている
  list.push({ w, m, tier });
  DICT.set(r, list);
  cnt[src]++;
  return true;
}
/* A1 */
for (const line of fs.readFileSync(path.join(HERE, 'words-extra.txt'), 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const [r, w, m] = line.split('\t');
  add(r, w, m, 'A', 'A1');
}
/* A2 */
for (const v of KB) if (v.quiz) add(v.quiz.r, v.quiz.w, v.quiz.m, 'A', 'A2');
/* A3 */
const shiri = fs.readFileSync(path.join(ROOT, 'shiritori', 'dictionary_output.js'), 'utf8');
for (const mt of shiri.matchAll(/\{\s*r:\s*'([^']*)',\s*w:\s*'([^']*)',\s*m:\s*'([^']*)'\s*\}/g)) add(mt[1], mt[2], mt[3], 'A', 'A3');
/* B */
const big = fs.readFileSync(path.join(ROOT, 'kotobasagashi', 'kotoba-dict.js'), 'utf8');
const packed = big.slice(big.indexOf('`') + 1, big.lastIndexOf('`'));
const BIG = new Map();
let prev = '';
for (const line of packed.split('\n')) {
  if (!line) continue;
  const [head, surface, imi] = line.split('\t');
  const r = prev.slice(0, +head[0]) + head.slice(1);
  prev = r;
  BIG.set(r, { w: surface || r, m: imi || '' });
}
for (const [r, x] of BIG) {
  if (r.length < 3 && !DICT.has(r)) continue;    // 2もじは 子どもむけ辞書に ある ものだけ
  add(r, x.w, x.m, 'B', 'B');
}
/* 漢字の冒険の ことば例（いみ なし）は B に 同じ書きかたが あれば いみを かりる */
for (const v of KB) {
  for (const part of String(v.words || '').split('・')) {
    const mt = part.match(/^(.+?)（(.+?)）$/);
    if (!mt) continue;
    const b = BIG.get(mt[2]);
    if (b && b.w === mt[1] && b.m) add(mt[2], mt[1], b.m, 'A', 'KBw');
  }
}

/* ---- 書きだし（前方一致で ちぢめる） ---- */
const rows = [...DICT.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
const byG = {}, lens = {}, tiers = { A: 0, B: 0 };
let body = '', p = '';
for (const [r, list] of rows) {
  let k = 0; while (k < 9 && k < p.length && k < r.length && p[k] === r[k]) k++;
  body += k + r.slice(k);
  for (const x of list) {
    const g = gradeOf(x.w);
    byG[g] = (byG[g] || 0) + 1;
    body += '\t' + (x.w === r ? '' : x.w) + '\t' + x.m.replace(/[\t\n]/g, ' ') + '\t' + g + x.tier;
  }
  body += '\n';
  lens[r.length] = (lens[r.length] || 0) + 1;
  tiers[list.some((x) => x.tier === 'A') ? 'A' : 'B']++;
  p = r;
}
/* うめもじの でやすさ = 子どもむけ辞書（A）の もじの でかた */
const FREQ = {};
for (const [r, list] of rows) if (list.some((x) => x.tier === 'A')) for (const ch of r) FREQ[ch] = (FREQ[ch] || 0) + 1;

const head =
`/* ==========================================================================
 * ゴイセン（語彙線）の じしょ — build-goi.mjs が つくる。手で 直さない。
 * よみ ${rows.length}こ（子どもむけの いみ A ${tiers.A}こ／大辞書だけ B ${tiers.B}こ）
 * 学年べつ（書きかた）${JSON.stringify(byG)}（7=小学校で ならわない漢字）
 *
 * 出典・ライセンス（絶対に消さないこと）
 *   子どもむけの いみ: 漢字の冒険・しりとり（かがせんのHAPPYアプリ集）
 *   語彙：SudachiDict (https://github.com/WorksApplications/SudachiDict)
 *         Copyright (c) 2017-2026 Works Applications Co., Ltd. / Apache License 2.0
 *         一部に UniDic (https://unidic.ninjal.ac.jp/) を含む
 *         Copyright (c) 2011-2013, The UniDic Consortium / BSD 3-Clause
 *   意味：日本語版ウィクショナリー (https://ja.wiktionary.org/) / CC BY-SA 3.0
 *         （大辞書の いみは 言葉さがし kotobasagashi/kotoba-dict.js 経由）
 *
 * 形式: 1行 = 前の よみと 同じ 先頭もじ数(1桁)＋のこりの よみ ＋（TAB 書きかた(よみと同じなら空) TAB いみ TAB 学年+A/B）× 書きかたの数
 * ========================================================================== */
`;
const out = head + 'var GOI_PACKED = ' + JSON.stringify(body) + ';\n' +
  'var KANA_FREQ = ' + JSON.stringify(Object.entries(FREQ).sort((a, b) => b[1] - a[1])) + ';\n';
fs.writeFileSync(path.join(HERE, 'goi-data.js'), out);
console.log('よみ', rows.length, tiers, '材料べつ', cnt);
console.log('学年べつ', byG, 'もじ数べつ', lens);
console.log('サイズ', (Buffer.byteLength(out) / 1024 / 1024).toFixed(2), 'MB');
