// 世界地図＋となり国＋国名データの生成: node sekai-o-mawarou/build-data.mjs
// 生成物（map-data.js / country-data.js / flags-data.js）は手編集しない。
// 直すときはこのスクリプトか country-extra.mjs を直して再生成する（CLAUDE.md §4）。
//
// ■ 出典・ライセンス（index.html のクレジット表記を絶対に消さないこと・CLAUDE.md §7）
//   ・地図の形／となり国: Natural Earth（パブリックドメイン）
//       world-atlas countries-50m.json（Natural Earth 50m 由来の TopoJSON）
//   ・国名・大陸・首都（日本語）: Natural Earth ne_50m_admin_0_countries / ne_50m_populated_places
//   ・国旗: flag-icons © lipis ほか / MIT License
//   ※ ダウンロードはビルド時だけ。アプリ本体は完全オフライン。
import fs from 'node:fs';
import path from 'node:path';
import { EXTRA, SEAS, BASIC40, HARD_EXTRA, OCEANS, OCEAN_OF } from './country-extra.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const CACHE = path.join(HERE, '.cache');

const SOURCES = [
  ['world50.json', 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'],
  ['ne50.geojson', 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'],
  ['places.geojson', 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_populated_places.geojson'],
];

async function ensureSources() {
  if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE);
  for (const [name, url] of SOURCES) {
    const p = path.join(CACHE, name);
    if (fs.existsSync(p)) continue;
    process.stdout.write('ダウンロード中: ' + name + ' ... ');
    const res = await fetch(url);
    if (!res.ok) throw new Error(name + ' の取得に失敗: ' + res.status);
    fs.writeFileSync(p, Buffer.from(await res.arrayBuffer()));
    console.log('OK');
  }
}
const readCache = (n) => JSON.parse(fs.readFileSync(path.join(CACHE, n), 'utf8'));

// ───────── TopoJSON をほどく ─────────
function decodeArcs(topo) {
  const { scale, translate } = topo.transform;
  return topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map((d) => {
      x += d[0]; y += d[1];
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });
}
// 図形が使っているアーク番号を平らに集める（となり国の判定に使う）
function collectArcIds(arcs, out) {
  for (const a of arcs) {
    if (Array.isArray(a)) collectArcIds(a, out);
    else out.add(a < 0 ? ~a : a);
  }
  return out;
}
// リング（アーク番号の並び）→ 座標列
function ringCoords(ring, decoded) {
  const pts = [];
  for (const idx of ring) {
    const rev = idx < 0;
    const arc = decoded[rev ? ~idx : idx];
    const seq = rev ? arc.slice().reverse() : arc;
    for (let i = pts.length ? 1 : 0; i < seq.length; i++) pts.push(seq[i]);
  }
  return pts;
}

// ───────── ミラー図法（中心＝東経150度／日本が真ん中の世界地図）─────────
const CENTER_LON = 150;
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const projX = (lon) => {
  let x = lon - CENTER_LON;
  while (x < -180) x += 360;
  while (x > 180) x -= 360;
  return x;
};
const projY = (lat) => {
  const p = Math.max(-84, Math.min(84, lat)) * D2R;
  return -1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * p)) * R2D; // 上が北になるよう符号を反転
};

// つなぎ目（西経30度）をまたぐリングは分割する。またがないものはそのまま。
function splitAtSeam(pts) {
  const out = [];
  let cur = [];
  for (let i = 0; i < pts.length; i++) {
    const [lon, lat] = pts[i];
    const x = projX(lon), y = projY(lat);
    if (cur.length) {
      const prev = cur[cur.length - 1];
      if (Math.abs(x - prev[0]) > 180) { // つなぎ目をまたいだ
        const edge = prev[0] > 0 ? 180 : -180;
        cur.push([edge, prev[1]]);
        out.push(cur);
        cur = [[-edge, y]];
      }
    }
    cur.push([x, y]);
  }
  if (cur.length) out.push(cur);
  return out.filter((r) => r.length >= 3);
}

// 小さすぎる島は捨てて、座標を間引いてパスにする（ファイルを軽くするため）
function ringArea(r) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
  return Math.abs(a / 2);
}
const MIN_AREA = 0.05;   // これより小さい島は地図に描かない（度²）
const PREC = 1;          // 座標の小数点いか（地図はば360に対して0.1＝1画素いか）
const MIN_STEP = 0.12;   // これより近い点は間引く（形はほとんど変わらない）
const TINY_AREA = 0.35;  // これ以下の国は点（●）で描く。でないと画面から見えなくなる
const SMALL_AREA = 4;    // これ以下の国は「タップ用のまるい当たり判定」を足す（指で押せるように）
function toPath(rings) {
  const parts = [];
  for (const r of rings) {
    if (ringArea(r) < MIN_AREA) continue;
    const pts = [];
    for (const p of r) {
      const x = +p[0].toFixed(PREC), y = +p[1].toFixed(PREC);
      const last = pts[pts.length - 1];
      if (last && Math.abs(x - last[0]) < MIN_STEP && Math.abs(y - last[1]) < MIN_STEP) continue;
      pts.push([x, y]);
    }
    if (pts.length < 3) continue;
    parts.push('M' + pts.map((p) => p[0] + ' ' + p[1]).join('L') + 'Z');
  }
  return parts.join('');
}
// 小さい国用の●（半径1.3の八角形。まるより軽い）
function dotPath(cx, cy) {
  const r = 1.1, k = r * 0.4142;
  const pts = [[-k, -r], [k, -r], [r, -k], [r, k], [k, r], [-k, r], [-r, k], [-r, -k]];
  return 'M' + pts.map((p) => +(cx + p[0]).toFixed(1) + ' ' + +(cy + p[1]).toFixed(1)).join('L') + 'Z';
}

// ───────── ここから生成 ─────────
await ensureSources();
const topo = readCache('world50.json');
const ne = readCache('ne50.geojson');
const places = readCache('places.geojson');
const decoded = decodeArcs(topo);
const geoms = topo.objects.countries.geometries;

// ISO数字コード → ISO2 / 日本語名 / 大陸（Natural Earth の属性から）
const byN3 = new Map();
for (const f of ne.features) {
  const p = f.properties;
  const n3 = String(p.ISO_N3_EH && p.ISO_N3_EH !== '-99' ? p.ISO_N3_EH : p.ISO_N3);
  const a2 = p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : p.ISO_A2;
  if (!n3 || n3 === '-99') continue;
  if (!byN3.has(n3)) byN3.set(n3, { a2, ja: p.NAME_JA, en: p.NAME, cont: p.CONTINENT, type: p.TYPE });
}

// ISO2 → 日本語名・大陸（ISO数字コードを持たない国＝コソボ などのため、ISO2でも引けるようにする）
const byA2 = new Map();
const a3ByA2 = new Map();
for (const f of ne.features) {
  const p = f.properties;
  const a2 = p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : p.ISO_A2;
  if (!a2 || a2 === '-99') continue;
  if (!byA2.has(a2)) byA2.set(a2, { ja: p.NAME_JA, en: p.NAME, cont: p.CONTINENT });
  if (!a3ByA2.has(a2)) a3ByA2.set(a2, p.ADM0_A3);
}

// 首都（日本語）。ADM0_A3 で国とつなぐ
const capByA3 = new Map();
for (const f of places.features) {
  const p = f.properties;
  if (p.FEATURECLA !== 'Admin-0 capital') continue;
  if (!capByA3.has(p.ADM0_A3)) capByA3.set(p.ADM0_A3, p.NAME_JA || p.NAME);
}
const capByA2 = new Map();
for (const [a2, a3] of a3ByA2) if (capByA3.has(a3)) capByA2.set(a2, capByA3.get(a3));

// 1a) となり国のために「どのアークをどの国が使っているか」を集める（TopoJSON の共有アーク）
const MERGE = EXTRA.__mergeLand || {};   // ★べつの土地 → くっつける国（2026-08-23）
const arcOwners = new Map(); // アーク番号 → 国コードの集合
for (const g of geoms) {
  const nm = (g.properties && g.properties.name) || '';
  const info = MERGE[nm] ? { a2: MERGE[nm] } : byN3.get(String(g.id));
  if (!info || !info.a2 || info.a2 === '-99' || !EXTRA[info.a2]) continue;
  for (const arcId of collectArcIds(g.arcs, new Set())) {
    if (!arcOwners.has(arcId)) arcOwners.set(arcId, new Set());
    arcOwners.get(arcId).add(info.a2);
  }
}

// 1b) 形は GeoJSON（ne_50m_admin_0_countries）から作る。小さい国もすべて入っているため
const shapes = new Map(); // 国コード → リング配列
for (const f of ne.features) {
  const p = f.properties;
  const raw = p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : p.ISO_A2;
  const code = MERGE[p.NAME] || raw;    // ★くっつける土地は その国の 形の一部にする
  if (!code || code === '-99' || !EXTRA[code]) continue;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const rings = shapes.get(code) || [];
  for (const poly of polys) for (const ring of poly) {
    for (const seg of splitAtSeam(ring)) rings.push(seg);
  }
  shapes.set(code, rings);
}

// 1c) 「国ではない土地」（グリーンランド・各国の海外りょうど など）は、うすい灰色の背景にする。
//     入れないと地図に穴があいて、子どもが「ここは海？」とまよう。南極は画面に入らないので外す。
const otherRings = [];
for (const f of ne.features) {
  const p = f.properties;
  const code = p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : p.ISO_A2;
  if (code && EXTRA[code]) continue;
  if (MERGE[p.NAME]) continue;          // ★くっつけた土地は もう 国の一部なので 灰色にしない
  if (p.NAME === 'Antarctica') continue;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) for (const ring of poly) {
    for (const seg of splitAtSeam(ring)) otherRings.push(seg);
  }
}

// 2) となり国＝同じ線（アーク）を共有している国どうし
const nb = new Map();
for (const code of shapes.keys()) nb.set(code, new Set());
for (const owners of arcOwners.values()) {
  if (owners.size < 2) continue;
  const list = [...owners];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    nb.get(list[i]).add(list[j]);
    nb.get(list[j]).add(list[i]);
  }
}
// 海外の飛び地どうしの国境は、子どもが混乱するので消す（例: フランス⇔ブラジル＝仏領ギアナ）
for (const [a, b] of EXTRA.__cutBorders || []) {
  if (nb.has(a)) nb.get(a).delete(b);
  if (nb.has(b)) nb.get(b).delete(a);
}
// 元データに国境が入っていない国は手で足す
for (const [a, b] of EXTRA.__addBorders || []) {
  if (nb.has(a) && nb.has(b)) { nb.get(a).add(b); nb.get(b).add(a); }
  else console.log('⚠ 手で足すとなり国が見つからない: ' + a + '-' + b);
}

// 3) 出力
const isCode = (c) => c.slice(0, 2) !== '__';
const missing = Object.keys(EXTRA).filter((c) => isCode(c) && !shapes.has(c));
if (missing.length) console.log('⚠ 地図の形が見つからない国: ' + missing.join(','));

const paths = {}, centers = {};
const tinyOnes = [], smallOnes = [];
for (const [code, rings] of shapes) {
  // ラベル位置＝いちばん大きい島の重心
  let best = null, bestA = -1;
  for (const r of rings) { const a = ringArea(r); if (a > bestA) { bestA = a; best = r; } }
  if (!best) { console.log('⚠ 形がまったくない: ' + code); continue; }
  let cx = 0, cy = 0;
  for (const p of best) { cx += p[0]; cy += p[1]; }
  cx = +(cx / best.length).toFixed(1); cy = +(cy / best.length).toFixed(1);
  centers[code] = [cx, cy];

  const d = toPath(rings);
  if (!d || bestA < TINY_AREA) { // 小さすぎる国は●にする（そのままだと画面から消えるため）
    paths[code] = dotPath(cx, cy);
    tinyOnes.push(code);
  } else {
    paths[code] = d;
  }
  if (bestA < SMALL_AREA) smallOnes.push(code);
}
console.log('●で描く小さい国: ' + tinyOnes.length + 'ヶ国 ' + tinyOnes.join(','));
console.log('タップ用の当たり判定を足す国: ' + smallOnes.length + 'ヶ国');

// viewBox は描いた形の実際の範囲から決める
let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
for (const rings of shapes.values()) for (const r of rings) {
  if (ringArea(r) < MIN_AREA) continue;
  for (const p of r) {
    if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
  }
}
const pad = 2;
const viewBox = [minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2]
  .map((v) => +v.toFixed(1)).join(' ');

const CONT_JA = {
  Asia: 'asia', Europe: 'europe', Africa: 'africa',
  'North America': 'namerica', 'South America': 'samerica', Oceania: 'oceania',
};
const countries = {};
for (const code of Object.keys(EXTRA)) {
  if (!isCode(code) || !paths[code]) continue;
  const info = byA2.get(code) || {};
  const ex = EXTRA[code];
  const cap = ex.cap || capByA2.get(code) || '';
  countries[code] = {
    ja: ex.ja || info.ja || code,
    cont: ex.cont || CONT_JA[info.cont] || 'asia',
    cap,
    seas: [],                                   // 下で SEAS から入れる
    nb: [...nb.get(code)].filter((c) => paths[c]).sort(),
    tier: BASIC40.includes(code) ? 1 : HARD_EXTRA.includes(code) ? 2 : 3,
  };
}
// 面している海（SEAS から国ごとに配る）
for (const [seaId, sea] of Object.entries(SEAS)) {
  for (const code of sea.members) {
    if (countries[code]) countries[code].seas.push(seaId);
    else console.log('⚠ 海データに知らない国: ' + code + '（' + sea.ja + '）');
  }
}

// 大洋を足す（その海が つながっている大洋にも 面していることにする）
Object.keys(countries).forEach(function (code) {
  var add = {};
  countries[code].seas.forEach(function (s) { if (OCEAN_OF[s]) add[OCEAN_OF[s]] = 1; });
  Object.keys(add).forEach(function (o) { countries[code].seas.push(o); });
});
const ALL_SEAS = Object.assign({}, SEAS, OCEANS);
Object.keys(OCEANS).forEach((o) => { ALL_SEAS[o] = { ja: OCEANS[o].ja, members: [] }; });
Object.keys(countries).forEach((c) => {
  countries[c].seas.forEach((s) => { if (ALL_SEAS[s] && ALL_SEAS[s].members.indexOf(c) < 0 && OCEANS[s]) ALL_SEAS[s].members.push(c); });
});

// ───────── 検算（CLAUDE.md §4: 件数・重複チェック必須）─────────
const codes = Object.keys(countries);
console.log('国の数: ' + codes.length);
const tierCount = { 1: 0, 2: 0, 3: 0 };
codes.forEach((c) => tierCount[countries[c].tier]++);
console.log('ベーシック' + tierCount[1] + ' / ハードで追加' + tierCount[2] + ' / スーパーハードで追加' + tierCount[3]);
if (tierCount[1] !== BASIC40.length) console.log('⚠ ベーシックの数が合わない（想定' + BASIC40.length + '）');
// となり国は必ず両方向そろっているか
for (const c of codes) for (const n of countries[c].nb) {
  if (!countries[n] || countries[n].nb.indexOf(c) < 0) console.log('⚠ となり国が片道: ' + c + '→' + n);
}
const noCap = codes.filter((c) => !countries[c].cap);
if (noCap.length) console.log('⚠ 首都が空: ' + noCap.join(','));
const noSea = codes.filter((c) => !countries[c].seas.length);
console.log('海に面していない（内陸）国: ' + noSea.length + 'ヶ国 ' + noSea.join(','));
const island = codes.filter((c) => !countries[c].nb.length);
console.log('となり国ゼロ（島国）: ' + island.length + 'ヶ国');
const lonely = codes.filter((c) => !countries[c].nb.length && !countries[c].seas.length);
if (lonely.length) console.log('⚠ となり国も海もない＝ジェットでしか行けない国: ' + lonely.join(','));

// ───────── 書き出し ─────────
const head = (what) => '// 自動生成: node sekai-o-mawarou/build-data.mjs（手編集しない）\n' +
  '// ' + what + '\n';
fs.writeFileSync(path.join(HERE, 'map-data.js'),
  head('地図の形: Natural Earth（パブリックドメイン）/ ミラー図法・中心 東経150度') +
  'var MAP_VIEWBOX = ' + JSON.stringify(viewBox) + ';\n' +
  'var MAP_PATHS = ' + JSON.stringify(paths) + ';\n' +
  'var MAP_CENTER = ' + JSON.stringify(centers) + ';\n' +
  'var MAP_SMALL = ' + JSON.stringify(smallOnes) + ';\n' +
  'var MAP_OTHER = ' + JSON.stringify(toPath(otherRings)) + ';\n');

fs.writeFileSync(path.join(HERE, 'country-data.js'),
  head('国名・大陸・首都: Natural Earth（NAME_JA）/ 面している海・名物: 自作の叩き台') +
  'var COUNTRIES = ' + JSON.stringify(countries) + ';\n' +
  'var SEA_INFO = ' + JSON.stringify(ALL_SEAS) + ';\n');

console.log('map-data.js ' + fs.statSync(path.join(HERE, 'map-data.js')).size + ' bytes / ' +
  'country-data.js ' + fs.statSync(path.join(HERE, 'country-data.js')).size + ' bytes');
