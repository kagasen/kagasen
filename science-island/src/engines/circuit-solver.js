/* ------------------------------------------------------------------ *
 * 4. 回路ソルバ（つなぐ型のうらがわ）
 *
 *    やっていること：
 *      ① 導線と 入っているスイッチで 端子を くっつける（Union-Find）→「節点」
 *      ② でんちの ＋と− が おなじ節点 ＝ ショート
 *      ③ そうでなければ 節点解析（MNA）で 連立方程式を といて 電流を出す
 *    ここを ちゃんと 物理で といて いるので、「直列は くらい・並列は 明るい・
 *    ショートは つかない」が データを 手で 用意しなくても 正しく 出る。
 * ------------------------------------------------------------------ */
function makeUF(){
  var p = {};
  function find(x){
    if (p[x] === undefined) p[x] = x;
    while (p[x] !== x){ p[x] = p[p[x]]; x = p[x]; }
    return x;
  }
  function uni(a,b){ a = find(a); b = find(b); if (a !== b) p[a] = b; }
  return { find:find, uni:uni };
}

function gauss(A, z){
  var n = z.length, i, j, k;
  for (i=0;i<n;i++){
    var piv = i;
    for (j=i+1;j<n;j++) if (Math.abs(A[j][i]) > Math.abs(A[piv][i])) piv = j;
    if (Math.abs(A[piv][i]) < 1e-10) return null;       // とけない（＝おかしな つなぎ方）
    if (piv !== i){ var t = A[piv]; A[piv] = A[i]; A[i] = t; var tz = z[piv]; z[piv] = z[i]; z[i] = tz; }
    for (j=i+1;j<n;j++){
      var f = A[j][i] / A[i][i];
      if (f === 0) continue;
      for (k=i;k<n;k++) A[j][k] -= f * A[i][k];
      z[j] -= f * z[i];
    }
  }
  var x = [];
  for (i=0;i<n;i++) x.push(0);
  for (i=n-1;i>=0;i--){
    var s = z[i];
    for (j=i+1;j<n;j++) s -= A[i][j] * x[j];
    x[i] = s / A[i][i];
  }
  return x;
}

/* ひとつながりの かたまり（連結成分）ごとに といて、節点の 電圧を かえす */
function solveComponent(nodes, elems){
  var V = {}, I = {}, i;
  var vs = elems.filter(function(e){ return e.type === 'V'; });
  if (!vs.length){ nodes.forEach(function(n){ V[n] = 0; }); return { V:V, I:I }; }
  var gnd = vs[0].b;
  var idx = {}, c = 0;
  nodes.forEach(function(n){ if (n !== gnd){ idx[n] = c++; } });
  var m = vs.length, size = c + m;
  var A = [], z = [];
  for (i=0;i<size;i++){ var row = []; for (var j=0;j<size;j++) row.push(0); A.push(row); z.push(0); }
  function ix(n){ return n === gnd ? -1 : idx[n]; }
  elems.forEach(function(e){
    if (e.type !== 'R') return;
    var g = 1 / e.value, a = ix(e.a), b = ix(e.b);
    if (a >= 0) A[a][a] += g;
    if (b >= 0) A[b][b] += g;
    if (a >= 0 && b >= 0){ A[a][b] -= g; A[b][a] -= g; }
  });
  vs.forEach(function(e, k){
    var a = ix(e.a), b = ix(e.b), r = c + k;
    if (a >= 0){ A[a][r] += 1; A[r][a] += 1; }
    if (b >= 0){ A[b][r] -= 1; A[r][b] -= 1; }
    z[r] = e.value;
  });
  var x = size ? gauss(A, z) : [];
  if (!x) return null;
  V[gnd] = 0;
  nodes.forEach(function(n){ if (n !== gnd) V[n] = x[idx[n]]; });
  vs.forEach(function(e, k){ I[e.id] = x[c + k]; });   /* でんちを ながれる でんりゅう */
  return { V:V, I:I };
}

/* parts / wires から 各でんきゅう・モーター・けんりゅうけいの ようすを 出す。
   swOverride を わたすと、そのスイッチの 入切を むりやり その状態に して しらべる
   （「スイッチを 切ったら きえる？」の 判定に つかう）。

   かえりち:
     lamps[id] = { i:でんりゅう(A), cat:iCat の 5だんかい, dir:'right'|'left'|'none' }
                 （でんきゅう・モーター・けんりゅうけい ぜんぶ ここに 入る。名まえは 第1段からの なごり）
     used[id]  = その ぶひんに でんきが ながれて いるか（でんちも 見る。並列でんちの 判定に つかう）
     short     = ＋−が じかに つながった／とけない つなぎ方／ながれすぎ
     reason    = 'short'（ちょくせつ つながって いる）／'over'（ながれすぎ） */
function evalCircuit(parts, wires, swOverride){
  var uf = makeUF(), i;
  parts.forEach(function(p){
    if (p.type === 'switch'){
      var on = p.on;
      if (swOverride && swOverride[p.id] !== undefined) on = swOverride[p.id];
      if (on) uf.uni(p.id + ':a', p.id + ':b');
    }
  });
  wires.forEach(function(w){ uf.uni(w[0], w[1]); });

  /* 節点に 番号を ふる */
  var nodeOf = {}, nodeNo = {}, nCount = 0;
  function node(term){
    var r = uf.find(term);
    if (nodeNo[r] === undefined) nodeNo[r] = nCount++;
    nodeOf[term] = nodeNo[r];
    return nodeNo[r];
  }
  var elems = [], shorted = false, reason = 'short';
  var battGroups = [], battKey = {};
  var RES = { lamp:LAMP_R, motor:MOTOR_R, galv:GALV_R };
  parts.forEach(function(p){
    if (p.type === 'battery'){
      var a = node(p.id + ':p'), b = node(p.id + ':m');
      if (a === b){ shorted = true; return; }           // ＋と−が じかに つながっている
      /* おなじ 2つの 節点に つないだ でんちは 1つに まとめる ＝ 並列つなぎ。
         （まとめないと 式が とけなく なる。実さいの 電圧も 1こぶんの ままで 正しい）
         むきが ぎゃくの ものが まざって いたら、でんち どうしで ショート。 */
      var k = Math.min(a, b) + '/' + Math.max(a, b), gr = battKey[k];
      if (!gr){
        gr = battKey[k] = { type:'V', a:a, b:b, value:BATT_V, id:p.id, ids:[] };
        battGroups.push(gr); elems.push(gr);
      } else if (gr.a !== a){ shorted = true; return; }
      gr.ids.push(p.id);
    } else if (RES[p.type] !== undefined){
      elems.push({ type:'R', a:node(p.id + ':a'), b:node(p.id + ':b'), value:RES[p.type], id:p.id });
    } else if (p.type === 'switch'){
      node(p.id + ':a'); node(p.id + ':b');
    }
  });

  var lamps = {}, used = {};
  parts.forEach(function(p){
    if (RES[p.type] !== undefined) lamps[p.id] = { i:0, cat:'off', dir:'none' };
    used[p.id] = false;
  });
  function allOff(){
    var z = {};
    Object.keys(lamps).forEach(function(k){ z[k] = { i:0, cat:'off', dir:'none' }; });
    return z;
  }
  if (shorted) return { lamps:lamps, used:used, short:true, reason:'short' };

  /* 連結成分に わける（べつべつの 回路が あっても ちゃんと とける） */
  var adj = {};
  for (i=0;i<nCount;i++) adj[i] = [];
  elems.forEach(function(e){ adj[e.a].push(e.b); adj[e.b].push(e.a); });
  var seen = {}, volts = {}, srcI = {};
  for (i=0;i<nCount;i++){
    if (seen[i]) continue;
    var comp = [], q = [i]; seen[i] = 1;
    while (q.length){
      var v = q.shift(); comp.push(v);
      adj[v].forEach(function(u){ if (!seen[u]){ seen[u] = 1; q.push(u); } });
    }
    var sub = elems.filter(function(e){ return comp.indexOf(e.a) >= 0; });
    var sol = solveComponent(comp, sub);
    if (!sol) return { lamps:lamps, used:used, short:true, reason:'short' };  // とけない つなぎ方＝あぶない
    comp.forEach(function(n){ volts[n] = sol.V[n]; });
    Object.keys(sol.I).forEach(function(k){ srcI[k] = sol.I[k]; });
  }

  var over = false;
  elems.forEach(function(e){
    if (e.type !== 'R') return;
    var cur = (volts[e.a] - volts[e.b]) / e.value;      // ＋なら a→b の むきに ながれて いる
    if (Math.abs(cur) > MAX_I) over = true;
    var cat = iCat(Math.abs(cur) / REF_I);
    lamps[e.id] = { i:Math.abs(cur), cat:cat, dir: cat === 'off' ? 'none' : (cur > 0 ? 'right' : 'left') };
    if (cat !== 'off') used[e.id] = true;
  });
  battGroups.forEach(function(gr){
    if (Math.abs(srcI[gr.id] || 0) > 1e-9) gr.ids.forEach(function(id){ used[id] = true; });
  });
  if (over) return { lamps:allOff(), used:used, short:true, reason:'over' };
  return { lamps:lamps, used:used, short:false };
}

/* ステージの goal を みたして いるか。
   goal.checks …… ぜんぶ みたせば せいかい。
   goal.anyOf  …… checks の くみを いくつか ならべて、どれか 1くみ 通れば せいかい。
     「どの でんきゅうを 消しても いい」「どちらの スイッチが どちらでも いい」のように
     **おなじ 勉強に なる こたえが いくつも ある** もんだいで つかう。
     ここを 決めうちに すると、まちがって いない こたえが ×に なって しまう（2026-08-28）。 */
function checkGoal(stage, parts, wires){
  var goal = stage.goal;
  if (goal.maxWires !== undefined && wires.length > goal.maxWires) return false;
  if (goal.anyOf){
    for (var k=0;k<goal.anyOf.length;k++){ if (checkSet(goal.anyOf[k], parts, wires)) return true; }
    return false;
  }
  return checkSet(goal.checks, parts, wires);
}
function checkSet(checks, parts, wires){
  for (var c=0;c<checks.length;c++){
    var ck = checks[c];
    var r = evalCircuit(parts, wires, ck.sw);
    if (r.short) return false;
    var ok = true;
    (ck.on  || []).forEach(function(id){ if (r.lamps[id].cat === 'off') ok = false; });
    (ck.off || []).forEach(function(id){ if (r.lamps[id].cat !== 'off') ok = false; });
    var br = ck.bright || {};
    Object.keys(br).forEach(function(id){ if (r.lamps[id].cat !== br[id]) ok = false; });
    var dr = ck.dir || {};                    /* モーターの 回る むき／けんりゅうけいの はりの むき */
    Object.keys(dr).forEach(function(id){ if (r.lamps[id].dir !== dr[id]) ok = false; });
    /* sameDir …… むきが「そろって いる」ことだけを 見る。みぎ どうし でも ひだり どうし でも せいかい。
       もんだいが「同じ むきに」と 言って いるのに かた方の むきを 決めうちに すると、
       べつに まちがって いない こたえが ×に なって しまう（2026-08-28 に 直した）。 */
    var sd = ck.sameDir || [];
    if (sd.length){
      var d0 = r.lamps[sd[0]].dir;
      if (d0 === 'none') ok = false;
      sd.forEach(function(id){ if (r.lamps[id].dir !== d0) ok = false; });
    }
    /* used …… その ぶひんに でんきが ながれて いるか。並列に つないだ でんち2こは
       でんき的には 1こと 見分けが つかないので、「2こ とも つかって いるか」を これで 見る。 */
    (ck.used || []).forEach(function(id){ if (!r.used[id]) ok = false; });
    if (!ok) return false;
  }
  return true;
}
