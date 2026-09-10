/* ================================================================== *
 * そだて型 — じょうけんを えらんで 植物を そだてる（5年 発芽と成長／6年 受粉）
 *
 *   4つの じょうけんを 自分で ON/OFF して そだてる。どこまで 育つかは
 *   **ルールで 計算する**（正かいの くみあわせは 書いて いない）:
 *     水 と あたたかさ が ないと 芽が 出ない（日光・肥料は 発芽には いらない！）
 *     日光が ないと 白い もやしに なる ／ 肥料が ないと 大きく ならない
 *     花が さいたら じゅふんさせて はじめて 実が できる
 *   ★は「よけいな じょうけんを つけない」。＝ ほんとうに 必要な ものを 見つける あそび。
 * ================================================================== */
var SD = { conds:[
  { id:'mizu',     icon:'💧', name:'水を やる' },
  { id:'atatakai', icon:'🌡️', name:'あたたかい へや' },
  { id:'hikari',   icon:'☀️', name:'日光に あてる' },
  { id:'hiryo',    icon:'🌿', name:'肥料を やる' }
], H:430, gy:352 };
function sodateStage(){
  var c = cur.cond;
  if (!(c.mizu && c.atatakai)) return 0;        /* 芽が 出ない */
  if (!c.hikari) return 1;                      /* 芽は 出るが 白い もやし */
  if (!c.hiryo) return 2;                       /* 葉は 出るが 小さい */
  return cur.jufun ? 4 : 3;                     /* 花 → じゅふんで 実 */
}
function sodateOn(){ var n = 0; SD.conds.forEach(function(c){ if (cur.cond[c.id]) n++; }); return n; }
function loadSodate(st){
  if (cur.sdRaf){ cancelAnimationFrame(cur.sdRaf); cur.sdRaf = null; }
  cur.cond = { mizu:false, atatakai:false, hikari:false, hiryo:false };
  cur.jufun = false; cur.grown = -1; cur.day = 0; cur.sdRun = false; cur.sdMsg = '';
}
function sodateOK(){ return cur.grown >= curStage().need; }
/* ---- 植物の え。stage 0=たね 1=もやし 2=小さい葉 3=花 4=実 ---- */
function plantArt(stage, k){
  var s = '', gy = SD.gy, cx = 0;
  /* はち と 土 */
  s += '<path d="M-62 ' + (gy - 46) + ' h124 l-12 76 q-2 8 -10 8 h-80 q-8 0 -10 -8 Z" fill="#D98E5F" stroke="#A8663E" stroke-width="3" stroke-linejoin="round"/>';
  s += '<rect x="-66" y="' + (gy - 56) + '" width="132" height="14" rx="5" fill="#C77E52" stroke="#A8663E" stroke-width="3"/>';
  s += '<path d="M-56 ' + (gy - 42) + ' h112 v12 h-112 Z" fill="#6B4A32"/>';
  if (stage <= 0){
    s += '<ellipse cx="0" cy="' + (gy - 34) + '" rx="7" ry="5" fill="#B4844F" stroke="#8C6135" stroke-width="2"/>';
    return s;
  }
  var green = (stage === 1) ? '#E8E4C8' : '#4FC46A', dark = (stage === 1) ? '#C8C4A2' : '#2E9A4C';
  var h = (stage === 1) ? 54 : (stage === 2 ? 62 : 96);
  var top = gy - 42 - h * k;
  s += '<path d="M0 ' + (gy - 40) + ' Q' + (stage === 1 ? -14 : 4) + ' ' + ((gy - 40 + top) / 2) + ' 0 ' + top.toFixed(1) +
       '" fill="none" stroke="' + dark + '" stroke-width="' + (stage === 1 ? 4 : 7) + '" stroke-linecap="round"/>';
  /* 葉 */
  var leaves = (stage === 1) ? 2 : (stage === 2 ? 2 : 4);
  for (var i = 0; i < leaves; i++){
    var ly = gy - 56 - (h * k) * (0.35 + i * 0.2), sgn = (i % 2 ? 1 : -1);
    var lw = (stage === 1) ? 12 : (stage === 2 ? 20 : 30);
    /* マイナスの 数を 文字の '-' と つなぐと "--24" に なって パスが こわれる。数で 計算して から 出す */
    s += '<path d="M0 ' + ly.toFixed(1) + ' q' + (sgn * lw).toFixed(1) + ' ' + (-lw * 0.6).toFixed(1) + ' ' +
         (sgn * lw * 1.6).toFixed(1) + ' 2 q' + (-sgn * lw * 0.8).toFixed(1) + ' ' + (lw * 0.7).toFixed(1) + ' ' +
         (-sgn * lw * 1.6).toFixed(1) + ' -2 Z" fill="' + green + '" stroke="' + dark + '" stroke-width="2"/>';
  }
  if (stage >= 3){
    /* 花 */
    for (var p = 0; p < 6; p++){
      var a = p * Math.PI / 3;
      s += '<ellipse cx="' + (Math.cos(a) * 13).toFixed(1) + '" cy="' + (top + Math.sin(a) * 13).toFixed(1) +
           '" rx="9" ry="7" fill="#F7A8C4" stroke="#D07A9C" stroke-width="2" transform="rotate(' +
           (p * 60) + ' ' + (Math.cos(a) * 13).toFixed(1) + ' ' + (top + Math.sin(a) * 13).toFixed(1) + ')"/>';
    }
    s += '<circle cx="0" cy="' + top.toFixed(1) + '" r="8" fill="#F5B324" stroke="#C9820A" stroke-width="2"/>';
  }
  if (stage >= 4){
    s += '<circle cx="26" cy="' + (top + 26).toFixed(1) + '" r="14" fill="#E05A4A" stroke="#B03A45" stroke-width="2.5"/>';
    s += '<path d="M26 ' + (top + 12).toFixed(1) + ' q6 -8 12 -6" fill="none" stroke="#2E9A4C" stroke-width="3" stroke-linecap="round"/>';
  }
  return s;
}
function renderSodate(){
  var st = curStage();
  setBoardBox(600, SD.H);
  var stg = (cur.grown >= 0) ? cur.grown : 0;
  var k = cur.sdRun ? Math.min(1, cur.day / 7) : (cur.grown >= 0 ? 1 : 0);
  var s = '';
  /* ---- ミッション帯 ---- */
  s += '<rect x="20" y="8" width="560" height="34" rx="12" fill="#FFF8E4" stroke="#F5B324" stroke-width="2"/>';
  s += '<text x="36" y="31" font-size="13" font-weight="900" fill="#8A5B00">🎯 ' + st.goal + '</text>';
  s += '<text x="564" y="31" font-size="13" font-weight="900" fill="' + (sodateOn() > st.star ? '#E08A00' : '#8A5B00') +
       '" text-anchor="end">つけた じょうけん ' + sodateOn() + '　★' + st.star + 'つまで</text>';

  /* ---- じょうけんの スイッチ ---- */
  SD.conds.forEach(function(c, ci){
    var y = 78 + ci * 46, on = cur.cond[c.id];
    s += '<g transform="translate(148,' + y + ')">' +
         '<rect x="-118" y="-19" width="236" height="38" rx="14" fill="' + (on ? '#2E9A4C' : '#fff') +
         '" stroke="' + (on ? '#1E6E37' : '#B9C6D1') + '" stroke-width="' + (on ? 4 : 3) + '"/>' +
         '<text x="-96" y="6" font-size="17" text-anchor="middle">' + c.icon + '</text>' +
         '<text x="6" y="6" font-size="14" font-weight="900" fill="' + (on ? '#fff' : '#3B5A70') +
         '" text-anchor="middle">' + c.name + '</text>' +
         '<text x="98" y="6" font-size="12" font-weight="900" fill="' + (on ? '#fff' : '#A9B7C2') +
         '" text-anchor="middle">' + (on ? 'ON' : 'OFF') + '</text>' +
         (cur.sdRun ? '' : '<rect x="-118" y="-19" width="236" height="38" fill="transparent" data-cond="' + c.id + '"/>') +
         '</g>';
  });
  /* ---- そだてる ボタン ---- */
  s += '<g transform="translate(148,282)">' +
       '<rect x="-104" y="-23" width="208" height="46" rx="23" fill="' + (cur.sdRun ? '#DCE5EB' : '#1B7FA8') + '"/>' +
       '<text x="0" y="7" font-size="16" font-weight="900" fill="' + (cur.sdRun ? '#A9B7C2' : '#fff') +
       '" text-anchor="middle">▶ 7日 そだてる</text>' +
       (cur.sdRun ? '' : '<rect x="-104" y="-23" width="208" height="46" fill="transparent" data-grow="1"/>') + '</g>';
  /* じゅふん（花が さいて いる ときだけ） */
  if (!cur.sdRun && cur.grown === 3 && !cur.jufun)
    s += '<g transform="translate(148,340)">' +
         '<rect x="-104" y="-21" width="208" height="42" rx="21" fill="#E8618C"/>' +
         '<text x="0" y="6" font-size="15" font-weight="900" fill="#fff" text-anchor="middle">🖌 じゅふんさせる</text>' +
         '<rect x="-104" y="-21" width="208" height="42" fill="transparent" data-jufun="1"/></g>';

  /* ---- 日づけ と 植木ばち ---- */
  s += '<text x="430" y="72" font-size="15" font-weight="900" fill="#5A7C93" text-anchor="middle">' +
       (cur.grown < 0 ? 'まだ たねの まま' : (cur.day | 0) + '日目') + '</text>';
  if (cur.cond.hikari)
    s += '<circle cx="546" cy="98" r="20" fill="#F5B324" opacity=".9"/><text x="546" y="105" font-size="20" text-anchor="middle">☀️</text>';
  s += '<g transform="translate(430,0)">' + plantArt(stg, k) + '</g>';
  s += '<rect x="300" y="' + (SD.gy + 40) + '" width="260" height="3" rx="1" fill="#DCE5EB"/>';
  document.getElementById('board').innerHTML = s;

  if (cur.sdMsg) setStatus(cur.sdMsg, cur.sdBad === true);
  else if (cur.sdRun) setStatus('そだって いるよ…', false);
  else setStatus('じょうけんを えらんで「7日 そだてる」を おそう', false);
  tryClear(sodateOK());
}
var SD_MSG = [
  '芽が 出なかった…。たねが 芽を 出すのに ひつような ものは そろって いるかな？',
  '芽は 出たけれど 白くて ひょろひょろ（もやし）。日光が ないと 緑に なれないんだ。',
  '緑の 葉に なった！ でも 小さいまま。もっと 大きく そだてるには？',
  '大きく そだって 花が さいた！ 実を つけるには じゅふんが いるよ。',
  '実が できた！ 中には つぎの いのち（たね）が 入って いる。'
];
function sodateGo(){
  var st = curStage(), goal = sodateStage();
  cur.sdRun = true; cur.day = 0; cur.grown = goal; cur.sdMsg = '';
  renderBoard();
  var last = null;
  function step(now){
    if (cur.kind !== 'sodate' || !cur.sdRun){ cur.sdRaf = null; return; }
    if (last === null) last = now;
    cur.day = Math.min(7, cur.day + Math.min(0.05, (now - last) / 1000) * 3.2);
    last = now;
    renderBoard();
    if (cur.day >= 7){
      cur.sdRun = false;
      cur.sdMsg = SD_MSG[goal]; cur.sdBad = (goal < st.need);
      if (sodateOK()) cur.noStar = (sodateOn() > st.star);
      cur.sdRaf = null; renderBoard(); return;
    }
    cur.sdRaf = requestAnimationFrame(step);
  }
  cur.sdRaf = requestAnimationFrame(step);
}
function tapSodate(e){
  if (cur.sdRun) return;
  var cd = attrUp(e.target, 'data-cond');
  if (cd !== null){ cur.cond[cd] = !cur.cond[cd]; cur.sdMsg = ''; renderBoard(); return; }
  if (attrUp(e.target, 'data-jufun') !== null){
    cur.jufun = true; cur.grown = 4;
    cur.sdMsg = SD_MSG[4]; cur.sdBad = false;
    if (sodateOK()) cur.noStar = (sodateOn() > curStage().star);
    renderBoard(); return;
  }
  if (attrUp(e.target, 'data-grow') !== null){ sodateGo(); return; }
}
ENGINES.sodate = { load:loadSodate, render:renderSodate, tap:tapSodate };
