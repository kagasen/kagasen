/* ------------------------------------------------------------------ *
 * 6. ゲームの じょうたい と 型（エンジン）の わりふり
 *
 *    型は ENGINES に { load(stage), render(), tap(event) } の かたちで とうろくする。
 *    ミニゲームの kind が きほんの型。stage.kind を 書けば その1もんだけ
 *    べつの型に できる（例：月と太陽は「ならべる」と「むすぶ」を まぜている）。
 *    あたらしい型を ふやすときは ENGINES に 1つ 足すだけで すむように すること。
 * ------------------------------------------------------------------ */
var ENGINES = {};
var cur = {
  gameId:null, si:0, kind:null, hint:false, done:false,
  parts:[], wires:[], sel:null,      /* つなぐ型（回路・むすぶ）で つかう */
  slots:[], tray:[]                  /* ならべる型で つかう */
};

function curStage(){ var g = gameById(cur.gameId); return g ? g.stages[cur.si] : null; }
function engine(){ return ENGINES[cur.kind]; }
function setBoardBox(w, h){ document.getElementById('board').setAttribute('viewBox', '0 0 ' + w + ' ' + h); }
function setStatus(msg, bad){
  document.getElementById('status').className = bad ? 'status short' : 'status';
  document.getElementById('status').textContent = msg || '';
}
function closeModal(){ document.getElementById('modal').className = 'modal'; }
/* せいかいした ときの ながれ（2026-09-10 に かえた）
     せいかい → 480ms あと に「できた！」の おびを 出す → **子が おして はじめて** クリアの まど
   むかしは まどが かってに 出て いた。回路や つり合いを 作りおえた ばかりで
   まだ 見て いたい のに まどが かぶさって しまう、という ユーザーの 指てき。
   おびが 出て いる あいだ、ばんめんは そのまま のこる（見なおせる）。
   タイマーは おぼえて おいて loadStage で 取り消す（はじめから・もんだい きりかえ の ため）。 */
function tryClear(ok){
  if (!cur.done && ok){ cur.done = true; cur.clearTimer = setTimeout(showClearBar, 480); }
}
function showClearBar(){
  /* ★ を とる か どうかは **この しゅんかん** で きめて おく。
     おびが 出た あとに ヒントを ひらいても、もう とれた ★を 下げない（§6 単調増加）。 */
  cur.gotStar = (cur.hint || cur.noStar) ? 0 : 1;
  var bar = document.getElementById('clear-bar');
  bar.className = 'clear-bar on';
  if (bar.scrollIntoView) bar.scrollIntoView({ block:'nearest' });
}
function hideClearBar(){ document.getElementById('clear-bar').className = 'clear-bar'; }
document.getElementById('cb-go').onclick = function(){ hideClearBar(); onClear(); };
function renderBoard(){ var e = engine(); if (e) e.render(); }

/* タップされた ところから 親を たどって data-○○ を さがす。
   ぜんぶの 型（エンジン）と ホームの 地図が つかう ので、ここ（共通）に 置く。 */
function attrUp(el, name){
  while (el && el !== document){
    if (el.getAttribute){ var v = el.getAttribute(name); if (v !== null) return v; }
    el = el.parentNode;
  }
  return null;
}

function startGame(gameId, si){
  var g = gameById(gameId);
  if (!g || g.soon) return;
  cur.gameId = gameId; cur.si = si; cur.sel = null; cur.done = false;
  cur.hint = false;                           /* 1もん目は そうさの せつめいを 出すが ヒントあつかいには しない */
  loadStage();
  document.getElementById('game-bar-title').textContent = g.name;
  /* ゲームが 1つだけの アプリには「◀ もどる」が ない（ビルドが とりのぞく）。
     出口は 左下の「アプリ集」ボタン。 */
  var backBtn = document.getElementById('game-back');
  if (backBtn) backBtn.onclick = function(){ openIsland(g.island); };
  go('game');
}
function loadStage(){
  var g = gameById(cur.gameId), st = g.stages[cur.si];
  if (cur.clearTimer){ clearTimeout(cur.clearTimer); cur.clearTimer = null; }
  closeModal();
  hideClearBar();
  cur.kind = st.kind || g.kind;
  cur.sel = null; cur.done = false; cur.noStar = false; cur.gotStar = null;
  document.getElementById('q-n').textContent =
    (g.stages.length > 1) ? ('だい' + (cur.si + 1) + 'もん / ' + g.stages.length + 'もん') : g.sub;
  document.getElementById('q-t').textContent = st.t;
  document.getElementById('q-h').innerHTML = st.h + hintAnswer(st, cur.kind);   /* ヒントも learn と 同じく <b> を つかえる */
  /* ヒントの 中に ボタンを 出す 型は、その ボタンを じぶんで つなぐ（hintBind）。
     ここに 型ごとの しょりを 書かない こと。 */
  var hintEng = ENGINES[cur.kind];
  if (hintEng && hintEng.hintBind) hintEng.hintBind();
  document.getElementById('q-h').className = 'q-h' + (cur.si === 0 ? ' on' : '');
  renderStrip();
  var pk = document.getElementById('sw-pick');
  pk.className = 'sw-pick'; pk.innerHTML = '';   /* ふりこ以外の 型では かくす */
  var fcCtl = document.getElementById('fc-controls');
  fcCtl.innerHTML = '';                          /* リサイクル工場いがいでは かくす */
  engine().load(st);
  renderBoard();
}
function renderStrip(){
  var g = gameById(cur.gameId), h = '';
  if (g.stages.length <= 1){ document.getElementById('stage-strip').innerHTML = ''; return; }
  for (var i=0;i<g.stages.length;i++){
    var r = stageRec(g.id, i);
    var cls = 'stage-dot' + (r ? (r.p ? ' gold' : ' done') : '') + (i === cur.si ? ' now' : '');
    h += '<button class="' + cls + '" data-go="' + i + '">' + (i + 1) + '</button>';
  }
  document.getElementById('stage-strip').innerHTML = h;
}

function sameWire(w, a, b){ return (w[0] === a && w[1] === b) || (w[0] === b && w[1] === a); }
function hasWire(a, b){
  for (var i=0;i<cur.wires.length;i++){ if (sameWire(cur.wires[i], a, b)) return true; }
  return false;
}

/* ヒントの 中に 入れる「こたえの れい」。中身は それぞれの 型（エンジン）が
   ENGINES.○○.hintAnswer に 書く。書かない 型は ヒントだけ 出て こたえの れいは 出ない。
   ここに 型の 名まえを ならべない こと（型を 足すたびに ここを 直す ことに なる）。 */
function hintAnswer(st, kind){
  var e = ENGINES[kind];
  return (e && e.hintAnswer) ? e.hintAnswer(st) : '';
}

/* ------------------------------------------------------------------ *
 * がめんの そうさを 型（エンジン）に わたす ところ。
 *
 * ★ここは 共通。2026-09-10 まで engines/swing.js（ふりこ）の 中に あった。
 *   ゲーム 1つずつの アプリに 分けた とき、ふりこの 入って いない アプリで
 *   **ばんめんの タップも もんだいえらびも ヒントも ぜんぶ 効かなく なった**。
 *   エラーは 1つも 出ない（おしても 何も おきないだけ）ので、気づくのが むずかしい。
 *   型に かんけいない そうさは かならず ここに 書く こと。
 * ------------------------------------------------------------------ */
/* ばんめんの タップは、いまの 型に わたすだけ */
document.getElementById('board').addEventListener('click', function(e){
  if (cur.done) return;
  var eng = engine();
  if (eng) eng.tap(e);
});
/* おしっぱなしを つかう 型（でんじしゃくバトルの コイル巻き）のための down/up。
   Pointer Events は 古い iPad に ない ので mouse と touch の 両方を 見る。 */
['mousedown', 'touchstart'].forEach(function(ev){
  document.getElementById('board').addEventListener(ev, function(e){
    if (cur.done) return;
    var eng = engine();
    if (eng && eng.down) eng.down(e);
  });
});
/* なぞって つなぐ型（リサイクル工場）。指が こまの間へ動いても 追えるよう document で見る。 */
document.addEventListener('mousemove', function(e){
  var eng=engine(); if(eng&&eng.move)eng.move(e);
});
document.addEventListener('touchmove', function(e){
  var eng=engine(); if(eng&&eng.move)eng.move(e);
}, {passive:false});
['mouseup', 'touchend', 'touchcancel'].forEach(function(ev){
  document.addEventListener(ev, function(e){
    var eng = engine();
    if (eng && eng.up) eng.up(e);
  });
});
document.getElementById('stage-strip').addEventListener('click', function(e){
  var i = attrUp(e.target, 'data-go');
  if (i === null) return;
  i = parseInt(i, 10);
  /* どのもんだいにも いつでも とべる（2026-08-28 ユーザーの きぼうで じゅんばんの
     ロックを 外した）。むずかしくて つまった とき、先に すすんで あとで もどれる ように。
     クリアの きろくは もんだいごとに もつので、とばしても 記ろくは こわれない。 */
  cur.si = i; cur.hint = false; loadStage();
});
document.getElementById('btn-hint').onclick = function(){
  var h = document.getElementById('q-h');
  h.className = (h.className.indexOf('on') >= 0) ? 'q-h' : 'q-h on';
  if (cur.si !== 0) cur.hint = true;
};
document.getElementById('btn-reset').onclick = function(){ loadStage(); };

