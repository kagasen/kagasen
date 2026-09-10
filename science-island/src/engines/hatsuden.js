/* ================================================================== *
 * はつでん型 — 手回し発電 れんだ ゲーム（6年 電気の利用）
 *
 *   ★これは ゲーム。10びょうの あいだ ボタンを **れんだ** して 発電し、
 *     ためた 電気で つないだ ものを できるだけ 長く はたらかせる。
 *
 *   あそんで いる うちに 手が おぼえる こと（文では 教えない）:
 *     ・**はやく 回すほど 1回の 発電量が 大きい**（ほんとうに そう。回すのが 速い＝電圧が 高い）
 *     ・**豆電球は 電気を 食う**。同じ 電気で LEDは 5ばい 長く 光る
 *       → けっか画面で かならず「LEDなら ◯びょう」と ならべて 見せる
 *     ・レベルが 上がるほど 電気を 食う ものに なる ＝ 自然と れんだが 速く なる
 * ================================================================== */
var HD = { H:472, crank:10, cap:150, base:0.8 };

/* ---- つなぐ もの。use ＝ 1びょうに つかう 電気 ----
   ここは この 型（はつでん）しか つかわない ので この ファイルに 置く。
   よその エンジンの ファイルに 置くと、その 型が 入って いない アプリで
   「cdLoad is not defined」に なって この ゲームだけ あそべなく なる
   （じっさい 2026-09-10 の 1ゲームずつ 分割で 出た。CLAUDE.md §8 / HANDOFF の きまり）。 */
var CD_LOADS = [
  { id:'mame',  name:'豆電球',  use:2.0,  col:'#F5B324' },
  { id:'led',   name:'LED',     use:0.4,  col:'#4FC46A' },
  { id:'motor', name:'モーター', use:1.5,  col:'#3EA7D8' },
  { id:'buzz',  name:'ブザー',  use:0.8,  col:'#E8618C' }
];
function cdLoad(id){ for (var i=0;i<CD_LOADS.length;i++){ if (CD_LOADS[i].id === id) return CD_LOADS[i]; } return null; }
function hdLoad(){ return cdLoad(curStage().load); }
function loadHatsuden(st){
  if (cur.hdRaf){ cancelAnimationFrame(cur.hdRaf); cur.hdRaf = null; }
  cur.phase = 'ready';
  cur.turns = 0; cur.charge = 0; cur.ang = 0; cur.tgtAng = 0;
  cur.taps = []; cur.rate = 0; cur.left = HD.crank;
  cur.runSec = 0; cur.runTotal = 0; cur.best = 0;
}
function hatsudenOK(){ return cur.phase === 'done' && cur.runTotal >= curStage().need; }
/* いまの 回す はやさ（1びょうに 何回）から ボーナスを 出す。
   はやく 回す ＝ 電圧が 高い ＝ 1回で たくさん 発電できる ―― ほんものの しくみ。 */
function hdBonus(){ return 1 + Math.max(0, Math.min(1, (cur.rate - 2) / 5)); }

function hdLoadArt(id, on){
  var s = '';
  if (id === 'led'){
    s += '<path d="M-13 10 v-12 a13,13 0 0 1 26,0 v12 Z" fill="' + (on ? '#7BE59B' : '#DDE7EC') + '" stroke="#5A7C93" stroke-width="2.5"/>';
    s += '<line x1="-6" y1="10" x2="-6" y2="26" stroke="#8FA3B8" stroke-width="3"/><line x1="6" y1="10" x2="6" y2="30" stroke="#8FA3B8" stroke-width="3"/>';
  } else if (id === 'motor'){
    s += '<rect x="-16" y="-14" width="32" height="28" rx="5" fill="#B7C8D6" stroke="#5A7C93" stroke-width="2.5"/>';
    s += '<line x1="16" y1="0" x2="26" y2="0" stroke="#5A7C93" stroke-width="3"/>';
    s += '<g transform="translate(30,0)' + (on ? ' rotate(35)' : '') + '"><ellipse cx="0" cy="0" rx="4" ry="14" fill="' +
         (on ? '#3EA7D8' : '#DDE7EC') + '" stroke="#5A7C93" stroke-width="2"/></g>';
  } else if (id === 'buzz'){
    s += '<rect x="-16" y="-12" width="20" height="24" rx="3" fill="#B7C8D6" stroke="#5A7C93" stroke-width="2.5"/>';
    s += '<path d="M4 -12 L18 -22 v44 L4 12 Z" fill="#DDE7EC" stroke="#5A7C93" stroke-width="2.5"/>';
    if (on) for (var i = 0; i < 3; i++)
      s += '<path d="M' + (22 + i * 7) + ' -10 q6 10 0 20" fill="none" stroke="#E8618C" stroke-width="2.5" stroke-linecap="round"/>';
  } else {
    if (on) s += '<circle cx="0" cy="-4" r="26" fill="#F5B324" opacity=".35"/>';
    s += '<circle cx="0" cy="-4" r="16" fill="' + (on ? '#FFE066' : '#EFF3F6') + '" stroke="#5A7C93" stroke-width="2.5"/>';
    s += '<path d="M-6 6 h12 v8 h-12 Z" fill="#B7C8D6" stroke="#5A7C93" stroke-width="2"/>';
    s += '<path d="M-5 -8 l5 8 l5 -8" fill="none" stroke="#C9820A" stroke-width="2"/>';
    if (on) for (var k = 0; k < 6; k++){
      var a = k * Math.PI / 3;
      s += '<line x1="' + (Math.cos(a) * 24).toFixed(1) + '" y1="' + (-4 + Math.sin(a) * 24).toFixed(1) +
           '" x2="' + (Math.cos(a) * 32).toFixed(1) + '" y2="' + (-4 + Math.sin(a) * 32).toFixed(1) +
           '" stroke="#F5B324" stroke-width="3" stroke-linecap="round"/>';
    }
  }
  return s;
}
/* ---- 毎フレーム さわる ところだけ 書きかえる（作りなおすと れんだが 通らない） ---- */
function hdSync(){
  var h = document.getElementById('hd-handle');
  if (!h) return false;
  h.setAttribute('transform', 'rotate(' + cur.ang.toFixed(1) + ')');
  var g = document.getElementById('hd-gauge');
  if (g){
    var fh = 168 * Math.min(1, cur.charge / HD.cap);
    g.setAttribute('y', (272 - fh).toFixed(1)); g.setAttribute('height', fh.toFixed(1));
  }
  var t = document.getElementById('hd-turns'); if (t) t.textContent = cur.turns + ' 回';
  var c = document.getElementById('hd-chg');   if (c) c.textContent = Math.round(cur.charge) + '';
  var tm = document.getElementById('hd-timer');
  if (tm) tm.textContent = (cur.phase === 'crank') ? Math.ceil(cur.left) + '' : '';
  var sp = document.getElementById('hd-speed');
  if (sp) sp.setAttribute('width', (150 * Math.min(1, cur.rate / 8)).toFixed(1));
  var sl = document.getElementById('hd-splabel');
  if (sl) sl.textContent = (hdBonus() >= 1.7 ? 'ちょうかいてん！' : (hdBonus() >= 1.3 ? 'いい ちょうし！' : 'もっと はやく！'));
  var rs = document.getElementById('hd-run');
  if (rs) rs.textContent = cur.runSec.toFixed(1) + ' びょう';
  var lp = document.getElementById('hd-lamp');
  if (lp) lp.innerHTML = hdLoadArt(curStage().load, cur.phase === 'use');
  return true;
}
function hdStep(dt){
  var st = curStage();
  /* ハンドルは 目ひょうの 角度へ ぐいぐい 回る（れんだ するほど 速く 見える） */
  cur.ang += (cur.tgtAng - cur.ang) * Math.min(1, dt * 11);
  /* さいきん 1びょうの タップ数 */
  var now = cur.clock;
  cur.taps = cur.taps.filter(function(x){ return now - x < 1; });
  cur.rate = cur.taps.length;
  if (cur.phase === 'crank'){
    cur.left -= dt;
    if (cur.left <= 0){
      cur.left = 0;
      if (cur.charge <= 0){ cur.phase = 'ready'; renderHatsuden(); return; }
      cur.phase = 'use'; cur.runSec = 0;
      cur.runTotal = cur.charge / hdLoad().use;
      renderHatsuden(); return;
    }
  } else if (cur.phase === 'use'){
    cur.runSec = Math.min(cur.runTotal, cur.runSec + dt * 4);      /* 4ばい はやおくり */
    cur.charge = Math.max(0, hdLoad().use * (cur.runTotal - cur.runSec));
    if (cur.runSec >= cur.runTotal){
      cur.phase = 'done';
      cur.noStar = !(cur.runTotal >= st.star);
      renderHatsuden(); return;
    }
  }
}
function hdLoop(){
  if (cur.hdRaf) return;
  var last = null;
  function step(now){
    if (cur.kind !== 'hatsuden' || (cur.phase !== 'crank' && cur.phase !== 'use')){ cur.hdRaf = null; return; }
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; cur.clock += dt;
    hdStep(dt);
    if (cur.phase === 'crank' || cur.phase === 'use'){ hdSync(); cur.hdRaf = requestAnimationFrame(step); }
    else cur.hdRaf = null;
  }
  cur.hdRaf = requestAnimationFrame(step);
}
function renderHatsuden(){
  var st = curStage(), L = hdLoad(), i;
  setBoardBox(600, HD.H);
  var s = '', crank = (cur.phase === 'crank'), use = (cur.phase === 'use');
  /* ---- ミッション帯 ---- */
  s += '<rect x="20" y="8" width="560" height="34" rx="12" fill="#FFF8E4" stroke="#F5B324" stroke-width="2"/>';
  s += '<text x="36" y="31" font-size="13" font-weight="900" fill="#8A5B00">🎯 ' + st.goal + '</text>';
  s += '<text x="564" y="31" font-size="13" font-weight="900" fill="#8A5B00" text-anchor="end">★は ' + st.star + 'びょう いじょう</text>';

  /* ---- 手回し発電機 ---- */
  s += '<g transform="translate(140,196)">';
  s += '<rect x="-58" y="-44" width="116" height="88" rx="12" fill="#E8EEF3" stroke="#8FA3B8" stroke-width="3"/>';
  s += '<circle cx="0" cy="0" r="30" fill="#B7C8D6" stroke="#5A7C93" stroke-width="3"/>';
  s += '<g id="hd-handle" transform="rotate(' + cur.ang.toFixed(1) + ')">';
  s += '<line x1="0" y1="0" x2="0" y2="-44" stroke="#5A7C93" stroke-width="7" stroke-linecap="round"/>';
  s += '<circle cx="0" cy="-48" r="11" fill="#E05A4A" stroke="#B03A45" stroke-width="3"/></g>';
  s += '<text x="0" y="64" font-size="12" font-weight="900" fill="#5A7C93" text-anchor="middle">手回し発電機</text>';
  s += '<text id="hd-turns" x="0" y="84" font-size="17" font-weight="900" fill="#0F3350" text-anchor="middle">' + cur.turns + ' 回</text>';
  s += '</g>';
  /* はやさメーター */
  s += '<rect x="66" y="300" width="150" height="14" rx="7" fill="#DCE5EB"/>';
  s += '<rect id="hd-speed" x="66" y="300" width="' + (150 * Math.min(1, cur.rate / 8)).toFixed(1) +
       '" height="14" rx="7" fill="#F5B324"/>';
  s += '<text x="60" y="312" font-size="11" font-weight="900" fill="#8FA3B8" text-anchor="end">はやさ</text>';
  s += '<text id="hd-splabel" x="141" y="332" font-size="12" font-weight="900" fill="#C9820A" text-anchor="middle">' +
       (crank ? 'もっと はやく！' : '') + '</text>';

  /* ---- コンデンサー ---- */
  s += '<rect x="266" y="104" width="68" height="168" rx="10" fill="#F1F6F9" stroke="#8FA3B8" stroke-width="3"/>';
  var fh = 168 * Math.min(1, cur.charge / HD.cap);
  s += '<rect id="hd-gauge" x="270" y="' + (272 - fh).toFixed(1) + '" width="60" height="' + fh.toFixed(1) +
       '" rx="6" fill="#F5B324" opacity=".9"/>';
  s += '<text x="300" y="292" font-size="12" font-weight="900" fill="#5A7C93" text-anchor="middle">ためた 電気</text>';
  s += '<text id="hd-chg" x="300" y="94" font-size="18" font-weight="900" fill="#0F3350" text-anchor="middle">' +
       Math.round(cur.charge) + '</text>';

  /* ---- つないで いる もの ---- */
  s += '<g id="hd-lamp" transform="translate(470,180)">' + hdLoadArt(st.load, use) + '</g>';
  s += '<text x="470" y="238" font-size="15" font-weight="900" fill="#0F3350" text-anchor="middle">' + L.name + '</text>';
  s += '<text x="470" y="258" font-size="12" font-weight="900" fill="#8FA3B8" text-anchor="middle">1びょうに ' + L.use + ' つかう</text>';
  s += '<rect x="396" y="276" width="148" height="44" rx="14" fill="#EAF3F8"/>';
  s += '<text x="470" y="294" font-size="11" font-weight="900" fill="#5A7C93" text-anchor="middle">はたらいた 時間</text>';
  s += '<text id="hd-run" x="470" y="313" font-size="17" font-weight="900" fill="#0F3350" text-anchor="middle">' +
       cur.runSec.toFixed(1) + ' びょう</text>';

  /* ---- ボタン ---- */
  if (cur.phase === 'ready'){
    s += '<g transform="translate(300,398)"><rect x="-150" y="-40" width="300" height="80" rx="40" fill="#2E9A4C"/>' +
         '<text x="0" y="-4" font-size="20" font-weight="900" fill="#fff" text-anchor="middle">▶ スタート</text>' +
         '<text x="0" y="20" font-size="13" font-weight="900" fill="#D6F0DC" text-anchor="middle">' + HD.crank + 'びょう れんだ！</text>' +
         '<rect x="-150" y="-40" width="300" height="80" fill="transparent" data-hdgo="1"/></g>';
  } else if (crank){
    s += '<circle cx="300" cy="398" r="46" fill="#FFF8E4" stroke="#F5B324" stroke-width="4"/>';
    s += '<text id="hd-timer" x="300" y="408" font-size="30" font-weight="900" fill="#8A5B00" text-anchor="middle">' +
         Math.ceil(cur.left) + '</text>';
    s += '<g transform="translate(300,398)"><rect x="-260" y="-40" width="196" height="80" rx="40" fill="#E05A4A"/>' +
         '<text x="-162" y="10" font-size="24" font-weight="900" fill="#fff" text-anchor="middle">⚡ まわす！</text>' +
         '<rect x="-260" y="-40" width="196" height="80" fill="transparent" data-hdturn="1"/></g>';
    s += '<g transform="translate(300,398)"><rect x="64" y="-40" width="196" height="80" rx="40" fill="#E05A4A"/>' +
         '<text x="162" y="10" font-size="24" font-weight="900" fill="#fff" text-anchor="middle">⚡ まわす！</text>' +
         '<rect x="64" y="-40" width="196" height="80" fill="transparent" data-hdturn="1"/></g>';
  } else if (use){
    s += '<text x="300" y="406" font-size="17" font-weight="900" fill="#5A7C93" text-anchor="middle">はたらいて いるよ…</text>';
  }

  /* ---- けっか ---- */
  if (cur.phase === 'done'){
    var win = (cur.runTotal >= st.need);
    var ledSec = cur.turns > 0 ? (hdLoad().use * cur.runTotal) / cdLoad('led').use : 0;
    s += '<rect x="0" y="0" width="600" height="' + HD.H + '" fill="#0F3350" opacity=".42"/>';
    s += '<g transform="translate(300,222)"><rect x="-196" y="-110" width="392" height="220" rx="24" fill="#fff"/>';
    s += '<text x="0" y="-70" font-size="22" font-weight="900" fill="' + (win ? '#2E9A4C' : '#E08A00') +
         '" text-anchor="middle">' + (win ? 'ミッション たっせい！' : 'もう ちょっと！') + '</text>';
    s += '<text x="0" y="-36" font-size="18" font-weight="900" fill="#0F3350" text-anchor="middle">' +
         L.name + 'が ' + cur.runTotal.toFixed(1) + 'びょう はたらいた</text>';
    s += '<text x="0" y="-12" font-size="13" font-weight="900" fill="#5A7C93" text-anchor="middle">もくひょう ' +
         st.need + 'びょう　／　★ ' + st.star + 'びょう　／　回した 回数 ' + cur.turns + '回</text>';
    if (st.load !== 'led')
      s += '<text x="0" y="22" font-size="14" font-weight="900" fill="#C9820A" text-anchor="middle">💡 同じ 電気でも LEDなら ' +
           ledSec.toFixed(0) + 'びょう 光る！</text>';
    else
      s += '<text x="0" y="22" font-size="14" font-weight="900" fill="#C9820A" text-anchor="middle">💡 同じ 電気で 豆電球なら ' +
           (ledSec * cdLoad('led').use / cdLoad('mame').use).toFixed(0) + 'びょうしか もたない</text>';
    s += '<rect x="-90" y="46" width="180" height="42" rx="21" fill="#1B7FA8"/>' +
         '<text x="0" y="74" font-size="16" font-weight="900" fill="#fff" text-anchor="middle">↺ もう いちど</text>' +
         '<rect x="-90" y="46" width="180" height="42" fill="transparent" data-hdgo="1"/></g>';
  }
  document.getElementById('board').innerHTML = s;
  if (crank) setStatus('れんだ！ はやく 回すほど たくさん 発電できる', false);
  else if (use) setStatus('', false);
  else if (cur.phase === 'done') setStatus('', false);
  else setStatus('スタートを おして ' + HD.crank + 'びょう れんだ しよう', false);
  tryClear(hatsudenOK());
}
function tapHatsuden(e){
  if (attrUp(e.target, 'data-hdgo') !== null){
    loadHatsuden(curStage());
    cur.phase = 'crank'; cur.clock = 0; cur.left = HD.crank;
    renderHatsuden(); hdLoop(); return;
  }
  if (attrUp(e.target, 'data-hdturn') !== null && cur.phase === 'crank'){
    cur.turns++;
    cur.taps.push(cur.clock);
    cur.charge = Math.min(HD.cap, cur.charge + HD.base * hdBonus());
    cur.tgtAng += 360;                                  /* タップ1回＝ハンドル1回転 */
    hdSync();                                           /* ばんは 作りなおさない（れんだが 通らなく なる） */
    return;
  }
}
ENGINES.hatsuden = { load:loadHatsuden, render:renderHatsuden, tap:tapHatsuden };
