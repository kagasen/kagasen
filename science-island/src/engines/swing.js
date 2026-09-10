/* ================================================================== *
 * ふりこアクション型（swing）— ふりこで ゆれて ゴールを めざす
 *
 *   ふりこの うごきは **ほんものの 式**で といて いる：θ'' = -(g/L)sinθ。
 *   ここに **おもさは 出て こない**。だから 3つの ボールは どれも
 *   「同じ 長さの ひもなら 同じ はやさで ゆれる」―― 5年「ふりこのきまり」そのもの。
 *   おもさが きいて くるのは ぶつかった とき（かべを こわす）・ばねで はねる とき・
 *   風に 流される とき。**周期には きかない／力には きく**を あそびながら 体で おぼえる。
 *
 *   そうさ：ばんめんを おして いる あいだ 近くの フックに ぶら下がる → はなすと 飛ぶ。
 *   ボールの 入れかえは **ぶら下がって いる あいだだけ**（入れかえても ゆれ方が
 *   かわらない ことが その場で 分かる）。
 * ================================================================== */
var SWG = 900, SW_DT = 1 / 120, SW_ROPE = 175, SW_GRAB = 168, SW_DAMP = 0.10, SW_HOOK = 14;
var SW_W = 600, SW_H = 400;
/* **おもさ**と**大きさ**は べつべつに えらべる（2026-08-29 ユーザーの きぼう）。
   おもさ …… かべを こわす 力・ばねで はねる 高さ に きく
   大きさ …… ボールの あたりの 大きさ だけ
   **どちらも ふりこの ゆれる はやさには きかない**（ひもの 長さだけで きまる）。 */
var SWW = {
  100: { g:100, name:'おもい', col:'#C0503C', dark:'#7E2E1E', hit:true,  spring:0.75 },
  50:  { g:50,  name:'ふつう', col:'#3EA7D8', dark:'#1B6E96', hit:false, spring:1.15 },
  10:  { g:10,  name:'かるい', col:'#F0B429', dark:'#9C6F00', hit:false, spring:1.75 }
};
/* 大きさは 6/12/18。**さが 大きい ほど「せまい すきま」を つかった 面が 作れる**
   （d=12/24/36 なので、すきま 16〜22px は 小さい ボールだけ 通れる）。 */
var SW_WS = [100, 50, 10], SW_RS = [18, 12, 6];
var SWR = { 18:'大きい', 12:'ふつう', 6:'小さい' };
/* **ひもの ながさ**（2026-08-29 ユーザーの ていあん）。
   ふりこの 1おうふくの 時間は **ひもの 長さだけ**で きまる ―― それを 自分で さわれる ように した。
   みじかい＝たぐりよせる（はやく ゆれる）／長い＝くり出す（ゆっくり 大きく ゆれる）。
   スタートでも きくので、長い ほど 支点から 遠く＝低く なり **はじめの いきおいも 大きく なる**。 */
var SW_LS = ['short', 'normal', 'long'];
var SWL = { short:'みじかい', normal:'ふつう', long:'長い' };
/* **長さは「きまった 数」**（2026-08-29 ユーザーの 指てきで こう した）。
   まえは「つかんだ ときの きょり ＋70」と いう **その ときしだいの 長さ**だったので、
   近くの フックを つかむと 長いを えらんで いても みじかく なって しまった。
   いまは みじかい=90／長い=200 の **いつも 同じ 長さ**。ふつうだけ「つかんだ ところの まま」。 */
var SW_LN = { short:90, long:200 };
var SW_LMAX = 240;
function swL(st){ return (st && st.lens) || SW_LS; }
function swRopeLen(lk, dist){
  if (SW_LN[lk]) return SW_LN[lk];                       /* みじかい／長いは いつも 同じ 長さ */
  return Math.max(34, Math.min(SW_ROPE, dist));          /* ふつうは つかんだ ところの まま */
}
/* 「長い」は 出せる だけ 出す。いっぱいまで のばすと かべに あたる ときは 少しずつ みじかく して ためす。 */
function swRopeFit(st, s, hx, hy, th, dist){
  var want = swRopeLen(s.lk, dist);
  for (var L = want; L >= 40; L -= 6){
    if (!swBlocked(st, s, hx + L * Math.sin(th), hy + L * Math.cos(th))) return L;
  }
  return Math.max(34, Math.min(SW_ROPE, dist));
}
/* かべ（岩・ひび・うごく かべ）に めり込んで いるか だけを 見る。
   **すきまより ボールが 大きい ときに かどから すりぬける のを ふせぐ**ため、
   1こま すすんだ あと ここで たしかめて、めり込んで いたら 元の ばしょに もどす。 */
function swSolid(st, s, x, y){
  var r = s.r, i;
  for (i = 0; i < (st.blocks || []).length; i++){
    var b = st.blocks[i];
    if (s.broken[i]) continue;
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
  }
  for (i = 0; i < (st.movers || []).length; i++){
    var mv = st.movers[i], my = swMoverY(mv, s.t);
    if (x + r > mv.x && x - r < mv.x + mv.w && y + r > my && y - r < my + mv.h) return true;
  }
  return false;
}
/* その ばしょに おいたら 何かに あたるか（ひもの 長さを かえる ときの 安全かくにん） */
function swBlocked(st, s, x, y){
  var r = s.r, i;
  if (x < r + 4 || x > SW_W - r - 4 || y < r + 4 || y > SW_H - r - 4) return true;
  for (i = 0; i < (st.blocks || []).length; i++){
    var b = st.blocks[i];
    if (s.broken[i]) continue;
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
  }
  for (i = 0; i < (st.movers || []).length; i++){
    var mv = st.movers[i], my = swMoverY(mv, s.t);
    if (x + r > mv.x && x - r < mv.x + mv.w && y + r > my && y - r < my + mv.h) return true;
  }
  for (i = 0; i < (st.spikes || []).length; i++){
    var k = st.spikes[i];
    if (x + r > k.x && x - r < k.x + k.w && y + r > k.y && y - r < k.y + k.h) return true;
  }
  return false;
}
function swW(st){ return (st && st.weights) || SW_WS; }
function swR(st){ return (st && st.sizes) || SW_RS; }

function swingInit(st, keep){
  var s = { x:st.start.x, y:st.start.y, vx:0, vy:0,
            w:(keep && keep.w) || st.w0 || 50, r:(keep && keep.r) || st.r0 || 12,
            lk:(keep && keep.lk) || st.l0 || 'normal',
            hook:null, t:0, dead:false, clear:false,
            broken:{}, started:false, fx:0, msg:'' };
  /* **さいしょから いちばん 近い フックに ぶら下がった じょうたいで とまって いる。**
     おす まで うごかない ―― かってに 落ちて しまう のを やめた（2026-08-29）。 */
  var i = swingNearHook(st, s);
  if (i >= 0){
    var h = st.hooks[i], dx = s.x - h.x, dy = s.y - h.y;
    var dist = Math.max(28, Math.sqrt(dx * dx + dy * dy));
    var th = Math.atan2(dx, dy), L = swRopeFit(st, s, h.x, h.y, th, dist);
    s.hook = { i:i, L:L, th:th, om:0 };
    s.x = h.x + L * Math.sin(th); s.y = h.y + L * Math.cos(th);
  }
  return s;
}
/* ボールと フックの あいだに かべが ないか（かべごしには ひもを かけられない）。
   ここを 見て いないと **かべごしに つかんで、つかんだ しゅんかんの いち直しで
   かべの むこうへ すりぬけられる** ―― すきまも こわせる かべも 意味が なくなる
   （2026-08-29 に 見つけた 穴）。 */
function swSightClear(st, s, x0, y0, x1, y1){
  /* かべを **ボールの 大きさぶん ふくらませて** しらべる。
     そうしないと「せんは 通るが ボールは 通れない すきま」の むこうの フックを つかめて しまい、
     つかんだ ときの いち直しで すきまを ワープして しまう（2026-08-29 に 見つけた 穴）。 */
  var r = s.r, n = 20, i, j;
  for (i = 1; i < n; i++){
    var x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
    for (j = 0; j < (st.blocks || []).length; j++){
      var b = st.blocks[j];
      if (s.broken[j]) continue;                  /* こわした かべは もう じゃま しない */
      if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r) return false;
    }
    for (j = 0; j < (st.movers || []).length; j++){
      var mv = st.movers[j];                      /* うごく かべは 上下に うごく はんい ぜんぶで 見る（きびしめ） */
      if (x > mv.x - r && x < mv.x + mv.w + r &&
          y > mv.y - (mv.ay || 0) - r && y < mv.y + mv.h + (mv.ay || 0) + r) return false;
    }
  }
  return true;
}
/* とどく はんいの、いちばん 近い フック（ボールより 上に ある もの） */
function swingNearHook(st, s){
  var best = -1, bd = 1e9;
  st.hooks.forEach(function(h, i){
    var dx = h.x - s.x, dy = h.y - s.y, d = Math.sqrt(dx * dx + dy * dy);
    if (dy > 26) return;                       /* ボールより 下の フックには つかまらない */
    if (d > SW_GRAB || d < 26) return;
    if (!swSightClear(st, s, s.x, s.y, h.x, h.y)) return;   /* かべごしは だめ */
    if (d < bd){ bd = d; best = i; }
  });
  return best;
}
function swingGrab(st, s){
  if (!s.started){ s.started = true; return true; }   /* さいしょの ひと おしで うごきだす */
  if (s.hook || s.dead || s.clear) return false;
  var i = swingNearHook(st, s);
  if (i < 0) return false;
  var h = st.hooks[i], dx = s.x - h.x, dy = s.y - h.y;
  var dist = Math.max(28, Math.sqrt(dx * dx + dy * dy));
  var th = Math.atan2(dx, dy), L = swRopeFit(st, s, h.x, h.y, th, dist);
  /* いち直しの 先まで まっすぐ 行けない なら、うごかさない（かべを ワープ しない） */
  if (!swSightClear(st, s, s.x, s.y, h.x + L * Math.sin(th), h.y + L * Math.cos(th))) L = Math.min(SW_ROPE, dist);
  /* いまの 速さの うち「ひもと 直角の ぶん」だけが 回る 力に なる */
  var om = (s.vx * Math.cos(th) - s.vy * Math.sin(th)) / L;
  s.hook = { i:i, L:L, th:th, om:om };
  s.x = h.x + L * Math.sin(th); s.y = h.y + L * Math.cos(th);
  return true;
}
function swingRelease(s){
  if (!s.hook) return;
  var h = s.hook;
  s.vx = h.om * h.L * Math.cos(h.th);
  s.vy = -h.om * h.L * Math.sin(h.th);
  s.hook = null;
}
/* おもさ／大きさを かえる。ぶら下がって いる あいだだけ できる。
   かえても θ も ω も さわらない ＝ **ゆれ方は まったく かわらない**（ふりこのきまり）。 */
/* かえられるのは **スタート前（まだ うごきだして いない）** と **ぶら下がって いる あいだ**。
   スタート前は フックに とどいて いなくても かならず えらべる（2026-08-29）。 */
function swingCanSet(s){ return !s.started || !!s.hook; }
function swingSetW(st, s, w){
  if (swW(st).indexOf(w) < 0 || !swingCanSet(s) || s.w === w) return false;
  s.w = w; return true;
}
function swingSetR(st, s, r){
  if (swR(st).indexOf(r) < 0 || !swingCanSet(s) || s.r === r) return false;
  s.r = r; return true;
}
/* ひもの 長さを かえる。**ぶら下がった まま かえると その場で ゆれ方が かわる**ので、
   「みじかい ほうが はやく ゆれる」を 目で 見て たしかめられる。
   せっせん方向の 速さは そのままに して、ω ＝ v ÷ L で 回りぐあいを 出しなおす。 */
function swingSetL(st, s, lk){
  if (swL(st).indexOf(lk) < 0 || !swingCanSet(s) || s.lk === lk) return false;
  s.lk = lk;
  if (s.hook){
    var hk = st.hooks[s.hook.i];
    var dx = s.x - hk.x, dy = s.y - hk.y;
    var dist = Math.max(28, Math.sqrt(dx * dx + dy * dy));
    var th = s.hook.th, L2 = swRopeFit(st, s, hk.x, hk.y, th, dist);
    var nx = hk.x + L2 * Math.sin(th), ny = hk.y + L2 * Math.cos(th);
    if (L2 !== s.hook.L){
      var v = Math.abs(s.hook.om) * s.hook.L, sgn = (s.hook.om >= 0 ? 1 : -1);
      s.hook.L = L2; s.hook.om = sgn * v / L2;
      s.x = nx; s.y = ny;
    }
  }
  return true;
}
/* うごく かべの いま の いち。t だけで きまる ので、お手本の さいせいでも まったく 同じ。
   ay ＝ 上下に うごく はば ／ per ＝ 1おうふくの 時間（びょう）。
   **ふりこの しゅうきと 合わせる**と「いつ はなすか」が だいじな 面に なる。 */
function swMoverY(m, t){
  return m.y + (m.ay || 0) * Math.sin(2 * Math.PI * t / (m.per || 2));
}
function swingHit(st, s){
  var B = SWW[s.w], r = s.r, i;
  for (i = 0; i < (st.movers || []).length; i++){
    var mv = st.movers[i], my = swMoverY(mv, s.t);
    if (s.x + r < mv.x || s.x - r > mv.x + mv.w || s.y + r < my || s.y - r > my + mv.h) continue;
    var qxL = (mv.x - r) - s.x, qxR = (mv.x + mv.w + r) - s.x;
    var qyT = (my - r) - s.y, qyB = (my + mv.h + r) - s.y;
    var qx = (Math.abs(qxL) < Math.abs(qxR)) ? qxL : qxR;
    var qy = (Math.abs(qyT) < Math.abs(qyB)) ? qyT : qyB;
    if (s.hook) swingRelease(s);
    if (Math.abs(qx) < Math.abs(qy)){ s.x += qx; s.vx = -s.vx * 0.3; }
    else { s.y += qy; s.vy = -s.vy * 0.3; }
  }
  for (i = 0; i < (st.blocks || []).length; i++){
    var b = st.blocks[i];
    if (s.broken[i]) continue;
    if (s.x + r < b.x || s.x - r > b.x + b.w || s.y + r < b.y || s.y - r > b.y + b.h) continue;
    var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    /* ひび入りブロックは **おもい ボールが 十分な いきおいで** ぶつかった ときだけ こわれる */
    if (b.type === 'brick' && B.hit && sp > 230){ s.broken[i] = 1; s.fx = 10; continue; }
    var pxL = (b.x - r) - s.x, pxR = (b.x + b.w + r) - s.x;
    var pyT = (b.y - r) - s.y, pyB = (b.y + b.h + r) - s.y;
    var px = (Math.abs(pxL) < Math.abs(pxR)) ? pxL : pxR;
    var py = (Math.abs(pyT) < Math.abs(pyB)) ? pyT : pyB;
    if (s.hook) swingRelease(s);
    if (Math.abs(px) < Math.abs(py)){ s.x += px; s.vx = -s.vx * 0.3; }
    else { s.y += py; s.vy = -s.vy * 0.3; }
  }
  for (i = 0; i < (st.spikes || []).length; i++){
    var k = st.spikes[i];
    if (s.x + r > k.x && s.x - r < k.x + k.w && s.y + r > k.y && s.y - r < k.y + k.h){ s.dead = true; s.msg = 'とげに あたった！'; }
  }
  for (i = 0; i < (st.springs || []).length; i++){
    var sp2 = st.springs[i];
    if (s.vy > 0 && s.x + r > sp2.x && s.x - r < sp2.x + sp2.w && s.y + r > sp2.y && s.y - r < sp2.y + 16){
      if (s.hook) swingRelease(s);
      s.y = sp2.y - r - 1; s.vy = -400 * B.spring; s.fx = 8;
    }
  }
}
/* 1こま すすめる。**画面が なくても 動く**（verify.mjs が お手本を 再生して たしかめる） */
function swingStep(st, s, dt){
  if (s.dead || s.clear || !s.started) return;      /* おす まで うごかない */
  var B = SWW[s.w];
  s.t += dt;
  if (s.fx > 0) s.fx--;
  if (s.hook){
    var h = s.hook, hk = st.hooks[h.i];
    h.om += (-(SWG / h.L) * Math.sin(h.th) - SW_DAMP * h.om) * dt;   /* θ'' = -(g/L)sinθ */
    h.th += h.om * dt;
    s.x = hk.x + h.L * Math.sin(h.th);
    s.y = hk.y + h.L * Math.cos(h.th);
    s.vx = h.om * h.L * Math.cos(h.th);
    s.vy = -h.om * h.L * Math.sin(h.th);
    swingHit(st, s);
    if (s.hook && swSolid(st, s, s.x, s.y)){    /* ぶら下がった まま かべに 入りこまない */
      h.th -= h.om * dt; h.om *= -0.2;
      s.x = hk.x + h.L * Math.sin(h.th); s.y = hk.y + h.L * Math.cos(h.th);
    }
  } else {
    s.vy += SWG * dt;
    (st.winds || []).forEach(function(w){
      if (s.x > w.x && s.x < w.x + w.w && s.y > w.y && s.y < w.y + w.h)
        s.vx += w.a * (50 / B.g) * dt;         /* 同じ 力でも かるい ほど 大きく 流される */
    });
    var ox = s.x, oy = s.y;
    s.x += s.vx * dt; s.y += s.vy * dt;
    swingHit(st, s);
    /* まだ かべに めり込んで いたら 元の ばしょへ もどす（すきまを むりやり すりぬけない） */
    if (swSolid(st, s, s.x, s.y)){ s.x = ox; s.y = oy; s.vx *= -0.2; s.vy *= -0.2; }
  }
  var gx = st.goal.x - s.x, gy = st.goal.y - s.y;
  if (Math.sqrt(gx * gx + gy * gy) < st.goal.r + s.r) s.clear = true;
  if (s.y > SW_H + 30){ s.dead = true; s.msg = '下に おちた！'; }
  if (s.x < -30 || s.x > SW_W + 30){ s.dead = true; s.msg = 'そとに 出て しまった！'; }
}
/* お手本（ex）を さいごまで 走らせる。画面なしでも 同じ けっかに なる（時間きざみが 一定）。
   ex は [びょう, 'g'（つかむ）／'r'（はなす）／'b:heavy' など] の ならび。 */
function swingRun(st, script, maxT){
  var s = swingInit(st), k = 0, lim = Math.round((maxT || 20) / SW_DT);
  for (var n = 0; n < lim; n++){
    while (k < script.length && script[k][0] <= s.t + 1e-9){
      var a = script[k][1];
      if (a === 'g') swingGrab(st, s);
      else if (a === 'r') swingRelease(s);
      else if (a.indexOf('w:') === 0) swingSetW(st, s, +a.slice(2));
      else if (a.indexOf('r:') === 0) swingSetR(st, s, +a.slice(2));
      else if (a.indexOf('L:') === 0) swingSetL(st, s, a.slice(2));
      k++;
    }
    swingStep(st, s, SW_DT);
    if (s.clear || s.dead) break;
  }
  return s;
}

function swingStop(){ if (cur.swRaf){ cancelAnimationFrame(cur.swRaf); cur.swRaf = null; } }
function loadSwing(st){
  swingStop();
  /* **えらんだ おもさ・大きさは その もんだいの あいだ ずっと おぼえて おく。**
     しっぱいの たびに もどると えらび直しが めんどう、という 指てきで こうした。
     べつの もんだいに うつったら もとに もどす。 */
  var key = cur.gameId + ':' + cur.si;
  if (cur.swKeepFor !== key){ cur.swKeep = null; cur.swKeepFor = key; }
  cur.sw = swingInit(st, cur.swKeep);
  cur.swDemo = null; cur.swAcc = 0; cur.swLast = 0; cur.swTries = 0;
  cur.swPickHtml = null;
  swingLoop();
}
function swingLoop(){
  swingStop();
  cur.swLast = 0; cur.swAcc = 0;
  var step = function(ts){
    if (cur.kind !== 'swing'){ cur.swRaf = null; return; }
    if (!cur.swLast) cur.swLast = ts;
    var d = Math.min(0.05, (ts - cur.swLast) / 1000);
    cur.swLast = ts; cur.swAcc += d;
    var s = cur.sw, st = curStage();
    while (cur.swAcc >= SW_DT){
      cur.swAcc -= SW_DT;
      if (cur.swDemo){
        while (cur.swDemo.k < cur.swDemo.list.length && cur.swDemo.list[cur.swDemo.k][0] <= s.t + 1e-9){
          var a = cur.swDemo.list[cur.swDemo.k][1];
          if (a === 'g') swingGrab(st, s);
          else if (a === 'r') swingRelease(s);
          else if (a.indexOf('w:') === 0) swingSetW(st, s, +a.slice(2));
          else if (a.indexOf('r:') === 0) swingSetR(st, s, +a.slice(2));
          else if (a.indexOf('L:') === 0) swingSetL(st, s, a.slice(2));
          cur.swDemo.k++;
        }
      }
      swingStep(st, s, SW_DT);
      if (s.dead || s.clear) break;
    }
    renderSwing();
    if (s.clear){ cur.swRaf = null; tryClear(true); return; }
    if (s.dead){
      cur.swRaf = null;
      setTimeout(function(){
        if (cur.kind !== 'swing' || cur.done) return;
        cur.swTries++; cur.sw = swingInit(curStage(), cur.swKeep); cur.swDemo = null; swingLoop();
      }, 850);
      return;
    }
    cur.swRaf = requestAnimationFrame(step);
  };
  cur.swRaf = requestAnimationFrame(step);
}
function swingDemo(){
  var st = curStage();
  if (!st.ex) return;
  cur.noStar = true;                      /* お手本を 見たら パーフェクトは つかない */
  cur.sw = swingInit(st);                 /* お手本は かならず もんだいの さいしょの おもさから */
  cur.swDemo = { list:st.ex, k:0 };
  swingLoop();
}

function renderSwing(){
  setBoardBox(SW_W, SW_H + 44);    /* 上に 44 の あんない帯。えらびボタンは ばんめんの そと（HTML） */
  var st = curStage(), s = cur.sw, B = SWW[s.w], g = '';
  g += '<rect x="0" y="0" width="' + SW_W + '" height="' + SW_H + '" rx="14" fill="#EAF4FA"/>';
  (st.winds || []).forEach(function(w){
    g += '<rect x="' + w.x + '" y="' + w.y + '" width="' + w.w + '" height="' + w.h +
         '" rx="8" fill="#CFE9F7" opacity=".85"/>';
    for (var i = 0; i < 3; i++){
      var yy = w.y + w.h * (i + 1) / 4, dir = w.a > 0 ? 1 : -1;
      g += '<path d="M' + (w.x + 8) + ' ' + yy + ' h' + (w.w - 16) + '" stroke="#6FB6DA" stroke-width="3" stroke-linecap="round" fill="none"/>';
      g += '<path d="M' + (dir > 0 ? w.x + w.w - 8 : w.x + 8) + ' ' + yy + ' l' + (-12 * dir) + ' -6 v12 z" fill="#6FB6DA"/>';
    }
    g += '<text x="' + (w.x + w.w / 2) + '" y="' + (w.y + 16) + '" font-size="11" font-weight="900" fill="#3E88AE" text-anchor="middle">かぜ</text>';
  });
  (st.blocks || []).forEach(function(b, i){
    if (s.broken[i]) return;
    if (b.type === 'brick'){
      g += '<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h +
           '" rx="4" fill="#D99A5B" stroke="#8A5B22" stroke-width="3"/>';
      g += '<path d="M' + (b.x + b.w * .3) + ' ' + b.y + ' l' + (b.w * .18) + ' ' + (b.h * .4) +
           ' l' + (-b.w * .12) + ' ' + (b.h * .3) + ' l' + (b.w * .2) + ' ' + (b.h * .3) +
           '" fill="none" stroke="#7A4A18" stroke-width="2.5" stroke-linejoin="round"/>';
      g += '<text x="' + (b.x + b.w / 2) + '" y="' + (b.y + b.h / 2 + 4) +
           '" font-size="10" font-weight="900" fill="#5E3400" text-anchor="middle">ひび</text>';
    } else {
      g += '<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h +
           '" rx="5" fill="#9AA6B0" stroke="#5D6874" stroke-width="3"/>';
    }
  });
  (st.movers || []).forEach(function(mv){
    var my = swMoverY(mv, s.t);
    g += '<rect x="' + (mv.x - 3) + '" y="' + (mv.y - (mv.ay || 0) - 4) + '" width="' + (mv.w + 6) +
         '" height="' + (mv.h + (mv.ay || 0) * 2 + 8) + '" rx="8" fill="#E7EDF2"/>';
    g += '<rect x="' + mv.x + '" y="' + my.toFixed(1) + '" width="' + mv.w + '" height="' + mv.h +
         '" rx="6" fill="#8B7BE8" stroke="#4E3FA8" stroke-width="3"/>';
    g += '<text x="' + (mv.x + mv.w / 2) + '" y="' + (my + mv.h / 2 + 5).toFixed(1) +
         '" font-size="13" font-weight="900" fill="#fff" text-anchor="middle">↕</text>';
  });
  (st.springs || []).forEach(function(k){
    g += '<rect x="' + k.x + '" y="' + (k.y + 8) + '" width="' + k.w + '" height="10" rx="5" fill="#7E6B54"/>';
    g += '<path d="M' + (k.x + 6) + ' ' + (k.y + 8) + ' q' + (k.w / 4) + ' -14 ' + (k.w / 2) + ' 0 q' +
         (k.w / 4) + ' 14 ' + (k.w / 2 - 6) + ' 0" fill="none" stroke="#2E9A4C" stroke-width="5" stroke-linecap="round"/>';
    g += '<text x="' + (k.x + k.w / 2) + '" y="' + (k.y - 6) + '" font-size="11" font-weight="900" fill="#2E9A4C" text-anchor="middle">ばね</text>';
  });
  (st.spikes || []).forEach(function(k){
    var n = Math.max(1, Math.round(k.w / 14)), d = k.w / n, sp = '';
    for (var i = 0; i < n; i++) sp += 'M' + (k.x + i * d) + ' ' + (k.y + k.h) + ' L' + (k.x + i * d + d / 2) + ' ' + k.y + ' L' + (k.x + (i + 1) * d) + ' ' + (k.y + k.h) + ' ';
    g += '<path d="' + sp + '" fill="#E05A4A" stroke="#9A2D20" stroke-width="2" stroke-linejoin="round"/>';
  });
  /* ゴール */
  g += '<circle cx="' + st.goal.x + '" cy="' + st.goal.y + '" r="' + (st.goal.r + 6) + '" fill="#2E9A4C" opacity=".18"/>';
  g += '<circle cx="' + st.goal.x + '" cy="' + st.goal.y + '" r="' + st.goal.r + '" fill="#CBEFD4" stroke="#2E9A4C" stroke-width="3"/>';
  g += '<text x="' + st.goal.x + '" y="' + (st.goal.y + 8) + '" font-size="22" text-anchor="middle">🏁</text>';
  /* フック（とどく ものは 目立たせる） */
  /* フックは 大きく（2026-08-29 「紐を つける ところが 小さい」の 指てき）。
     verify.mjs が この 大きさで とげ／かべに かさなって いないかを 見はって いる。 */
  var near = s.hook ? s.hook.i : swingNearHook(st, s);
  st.hooks.forEach(function(h, i){
    var on = (i === near);
    if (on) g += '<circle cx="' + h.x + '" cy="' + h.y + '" r="26" fill="#F5B324" opacity=".28"/>';
    g += '<circle cx="' + h.x + '" cy="' + h.y + '" r="' + SW_HOOK + '" fill="' + (on ? '#F5B324' : '#CBD6DE') +
         '" stroke="#5A7C93" stroke-width="4"/>';
    g += '<circle cx="' + h.x + '" cy="' + h.y + '" r="' + (SW_HOOK - 7) + '" fill="none" stroke="' +
         (on ? '#9A6B00' : '#8FA3B8') + '" stroke-width="3"/>';
  });
  /* ひも と ボール */
  if (s.hook){
    var hk = st.hooks[s.hook.i];
    g += '<line x1="' + hk.x + '" y1="' + hk.y + '" x2="' + s.x.toFixed(1) + '" y2="' + s.y.toFixed(1) +
         '" stroke="#5A7C93" stroke-width="4"/>';
  } else if (near >= 0 && !s.dead && !s.clear){
    g += '<line x1="' + st.hooks[near].x + '" y1="' + st.hooks[near].y + '" x2="' + s.x.toFixed(1) + '" y2="' + s.y.toFixed(1) +
         '" stroke="#F5B324" stroke-width="3" stroke-dasharray="5 6" opacity=".8"/>';
  }
  if (s.fx > 0) g += '<circle cx="' + s.x.toFixed(1) + '" cy="' + s.y.toFixed(1) + '" r="' + (s.r + s.fx * 2) + '" fill="#FFD54F" opacity="' + (s.fx / 20).toFixed(2) + '"/>';
  g += '<circle cx="' + s.x.toFixed(1) + '" cy="' + s.y.toFixed(1) + '" r="' + s.r +
       '" fill="' + B.col + '" stroke="' + B.dark + '" stroke-width="3"/>';
  if (s.r >= 11) g += '<text x="' + s.x.toFixed(1) + '" y="' + (s.y + 4).toFixed(1) +
       '" font-size="' + (s.r >= 15 ? 11 : 9) + '" font-weight="900" fill="#fff" text-anchor="middle">' + s.w + 'g</text>';
  if (s.dead) g += '<g transform="translate(300,' + (SW_H / 2) + ')"><rect x="-118" y="-24" width="236" height="46" rx="22" fill="#E05A4A"/>' +
    '<text x="0" y="8" font-size="19" font-weight="900" fill="#fff" text-anchor="middle">' + (s.msg || 'ざんねん') + '</text></g>';
  /* えらびボタン：うえの れつ＝おもさ、したの れつ＝大きさ。
     どちらも **ぶら下がって いる あいだだけ** かえられる。 */
  /* えらびボタンは **SVGでは なく ほんものの HTMLボタン**に した（2026-08-29）。
     SVGの とうめいな あたり判定は ブラウザに よって きかない ことが あり、
     じっさいに Safari で「100gを おしても かわらない」が 起きた。
     HTMLの <button> なら どの ブラウザでも かならず 押せる。 */
  var can = swingCanSet(s) && !s.dead && !s.clear;
  var ph = '';
  if (!s.started && !s.dead) ph += '<div class="sw-note">まず ここで えらぼう（あとから ぶら下がって いる ときも かえられるよ）</div>';
  ph += '<div class="sw-box' + (!s.started && !s.dead ? ' first' : '') + '">';
  function row(items, label, sel, key, draw){
    ph += '<div class="sw-row"><div class="sw-lab">' + label + '</div>';
    items.forEach(function(v){
      var on = (sel === v), d = draw(v);
      ph += '<button class="sw-b' + (on ? ' on' : '') + '" data-' + key + '="' + v + '"' +
            (can || on ? '' : ' disabled') +
            ' style="' + (on ? 'background:' + d.col + ';border-color:' + d.dark + ';' : '') + '">' +
            '<span class="dot" style="width:' + (d.r * 2) + 'px;height:' + (d.r * 2) + 'px;background:' +
            (on ? '#fff' : d.col) + '"></span>' + d.t + '</button>';
    });
    ph += '</div>';
  }
  row(swW(st), 'おもさ', s.w, 'sww', function(v){
    return { col:SWW[v].col, dark:SWW[v].dark, r:8, t:v + 'g' };
  });
  row(swR(st), '大きさ', s.r, 'swr', function(v){
    return { col:'#7E8FA0', dark:'#4A5A6A', r:Math.max(5, Math.round(v * 0.55)), t:SWR[v] };
  });
  row(swL(st), 'ひも', s.lk, 'swl', function(v){
    return { col:'#5FA98C', dark:'#2F6E56', r:7, t:SWL[v] };
  });
  ph += '</div>';
  /* **中みが かわった ときだけ** 作りなおす。
     アニメは 1びょうに 60回 えを かきなおすので、毎回 ボタンを 作りなおすと
     ゆびを はなす まえに ボタンが 入れかわり、**click が 一度も 成立しない**
     （2026-08-29 「100gを おしても かわらない」の 正体は これ）。 */
  var pk = document.getElementById('sw-pick');
  if (pk.className !== 'sw-pick on') pk.className = 'sw-pick on';
  if (cur.swPickHtml !== ph){ pk.innerHTML = ph; cur.swPickHtml = ph; }
  /* 上の あんない帯（ばんめんの そとに 出すので、ばねや かべに かさならない） */
  var top = '';
  if (!s.started && !s.dead && !s.clear){
    top = '<g transform="translate(300,24)"><rect x="-232" y="-20" width="464" height="40" rx="20" fill="#2E9A4C"/>' +
          '<text x="0" y="7" font-size="17" font-weight="900" fill="#fff" text-anchor="middle">おもさ・大きさ・ひもを えらんで ▶ タップ！</text></g>';
  } else if (cur.swDemo){
    top = '<g transform="translate(300,24)"><rect x="-140" y="-20" width="280" height="40" rx="20" fill="#1B7FA8"/>' +
          '<text x="0" y="7" font-size="18" font-weight="900" fill="#fff" text-anchor="middle">お手本を さいせい中</text></g>';
  }
  document.getElementById('board').innerHTML = top + '<g transform="translate(0,44)">' + g + '</g>';
  var msg;
  if (cur.swDemo) msg = 'お手本を 見て いるよ';
  else if (!s.started) msg = 'まず おもさ・大きさ・ひもを えらぼう' +
    (s.hook ? '（ひもの 長さ ' + Math.round(s.hook.L) + '）' : '') + '。ばんめんを タップ すると うごきだすよ';
  else if (s.hook) msg = 'ぶら下がり中（ひもの 長さ ' + Math.round(s.hook.L) +
    '）。いま おもさ・大きさ・ひもを かえられるよ。もう一度 タップ すると はなれて 飛ぶ！';
  else if (near >= 0) msg = 'いま タップ すると きいろい フックに つかまるよ';
  else msg = 'ばんめんを タップ して フックに つかまろう';
  setStatus(msg, false);
}
/* そうさは **かんぜんな タップ式**（2026-08-29 ユーザーの 指てきで こうした）。
     1回目の タップ … ふりこが うごきだす（ついたまま）
     つぎの タップ  … ロープが はなれて 飛ぶ
     そのつぎ       … また 近くの フックに つかまる
   **ゆびを はなしても 切れない。**まえは「300ms いじょう おして はなすと 飛ぶ」も 生かして
   いたが、ばんめんを ちょっと 長めに おしただけで 糸が 切れて しまい、
   ぶら下がった まま おもさを かえる ことが できなかった。 */
function tapSwing(){}   /* えらびボタンは ばんめんの そと（HTML）なので、ここでは 何も しない */
function downSwing(e){
  if (cur.swDemo) return;
  var s = cur.sw;
  if (s.dead || s.clear) return;
  if (!s.started){ s.started = true; renderBoard(); return; }
  if (s.hook) swingRelease(s);                 /* ついて いる → はなれて 飛ぶ */
  else swingGrab(curStage(), s);               /* とんで いる → 近くの フックに つかまる */
  renderBoard();
}
ENGINES.swing = { load:loadSwing, render:renderSwing, tap:tapSwing, down:downSwing, stop:swingStop };  /* up は つかわない（タップ式） */

document.getElementById('sw-pick').addEventListener('click', function(e){
  var el = e.target;
  while (el && el !== this && !(el.getAttribute && (el.getAttribute('data-sww') || el.getAttribute('data-swr') || el.getAttribute('data-swl')))) el = el.parentNode;
  if (!el || el === this) return;
  if (cur.kind !== 'swing' || cur.swDemo || cur.done) return;
  var w = el.getAttribute('data-sww'), r = el.getAttribute('data-swr');
  var lk = el.getAttribute('data-swl');
  if (w) swingSetW(curStage(), cur.sw, +w);
  else if (r) swingSetR(curStage(), cur.sw, +r);
  else if (lk) swingSetL(curStage(), cur.sw, lk);
  cur.swKeep = { w:cur.sw.w, r:cur.sw.r, lk:cur.sw.lk };   /* しっぱいしても この えらびを のこす */
  renderBoard();
});
/* ふりこアクションの「こたえの れい」は 文では なく **お手本の さいせい**。
   ex は verify.mjs が 画面なしで 走らせて「ほんとうに ゴールする」ことを たしかめて いる。 */
function hintAnswerSwing(st){
  if (!st.ex) return '';
  return '<details class="ans"><summary>▶ それでも こまったら「お手本」を 見る</summary>' +
    '<div class="ans-in">じどうで 1回 あそんで みせるよ。よく 見て、同じ タイミングで やって みよう。' +
    '<div style="margin-top:8px"><button class="mini" id="sw-demo">▶ お手本を さいせい</button></div>' +
    '<div class="ans-note">これは クリアの しかたの <b>1つ</b>。ほかの コースでも ゴールすれば せいかいだよ。' +
    'お手本を 見ると パーフェクト（★）は つかないので、まずは 自分で ためして みてね。</div></div></details>';
}
ENGINES.swing.hintAnswer = hintAnswerSwing;

/* ヒントの 中の「▶ お手本を さいせい」ボタンを つなぐ（ヒントを 出しなおす たびに よばれる）。 */
ENGINES.swing.hintBind = function(){
  var dm = document.getElementById('sw-demo');
  if (dm) dm.onclick = function(){ swingDemo(); };
};
