/* ------------------------------------------------------------------ *
 * 3. セーブ（CLAUDE.md §3：記録を絶対に壊さない）
 * ------------------------------------------------------------------ */
var SAVE_KEY = 'science-island-save-v1';
var save = { v:1, stages:{}, cards:{}, opt:{} };

function load(){
  var raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch(e){ raw = null; }
  if (!raw) return;
  var d = null;
  try { d = JSON.parse(raw); } catch(e){ return; }
  if (!d || typeof d !== 'object') return;
  /* --- スキーマ移行のフック。形をかえても 古いデータを すてない --- *
     いまは v1 だけ。v2 に するときは ここで d.v===1 のデータを つめかえる。 */
  if (d.stages) save.stages = d.stages;
  if (d.cards)  save.cards  = d.cards;
  if (d.opt)    save.opt    = d.opt;            /* 自分で えらんだ せってい（でんじしゃくバトル など） */
  save.v = 1;
}
function store(){
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch(e){}
}
function stageKey(gameId, i){ return gameId + '-' + (i+1); }
function stageRec(gameId, i){
  var r = save.stages[stageKey(gameId,i)];
  return r ? r : null;
}
function clearedCount(gameId){
  var g = gameById(gameId);
  if (!g || !g.stages) return 0;
  var n = 0;
  for (var i=0;i<g.stages.length;i++){ if (stageRec(gameId,i)) n++; }
  return n;
}
function gameDone(gameId){
  var g = gameById(gameId);
  if (!g || !g.stages) return false;
  return clearedCount(gameId) >= g.stages.length;
}
function gameGold(gameId){
  var g = gameById(gameId);
  if (!g || !g.stages) return false;
  for (var i=0;i<g.stages.length;i++){
    var r = stageRec(gameId,i);
    if (!r || !r.p) return false;
  }
  return true;
}
function islandDone(islandId){
  var all  = ALL_GAMES.filter(function(g){ return g[1] === islandId; });
  var list = playableOf(islandId);
  /* その島の ゲームを ぜんぶ 持って いる アプリの ときだけ、じぶんで 数える。
     1ゲームだけの アプリ（でんき回路 など）で これを やると、その 1つを クリアしただけで
     「エネルギーの島 クリア」に なって しまう。 */
  if (list.length && list.length >= all.length){
    for (var i=0;i<list.length;i++){ if(!gameDone(list[i].id)) return false; }
    return true;
  }
  /* この アプリには そろって いない 島（島ごと・ゲームごとに アプリを 分けた ため）。
     セーブは 4アプリで 同じ もの（同一オリジンの localStorage）を 見て いるので、
     その島の ゲームが ぜんぶ 図かんに のって いれば クリアずみと 分かる。
     こうしないと「4島 クリアで かんがえかたの島が ひらく」が どの アプリでも
     ひらかなく なる（じぶんの 島の ゲームしか 数えられない ため）。 */
  if (!all.length) return false;
  for (var j=0;j<all.length;j++){ if(!save.cards[all[j][0]]) return false; }
  return true;
}
function methodOpen(){
  return islandDone('energy') && islandDone('particle') && islandDone('life') && islandDone('earth');
}
