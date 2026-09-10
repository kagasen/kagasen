/* ================================================================== *
 * でんじしゃくバトル型 — わくの 中に 交ごに 置いて いく（クラスター系）
 *
 *   ★1ターンの ながれ（ユーザー合意 2026-08-25）
 *     ①サイコロ … **N極か S極かは 運**。えらべない（えらべると N ばかりに なって
 *                  「しりぞけ合う だけ」の たんちょうな ゲームに なる ―― 一度 やらかした）
 *     ②コイルを 巻く … ボタンを **おしっぱなし**に すると ぐるぐる 巻かれ、
 *                  まきかずが ふえるほど 磁力が 強く なる。**巻いて いる あいだ
 *                  ばんの「あぶない 輪」が リアルタイムで 大きく なる**ので、
 *                  盤面を 見ながら どこで 止めるかを きめる
 *     ③置く … わくの 中を タップ
 *
 *   ・同じ極は しりぞけ合い、ちがう極は 引き合う。くっついたら その こまは
 *     **だれの ものでも ぜんぶ 置いた 人の 手もとに もどる**
 *   ・**わく（茶いろの ふち）から おし出された こまも 落ちて 手もとに もどる**
 *     （2026-08-25 ユーザー指てき。ふちぎわは あぶない ＝ どこに 置くかが もっと きんちょうする）
 *   ・もどる ところは ぜんぶ **アニメーションで 見せる**。きゅうに 消えると
 *     何が おきたのか 分からない。くっつく／落ちる → 手もとへ とんで いく → **手もとの 数が ふえる**
 *   ・手もとの 数 ＝ のこりの 線 ÷ 100かい（＝ でんじしゃく 1こ ぶん）。
 *     「あと 何こ 置けるか」が トレイの チップで ひと目で 分かる
 *   ・エナメル線を 先に つかい切った 人の 勝ち
 *
 *   あそんで いる うちに 手が おぼえる こと（文では 教えない）:
 *     ・**まきかずが 多いほど 磁力が 強い**（巻きながら 輪が ふくらむので 体で わかる）
 *     ・**同じ極は しりぞけ、ちがう極は 引き合う**（サイコロの 目で 輪の 大きさが 変わる）
 *     ・**近いほど 力が 強い**（きょりの 2じょうに 反比例）
 * ================================================================== */
var MG = {
  cx:300, cy:210, R:160, H:562,
  K:2800, damp:0.80, steps:110,
  pull:1.45,                                    /* ちがう極が くっつく きょり（こま2つの 半けい×） */
  push:15,                                      /* 同じ極を これより 近づけると はじき飛ばされる めやす（じりょくで のびる） */
  care:0.55,                                    /* CPU の 用心ぶかさ。1.0 だと とどく きょりを ぴったり 読みきる ＝
                                                   人には ぜったい できない 打ち方に なる（あぶない はんいは 見えない）。
                                                   0.72 ＝「強い こまは 遠くから 引き寄せる」と 分かって いる 人 くらい */
  minMaki:100, maxMaki:400, windSpeed:230,      /* 1びょうに 230かい 巻ける（100→400で やく1.3びょう） */
  rMin:8, rMax:20,                              /* こまの 大きさ（まきかず さいしょう〜さいだい） */
  reach:24,                                     /* じりょくが とどく きょり（これより 遠い こまは びくとも しない）。
                                                    こまの 大きさ ＋ reach×√(じりょくの かけざん)。
                                                    「くっつく きょり」と ほぼ 同じに なる ように えらんだ 数 */
  unit:200,                                     /* 手もとの かぞえ方 ＝ 200かい（ふつうの 巻きかた）で でんじしゃく 1こ ぶん */
  wall:0.8,                                     /* かべの ばしょ（ふちの すぐ 外）。ここで 速さを ころして 遠くへ 飛ばない ように する */
  fall:0.35,                                    /* 中心が ふちに この ぶん（半けい×）まで 近づいたら たおれて 落ちる */
  playMs:1.9,
  fieldMs:780,                                  /* 置いた あと じりょくの はんいを 見せて いる 時間 */                                   /* うごきの 再生 1コマ ＝ 1.9ミリびょう（速さは シミュレーションどおり） */
  trayY:380, trayH:62, chipY:418, chipR:8, chipGap:19, chipMax:13
};
/* ★レベルの かわりに **自分で えらぶ** 3つ（2026-08-26 ユーザー指てき）。
   むずかしさを こちらで 3だんかいに 決めうちする より、
   「あいてを 強く して、こまを 多く して、わくを せまく する」を
   自分で 組み合わせた ほうが 手ごたえを 自分で 作れる。えらんだ ものは 端末に のこる */
var MGOPT = {
  foe:  [{ t:'よわい', cpu:0.5 }, { t:'ふつう', cpu:1.0 }, { t:'つよい', cpu:1.7 }],
  num:  [4, 6, 8, 10],                           /* でんじしゃく 何こ ぶんの エナメル線を くばるか。
                                                    12こは ばんが いっぱいに なって 事この どうどうめぐりに なり、
                                                    一局 200手を こえる ことが あった ので 入れて いない */
  ring: [{ t:'ひろい', R:152 }, { t:'ふつう', R:142 }, { t:'せまい', R:130 }],
  stage:[{ t:'まる', shape:'circle' }, { t:'しかく', shape:'square' }, { t:'六角形', shape:'hex' }]
};
var mgSet = { foe:1, num:1, ring:1, stage:0 };   /* えらんで いる ばんごう */
function mgOptLoad(){
  var o = save.opt && save.opt['energy-cluster'];
  if (!o) return;
  if (o.foe >= 0 && o.foe < MGOPT.foe.length) mgSet.foe = o.foe;
  if (o.num >= 0 && o.num < MGOPT.num.length) mgSet.num = o.num;
  if (o.ring >= 0 && o.ring < MGOPT.ring.length) mgSet.ring = o.ring;
  if (o.stage >= 0 && o.stage < MGOPT.stage.length) mgSet.stage = o.stage;
  if (o.duo === true || o.duo === false) cur.duo = o.duo;
}
function mgOptSave(){
  if (!save.opt) save.opt = {};
  save.opt['energy-cluster'] = { foe:mgSet.foe, num:mgSet.num, ring:mgSet.ring, stage:mgSet.stage, duo:(cur.duo === true) };
  store();
}
function mgR(){ return MGOPT.ring[mgSet.ring].R; }
function mgStage(){ return MGOPT.stage[mgSet.stage] || MGOPT.stage[0]; }
function mgNum(){ return MGOPT.num[mgSet.num]; }
function mgCpuLv(){ return MGOPT.foe[mgSet.foe].cpu; }
/* まきかず → 大きさ と 磁力。多いほど 大きく 強い（ひとつづきの 数） */
function mgSize(maki){
  /* のこりが minMaki に とどかない ときは maki が 下まわる ので 下げんを つける */
  return Math.max(5, MG.rMin + (maki - MG.minMaki) / (MG.maxMaki - MG.minMaki) * (MG.rMax - MG.rMin));
}
function mgForce(maki){ return maki / 100; }
/* ★くっつく きょり。**同じ極は どんなに 近づけても ぜったいに くっつかない**。
   でんじしゃくの N/S は 電流の むきで きまって いて、ぼうじしゃくの ように
   ひっくりかえる ことは ない。ちがう極どうしだけ、この きょりまで 近づいたら くっつく。
   （2026-08-26 まで 同じ極も くっついて いた ―― ぼうじしゃく時代の「ひっくりかえる」ルールの
     のこりで、でんじしゃくでは まちがい。ユーザー指てきで けした） */
function mgStickD(a, b){ return (a.pole === b.pole) ? 0 : (a.r + b.r) * MG.pull; }
/* 「置いても だいじょうぶ」の めやす（CPU が つかう）。同じ極は くっつかないが、
   くっつけて 置くと 勢いよく はじき飛ばされて わくから 落ちる ので、すこし あける */
function mgSafeD(a, b){
  /* 同じ極 … くっつきは しないが、近すぎると 勢いよく はじき飛ばされて わくから 落ちる
     ちがう極 … **じりょくが とどいたら もう だめ**。引き合う 力は 近づくほど 強く なる ので、
                とどく はんいに 入れた じてんで ほぼ かならず くっつく */
  return (a.pole === b.pole) ? (a.r + b.r) + MG.push * Math.sqrt(a.m * b.m) : mgReach(a, b) * MG.care;
}
/* ★じりょくが とどく きょり。ここより 遠い こまは **力を 受けない ＝ 1ミリも 動かない**。
   ほんとうの じしゃくも 少し はなれれば 感じない。ぜんぶの こまが 毎回 じわっと 動くと
   「ばん ぜんたいが かってに 動く」ように 見えて、どこに 置いたら 何が おきるのかが 読めなく なる。
   強く 巻いた こまほど とどく はんいが 広い（√で きくので 4ばい 巻いて 2ばい） */
function mgReach(a, b){ return a.r + b.r + MG.reach * Math.sqrt(a.m * b.m); }
/* 置いた こまと、その まわり（とどく きょりの 中）だけが 動く。
   置いた ところから 遠い こまは そのまま。seed ＝ いま 置いた こまの ばんごう */
function mgActive(seed){
  var P = cur.pieces, on = [], i;
  for (i = 0; i < P.length; i++) on.push(false);
  if (seed < 0 || seed >= P.length) return on;
  on[seed] = true;
  for (i = 0; i < P.length; i++)
    if (i !== seed && Math.hypot(P[i].x - P[seed].x, P[i].y - P[seed].y) < mgReach(P[i], P[seed])) on[i] = true;
  return on;
}
/* 手もとの でんじしゃくの 数（100かい ＝ 1こ ぶん）。ここが「あと 何こ 置けるか」 */
function mgStock(who){ return Math.floor(cur.hands[who] / MG.unit); }
function mgTrayCx(who){ return (who === 0) ? 156 : 444; }
function mgSlot(who, i){
  return { x: mgTrayCx(who) - 130 + Math.min(i, MG.chipMax - 1) * MG.chipGap + MG.chipR, y: MG.chipY };
}

function loadJishaku(st){
  if (cur.mgRaf){ cancelAnimationFrame(cur.mgRaf); cur.mgRaf = null; }
  cur.duo = (cur.duo === true);
  mgOptLoad();
  cur.pieces = [];
  var wire = mgNum() * MG.unit;
  cur.hands = [wire, wire];                     /* 手ふだ ＝ のこりの エナメル線（かい） */
  cur.turn = 0; cur.maki = MG.minMaki; cur.pole = 1;
  cur.mgPhase = 'ready'; cur.mgMsg = ''; cur.winner = null; cur.stuck = [0, 0];
  cur.pathT = 1; cur.winding = false; cur.dice = 0;
  cur.leaving = []; cur.mgT = 0; cur.gain = [0, 0];   /* 手もとへ もどって いく こまの アニメ */
  cur.field = null; cur.fxT = 0;                     /* じりょくの はんいの え */
}
function jishakuOK(){ return cur.winner === 0; }
/* ステージの ふちまでの 距離。＋なら中、−なら外。
   置ける場所・落下・CPU・描画が ぜんぶ同じ形を使うので、見た目だけの飾りにしない。 */
function mgStageVertices(R){
  var out = [], shape = mgStage().shape, i, a;
  if (shape === 'square') return [
    [MG.cx - R, MG.cy - R], [MG.cx + R, MG.cy - R],
    [MG.cx + R, MG.cy + R], [MG.cx - R, MG.cy + R]
  ];
  for (i = 0; i < 6; i++){
    a = -Math.PI / 2 + i * Math.PI / 3;
    out.push([MG.cx + Math.cos(a) * R, MG.cy + Math.sin(a) * R]);
  }
  return out;
}
function mgStageEdge(x, y){
  if (mgStage().shape === 'circle') return mgR() - Math.hypot(x - MG.cx, y - MG.cy);
  var V = mgStageVertices(mgR()), inside = false, best = 1e9, i, j;
  for (i = 0, j = V.length - 1; i < V.length; j = i++){
    var ax = V[j][0], ay = V[j][1], bx = V[i][0], by = V[i][1];
    if (((ay > y) !== (by > y)) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
    var vx = bx - ax, vy = by - ay, vv = vx * vx + vy * vy;
    var q = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / vv));
    best = Math.min(best, Math.hypot(x - (ax + q * vx), y - (ay + q * vy)));
  }
  return inside ? best : -best;
}
function mgStageRay(ang, extra){
  var lo = 0, hi = mgR() * 1.6, i;
  for (i = 0; i < 20; i++){
    var mid = (lo + hi) / 2;
    if (mgStageEdge(MG.cx + Math.cos(ang) * mid, MG.cy + Math.sin(ang) * mid) >= 0) lo = mid;
    else hi = mid;
  }
  lo += extra || 0;
  return { x:MG.cx + Math.cos(ang) * lo, y:MG.cy + Math.sin(ang) * lo };
}
function mgStageShapeArt(inset, attrs){
  var R = Math.max(1, mgR() - inset), shape = mgStage().shape;
  if (shape === 'circle') return '<circle cx="' + MG.cx + '" cy="' + MG.cy + '" r="' + R + '" ' + attrs + '/>';
  if (shape === 'square') return '<rect x="' + (MG.cx - R) + '" y="' + (MG.cy - R) + '" width="' + (R * 2) +
    '" height="' + (R * 2) + '" rx="3" ' + attrs + '/>';
  return '<polygon points="' + mgStageVertices(R).map(function(p){ return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" ' + attrs + '/>';
}
function mgKeepOnStage(p){
  var pad = p.r * MG.wall;
  if (mgStageEdge(p.x, p.y) >= -pad) return;
  var tx = p.x, ty = p.y, lo = 0, hi = 1, i;
  for (i = 0; i < 20; i++){
    var q = (lo + hi) / 2, x = MG.cx + (tx - MG.cx) * q, y = MG.cy + (ty - MG.cy) * q;
    if (mgStageEdge(x, y) >= -pad) lo = q; else hi = q;
  }
  p.x = MG.cx + (tx - MG.cx) * lo; p.y = MG.cy + (ty - MG.cy) * lo;
  p.vx *= 0.2; p.vy *= 0.2;
}
function mgRandomSpot(r){
  for (var i = 0; i < 40; i++){
    var x = MG.cx + (Math.random() * 2 - 1) * mgR();
    var y = MG.cy + (Math.random() * 2 - 1) * mgR();
    if (mgStageEdge(x, y) >= r + 4) return { x:x, y:y };
  }
  return { x:MG.cx, y:MG.cy };
}
function mgCanPut(x, y, r){
  if (mgStageEdge(x, y) < r + 2) return false;
  for (var i = 0; i < cur.pieces.length; i++){
    var p = cur.pieces[i];
    if (Math.hypot(x - p.x, y - p.y) < (r + p.r) * 1.02) return false;
  }
  return true;
}
/* ここに 置いたら どれだけ よゆうが あるか（m ＝ 置く こまの じりょく）。
   マイナスなら「あぶない ところ」 */
function mgClear(x, y, r, pole, m){
  var me = { r:r, pole:pole, m:(m === undefined) ? 1 : m }, worst = 9999;
  for (var i = 0; i < cur.pieces.length; i++){
    var p = cur.pieces[i];
    worst = Math.min(worst, Math.hypot(x - p.x, y - p.y) - mgSafeD(me, p));
  }
  return worst;
}
/* ふちまでの よゆう。マイナスなら もう 落ちて いる */
function mgEdge(x, y, r){ return mgStageEdge(x, y) - r * MG.fall; }
/* わくから おし出されて 落ちた こま（中心が ふちに かかったら たおれる） */
function mgFellIdx(){
  var out = [];
  for (var i = 0; i < cur.pieces.length; i++){
    var p = cur.pieces[i];
    if (mgEdge(p.x, p.y, p.r) < 0) out.push(i);
  }
  return out;
}
/* seed ＝ いま 置いた こま（省りゃくすると さいごに 足した こま）。
   **動くのは seed の まわりだけ**。力そのものは きょりの 2じょうに 反比例の まま
   （とどく はんいの 中では 何も いじって いない）で、はんいの 外は ゼロに する */
/* rec ＝ true なら **1ステップごとの ばしょを ぜんぶ おぼえる**（`p.path`）。
   これを そのまま 再生すると「強い ほど 勢いよく 飛ぶ」が 目に 見える。
   前は 出発点と 到着点を まっすぐ つないで いた ので、どんな 力でも 同じ 速さに 見えて いた。
   CPU の 先読み（何百回も 走る）では rec を 立てない */
function mgSim(seed, rec){
  var P = cur.pieces, i, j, s, last = 0;
  if (seed === undefined) seed = P.length - 1;
  var on = mgActive(seed);
  for (i = 0; i < P.length; i++){ P[i].vx = 0; P[i].vy = 0; if (rec) P[i].path = [[P[i].x, P[i].y]]; }
  for (s = 0; s < MG.steps; s++){
    if (s % 4 === 3 && mgClusters().length){ if (rec) mgTrim(last); return; }   /* くっついたら そこで 止める（止めないと はじけ飛ぶ） */
    for (i = 0; i < P.length; i++){
      if (!on[i]) continue;                           /* 遠い こまは 動かさない */
      var fx = 0, fy = 0;
      for (j = 0; j < P.length; j++){
        if (i === j) continue;
        var dx = P[i].x - P[j].x, dy = P[i].y - P[j].y;
        var d = Math.sqrt(dx*dx + dy*dy);
        if (d > mgReach(P[i], P[j])) continue;        /* とどかない ＝ 力ゼロ */
        var minD = (P[i].r + P[j].r) * 0.9;
        if (d < minD) d = minD;
        var sign = (P[i].pole === P[j].pole) ? 1 : -1;
        var f = sign * MG.K * P[i].m * P[j].m / (d * d);
        fx += dx / d * f; fy += dy / d * f;
      }
      P[i].vx = (P[i].vx + fx / P[i].m) * MG.damp;
      P[i].vy = (P[i].vy + fy / P[i].m) * MG.damp;
    }
    for (i = 0; i < P.length; i++){
      if (!on[i]) continue;
      P[i].x += P[i].vx * 0.05; P[i].y += P[i].vy * 0.05;
      /* ★かべは ない。ふちを こえた こまは 落ちる（あとで mgFellIdx が 見つける）。
         ただし はるか 遠くへ 飛んで いくと えが おかしく なるので ふちの すぐ 外で 止める */
      mgKeepOnStage(P[i]);
    }
    if (rec){
      var moved = 0;
      for (i = 0; i < P.length; i++){
        if (!on[i]) continue;
        var pv = P[i].path[P[i].path.length - 1];
        moved = Math.max(moved, Math.hypot(P[i].x - pv[0], P[i].y - pv[1]));
        P[i].path.push([P[i].x, P[i].y]);
      }
      if (moved > 0.12) last = s + 1;                 /* まだ 動いて いた さいごの コマ */
    }
  }
  if (rec) mgTrim(last);
}
/* 止まった あとの コマを 切りすてる（じっと して いる 時間を 再生しても しかたない） */
function mgTrim(last){
  var P = cur.pieces, i;
  for (i = 0; i < P.length; i++)
    if (P[i].path && P[i].path.length > last + 1) P[i].path.length = Math.max(1, last + 1);
}
/* いま 何コマめかの ばしょ（0→1 で 再生する） */
function mgAt(p){
  if (!p.path || p.path.length < 2) return [p.x, p.y];
  var t = (cur.pathT === undefined) ? 1 : cur.pathT;
  var f = t * (p.path.length - 1), i = Math.floor(f), u = f - i;
  if (i >= p.path.length - 1) return p.path[p.path.length - 1];
  return [p.path[i][0] + (p.path[i + 1][0] - p.path[i][0]) * u,
          p.path[i][1] + (p.path[i + 1][1] - p.path[i][1]) * u];
}
function mgClusters(){
  var P = cur.pieces, n = P.length, seen = [], out = [], i, j;
  var adj = [];
  for (i = 0; i < n; i++) adj.push([]);
  for (i = 0; i < n; i++) for (j = i + 1; j < n; j++){
    if (Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y) < mgStickD(P[i], P[j])){ adj[i].push(j); adj[j].push(i); }
  }
  for (i = 0; i < n; i++){
    if (seen[i] || !adj[i].length) continue;
    var q = [i], comp = []; seen[i] = 1;
    while (q.length){
      var v = q.shift(); comp.push(v);
      adj[v].forEach(function(w){ if (!seen[w]){ seen[w] = 1; q.push(w); } });
    }
    if (comp.length >= 2) out.push(comp);
  }
  return out;
}
/* ---- サイコロ：N か S かは 運。ここが えらべると ゲームが つまらなく なる ---- */
function mgRollDice(){
  cur.mgPhase = 'dice'; cur.dice = 0;
  cur.maki = Math.min(MG.minMaki, cur.hands[cur.turn]); cur.winding = false;
  var face = (Math.random() < 0.5) ? 1 : -1;
  var t0 = null;
  if (cur.mgRaf) cancelAnimationFrame(cur.mgRaf);
  function step(now){
    if (cur.kind !== 'jishaku' || cur.mgPhase !== 'dice'){ cur.mgRaf = null; return; }
    if (t0 === null) t0 = now;
    var k = Math.min(1, (now - t0) / 800);
    cur.dice = k;
    cur.pole = (k < 1) ? (((now / 90) | 0) % 2 ? 1 : -1) : face;
    renderJishaku();
    if (k < 1) cur.mgRaf = requestAnimationFrame(step);
    else {
      cur.mgRaf = null; cur.pole = face; cur.mgPhase = 'play';
      cur.mgMsg = (face === 1 ? 'N きょく' : 'S きょく') + 'が 出た！ コイルを 巻こう';
      cur.mgBad = false;
      renderJishaku();
      if (cur.turn === 1 && !cur.duo) setTimeout(mgCpu, 550);
    }
  }
  cur.mgRaf = requestAnimationFrame(step);
}
/* ---- コイルを 巻く（おしっぱなし）---- */
function mgWireMax(){ return Math.min(MG.maxMaki, cur.hands[cur.turn]); }
function mgLeftAt(maki){ return Math.floor(cur.hands[cur.turn] / Math.max(1, Math.round(maki))); }
function mgWindStart(){
  if (cur.mgPhase !== 'play' || cur.winding) return;
  if (cur.turn === 1 && !cur.duo) return;
  if (cur.maki >= mgWireMax()) return;
  cur.winding = true;
  var last = null;
  if (cur.windRaf) cancelAnimationFrame(cur.windRaf);
  function step(now){
    if (cur.kind !== 'jishaku' || !cur.winding){ cur.windRaf = null; return; }
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    cur.maki = Math.min(mgWireMax(), cur.maki + MG.windSpeed * dt);
    if (cur.maki >= mgWireMax()) cur.winding = false;
    mgWindSync();
    cur.windRaf = requestAnimationFrame(step);
  }
  cur.windRaf = requestAnimationFrame(step);
}
function mgWindStop(){
  if (!cur.winding) return;
  cur.winding = false;
  if (cur.windRaf){ cancelAnimationFrame(cur.windRaf); cur.windRaf = null; }
  renderJishaku();
}
/* 巻いて いる あいだは **輪の 大きさと コイルの え だけ**を 書きかえる
   （ばん ぜんたいを 作りなおすと おしっぱなしが 切れる／おもい） */
function mgWindSync(){
  var cg = document.getElementById('mg-coil');
  if (cg) cg.innerHTML = mgCoilArt();
  var mk = document.getElementById('mg-maki');
  if (mk) mk.textContent = Math.round(cur.maki) + ' かい';
  var fc = document.getElementById('mg-force');
  if (fc) fc.textContent = 'じりょく ' + mgForce(cur.maki).toFixed(1);
  var fb = document.getElementById('mg-force-bar');
  if (fb) fb.setAttribute('width', (72 * Math.min(1, mgForce(cur.maki) / 4)).toFixed(1));
  var lf = document.getElementById('mg-left');
  if (lf) lf.textContent = 'あと ' + mgLeftAt(cur.maki) + 'こ';
  var pv = document.getElementById('mg-prev');
  if (pv) pv.innerHTML = mgPieceArt({ r:mgSize(cur.maki), maki:cur.maki, pole:cur.pole }, false);
}
/* ---- 置く → 動かす → くっつく／落ちる → 手もとへ もどす ---- */
function mgPlace(x, y){
  var who = cur.turn, r = mgSize(cur.maki), i;
  if (cur.hands[who] <= 0 || cur.mgPhase !== 'play') return;
  if (!mgCanPut(x, y, r)){ cur.mgMsg = 'そこには 置けないよ（わくの 外／こまに かさなる）'; cur.mgBad = true; renderJishaku(); return; }
  mgWindStop();
  var used = Math.round(cur.maki);
  cur.hands[who] -= used;                        /* 巻いた ぶんだけ 線が へる */
  cur.pieces.push({ x:x, y:y, r:r, m:mgForce(cur.maki), maki:used, pole:cur.pole, own:who, vx:0, vy:0 });
  cur.pieces.forEach(function(p){ p.path = [[p.x, p.y]]; });     /* まず ぜんぶ 止まって いる ことに する */
  var me = cur.pieces.length - 1;
  cur.field = mgMakeField(me);                                   /* ★じりょくが どこまで とどいて 何に はたらいたか */
  if (!mgClusters().length) mgSim(me, true);                     /* うごきを 1コマずつ おぼえる */
  var frames = 1;
  cur.pieces.forEach(function(p){ frames = Math.max(frames, p.path.length); });
  cur.pathT = 0; cur.fxT = 0;

  /* だれが 手もとへ もどるか ＝ ①わくから 落ちた こま ②くっついた こま */
  var fellSet = {}, stickSet = {};
  mgFellIdx().forEach(function(k){ fellSet[k] = 1; });
  mgClusters().forEach(function(c){
    var sx = 0, sy = 0;
    c.forEach(function(k){ sx += cur.pieces[k].x; sy += cur.pieces[k].y; });
    c.forEach(function(k){ if (!fellSet[k]) stickSet[k] = { x: sx / c.length, y: sy / c.length }; });
  });
  var idx = [], nFall = 0, nStick = 0, back = 0;
  for (i = 0; i < cur.pieces.length; i++){
    if (fellSet[i]){ idx.push(i); nFall++; back += cur.pieces[i].maki; }
    else if (stickSet[i]){ idx.push(i); nStick++; back += cur.pieces[i].maki; }
  }
  cur.mgPhase = 'anim';
  if (idx.length){
    cur.mgMsg = nFall ? (nStick ? 'くっついて わくからも おちた！' : 'わくから おちる！') : 'くっついた！';
    cur.mgBad = true;
  }
  /* 再生の 長さは コマ数から きめる ＝ **力が 強いほど 速く 大きく 動いて 見える**。
     1コマ MG.playMs びょう。そのあと **じりょくの はんいを 見せる 時間**を たす */
  var moveMs = Math.min(560, Math.max(90, frames * MG.playMs));
  var showMs = cur.field.pairs.length ? MG.fieldMs : MG.fieldMs * 0.62;
  var total = moveMs + showMs;
  if (!idx.length && cur.field.pairs.length) cur.mgMsg = mgFieldMsg(cur.field);
  mgTween(total, function(k){
    var t = k * total;
    cur.pathT = Math.min(1, t / moveMs);
    cur.fxT = k;
  }, function(){
    cur.pathT = 1; cur.fxT = 0; cur.field = null;
    if (!idx.length){ mgTurnEnd(who, 0, 0, 0); return; }
    mgLeave(who, idx, fellSet, stickSet, function(){ mgTurnEnd(who, nStick, nFall, back); });
  });
}
function mgTurnEnd(who, nStick, nFall, back){
  if (nStick + nFall > 0){
    cur.stuck[who] += nStick + nFall;
    cur.mgMsg = (nFall ? (nStick ? 'くっついて わくからも おちた！ ' : 'わくから おちた！ ') : 'くっついた！ ') +
                (nStick + nFall) + 'こ 手もとに もどって、線が ' + back + 'かい ふえた…';
    cur.mgBad = true;
  } else {
    cur.mgMsg = 'ナイス！ うまく 置けた';
    cur.mgBad = false;
  }
  if (cur.hands[who] <= 0){ cur.hands[who] = 0; cur.winner = who; cur.mgPhase = 'done'; }
  else cur.turn = 1 - cur.turn;
  if (cur.winner === 0) cur.noStar = (cur.stuck[0] > 0);
  if (cur.winner === null) mgRollDice();
  else renderJishaku();
}
/* アニメの もと（k は 0→1）。jishaku から はなれたら 止まる */
function mgTween(ms, onFrame, onDone){
  if (cur.mgRaf) cancelAnimationFrame(cur.mgRaf);
  var t0 = null;
  function step(now){
    if (cur.kind !== 'jishaku'){ cur.mgRaf = null; return; }
    if (t0 === null) t0 = now;
    var k = Math.min(1, (now - t0) / ms);
    onFrame(k);
    renderJishaku();
    if (k < 1) cur.mgRaf = requestAnimationFrame(step);
    else { cur.mgRaf = null; if (onDone) onDone(); }
  }
  cur.mgRaf = requestAnimationFrame(step);
}
/* くっついた／落ちた こまを **ばんから 手もとへ 運ぶ**。
   ここが 見えないと「きゅうに 消えた」に なって しまう ので、
   1こずつ 少し ずらして 飛ばし、着いた しゅんかんに 線が ふえる */
function mgLeave(who, idx, fellSet, stickSet, after){
  var list = [], base = mgStock(who), sorted = idx.slice().sort(function(a, b){ return a - b; });
  sorted.forEach(function(k, n){
    var p = cur.pieces[k], slot = mgSlot(who, base + n);
    list.push({
      p:p, own:who, fell: (fellSet[k] === 1),
      sx:p.x, sy:p.y,
      hx: stickSet[k] ? stickSet[k].x : p.x,
      hy: stickSet[k] ? stickSet[k].y : p.y,
      tx:slot.x, ty:slot.y,
      spin: (p.x < MG.cx) ? -1 : 1,
      delay: n * 0.13, k:0, landed:false, landT:0
    });
  });
  idx.slice().sort(function(a, b){ return b - a; }).forEach(function(k){ cur.pieces.splice(k, 1); });
  cur.leaving = list; cur.gain = [0, 0];
  var span = 0.90 + (list.length - 1) * 0.13 + 0.30;         /* びょう */
  mgTween(span * 1000, function(k){
    cur.mgT = k * span;
    list.forEach(function(L){
      L.k = Math.max(0, Math.min(1, (cur.mgT - L.delay) / 0.90));
      if (L.k >= 1 && !L.landed){ L.landed = true; L.landT = cur.mgT; cur.hands[who] += L.p.maki; cur.gain[who] += L.p.maki; }
    });
  }, function(){
    list.forEach(function(L){ if (!L.landed){ L.landed = true; cur.hands[who] += L.p.maki; cur.gain[who] += L.p.maki; } });
    cur.leaving = []; cur.mgT = 0;
    if (after) after();
  });
}
/* 手もとが ふえた しゅんかんの ピカッ（0→1） */
function mgPop(who){
  var v = 0;
  (cur.leaving || []).forEach(function(L){
    if (L.landed && L.own === who) v = Math.max(v, 1 - (cur.mgT - L.landT) / 0.55);
  });
  return Math.max(0, Math.min(1, v));
}
/* ---- コンピュータ：まきかずと ばしょを さがす（極は サイコロで きまって いる） ---- */
function mgCpu(){
  if (cur.kind !== 'jishaku' || cur.winner !== null || cur.turn !== 1 || cur.hands[1] <= 0) return;
  var lv = mgCpuLv(), best = null, bs = -1e9, cap = mgWireMax();
  var tries = Math.round(50 + 90 * lv);
  var cands = [];
  for (var q = 0; q <= 4; q++) cands.push(Math.round(MG.minMaki + (MG.maxMaki - MG.minMaki) * q / 4));
  cands.forEach(function(mk0){
    var mk = Math.min(mk0, cap);
    if (mk < MG.minMaki && cap >= MG.minMaki) return;
    var r = mgSize(mk);
    for (var a = 0; a < tries; a++){
      var spot = mgRandomSpot(r), x = spot.x, y = spot.y;
      if (!mgCanPut(x, y, r)) continue;
      var room = mgClear(x, y, r, cur.pole, mgForce(mk));
      if (room < 0) continue;
      /* 線を たくさん つかえる ほど よい。ただし よゆうが ない 置き方と ふちぎわは さける */
      var sc = mk / 80 + Math.min(room, 40) * lv * 0.12 + Math.min(mgEdge(x, y, r), 26) * lv * 0.10;
      if (sc > bs){ bs = sc; best = { x:x, y:y, mk:mk }; }
    }
  });
  if (!best){ cur.mgMsg = 'あいては 置く ところが なかった！'; cur.winner = 0; cur.mgPhase = 'done'; renderJishaku(); return; }
  cur.maki = best.mk;
  mgPlace(best.x, best.y);
}
/* ---- え ---- */
function mgPieceArt(p, ghost){
  var col = (p.pole === 1) ? '#E0574A' : '#3E7AD8';
  var lt  = (p.pole === 1) ? '#FF8A78' : '#77A9FF';
  var dk  = (p.pole === 1) ? '#9E2D25' : '#214F9A';
  var op = ghost ? .42 : 1;
  var rr = p.r.toFixed(1), s = '<g opacity="' + op + '">';
  /* 鉄心＋銅線＋極板を 上から見た、立体的な電磁石のこま */
  if (!ghost)
    s += '<ellipse cx="1.5" cy="' + (p.r * .38).toFixed(1) + '" rx="' + (p.r * .92).toFixed(1) +
         '" ry="' + (p.r * .78).toFixed(1) + '" fill="#15334A" opacity=".24" filter="url(#mg-soft-shadow)"/>';
  s += '<circle cx="0" cy="0" r="' + rr + '" fill="url(#mg-steel)" stroke="#344B5C" stroke-width="2.2"/>';
  s += '<circle cx="0" cy="0" r="' + (p.r * .82).toFixed(1) + '" fill="#B96828" stroke="#713A18" stroke-width="1.5"/>';
  s += '<circle cx="0" cy="0" r="' + (p.r * .69).toFixed(1) + '" fill="' + col + '" stroke="' + dk + '" stroke-width="2"/>';
  s += '<path d="M' + (-p.r * .48).toFixed(1) + ' ' + (-p.r * .40).toFixed(1) + ' A' +
       (p.r * .66).toFixed(1) + ' ' + (p.r * .66).toFixed(1) + ' 0 0 1 ' + (p.r * .47).toFixed(1) + ' ' +
       (-p.r * .32).toFixed(1) + '" fill="none" stroke="' + lt + '" stroke-width="' +
       Math.max(1.2, p.r * .11).toFixed(1) + '" stroke-linecap="round" opacity=".9"/>';
  var loops = Math.max(2, Math.min(5, Math.round(p.maki / 90)));
  for (var i = 1; i <= loops; i++)
    s += '<path d="M' + (-p.r * .64).toFixed(1) + ' ' + (-p.r * .42 + i * p.r * .18).toFixed(1) +
         ' Q0 ' + (-p.r * .67 + i * p.r * .18).toFixed(1) + ' ' + (p.r * .64).toFixed(1) + ' ' +
         (-p.r * .42 + i * p.r * .18).toFixed(1) + '" fill="none" stroke="#F6B36C" stroke-width="1" opacity=".48"/>';
  s += '<text x="0" y="' + Math.round(p.r * 0.34) + '" font-size="' + Math.round(p.r * 0.94) +
       '" font-weight="900" fill="#fff" stroke="' + dk + '" stroke-width=".65" paint-order="stroke" text-anchor="middle">' +
       (p.pole === 1 ? 'N' : 'S') + '</text></g>';
  if (p.own !== undefined && !ghost)
    s += '<path d="M-4 ' + (-p.r - 4).toFixed(1) + ' L0 ' + (-p.r - 10).toFixed(1) + ' L4 ' +
         (-p.r - 4).toFixed(1) + ' Z" fill="' + (p.own === 0 ? '#FFD24A' : '#FF7DA2') + '" stroke="#fff" stroke-width="1"/>';
  return s;
}
/* 手もとの でんじしゃく 1こ ぶん（＝ エナメル線 100かい） */
function mgChipArt(x, y, r){
  var s = '<ellipse cx="' + (x + 1).toFixed(1) + '" cy="' + (y + 2) + '" rx="' + r + '" ry="' + (r * .72).toFixed(1) + '" fill="#15334A" opacity=".18"/>';
  s += '<circle cx="' + x.toFixed(1) + '" cy="' + y + '" r="' + r + '" fill="url(#mg-brass)" stroke="#8C4A1D" stroke-width="1.5"/>';
  s += '<rect x="' + (x - r * 0.26).toFixed(1) + '" y="' + (y - r * 0.60) + '" width="' + (r * 0.52).toFixed(1) +
       '" height="' + (r * 1.20).toFixed(1) + '" rx="1.5" fill="url(#mg-steel)"/>';
  for (var i = -1; i <= 1; i++)
    s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + (y + i * r * 0.42).toFixed(1) + '" rx="' + (r * 0.58).toFixed(1) +
         '" ry="' + (r * 0.19).toFixed(1) + '" fill="none" stroke="#E98A3A" stroke-width="1.5"/>';
  return s;
}
/* 手もと（トレイ）＝ **あと 何こ 置けるか**が ひと目で 分かる ところ */
function mgTrayArt(who){
  var c = mgTrayCx(who), n = mgStock(who), mine = (who === 0), pop = mgPop(who);
  var col = mine ? '#27A6D7' : '#E95E88', bg = mine ? '#ECF9FE' : '#FFF0F5';
  var turnNow = (cur.turn === who && cur.mgPhase !== 'done');
  var s = '<rect x="' + (c - 142) + '" y="' + (MG.trayY + 3) + '" width="284" height="' + MG.trayH + '" rx="16" fill="#17364C" opacity=".14"/>';
  s += '<rect x="' + (c - 142) + '" y="' + MG.trayY + '" width="284" height="' + MG.trayH + '" rx="16" fill="' + bg +
          '" stroke="' + (pop > 0 ? '#F5B324' : (turnNow ? col : '#DCE5EB')) +
          '" stroke-width="' + (2 + pop * 4).toFixed(1) + '"/>';
  if (turnNow) s += '<rect x="' + (c - 132) + '" y="' + (MG.trayY + 5) + '" width="40" height="4" rx="2" fill="' + col + '"/>';
  s += '<text x="' + (c - 130) + '" y="' + (MG.trayY + 19) + '" font-size="11.5" font-weight="900" fill="' + col + '">' +
       (mine ? (cur.duo ? '1人めの 手もと' : 'あなたの 手もと') : (cur.duo ? '2人めの 手もと' : 'あいての 手もと')) + '</text>';
  s += '<text x="' + (c + 130) + '" y="' + (MG.trayY + 20) + '" font-size="' + (15 + pop * 4).toFixed(1) +
       '" font-weight="900" fill="' + (pop > 0 ? '#C9820A' : '#0F3350') + '" text-anchor="end">でんじしゃく ' + n + 'こ</text>';
  var show = Math.min(n, MG.chipMax), i;
  for (i = 0; i < show; i++) s += mgChipArt(c - 130 + i * MG.chipGap + MG.chipR, MG.chipY, MG.chipR);
  if (n > MG.chipMax)
    s += '<text x="' + (c - 130 + MG.chipMax * MG.chipGap + 4) + '" y="' + (MG.chipY + 4) +
         '" font-size="11" font-weight="900" fill="#C9820A">+' + (n - MG.chipMax) + '</text>';
  if (n === 0)
    s += '<text x="' + (c - 130) + '" y="' + (MG.chipY + 4) + '" font-size="11" font-weight="900" fill="#A9B7C2">のこり わずか！</text>';
  s += '<text x="' + (c - 130) + '" y="' + (MG.trayY + 56) + '" font-size="10" font-weight="900" fill="#8FA3B8">' +
       'のこりの 線 ' + cur.hands[who] + 'かい' + (pop > 0 ? '' : '（' + MG.unit + 'かいで 1こ ぶん）') + '</text>';
  if (pop > 0 && cur.gain[who] > 0)                  /* ふえた ぶんを ひとまとめで 見せる */
    s += '<text x="' + (c + 130) + '" y="' + (MG.trayY + 56) + '" font-size="11" font-weight="900" fill="#2E9A4C" text-anchor="end">＋' +
         cur.gain[who] + 'かい もどった</text>';
  return s;
}
/* ばんから 手もとへ 運ばれて いく こま（くっついた／わくから 落ちた） */
function mgLeaveArt(L){
  var k = L.k, s = '', x, y, sc = 1, rot = 0;
  if (L.landed){                                     /* 着いた あとは トレイの ところで ポンと はじける */
    var a = Math.max(0, 1 - (cur.mgT - L.landT) / 0.55);
    if (a > 0)
      s += '<circle cx="' + L.tx.toFixed(1) + '" cy="' + L.ty + '" r="' + (MG.chipR + 12 * (1 - a)).toFixed(1) +
           '" fill="none" stroke="#F5B324" stroke-width="' + (3.2 * a).toFixed(1) + '" opacity="' + a.toFixed(2) + '"/>';
    return s;
  }
  if (k <= 0) return '<g transform="translate(' + L.sx.toFixed(1) + ',' + L.sy.toFixed(1) + ')">' + mgPieceArt(L.p, false) + '</g>';
  if (L.fell){
    /* ①ふちで かたむく → ②茶いろの わくから 落ちる → ③手もとへ ころがって いく */
    var ang = Math.atan2(L.sy - MG.cy, L.sx - MG.cx);
    var ox = Math.cos(ang), oy = Math.sin(ang);
    var rim = mgStageRay(ang, 5);
    var e = Math.min(1, k / 0.34);
    var fx = L.sx + ox * 9, fy = L.sy + oy * 9 + 26;
    if (k < 0.34){
      x = L.sx + ox * 9 * e; y = L.sy + oy * 9 * e + 26 * e * e;
      rot = L.spin * 70 * e; sc = 1 - 0.08 * e;
    } else {
      /* ふちの 外がわに 落ちた あと、**わくの 下を まわって** 手もとへ ころがって いく
         （まっすぐ 手もとへ 向かうと ばんの 中を よこぎって しまい「落ちた」に 見えない） */
      var f = (k - 0.34) / 0.66, ez = f * f * (3 - 2 * f), iv = 1 - ez;
      var mx = (fx + L.tx) / 2, my = MG.cy + mgR() + 90;
      x = iv * iv * fx + 2 * iv * ez * mx + ez * ez * L.tx;
      y = iv * iv * fy + 2 * iv * ez * my + ez * ez * L.ty;
      rot = L.spin * (70 + 240 * f); sc = 0.92 - 0.44 * ez;
    }
    if (k < 0.5){                                   /* 落ちた ところの ふちが 赤く 波うつ */
      var b = 1 - k / 0.5;
      s += '<circle cx="' + rim.x.toFixed(1) + '" cy="' + rim.y.toFixed(1) +
           '" r="' + (6 + 22 * (1 - b)).toFixed(1) + '" fill="none" stroke="#E0574A" stroke-width="' +
           (3.4 * b).toFixed(1) + '" opacity="' + b.toFixed(2) + '"/>';
    }
  } else {
    /* ①ガチッと すいつく → ②ピカッ → ③手もとへ とんで いく */
    if (k < 0.28){
      var e2 = k / 0.28; e2 = e2 * e2 * (3 - 2 * e2);
      x = L.sx + (L.hx - L.sx) * e2 * 0.92;
      y = L.sy + (L.hy - L.sy) * e2 * 0.92;
      sc = 1 + 0.12 * Math.sin(Math.PI * e2);
    } else {
      var g2 = (k - 0.28) / 0.72, eg = g2 * g2 * (3 - 2 * g2);
      var hx = L.sx + (L.hx - L.sx) * 0.92, hy = L.sy + (L.hy - L.sy) * 0.92;
      x = hx + (L.tx - hx) * eg;
      y = hy + (L.ty - hy) * eg - Math.sin(Math.PI * g2) * 36;
      sc = 1 - 0.44 * eg; rot = L.spin * 50 * eg;
    }
    if (k > 0.18 && k < 0.60){
      var fk = (k - 0.18) / 0.42;
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (L.p.r * (1 + fk * 1.7)).toFixed(1) +
           '" fill="none" stroke="#FFD44D" stroke-width="' + (4.2 * (1 - fk)).toFixed(1) +
           '" opacity="' + (0.95 * (1 - fk)).toFixed(2) + '"/>';
    }
  }
  s += '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + rot.toFixed(0) +
       ') scale(' + sc.toFixed(3) + ')">' + mgPieceArt(L.p, false) + '</g>';
  return s;
}
/* 巻かれて いく コイル（まきかずで わっかが ふえる） */
function mgCoilArt(){
  var s = '', n = Math.min(16, Math.round(cur.maki / 26)), i;
  s += '<ellipse cx="2" cy="48" rx="25" ry="8" fill="#0C293D" opacity=".2" filter="url(#mg-soft-shadow)"/>';
  s += '<rect x="-13" y="-51" width="26" height="102" rx="7" fill="url(#mg-steel)" stroke="#42596B" stroke-width="2"/>';
  s += '<ellipse cx="0" cy="-50" rx="17" ry="6" fill="#DDE8EE" stroke="#42596B" stroke-width="2"/>';
  s += '<ellipse cx="0" cy="50" rx="17" ry="6" fill="#7F929F" stroke="#42596B" stroke-width="2"/>';
  s += '<circle cx="0" cy="-50" r="5" fill="#354A59"/>';
  for (i = 0; i < n; i++){
    var y = -42 + i * (84 / Math.max(n - 1, 1));
    s += '<ellipse cx="0" cy="' + y.toFixed(1) + '" rx="20" ry="5.4" fill="none" stroke="#7A3515" stroke-width="5"/>';
    s += '<ellipse cx="0" cy="' + (y - 1).toFixed(1) + '" rx="20" ry="5.4" fill="none" stroke="#ED8B3E" stroke-width="2.4"/>';
  }
  s += '<path d="M-20 42 C-32 47 -28 59 -38 62" fill="none" stroke="#E05A4A" stroke-width="3" stroke-linecap="round"/>';
  s += '<circle cx="-39" cy="62" r="4" fill="#E05A4A" stroke="#9E2D25" stroke-width="1.5"/>';
  if (cur.winding){
    var a = (cur.maki * 7) % 360;
    s += '<g transform="rotate(' + a.toFixed(0) + ')"><circle cx="0" cy="-67" r="6" fill="#FFD24A" stroke="#C9820A" stroke-width="2"/>' +
         '<path d="M0-59 L0-52" stroke="#FFD24A" stroke-width="3" stroke-linecap="round"/></g>';
  }
  return s;
}
/* ★置いた あとに「じりょくが どこまで とどいて、何に はたらいたか」を 見せる
   （2026-08-26 ユーザー案）。**置く 前には 出さない** ―― 先に 見えると
   「輪の 外に 置くだけ」の 図形パズルに なって しまう（2026-08-25 の 教くん）。
   置いた あとの こたえ合わせ なので、あそぶ ほど 「どこまで とどくか」が 手に 入る */
function mgFieldR(p){ return p.r + MG.reach * p.m; }
function mgMakeField(me){
  var P = cur.pieces, a = P[me], pairs = [], i;
  for (i = 0; i < P.length; i++){
    if (i === me) continue;
    if (Math.hypot(P[i].x - a.x, P[i].y - a.y) < mgReach(P[i], a))
      pairs.push({ j:i, same:(P[i].pole === a.pole) });
  }
  return { i:me, r:mgFieldR(a), pole:a.pole, pairs:pairs };
}
function mgFieldMsg(f){
  var same = 0, diff = 0;
  f.pairs.forEach(function(q){ if (q.same) same++; else diff++; });
  if (same && diff) return 'じりょくが とどいた！ しりぞけ合い ' + same + 'こ・引き合い ' + diff + 'こ';
  if (same) return '同じ極どうし！ ' + same + 'こを 勢いよく しりぞけた';
  return 'ちがう極どうし！ ' + diff + 'こを 引きよせた';
}
/* 矢じるし 1本（むきは dir、長さ len） */
function mgArrow(x, y, ang, len, col, op){
  var c = Math.cos(ang), sn = Math.sin(ang);
  var x2 = x + c * len, y2 = y + sn * len;
  var s = '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
          '" stroke="' + col + '" stroke-width="3.4" stroke-linecap="round" opacity="' + op.toFixed(2) + '"/>';
  var h = 6.5;
  s += '<path d="M' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
       ' L' + (x2 - c * h + sn * h * 0.75).toFixed(1) + ' ' + (y2 - sn * h - c * h * 0.75).toFixed(1) +
       ' L' + (x2 - c * h - sn * h * 0.75).toFixed(1) + ' ' + (y2 - sn * h + c * h * 0.75).toFixed(1) +
       ' Z" fill="' + col + '" opacity="' + op.toFixed(2) + '"/>';
  return s;
}
/* はんいの え（こまの 下に かく ぶん） */
function mgFieldBackArt(){
  var f = cur.field;
  if (!f || !cur.pieces[f.i]) return '';
  var k = cur.fxT, p = cur.pieces[f.i], pos = mgAt(p);
  var grow = Math.min(1, k / 0.22), fade = (k > 0.72) ? Math.max(0, 1 - (k - 0.72) / 0.28) : 1;
  var e = 1 - Math.pow(1 - grow, 3);                     /* ぱっと ひろがって ゆっくり 止まる */
  var R = f.r * e;
  var col = (f.pole === 1) ? '#E0574A' : '#3E7AD8';
  var s = '<circle cx="' + pos[0].toFixed(1) + '" cy="' + pos[1].toFixed(1) + '" r="' + R.toFixed(1) +
          '" fill="url(#mg-field)" opacity="' + (0.85 * fade).toFixed(2) + '"/>';
  s += '<circle cx="' + pos[0].toFixed(1) + '" cy="' + pos[1].toFixed(1) + '" r="' + R.toFixed(1) +
       '" fill="none" stroke="' + col + '" stroke-width="2" stroke-dasharray="7 6" opacity="' + (0.55 * fade).toFixed(2) + '"/>';
  /* ひろがる しゅんかんの 波 */
  if (k < 0.34){
    var w = k / 0.34;
    s += '<circle cx="' + pos[0].toFixed(1) + '" cy="' + pos[1].toFixed(1) + '" r="' + (f.r * w * 1.12).toFixed(1) +
         '" fill="none" stroke="' + col + '" stroke-width="' + (5 * (1 - w)).toFixed(1) +
         '" opacity="' + (0.7 * (1 - w)).toFixed(2) + '"/>';
  }
  return s;
}
/* はたらいた 力の 矢じるし（こまの 上に かく ぶん） */
function mgFieldFrontArt(){
  var f = cur.field;
  if (!f || !cur.pieces[f.i]) return '';
  var k = cur.fxT, s = '';
  if (k < 0.10) return '';
  var fade = (k > 0.72) ? Math.max(0, 1 - (k - 0.72) / 0.28) : Math.min(1, (k - 0.10) / 0.10);
  var a = cur.pieces[f.i], pa = mgAt(a);
  var puls = 1 + 0.18 * Math.sin(k * 18);
  f.pairs.forEach(function(q){
    var b = cur.pieces[q.j];
    if (!b) return;
    var pb = mgAt(b), dx = pb[0] - pa[0], dy = pb[1] - pa[1], d = Math.hypot(dx, dy) || 1;
    var ang = Math.atan2(dy, dx), col = q.same ? '#E0574A' : '#2E9A4C';
    var len = Math.max(11, Math.min(22, d * 0.22)) * puls;   /* くっついた あとでも 見える 長さは のこす */
    /* 同じ極 … おたがい 外がわへ ／ ちがう極 … おたがい 内がわへ */
    if (q.same){
      s += mgArrow(pa[0] - Math.cos(ang) * (a.r + 3), pa[1] - Math.sin(ang) * (a.r + 3), ang + Math.PI, len, col, fade);
      s += mgArrow(pb[0] + Math.cos(ang) * (b.r + 3), pb[1] + Math.sin(ang) * (b.r + 3), ang, len, col, fade);
    } else {
      s += mgArrow(pa[0] + Math.cos(ang) * (a.r + 3 + len), pa[1] + Math.sin(ang) * (a.r + 3 + len), ang + Math.PI, len, col, fade);
      s += mgArrow(pb[0] - Math.cos(ang) * (b.r + 3 + len), pb[1] - Math.sin(ang) * (b.r + 3 + len), ang, len, col, fade);
    }
    s += '<circle cx="' + pb[0].toFixed(1) + '" cy="' + pb[1].toFixed(1) + '" r="' + (b.r + 5).toFixed(1) +
         '" fill="none" stroke="' + col + '" stroke-width="2.6" opacity="' + (0.75 * fade).toFixed(2) + '"/>';
  });
  return s;
}
/* えらぶ ボタン（せってい画面）。えらんで いる ものだけ 色が つく */
function mgChoiceArt(cx, cy, w, h, txt, on, attr){
  var s = '<g transform="translate(' + cx + ',' + cy + ')">';
  s += '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) +
       '" fill="' + (on ? '#1B7FA8' : '#fff') + '" stroke="' + (on ? '#0E5B7C' : '#B9C6D1') + '" stroke-width="3"/>';
  s += '<text x="0" y="5" font-size="14" font-weight="900" fill="' + (on ? '#fff' : '#3B5A70') +
       '" text-anchor="middle">' + txt + '</text>';
  s += '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h +
       '" fill="transparent" ' + attr + '/></g>';
  return s;
}
function mgDiceArt(){
  var rolling = (cur.mgPhase === 'dice');
  var k = rolling ? (1 - cur.dice) : 0;
  var rot = rolling ? (cur.dice * 900) % 360 : 0;
  var col = (cur.pole === 1) ? '#E0574A' : '#3E7AD8';
  var s = '<ellipse cx="3" cy="31" rx="29" ry="9" fill="#12334A" opacity=".22" filter="url(#mg-soft-shadow)"/>';
  s += '<g transform="rotate(' + rot.toFixed(0) + ') scale(' + (1 + k * 0.18).toFixed(3) + ')">';
  s += '<rect x="-29" y="-29" width="58" height="58" rx="14" fill="url(#mg-die)" stroke="#375367" stroke-width="2.5"/>';
  s += '<path d="M-19 -18 Q0 -28 19 -18" fill="none" stroke="#fff" stroke-width="4" opacity=".72" stroke-linecap="round"/>';
  s += '<circle cx="0" cy="0" r="20" fill="' + col + '" opacity=".12"/>';
  s += '<text x="0" y="12" font-size="32" font-weight="900" fill="' + col + '" text-anchor="middle">' +
       (cur.pole === 1 ? 'N' : 'S') + '</text></g>';
  return s;
}
function renderJishaku(){
  var st = curStage();
  setBoardBox(600, MG.H);
  var s = '', myTurn = (cur.turn === 0 || cur.duo), playing = (cur.mgPhase === 'play');

  /* じりょくの え の グラデーション。まん中ほど こい ＝ **近いほど 力が 強い** */
  s += '<defs><radialGradient id="mg-field">' +
       '<stop offset="0%" stop-color="#FFD44D" stop-opacity=".55"/>' +
       '<stop offset="55%" stop-color="#FFD44D" stop-opacity=".20"/>' +
       '<stop offset="100%" stop-color="#FFD44D" stop-opacity="0"/></radialGradient>' +
       '<linearGradient id="mg-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4FAFC"/><stop offset=".28" stop-color="#9FB2BE"/><stop offset=".55" stop-color="#E9F1F4"/><stop offset="1" stop-color="#6E8392"/></linearGradient>' +
       '<linearGradient id="mg-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD39B"/><stop offset=".45" stop-color="#CE762F"/><stop offset="1" stop-color="#8A451B"/></linearGradient>' +
       '<linearGradient id="mg-die" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DDE9EF"/></linearGradient>' +
       '<linearGradient id="mg-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE5A6"/><stop offset=".28" stop-color="#B86E2C"/><stop offset=".55" stop-color="#F6C476"/><stop offset="1" stop-color="#7C451D"/></linearGradient>' +
       '<pattern id="mg-board-texture" width="600" height="600" patternUnits="userSpaceOnUse"><image href="./images/magnet-arena-texture.png" x="0" y="0" width="600" height="600" preserveAspectRatio="xMidYMid slice"/></pattern>' +
       '<filter id="mg-soft-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>' +
       '<filter id="mg-board-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#09283C" flood-opacity=".28"/></filter></defs>';
  /* 深い実験台の上に、真鍮で縁取ったアリーナを載せる */
  s += '<rect x="0" y="0" width="600" height="' + MG.H + '" rx="20" fill="#EAF2F3"/>';
  s += '<rect x="10" y="48" width="580" height="322" rx="24" fill="#17394F"/>';
  s += '<path d="M28 68 H572" stroke="#5B8298" stroke-width="1" opacity=".55"/>';
  s += '<circle cx="28" cy="64" r="4" fill="#88A3B2"/><circle cx="572" cy="64" r="4" fill="#88A3B2"/>';
  s += '<rect x="20" y="6" width="560" height="34" rx="12" fill="' +
       (cur.turn === 0 ? '#EAF3F8' : '#FBE9F0') + '" stroke="' + (cur.turn === 0 ? '#3EA7D8' : '#E8618C') + '" stroke-width="2"/>';
  s += '<text x="300" y="29" font-size="14" font-weight="900" fill="' + (cur.turn === 0 ? '#1B7FA8' : '#B84268') +
       '" text-anchor="middle">' + (cur.mgPhase === 'done' ? '　' :
       '▶ ' + (cur.turn === 0 ? (cur.duo ? '1人め' : 'あなた') : (cur.duo ? '2人め' : 'あいて')) + 'の ばん') + '</text>';
  s += '<text x="36" y="29" font-size="12" font-weight="900" fill="#1B7FA8">もどした ' + cur.stuck[0] + 'こ</text>';
  s += '<text x="564" y="29" font-size="12" font-weight="900" fill="#B84268" text-anchor="end">もどした ' + cur.stuck[1] + 'こ</text>';

  /* わく（茶いろの ふち）。まる・しかく・六角形で、落ちる境界も実際に変わる */
  s += mgStageShapeArt(-15, 'fill="#071D2C" opacity=".65" filter="url(#mg-board-shadow)"');
  s += mgStageShapeArt(-15, 'fill="url(#mg-rim)" stroke="#6F3B19" stroke-width="3"');
  s += mgStageShapeArt(-8, 'fill="#283F4D" stroke="#FFE1A1" stroke-width="2"');
  s += mgStageShapeArt(0, 'fill="url(#mg-board-texture)" stroke="#9C622C" stroke-width="3"');
  s += mgStageShapeArt(7, 'fill="none" stroke="#C89151" stroke-width="1" stroke-dasharray="2 7" opacity=".72"');
  for (var bt = 0; bt < 12; bt++){
    var ba = bt * Math.PI / 6, bp = mgStageRay(ba, 11.5);
    s += '<circle cx="' + bp.x.toFixed(1) + '" cy="' + bp.y.toFixed(1) + '" r="2.4" fill="#F9D591" stroke="#70401D" stroke-width="1"/>';
  }
  /* ★じりょくの とどく はんいは **置く 前には 見せない**。
     先に 見えると「輪の 外に 置くだけ」の 図形パズルに なって しまう。
     そのかわり **置いた あとに** どこまで とどいて 何に はたらいたかを 見せる（こたえ合わせ）。 */
  s += mgFieldBackArt();
  cur.pieces.forEach(function(p){
    var pos = mgAt(p);
    s += '<g transform="translate(' + pos[0].toFixed(1) + ',' + pos[1].toFixed(1) + ')">' + mgPieceArt(p, false) + '</g>';
  });
  s += mgFieldFrontArt();
  /* あたりは いちばん 上（下に かくと 輪や こまに タップを うばわれる） */
  s += mgStageShapeArt(0, 'fill="transparent" data-mgboard="1"');

  /* ---- サイコロ（ひだり） ---- */
  s += '<rect x="34" y="76" width="88" height="116" rx="18" fill="#21485F" stroke="#52758A" stroke-width="1.5"/>';
  s += '<text x="78" y="94" font-size="11" font-weight="900" fill="#D9EDF5" text-anchor="middle">きょくサイコロ</text>';
  s += '<g transform="translate(78,136)">' + mgDiceArt() + '</g>';
  s += '<text x="78" y="181" font-size="10" font-weight="900" fill="#9CC9DB" text-anchor="middle">N / S は 運！</text>';

  /* ---- コイル（みぎ） ---- */
  s += '<rect x="470" y="76" width="104" height="250" rx="18" fill="#21485F" stroke="#52758A" stroke-width="1.5"/>';
  s += '<text x="522" y="95" font-size="11" font-weight="900" fill="#D9EDF5" text-anchor="middle">でんじしゃく工房</text>';
  s += '<g id="mg-coil" transform="translate(522,172)">' + mgCoilArt() + '</g>';
  s += '<text id="mg-maki" x="522" y="246" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">' +
       Math.round(cur.maki) + ' かい</text>';
  s += '<rect x="486" y="257" width="72" height="7" rx="3.5" fill="#112F43"/>';
  s += '<rect id="mg-force-bar" x="486" y="257" width="' + (72 * Math.min(1, mgForce(cur.maki) / 4)).toFixed(1) + '" height="7" rx="3.5" fill="#FFD24A"/>';
  s += '<text id="mg-force" x="522" y="280" font-size="11" font-weight="900" fill="#FFD77A" text-anchor="middle">じりょく ' +
       mgForce(cur.maki).toFixed(1) + '</text>';
  s += '<text x="522" y="297" font-size="9.5" font-weight="900" fill="#9CC9DB" text-anchor="middle">この 巻きかたなら</text>';
  s += '<text id="mg-left" x="522" y="316" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">あと ' +
       mgLeftAt(cur.maki) + 'こ</text>';
  s += '<rect x="34" y="202" width="88" height="124" rx="18" fill="#21485F" stroke="#52758A" stroke-width="1.5"/>';
  s += '<text x="78" y="221" font-size="10.5" font-weight="900" fill="#D9EDF5" text-anchor="middle">つぎの こま</text>';
  s += '<g id="mg-prev" transform="translate(78,254)">' +
       mgPieceArt({ r:mgSize(cur.maki), maki:cur.maki, pole:cur.pole }, false) + '</g>';
  s += '<text x="78" y="292" font-size="9.5" font-weight="900" fill="#FFCE7A" text-anchor="middle">ふちぎわ 注意！</text>';
  s += '<text x="78" y="309" font-size="9" font-weight="900" fill="#9CC9DB" text-anchor="middle">はなせば 安全</text>';

  /* ---- 手もと（あと 何こ 置けるか）---- */
  s += mgTrayArt(0);
  s += mgTrayArt(1);
  /* ばんから 手もとへ 運ばれて いく こま（トレイの 上に かく） */
  if (cur.leaving && cur.leaving.length){
    s += '<g pointer-events="none">';
    cur.leaving.forEach(function(L){ s += mgLeaveArt(L); });
    s += '</g>';
  }

  /* ---- 巻く ボタン ---- */
  var canWind = (playing && myTurn);
  s += '<g transform="translate(300,484)">' +
       '<rect x="-180" y="-30" width="360" height="68" rx="34" fill="#17364C" opacity=".2"/>' +
       '<rect x="-180" y="-34" width="360" height="68" rx="34" fill="' + (canWind ? (cur.winding ? '#D97816' : 'url(#mg-brass)') : '#DCE5EB') + '" stroke="' + (canWind ? '#8C4A1D' : '#BCC9D1') + '" stroke-width="2.5"/>' +
       '<path d="M-135-2 C-135-17 -112-17 -112-2 C-112 13 -89 13 -89-2" fill="none" stroke="' + (canWind ? '#FFF0CF' : '#A9B7C2') + '" stroke-width="4" stroke-linecap="round"/>' +
       '<text x="18" y="-2" font-size="19" font-weight="900" fill="' + (canWind ? '#fff' : '#A9B7C2') +
       '" text-anchor="middle">コイルを 巻く</text>' +
       '<text x="0" y="19" font-size="12" font-weight="900" fill="' + (canWind ? '#FFF3C4' : '#A9B7C2') +
       '" text-anchor="middle">おしっぱなしで ぐるぐる</text>' +
       (canWind ? '<rect x="-180" y="-34" width="360" height="68" fill="transparent" data-mgwind="1"/>' : '') + '</g>';
  s += '<text x="300" y="536" font-size="13" font-weight="900" fill="#5A7C93" text-anchor="middle">' +
       (playing ? (myTurn ? '巻きおわったら わくの 中を タップ して 置く' : 'あいてが 考えて います…') : '') + '</text>';
  s += '<text x="300" y="554" font-size="11" font-weight="900" fill="#A9B7C2" text-anchor="middle">' +
       '同じ極どうしは くっつかない ―― かわりに 強いほど 勢いよく はじき飛ぶ</text>';

  if (cur.mgPhase === 'ready'){
    /* ★レベルを えらぶ 画面では なく **自分で 組み立てる** 画面。
       むずかしさの つまみと ステージを 出して いる（あいて・こまの 数・わくの 大きさ・形） */
    s += '<rect x="0" y="0" width="600" height="' + MG.H + '" fill="#0F3350" opacity=".42"/>';
    s += '<g transform="translate(300,280)"><rect x="-214" y="-264" width="428" height="528" rx="24" fill="#fff"/>';
    s += '<text x="0" y="-230" font-size="19" font-weight="900" fill="#0F3350" text-anchor="middle">じぶんで きめて たいせん</text>';
    s += '<text x="0" y="-208" font-size="11" font-weight="900" fill="#A9B7C2" text-anchor="middle">' +
         'サイコロで N か S ／ おしっぱなしで 巻く ／ わくの 中を タップ</text>';
    var rows = [
      { lb:'あいての つよさ', y:-185, w:124, list:MGOPT.foe.map(function(o){ return o.t; }), sel:mgSet.foe, key:'foe' },
      { lb:'でんじしゃくの 数', y:-116, w:92, list:MGOPT.num.map(function(n){ return n + 'こ'; }), sel:mgSet.num, key:'num' },
      { lb:'わくの 大きさ', y:-47, w:124, list:MGOPT.ring.map(function(o){ return o.t; }), sel:mgSet.ring, key:'ring' },
      { lb:'ステージ', y:22, w:124, list:MGOPT.stage.map(function(o){ return o.t; }), sel:mgSet.stage, key:'stage' }
    ];
    rows.forEach(function(row){
      s += '<text x="-196" y="' + (row.y - 4) + '" font-size="12" font-weight="900" fill="#5A7C93">' + row.lb + '</text>';
      var n = row.list.length, gap = 8, tot = n * row.w + (n - 1) * gap;
      row.list.forEach(function(txt, i){
        var cx = -tot / 2 + row.w / 2 + i * (row.w + gap);
        s += mgChoiceArt(cx, row.y + 28, row.w, 44, txt, (i === row.sel),
                         'data-mgset="' + row.key + ':' + i + '"');
      });
    });
    /* 1人／2人 */
    s += '<text x="-196" y="90" font-size="12" font-weight="900" fill="#5A7C93">あそぶ 人</text>';
    [[0, 'ひとりで', -96], [1, 'ふたりで', 96]].forEach(function(m){
      s += mgChoiceArt(m[2], 120, 180, 44, m[1], (cur.duo === (m[0] === 1)), 'data-mgduo="' + m[0] + '"');
    });
    s += '<rect x="-104" y="160" width="208" height="50" rx="25" fill="#2E9A4C"/>' +
         '<text x="0" y="193" font-size="18" font-weight="900" fill="#fff" text-anchor="middle">▶ はじめる</text>' +
         '<rect x="-104" y="160" width="208" height="50" fill="transparent" data-mggo="1"/></g>';
  }
  if (cur.mgPhase === 'done'){
    var win = (cur.winner === 0);
    s += '<rect x="0" y="0" width="600" height="' + MG.H + '" fill="#0F3350" opacity=".42"/>';
    s += '<g transform="translate(300,246)"><rect x="-200" y="-96" width="400" height="200" rx="24" fill="#fff"/>';
    s += '<text x="0" y="-52" font-size="23" font-weight="900" fill="' + (win ? '#2E9A4C' : '#E08A00') +
         '" text-anchor="middle">' + (win ? (cur.duo ? '1人めの 勝ち！' : 'あなたの 勝ち！') : (cur.duo ? '2人めの 勝ち！' : 'あいての 勝ち…')) + '</text>';
    s += '<text x="0" y="-22" font-size="13" font-weight="900" fill="#5A7C93" text-anchor="middle">手もとに もどって きた こま</text>';
    s += '<text x="0" y="-4" font-size="14" font-weight="900" fill="#3B5A70" text-anchor="middle">' +
         (cur.duo ? '1人め ' : 'あなた ') + cur.stuck[0] + 'こ ／ ' + (cur.duo ? '2人め ' : 'あいて ') + cur.stuck[1] + 'こ</text>';
    s += '<text x="0" y="20" font-size="12.5" font-weight="900" fill="' + (cur.stuck[0] === 0 ? '#C9820A' : '#A9B7C2') +
         '" text-anchor="middle">★きんカードは「1こも もどさずに 勝つ」</text>';
    /* 同じ せっていで すぐ もう1回 ／ せっていを えらび直す の 2つ */
    s += '<rect x="-186" y="40" width="176" height="46" rx="23" fill="#1B7FA8"/>' +
         '<text x="-98" y="70" font-size="15" font-weight="900" fill="#fff" text-anchor="middle">↺ もう いちど</text>' +
         '<rect x="-186" y="40" width="176" height="46" fill="transparent" data-mgstart="1"/>';
    s += '<rect x="10" y="40" width="176" height="46" rx="23" fill="#fff" stroke="#B9C6D1" stroke-width="3"/>' +
         '<text x="98" y="70" font-size="15" font-weight="900" fill="#3B5A70" text-anchor="middle">⚙ せってい</text>' +
         '<rect x="10" y="40" width="176" height="46" fill="transparent" data-mgopt="1"/></g>';
  }
  document.getElementById('board').innerHTML = s;
  if (cur.mgPhase === 'dice') setStatus('サイコロを ふって います…', false);
  else if (playing || cur.mgPhase === 'anim') setStatus(cur.mgMsg || 'コイルを 巻いて、わくの 中を タップ', cur.mgBad === true);
  else setStatus('', false);
  tryClear(jishakuOK());
}
/* ---- おしっぱなし（マウスでも 指でも） ---- */
function downJishaku(e){
  if (attrUp(e.target, 'data-mgwind') !== null){
    if (e.cancelable) e.preventDefault();
    mgWindStart();
  }
}
function upJishaku(){ mgWindStop(); }
function tapJishaku(e){
  var set = attrUp(e.target, 'data-mgset');
  if (set !== null){
    var kv = set.split(':');
    mgSet[kv[0]] = parseInt(kv[1], 10);
    mgOptSave();
    loadJishaku(curStage());                    /* えらび直したら くばり直す（画面に すぐ うつる） */
    renderJishaku(); return;
  }
  var du = attrUp(e.target, 'data-mgduo');
  if (du !== null){ cur.duo = (du === '1'); mgOptSave(); renderJishaku(); return; }
  if (attrUp(e.target, 'data-mgopt') !== null){       /* せってい画面へ もどる */
    loadJishaku(curStage()); renderJishaku(); return;
  }
  if (attrUp(e.target, 'data-mggo') !== null || attrUp(e.target, 'data-mgstart') !== null){
    var duo = cur.duo;
    loadJishaku(curStage()); cur.duo = duo;
    mgRollDice(); return;
  }
  if (cur.mgPhase !== 'play') return;
  if (attrUp(e.target, 'data-mgwind') !== null) return;      /* 巻く ボタンは おしっぱなしで しょり する */
  if (cur.turn === 1 && !cur.duo) return;
  if (attrUp(e.target, 'data-mgboard') !== null){
    var box = document.getElementById('board').getBoundingClientRect();
    mgPlace((e.clientX - box.left) / box.width * 600, (e.clientY - box.top) / box.height * MG.H);
  }
}
ENGINES.jishaku = { load:loadJishaku, render:renderJishaku, tap:tapJishaku, down:downJishaku, up:upJishaku };
