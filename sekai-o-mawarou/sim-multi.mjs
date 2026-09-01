// せかいをまわろう！ 3〜4人あそびの 自動対戦（★2026-08-18）
// index.html の **実コードの関数をそのまま抜き出して** 動かす（HANDOFF の流儀）。
// つかい方: node sim-multi.mjs [人数] [試合数] [all|real]
//   例: node sim-multi.mjs 4 16 real   … 4人あそび・16試合・本番の顔ぶれ（つよさ ばらばら）
//   NC=50 を つけると 国の数を 上書きできる（例: NC=50 node sim-multi.mjs 4 16 real）
// ★数字（DECK_BY_PLAYERS・ITERS・NEED など）を いじったら かならず これで 測り直すこと。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// このファイルと 同じフォルダの index.html / country-data.js を読む
const DIR = path.dirname(fileURLToPath(import.meta.url)) + '/';
const html = fs.readFileSync(DIR + 'index.html', 'utf8');
const body = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// --- 実コードから 使う関数だけ 切り出す（DOMに さわらないものだけ）---
const WANT = ['landPath', 'landReach', 'sharedSea', 'isNeighbor', 'checkTransport', 'reachableFrom',
  'analyze', 'scoreTray', 'climbTray', 'bestArrange', 'shuffle', 'pickCountries', 'makeDeck',
  'climbTray2', 'bestArrange2', 'cardUse', 'tryCard2', 'vehValue', 'trayValue',
  'makeSeats', 'tryCard', 'legsOf', 'deckCountries', 'contStats', 'dealBalanced', 'trExtra',
  'stageById', 'starsOf', 'starCount', 'hasStar', 'stageOpen'];
function cut(name) {
  const i = body.indexOf('\nfunction ' + name + '(');
  if (i < 0) throw new Error('関数が見つからない: ' + name);
  // 次の「行あたまの }」までが 関数の本体
  const end = body.indexOf('\n}', i);
  return body.slice(i, end + 2);
}
// 定数（配列・オブジェクト）も 実コードから
function cutVar(re) {
  const m = body.match(re);
  if (!m) throw new Error('定数が見つからない: ' + re);
  return m[0];
}

const consts = [
  cutVar(/var SLOTS = [\s\S]*?;/),
  cutVar(/var RING = [\s\S]*?;/),
  cutVar(/var DECK_COUNTRIES = \d+;/),
  cutVar(/var HAND_TR = \d+;/),
  cutVar(/var LINEAR_HOP = \d+;/),
  cutVar(/var VEH_W = \{[\s\S]*?\};/),
  cutVar(/var STAGES = \[[\s\S]*?\n\];/),
  cutVar(/var CONTS = \[[\s\S]*?\];/),
  cutVar(/var CPUS = \[[\s\S]*?\n\];/),
].join('\n');

const src = [
  fs.readFileSync(DIR + 'country-data.js', 'utf8'),
  'var CONT_JA = {}; CONTS.forEach(function (c) { CONT_JA[c.id] = c.ja; });',
  'var ALL_CODES = Object.keys(COUNTRIES).sort(function (a, b) { return COUNTRIES[a].ja.localeCompare(COUNTRIES[b].ja, "ja"); });',
  'var save = { visited: {}, plays: 0, wins: 0, bestTurn: 0, lastNew: [], stars: {} };',
  'var pick = { cpu: 2, players: 2 };',
  'var G = null;',
  WANT.map(cut).join('\n'),
  'globalThis.API = {STAGES,stageById,dealBalanced,analyze,scoreTray,climbTray,bestArrange,shuffle,pickCountries,makeDeck,makeSeats,tryCard,climbTray2,bestArrange2,cardUse,tryCard2,vehValue,trayValue,SLOTS,CPUS,setPick:(p)=>{pick.players=p.players;pick.cpu=p.cpu;},setHT:(v)=>{HAND_TR=v;},getHT:()=>HAND_TR,deckCountries};',
].join('\n');

// SEA_INFO / MAX_HOP など country-data.js に無いものは 先に入れる
const pre = '';
new Function(consts + '\n' + pre + src)();
const A = globalThis.API;

// --- 1試合まわす（実コードの newGame / cpuTurn の「考える部分」を そのまま写した）---
function drawFromDeck(G) {
  if (!G.deck.length) {
    if (G.discard.length <= 1) return null;
    const keep = G.discard.pop();
    G.deck = A.shuffle(G.discard);
    G.discard = [keep];
  }
  return G.deck.pop();
}
function playGame(nPlayers, levels) {
  const made = A.makeDeck(process.env.NC ? A.pickCountries(+process.env.NC) : null);
  const G = { deck: made.deck, pool: made.pool, discard: [], players: [], turn: 0, turns: 0, winner: -1 };
  for (let i = 0; i < nPlayers; i++) G.players.push({ cpu: levels[i], tray: [] });
  const NEED = +(process.env.NEED || -9);
  for (let attempt = 0; attempt < 10; attempt++) {
    G.players.forEach(p => { while (p.tray.length) G.deck.push(p.tray.pop()); });
    A.shuffle(G.deck);
    A.dealBalanced(G);
    let ok = true;
    G.players.forEach(p => { if (A.bestArrange(p.tray, 3, 2000).score > NEED) ok = false; });
    if (ok) break;
  }
  G.discard.push(G.deck.pop());
  // ★配られた ときの のりもののかたより を 記録
  const tstat = G.players.map(p => {
    const t = p.tray.filter(c => c.t !== 'c');
    return { all: t.length, f: t.filter(c => c.t === 'f').length, j: t.filter(c => c.t === 'j').length,
             r: t.filter(c => c.t === 'r').length, p: t.filter(c => c.t === 'p').length };
  });

  // ★index.html の cpuTurn と 同じ数字に そろえること（4=さいきょう は 2026-08-18 追加）
  const ITERS = { 1: 60, 2: 250, 3: 2500, 4: 3500 }, SCAN = { 1: 0, 2: 1, 3: 10, 4: 99 };
  for (let guard = 0; guard < 4000; guard++) {
    const si = G.turn, p = G.players[si], lv = p.cpu, iters = ITERS[lv];
    let cur;
    if (lv >= 4) {
      // ★2026-08-23 さいきょうだけ 手の しゅるいが 多い ならべかえ（index.html と そろえること）
      const c0 = A.climbTray2(p.tray, 3000), alt = A.bestArrange2(p.tray, 2, 1500);
      cur = (alt.score > c0.score) ? alt : c0;
    } else cur = A.climbTray(p.tray, iters);
    p.tray = cur.tray;
    let card = null, fromIdx = -1;
    if (SCAN[lv] >= 99) {          // さいきょう: すて札ぜんぶを ざっと→よさそうな3つを じっくり
      const rough = [];
      for (let i = 0; i < G.discard.length; i++) {
        const rv = A.tryCard(p.tray, G.discard[i], 300);
        rough.push({ i, s: A.trayValue(rv.score, rv.tray || p.tray) });
      }
      rough.sort((x, y) => y.s - x.s);
      let best = A.trayValue(cur.score, p.tray), bi = -1;
      for (let i = 0; i < rough.length && i < 4; i++) {
        const v = A.tryCard2(p.tray, G.discard[rough[i].i], 1800);
        const vv = A.trayValue(v.score, v.tray);
        if (vv > best) { best = vv; bi = rough[i].i; }
      }
      if (G.deck.length) {                       // ★さいきょうの とくぎ: 山札の 上が 見える
        const vt = A.tryCard2(p.tray, G.deck[G.deck.length - 1], 1800);
        if (A.trayValue(vt.score, vt.tray) > best) { bi = -1; best = A.trayValue(vt.score, vt.tray); }
      }
      if (bi >= 0) { fromIdx = bi; card = G.discard[bi]; }
    } else if (SCAN[lv]) {
      let best = cur.score, bi = -1;
      const start = Math.max(0, G.discard.length - SCAN[lv]);
      for (let i = start; i < G.discard.length; i++) {
        const v = A.tryCard(p.tray, G.discard[i], Math.floor(iters / 3) + 40);
        if (v.score > best) { best = v.score; bi = i; }
      }
      if (bi >= 0) { fromIdx = bi; card = G.discard[bi]; }
    }
    if (fromIdx < 0) {
      card = drawFromDeck(G);
      if (!card) return { winner: -1, turns: G.turns, deckOut: true };
    } else G.discard.splice(fromIdx, 1);
    const place = (lv >= 4) ? A.tryCard2(p.tray, card, 1800)
                            : A.tryCard(p.tray, card, Math.floor(iters / 2) + 30);
    let takes;
    if (lv >= 4) {
      const vNow = A.trayValue(cur.score, p.tray), vNew = A.trayValue(place.score, place.tray);
      takes = place.slot >= 0 && (vNew > vNow ||
        (vNew === vNow && A.cardUse(card, p.tray) > A.cardUse(p.tray[place.slot], p.tray)));
    } else {
      takes = (place.slot >= 0 && place.score > cur.score && (lv > 1 || Math.random() < 0.7));
    }
    const out = takes ? p.tray[place.slot] : card;
    if (takes) p.tray = place.tray;
    G.discard.push(out);
    G.turns++;
    if (A.analyze(p.tray).ok) {
      const losers = G.players.map((q, i) => i === si ? -1 : A.analyze(q.tray).broken).filter(v => v >= 0);
      const endTr = G.players.map(q => q.tray.filter(c => c.t !== 'c').length);
      return { winner: si, turns: G.turns, deck: G.deck.length, tstat, losers, endTr };
    }
    G.turn = (G.turn + 1) % G.players.length;
  }
  return { winner: -2, turns: G.turns };   // 決着しなかった
}

// ★2026-08-18: **先手が つよい**（同じレベル同士でも 先手が 7割 勝つ）。
//   レベルの差を 見るときは かならず **席を 入れかえて 半分ずつ** やること。
//   これを しないと「さいきょうが つよいに 負ける」ような まちがった 読みに なる（実際に なった）。
if (process.argv[4] === 'mirror') {
  const games2 = +(process.argv[3] || 20);
  const LVN = { 1: 'よわい', 2: 'ふつう', 3: 'つよい', 4: 'さいきょう' };
  const cards = (process.env.CARDS === 'quick') ? [[3, 4]] : [[1, 2], [2, 3], [3, 4], [2, 4]];
  for (const [a, b] of cards) {
    let winA = 0, winB = 0, turns = [];
    for (let g = 0; g < games2; g++) {
      const flip = g % 2 === 1;                       // 半分は 席を 入れかえる
      const levels = flip ? [b, a] : [a, b];
      const r = playGame(2, levels);
      if (r.winner < 0) continue;
      turns.push(r.turns);
      const winnerLv = levels[r.winner];
      if (winnerLv === a && !(a === b)) winA++; else winB++;
    }
    turns.sort((x, y) => x - y);
    const med = turns.length ? turns[Math.floor(turns.length / 2)] : -1;
    console.log(`${LVN[a]} vs ${LVN[b]}　→ ${LVN[b]}の 勝率 ${Math.round(winB / (winA + winB) * 100)}%` +
      `（${winB}勝${winA}敗）　手数 中央値 ${med}`);
  }
  process.exit(0);
}

const n = +(process.argv[2] || 4), games = +(process.argv[3] || 30);
if (process.env.HT) A.setHT(+process.env.HT);
const LV = { 1: 'よわい', 2: 'ふつう', 3: 'つよい', 4: 'さいきょう' };
const MIXES = {
  all: [[2,2,2,2],[1,1,1,1],[3,3,3,3],[3,2,1,2]], real: [[2,2,1,3],[2,1,3,2]],
  // ★ステージの 難易度くらべ（2人あそび用。左=プレイヤー役, 右=あいて）
  lv: [[2,3],[2,4],[3,4]]
};
for (const mix of MIXES[process.argv[4] || 'all']) {
  const levels = mix.slice(0, n);
  A.setPick({ players: n, cpu: 2 });
  const turns = [], wins = {}, tAll = [], tFerry = [], losers = [], endTr = [];
  let stuck = 0, drawOut = 0;
  for (let g = 0; g < games; g++) {
    const r = playGame(n, levels);
    if (r.winner === -2) { stuck++; continue; }
    if (r.winner === -1) { drawOut++; continue; }
    turns.push(r.turns);
    wins[r.winner] = (wins[r.winner] || 0) + 1;
    r.tstat.forEach(t => { tAll.push(t.all); tFerry.push(t.f); });
    r.losers.forEach(v => losers.push(v));
    r.endTr.forEach(v => endTr.push(v));
  }
  turns.sort((a, b) => a - b);
  const med = turns.length ? turns[Math.floor(turns.length / 2)] : -1;
  console.log(
    `${n}人 [${levels.map(l => LV[l]).join('/')}] 国${process.env.NC || A.deckCountries()} のりもの${A.getHT()}まい NEED${process.env.NEED || -9} ` +
    `決着 ${turns.length}/${games}　手数 中央値 ${med}（最短${turns[0]}・最長${turns[turns.length - 1]}）` +
    `　1人あたり ${(med / n).toFixed(1)}まわり　勝ち: ${levels.map((l, i) => (wins[i] || 0)).join('-')}` +
    (stuck ? `　★決着せず ${stuck}` : '') + (drawOut ? `　カード切れ ${drawOut}` : '')
  );
  const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-';
  const max = a => a.length ? Math.max(...a) : '-';
  const cnt = (a, v) => a.filter(x => x >= v).length;
  console.log(
    `   配られたのりもの 平均${avg(tAll)}まい（最多${max(tAll)}）` +
    `　⛴フェリー 平均${avg(tFerry)}（最多${max(tFerry)}・2まい以上を持った人 ${cnt(tFerry, 2)}／${tFerry.length}人）` +
    `　まけた人の のこり 平均${avg(losers)}つ（0〜1つ＝おしい人 ${losers.filter(v => v <= 1).length}／${losers.length}人）` +
    `\n   おわったときの のりもの 平均${avg(endTr)}まい（最多${max(endTr)}）＝国は 平均${(12 - avg(endTr)).toFixed(1)}ヶ国`
  );
}
