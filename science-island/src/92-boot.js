/* ------------------------------------------------------------------ *
 * 9. がめんの きりかえ と きどう
 * ------------------------------------------------------------------ */
function go(name){
  /* ゲームの 画面から 出る ときは、うごいて いる アニメを とめる
     （とめないと 見えない ところで まわり つづけて バッテリーを 食う） */
  /* ゲームの がめんから 出たら 走って いる アニメを 止める。型（エンジン）に stop を
     書いて おくと ここで よばれる（書かなくても よい）。 */
  if (name !== 'game'){
    for (var _k in ENGINES) if (ENGINES[_k].stop) ENGINES[_k].stop();
    hideClearBar();                                  /* できた！の おびを のこさない */
  }
  ['home','island','game'].forEach(function(n){
    var el = document.getElementById('screen-' + n);   /* 地図の ない アプリでは home が ない */
    if (el) el.className = 'screen' + (n === name ? ' on' : '');
  });
  if (name === 'home') renderHome();
  window.scrollTo(0, 0);
}
load();
renderHome();
/* 島が 1つだけの アプリ（エネルギーの島 など）には 海の 地図が ない
   （ビルドが がめんごと とりのぞく）。島の 中（ミニゲームの 一覧）から はじめる。
   🔬かんがえかたの島は その 一覧の 下に つづけて 出る（91-home.js の methodSection）。 */
/* ゲームが 1つだけの アプリ（でんき回路 など）は、その ゲームを いきなり ひらく。
   ゲームえらびも ポータルが する ので、1つしか ない 一覧を 見せる いみが ない。
   つづきから はじまる（まだ クリアして いない さいしょの もんだい）。 */
if (HOME_GAME) startGame(HOME_GAME, firstTodo(gameById(HOME_GAME)));
else if (HOME_ISLAND) openIsland(HOME_ISLAND);
if ('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./sw.js').catch(function(){});
  });
}