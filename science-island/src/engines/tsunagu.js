/* ---- つなぐ型：回路モード（第1段で 作ったもの） ---- */
function loadCircuit(st){
  cur.parts = st.parts.map(function(p){
    var q = { id:p.id, type:p.type, gx:p.gx, gy:p.gy };
    if (p.type === 'switch') q.on = (p.on === true);
    return q;
  });
  cur.wires = (st.wires || []).map(function(w){ return [w[0], w[1]]; });
}
function renderCircuit(){
  setBoardBox(600, 380);
  var res = evalCircuit(cur.parts, cur.wires, null);
  var s = '';
  /* せん（ぶひんの 下に かく） */
  cur.wires.forEach(function(w, i){
    var a = findTerm(cur.parts, w[0]), b = findTerm(cur.parts, w[1]);
    if (!a || !b) return;
    var d = wireD(a, b);
    s += '<path d="' + d + '" fill="none" stroke="' + (res.short ? '#E05A4A' : '#5A7C93') +
         '" stroke-width="8" stroke-linecap="round"/>';
    s += '<path d="' + d + '" fill="none" stroke="transparent" stroke-width="30" data-w="' + i + '"/>';
  });
  /* 名まえを 出すか どうか。おなじ しゅるいが 2つ いじょう ある ときだけ id（l1・m1…）を
     出し、1つしか ない ものは「モーター」「けんりゅうけい」と 書く。 */
  var nType = {};
  cur.parts.forEach(function(p){ nType[p.type] = (nType[p.type] || 0) + 1; });
  var lampCount = nType.lamp || 0;
  /* おなじ ぶひんの 両はしを つないだ せんが ある ぶひんは、名まえを 出さない
     （せんが 大きく ふくらむので 字と かさなって しまう） */
  var looped = {};
  cur.wires.forEach(function(w){
    var a = w[0].split(':')[0], b = w[1].split(':')[0];
    if (a === b) looped[a] = 1;
  });
  /* ぶひん */
  var OFFR = { i:0, cat:'off', dir:'none' };
  cur.parts.forEach(function(p){
    var r = res.short ? OFFR : res.lamps[p.id];
    if (p.type === 'battery') s += svgBattery(p, !looped[p.id]);
    else if (p.type === 'lamp') s += svgLamp(p, r.cat, lampCount > 1 && !looped[p.id]);
    else if (p.type === 'motor') s += svgMotor(p, r, looped[p.id] ? '' : (nType.motor > 1 ? p.id : 'モーター'));
    else if (p.type === 'galv') s += svgGalv(p, r, looped[p.id] ? '' : (nType.galv > 1 ? p.id : 'けんりゅうけい'));
    else if (p.type === 'switch') s += svgSwitch(p);
  });
  /* はしっこ（たんし） */
  termList(cur.parts).forEach(function(t){
    var on = (cur.sel === t.id);
    if (on) s += '<circle cx="' + t.x + '" cy="' + t.y + '" r="20" fill="#1B7FA8" opacity=".22"/>';
    s += '<circle cx="' + t.x + '" cy="' + t.y + '" r="' + (on ? 12 : 9) + '" fill="' +
         (on ? '#1B7FA8' : '#fff') + '" stroke="#5A7C93" stroke-width="4"/>';
    s += '<circle cx="' + t.x + '" cy="' + t.y + '" r="30" fill="transparent" data-t="' + t.id + '"/>';
  });
  if (res.short){
    var badge = res.reason === 'over' ? '⚡ ながれすぎ！' : '⚡ ショート！';
    s += '<g transform="translate(300,32)"><rect x="-96" y="-22" width="192" height="42" rx="21" fill="#E05A4A"/>' +
         '<text x="0" y="7" font-size="19" font-weight="900" fill="#fff" text-anchor="middle">' + badge + '</text></g>';
  }
  document.getElementById('board').innerHTML = s;

  /* したの ひとこと */
  var msg = '', cls = 'status';
  if (res.short){
    msg = res.reason === 'over'
      ? 'でんきの ちかみちが できて、ながれすぎて いるよ（ほんものなら こわれる つなぎ方）'
      : 'でんきゅうを とおらずに ＋と−が つながっているよ';
    cls = 'status short';
  } else {
    var lit = 0, weak = 0, spin = 0, all = 0;
    cur.parts.forEach(function(p){
      var r = res.lamps[p.id];
      if (!r) return;
      if (p.type === 'lamp'){
        all++;
        if (r.cat === 'full' || r.cat === 'bright') lit++;
        else if (r.cat !== 'off'){ lit++; weak++; }
      } else if (p.type === 'motor'){ all++; if (r.cat !== 'off') spin++; }
    });
    var m = [];
    if (lit) m.push('でんきゅうが ' + lit + 'こ ついた！' + (weak ? '（' + weak + 'こは くらい）' : ''));
    if (spin) m.push('モーターが ' + spin + 'こ 回って いる！');
    if (m.length) msg = m.join('　');
    else if (all) msg = 'まだ ついて いないよ';
  }
  setStatus(msg, cls !== 'status');
  tryClear(checkGoal(curStage(), cur.parts, cur.wires));
}

function tapCircuit(e){
  var sw = attrUp(e.target, 'data-sw');
  if (sw !== null){
    cur.parts.forEach(function(p){ if (p.id === sw) p.on = !p.on; });
    cur.sel = null; renderBoard(); return;
  }
  var wi = attrUp(e.target, 'data-w');
  if (wi !== null){ cur.wires.splice(parseInt(wi, 10), 1); cur.sel = null; renderBoard(); return; }
  var t = attrUp(e.target, 'data-t');
  if (t !== null){
    if (cur.sel === null){ cur.sel = t; }
    else if (cur.sel === t){ cur.sel = null; }
    else {
      if (hasWire(cur.sel, t)){
        cur.wires = cur.wires.filter(function(w){ return !sameWire(w, cur.sel, t); });
      } else {
        cur.wires.push([cur.sel, t]);
      }
      cur.sel = null;
    }
    renderBoard(); return;
  }
  if (cur.sel !== null){ cur.sel = null; renderBoard(); }
}
ENGINES.tsunagu = { load:loadCircuit, render:renderCircuit, tap:tapCircuit };

/* ---- ヒントの「こたえの れい」（つなぐ型だけの もの）---- */
/* ぶひんの 名まえを、子どもが ばんめんで 見て 分かる ことばに する。
   おなじ しゅるいが 2つ いじょう ある ときは、ならんで いる いちで ひだり／まん中／みぎ を つける
   （ばんめんに 出て いる 名ふだと 合わせる ため。lamp は l1・l2 の 名ふだが 出て いる）。 */
function partLabel(parts, id){
  var p = null, same = [];
  parts.forEach(function(q){ if (q.id === id) p = q; });
  if (!p) return id;
  parts.forEach(function(q){ if (q.type === p.type) same.push(q); });
  same.sort(function(x, y){ return x.gx - y.gx; });
  var base = { battery:'かんでんち', lamp:'でんきゅう', motor:'モーター',
               galv:'けんりゅうけい', 'switch':'スイッチ' }[p.type] || p.id;
  if (same.length < 2) return base;
  /* 2こ いじょう ある とき、ばんめんに 名ふだ（l1・m1・g1）が 出る ものは その 名ふだで よぶ。
     名ふだが 出ない かんでんち・スイッチだけ「ひだりの／みぎの」で よぶ。
     （でんきゅうを「ひだりの でんきゅう l1 の ひだりの ○」と よぶと ひだりが 2回 出て 分からなく なる） */
  if (p.type === 'lamp' || p.type === 'motor' || p.type === 'galv') return base + ' ' + p.id;
  var pos = same.length === 3 ? ['ひだりの ', 'まん中の ', 'みぎの '] : ['ひだりの ', 'みぎの '];
  return (pos[same.indexOf(p)] || '') + base;
}
function termLabel(parts, t){
  var a = t.split(':'), p = null;
  parts.forEach(function(q){ if (q.id === a[0]) p = q; });
  var side = (p && p.type === 'battery') ? (a[1] === 'p' ? '＋がわの ○' : '−がわの ○')
                                         : (a[1] === 'a' ? 'ひだりの ○' : 'みぎの ○');
  var nm = partLabel(parts, a[0]);
  return nm + (/[0-9a-zA-Z]$/.test(nm) ? ' の ' : 'の ') + side;   /* l1 の あとは 空きを 入れる */
}
/* ヒントの「こたえの れい」の 手じゅんを 作る。
   ex は **さいごの すがた**（どの はしっこ どうしが つながって いれば いいか）。
   もんだいに よっては **さいしょから せんが 引いて ある**（だい5もんの ショート）ので、
   いまの すがた（st.wires）と くらべて「消す せん」と「つなぐ せん」に 分ける。
   ここを ただ「ぜんぶ つなごう」に すると、**すでに ある せんを タップ して 消して しまい、
   ヒントの とおりに やったのに クリアできない**（2026-08-28 の テストプレイで じっさいに 出た）。 */
function hintSteps(st){
  if (!st.ex) return [];
  var now = st.wires || [], out = [];
  function same(w, a, b){ return (w[0] === a && w[1] === b) || (w[0] === b && w[1] === a); }
  function inList(list, a, b){
    for (var i=0;i<list.length;i++){ if (same(list[i], a, b)) return true; }
    return false;
  }
  now.forEach(function(w){ if (!inList(st.ex, w[0], w[1])) out.push({ op:'del', a:w[0], b:w[1] }); });
  st.ex.forEach(function(w){ if (!inList(now, w[0], w[1])) out.push({ op:'add', a:w[0], b:w[1] }); });
  return out;
}

/* ヒントの 中に 入れる「こたえの れい」。**かならず ex から 作る**こと（手で 書くと ずれる）。 */
function hintAnswerTsunagu(st){
  if (!st.ex || !st.parts) return '';
  var steps = hintSteps(st), li = '';
  steps.forEach(function(s){
    li += (s.op === 'del')
      ? '<li><b>' + termLabel(st.parts, s.a) + '</b> と <b>' + termLabel(st.parts, s.b) +
        '</b> を つないで いる せんを タップ して <b>消す</b></li>'
      : '<li><b>' + termLabel(st.parts, s.a) + '</b> → <b>' + termLabel(st.parts, s.b) +
        '</b> の じゅんに タップ して <b>つなぐ</b></li>';
  });
  var hasSw = st.parts.some(function(p){ return p.type === 'switch'; });
  return '<details class="ans"><summary>▶ それでも こまったら「こたえの れい」を 見る</summary>' +
    '<div class="ans-in">つぎの じゅんに やって みよう。' +
    '<ol>' + li + '</ol>' +
    '<div class="ans-note">じゅんばんは どれからでも いいよ。これは こたえの <b>1つ</b>で、ほかの つなぎ方でも せいかいに なる ことが あるよ。' +
    (hasSw ? 'つないだら スイッチも タップ して 入／切を たしかめてね。' : '') + '</div></div></details>';
}
ENGINES.tsunagu.hintAnswer = hintAnswerTsunagu;
