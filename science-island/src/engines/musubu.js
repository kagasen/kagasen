/* ================================================================== *
 * むすぶ型 — 2つの ものを せんで むすんで 対応づける
 *   nodes は kind:'orbit'（き道の 上。p で ばしょが きまる）と
 *   kind:'card'（下に ならぶ こたえの カード。ばしょは まいかい シャッフル）。
 *   1つの ノードには せんは 1本まで（＝1対1の 対応）。
 * ================================================================== */
var MB = { ex:300, ey:170, R:95, cardY:372, r:22 };

/* ばめん（scene）で 「どこに ならべるか・はいけいは 何か」を さしかえる。
   むすび方の 判定（musubuOK）は ばめんに よらず 同じ。
   あたらしい ばめんを 足すときは MB_SCENES に 1つ 足すだけ。
     answerKind … シャッフルする がわの kind（こたえの カード）
     boardH()   … ばんの 高さ      bg()  … はいけい
     pos(nd)    … ノードの ばしょ  node(nd, sel) … ノードの え（タップ はんいも 中に）
     wire(a,b)  … せんの かたち */
var MB_SCENES = {};
function mbScene(){ return MB_SCENES[curStage().scene || 'moon']; }
function mbPos(nd){ return mbScene().pos(nd); }
function mbNode(id){ for (var i=0;i<cur.parts.length;i++){ if (cur.parts[i].id === id) return cur.parts[i]; } return null; }
function mbSel(nd){ return cur.sel === nd.id; }

/* ---------------- ばめん①：月（き道 ↔ 見える形） ---------------- */
function mbWireD(a, b){
  var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx*dx + dy*dy) || 1;
  var nx = -dy / len, ny = dx / len;
  var away = ((mx - MB.ex) * nx + (my - MB.ey) * ny) >= 0 ? 1 : -1;
  var bow = Math.min(48, len * 0.2) * away;      /* 地球を よけて そとがわに ふくらませる */
  return 'M' + a.x + ' ' + a.y + ' Q' + (mx + nx*bow*2) + ' ' + (my + ny*bow*2) + ' ' + b.x + ' ' + b.y;
}
MB_SCENES.moon = {
  answerKind:'card',
  boardH: function(){ return 430; },
  wire: mbWireD,
  pos: function(nd){
    if (nd.kind === 'orbit'){
      var th = 2 * Math.PI * nd.p;                 /* 画面では 反時計まわり＝北極の上から 見た むき */
      return { x: MB.ex + MB.R * Math.cos(th), y: MB.ey - MB.R * Math.sin(th) };
    }
    var c = cur.cardOrder.length;
    var i = cur.cardOrder.indexOf(nd.id);
    return { x: 300 + (i - (c - 1) / 2) * (520 / c), y: MB.cardY };
  },
  bg: function(){
    var s = '';
    /* 太陽は みぎ、地球は まん中、月は き道の 上 */
    s += '<defs><radialGradient id="sung"><stop offset="0" stop-color="#FFF3C4"/><stop offset="1" stop-color="#F5B324"/></radialGradient></defs>';
    s += '<circle cx="605" cy="' + MB.ey + '" r="72" fill="url(#sung)"/>';
    for (var i=0;i<7;i++){
      var yy = MB.ey - 96 + i * 32;
      s += '<line x1="524" y1="' + yy + '" x2="486" y2="' + yy + '" stroke="#F5B324" stroke-width="5" stroke-linecap="round" opacity=".7"/>';
      s += '<path d="M486 ' + yy + ' l12 -6 v12 Z" fill="#F5B324" opacity=".7"/>';
    }
    s += '<text x="566" y="' + (MB.ey + 6) + '" font-size="15" font-weight="900" fill="#8A5B00" text-anchor="middle">太陽</text>';
    s += '<circle cx="' + MB.ex + '" cy="' + MB.ey + '" r="' + MB.R +
         '" fill="none" stroke="#C3D0DA" stroke-width="3" stroke-dasharray="7 8"/>';
    /* き道を まわる むき。北極の 上から 見ると 反時計まわり（画面でも 反時計まわり）。
       太陽がわ（新月の いち）から 上（上げんの いち）へ むかう やじるしに して、
       どちらまわりか ひと目で わかるように する。 */
    var aa = -10 * Math.PI / 180, ab = -80 * Math.PI / 180, ar = 56;
    var ax1 = MB.ex + ar * Math.cos(aa), ay1 = MB.ey + ar * Math.sin(aa);
    var ax2 = MB.ex + ar * Math.cos(ab), ay2 = MB.ey + ar * Math.sin(ab);
    s += '<path d="M' + ax1.toFixed(1) + ' ' + ay1.toFixed(1) + ' A' + ar + ',' + ar + ' 0 0,0 ' +
         ax2.toFixed(1) + ' ' + ay2.toFixed(1) + '" fill="none" stroke="#9FB4C4" stroke-width="4" stroke-linecap="round"/>';
    var atan = Math.atan2(-Math.cos(ab), Math.sin(ab)) * 180 / Math.PI;   /* すすむ むき */
    s += '<g transform="translate(' + ax2.toFixed(1) + ',' + ay2.toFixed(1) + ') rotate(' + atan.toFixed(1) + ')">' +
         '<path d="M2 0 L-11 -7 L-11 7 Z" fill="#9FB4C4"/></g>';
    /* 文字は 入れない。き道ぞいの やじるしだけで むきは 伝わるし、
       ア〜エ の 名まえと かさなって しまうため。 */
    /* 目じるし（つなげない）。「新月は どこ？」の 手がかりに つかう */
    (curStage().ghosts || []).forEach(function(gh){
      var gth = 2 * Math.PI * gh.p;
      var gx = MB.ex + MB.R * Math.cos(gth), gy = MB.ey - MB.R * Math.sin(gth);
      s += '<circle cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) +
           '" r="13" fill="#EEF3F7" stroke="#C3D0DA" stroke-width="3" stroke-dasharray="5 4"/>';
      s += '<text x="' + (MB.ex + (MB.R + 22) * Math.cos(gth)).toFixed(1) + '" y="' +
           (MB.ey - (MB.R + 22) * Math.sin(gth) + 5).toFixed(1) +
           '" font-size="12" font-weight="900" fill="#9FB4C4" text-anchor="middle">' + gh.label + '</text>';
    });
    s += '<circle cx="' + MB.ex + '" cy="' + MB.ey + '" r="26" fill="#3EA7D8" stroke="#1B7FA8" stroke-width="3"/>';
    s += '<text x="' + MB.ex + '" y="' + (MB.ey + 6) + '" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">地球</text>';
    return s;
  },
  node: function(nd, sel){
    var pos = mbPos(nd), s = '';
    s += '<g transform="translate(' + pos.x + ',' + pos.y + ')">';
    if (sel) s += '<circle cx="0" cy="0" r="' + (nd.kind === 'card' ? 40 : 32) + '" fill="#1B7FA8" opacity=".2"/>';
    if (nd.kind === 'orbit'){
      /* 上から 見た 月。光って いるのは いつも 太陽の ほう（＝みぎ半分） */
      s += '<circle cx="0" cy="0" r="' + MB.r + '" fill="#2F3F52"/>';
      s += '<path d="M0,' + (-MB.r) + ' A' + MB.r + ',' + MB.r + ' 0 0,1 0,' + MB.r + ' Z" fill="#FFF3C4"/>';
      s += '<circle cx="0" cy="0" r="' + MB.r + '" fill="none" stroke="' + (sel ? '#1B7FA8' : '#8FA3B8') +
           '" stroke-width="' + (sel ? 5 : 3) + '"/>';
      /* 名まえは 中心から 見て そとがわ。まん中が こみあわない */
      var lth = 2 * Math.PI * nd.p;
      s += '<text x="' + (Math.cos(lth) * (MB.r + 20)).toFixed(1) + '" y="' +
           (-Math.sin(lth) * (MB.r + 20) + 6).toFixed(1) +
           '" font-size="17" font-weight="900" fill="#3B5A70" text-anchor="middle">' + nd.label + '</text>';
    } else {
      s += '<rect x="-36" y="-32" width="72" height="64" rx="12" fill="#fff" stroke="' +
           (sel ? '#1B7FA8' : '#B9C6D1') + '" stroke-width="' + (sel ? 5 : 3) + '"/>';
      s += itemArt(nd.art, 22);
      s += '<text x="0" y="48" font-size="12" font-weight="900" fill="#3B5A70" text-anchor="middle">' + nd.label + '</text>';
    }
    s += '<circle cx="0" cy="0" r="36" fill="transparent" data-t="' + nd.id + '"/>';
    s += '</g>';
    return s;
  }
};

/* ---------------- ばめん②：左右2れつ（ようす ↔ けっか） ----------------
   長い ことばどうしを むすぶ ときは、ならべる より 2れつの ほうが 見やすい。
   nodes の kind は 'L'（ひだり・じゅんばんは データどおり）と 'R'（みぎ・まいかい シャッフル）。
   ことばは lines に 1行ずつ 書く（じどうで おりかえさない。行を きめた ほうが きれい）。 */
var MF = { top:78, row:86, lx:150, rx:450, w:238, h:64 };
function mfRows(){ return cur.parts.filter(function(n){ return n.kind === 'L'; }).length; }
MB_SCENES.flow = {
  answerKind:'R',
  boardH: function(){ return MF.top + (mfRows() - 1) * MF.row + MF.h / 2 + 26; },
  pos: function(nd){
    if (nd.kind === 'L'){
      var i = 0, k = 0;
      cur.parts.forEach(function(n){ if (n.kind === 'L'){ if (n.id === nd.id) i = k; k++; } });
      return { x: MF.lx, y: MF.top + i * MF.row };
    }
    var j = cur.cardOrder.indexOf(nd.id);
    return { x: MF.rx, y: MF.top + j * MF.row };
  },
  bg: function(){
    var s = '';
    s += '<text x="' + MF.lx + '" y="40" font-size="14" font-weight="900" fill="#8FA3B8" text-anchor="middle">' +
         (curStage().leftTitle || '') + '</text>';
    s += '<text x="' + MF.rx + '" y="40" font-size="14" font-weight="900" fill="#8FA3B8" text-anchor="middle">' +
         (curStage().rightTitle || '') + '</text>';
    return s;
  },
  wire: function(a, b){
    var x1 = a.x + MF.w / 2, x2 = b.x - MF.w / 2;      /* はこの うちがわの はしから はしへ */
    return 'M' + x1 + ' ' + a.y + ' C' + (x1 + 34) + ' ' + a.y + ' ' + (x2 - 34) + ' ' + b.y + ' ' + x2 + ' ' + b.y;
  },
  node: function(nd, sel){
    var pos = mbPos(nd), hw = MF.w / 2, hh = MF.h / 2, s = '';
    var lines = nd.lines || [nd.label];
    s += '<g transform="translate(' + pos.x + ',' + pos.y + ')">';
    if (sel) s += '<rect x="' + (-hw - 6) + '" y="' + (-hh - 6) + '" width="' + (MF.w + 12) + '" height="' +
                  (MF.h + 12) + '" rx="18" fill="#1B7FA8" opacity=".2"/>';
    s += '<rect x="' + (-hw) + '" y="' + (-hh) + '" width="' + MF.w + '" height="' + MF.h + '" rx="14" fill="' +
         (sel ? '#DCF0F8' : '#fff') + '" stroke="' + (sel ? '#1B7FA8' : '#B9C6D1') +
         '" stroke-width="' + (sel ? 5 : 3) + '"/>';
    /* え（あれば ひだりに）。え が ある ぶん 字は みぎに よせる */
    var tx = 0;
    if (nd.art){ s += '<g transform="translate(' + (-hw + 34) + ',0)">' + itemArt(nd.art, 24) + '</g>'; tx = 26; }
    var fs = (lines.length >= 3) ? 12 : 13, lh = fs + 4;
    var y0 = -((lines.length - 1) * lh) / 2 + fs / 2 - 1;
    lines.forEach(function(ln, i){
      s += '<text x="' + tx + '" y="' + (y0 + i * lh).toFixed(1) + '" font-size="' + fs +
           '" font-weight="900" fill="#3B5A70" text-anchor="middle">' + ln + '</text>';
    });
    /* むすび口の 点（どこから せんが 出るか 見て わかるように） */
    var px = (nd.kind === 'L') ? hw : -hw;
    s += '<circle cx="' + px + '" cy="0" r="6" fill="' + (sel ? '#1B7FA8' : '#B9C6D1') + '"/>';
    s += '<rect x="' + (-hw) + '" y="' + (-hh) + '" width="' + MF.w + '" height="' + MF.h +
         '" fill="transparent" data-t="' + nd.id + '"/>';
    s += '</g>';
    return s;
  }
};

function loadMusubu(st){
  cur.parts = st.nodes.map(function(n){ return n; });
  cur.wires = [];
  var sc = MB_SCENES[st.scene || 'moon'];
  cur.cardOrder = shuffled(st.nodes.filter(function(n){ return n.kind === sc.answerKind; })
                                   .map(function(n){ return n.id; }));
}
function musubuOK(){
  var pairs = curStage().pairs;
  if (cur.wires.length !== pairs.length) return false;
  for (var i=0;i<pairs.length;i++){
    if (!hasWire(pairs[i][0], pairs[i][1])) return false;
  }
  return true;
}
function renderMusubu(){
  var sc = mbScene();
  setBoardBox(600, sc.boardH());
  var s = sc.bg();

  /* ---- せん（ノードの 下に かく） ---- */
  cur.wires.forEach(function(w, wi){
    var a = mbPos(mbNode(w[0])), b = mbPos(mbNode(w[1]));
    var d = sc.wire(a, b);
    s += '<path d="' + d + '" fill="none" stroke="#1B7FA8" stroke-width="6" stroke-linecap="round" opacity=".85"/>';
    s += '<path d="' + d + '" fill="none" stroke="transparent" stroke-width="30" data-w="' + wi + '"/>';
  });
  /* ---- ノード ---- */
  cur.parts.forEach(function(nd){ s += sc.node(nd, mbSel(nd)); });
  document.getElementById('board').innerHTML = s;

  var ok = musubuOK();
  var need = curStage().pairs.length;
  if (cur.wires.length < need) setStatus('あと ' + (need - cur.wires.length) + 'くみ', false);
  else if (!ok) setStatus('ぜんぶ むすべた！ 見なおして みよう', false);
  else setStatus('', false);
  tryClear(ok);
}
function tapMusubu(e){
  var wi = attrUp(e.target, 'data-w');
  if (wi !== null){ cur.wires.splice(parseInt(wi, 10), 1); cur.sel = null; renderBoard(); return; }
  var t = attrUp(e.target, 'data-t');
  if (t !== null){
    if (cur.sel === null){ cur.sel = t; }
    else if (cur.sel === t){ cur.sel = null; }
    else {
      var a = mbNode(cur.sel), b = mbNode(t);
      if (a.kind === b.kind){ cur.sel = t; renderBoard(); return; }   /* おなじ なかまどうしは むすばない */
      if (hasWire(cur.sel, t)){
        cur.wires = cur.wires.filter(function(w){ return !sameWire(w, cur.sel, t); });
      } else {
        /* 1つの ノードに せんは 1本まで。古い せんは 外す */
        var s1 = cur.sel;
        cur.wires = cur.wires.filter(function(w){
          return w[0] !== s1 && w[1] !== s1 && w[0] !== t && w[1] !== t;
        });
        cur.wires.push([s1, t]);
      }
      cur.sel = null;
    }
    renderBoard(); return;
  }
  if (cur.sel !== null){ cur.sel = null; renderBoard(); }
}
ENGINES.musubu = { load:loadMusubu, render:renderMusubu, tap:tapMusubu };
