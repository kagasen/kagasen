/* ================================================================== *
 * ならべる型 — カードを 正しい じゅんに ならべる
 *   items は「正しい じゅん」に 書く。loop:true なら わっか（じゅんかんする もの）
 *   なので、どこから 始めても せいかい（月の 満ち欠けが これ）。
 * ================================================================== */
var NB = { cw:80, ch:80, gap:10, lab:18, top:44 };
function nbCols(n){ return n <= 4 ? n : (n <= 6 ? 3 : 4); }
function nbCell(i, cols, oy){
  var gridW = cols * NB.cw + (cols - 1) * NB.gap;
  var ox = (600 - gridW) / 2;
  var c = i % cols, r = (i / cols) | 0;
  return { x: ox + c * (NB.cw + NB.gap) + NB.cw / 2,
           y: oy + r * (NB.ch + NB.lab + NB.gap) + NB.ch / 2 };
}
function nbItem(id){
  var items = curStage().items;
  for (var i=0;i<items.length;i++){ if (items[i].id === id) return items[i]; }
  return null;
}
function loadNaraberu(st){
  var ids = st.items.map(function(it){ return it.id; });
  cur.slots = ids.map(function(){ return null; });
  cur.tray = shuffled(ids);
  cur.trayHome = {};
  cur.tray.forEach(function(id, i){ cur.trayHome[id] = i; });
}
/* ならびが 合っているか。loop なら 何こ ずらしても せいかい */
function naraberuOK(){
  var st = curStage();
  if (!st || cur.slots.indexOf(null) >= 0) return false;
  var order = st.items.map(function(it){ return it.id; }), n = order.length, k, i, ok;
  if (!st.loop) return cur.slots.join(',') === order.join(',');
  for (k=0;k<n;k++){
    ok = true;
    for (i=0;i<n;i++){ if (cur.slots[i] !== order[(k + i) % n]){ ok = false; break; } }
    if (ok) return true;
  }
  return false;
}
function nbCard(cx, cy, item, opt){
  var half = NB.cw / 2, s = '<g transform="translate(' + cx + ',' + cy + ')">';
  s += '<rect x="' + (-half) + '" y="' + (-half) + '" width="' + NB.cw + '" height="' + NB.ch +
       '" rx="14" fill="' + (opt.sel ? '#DCF0F8' : '#fff') + '" stroke="' + (opt.sel ? '#1B7FA8' : '#B9C6D1') +
       '" stroke-width="' + (opt.sel ? 5 : 3) + '"/>';
  s += '<g transform="translate(0,-6)">' + itemArt(item.art, 26) + '</g>';
  s += '<text x="0" y="' + (half + 14) + '" font-size="12" font-weight="900" fill="#3B5A70" text-anchor="middle">' +
       item.label + '</text>';
  return s + '</g>';
}
function renderNaraberu(){
  var st = curStage(), n = st.items.length, cols = nbCols(n);
  var rows = Math.ceil(n / cols), rowH = NB.ch + NB.lab + NB.gap;
  var slotOY = NB.top, slotsH = rows * rowH;
  var trayOY = slotOY + slotsH + 40, boardH = trayOY + slotsH + 6;
  setBoardBox(600, boardH);

  var s = '';
  s += '<text x="300" y="26" font-size="15" font-weight="900" fill="#3B5A70" text-anchor="middle">▼ ここに じゅんに ならべよう</text>';
  /* わく */
  cur.slots.forEach(function(id, i){
    var c = nbCell(i, cols, slotOY), half = NB.cw / 2;
    if (id === null){
      s += '<g transform="translate(' + c.x + ',' + c.y + ')">' +
           '<rect x="' + (-half) + '" y="' + (-half) + '" width="' + NB.cw + '" height="' + NB.ch +
           '" rx="14" fill="#F1F6F9" stroke="#B9C6D1" stroke-width="3" stroke-dasharray="8 7"/>' +
           '<text x="0" y="9" font-size="26" font-weight="900" fill="#C3D0DA" text-anchor="middle">' + (i + 1) + '</text>' +
           '</g>';
    } else {
      s += nbCard(c.x, c.y, nbItem(id), { sel:false });
      s += '<text x="' + (c.x - half + 12) + '" y="' + (c.y - half + 18) +
           '" font-size="13" font-weight="900" fill="#8FA3B8" text-anchor="middle">' + (i + 1) + '</text>';
    }
    s += '<rect x="' + (c.x - half) + '" y="' + (c.y - half) + '" width="' + NB.cw + '" height="' +
         (NB.ch + NB.lab) + '" fill="transparent" data-slot="' + i + '"/>';
  });
  /* しきり と てもとの カード */
  s += '<line x1="40" y1="' + (trayOY - 26) + '" x2="560" y2="' + (trayOY - 26) +
       '" stroke="#DCE5EB" stroke-width="3"/>';
  s += '<text x="300" y="' + (trayOY - 6) + '" font-size="14" font-weight="900" fill="#8FA3B8" text-anchor="middle">てもとの カード</text>';
  cur.tray.forEach(function(id, i){
    if (id === null) return;
    var c = nbCell(i, cols, trayOY + 12), half = NB.cw / 2;
    s += nbCard(c.x, c.y, nbItem(id), { sel: cur.sel === id });
    s += '<rect x="' + (c.x - half) + '" y="' + (c.y - half) + '" width="' + NB.cw + '" height="' +
         (NB.ch + NB.lab) + '" fill="transparent" data-item="' + id + '"/>';
  });
  document.getElementById('board').innerHTML = s;

  var left = 0;
  cur.slots.forEach(function(x){ if (x === null) left++; });
  var ok = naraberuOK();
  if (left) setStatus('あと ' + left + 'まい', false);
  else if (!ok) setStatus('ぜんぶ おけた！ じゅんばんを 見なおして みよう', false);
  else setStatus('', false);
  tryClear(ok);
}
function tapNaraberu(e){
  var it = attrUp(e.target, 'data-item');
  if (it !== null){ cur.sel = (cur.sel === it) ? null : it; renderBoard(); return; }
  var si = attrUp(e.target, 'data-slot');
  if (si !== null){
    si = parseInt(si, 10);
    var here = cur.slots[si];
    if (cur.sel !== null){
      cur.tray = cur.tray.map(function(x){ return x === cur.sel ? null : x; });
      if (here !== null) cur.tray[cur.trayHome[here]] = here;      /* もとの ばしょに もどす */
      cur.slots[si] = cur.sel;
      cur.sel = null;
    } else if (here !== null){
      cur.slots[si] = null;
      cur.tray[cur.trayHome[here]] = here;
    }
    renderBoard(); return;
  }
  if (cur.sel !== null){ cur.sel = null; renderBoard(); }
}
ENGINES.naraberu = { load:loadNaraberu, render:renderNaraberu, tap:tapNaraberu };
