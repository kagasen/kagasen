#!/usr/bin/env node
/* =====================================================================
   verify.mjs — サイエンスアイランドの「型（エンジン）」の判定ロジックを検査する

   使い方:  node science-island/verify.mjs
   終了コード: 失敗あり=1 / ぜんぶOK=0

   なぜ要るか:
     このアプリは正解データを人が用意していない（回路は電流を解き、てこは
     おもさ×きょりを計算し、月はいちから形を出す）。だから「解ける／まちがいは
     通らない」を機械で確かめられる。見た目はブラウザで、ロジックはここで。

   やり方: index.html のインラインJSを取り出し、ブラウザの最小スタブの上で
     読みこんで、判定関数だけを直接たたく。Node標準機能のみ・外部パッケージなし。
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let ng = 0, ok = 0;
const t = (cond, label) => { if (cond) { ok++; } else { ng++; console.log('  ❌ ' + label); } };
const head = (s) => console.log('\n■ ' + s);

/* ---- 乱数を「たね」から 作る（毎回 ぴったり 同じ けっかに する） ----
   でんじしゃくバトルの きつさは シミュレーションで はかって いる。ここが Math.random だと
   走らせる たびに 数が かわり、5回に1回くらい しきい値を またいで「まぐれの ❌」が 出て
   いた（2026-08-27）。それだと ❌ が 本ものか まぐれか 見分けられず、検査の いみが ない。

   そこで xorshift32（Node標準だけ・外部パッケージなし）を 用意して Math.random を
   まるごと 差しかえる。たねを 固定するので **何度 走らせても 同じ けっか**になり、
   ❌ が 出たら それは かならず 本ものの 不具合。index.html から とり出した コードも
   この Math.random を つかう（グローバルを 差しかえて いる ため）。

   たねを かえて ためしたい ときは:  node science-island/verify.mjs --seed 12345      */
const SEED_ARG = process.argv.indexOf('--seed');
const SEED = SEED_ARG >= 0 ? (Number(process.argv[SEED_ARG + 1]) >>> 0) : 20260827;
let rndState = SEED || 1;
const reseed = (s) => { rndState = (s >>> 0) || 1; };   /* 章ごとに たねを もどす */
Math.random = () => {
  let x = rndState;
  x ^= x << 13; x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;  x >>>= 0;
  rndState = x;
  return x / 4294967296;
};

/* ---- ブラウザの最小スタブ（描画はしない。判定ロジックだけ動けばよい） ---- */
const stubEl = new Proxy({}, {
  get: (_, k) => {
    if (k === 'addEventListener' || k === 'appendChild' || k === 'setAttribute') return () => {};
    if (k === 'getContext') return () => new Proxy({}, { get: () => () => {} });
    if (k === 'querySelector') return () => null;
    if (k === 'style' || k === 'classList') return new Proxy({}, { get: () => () => {}, set: () => true });
    return '';
  },
  set: () => true,
});
globalThis.document = { getElementById: () => stubEl, addEventListener: () => {} };
globalThis.window = { addEventListener: () => {}, scrollTo: () => {}, innerWidth: 800, innerHeight: 600 };
/* navigator は Node に もとから ある（上書きできない）。'serviceWorker' in navigator は false に なるので そのままでよい */
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.alert = () => {};
globalThis.requestAnimationFrame = () => {};

const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const A = new Function(src + `; return { cur, GAMES, ENGINES, gameById,
  evalCircuit, checkGoal, partLabel, termLabel, hintAnswer, hintSteps, naraberuOK, loadNaraberu, musubuOK, loadMusubu, hasWire,
  loadTsuriai, tsuriaiOK, trMoment, trCount, trTray, moonPath, mbPos, MB_SCENES,
  loadTenbin, tenbinOK, tbMass, tbSum, TB, itemArt,
  craneArt, loadFactory, factoryOK, fcStep, fcType, fcAdjacent, fcHasMove, fcRecycle, fcTransform, fcRescueItem, fcAnswerQuiz, fcEcoRank, FC, FC_TYPES, FC_TRANSFORMS, FC_SPECIALS, FC_SAVES, FC_TRIVIA,
  loadHatsuden, hatsudenOK, HD, CD_LOADS, loadSodate, sodateOK, sodateStage,
  loadJishaku, jishakuOK, mgSim, mgClusters, mgCanPut, mgClear, mgStickD, mgR, mgSize, mgForce, MG,
  mgFellIdx, mgEdge, mgStage, mgStageEdge, mgRandomSpot, mgStock, mgSlot, mgTrayCx, mgLeftAt, mgReach, mgActive,
  MGOPT, mgSet, mgR, mgNum, mgCpuLv, mgSafeD, mgMakeField, mgFieldR, save,
  loadJikken, jikkenOK, swingRun, swingInit, swingStep, swingSetW, swingSetR, SWW, swW, swR, SW_HOOK, jikkenFair, jkInfo, jkVerdict, SIMS, loadMitsukeru, mkTarget, ARTS,
  SUI_EKI, SUI_TOOLS, loadSuiri, suiriOK, plantArt, jarArt, skyArt, OBJ_ART };`)();

/* ================================================================== *
 * 1. つなぐ型（でんき回路）
 * ================================================================== */
head('でんき回路（つなぐ型）— 回路を 解いて 判定して いるか');
{
  const g = A.gameById('energy-denki');
  const parts = (i) => g.stages[i].parts.map((p) => ({ ...p, on: p.type === 'switch' }));
  /* **せいかいの 配線は データの `ex` を そのまま つかう。**
     `ex` は ヒントの「こたえの れい」として **子どもの 画面に 出る** 配線なので、
     ここで たしかめれば「ヒントの とおりに やったのに クリアできない」が ぜったいに 起きない。
     （もんだいの 判定は 今までどおり 電流を 解いて いる。ex は 判定には つかわれない） */
  const SOL = g.stages.map((st) => st.ex);
  g.stages.forEach((st, i) => t(Array.isArray(st.ex) && st.ex.length > 0, `だい${i + 1}もん に ex（こたえの れい）が ない`));
  g.stages.forEach((st, i) => {
    t(A.checkGoal(st, parts(i), SOL[i]), `だい${i + 1}もん が クリアできない`);
    t(SOL[i].length <= st.goal.maxWires, `だい${i + 1}もん は maxWires（${st.goal.maxWires}）では 足りない（${SOL[i].length}本 いる）`);
    /* さいしょから 引いて ある せん（st.wires）が のこったままでは クリアに ならない もんだいが ある。
       「さいしょの すがたのまま」で うっかり クリアに なって いない ことも たしかめる。 */
    if (st.wires && st.wires.length)
      t(!A.checkGoal(st, parts(i), st.wires.map((x) => x.slice())),
        `だい${i + 1}もん は 何も せずに（さいしょの せんのまま）クリアに なって しまう`);
  });
  /* まちがいは 通らない。「その もんだいで いちばん やりがちな とりちがえ」を 1もんに 1つずつ。 */
  const NG = [
    [2,  [['b1:m','l1:a'],['b1:p','l1:b'],['b1:m','l2:a'],['b1:p','l2:b']], '3もん目に 並列'],
    [3,  [['b1:m','l1:a'],['l1:b','l2:a'],['l2:b','b1:p']], '4もん目に 直列'],
    [0,  [['b1:m','b1:p']], '1もん目 ショートだけ'],
    [0,  [['b1:m','l1:a']], '1もん目 かた方だけ'],
    [1,  [['b1:m','l1:a'],['b1:p','l1:b']], '2もん目 スイッチを 通さない'],
    [4,  [['b1:m','l1:a'],['b1:p','l1:b'],['b1:p','b1:m']], '5もん目 ショートが のこったまま'],
    [5,  [['b1:m','l1:a'],['l1:b','s1:a'],['s1:b','l2:a'],['l2:b','b1:p']], '6もん目 直列'],
    [6,  [['b1:p','l1:b'],['b2:p','l1:b'],['b1:m','l1:a'],['b2:m','l1:a']], '7もん目 でんちが 並列'],
    [7,  [['b1:p','l1:b'],['b1:m','l1:a']], '8もん目 でんち1こしか つかって いない'],
    [7,  [['b1:p','b2:m'],['b2:p','l1:b'],['l1:a','b1:m']], '8もん目 でんちが 直列'],
    [8,  [['b1:p','l1:b'],['b2:p','l1:b'],['b1:m','l1:a'],['b2:m','l1:a'],['l1:a','l2:b']], '9もん目 でんちが 並列'],
    [9,  [['b1:p','b2:m'],['b2:p','l1:b'],['l1:a','l2:b'],['l2:a','b1:m']], '10もん目 でんきゅうが 直列'],
    [10, [['b1:p','m1:b'],['b1:m','m1:a']], '11もん目 モーターの むきが ぎゃく'],
    [11, [['b1:p','m1:b'],['m1:a','b1:m'],['b1:p','s1:a']], '12もん目 スイッチを 通らない'],
    [12, [['b1:p','m1:a'],['m1:b','b1:m'],['b1:p','l1:b'],['l1:a','b1:m']], '13もん目 並列'],
    [13, [['b1:p','m1:a'],['m1:b','l1:a'],['l1:b','b1:m']], '14もん目 直列'],
    [14, [['b1:p','m1:a'],['m1:b','b1:m']], '15もん目 でんち1こだけ'],
    [15, [['b1:p','g1:b'],['g1:a','l1:b'],['l1:a','b1:m']], '16もん目 はりが ぎゃく'],
    [16, [['b1:p','g1:a'],['g1:b','l1:b'],['g1:b','l2:b'],['l1:a','b1:m'],['l2:a','b1:m']], '17もん目 でんきゅうが 並列'],
    [17, [['b1:p','g1:a'],['g1:b','l1:b'],['l1:a','l2:b'],['l2:a','b1:m']], '18もん目 でんきゅうが 直列'],
    [18, [['b1:p','g1:a'],['g1:b','m1:a'],['m1:b','b1:m']], '19もん目 モーターも みぎ回り'],
    [19, [['b1:m','s1:a'],['s1:b','l1:a'],['l1:b','s2:a'],['s2:b','b1:p']], '20もん目 スイッチが 直列'],
    [20, [['b1:m','l1:a'],['l1:b','s1:a'],['l1:b','s2:a'],['s1:b','b1:p'],['s2:b','b1:p']], '21もん目 スイッチが 並列'],
    [21, [['b1:m','l1:a'],['l1:b','l2:a'],['l2:b','b1:p']], '22もん目 ちかみちを 作って いない'],
    [22, [['b1:p','s1:a'],['s1:b','l1:b'],['l1:a','b1:m'],['s1:b','l2:b'],['l2:a','b1:m']], '23もん目 スイッチ1つに 2こ ぶらさげた'],
    [23, [['b1:p','s1:a'],['s1:b','l1:b'],['s1:b','l2:b'],['s1:b','l3:b'],['l1:a','b1:m'],['l2:a','b1:m'],['l3:a','b1:m']], '24もん目 スイッチが みきに ある'],
    [24, [['b1:p','s1:a'],['s1:b','l1:b'],['l1:a','b1:m'],['s1:b','m1:b'],['m1:a','b1:m']], '25もん目 でんきゅうも 消えて しまう'],
    [25, [['b1:p','l1:b'],['l1:a','b1:m'],['b1:p','l2:b'],['l2:a','b1:m'],['b1:p','l3:b'],['l3:a','b1:m']], '26もん目 並列'],
    [26, [['b1:p','l1:b'],['l1:a','l2:b'],['l2:a','l3:b'],['l3:a','b1:m']], '27もん目 直列'],
    [27, [['b1:p','l1:b'],['l1:a','b1:m'],['b1:p','l2:b'],['l2:a','b1:m'],['b1:p','l3:b'],['l3:a','b1:m']], '28もん目 ぜんぶ 並列'],
    [28, [['b1:p','l1:b'],['l1:a','l2:b'],['l2:a','l3:b'],['l3:a','b1:m']], '29もん目 でんち1こだけ'],
    [29, [['b1:p','m1:a'],['m1:b','b1:m'],['b1:p','m2:b'],['m2:a','b1:m']], '30もん目 かた方だけ ぎゃく回り'],
    [29, [['b1:p','m1:a'],['m1:b','m2:a'],['m2:b','b1:m']], '30もん目 直列（むきは そろうが 元気が ない）'],
    [30, [['b1:p','b2:m'],['b2:p','s1:a'],['s1:b','g1:a'],['g1:b','l1:b'],['l1:a','m1:a'],['m1:b','b1:m']], '31もん目 直列に して しまう']
  ];
  NG.forEach(([i, w, label]) => t(!A.checkGoal(g.stages[i], parts(i), w), `${label} が クリアに なって しまう`));
  /* べつの こたえも 通る（正解の 配線を 人が 用意して いない ことの あかし） */
  const ALT = [
    [0,  [['b1:p','l1:a'],['b1:m','l1:b']], '1もん目 ＋−ぎゃく'],
    [1,  [['b1:m','s1:a'],['s1:b','l1:a'],['l1:b','b1:p']], '2もん目 スイッチの いち ちがい'],
    [6,  [['b2:p','b1:m'],['b1:p','l1:b'],['l1:a','b2:m']], '7もん目 でんちの じゅんを 入れかえ'],
    [7,  [['b1:p','b2:p'],['b1:m','b2:m'],['b1:p','l1:b'],['b1:m','l1:a']], '8もん目 でんち どうしを 先に つなぐ'],
    [26, [['b1:p','l1:b'],['l1:b','l2:b'],['l2:b','l3:b'],['b1:m','l1:a'],['l1:a','l2:a'],['l2:a','l3:a']], '27もん目 じゅずつなぎの 並列'],
    [21, [['b1:m','l1:a'],['l1:b','l2:b'],['l2:a','b1:p'],['l2:b','s1:a'],['l2:a','s1:b']], '22もん目 l2の むきを かえて'],
    /* 「はやさ」や「ぜんぶ つかう」が めあての もんだいで、回る むきを 決めうちに しない
       （2026-08-28 ユーザーの 指てきで 直した ところ。ここが 通らなく なったら 元に もどって いる） */
    [14, [['b1:p','b2:m'],['b2:p','m1:b'],['m1:a','b1:m']], '15もん目 ひだり回りでも はやければ せいかい'],
    [29, [['b1:p','m1:b'],['m1:a','b1:m'],['b1:p','m2:b'],['m2:a','b1:m']], '30もん目 2こ とも ひだり回り'],
    [30, [['b1:p','b2:m'],['b2:p','s1:a'],['s1:b','g1:a'],['g1:b','l1:b'],['g1:b','m1:b'],['l1:a','b1:m'],['m1:a','b1:m']], '31もん目 モーターが ひだり回り'],
    /* 「どの でんきゅうを 消しても いい」「どちらの スイッチが どちらでも いい」タイプ。
       ここが 通らなく なったら goal.anyOf が こわれて いる（2026-08-28） */
    [5,  [['b1:m','l2:a'],['b1:p','l2:b'],['b1:p','s1:a'],['s1:b','l1:b'],['l1:a','b1:m']], '6もん目 消える のが l1 の ほう'],
    [22, [['b1:p','s1:a'],['s1:b','l2:b'],['l2:a','b1:m'],['b1:p','s2:a'],['s2:b','l1:b'],['l1:a','b1:m']], '23もん目 スイッチと でんきゅうの くみが ぎゃく'],
    [23, [['b1:p','l3:b'],['l3:a','b1:m'],['b1:p','l2:b'],['l2:a','b1:m'],['b1:p','s1:a'],['s1:b','l1:b'],['l1:a','b1:m']], '24もん目 消す のが l1'],
    [27, [['b1:p','l2:b'],['l2:a','l1:b'],['l2:a','l3:b'],['l1:a','b1:m'],['l3:a','b1:m']], '28もん目 みきが l2']
  ];
  ALT.forEach(([i, w, label]) => t(A.checkGoal(g.stages[i], parts(i), w), `${label} の 別解が 通らない`));
  /* 明るさ・回る むき・はりの ふれが 物理どおりか（ここが ちがうと 子どもが 見る けっかが うそに なる） */
  const ev = (i) => A.evalCircuit(parts(i), SOL[i], null).lamps;
  const ser = ev(2), par = ev(3);
  t(ser.l1.cat === 'dim' && ser.l2.cat === 'dim', '直列2こが くらく ならない');
  t(par.l1.cat === 'full' && par.l2.cat === 'full', '並列2こが 明るく ならない');
  t(Math.abs(ser.l1.i - 0.75) < 1e-9 && Math.abs(par.l1.i - 1.5) < 1e-9, '電流の 値が 合わない（直列0.75A／並列1.5A）');
  t(Math.abs(ev(6).l1.i - 3) < 1e-9 && ev(6).l1.cat === 'bright', 'でんち2こ直列が 3A・とても明るく ならない');
  t(Math.abs(ev(7).l1.i - 1.5) < 1e-9, 'でんち2こ並列が 1こと 同じ 電流に ならない');
  t(Math.abs(ev(25).l1.i - 0.5) < 1e-9 && ev(25).l1.cat === 'faint', 'でんきゅう3こ直列が 0.5A・とても くらく ならない');
  t(ev(27).l1.cat === 'dim' && ev(27).l2.cat === 'faint' && ev(27).l3.cat === 'faint', '直列と並列の まざった 回路の 明るさが おかしい');
  t(ev(10).m1.dir === 'right' && ev(11).m1.dir === 'left', 'モーターの 回る むきが 電流の むきで きまって いない');
  t(ev(18).m1.dir === 'left' && ev(18).g1.dir === 'right', 'モーターと けんりゅうけいの むきを べつべつに えらべない');
  t(ev(16).g1.cat === 'dim' && ev(17).g1.cat === 'bright', 'けんりゅうけいの ふれが 直列／並列で かわらない');
  t(Math.abs(ev(17).g1.i - (ev(17).l1.i + ev(17).l2.i)) < 1e-9, '並列の みきの 電流が えだ道の 合計に なって いない');
  /* あぶない つなぎ方を 見つけられるか */
  const dz = (i, w) => A.evalCircuit(parts(i), w, null);
  t(dz(0, [['b1:m','l1:a'],['b1:p','l1:b'],['b1:p','b1:m']]).short === true, 'ショートを 見つけられない');
  t(dz(15, [['b1:p','g1:a'],['g1:b','b1:m']]).reason === 'over', 'けんりゅうけいを でんちに じかに つないだ ときに とめられない');
  t(dz(15, [['b1:p','l1:b'],['l1:a','b1:m'],['l1:b','g1:a'],['l1:a','g1:b']]).reason === 'over', 'けんりゅうけいで でんきゅうを ちかみち した ときに とめられない');
  t(dz(6, [['b1:p','b2:m'],['b1:m','b2:p']]).short === true, 'でんち2こを ぎゃくむきの わっかに しても とめられない');
  t(dz(7, [['b1:p','b2:p'],['b1:m','b2:m'],['b1:p','l1:b'],['b1:m','l1:a']]).short === false, '正しい 並列でんちが ショートに されて しまう');
  /* used（並列でんちを 2こ とも つかって いるか） */
  t(dz(7, SOL[7]).used.b1 && dz(7, SOL[7]).used.b2, '並列に つないだ でんち2こが つかわれて いない ことに なる');
  t(dz(7, [['b1:p','l1:b'],['b1:m','l1:a']]).used.b2 === false, 'つないで いない でんちが つかわれた ことに なって しまう');
  /* ヒントの「こたえの れい」が ばんめんの 名まえと ずれて いないか。
     おなじ しゅるいの ぶひんが 2こ いじょう ある もんだいで gx が 同じだと、
     「ひだりの／みぎの」が どちらを さすか 分からなく なる（partLabel が こわれる）。 */
  g.stages.forEach((st, i) => {
    const byType = {};
    st.parts.forEach((p) => { (byType[p.type] = byType[p.type] || []).push(p.gx); });
    Object.entries(byType).forEach(([ty, xs]) => {
      t(new Set(xs).size === xs.length, `だい${i + 1}もん の ${ty} が おなじ よこ位置に あって「ひだり／みぎ」で 区べつ できない`);
    });
    const steps = A.hintSteps(st);
    const html = A.hintAnswer(st, 'tsunagu');
    t(html.indexOf('undefined') < 0 && html.indexOf(':a<') < 0 && html.indexOf(':p<') < 0,
      `だい${i + 1}もん の こたえの れいの ことばが こわれて いる`);
    t((html.match(/<li>/g) || []).length === steps.length, `だい${i + 1}もん の こたえの れいの 手じゅん数が 合わない`);
    t(steps.length > 0, `だい${i + 1}もん の こたえの れいに 手じゅんが 1つも ない`);
    /* **ヒントの 手じゅんを さいしょの すがたから じゅんに やって みる。**
       もんだいに よっては さいしょから せんが 引いて ある（だい5もん）ので、
       「ぜんぶ つなごう」と 書くと すでに ある せんを 消して しまう。
       ここを 見て いないと「ヒントの とおりに やったのに クリアできない」が 起きる
       （2026-08-28 の ブラウザ テストプレイで じっさいに 出た）。 */
    let w = (st.wires || []).map((x) => x.slice());
    const same = (q, x, y) => (q[0] === x && q[1] === y) || (q[0] === y && q[1] === x);
    steps.forEach((sp) => {
      const k = w.findIndex((q) => same(q, sp.a, sp.b));
      if (sp.op === 'del') { if (k >= 0) w.splice(k, 1); }
      else if (k < 0) w.push([sp.a, sp.b]);
    });
    t(w.length <= st.goal.maxWires, `だい${i + 1}もん ヒントの とおりに やると せんが おおすぎる（${w.length}/${st.goal.maxWires}）`);
    t(A.checkGoal(st, st.parts.map((p) => ({ ...p, on: p.type === 'switch' })), w),
      `だい${i + 1}もん は ヒントの 手じゅん どおりに やっても クリアできない`);
  });
  /* anyOf（こたえが 何とおりも ある）もんだいの learn で、とくていの ぶひん名（l1 など）を
     さして 説明して いないか。子どもが l2 を みきに して クリアしたのに
     「l1 が 明るい」と 出たら つじつまが 合わない（2026-08-28 に じっさいに あった）。 */
  g.stages.forEach((st, i) => {
    if (!st.goal.anyOf) return;
    t(!/[lmgb][0-9]/.test(st.learn.replace(/<[^>]*>/g, '')),
      `だい${i + 1}もん は こたえが 何とおりも あるのに、learn が とくていの ぶひん名を さして いる`);
  });
  /* 「題（t）を 読むだけで 何を すれば いいか 分かる」を まもる ための 見はり。
     **ヒント（h）は 1もん目 いがい たたんで ある**ので、判定して いる ことが 題に 出て いないと
     子どもは 見えない じょうけんで ×に される（2026-08-28 ユーザーの 指てきで 足した）。 */
  g.stages.forEach((st, i) => {
    const cs = st.goal.anyOf ? st.goal.anyOf[0] : st.goal.checks;
    const has = (f) => cs.some(f);
    if (has((ck) => ck.dir && Object.keys(ck.dir).length))
      t(/みぎ|ひだり/.test(st.t), `だい${i + 1}もん は 回る／ふれる むきを 判定して いるのに、題に むきが 書いて ない`);
    if (has((ck) => ck.sameDir && ck.sameDir.length))
      t(/むき/.test(st.t), `だい${i + 1}もん は むきが そろって いるかを 判定して いるのに、題に むきが 書いて ない`);
    if (has((ck) => ck.sw))
      t(/スイッチ|けせ|消|入れ/.test(st.t), `だい${i + 1}もん は スイッチの 入切を 判定して いるのに、題に スイッチの ことが 書いて ない`);
    /* used …… その ぶひんの 名まえが 題に 出て いること（「けんりゅうけいも 通して」など）*/
    const NAME = { battery:'でんち', lamp:'でんきゅう', motor:'モーター', galv:'けんりゅうけい' };
    cs.forEach((ck) => (ck.used || []).forEach((id) => {
      const w = NAME[(st.parts.find((p) => p.id === id) || {}).type];
      t(!w || st.t.indexOf(w) >= 0, `だい${i + 1}もん は ${id}（${w}）を つかって いるかを 判定して いるのに、題に「${w}」が 出て こない`);
    }));
  });
  /* ばんめんに おさまって いるか（600x380 の viewBox。はしっこの ○は 半径30） */
  g.stages.forEach((st, i) => {
    st.parts.forEach((p) => {
      const x = 80 + p.gx * 115, y = 90 + p.gy * 105;
      t(x - 48 >= 0 && x + 48 <= 600 && y - 80 >= 0 && y + 50 <= 380,
        `だい${i + 1}もん の ${p.id} が ばんめんから はみ出す（x=${x} y=${y}）`);
    });
    /* おなじ ぶひんの はしっこ どうしが かさなって いないか（タップの まちがいの もと） */
    const T = { battery:['p','m'], lamp:['a','b'], motor:['a','b'], galv:['a','b'], 'switch':['a','b'] };
    const D = { battery:{ p:[44,0], m:[-44,0] }, lamp:{ a:[-44,14], b:[44,14] },
                motor:{ a:[-44,0], b:[44,0] }, galv:{ a:[-44,0], b:[44,0] }, 'switch':{ a:[-44,0], b:[44,0] } };
    const pts = [];
    st.parts.forEach((p) => T[p.type].forEach((k) => {
      pts.push({ id:p.id + ':' + k, x:80 + p.gx * 115 + D[p.type][k][0], y:90 + p.gy * 105 + D[p.type][k][1] });
    }));
    for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
      const d = Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
      t(d >= 40, `だい${i + 1}もん の ${pts[a].id} と ${pts[b].id} が 近すぎる（${d.toFixed(0)}px）`);
    }
  });
}

/* ================================================================== *
 * 2. ならべる型（月の 満ち欠けの じゅん）
 * ================================================================== */
head('ならべる型 — わっかの ならびを 正しく 判定して いるか');
{
  A.cur.gameId = 'earth-tsuki'; A.cur.si = 0;
  const st = A.gameById('earth-tsuki').stages[0];
  A.loadNaraberu(st);
  const order = st.items.map((i) => i.id);
  const set = (a) => { A.cur.slots = a.slice(); return A.naraberuOK(); };
  t(set(order), 'ていぎ どおりの じゅんが せいかいに ならない');
  t(set(order.slice(3).concat(order.slice(0, 3))), 'ずらした ならび（わっか）が せいかいに ならない');
  t(!set(order.slice().reverse()), 'ぎゃくじゅんが せいかいに なって しまう');
  const sw = order.slice(); [sw[2], sw[5]] = [sw[5], sw[2]];
  t(!set(sw), '2つ 入れかえても せいかいに なって しまう');
  t(!set(order.slice(0, 7).concat([null])), 'とちゅうでも せいかいに なって しまう');
}

/* ================================================================== *
 * 3. むすぶ型（むすぶ型の ミニゲーム ぜんぶ）
 * ================================================================== */
head('むすぶ型 — 対応づけを 正しく 判定して いるか');
{
  const mbGames = A.GAMES.filter((g) => !g.soon && (g.stages || []).some((st) => (st.kind || g.kind) === 'musubu'));
  t(mbGames.length >= 2, `むすぶ型の ミニゲームが 2つ ない（${mbGames.length}）`);
  mbGames.forEach((g) => {
    A.cur.gameId = g.id;
    g.stages.forEach((st, si) => {
      if ((st.kind || g.kind) !== 'musubu') return;
      const tag = `${g.id} だい${si + 1}もん`;
      A.cur.si = si;
      const sc = A.MB_SCENES[st.scene || 'moon'];
      t(!!sc, `${tag} の ばめん "${st.scene || 'moon'}" が MB_SCENES に ない`);
      if (!sc) return;
      A.loadMusubu(st);
      /* pairs が ノードを 正しく さして いるか・1対1か */
      const ids = st.nodes.map((n) => n.id);
      t(new Set(ids).size === ids.length, `${tag} ノードの id が かぶって いる`);
      const used = {};
      st.pairs.forEach((pr, pi) => {
        pr.forEach((x) => {
          t(ids.indexOf(x) >= 0, `${tag} pairs[${pi}] の "${x}" が ノードに ない`);
          t(!used[x], `${tag} "${x}" が 2つの くみに 出て くる（1対1に ならない）`);
          used[x] = 1;
        });
        const a = st.nodes.filter((n) => n.id === pr[0])[0], b = st.nodes.filter((n) => n.id === pr[1])[0];
        if (a && b) t(a.kind !== b.kind, `${tag} pairs[${pi}] が 同じ なかまどうし（むすべない）`);
      });
      /* こたえがわの ノードが ぜんぶ つかわれて いるか（あまりが あると 1対1に ならない） */
      const ans = st.nodes.filter((n) => n.kind === sc.answerKind);
      t(ans.length === st.pairs.length, `${tag} こたえの カードの 数（${ans.length}）と くみの 数（${st.pairs.length}）が 合わない`);
      /* 判定 */
      A.cur.wires = st.pairs.map((p) => [p[0], p[1]]);
      t(A.musubuOK(), `${tag} 正しい くみあわせが 通らない`);
      A.cur.wires = st.pairs.map((p, i) => [p[0], st.pairs[(i + 1) % st.pairs.length][1]]);
      t(!A.musubuOK(), `${tag} ぜんぶ ずらしても 通って しまう`);
      A.cur.wires = [[st.pairs[0][0], st.pairs[1][1]], [st.pairs[1][0], st.pairs[0][1]]]
        .concat(st.pairs.slice(2).map((p) => [p[0], p[1]]));
      t(!A.musubuOK(), `${tag} 2つ 入れかえても 通って しまう`);
      A.cur.wires = st.pairs.slice(0, st.pairs.length - 1).map((p) => [p[0], p[1]]);
      t(!A.musubuOK(), `${tag} 1つ たりなくても 通って しまう`);
      /* ノードが かさなって いないか（ばめんの ならべ方の たしかめ） */
      A.cur.wires = [];
      const pos = st.nodes.map((n) => ({ id: n.id, p: A.mbPos(n) }));
      for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
        const d = Math.hypot(pos[i].p.x - pos[j].p.x, pos[i].p.y - pos[j].p.y);
        t(d > 40, `${tag}：${pos[i].id} と ${pos[j].id} が かさなって いる（きょり${d.toFixed(0)}）`);
      }
      /* え が かけるか */
      let ok2 = true, why = '';
      try {
        if (typeof sc.bg() !== 'string') ok2 = false;
        st.nodes.forEach((n) => { if (typeof sc.node(n, false) !== 'string') ok2 = false; });
      } catch (e) { ok2 = false; why = e.message; }
      t(ok2, `${tag} の え が かけない ${why}`);
    });
  });
}

/* ================================================================== *
 * 4. つりあい型（てこ）— 総当たりで「解けるか」まで しらべる
 * ================================================================== */
head('てこ（つりあい型）— ぜんぶの おき方を しらべて 解けるか');
{
  const g = A.gameById('energy-teko');
  A.cur.gameId = 'energy-teko';
  const SPOTS = [];
  for (const side of ['L', 'R']) for (let p = 1; p <= 6; p++) SPOTS.push({ side, p });
  /* てもとの おもり 1こずつを どの めもりに つるすかの **ぜんぶの わりあて**を しらべる。
     おもさが ちがう おもりが あるので、「どの おもりを どこに」まで 見ないと いけない。
     同じ 見た目に なる おき方（同じ おもさが 同じ ばしょ）は 1つに まとめて 数える。 */
  const solveAll = (st) => {
    const tray = A.trTray(st), sols = new Set();
    const acc = [];
    const rec = (i) => {
      if (i === tray.length) {
        A.cur.placed = acc.slice();
        if (!SPOTS.every((sp) => A.trCount(sp.side, sp.p) <= 3)) return;
        if (!A.tsuriaiOK()) return;
        sols.add(acc.map((w) => w.side + w.p + ':' + tray[w.gi]).sort().join('+'));
        return;
      }
      for (let k = 0; k < SPOTS.length; k++) { acc.push({ side: SPOTS[k].side, p: SPOTS[k].p, gi: i }); rec(i + 1); acc.pop(); }
    };
    rec(0);
    A.cur.placed = [];
    return sols;
  };
  let hard = 0;
  const seen = new Map();          /* こたえの あつまり → さいしょに 出た もんだい番号 */
  g.stages.forEach((st, si) => {
    A.cur.si = si; A.loadTsuriai(st);
    const sols = solveAll(st);
    /* **こたえが まったく 同じ もんだいは 実しつ 同じ もんだい。**
       とめて ある おもりの 見た目が ちがっても、子どもには 同じ 作業に なる
       （10g 2こ＠4 と 20g 1こ＠4 は 同じ 80）。ふやす ときに 気づける ように 見はる。 */
    const key = [...sols].sort().join('|');
    if (seen.has(key)) t(false, `だい${si + 1}もん は だい${seen.get(key)}もん と こたえが まったく 同じ（同じ もんだいに なって いる）`);
    else seen.set(key, si + 1);
    const tray = A.trTray(st);
    t(sols.size > 0, `だい${si + 1}もん に こたえが ない`);
    t(tray.length >= 1 && tray.length <= 4, `だい${si + 1}もん の てもとの おもりが 多すぎ／少なすぎ（${tray.length}こ）`);
    tray.forEach((gm) => t([10, 20, 30].indexOf(gm) >= 0, `だい${si + 1}もん に 用意して いない おもさ（${gm}g）が ある`));
    (st.fixed || []).forEach((f) => {
      t([10, 20, 30].indexOf(f.g || 10) >= 0, `だい${si + 1}もん の とめて ある おもりに 用意して いない おもさ`);
      t(f.p >= 1 && f.p <= 6, `だい${si + 1}もん の とめて ある おもりの めもりが はんい外`);
      t(f.n >= 1 && f.n <= 3, `だい${si + 1}もん の とめて ある おもりが 1つの めもりに 4こ いじょう`);
    });
    /* 1つの めもりには 3こまで。とめて ある ぶんだけで あふれて いないか */
    SPOTS.forEach((sp) => {
      let n = 0;
      (st.fixed || []).forEach((f) => { if (f.side === sp.side && f.p === sp.p) n += f.n; });
      t(n <= 3, `だい${si + 1}もん の ${sp.side}${sp.p} に とめて ある おもりが 3こを こえて いる`);
    });
    t(!!st.t && !!st.h && !!st.learn, `だい${si + 1}もん に t / h / learn が そろって いない`);
    /* **ヒントの「こたえの れい」（ex）が ほんとうに つり合うか。**
       ex は てもとの おもりの じゅんばんで ['L'/'R', めもり]。おもさが ちがう ので
       「どの おもりを どこに」が ずれると ヒントの とおりに やっても つり合わない。 */
    t(Array.isArray(st.ex), `だい${si + 1}もん に ex（こたえの れい）が ない`);
    t((st.ex || []).length === tray.length, `だい${si + 1}もん の ex の 数が てもとの おもりの 数と 合わない`);
    A.cur.placed = (st.ex || []).map((e, k) => ({ side: e[0], p: e[1], gi: k }));
    t((st.ex || []).every((e) => (e[0] === 'L' || e[0] === 'R') && e[1] >= 1 && e[1] <= 6),
      `だい${si + 1}もん の ex に はんい外の めもりが ある`);
    t(SPOTS.every((sp) => A.trCount(sp.side, sp.p) <= 3), `だい${si + 1}もん の ex は 1つの めもりに 4こ いじょう つるして いる`);
    t(A.tsuriaiOK(), `だい${si + 1}もん は ヒントの こたえの れい どおりに つるしても つり合わない`);
    const ah = A.hintAnswer(st, 'tsuriai');
    t((ah.match(/<li>/g) || []).length === tray.length, `だい${si + 1}もん の こたえの れいの 手じゅん数が 合わない`);
    t(ah.indexOf('undefined') < 0, `だい${si + 1}もん の こたえの れいの ことばが こわれて いる`);
    A.cur.placed = [];
    if (sols.size === 1) hard++;
    console.log(`  ・だい${si + 1}もん ひだり=${A.trMoment('L')} てもと[${tray.join(',')}] → こたえ ${sols.size}とおり`);
  });
  console.log(`  ・こたえが 1とおりしか ない もんだい … ${hard}／${g.stages.length}もん`);
  /* となりの めもりの おもり どうしが よこに かさならないか。
     20g・30gは 10gより はばが 広いので、めもりの あいだ（TR.step）より はばが 大きいと
     となりに かぶって しまう（2026-08-28 の 実きで じっさいに かさなった）。 */
  {
    const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
    const step = parseInt(html.match(/var TR = \{[^}]*step:(\d+)/)[1], 10);
    const ws = [...html.matchAll(/^\s*(10|20|30):\{ w:(\d+), h:(\d+)/gm)].map((m) => ({ g: +m[1], w: +m[2], h: +m[3] }));
    t(ws.length === 3, 'おもりの 大きさの ひょう（TRW）が 読めない');
    ws.forEach((w) => t(w.w < step, `${w.g}g の おもり（はば${w.w}）が めもりの あいだ（${step}）より 広くて となりと かさなる`));
    t(ws.every((w, i) => i === 0 || w.w > ws[i - 1].w), 'おもい おもりほど 大きく なって いない（見て 分からない）');
    /* 3こ つみ上げても てもとの らんに はみ出さないか（さいだいの かたむき 10ど） */
    const maxH = Math.max(...ws.map((w) => w.h));
    const bottom = 219 + 6 * step * Math.sin(10 * Math.PI / 180) + 8 + 3 * (maxH + 3) + 10;
    t(bottom < 384, `おもりを 3こ つみ上げると てもとの らんに はみ出す（下は ${Math.round(bottom)}px）`);
  }
  /* つり合って いない／てもとを のこして いる ときは クリアに ならない */
  A.cur.si = 2; A.loadTsuriai(g.stages[2]);
  A.cur.placed = [{ side: 'R', p: 5, gi: 0 }];
  t(!A.tsuriaiOK(), 'つり合って いないのに クリアに なる');
  A.cur.placed = [];
  t(!A.tsuriaiOK(), 'てもとを つるして いないのに クリアに なる');
}

/* ================================================================== *
 * 4b. 上皿てんびん（ものの重さ）— こたえは「かわる前の 合計」から 計算して いるか
 *     分銅の 組み合わせを 総当たり して、解けるか／まちがいが 通らないかを 見る。
 * ================================================================== */
head('上皿てんびん（つりあい型）— 分銅で はかれるか・すじが 通って いるか');
{
  const tbGames = A.GAMES.filter((g) => !g.soon && (g.stages || []).some((st) => (st.kind || g.kind) === 'tenbin'));
  t(tbGames.length >= 1, '上皿てんびんの ミニゲームが ない');
  tbGames.forEach((g) => {
    A.cur.gameId = g.id;
    g.stages.forEach((st, si) => {
      const tag = `${g.id} だい${si + 1}もん`;
      A.cur.si = si; A.loadTenbin(st);
      t(Array.isArray(st.before) && st.before.length > 0, `${tag} に before が ない`);
      t(!!st.after && !!st.after.label, `${tag} に after が ない`);
      t(!!st.change, `${tag} に change（何を したか）が ない`);
      const mass = A.tbMass();
      t(mass > 0, `${tag} の 重さが 0`);
      t(mass === st.before.reduce((a, b) => a + b.g, 0), `${tag} 重さが before の 合計と ちがう`);
      /* 分銅の 総当たり（TB.max こ まで）で こたえが あるか */
      const F = A.TB.fundo, N = F.length, sols = [];
      for (let m = 1; m < (1 << N); m++) {
        const pick = [];
        for (let i = 0; i < N; i++) if (m & (1 << i)) pick.push(i);
        if (pick.length > A.TB.max) continue;
        A.cur.placed = pick;
        if (A.tenbinOK()) sols.push(pick.map((i) => F[i]).join('+'));
      }
      A.cur.placed = [];
      t(sols.length > 0, `${tag} は 分銅で ぴったりに できない（${mass}g）`);
      console.log(`  ・${tag} ${mass}g → 分銅の のせ方 ${sols.length}とおり（例 ${sols[0]}）`);
      /* つり合って いない／のせて いない ときは クリアに ならない */
      A.cur.placed = [];
      t(!A.tenbinOK(), `${tag} 何も のせて いないのに クリアに なる`);
      A.cur.placed = [0];
      t(F[0] === mass || !A.tenbinOK(), `${tag} つり合って いないのに クリアに なる`);
      A.cur.placed = [];
      /* え が かけるか */
      let ok2 = true, why = '';
      try {
        st.before.forEach((b) => { if (typeof A.itemArt(b.art, 19) !== 'string' || !A.itemArt(b.art, 19).length) ok2 = false; });
        if (!A.itemArt(st.after.art, 19).length) ok2 = false;
      } catch (e) { ok2 = false; why = e.message; }
      t(ok2, `${tag} の え が かけない ${why}`);
    });
  });
}

/* ================================================================== *
 * 4c. こうじょう型（つないで作る リサイクル工場）
 *     同じ種類を3こ以上つなぐ → その材料に合う加工品ができる、という遊びの筋を検査。
 * ================================================================== */
head('こうじょう型 — ごみを つないで 加工品に できるか');
{
  const fcG = A.GAMES.filter((g) => !g.soon && (g.stages || []).some((st) => (st.kind || g.kind) === 'factory'));
  t(fcG.length === 1, 'リサイクル工場が 1つに なって いない');
  t(A.FC_TYPES.length >= 7, '分別する ごみが 7しゅるい ない');
  ['can','bottle','glass'].forEach((id)=>t(!!A.fcType(id), `${id} の 分別が ない`));
  t(new Set(A.FC_TYPES.map((x) => x.id)).size === A.FC_TYPES.length, 'ごみの id が かさなって いる');
  A.FC_TYPES.forEach((x) => {
    t(x.junk.length >= 3, `${x.name} の ごみの えが 3しゅるい ない`);
    t(x.product && x.product[0] && x.product[1], `${x.name} から できる 加工品が ない`);
  });
  fcG.forEach((g) => {
    A.cur.gameId = g.id;
    t(g.stages.length === 3, 'リサイクル工場が 3ステージに なって いない');
    g.stages.forEach((st, si) => {
      const tag = `${g.id} だい${si + 1}もん`;
      A.cur.si = si;
      t(Array.isArray(st.pool) && st.pool.length >= 2, `${tag} の ごみが 少なすぎる`);
      st.pool.forEach((k) => t(!!A.fcType(k), `${tag} の ごみ "${k}" に 変換先が ない`));
      t(st.target > 0 && st.star > st.target, `${tag} の もくひょう／★が おかしい`);
      if (si > 0) t(st.pool.length > g.stages[si - 1].pool.length, `${tag}で ごみの しゅるいが ふえて いない`);
      A.loadFactory(st);
      t(A.cur.items.length === A.FC.cols * A.FC.rows, `${tag} の 盤面が いっぱいに ならない`);
      t(A.cur.items.length >= 50, `${tag} の ごみが 長い連鎖を作れる 数まで ふえていない`);
      t(A.fcHasMove(), `${tag} は はじめから 3こ つなげられる 場所が ない`);
      A.cur.items.forEach((it) => {
        t(it.kind==='save'||st.pool.indexOf(it.kind) >= 0, `${tag} に 出ない はずの ${it.kind} が ある`);
        t(it.x >= 10 && it.x <= 590 && it.y >= 94 && it.y <= 590, `${tag} の ごみが 盤面から はみ出す`);
      });
      /* となり合う3こを同じ種類にして、ほんとうに加工品へ変える */
      const kind = st.pool[0];
      A.cur.items.slice(0, 3).forEach((it) => { it.kind = kind; it.variant = 0; });
      t(A.fcAdjacent(A.cur.items[0], A.cur.items[1]) && A.fcAdjacent(A.cur.items[1], A.cur.items[2]), `${tag} の よこ3こが つながらない`);
      A.cur.chain = A.cur.items.slice(0, 3).map((x) => x.key); A.cur.chainType = kind;
      const removedKeys = A.cur.chain.slice();
      const made0 = A.cur.products;
      t(A.fcRecycle(), `${tag} で 3こ つないでも 加工できない`);
      t(A.cur.products === made0 + 1 && A.cur.made[kind] === 1, `${tag} で 加工品の 数が ふえない`);
      t(A.cur.score > 0 && A.cur.chain.length === 0, `${tag} の 得点／つないだ線が おかしい`);
      t(removedKeys.every((key)=>!A.cur.items.some((it)=>it.key===key)), `${tag} で つないだ ごみが 消えない`);
      t(A.cur.items.length === A.FC.cols*A.FC.rows && A.cur.dropT>0, `${tag} で 消えたあと 上から ごみが 落ちてこない`);
      t(new Set(A.cur.items.map((it)=>it.row+','+it.col)).size===A.cur.items.length, `${tag} の 落下後に ごみが かさなっている`);
      /* 6こなら加工品2こ */
      A.cur.items.slice(0, 6).forEach((it) => { it.kind = kind; it.variant = 0; });
      A.cur.chain = A.cur.items.slice(0, 6).map((x) => x.key); A.cur.chainType = kind;
      const made1 = A.cur.products;
      t(A.fcRecycle() && A.cur.products === made1 + 2, `${tag} で 6こ つないでも 加工品が 2こ できない`);
      t(A.cur.fever > 0, `${tag} で つないでも フィーバーゲージが たまらない`);
      /* 2こでは失敗 */
      A.cur.chain = A.cur.items.slice(0, 2).map((x) => x.key); A.cur.chainType = A.cur.items[0].kind;
      t(!A.fcRecycle(), `${tag} で 2こしか ないのに 加工できる`);
      A.loadFactory(st);
      t(!A.factoryOK(), `${tag} はじめから クリアに なって いる`);
      A.cur.over = true; A.cur.score = st.target;
      t(A.factoryOK(), `${tag} もくひょうに とどいても クリアに ならない`);
      A.cur.score = st.target - 1;
      t(!A.factoryOK(), `${tag} もくひょう みまんでも クリアに なる`);
      A.cur.over = false;
    });
    /* 粗大ごみの2工程、フィーバー2倍、同種が固まりやすい補充を個別に見る */
    const st = g.stages[1]; A.cur.si = 1; A.loadFactory(st);
    A.cur.items.slice(0,3).forEach((it)=>{it.kind='bulky';it.variant=0;});
    A.cur.chain=A.cur.items.slice(0,3).map((x)=>x.key);A.cur.chainType='bulky';
    const bulky0=A.cur.products;
    t(A.fcRecycle() && A.cur.products===bulky0 && A.cur.bulkyParts===1, 'そだいごみが 解体工程を とばして 加工品に なる');
    A.cur.items.slice(0,3).forEach((it)=>{it.kind='bulky';it.variant=0;});
    A.cur.chain=A.cur.items.slice(0,3).map((x)=>x.key);A.cur.chainType='bulky';
    t(A.fcRecycle() && A.cur.products===bulky0+1 && A.cur.bulkyParts===0, 'そだいごみを 2回 加工しても 再生ボードに ならない');
    A.loadFactory(st); A.cur.feverTime=5; A.cur.fever=63;
    A.cur.items.slice(0,3).forEach((it)=>{it.kind='plastic';it.variant=0;});
    A.cur.chain=A.cur.items.slice(0,3).map((x)=>x.key);A.cur.chainType='plastic';
    const fever0=A.cur.products;
    t(A.fcRecycle() && A.cur.products===fever0+2, 'フィーバー中でも 加工品が 2ばいに ならない');
    A.loadFactory(g.stages[2]);
    const specialPath=[0,1,2,3,4,5,6,7,15,14].map((i)=>A.cur.items[i]);
    specialPath.forEach((it)=>{it.kind='plastic';it.variant=0;});
    A.cur.chain=specialPath.map((x)=>x.key);A.cur.chainType='plastic';
    const specialScore=A.cur.score;
    t(A.fcRecycle() && A.cur.specials===1 && A.cur.special && A.cur.special.transform.title==='ボトルtoボトル', 'プラ10連鎖で 必殺リサイクルが 出ない');
    t(A.cur.special.count===10 && A.cur.score>=specialScore+300, '10連鎖の 数／必殺技ボーナスが おかしい');
    t(A.cur.special.transform.to.indexOf('PETボトル')>=0, 'プラが 何に リサイクルされるか 表示されない');
    const specialTime=A.cur.left;A.fcStep(.25);
    t(A.cur.left===specialTime, '必殺技を 見ている あいだも 60びょうが へってしまう');
    A.loadFactory(g.stages[2]);
    const reusePath=[0,1,2,3,4,5,6,7,15,14].map((i)=>A.cur.items[i]);
    reusePath.forEach((it)=>{it.kind='bulky';it.variant=0;});
    A.cur.chain=reusePath.map((x)=>x.key);A.cur.chainType='bulky';
    t(A.fcRecycle() && A.cur.special.transform.title==='リユース' && A.cur.special.transform.to==='中古販売店へ', '粗大10連鎖で リユース／中古販売店が 出ない');
    t(A.FC_TRANSFORMS.burn.title==='熱回収', 'もえるごみを 材料リサイクルと まちがえている');
    t(A.FC_SPECIALS.plastic.length>=4 && A.FC_SPECIALS.bulky.length>=4 && A.FC_SPECIALS.burn.length>=4 && A.FC_SPECIALS.metal.length>=5, '必殺技の 変身先が 少なすぎる');
    t(A.FC_SPECIALS.can.length>=4 && A.FC_SPECIALS.bottle.length>=4 && A.FC_SPECIALS.glass.length>=3, 'かん・びん・ガラスの 分別結果が 少ない');
    t(A.FC_SPECIALS.burn.some((x)=>x.to.indexOf('エコセメント')>=0) && A.FC_SPECIALS.burn.some((x)=>x.to.indexOf('埋立地')>=0), '焼却灰の 資源化／最終処分が 学べない');
    t(A.FC_SPECIALS.metal.some((x)=>x.to.indexOf('レール')>=0) && A.FC_SPECIALS.metal.some((x)=>x.to.indexOf('建物')>=0), '金属が かん以外に 生まれかわらない');
    A.loadFactory(g.stages[2]);
    const save=A.cur.items.find((it)=>it.kind==='save'&&A.FC_SAVES[it.variant%A.FC_SAVES.length].mode==='keep'),saveScore=A.cur.score,saveKey=save&&save.key;
    t(!!save, 'すてちゃダメの ダミーが 盤面に 出ない');
    t(A.fcRescueItem(save) && A.cur.rescued===1 && A.cur.score===saveScore+150, '金・服・スマホを 救出しても 得点に ならない');
    t(!A.cur.items.some((it)=>it.key===saveKey) && A.cur.rescue&&A.cur.rescue.info, '救出したものの 行き先が 表示されない');
    A.loadFactory(g.stages[2]);
    const danger=A.cur.items.find((it)=>it.kind==='save'&&A.FC_SAVES[it.variant%A.FC_SAVES.length].mode==='quiz');
    t(!!danger, '電池・スプレー缶などの 危険分別が 盤面に 出ない');
    const dangerInfo=A.FC_SAVES[danger.variant%A.FC_SAVES.length],dangerScore=A.cur.score,dangerTime=A.cur.left;
    t(A.fcRescueItem(danger)&&A.cur.sortQuiz&&!A.cur.sortQuiz.answered, '危険ごみを タップしても 分別問題が 出ない');
    A.fcStep(.25);t(A.cur.left===dangerTime, '危険ごみの 分別を 考えている あいだも 時間が へる');
    t(A.fcAnswerQuiz(dangerInfo.correct)&&A.cur.sorted===1&&A.cur.score===dangerScore+200, '危険ごみを 正しく分けても 得点に ならない');
    t(src.indexOf('data-fc-back-html')>=0 && src.indexOf('data-fc-again-html')>=0 && src.lastIndexOf('renderFactory = function()')>src.lastIndexOf('tryClear(factoryOK())'), '結果画面の HTML戻る・もう一度ボタン／自動クリア画面の停止が できていない');
    t(src.indexOf('cur.fcNeedsRender=true')>=0 && src.indexOf('!cur.special&&!cur.rescue&&!cur.sortQuiz')>=0, 'クイズ解説が出ている間の タイマー停止／消えた直後の再描画が ない');
    t(src.indexOf("getElementById('fc-controls').addEventListener('touchend'")>=0 && src.indexOf('||cur.sortQuiz||cur.dropT')<0, 'Safariのタッチを直接受けていない／クイズ中にボタンを毎フレーム作り直している');
    t(A.FC_TRIVIA.length>=8, 'ゲーム後の リサイクル豆ちしきが 少ない');
    A.cur.score=g.stages[2].star;t(A.fcEcoRank(g.stages[2]).n===5, '高得点でも エコ度が 上がらない');
    let same=0,edges=0;
    for(let trial=0;trial<24;trial++){
      A.loadFactory(g.stages[2]);
      A.cur.items.forEach((it)=>{
        const right=A.cur.items.find((x)=>x.row===it.row&&x.col===it.col+1);
        const down=A.cur.items.find((x)=>x.row===it.row+1&&x.col===it.col);
        [right,down].forEach((x)=>{if(x&&it.kind!=='save'&&x.kind!=='save'){edges++;if(x.kind===it.kind)same++;}});
      });
    }
    t(same/edges>.42, `新しい ごみが 同じ種類で 固まりにくい（${(same/edges).toFixed(2)}）`);
  });
}

/* ================================================================== *
 * 4d. はつでん型（ぐるぐる発電・れんだ ゲーム）
 *     もくひょうの 時間が「ふつうに れんだ した 子」で とどく か、
 *     ★が「がんばった 子」で とどく かを、タップ速度から 見つもる。
 *     ここが ずれると ただの 苦行 or ぬるゲーに なる。
 * ================================================================== */
head('はつでん型 — れんだで とどく はんいか');
{
  const hdG = A.GAMES.filter((g) => !g.soon && (g.stages || []).some((st) => (st.kind || g.kind) === 'hatsuden'));
  t(hdG.length >= 1, 'はつでん型の ミニゲームが ない');
  /* はやく 回すほど 1回の 発電が ふえる ＝ この ゲームの 心ぞう */
  const bonus = (rate) => 1 + Math.max(0, Math.min(1, (rate - 2) / 5));
  t(bonus(6) > bonus(3), 'はやく 回しても 1回の 発電が ふえない');
  const energy = (rate) => rate * A.HD.crank * A.HD.base * bonus(rate);
  const easy = energy(2.5), normal = energy(4), hard = energy(6);
  console.log(`  ・10びょうの れんだ … ゆっくり(2.5/び)${easy.toFixed(0)} ／ ふつう(4/び)${normal.toFixed(0)} ／ 全力(6/び)${hard.toFixed(0)}`);
  hdG.forEach((g) => {
    A.cur.gameId = g.id;
    let prevUse = 0;
    g.stages.forEach((st, si) => {
      const tag = `${g.id} だい${si + 1}もん`;
      A.cur.si = si;
      const L = A.CD_LOADS.filter((x) => x.id === st.load)[0];
      t(!!L, `${tag} の つなぐ もの "${st.load}" が ない`);
      if (!L) return;
      t(st.star > st.need, `${tag} の ★が もくひょうと 同じ`);
      const needE = st.need * L.use, starE = st.star * L.use;
      t(needE <= normal, `${tag} の もくひょうが きびしすぎる（${needE.toFixed(0)} > ふつうの ${normal.toFixed(0)}）`);
      t(starE <= hard, `${tag} の ★が きびしすぎる（${starE.toFixed(0)} > 全力の ${hard.toFixed(0)}）`);
      t(needE <= A.HD.cap, `${tag} は コンデンサーに 入りきらない（${needE.toFixed(0)} > ${A.HD.cap}）`);
      /* レベルが すすむほど 電気を 食う ものに なって いるか（だんだん 手が いそがしく なる） */
      t(L.use >= prevUse, `${tag} で 電気の 食い方が 前より 楽に なって いる（レベルが 下がる）`);
      prevUse = L.use;
      console.log(`  ・${tag} ${L.name}／もくひょう ${st.need}びょう=${needE.toFixed(0)}　★${st.star}びょう=${starE.toFixed(0)}`);
      A.loadHatsuden(st);
      t(!A.hatsudenOK(), `${tag} はじめから クリアに なって いる`);
      A.cur.phase = 'done'; A.cur.runTotal = st.need;
      t(A.hatsudenOK(), `${tag} もくひょうに とどいても クリアに ならない`);
      A.cur.runTotal = st.need - 0.1;
      t(!A.hatsudenOK(), `${tag} もくひょう みまんでも クリアに なる`);
    });
  });
  /* 豆電球と LEDの 差（この ゲームの おち）が ほんとうに 5ばい 前後か */
  const mame = A.CD_LOADS.filter((x) => x.id === 'mame')[0].use;
  const led = A.CD_LOADS.filter((x) => x.id === 'led')[0].use;
  t(mame / led >= 4 && mame / led <= 6, `豆電球と LEDの 差が ${(mame / led).toFixed(1)}ばい（4〜6ばいの はんいに したい）`);
}

/* ================================================================== *
 * 4e. そだて型（植物）— ミッションの 段かいに とどくか・★が 取れるか
 * ================================================================== */
head('そだて型（植物）— じょうけんの ルールが 正しいか');
{
  const sdG = A.GAMES.filter((g) => !g.soon && (g.stages || []).some((st) => (st.kind || g.kind) === 'sodate'));
  t(sdG.length >= 1, 'そだて型の ミニゲームが ない');
  /* ルールそのものの たしかめ（理科として 正しいか） */
  const set = (o) => { A.cur.cond = { mizu:!!o.mizu, atatakai:!!o.atatakai, hikari:!!o.hikari, hiryo:!!o.hiryo }; A.cur.jufun = !!o.jufun; return A.sodateStage(); };
  t(set({ mizu:1, atatakai:1 }) >= 1, '水と あたたかさだけでは 芽が 出ない ことに なって いる');
  t(set({ mizu:1, atatakai:1, hikari:1, hiryo:1 }) >= 1, 'ぜんぶ そろえても 芽が 出ない');
  t(set({ mizu:0, atatakai:1, hikari:1, hiryo:1 }) === 0, '水が なくても 芽が 出て しまう');
  t(set({ mizu:1, atatakai:0, hikari:1, hiryo:1 }) === 0, 'さむくても 芽が 出て しまう');
  t(set({ mizu:1, atatakai:1, hikari:0, hiryo:1 }) === 1, '日光が なくても 緑に なって しまう（もやしに ならない）');
  t(set({ mizu:1, atatakai:1, hikari:1, hiryo:0 }) === 2, '肥料が なくても 大きく そだって しまう');
  t(set({ mizu:1, atatakai:1, hikari:1, hiryo:1 }) === 3, 'ぜんぶ そろえても 花が さかない');
  t(set({ mizu:1, atatakai:1, hikari:1, hiryo:1, jufun:1 }) === 4, 'じゅふんしても 実が できない');
  sdG.forEach((g) => {
    A.cur.gameId = g.id;
    g.stages.forEach((st, si) => {
      const tag = `${g.id} だい${si + 1}もん`;
      A.cur.si = si;
      t(typeof st.need === 'number' && typeof st.star === 'number', `${tag} に need／star が ない`);
      /* ★の じょうけん（つけた じょうけん ≦ star）で need に とどく くみあわせが あるか */
      let best = null;
      for (let m = 0; m < 16; m++) {
        const o = { mizu:m & 1, atatakai:m & 2, hikari:m & 4, hiryo:m & 8 };
        const on = [1, 2, 4, 8].filter((b) => m & b).length;
        if (on > st.star) continue;
        A.cur.cond = { mizu:!!o.mizu, atatakai:!!o.atatakai, hikari:!!o.hikari, hiryo:!!o.hiryo };
        A.cur.jufun = (st.need >= 4);
        if (A.sodateStage() >= st.need && (best === null || on < best)) best = on;
      }
      t(best !== null, `${tag} は ★${st.star}つの じょうけんでは とどかない`);
      console.log(`  ・${tag} 目ひょう 段かい${st.need} → さいしょう ${best}つの じょうけんで とどく（★${st.star}つまで）`);
      A.loadSodate(st);
      t(!A.sodateOK(), `${tag} そだてる まえに クリアに なる`);
      A.cur.grown = st.need;
      t(A.sodateOK(), `${tag} 目ひょうまで そだてても クリアに ならない`);
    });
  });
}

/* ================================================================== *
 * 4f. でんじしゃくバトル型（クラスター系）
 *     ゲームの 心ぞうは 「同じ極は しりぞけ・ちがう極は 引き合う」と
 *     「まきかずが 多いほど 強い」。ここが 理科として 正しく ないと、
 *     あそぶほど まちがった 感かくが 身に つく ので 式そのものを 検査する。
 *     さらに **かしこく 置いても 事こが おきる きつさか**を シミュレーションで 見る。
 * ================================================================== */
head('でんじしゃくバトル — 磁力の きまりと ゲームの きつさ');
{
  const mgG = A.GAMES.filter((g) => !g.soon && (g.stages || []).some((st) => (st.kind || g.kind) === 'jishaku'));
  t(mgG.length >= 1, 'でんじしゃくバトル型の ミニゲームが ない');
  /* ① まきかずが 多いほど 大きく・強い（ひとつづきの 数で） */
  const mk = [0, 1, 2, 3, 4].map((q) => Math.round(A.MG.minMaki + (A.MG.maxMaki - A.MG.minMaki) * q / 4));
  for (let i = 1; i < mk.length; i++) {
    t(A.mgSize(mk[i]) > A.mgSize(mk[i - 1]), `まきかず ${mk[i]} が ${mk[i - 1]} より 大きく ない`);
    t(A.mgForce(mk[i]) > A.mgForce(mk[i - 1]), `まきかず ${mk[i]} が ${mk[i - 1]} より 強く ない`);
  }
  t(A.mgForce(200) / A.mgForce(100) === 2, 'まきかず 2ばいで 磁力が 2ばいに ならない');
  /* ② 力は きょりの 2じょうに 反比例 */
  const F = (m1, m2, d) => A.MG.K * m1 * m2 / (d * d);
  t(Math.abs(F(1, 1, 50) / F(1, 1, 100) - 4) < 1e-9, 'きょり 半分で 力が 4ばいに ならない');
  t(F(3, 1, 60) === F(1, 3, 60), '作用・反作用が つり合って いない');
  /* ③ 同じ極は しりぞけ・ちがう極は 引き合う */
  A.cur.gameId = mgG[0].id; A.cur.si = 0;
  A.loadJishaku(mgG[0].stages[0]);
  const pair = (p1, p2) => {
    A.cur.pieces = [
      { x: A.MG.cx - 34, y: A.MG.cy, r: 17, m: 2, maki: 200, pole: p1, own: 0, vx: 0, vy: 0 },
      { x: A.MG.cx + 34, y: A.MG.cy, r: 17, m: 2, maki: 200, pole: p2, own: 1, vx: 0, vy: 0 },
    ];
    const d0 = Math.abs(A.cur.pieces[0].x - A.cur.pieces[1].x);
    A.mgSim();
    return Math.abs(A.cur.pieces[0].x - A.cur.pieces[1].x) - d0;
  };
  t(pair(1, 1) > 0, '同じ極（N-N）どうしが しりぞけ合わない');
  t(pair(-1, -1) > 0, '同じ極（S-S）どうしが しりぞけ合わない');
  t(pair(1, -1) < 0, 'ちがう極（N-S）が 引き合わない');
  /* ④ くっつくのは **ちがう極だけ**（2026-08-26 ユーザー指てき）。
        でんじしゃくの 極は 電流で きまって いて ひっくりかえらない ので、
        同じ極は どんなに 近づけても ぜったいに くっつかない */
  t(A.mgStickD({ r: 17, pole: 1 }, { r: 17, pole: 1 }) === 0, '同じ極（N-N）に くっつく きょりが ある');
  t(A.mgStickD({ r: 17, pole: -1 }, { r: 17, pole: -1 }) === 0, '同じ極（S-S）に くっつく きょりが ある');
  t(A.mgStickD({ r: 17, pole: 1 }, { r: 17, pole: -1 }) > 0, 'ちがう極が くっつかない');
  t(A.mgStickD({ r: A.mgSize(A.MG.maxMaki), pole: 1 }, { r: 17, pole: -1 }) >
    A.mgStickD({ r: A.mgSize(A.MG.minMaki), pole: 1 }, { r: 17, pole: -1 }),
    '強く 巻いても あぶない はんいが 広く ならない（巻く いみが ない）');
  /* 同じ極は **ぴったり くっつけて 置いても** かたまりに ならない（0.5px きざみで ぜんぶ 見る） */
  {
    let bad = 0;
    for (let d = 1; d < 120; d += 0.5) {
      A.cur.pieces = [
        { x: 300, y: 200, r: 15, m: 1.5, maki: 150, pole: 1 },
        { x: 300 + d, y: 200, r: 15, m: 1.5, maki: 150, pole: 1 },
      ];
      if (A.mgClusters().length) bad++;
    }
    t(bad === 0, `同じ極（N-N）なのに くっつく きょりが ${bad}か所 ある`);
    /* 走らせても くっつかない ―― ぶつけても はなれる はず */
    for (const d of [31, 34, 40, 60]) {
      A.cur.pieces = [
        { x: 300 - d / 2, y: 210, r: 15, m: 1.5, maki: 150, pole: 1, own: 0, vx: 0, vy: 0 },
        { x: 300 + d / 2, y: 210, r: 15, m: 1.5, maki: 150, pole: 1, own: 1, vx: 0, vy: 0 },
      ];
      A.mgSim();
      t(A.mgClusters().length === 0, `${d}px で ならべた 同じ極が 走らせたら くっついた`);
      t(Math.abs(A.cur.pieces[0].x - A.cur.pieces[1].x) > d, `${d}px の 同じ極が はなれて いかない`);
    }
  }
  /* ⑤ くっつきの 判定（ちがう極） */
  A.cur.pieces = [
    { x: 300, y: 200, r: 15, m: 1, maki: 100, pole: 1 },
    { x: 322, y: 200, r: 15, m: 1, maki: 100, pole: -1 },
    { x: 300, y: 120, r: 15, m: 1, maki: 100, pole: 1 },
  ];
  let cl = A.mgClusters();
  t(cl.length === 1 && cl[0].length === 2, 'くっついた 2こを かたまりと 見つけられない');
  const mid = 30 * A.MG.pull * 0.9;
  A.cur.pieces = [
    { x: 300 - mid, y: 200, r: 15, m: 1, maki: 100, pole: 1 },
    { x: 300, y: 200, r: 15, m: 1, maki: 100, pole: -1 },
  ];
  t(A.mgClusters().length === 1, 'ちがう極が 近いのに くっつかない（引き合う はず）');
  A.cur.pieces[1].pole = 1;
  t(A.mgClusters().length === 0, '同じ極なら はなれて いられる きょりで くっついて しまう');
  /* ⑤a じりょくが とどく きょり（2026-08-26 ユーザー指てき）
        「置いた ところから 遠い こまは 何も 動かない」。ここが 効いて いないと
        ばん ぜんたいが 毎回 じわっと 動いて、どこに 置いたら どうなるかが 読めなく なる */
  A.cur.gameId = mgG[0].id; A.cur.si = 0;
  A.loadJishaku(mgG[0].stages[0]);
  {
    const big = { r: A.mgSize(A.MG.maxMaki), m: A.mgForce(A.MG.maxMaki) };
    const small = { r: A.mgSize(A.MG.minMaki), m: A.mgForce(A.MG.minMaki) };
    t(A.mgReach(big, big) > A.mgReach(small, small), '強く 巻いても じりょくの とどく きょりが 広く ならない');
    t(A.mgReach(small, small) > A.mgStickD(Object.assign({ pole: 1 }, small), { r: small.r, pole: -1 }),
      'とどく きょりが くっつく きょりより せまい（引き合う 前に くっつく ことに なる）');
    /* 遠くに 置いた こまは 1ミリも 動かない（じっさいに 走らせて 見る） */
    const far = A.mgR() * 0.86;
    A.cur.pieces = [
      { x: A.MG.cx - far, y: A.MG.cy, r: small.r, m: small.m, maki: A.MG.minMaki, pole: 1, own: 1, vx: 0, vy: 0 },
      { x: A.MG.cx + far, y: A.MG.cy, r: big.r, m: big.m, maki: A.MG.maxMaki, pole: -1, own: 0, vx: 0, vy: 0 },
    ];
    const on = A.mgActive(1);
    t(on[1] && !on[0], '遠くの こままで 「動く こま」に 入って いる');
    const b4 = A.cur.pieces.map((p) => ({ x: p.x, y: p.y }));
    A.mgSim();
    const moved = A.cur.pieces.map((p, i) => Math.hypot(p.x - b4[i].x, p.y - b4[i].y));
    t(moved[0] === 0, `わくの はんたいがわの こまが 動いて しまう（${moved[0].toFixed(2)}px）`);
    t(moved[1] === 0, `まわりに 何も ない のに 置いた こまが 動く（${moved[1].toFixed(2)}px）`);
    /* すぐ となりなら ちゃんと 引き合う */
    const d = A.mgStickD({ r: big.r, pole: 1 }, { r: big.r, pole: -1 }) + 12;
    A.cur.pieces = [
      { x: A.MG.cx - d / 2, y: A.MG.cy, r: big.r, m: big.m, maki: A.MG.maxMaki, pole: 1, own: 1, vx: 0, vy: 0 },
      { x: A.MG.cx + d / 2, y: A.MG.cy, r: big.r, m: big.m, maki: A.MG.maxMaki, pole: -1, own: 0, vx: 0, vy: 0 },
    ];
    A.mgSim();
    t(A.mgClusters().length === 1, 'すぐ となりの ちがう極が 引き合わない');
    /* 3こ ならべて、まん中に 置いた とき **はしの こまは 動かない** */
    A.cur.pieces = [
      { x: A.MG.cx - A.mgR() * 0.9, y: A.MG.cy, r: small.r, m: small.m, maki: A.MG.minMaki, pole: 1, own: 1, vx: 0, vy: 0 },
      { x: A.MG.cx + A.mgR() * 0.9, y: A.MG.cy, r: small.r, m: small.m, maki: A.MG.minMaki, pole: 1, own: 1, vx: 0, vy: 0 },
      { x: A.MG.cx + A.mgR() * 0.9 - small.r * 2 - 8, y: A.MG.cy, r: small.r, m: small.m, maki: A.MG.minMaki, pole: 1, own: 0, vx: 0, vy: 0 },
    ];
    const c4 = A.cur.pieces.map((p) => ({ x: p.x, y: p.y }));
    A.mgSim(2);
    t(Math.hypot(A.cur.pieces[0].x - c4[0].x, A.cur.pieces[0].y - c4[0].y) === 0, 'はんたいがわの こまが まきぞえで 動いた');
    t(Math.hypot(A.cur.pieces[1].x - c4[1].x, A.cur.pieces[1].y - c4[1].y) > 0.5, 'すぐ となりの 同じ極が おされない');
  }

  /* ⑤b わくから 落ちる ルール（2026-08-25）
        ・まん中に 置いた こまは 落ちない ／ ふちに かかった こまは 落ちる
        ・置ける ところは かならず 落ちない ＝ 置いた しゅんかんに 落ちる ことは ない
        ・かべが ないので、強い こまは わくの 外へ おし出される */
  A.cur.gameId = mgG[0].id; A.cur.si = 0;
  A.loadJishaku(mgG[0].stages[0]);
  A.cur.pieces = [{ x: A.MG.cx, y: A.MG.cy, r: 15, m: 1, maki: 100, pole: 1, own: 0, vx: 0, vy: 0 }];
  t(A.mgFellIdx().length === 0, 'まん中に 置いた こまが 落ちた ことに なって いる');
  A.cur.pieces = [{ x: A.MG.cx + A.mgR() + 1, y: A.MG.cy, r: 15, m: 1, maki: 100, pole: 1, own: 0, vx: 0, vy: 0 }];
  t(A.mgFellIdx().length === 1, 'わくの 外に 出た こまが 落ちない');
  A.cur.pieces = [];
  for (let a = 0; a < 400; a++) {
    const r = A.mgSize(A.MG.minMaki + Math.random() * (A.MG.maxMaki - A.MG.minMaki));
    const th = Math.random() * 6.2832, rr = Math.sqrt(Math.random()) * (A.mgR() - r - 2);
    const x = A.MG.cx + Math.cos(th) * rr, y = A.MG.cy + Math.sin(th) * rr;
    if (!A.mgCanPut(x, y, r)) continue;
    A.cur.pieces = [{ x, y, r, m: 1, maki: 100, pole: 1, own: 0, vx: 0, vy: 0 }];
    if (A.mgFellIdx().length) { t(false, '置ける ところなのに 置いた しゅんかんに 落ちる'); break; }
  }
  /* 強い こまを ふちぎわに ならべると いちばん 外が おし出されて 落ちる
     （＝ わくの かべを とりのぞいた こと。前は かべで 止まって いた） */
  {
    const R = A.mgR(), rr = A.mgSize(A.MG.maxMaki), mm = A.mgForce(A.MG.maxMaki);
    const one = (d) => ({ x: A.MG.cx + d, y: A.MG.cy, r: rr, m: mm, maki: A.MG.maxMaki, pole: 1, own: 0, vx: 0, vy: 0 });
    A.cur.pieces = [one(R - rr - 2), one(R - rr - 62), one(R - rr - 122)];
    t(A.mgClusters().length === 0, 'この ならべ方は はじめから くっついて いる（テストの 置き方が わるい）');
    A.mgSim();
    t(A.mgFellIdx().length > 0, 'ふちぎわで おし合っても だれも 落ちない（かべが のこって いる？）');
    t(A.cur.pieces[0].x - A.MG.cx > R - rr - 2, 'いちばん 外の こまが 外がわへ おし出されて いない');
  }
  /* ⑤c 手もとの 見える化：100かい ＝ でんじしゃく 1こ ぶん */
  A.loadJishaku(mgG[0].stages[0]);
  t(A.mgStock(0) === A.mgNum(), '手もとの こ数が えらんだ 数と 合って いない');
  A.cur.hands[0] = A.MG.unit * 2 + 30; t(A.mgStock(0) === 2, `線 ${A.MG.unit * 2 + 30}かいは でんじしゃく 2こ ぶんの はず`);
  A.cur.hands[0] = A.MG.unit - 10;      t(A.mgStock(0) === 0, '1こ ぶんに とどかない のに 置ける ことに なって いる');
  A.cur.hands[0] = A.MG.maxMaki * 3; A.cur.turn = 0;
  t(A.mgLeftAt(A.MG.minMaki) > A.mgLeftAt(A.MG.maxMaki), 'たくさん 巻いても 置ける こ数が へらない');
  t(A.mgTrayCx(0) !== A.mgTrayCx(1), '2人の 手もとが 同じ ところに かさなって いる');
  t(A.mgSlot(0, 0).x < A.mgSlot(0, 3).x, '手もとの チップが よこに ならばない');
  t(A.mgSlot(0, 99).x <= A.mgSlot(0, A.MG.chipMax).x, '手もとの チップが トレイから はみ出す');

  /* ⑥ **えらべる せってい ぜんぶ**で ゲームに なって いるか
        （2026-08-26 から レベルは なく、あいての つよさ・こまの 数・わくの 大きさを 自分で えらぶ。
         2026-08-29 から まる・しかく・六角形の ステージも えらべる。
         だから 検査も 「3つの レベル」では なく 「えらべる くみあわせ」で 見る）
        極は サイコロ ＝ 運。50/50 で 走らせる */
  {
    const g = mgG[0], st = g.stages[0];
    A.cur.gameId = g.id; A.cur.si = 0;
    t(g.stages.length === 1, 'でんじしゃくバトルに レベル（もんだい）が のこって いる');
    t(!st.makis && !st.hand && !st.wire && !st.R, 'ステージに 古い makis／hand／wire／R が のこって いる');
    /* せっていの すじ */
    t(A.MGOPT.foe.length >= 2 && A.MGOPT.num.length >= 2 && A.MGOPT.ring.length >= 2, 'えらべる せっていが 少なすぎる');
    t(A.MGOPT.stage.length === 3, 'ステージが まる＋2しゅるいに なって いない');
    t(new Set(A.MGOPT.stage.map((o) => o.shape)).size === 3, 'ステージの 形が ちがう 3しゅるいに なって いない');
    for (let i = 1; i < A.MGOPT.foe.length; i++)
      t(A.MGOPT.foe[i].cpu > A.MGOPT.foe[i - 1].cpu, `あいての つよさ ${i} が 前より 強く ない`);
    for (let i = 1; i < A.MGOPT.num.length; i++)
      t(A.MGOPT.num[i] > A.MGOPT.num[i - 1], `でんじしゃくの 数 ${i} が 前より 多く ない`);
    for (let i = 1; i < A.MGOPT.ring.length; i++)
      t(A.MGOPT.ring[i].R < A.MGOPT.ring[i - 1].R, `わくの 大きさ ${i} が 前より せまく ない`);
    A.MGOPT.num.forEach((n, i) => {
      t(n * A.MG.unit >= A.MG.maxMaki * 2, `でんじしゃく ${n}こでは いちばん 強く 巻くと 2こも 置けない`);
      A.mgSet.num = i; A.loadJishaku(st);
      t(A.mgStock(0) === n, `${n}こ を えらんだのに 手もとが ${A.mgStock(0)}こ`);
    });
    A.MGOPT.ring.forEach((o, i) => {
      A.mgSet.ring = i;
      t(A.mgR() === o.R, 'えらんだ わくの 大きさが つかわれて いない');
      t(A.mgR() + 10 + 4 < A.MG.trayY, `わく R=${o.R} が 手もとトレイに かぶる`);
      t(A.mgR() - A.mgSize(A.MG.maxMaki) * 2 > 40, `わく R=${o.R} が せますぎて いちばん 大きい こまを 置けない`);
    });
    A.MGOPT.stage.forEach((o, i) => {
      A.mgSet.stage = i; A.cur.pieces = [];
      t(A.mgStage().shape === o.shape, `${o.t}を えらんでも 盤面の形が かわらない`);
      t(A.mgStageEdge(A.MG.cx, A.MG.cy) > 0, `${o.t}の まん中が ステージの外に なっている`);
      t(A.mgStageEdge(A.MG.cx + A.mgR() * 1.6, A.MG.cy) < 0, `${o.t}の はるか外が ステージの中に なっている`);
      for (let q = 0; q < 30; q++) {
        const r = A.mgSize(A.MG.maxMaki), p = A.mgRandomSpot(r);
        t(A.mgStageEdge(p.x, p.y) >= r + 4, `${o.t}の CPUが わくの外を えらんだ`);
      }
    });
    A.mgSet.num = 1; A.mgSet.ring = 1; A.mgSet.stage = 0;
    A.loadJishaku(st);
    t(!A.jishakuOK(), 'はじめから 勝ちに なって いる');
    A.cur.winner = 0; t(A.jishakuOK(), '勝っても クリアに ならない');
    A.cur.winner = 1; t(!A.jishakuOK(), '負けても クリアに なる');
    A.cur.winner = null;
    /* かしこい プレイヤー：極は サイコロ まかせ、まきかずと ばしょを さがす */
    const MKS = [0, 1, 2, 3, 4].map((q) => Math.round(A.MG.minMaki + (A.MG.maxMaki - A.MG.minMaki) * q / 4));
    const bestMove = (pole, wire) => {
      let best = null, bs = -1e9;
      for (const m0 of MKS) {
        const m = Math.min(m0, wire === undefined ? A.MG.maxMaki : wire);
        if (m < A.MG.minMaki) continue;
        const r = A.mgSize(m);
        for (let s2 = 0; s2 < 60; s2++) {
          const th = Math.random() * 6.2832, rr = Math.sqrt(Math.random()) * (A.mgR() - r - 4);
          const x = A.MG.cx + Math.cos(th) * rr, y = A.MG.cy + Math.sin(th) * rr;
          if (!A.mgCanPut(x, y, r)) continue;
          const room = A.mgClear(x, y, r, pole, A.mgForce(m));
          if (room < 0) continue;
          /* 線を つかいたい ＋ よゆうも ほしい ＋ ふちぎわは あぶない（落ちる） */
          const sc = m / 80 + Math.min(room, 40) * 0.12 + Math.min(A.mgEdge(x, y, r), 26) * 0.10;
          if (sc > bs) { bs = sc; best = { x, y, r, m, room }; }
        }
      }
      return best;
    };
    /* もどるのは「線の 長さ」。くっついた こま **と わくから 落ちた こま**の 両方 */
    const doMove = (mv, who, pole) => {
      A.cur.pieces.push({ x: mv.x, y: mv.y, r: mv.r, m: A.mgForce(mv.m), maki: Math.round(mv.m), pole, own: who, vx: 0, vy: 0 });
      if (!A.mgClusters().length) A.mgSim();
      const take = {};
      A.mgClusters().forEach((c) => c.forEach((k) => { take[k] = 1; }));
      A.mgFellIdx().forEach((k) => { take[k] = 1; });
      const ks = Object.keys(take).map(Number).sort((x, y) => y - x);
      let back = 0;
      ks.forEach((k) => { back += A.cur.pieces[k].maki; A.cur.pieces.splice(k, 1); });
      return back;
    };
    /* こまの 数 × わくの 大きさ の ぜんぶの くみあわせを 走らせる。
       どの くみあわせでも 「すんなり 置けすぎない」「一局が ちゃんと おわる」の 両がわを 見る */
    /* 何局 走らせるか。8局では へいきんが 17手〜55手も ぶれて、しきい値を またぐ
       「まぐれの ❌」の もとに なって いた。60局に すると へいきんは 28手〜41手に
       おちつく（2026-08-27 に たね20とおりで 実そく）。たねは 固定なので 数は 毎回 同じ。 */
    const GAMES_N = 60;      /* 一局の 長さを はかる 局数 */
    const FIRST_N = 40;      /* さいしょの 事こまでを はかる 局数 */
    A.MGOPT.num.forEach((num, ni) => {
      A.MGOPT.ring.forEach((ring, ri) => {
        A.mgSet.num = ni; A.mgSet.ring = ri;
        /* くみあわせ ごとに たねを もどす。こうして おくと、よそを 直しても
           ここの 数だけは かわらない（前の 章が 乱数を 何回 つかったかに 左右されない） */
        reseed(SEED + ni * 1000 + ri * 37);
        const wire = num * A.MG.unit;
        const tag = `でんじしゃく ${num}こ × わく ${ring.t}`;
        const firstAcc = [];
        for (let g2 = 0; g2 < FIRST_N; g2++) {
          A.cur.pieces = [];
          let n = 0;
          for (; n < 30; n++) {
            const pole = (Math.random() < 0.5) ? 1 : -1;      /* サイコロ */
            const mv = bestMove(pole);
            if (!mv) break;
            if (doMove(mv, n % 2, pole) > 0) break;
          }
          firstAcc.push(n);
        }
        const avgFirst = firstAcc.reduce((x, y) => x + y, 0) / firstAcc.length;
        const lens = [];
        let unfinished = 0;
        for (let gm = 0; gm < GAMES_N; gm++) {
          let turns = 0, hands = [wire, wire], winner = null;
          A.cur.pieces = [];
          while (turns < 400 && winner === null) {
            const who = turns % 2;
            const pole = (Math.random() < 0.5) ? 1 : -1;
            const mv = bestMove(pole, hands[who]);
            if (!mv) { winner = 1 - who; break; }
            hands[who] -= Math.round(mv.m);
            hands[who] += doMove(mv, who, pole);
            if (hands[who] <= 0) winner = who;
            turns++;
          }
          if (winner === null) unfinished++;      /* 400手 まわしても 勝ちが つかない ＝ おわらない */
          lens.push(turns);
        }
        const sorted = lens.slice().sort((x, y) => x - y);
        const turns = Math.round(lens.reduce((x, y) => x + y, 0) / lens.length);
        const p90 = sorted[Math.floor(sorted.length * 0.9)];      /* 長い ほうから 1わり めの 一局 */
        const worst = sorted[sorted.length - 1];
        console.log(`  ・${tag} → さいしょの 事こまで へいきん ${avgFirst.toFixed(1)}こ ／ 一局 へいきん ${turns}手（長い ほうの 1わり ${p90}手・さいあく ${worst}手）`);
        /* 「さいあく（最大）」では 見ない。最大は 局数を ふやすほど 大きく なるし、
           まれな 1局に ぜんぶ 引っぱられる ので、たねを かえると 91手〜223手も ぶれる。
           かわりに 「長い ほうから 1わり めの 一局」（p90）で しっぽを 見る。こちらは
           57手〜101手に おさまり、ゲームが 長びいたら ちゃんと 上がる。
           「おわらない」は 別だてで ぜんぶの 局を 見る（1局でも 400手 こえたら ❌）。 */
        t(unfinished === 0, `${tag} は ${unfinished}局が おわらない（きつすぎて せめぎ合いが つづく）`);
        t(turns <= 70, `${tag} は 一局 へいきん ${turns}手 ＝ 長すぎる（子どもが あきる）`);
        t(p90 <= 130, `${tag} は 長い ほうの 1わりが ${p90}手 ＝ 長すぎる`);
        t(avgFirst <= 14, `${tag} は ${avgFirst.toFixed(1)}こも すんなり 置ける ＝ 手ごたえが ない`);
        t(avgFirst >= 2.2, `${tag} は ${avgFirst.toFixed(1)}こで 事こ ＝ きつすぎる`);
      });
    });
    A.mgSet.num = 1; A.mgSet.ring = 1; A.mgSet.stage = 0;
    /* ⑦ 置いた あとに 出す「じりょくの はんい」の え */
    A.loadJishaku(st);
    const big = { x: A.MG.cx, y: A.MG.cy, r: A.mgSize(A.MG.maxMaki), m: A.mgForce(A.MG.maxMaki), maki: A.MG.maxMaki, pole: 1, own: 0, vx: 0, vy: 0 };
    const small = { r: A.mgSize(A.MG.minMaki), m: A.mgForce(A.MG.minMaki) };
    t(A.mgFieldR(big) > A.mgFieldR(small), '強く 巻いても じりょくの はんいの えが 大きく ならない');
    t(A.mgFieldR(big) < A.mgReach(big, big), 'はんいの えが ほんとうの とどく きょりより 大きい（うそに なる）');
    A.cur.pieces = [
      { x: A.MG.cx - 40, y: A.MG.cy, r: small.r, m: small.m, maki: A.MG.minMaki, pole: -1, own: 1, vx: 0, vy: 0 },
      { x: A.MG.cx + A.mgR() * 0.92, y: A.MG.cy, r: small.r, m: small.m, maki: A.MG.minMaki, pole: 1, own: 1, vx: 0, vy: 0 },
      big,
    ];
    const fld = A.mgMakeField(2);
    t(fld.pairs.length === 1 && fld.pairs[0].j === 0, 'じりょくが はたらいた こまを 正しく 見つけられない（遠い こまを 入れて いる？）');
    t(fld.pairs[0].same === false, 'N と S を 同じ極 あつかいして いる');
  }
}

/* ================================================================== *
 * 5. じっけん型（じょうけん制御）— ルールで 判定して いるか
 *    じっけん型の ミニゲーム ぜんぶを 見る（あたらしい じっけんを 足したら
 *    ここは 何も 書かなくても かかる）
 * ================================================================== */
head('じっけん型 — 「かえるのは 1つだけ」を 正しく 見て いるか');
{
  const jkGames = A.GAMES.filter((g) => !g.soon && (g.stages || []).some((st) => (st.kind || g.kind) === 'jikken'));
  t(jkGames.length >= 2, `じっけん型の ミニゲームが 2つ ない（${jkGames.length}）`);
  jkGames.forEach((g) => {
    A.cur.gameId = g.id;
    g.stages.forEach((st, si) => {
      const tag = `${g.id} だい${si + 1}もん`;
      A.cur.si = si;
      /* --- データの すじ（ここが ちがうと ばんめんが 出ない） --- */
      t(!!A.SIMS[st.sim], `${tag} の sim "${st.sim}" が SIMS に ない`);
      t(Array.isArray(st.vars) && st.vars.length >= 2, `${tag} に vars が ない`);
      if (!A.SIMS[st.sim] || !Array.isArray(st.vars)) return;
      const tv = st.vars.filter((v) => v.id === st.target)[0];
      t(!!tv, `${tag} の target "${st.target}" が vars の中に ない`);
      if (!tv) return;
      t(tv.values.length >= 2, `${tag} の しらべたい じょうけんが 1つしか えらべない（くらべられない）`);
      A.loadJikken(st);
      const last = (v) => v.values.length - 1;
      const others = st.vars.filter((v) => v.id !== st.target && v.values.length >= 2);
      const set = (pick) => {
        A.cur.exp = { A: {}, B: {} };
        st.vars.forEach((v) => { const r = pick(v); A.cur.exp.A[v.id] = r.a; A.cur.exp.B[v.id] = r.b; });
      };
      /* せいかい：しらべたい ものだけ ちがう */
      set((v) => ({ a: 0, b: v.id === st.target ? last(v) : 0 }));
      t(A.jikkenFair(), `${tag} 正しい くみ立てが 通らない`);
      /* A と B が ぎゃくでも せいかい */
      set((v) => ({ a: last(v), b: v.id === st.target ? 0 : last(v) }));
      t(A.jikkenFair(), `${tag} A/B ぎゃくの 別解が 通らない`);
      /* ぜんぶ 同じ → だめ */
      set(() => ({ a: 0, b: 0 }));
      t(!A.jikkenFair(), `${tag} ぜんぶ 同じでも 通って しまう`);
      /* しらべたい もの いがいも ちがう → だめ */
      if (others.length) {
        set((v) => ({ a: 0, b: last(v) }));
        t(!A.jikkenFair(), `${tag} ぜんぶ ちがっても 通って しまう`);
        set((v) => ({ a: 0, b: (v.id === st.target || v.id === others[0].id) ? last(v) : 0 }));
        t(!A.jikkenFair(), `${tag} 2つ ちがっても 通って しまう`);
      }
      /* えらび のこし → だめ */
      A.cur.exp = { A: {}, B: {} };
      A.cur.exp.A[st.target] = 0; A.cur.exp.B[st.target] = last(tv);
      t(others.length === 0 || !A.jikkenFair(), `${tag} えらび のこしでも 通って しまう`);
      /* じっけんを 走らせる まえは クリアに ならない（正しく くみ立てても） */
      A.loadJikken(st);
      set((v) => ({ a: 0, b: v.id === st.target ? last(v) : 0 }));
      A.cur.phase = 'set';
      t(!A.jikkenOK(), `${tag} 走らせる まえに クリアに なって しまう`);
      A.cur.phase = 'done';
      t(A.jikkenOK(), `${tag} 走らせても クリアに ならない`);
      /* けっかの こうひょうが「よく できました」に なるか */
      const iA = A.jkInfo('A'), iB = A.jkInfo('B');
      const vd = A.jkVerdict(iA, iB);
      t(vd.good === true, `${tag} 正しく くみ立てたのに けっかが good で ない`);
      t(vd.lines.length === 3 && vd.lines.every((l) => typeof l === 'string' && l.length), `${tag} けっかの 文が そろって いない`);
      t(iA.total > 0 && iB.total > 0 && isFinite(iA.total) && isFinite(iB.total), `${tag} アニメの 長さが おかしい`);
      /* え と 数字が エラーなく かけるか（ここで こけると まっ白に なる） */
      const sim = A.SIMS[st.sim];
      let drawOK = true, why = '';
      try {
        ['A', 'B'].forEach((sd) => {
          const inf = (sd === 'A') ? iA : iB;
          [0, inf.total * 0.5, inf.total].forEach((tt) => {
            const svg = sim.art(sd, sd === 'A' ? 170 : 430, inf.v, inf, tt, false);
            if (typeof svg !== 'string' || !svg.length) drawOK = false;
            const ro = sim.readout(inf, tt);
            if (typeof ro.top !== 'string' || typeof ro.bottom !== 'string') drawOK = false;
          });
          const svg2 = sim.art(sd, 170, inf.v, inf, inf.total, true);
          if (typeof svg2 !== 'string') drawOK = false;
        });
      } catch (e) { drawOK = false; why = e.message; }
      t(drawOK, `${tag} の え／数字が かけない ${why}`);
    });
  });
}

/* ={10}======================================================== *
 * 5c. あたらしい じっけんの 中みが 理科として 正しいか
 *     ここが ちがうと、子どもが 見る「けっか」が うそに なる。
 * ================================================================== */
head('でんじしゃくの つよさ — まきかず と でんりゅう で きまるか');
{
  const n = (maki, denchi, shin) => A.SIMS.jishaku.measure({ maki, denchi, shin });
  t(n(100, 1, 'tetsu') === 5, `100かい・でんち1こ が 5こで ない（${n(100, 1, 'tetsu')}）`);
  t(n(200, 1, 'tetsu') === n(100, 1, 'tetsu') * 2, 'まきかずを 2ばいに しても 2ばいに ならない');
  t(n(100, 2, 'tetsu') === n(100, 1, 'tetsu') * 2, 'でんちを 2こに しても 2ばいに ならない');
  t(n(200, 2, 'tetsu') === 20, `まきかず・でんち 両方 2ばいで 4ばいに ならない（${n(200, 2, 'tetsu')}）`);
  [100, 200].forEach((m) => [1, 2].forEach((d) => {
    t(n(m, d, 'alumi') === 0, `アルミしんなのに クリップが ついて しまう（${m}かい・${d}こ）`);
  }));
}

head('もののとけ方 — 水の りょうに ひれい・おん度の きき方は ものに よる');
{
  const g = (mono, mizu, ondo) => A.SIMS.tokekata.measure({ mono, mizu, ondo });
  /* 水の りょうに ひれい（どの もの・どの おん度でも ちょうど 2ばい） */
  ['shio', 'myoban'].forEach((mono) => [20, 60].forEach((ondo) => {
    t(g(mono, 100, ondo) === g(mono, 50, ondo) * 2, `${mono} ${ondo}ど：水2ばいで とける りょうが 2ばいに ならない`);
  }));
  /* 食塩は おん度で ほとんど かわらない（ごさの はんい＝eps 2g いない） */
  const shioSa = g('shio', 50, 60) - g('shio', 50, 20);
  t(shioSa >= 0 && shioSa <= A.SIMS.tokekata.eps, `食塩が おん度で 大きく かわって しまう（＋${shioSa}g）`);
  /* ミョウバンは おん度で ぐんと ふえる */
  const myoSa = g('myoban', 50, 60) - g('myoban', 50, 20);
  t(myoSa > A.SIMS.tokekata.eps * 5, `ミョウバンが おん度で ふえない（＋${myoSa}g）`);
  t(g('myoban', 50, 60) > g('myoban', 50, 20) * 4, 'ミョウバンが 60どで 4ばい いじょうに ならない');
  /* 20どでは ミョウバンより 食塩の ほうが たくさん とける（じっさいの ようかい度どおり） */
  t(g('shio', 50, 20) > g('myoban', 50, 20), '20どで 食塩より ミョウバンが とけて しまう');
  console.log(`  ・食塩 50mL 20ど=${g('shio', 50, 20)}g 60ど=${g('shio', 50, 60)}g ／ ミョウバン 20ど=${g('myoban', 50, 20)}g 60ど=${g('myoban', 50, 60)}g`);
}

head('じっけんの けっかの ことば — 「かわった／ほとんど かわらない」を 分けて いるか');
{
  /* とけ方の じっけん（ごさ eps=2g）で ことばの 分かれ方を 見る */
  const say = (va, vb) => {
    A.cur.gameId = 'particle-tokekata'; A.cur.si = 0;
    const st = A.gameById('particle-tokekata').stages[0];
    A.loadJikken(st);
    st.vars.forEach((v) => { A.cur.exp.A[v.id] = 0; A.cur.exp.B[v.id] = (v.id === st.target) ? 1 : 0; });
    return A.jkVerdict({ val: va, T: va, total: va }, { val: vb, T: vb, total: vb }).lines[1];
  };
  t(/ぴったり|かわらなかった/.test(say(20, 20)), 'ぴったり 同じ ときに 「かわらなかった」と 言わない');
  t(/ほとんど かわらなかった/.test(say(18, 19)), 'ごさの はんいを 「ほとんど かわらなかった」と 言わない');
  t(/かわった/.test(say(6, 29)) && !/ほとんど/.test(say(6, 29)), 'はっきり ちがう ときに 「かわった」と 言わない');
}

/* ================================================================== *
 * 6. みつける型 — あたりが かさなって いないか（みつける型 ぜんぶ）
 * ================================================================== */
head('みつける型 — あたりの まるが かさなって いないか（まちがい タップの もと）');
{
  const mkGames = A.GAMES.filter((g) => !g.soon && (g.stages || []).some((st) => (st.kind || g.kind) === 'mitsukeru'));
  t(mkGames.length >= 1, `みつける型の ミニゲームが ない`);
  mkGames.forEach((g) => {
    A.cur.gameId = g.id;
    g.stages.forEach((st, si) => {
      A.cur.si = si;
      const tag = `${g.id} だい${si + 1}もん`;
      t(Array.isArray(st.targets) && st.targets.length > 0, `${tag} に targets が ない`);
      if (!Array.isArray(st.targets)) return;
      /* 図が とうろく されて いるか（ここが ちがうと えが 出ない） */
      const art = A.ARTS[st.art || 'karada'];
      t(typeof art === 'function', `${tag} の 図 "${st.art || 'karada'}" が ARTS に ない`);
      if (typeof art === 'function') t(typeof art() === 'string' && art().length > 0, `${tag} の 図が かけない`);
      /* しつもんの こたえが 図の 上に あるか（＋SVGで こわれる タグが 入って いないか） */
      st.asks.forEach((ask, ai) => {
        t(ask.q.indexOf('<') < 0, `${tag} の しつもん${ai + 1} に タグが 入って いる（SVGの text では 文が 切れる）`);
        t(st.targets.filter((x) => x.id === ask.t).length > 0, `${tag} の しつもん${ai + 1} の あたり "${ask.t}" が ない`);
      });
      /* 同じ ところを 2回 きいて いないか（あてた あたりは 消えるので こたえられなく なる） */
      const ids = st.asks.map((a) => a.t);
      t(new Set(ids).size === ids.length, `${tag} で 同じ ところを 2回 きいて いる（あてると 消えるので つまる）`);
      /* あたりの まるが かさなって いないか */
      const all = [];
      st.targets.forEach((tg) => tg.hits.forEach((h) => all.push({ id: tg.id, h })));
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i].h, b = all[j].h;
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        t(d >= a[2] + b[2], `${tag}：${all[i].id} と ${all[j].id} の あたりが かさなって いる（きょり${d.toFixed(0)} < ${a[2] + b[2]}）`);
      }
      /* あたりが ばんの 外に はみ出して いないか */
      const H = st.boardH || 476;
      all.forEach((x) => {
        t(x.h[0] - x.h[2] >= 0 && x.h[0] + x.h[2] <= 600 && x.h[1] - x.h[2] >= 0 && x.h[1] + x.h[2] <= H,
          `${tag}：${x.id} の あたりが ばんの 外に 出て いる`);
      });
      /* じゅんに こたえると クリアに なる */
      A.loadMitsukeru(st);
      st.asks.forEach((ask) => { A.cur.found.push(ask.t); A.cur.qi++; });
      t(A.cur.qi === st.asks.length, `${tag} ぜんぶ こたえても おわらない`);
    });
  });
}

/* ================================================================== *
 * 6b. すいり型（水よう液の 正体あて）
 *
 *   いちばん 大事なのは「その 道具立てで **ほんとうに 見分けられるか**」。
 *   ここでは かしこい 子の しらべ方（毎回いちばん しぼれる 道具を えらぶ）を
 *   シミュレートして、**最悪でも 何回で 確定するか** を 出す。
 *   これが ★の 目標回数（target）を こえて いたら、その ★は 取れない ＝ 設計ミス。
 * ================================================================== */
head('すいり型（水よう液）— その 道具で ほんとうに 見分けられるか');
{
  const suGames = A.GAMES.filter((g) => !g.soon && (g.stages || []).some((st) => (st.kind || g.kind) === 'suiri'));
  t(suGames.length >= 1, 'すいり型の ミニゲームが ない');
  const eki = (id) => A.SUI_EKI.filter((e) => e.id === id)[0];
  const tool = (id) => A.SUI_TOOLS.filter((x) => x.id === id)[0];

  suGames.forEach((g) => {
    A.cur.gameId = g.id;
    g.stages.forEach((st, si) => {
      const tag = `${g.id} だい${si + 1}もん`;
      A.cur.si = si;
      t(Array.isArray(st.ekis) && st.ekis.length >= 3, `${tag} の ekis が すくない`);
      t(Array.isArray(st.tools) && st.tools.length >= 1, `${tag} に tools が ない`);
      st.ekis.forEach((id) => t(!!eki(id), `${tag} の えき "${id}" が SUI_EKI に ない`));
      st.tools.forEach((id) => t(!!tool(id), `${tag} の 道具 "${id}" が SUI_TOOLS に ない`));
      if (st.ekis.some((id) => !eki(id)) || st.tools.some((id) => !tool(id))) return;
      const N = st.ekis.length;

      /* --- ① その 道具立てで 6本が ぜんぶ ちがう 見え方に なるか --- */
      const sig = (id) => [eki(id).awa ? 'A' : '-'].concat(st.tools.map((tid) => tool(tid).read(eki(id)).t)).join('|');
      const sigs = st.ekis.map(sig);
      t(new Set(sigs).size === N, `${tag} の 道具立てでは 見分けられない えきが ある（${sigs.join(' / ')}）`);

      /* --- ② read / full が こわれて いないか --- */
      let ok2 = true, why = '';
      try {
        st.ekis.forEach((id) => st.tools.forEach((tid) => {
          const r = tool(tid).read(eki(id));
          if (!r || typeof r.t !== 'string' || !r.t.length || typeof r.c !== 'string') ok2 = false;
          if (typeof tool(tid).full(eki(id)) !== 'string') ok2 = false;
          if (r.t.length > 8) ok2 = false;             /* メモらんに 入らない */
        }));
      } catch (e) { ok2 = false; why = e.message; }
      t(ok2, `${tag} の 道具の けっかが おかしい ${why}`);

      /* --- ③ かしこい 子の 手数（最悪ケース）を シミュレート --- */
      const perms = [];
      const rec = (rest, acc) => {
        if (!rest.length) { perms.push(acc.slice()); return; }
        rest.forEach((x, i) => { acc.push(x); rec(rest.filter((_, j) => j !== i), acc); acc.pop(); });
      };
      rec(st.ekis, []);
      /* あわは 道具を つかわなくても 見える ＝ 最初から 分かって いる 手がかり */
      const awaKey = (p) => p.map((id) => (eki(id).awa ? '1' : '0')).join('');
      /* かしこい 子の しらべ方＝「いちばん 大きな グループが 小さく なる 道具」を えらぶ（貪欲）。
         その うえで **いちばん 運の わるい 枝**を たどって 手数を かぞえる。
         ぜんとおり しらべる（minimax）と 組み合わせが ばくはつ するので、この やり方で 上ばうんどを 出す。 */
      const worst = (cands, used) => {
        if (cands.length <= 1) return 0;
        let bestKey = null, bestMax = Infinity, bestGroups = null;
        for (let b = 0; b < N; b++) for (const tid of st.tools) {
          const key = b + ':' + tid;
          if (used[key]) continue;
          const groups = {};
          cands.forEach((p) => {
            const k = tool(tid).read(eki(p[b])).t;
            (groups[k] = groups[k] || []).push(p);
          });
          const ks = Object.keys(groups);
          if (ks.length < 2) continue;                 /* 何も しぼれない しらべ方は とばす */
          let mx = 0;
          ks.forEach((k) => { mx = Math.max(mx, groups[k].length); });
          if (mx < bestMax) { bestMax = mx; bestKey = key; bestGroups = groups; }
        }
        if (!bestKey) return 99;                       /* もう しぼれない ＝ 見分けられない */
        used[bestKey] = 1;
        let d = 0;
        Object.keys(bestGroups).forEach((k) => { d = Math.max(d, worst(bestGroups[k], used)); });
        used[bestKey] = 0;
        return 1 + d;
      };
      const start = perms.filter((p) => awaKey(p) === awaKey(st.ekis));
      const need = worst(start, {});
      t(need < 99, `${tag} は どう しらべても 正体が 決まらない`);
      t(need <= st.target, `${tag} の ★目標 ${st.target}回では たりない（最悪 ${need}回 いる）`);
      console.log(`  ・${tag} ${N}本／道具${st.tools.length}こ → かしこく しらべても 最悪 ${need}回（★目標 ${st.target}回）`);

      /* --- ④ あそびの すじ（クリア判定） --- */
      A.loadSuiri(st);
      t(A.cur.slots.length === N && A.cur.slots.slice().sort().join() === st.ekis.slice().sort().join(),
        `${tag} びんの 中みが そろって いない`);
      t(!A.suiriOK(), `${tag} なふだを つける まえに クリアに なる`);
      A.cur.solved = true;
      t(A.suiriOK(), `${tag} こたえあわせに 通っても クリアに ならない`);
      A.cur.solved = false;
    });
  });
}

/* ================================================================== *
 * 7. 月の え — 光る がわが 正しいか（右が光る／左が光る）
 * ================================================================== */
head('月の え — みちる ときは みぎ、かける ときは ひだりが 光るか');
{
  /* moonPath の 1つ目の こは まるい ふち。sweep=1 なら みぎ半分、0 なら ひだり半分。 */
  const sweepOf = (p) => A.moonPath(p, 40).match(/A40,40 0 0,(\d)/)[1];
  t(sweepOf(0.125) === '1', '三日月が みぎ光りに なって いない');
  t(sweepOf(0.25) === '1', '上げんの月が みぎ光りに なって いない');
  t(sweepOf(0.75) === '0', '下げんの月が ひだり光りに なって いない');
  t(sweepOf(0.875) === '0', 'ほそい月が ひだり光りに なって いない');
  /* 上げん・下げん は さかいめが まっすぐ（よこ半径 0） */
  t(/A0\.00,40/.test(A.moonPath(0.25, 40)), '上げんの さかいめが まっすぐで ない');
  t(/A0\.00,40/.test(A.moonPath(0.75, 40)), '下げんの さかいめが まっすぐで ない');
}

/* ================================================================== *
 * 9. かいた SVG が こわれて いないか
 *    マイナスの 数を 文字の '-' と つないで "--24" に なると、その path は
 *    ブラウザに すてられて **えの 一部が 消える**（コンソールを 見ないと 気づけない）。
 *    NaN・undefined も 同じ。ぜんぶの えを 1回 かいて 文字れつを しらべる。
 * ================================================================== */
head('SVGの え — こわれた 数字（-- や NaN）が 入って いないか');
{
  const check = (name, str) => {
    if (typeof str !== 'string') { t(false, `${name} が 文字れつを かえさない`); return; }
    t(!/--/.test(str), `${name} に "--"（マイナスの 二重）が ある ＝ その path は かかれない`);
    t(!/NaN|undefined|Infinity/.test(str), `${name} に NaN／undefined が ある`);
  };
  Object.keys(A.ARTS).forEach((k) => check(`ARTS.${k}`, A.ARTS[k]()));
  [0, 1, 2, 3, 4].forEach((st) => [0, 0.5, 1].forEach((k) => check(`plantArt(${st},${k})`, A.plantArt(st, k))));
  ['closed', 'top', 'both', 'empty', 'out'].forEach((m) => check(`jarArt(${m})`, A.jarArt(m, 24)));
  ['kugi', 'spana', 'ita', 'katamari', 'kan', 'haku'].forEach((k) => check(`craneArt(${k})`, A.craneArt(k)));
  [0, 0.35, 0.7, 1].forEach((p) => { check(`skyArt(${p})`, A.skyArt(p, '', 26)); check(`skyArt(${p},t)`, A.skyArt(p, 't', 26)); });
  Object.keys(A.OBJ_ART).forEach((k) => {
    if (k === 'sou') ['reki', 'suna', 'doro', 'kazan'].forEach((v) => check(`OBJ_ART.sou(${v})`, A.OBJ_ART.sou(20, v)));
    else if (k === 'tamago') [0, 35, 60, 90].forEach((v) => check(`OBJ_ART.tamago(${v})`, A.OBJ_ART.tamago(20, v)));
    else check(`OBJ_ART.${k}`, A.OBJ_ART[k](20));
  });
  /* カードの え（itemArt ごしに つかう ぜんぶの art 文字れつ） */
  const arts = [];
  A.GAMES.forEach((g) => (g.stages || []).forEach((st) => {
    (st.items || []).forEach((it) => { if (it.art) arts.push(it.art); });
    (st.nodes || []).forEach((nd) => { if (nd.art) arts.push(nd.art); });
    (st.before || []).forEach((b) => { if (b.art) arts.push(b.art); });
    if (st.after && st.after.art) arts.push(st.after.art);
  }));
  Array.from(new Set(arts)).forEach((a) => {
    const svg = A.itemArt(a, 26);
    t(typeof svg === 'string' && svg.length > 0, `カードの え "${a}" が かけない（つづりちがい？）`);
    check(`itemArt("${a}")`, svg);
  });
  console.log(`  ・カードの え ${new Set(arts).size} しゅるいを たしかめた`);
}

/* ================================================================== *
 * 7b. ふりこアクション（swing）— お手本で ほんとうに ゴールできるか
 *     画面なしで 同じ 物理を 走らせて たしかめる（時間きざみが 一定なので 同じ けっかに なる）。
 * ================================================================== */
head('ふりこアクション型 — お手本で ゴールできるか・3つの ボールが いるか');
{
  /* **えらびボタンは SVGでは なく HTMLの <button> で 出す**（2026-08-29）。
     SVGの とうめいな あたり判定は ブラウザに よって きかず、Safari で
     「100gを おしても かわらない」が じっさいに 起きた。ここが SVG に もどって いないかを 見はる。 */
  const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
  t(html.indexOf('id="sw-pick"') >= 0, 'えらびボタンの いれもの（#sw-pick）が HTMLに ない');
  t(/<button class="sw-b/.test(html), 'えらびボタンが HTMLの <button> で 作られて いない');
  t(!/bt \+= '<rect[^']*data-sww/.test(html), 'えらびボタンが SVGの とうめい あたり判定に もどって いる');
  /* **えらびボタンを 毎フレーム 作りなおして いないか。**
     アニメは 1びょうに 60回 えを かきなおす。その たびに ボタンの HTMLを 入れかえると、
     ゆびを はなす まえに ボタンが 消えて **click が 一度も 成立しない**
     （2026-08-29 「100gを おしても かわらない」の 正体）。
     中みが かわった ときだけ 入れかえる ガードが 入って いるかを 見はる。 */
  t(/if \(cur\.swPickHtml !== ph\)\{ pk\.innerHTML = ph;/.test(html),
    'えらびボタンを 毎フレーム 作りなおして いる（swPickHtml の ガードが ない）');
  t(/cur\.swPickHtml = null;/.test(html), 'もんだいを 読みこむ ときに swPickHtml を からに して いない');
  /* **ゆびを はなしただけで ロープが 切れる 方式に もどって いないか。**
     まえは「300ms いじょう おして はなすと 飛ぶ」も 生かして いたので、
     ばんめんを 少し 長めに おしただけで 糸が 切れ、ぶら下がった まま おもさを
     かえる ことが できなかった（2026-08-29 実プレイの 指てき）。 */
  t(html.indexOf('function upSwing') < 0, 'ゆびを はなした ときの しょり（upSwing）が 復活して いる');
  /* とうろく行を まるごと 文字で くらべると、stop（がめんを 出る ときの しまい方）などを
     足しただけで ❌ に なる。見はりたいのは「up が 復活して いないか」だけ なので そこを 見る。 */
  const swReg = (html.match(/ENGINES\.swing = \{[^}]*\}/) || [''])[0];
  t(/load:loadSwing/.test(swReg) && /render:renderSwing/.test(swReg) &&
    /tap:tapSwing/.test(swReg) && /down:downSwing/.test(swReg) && !/\bup\s*:/.test(swReg),
    'ふりこの エンジンに up（はなした ときの しょり）が ついて いる ＝ タップ式で なくなって いる');
  t(html.indexOf('SW_TAP') < 0, 'おしっぱなし判定（SW_TAP）が のこって いる');
  /* しっぱいしても えらんだ おもさ・大きさを のこして いるか */
  t(/cur\.sw = swingInit\(curStage\(\), cur\.swKeep\)/.test(html),
    'しっぱいして やりなおす とき、えらんだ おもさが もどって しまう');
  t(/cur\.swKeep = \{ w:cur\.sw\.w, r:cur\.sw\.r, lk:cur\.sw\.lk \}/.test(html),
    'えらんだ おもさ・大きさ・ひもの ながさを おぼえて いない');

  const sg = A.GAMES.filter((g) => !g.soon && (g.stages || []).some((st) => (st.kind || g.kind) === 'swing'));
  t(sg.length >= 1, 'ふりこアクションの ミニゲームが ない');
  sg.forEach((g) => {
    let needSwap = 0;
    g.stages.forEach((st, i) => {
      const tag = `${g.id} だい${i + 1}もん`;
      t(!!st.t && !!st.h && !!st.learn, `${tag} に t / h / learn が そろって いない`);
      t(!!st.start && !!st.goal && (st.hooks || []).length > 0, `${tag} に start / goal / hooks が そろって いない`);
      t(Array.isArray(st.ex) && st.ex.length > 0, `${tag} に ex（お手本）が ない`);
      t(A.swW(st).indexOf(st.w0) >= 0, `${tag} の はじめの おもさが えらべる ものに ない`);
      t(A.swR(st).indexOf(st.r0) >= 0, `${tag} の はじめの 大きさが えらべる ものに ない`);
      A.swW(st).forEach((w) => t(!!A.SWW[w], `${tag} に 用意して いない おもさ（${w}g）が ある`));
      /* **さいしょは フックに ぶら下がった じょうたいで とまって いる**こと。
         とまって いないと「かってに 落ちる」に もどって しまう（2026-08-29 の 指てき）。 */
      const s0 = A.swingInit(st);
      t(!!s0.hook, `${tag} は スタートの ところから フックに とどかない（はじめから ぶら下がれない）`);
      t(s0.started === false, `${tag} が おす まえから うごきだして いる`);
      /* **ぶら下がって いる あいだは おもさ・大きさを かえられる**こと。
         かえられないと「おもさを かえないと 解けない」面が じっさいには クリアできない
         （2026-08-29 ユーザーの 指てきで 足した）。 */
      /* **スタート前（まだ うごきだして いない）に かならず えらべる**こと。
         フックに とどいて いなくても えらべる ―― ここが きかないと
         「はじめに おもさを えらぶ」が できない（2026-08-29 ユーザーの 指てき）。 */
      const sb = A.swingInit(st); sb.hook = null;
      const ow = A.swW(st).filter((w) => w !== sb.w)[0];
      if (ow !== undefined) t(A.swingSetW(st, sb, ow) === true, `${tag} は スタート前に おもさを えらべない`);
      const or0 = A.swR(st).filter((r) => r !== sb.r)[0];
      if (or0 !== undefined) t(A.swingSetR(st, sb, or0) === true, `${tag} は スタート前に 大きさを えらべない`);
      const sw0 = A.swingInit(st);
      const other = A.swW(st).filter((w) => w !== sw0.w)[0];
      if (other !== undefined){
        t(A.swingSetW(st, sw0, other) === true, `${tag} は ぶら下がって いるのに おもさを かえられない`);
      }
      const or2 = A.swR(st).filter((r) => r !== sw0.r)[0];
      if (or2 !== undefined){
        t(A.swingSetR(st, sw0, or2) === true, `${tag} は ぶら下がって いるのに 大きさを かえられない`);
      }
      sw0.hook = null; sw0.started = true;               /* **ひもの ながさで しゅうきが かわり、おもさ・大きさでは かわらない**
         ―― 5年「ふりこのきまり」そのもの。ここが くずれたら 理科として うそに なる。 */
      {
        const per = (lk, w, r) => {
          const s2 = A.swingInit(st, { w, r, lk }); s2.started = true;
          if (!s2.hook) return null;
          let last = s2.hook.th, t0 = null, T = null;
          for (let n = 0; n < 3000; n++) {
            A.swingStep(st, s2, 1 / 120);
            if (last < 0 && s2.hook.th >= 0) { if (t0 === null) t0 = s2.t; else { T = s2.t - t0; break; } }
            last = s2.hook.th;
          }
          return T;
        };
        const base = per('normal', 50, 12);
        if (base) {
          t(Math.abs(per('normal', 100, 18) - base) < 1e-6, `${tag} おもさ・大きさを かえると しゅうきが かわって しまう`);
          t(Math.abs(per('normal', 10, 6) - base) < 1e-6, `${tag} おもさ・大きさを かえると しゅうきが かわって しまう`);
          const sh = per('short', 50, 12);
          if (sh && A.swingInit(st, { lk: 'short' }).hook.L < A.swingInit(st, { lk: 'normal' }).hook.L)
            t(sh < base - 1e-6, `${tag} ひもを みじかく しても はやく ゆれない`);
        }
      }
      /* うごきだした あとの 空中では かえられない */
      const w3 = A.swW(st).filter((w) => w !== sw0.w)[0];
      if (w3 !== undefined) t(A.swingSetW(st, sw0, w3) === false, `${tag} は 空中でも おもさを かえられて しまう`);
      const s1 = A.swingInit(st);
      for (let n = 0; n < 240; n++) A.swingStep(st, s1, 1 / 120);
      t(Math.abs(s1.x - s0.x) < 0.001 && Math.abs(s1.y - s0.y) < 0.001,
        `${tag} は おして いないのに ボールが うごいて しまう`);
      /* ばんめん（600x400）から はみ出して いないか */
      const inBox = (x, y) => x >= 0 && x <= 600 && y >= 0 && y <= 400;
      t(inBox(st.start.x, st.start.y), `${tag} の スタートが ばんめんの そと`);
      t(inBox(st.goal.x, st.goal.y), `${tag} の ゴールが ばんめんの そと`);
      (st.hooks || []).forEach((h, k) => t(inBox(h.x, h.y), `${tag} の フック${k + 1}が ばんめんの そと`));
      /* フックが とげ／ブロックに うまって いないか。
         うまって いると「つかまったら いきなり しっぱい」に なり、子どもには わけが 分からない
         （2026-08-28 の 実きで じっさいに とげの 中に フックが あった）。 */
      (st.hooks || []).forEach((h, k) => {
        ((st.spikes || []).concat(st.blocks || [])).forEach((o) => {
          const m = A.SW_HOOK + 4;   /* フックを 大きく したので よゆうも 大きく する */
          const inIt = h.x >= o.x - m && h.x <= o.x + o.w + m && h.y >= o.y - m && h.y <= o.y + o.h + m;
          t(!inIt, `${tag} の フック${k + 1}が とげ／かべに うまって いる（x=${h.x} y=${h.y}）`);
        });
      });
      /* ゴールも 同じ */
      ((st.spikes || []).concat(st.blocks || [])).forEach((o) => {
        const g2 = st.goal.x >= o.x - st.goal.r && st.goal.x <= o.x + o.w + st.goal.r &&
                   st.goal.y >= o.y - st.goal.r && st.goal.y <= o.y + o.h + st.goal.r;
        t(!g2, `${tag} の ゴールが とげ／かべに かさなって いる`);
      });
      /* **お手本を さいごまで 走らせて、ほんとうに ゴールするか** */
      const r = A.swingRun(st, st.ex, 20);
      t(r.clear === true, `${tag} は お手本の とおりに やっても ゴールできない（${r.dead ? 'しっぱい: ' + (r.msg || '') : '時間ぎれ'}）`);
      t(r.t < 18, `${tag} の お手本が 長すぎる（${r.t.toFixed(1)}びょう）`);
      /* **はじめの ボールの まま（入れかえ なし）でも ゴールできて しまわないか。**
         できて しまう 面が ぜんぶだと「3つ つかいわける」に なって いない。 */
      if (true){
        const solo = Object.assign({}, st, { weights: [st.w0] });
        const usesSwap = st.ex.some((a) => String(a[1]).indexOf('w:') === 0);
        if (usesSwap) needSwap++;
        t(!usesSwap || A.swingRun(solo, st.ex.filter((a) => String(a[1]).indexOf('w:') !== 0), 20).clear !== true,
          `${tag} は おもさを かえなくても 同じ そうさで ゴールできて しまう`);
      }
    });
    t(needSwap >= 4, `${g.id} で おもさの かえが いる 面が 少なすぎる（${needSwap}面）`);
  });
}

/* ================================================================== *
 * 8. データの すじが 通って いるか
 * ================================================================== */
head('データの すじ');
{
  const kinds = Object.keys(A.ENGINES);
  A.GAMES.forEach((g) => {
    if (g.soon) { t(!g.stages, `${g.id} は じゅんびちゅうなのに stages が ある`); return; }
    t(!!g.stages && g.stages.length > 0, `${g.id} に stages が ない`);
    t(!!g.card, `${g.id} に カード名が ない`);
    (g.stages || []).forEach((st, i) => {
      t(kinds.indexOf(st.kind || g.kind) >= 0, `${g.id} だい${i + 1}もん の 型 "${st.kind || g.kind}" が ない`);
      t(!!st.t && !!st.h && !!st.learn, `${g.id} だい${i + 1}もん に t / h / learn が そろって いない`);
    });
  });
  const ids = A.GAMES.map((g) => g.id);
  t(new Set(ids).size === ids.length, 'ミニゲームの id が かぶって いる');
}

console.log('\n----------------------------------------------------------------');
console.log(ng ? `結果: ❌ 失敗 ${ng}件 / OK ${ok}件` : `結果: ✅ ぜんぶOK（${ok}件）`);
process.exit(ng ? 1 : 0);
