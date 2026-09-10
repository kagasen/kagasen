/* ================================================================== *
 * こうじょう型 — リサイクル工場（60びょうの スコアアタック）
 *
 *   ★ここは「理科の もんだい」では なく **ゲーム**。
 *     ベルトコンベアで 流れて くる ゴミを、でんじしゃくクレーンで つかんで はこへ 入れる。
 *     60びょうで どれだけ あつめられるか。にがすと ゼロ。
 *
 *   あそんで いるだけで 手が おぼえる こと（説明は しない）:
 *     ・でんじしゃくの 強さは **まきかず × でんち**（ボタンに そう 書いて あるだけ）
 *     ・強くするほど **電気を たくさん つかう**（ゲージが 減る）→ 重さに 合わせて えらぶ ように なる
 *     ・**アルミは 何回 やっても つかない** → 見た だけで よけるように なる
 *     ・スイッチを 切れば はなせる（つかむ→はこぶ→はなすが 1タップで つながる）
 *
 *   むずかしさは 「流れて くる ゴミの おもさ」で つける。正かいの そうさは 用意して いない。
 * ================================================================== */

/* ---- ゴミの え（リサイクル工場で つかう）---- */
function craneArt(kind){
  var tet = '#8FA3B8', tetD = '#5A7C93', alu = '#DCE3E9', aluD = '#A9B7C2';
  if (kind === 'kugi')
    return '<rect x="-7" y="-16" width="14" height="5" rx="2" fill="' + tetD + '"/>' +
           '<path d="M-3 -11 L3 -11 L1.6 14 L0 17 L-1.6 14 Z" fill="' + tet + '" stroke="' + tetD + '" stroke-width="1.5"/>';
  if (kind === 'spana')
    return '<rect x="-20" y="-6" width="40" height="12" rx="6" fill="' + tet + '" stroke="' + tetD + '" stroke-width="2"/>' +
           '<path d="M-26 -10 a10,10 0 1 0 0,20 l0,-6 a5,5 0 1 1 0,-8 Z" fill="' + tet + '" stroke="' + tetD + '" stroke-width="2"/>' +
           '<circle cx="22" cy="0" r="9" fill="' + tet + '" stroke="' + tetD + '" stroke-width="2"/>' +
           '<circle cx="22" cy="0" r="4" fill="#EEF3F7"/>';
  if (kind === 'ita')
    return '<rect x="-30" y="-11" width="60" height="22" rx="3" fill="' + tet + '" stroke="' + tetD + '" stroke-width="2.5"/>' +
           '<circle cx="-20" cy="0" r="3" fill="' + tetD + '"/><circle cx="20" cy="0" r="3" fill="' + tetD + '"/>';
  if (kind === 'katamari')
    return '<path d="M-26 10 L-19 -13 L2 -20 L24 -6 L18 14 Z" fill="' + tet + '" stroke="' + tetD + '" stroke-width="2.5" stroke-linejoin="round"/>' +
           '<path d="M-10 -8 L4 -12 M-4 4 L12 0" stroke="' + tetD + '" stroke-width="2" stroke-linecap="round"/>';
  if (kind === 'kan')
    return '<rect x="-12" y="-18" width="24" height="36" rx="3" fill="' + alu + '" stroke="' + aluD + '" stroke-width="2.5"/>' +
           '<ellipse cx="0" cy="-18" rx="12" ry="4" fill="#EEF3F7" stroke="' + aluD + '" stroke-width="2"/>' +
           '<rect x="-12" y="-5" width="24" height="9" fill="' + aluD + '" opacity=".45"/>';
  return '<path d="M-14 6 L-9 -12 L6 -15 L15 -2 L8 13 Z" fill="' + alu + '" stroke="' + aluD + '" stroke-width="2.5" stroke-linejoin="round"/>' +
         '<path d="M-6 -6 L2 2 M4 -8 L9 -3" stroke="' + aluD + '" stroke-width="1.8" stroke-linecap="round"/>';
}
var FC = {
  H:470, rail:104, beltY:300, beltH:24, endX:410, boxX:538, boxW:116,
  armIdle:52, armDown:150, speed:600, time:60, power:100
};
/* えらべる でんじしゃく。max は もち上げられる 重さ ＝ (まきかず/100)×でんち×3 */
var FC_POWER = [
  { id:0, name:'よわ',   maki:100, den:1, max:3,  cost:1,  col:'#7FB6D6' },
  { id:1, name:'ちゅう', maki:300, den:1, max:9,  cost:3,  col:'#F5B324' },
  { id:2, name:'つよ',   maki:500, den:2, max:30, cost:10, col:'#E05A4A' }
];
/* ベルトを 流れて くる もの */
var FC_JUNK = [
  { id:'kugi',     name:'ねじ',       w:1,  mat:'tetsu' },
  { id:'spana',    name:'スパナ',     w:4,  mat:'tetsu' },
  { id:'ita',      name:'鉄板',       w:8,  mat:'tetsu' },
  { id:'katamari', name:'かたまり',   w:16, mat:'tetsu' },
  { id:'kan',      name:'アルミかん', w:2,  mat:'alumi' },
  { id:'haku',     name:'アルミはく', w:1,  mat:'alumi' }
];
function fcJunk(id){ for (var i=0;i<FC_JUNK.length;i++){ if (FC_JUNK[i].id === id) return FC_JUNK[i]; } return null; }
function fcPow(){ return FC_POWER[cur.pw]; }

function loadFactory(st){
  if (cur.fcRaf){ cancelAnimationFrame(cur.fcRaf); cur.fcRaf = null; }
  cur.items = []; cur.seq = 0;
  cur.pw = 0; cur.power = FC.power;
  cur.score = 0; cur.miss = 0; cur.combo = 0; cur.bestCombo = 0;
  cur.left = FC.time; cur.playing = false; cur.over = false;
  cur.cx = 300; cur.arm = FC.armIdle; cur.hold = null; cur.on = false;
  cur.chase = null; cur.phase = 'idle'; cur.flash = null; cur.spawnT = 0; cur.domKeys = null;
}
function factoryOK(){ return cur.over && cur.score >= curStage().target; }

/* ---- 1フレームぶん すすめる ---- */
function fcStep(dt){
  var st = curStage(), i, it;
  cur.left = Math.max(0, cur.left - dt);
  /* ゴミを 出す */
  cur.spawnT -= dt;
  if (cur.spawnT <= 0){
    cur.spawnT = st.every;
    var pool = st.pool;
    var pick = pool[(Math.random() * pool.length) | 0];
    cur.items.push({ key:'i' + (cur.seq++), kind:pick, x:-40 });
  }
  /* ベルトで 右へ */
  for (i = cur.items.length - 1; i >= 0; i--){
    it = cur.items[i];
    if (cur.hold === it.key) continue;
    it.x += st.belt * dt;
    if (it.x > FC.endX + 30){
      if (fcJunk(it.kind).mat === 'tetsu'){ cur.miss++; cur.combo = 0; fcFlash('にがした！', '#E05A4A'); }
      cur.items.splice(i, 1);
      if (cur.chase === it.key){ cur.chase = null; cur.phase = 'idle'; }
    }
  }
  /* クレーン */
  var tgt = null;
  if (cur.phase === 'chase'){
    tgt = null;
    for (i = 0; i < cur.items.length; i++) if (cur.items[i].key === cur.chase) tgt = cur.items[i];
    if (!tgt){ cur.phase = 'idle'; cur.chase = null; }
    else {
      var dx = tgt.x - cur.cx, mv = FC.speed * dt;
      cur.cx += Math.max(-mv, Math.min(mv, dx));
      cur.arm = Math.min(FC.armDown, cur.arm + 520 * dt);
      if (Math.abs(tgt.x - cur.cx) < 10 && cur.arm >= FC.armDown - 1) fcGrab(tgt);
    }
  } else if (cur.phase === 'carry'){
    var dx2 = FC.boxX - cur.cx, mv2 = FC.speed * dt;
    cur.cx += Math.max(-mv2, Math.min(mv2, dx2));
    cur.arm = Math.max(FC.armIdle, cur.arm - 520 * dt);
    if (Math.abs(FC.boxX - cur.cx) < 6) fcDrop();
  } else {
    cur.arm = Math.max(FC.armIdle, cur.arm - 520 * dt);
  }
  if (cur.flash){ cur.flash.t -= dt; if (cur.flash.t <= 0) cur.flash = null; }
  if (cur.left <= 0) fcFinish();
}
function fcFlash(text, col){ cur.flash = { text:text, col:col, t:1.0 }; }
function fcGrab(it){
  var j = fcJunk(it.kind), p = fcPow();
  cur.power = Math.max(0, cur.power - p.cost);
  cur.on = true;
  if (j.mat !== 'tetsu'){
    fcFlash('アルミは つかない！', '#8FA3B8'); cur.combo = 0;
    cur.on = false; cur.phase = 'idle'; cur.chase = null; return;
  }
  if (j.w > p.max){
    fcFlash(j.w + 'kg には 弱すぎ！', '#E08A00'); cur.combo = 0;
    cur.on = false; cur.phase = 'idle'; cur.chase = null; return;
  }
  cur.hold = it.key; cur.phase = 'carry'; cur.chase = null;
}
function fcDrop(){
  var it = null, i;
  for (i = 0; i < cur.items.length; i++) if (cur.items[i].key === cur.hold) it = cur.items[i];
  if (it){
    var j = fcJunk(it.kind);
    cur.combo++;
    if (cur.combo > cur.bestCombo) cur.bestCombo = cur.combo;
    var got = j.w * (cur.combo >= 3 ? 2 : 1);
    cur.score += got;
    fcFlash('＋' + got + 'kg' + (cur.combo >= 3 ? '　' + cur.combo + 'れんぞく！ ２ばい' : ''), '#2E9A4C');
    cur.items.splice(cur.items.indexOf(it), 1);
  }
  cur.hold = null; cur.on = false; cur.phase = 'idle';
}
function fcFinish(){
  cur.playing = false; cur.over = true;
  if (cur.fcRaf){ cancelAnimationFrame(cur.fcRaf); cur.fcRaf = null; }
  var st = curStage();
  cur.noStar = !(cur.score >= st.star);
  fcRender(true);
}
function fcLoop(){
  var last = null;
  function step(now){
    if (cur.kind !== 'factory' || !cur.playing){ cur.fcRaf = null; return; }
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fcStep(dt);
    fcRender(false);
    if (cur.playing) cur.fcRaf = requestAnimationFrame(step);
  }
  cur.fcRaf = requestAnimationFrame(step);
}
/* ---- え ----
   ★大事: **毎フレーム innerHTML を 作りなおすと タップが 通らなく なる**。
   （おした しゅんかんの ぶひんが 消えるので click が 出ない ＝ ゲームに ならない）
   だから ぶひんが 出入りした ときだけ 作りなおし、ふだんは transform だけ 書きかえる。 */
function fcItemsSVG(){
  return cur.items.map(function(it){
    var j = fcJunk(it.kind);
    return '<g id="fc-' + it.key + '" transform="translate(' + it.x.toFixed(1) + ',' + (FC.beltY - 22) + ')">' +
      craneArt(it.kind) +
      '<text x="0" y="64" font-size="12" font-weight="900" fill="' +
      (j.mat === 'tetsu' ? '#3B5A70' : '#A9B7C2') + '" text-anchor="middle">' + j.w + 'kg</text>' +
      '<rect x="-36" y="-38" width="72" height="92" fill="transparent" data-pick="' + it.key + '"/></g>';
  }).join('');
}
function fcCraneSVG(){
  var s = '<g id="fc-crane" transform="translate(' + cur.cx.toFixed(1) + ',0)">';
  s += '<rect x="-26" y="' + (FC.rail - 16) + '" width="52" height="16" rx="6" fill="#5A7C93"/>';
  s += '<line id="fc-cable" x1="0" y1="' + FC.rail + '" x2="0" y2="' + (FC.rail + cur.arm).toFixed(1) +
       '" stroke="#7A8794" stroke-width="4"/>';
  s += '<g id="fc-arm" transform="translate(0,' + (FC.rail + cur.arm).toFixed(1) + ')">';
  s += '<rect id="fc-mag" x="-30" y="-6" width="60" height="18" rx="4" fill="' + (cur.on ? '#E05A4A' : '#8FA3B8') +
       '" stroke="#5A7C93" stroke-width="2.5"/>';
  for (var i = 0; i < 5; i++)
    s += '<line x1="' + (-24 + i * 12) + '" y1="-6" x2="' + (-24 + i * 12) + '" y2="12" stroke="#C97A3C" stroke-width="3"/>';
  return s + '</g></g>';
}
/* 1フレームぶんの こうしん（作りなおしは ぶひんが かわった ときだけ） */
function fcSync(){
  var dyn = document.getElementById('fc-dyn');
  if (!dyn) return false;
  var keys = cur.items.map(function(it){ return it.key; }).join(',');
  if (keys !== cur.domKeys){ dyn.innerHTML = fcItemsSVG() + fcCraneSVG(); cur.domKeys = keys; }
  cur.items.forEach(function(it){
    var g = document.getElementById('fc-' + it.key);
    if (!g) return;
    var y = (cur.hold === it.key) ? (FC.rail + cur.arm + 40) : (FC.beltY - 22);
    var x = (cur.hold === it.key) ? cur.cx : it.x;
    g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
  });
  var cg = document.getElementById('fc-crane');
  if (cg){
    cg.setAttribute('transform', 'translate(' + cur.cx.toFixed(1) + ',0)');
    var cb = document.getElementById('fc-cable'), am = document.getElementById('fc-arm'), mg = document.getElementById('fc-mag');
    if (cb) cb.setAttribute('y2', (FC.rail + cur.arm).toFixed(1));
    if (am) am.setAttribute('transform', 'translate(0,' + (FC.rail + cur.arm).toFixed(1) + ')');
    if (mg) mg.setAttribute('fill', cur.on ? '#E05A4A' : '#8FA3B8');
  }
  var fl = document.getElementById('fc-flash');
  if (fl){
    fl.textContent = cur.flash ? cur.flash.text : '';
    if (cur.flash){ fl.setAttribute('fill', cur.flash.col); fl.setAttribute('opacity', Math.min(1, cur.flash.t * 1.6).toFixed(2)); }
  }
  var sc = document.getElementById('fc-score'), tm = document.getElementById('fc-time'), pw = document.getElementById('fc-pw');
  if (sc) sc.textContent = cur.score + ' kg';
  if (tm){
    tm.textContent = Math.ceil(cur.left) + '';
    tm.setAttribute('fill', cur.left <= 10 ? '#E05A4A' : '#8A5B00');
  }
  if (pw) pw.setAttribute('width', (166 * cur.power / FC.power).toFixed(1));
  return true;
}
function fcRender(full){
  if (full || !cur.playing || !fcSync()) renderFactory();
}
function renderFactory(){
  var st = curStage(), i;
  setBoardBox(600, FC.H);
  var s = '';
  /* ---- ヘッダ ---- */
  s += '<rect x="20" y="6" width="176" height="40" rx="12" fill="#EAF3F8"/>';
  s += '<text x="34" y="32" font-size="13" font-weight="900" fill="#5A7C93">あつめた</text>';
  s += '<text id="fc-score" x="182" y="33" font-size="20" font-weight="900" fill="#0F3350" text-anchor="end">' + cur.score + ' kg</text>';
  s += '<circle cx="300" cy="26" r="21" fill="' + (cur.left <= 10 ? '#FFE3E0' : '#FFF8E4') + '" stroke="' +
       (cur.left <= 10 ? '#E05A4A' : '#F5B324') + '" stroke-width="3"/>';
  s += '<text id="fc-time" x="300" y="34" font-size="20" font-weight="900" fill="' +
       (cur.left <= 10 ? '#E05A4A' : '#8A5B00') + '" text-anchor="middle">' + Math.ceil(cur.left) + '</text>';
  s += '<rect x="404" y="6" width="176" height="40" rx="12" fill="#EAF3F8"/>';
  s += '<text x="416" y="24" font-size="11" font-weight="900" fill="#5A7C93">でんき</text>';
  s += '<rect x="412" y="28" width="166" height="12" rx="6" fill="#DCE5EB"/>';
  s += '<rect id="fc-pw" x="412" y="28" width="' + (166 * cur.power / FC.power).toFixed(1) +
       '" height="12" rx="6" fill="#F5B324"/>';
  s += '<text x="572" y="24" font-size="11" font-weight="900" fill="#8FA3B8" text-anchor="end">もくひょう ' + st.target + 'kg</text>';

  /* ---- レール・ベルト・はこ ---- */
  s += '<rect x="10" y="' + (FC.rail - 8) + '" width="580" height="9" rx="4" fill="#B9C6D1"/>';
  s += '<rect x="0" y="' + FC.beltY + '" width="' + (FC.endX + 20) + '" height="' + FC.beltH + '" rx="10" fill="#5A7C93"/>';
  for (i = 0; i < 16; i++)
    s += '<line x1="' + (i * 30 + 10) + '" y1="' + FC.beltY + '" x2="' + (i * 30 + 2) + '" y2="' + (FC.beltY + FC.beltH) +
         '" stroke="#8FA3B8" stroke-width="3"/>';
  s += '<path d="M' + (FC.endX + 26) + ' ' + (FC.beltY + 8) + ' v22 l-7 -7 M' + (FC.endX + 26) + ' ' + (FC.beltY + 30) +
       ' l7 -7" fill="none" stroke="#E05A4A" stroke-width="3" stroke-linecap="round"/>';
  s += '<text x="' + (FC.endX + 26) + '" y="' + (FC.beltY + 48) + '" font-size="11" font-weight="900" fill="#E05A4A" text-anchor="middle">おちる</text>';
  s += '<path d="M' + (FC.boxX - FC.boxW/2) + ' 300 v72 h' + FC.boxW + ' v-72" fill="#EFE3D2" stroke="#A87C4F" stroke-width="4" stroke-linejoin="round"/>';
  s += '<text x="' + FC.boxX + '" y="292" font-size="12" font-weight="900" fill="#A87C4F" text-anchor="middle">鉄の はこ</text>';

  /* ---- うごく ぶぶん（ここだけ 毎フレーム さわる） ---- */
  s += '<g id="fc-dyn">' + fcItemsSVG() + fcCraneSVG() + '</g>';
  s += '<text id="fc-flash" x="300" y="' + (FC.beltY - 96) + '" font-size="20" font-weight="900" fill="' +
       (cur.flash ? cur.flash.col : '#fff') + '" text-anchor="middle" opacity="' +
       (cur.flash ? Math.min(1, cur.flash.t * 1.6).toFixed(2) : 0) + '">' + (cur.flash ? cur.flash.text : '') + '</text>';

  /* ---- でんじしゃくを えらぶ ---- */
  FC_POWER.forEach(function(p, pi){
    var bx = 118 + pi * 182, on = (cur.pw === pi), dead = (cur.power < p.cost);
    s += '<g transform="translate(' + bx + ',' + (FC.H - 44) + ')">';
    s += '<rect x="-86" y="-30" width="172" height="60" rx="16" fill="' + (on ? p.col : '#fff') +
         '" stroke="' + (on ? '#0F3350' : '#B9C6D1') + '" stroke-width="' + (on ? 4 : 3) + '" opacity="' + (dead ? 0.45 : 1) + '"/>';
    s += '<text x="0" y="-8" font-size="15" font-weight="900" fill="' + (on ? '#fff' : '#3B5A70') +
         '" text-anchor="middle">' + p.name + '　' + p.max + 'kgまで</text>';
    s += '<text x="0" y="12" font-size="11" font-weight="900" fill="' + (on ? '#fff' : '#8FA3B8') +
         '" text-anchor="middle">' + p.maki + 'かい × でんち' + p.den + 'こ</text>';
    s += '<text x="0" y="26" font-size="10" font-weight="900" fill="' + (on ? '#fff' : '#C9820A') +
         '" text-anchor="middle">でんき −' + p.cost + '</text>';
    s += '<rect x="-86" y="-30" width="172" height="60" fill="transparent" data-pw="' + pi + '"/></g>';
  });

  /* ---- スタート／けっか ---- */
  if (!cur.playing && !cur.over){
    s += '<rect x="0" y="0" width="600" height="' + FC.H + '" fill="#0F3350" opacity=".42"/>';
    s += '<g transform="translate(300,200)"><rect x="-170" y="-58" width="340" height="116" rx="24" fill="#fff"/>' +
         '<text x="0" y="-16" font-size="17" font-weight="900" fill="#0F3350" text-anchor="middle">' + st.goal + '</text>' +
         '<text x="0" y="10" font-size="13" font-weight="900" fill="#5A7C93" text-anchor="middle">' + FC.time + 'びょうで ' + st.target + 'kg あつめろ！</text>' +
         '<rect x="-84" y="24" width="168" height="30" rx="15" fill="#2E9A4C"/>' +
         '<text x="0" y="45" font-size="15" font-weight="900" fill="#fff" text-anchor="middle">▶ スタート</text>' +
         '<rect x="-170" y="-58" width="340" height="116" fill="transparent" data-fcgo="1"/></g>';
  }
  if (cur.over){
    var win = (cur.score >= st.target);
    s += '<rect x="0" y="0" width="600" height="' + FC.H + '" fill="#0F3350" opacity=".42"/>';
    s += '<g transform="translate(300,206)"><rect x="-190" y="-96" width="380" height="192" rx="24" fill="#fff"/>';
    s += '<text x="0" y="-58" font-size="22" font-weight="900" fill="' + (win ? '#2E9A4C' : '#E08A00') +
         '" text-anchor="middle">' + (win ? 'ミッション たっせい！' : 'もう ちょっと！') + '</text>';
    s += '<text x="0" y="-24" font-size="17" font-weight="900" fill="#0F3350" text-anchor="middle">あつめた 鉄　' + cur.score + ' kg</text>';
    s += '<text x="0" y="2" font-size="13" font-weight="900" fill="#5A7C93" text-anchor="middle">にがした ' + cur.miss +
         'こ　／　さいこう ' + cur.bestCombo + 'れんぞく　／　のこり でんき ' + cur.power + '</text>';
    s += '<text x="0" y="26" font-size="12" font-weight="900" fill="' + (cur.score >= st.star ? '#C9820A' : '#A9B7C2') +
         '" text-anchor="middle">★きんカードは ' + st.star + 'kg いじょう</text>';
    s += '<rect x="-84" y="44" width="168" height="34" rx="17" fill="#1B7FA8"/>' +
         '<text x="0" y="67" font-size="15" font-weight="900" fill="#fff" text-anchor="middle">↺ もう いちど</text>' +
         '<rect x="-84" y="44" width="168" height="34" fill="transparent" data-fcgo="1"/></g>';
  }
  document.getElementById('board').innerHTML = s;
  if (cur.over) setStatus('', false);
  else if (!cur.playing) setStatus('', false);
  else setStatus('ゴミを タップ！　重い ものは 強い でんじしゃくで', false);
  tryClear(factoryOK());
}
function tapFactory(e){
  if (attrUp(e.target, 'data-fcgo') !== null){
    var st = curStage();
    loadFactory(st); cur.playing = true; cur.over = false;
    renderFactory(); fcLoop(); return;
  }
  var pw = attrUp(e.target, 'data-pw');
  if (pw !== null){
    pw = parseInt(pw, 10);
    if (cur.power >= FC_POWER[pw].cost) cur.pw = pw;
    else fcFlash('でんきが 足りない…', '#8FA3B8');
    renderFactory(); return;
  }
  if (!cur.playing) return;
  var pk = attrUp(e.target, 'data-pick');
  if (pk !== null && cur.phase === 'idle' && !cur.hold){
    if (cur.power < fcPow().cost){ fcFlash('でんきが 足りない！ よわい ほうへ', '#8FA3B8'); return; }
    cur.chase = pk; cur.phase = 'chase';
  }
}
ENGINES.factory = { load:loadFactory, render:renderFactory, tap:tapFactory };

/* ================================================================== *
 * リサイクル工場 v4 — 56この大盤面・落下補充・同種クラスタ
 *
 * 参考にした遊びの核は「同じ種類を3こ以上なぞる」。ここでは 色合わせではなく
 * ごみの分別そのものにし、消した数が実際の再生品として見えるようにした。
 * ================================================================== */
var FC_TYPES = [
  { id:'burn', name:'もえるごみ', short:'もえる', col:'#F08A3C', dark:'#A84E18',
    junk:[['🍌','なまごみ'],['🧻','ティッシュ'],['🍂','おちば']], product:['⚡','電気'] },
  { id:'plastic', name:'プラごみ', short:'プラ', col:'#39A9DB', dark:'#17678E',
    junk:[['🧴','プラ容器'],['🍱','トレー'],['🛍️','ふくろ']], product:['🪑','ベンチ'] },
  { id:'can', name:'空きかん', short:'かん', col:'#3FB98A', dark:'#17684B',
    junk:[['🥫','スチール缶'],['🥤','アルミ缶'],['🫙','おかし缶']], product:['🚗','鉄・アルミ製品'] },
  { id:'bottle', name:'ガラスびん', short:'びん', col:'#8B7BE8', dark:'#504096',
    junk:[['🍾','透明びん'],['🍷','茶色びん'],['🫙','食品びん']], product:['🍾','新しい びん'] },
  { id:'glass', name:'ガラス・陶器', short:'われもの', col:'#DB6D93', dark:'#8F3357',
    junk:[['🪞','かがみ'],['☕','陶器'],['🔺','割れガラス']], product:['📦','安全に 処分'] },
  { id:'bulky', name:'そだいごみ', short:'そだい', col:'#A9794B', dark:'#684424',
    junk:[['🛋️','ソファ'],['🗄️','たんす'],['🛏️','ベッド']], product:['🧱','再生ボード'] },
  { id:'metal', name:'かん・金属', short:'金属', col:'#43AE83', dark:'#24704F',
    junk:[['🍳','なべ'],['🔧','金具'],['🚲','自転車部品']], product:['🛤️','鉄製品'] }
];
var FC_TRANSFORMS = {
  burn:{title:'熱回収',icon:'⚡',to:'電気と 熱',note:'もやした熱を エネルギーに かえる'},
  plastic:{title:'材料リサイクル',icon:'🪑',to:'プラ製品',note:'よごれや異物を取り、くだいて 新しい材料へ'},
  can:{title:'金属リサイクル',icon:'🚗',to:'鉄・アルミ製品',note:'中を すすぎ、材質ごとに より分けて とかす'},
  bottle:{title:'びんリサイクル',icon:'🍾',to:'新しい びん',note:'色などで 分け、くだいて カレットに する'},
  glass:{title:'安全な 分別',icon:'📦',to:'不燃・危険物の 回収へ',note:'びん回収には まぜず、包んで 危険を 表示'},
  bulky:{title:'リユース',icon:'🏪',to:'中古販売店へ',note:'まだ使える家具は なおして つぎの人へ'},
  metal:{title:'金属リサイクル',icon:'🛤️',to:'いろいろな 鉄製品',note:'金属を より分けて とかし、もう一度 材料へ'}
};
var FC_SPECIALS = {
  plastic:[
    {title:'ボトルtoボトル',source:'🧴',icon:'🧴',to:'新しい PETボトル',note:'きれいに 分けた PETは またボトルに できる'},
    {title:'リサイクル',source:'🧴',icon:'🥚',to:'たまごパック',note:'あらって くだいた フレークを シートへ'},
    {title:'リサイクル',source:'🧴',icon:'🧥',to:'ユニフォーム',note:'PETの 粒を 細い せんいに かえる'},
    {title:'リサイクル',source:'🧴',icon:'🖊️',to:'ボールペンなど',note:'再生PETは 文具や 回収ボックスにも なる'}
  ],
  bulky:[
    {title:'リユース',source:'🛋️',icon:'🏪',to:'中古販売店へ',note:'まだ使える家具は つぎの人へ'},
    {title:'リペア＆リユース',source:'🛏️',icon:'🛠️',to:'直して もう一度',note:'部品をかえ、きれいにして 長く使う'},
    {title:'リメイク',source:'🗄️',icon:'🪑',to:'新しい 家具',note:'使える木や部品を いかして 作りかえる'},
    {title:'材料リサイクル',source:'🛋️',icon:'🧱',to:'再生ボード',note:'こわれた家具は 木と金属に 分ける'}
  ],
  burn:[
    {title:'熱回収',source:'🔥',icon:'⚡',to:'電気',note:'ごみを もやす熱で 発電する'},
    {title:'熱利用',source:'🔥',icon:'♨️',to:'温水・暖房',note:'焼却施設の熱を プールや暖房へ'},
    {title:'灰の資源化',source:'🌫️',icon:'🏗️',to:'エコセメント',note:'条件に合う焼却灰は セメント原料になる'},
    {title:'最終処分',source:'🌫️',icon:'⛰️',to:'管理された 埋立地へ',note:'使えない灰は 安全を確かめて 埋め立てる'}
  ],
  can:[
    {title:'スチール再生',source:'🥫',icon:'🚗',to:'自動車の 鋼板',note:'磁石で鉄を より分け、製鉄所の原料へ'},
    {title:'アルミ再生',source:'🥤',icon:'🪟',to:'アルミ製品',note:'アルミ缶も とかして 新しい材料へ'},
    {title:'金属リサイクル',source:'🥫',icon:'🏗️',to:'建物の 鋼材',note:'かんの鉄は 建物にも 生まれかわる'},
    {title:'CAN to CAN',source:'🥤',icon:'🥤',to:'新しい かん',note:'きれいに分けた缶は また缶にも できる'}
  ],
  bottle:[
    {title:'びん to びん',source:'🍾',icon:'🍾',to:'新しい ガラスびん',note:'色などで 分けたカレットを とかして作る'},
    {title:'ガラス再生',source:'🍷',icon:'🧱',to:'道路用の 材料',note:'びん以外の用途に 使われることも ある'},
    {title:'リユースびん',source:'🫙',icon:'🔁',to:'洗って もう一度',note:'くり返し使う びんは リターナブルびん'},
    {title:'カレット化',source:'🍾',icon:'💎',to:'ガラスの 原料',note:'異物を取り、色別に くだいたガラス片'}
  ],
  glass:[
    {title:'危険を ふせぐ分別',source:'🔺',icon:'📦',to:'包んで 危険表示',note:'収集する人が けがをしないようにする'},
    {title:'びんと 分ける',source:'☕',icon:'🚫',to:'陶器は びん回収に 入れない',note:'とけ方がちがい、再生びんの異物になる'},
    {title:'地域ルール確認',source:'🪞',icon:'🏠',to:'不燃ごみなどへ',note:'ガラスの出し方は 自治体ルールを確認'}
  ],
  metal:[
    {title:'金属リサイクル',source:'🥫',icon:'🥫',to:'新しい かん',note:'鉄は とかして 何度も材料に できる'},
    {title:'金属リサイクル',source:'🥫',icon:'🚗',to:'自動車の 鋼板',note:'回収した鉄は 車の材料にも なる'},
    {title:'金属リサイクル',source:'🥫',icon:'🛤️',to:'鉄道レール',note:'強い鉄に生まれかわり 交通を支える'},
    {title:'金属リサイクル',source:'🥫',icon:'🌉',to:'橋や 建物',note:'鉄スクラップは 建設用の鋼材にも なる'},
    {title:'金属リサイクル',source:'🥫',icon:'🧺',to:'家電の 鋼板',note:'冷蔵庫や洗濯機の材料にも 使われる'}
  ]
};
var FC_SAVES = [
  {mode:'keep',icon:'💍',name:'金の アクセサリー',to:'売る・直す',note:'金は 大切な資源。ごみに まぜない！'},
  {mode:'keep',icon:'👕',name:'まだ 着られる服',to:'古着店・寄付へ',note:'着られる服は リユースして 次の人へ'},
  {mode:'keep',icon:'📱',name:'使わない スマホ',to:'小型家電回収へ',note:'中の金・銅などは「都市鉱山」'},
  {mode:'quiz',icon:'🔋',name:'使い終わった 電池',to:'電池の 回収へ',answers:['もえるごみ','電池の 回収','ガラスびん'],correct:1,note:'電池は 発火や有害物質の危険。ほかのごみに まぜない'},
  {mode:'quiz',icon:'🧯',name:'スプレー缶',to:'危険ごみなどへ',answers:['プラごみ','危険ごみなど','ガラスびん'],correct:1,note:'中身を使い切り、穴あけは 自治体ルールを確認'},
  {mode:'quiz',icon:'🔥',name:'使い捨て ライター',to:'危険ごみなどへ',answers:['もえるごみ','空きかん','危険ごみなど'],correct:2,note:'火災を防ぐため、ほかのごみと分けて出す'},
  {mode:'quiz',icon:'🔺',name:'割れた ガラス',to:'包んで 危険表示',answers:['ガラスびん','包んで 危険表示','プラごみ'],correct:1,note:'びん回収へ入れず、収集時のけがを防ぐ'}
];
var FC_TRIVIA = [
  'PETボトルは くだいて洗い、フレークという小片にしてから 新しい製品へ。',
  '再生PETは ボトル・たまごパック・ユニフォーム・文具などに 使われる。',
  '鉄の缶は 車・レール・家電・建物など、いろいろな鉄製品に 生まれかわる。',
  '条件に合う 焼却灰は、エコセメントの原料に できる。',
  '資源化できない灰は、安全を確かめて 最終処分場へ 埋め立てる。',
  'まだ着られる服は、ごみにせず 古着店・回収・寄付などで リユース。',
  'スマホなどの小型家電には 金・銅・レアメタルがあり「都市鉱山」とよばれる。',
  'PETボトルは キャップとラベルを取り、中をすすぐと 質の高い再生につながる。',
  'ガラスびんは 異物を取り、色などで分けて「カレット」という原料にする。',
  '陶器や耐熱ガラスは、飲料などのガラスびんと とけ方がちがうので まぜない。',
  '乾電池や充電池は 発火を防ぐため、ほかのごみに まぜず 回収先を確認。',
  'スプレー缶は 中身を使い切る。穴をあけるかどうかは 地域ルールに従う。',
  'ごみの分け方は 地域でちがう。住んでいる町のルールを たしかめよう。'
];
FC = { H:780, time:60, cols:8, rows:7, x0:44, y0:132, dx:73, dy:67, near:101, feverSec:8, dropSec:.48 };
function fcType(id){ for (var i=0; i<FC_TYPES.length; i++) if (FC_TYPES[i].id === id) return FC_TYPES[i]; return null; }
function fcTransform(kind,variant,special,specialIndex){
  var tp=fcType(kind),base=FC_TRANSFORMS[kind],from=tp.junk[variant%tp.junk.length];
  if(special){var list=FC_SPECIALS[kind],pick=list[(specialIndex||0)%list.length];return {title:pick.title,source:pick.source,sourceName:tp.short,icon:pick.icon,to:pick.to,note:pick.note};}
  if(kind==='plastic'){
    var out=[['🧥','フリース'],['🍱','再生トレー'],['🪑','ベンチ']][variant%3];
    return {title:'リサイクル',source:from[0],sourceName:from[1],icon:out[0],to:out[1],note:'あらう → くだく → 新しい材料へ'};
  }
  if(kind==='bulky')return {title:'材料リサイクル',source:from[0],sourceName:from[1],icon:'🧱',to:'再生ボード',note:'解体して 木や金属を より分ける'};
  return {title:base.title,source:from[0],sourceName:from[1],icon:base.icon,to:base.to,note:base.note};
}
function fcRandomKind(st){ return st.pool[(Math.random() * st.pool.length) | 0]; }
function fcClusterKind(st,c,r,placed){
  var near=[];
  for(var i=0;i<placed.length;i++){
    var it=placed[i];
    if(it.kind!=='save'&&((it.col===c&&Math.abs(it.row-r)===1)||(it.row===r&&Math.abs(it.col-c)===1)))near.push(it.kind);
  }
  var clusterChance=Math.max(.48,.72-st.pool.length*.018);
  return near.length&&Math.random()<clusterChance?near[(Math.random()*near.length)|0]:fcRandomKind(st);
}
function fcAdjacent(a, b){ return Math.hypot(a.x - b.x, a.y - b.y) <= FC.near; }
function fcHasMove(){
  var seen = {}, i, j;
  for (i=0; i<cur.items.length; i++){
    if (seen[cur.items[i].key]) continue;
    if(cur.items[i].kind==='save'){seen[cur.items[i].key]=1;continue;}
    var q=[i], n=0; seen[cur.items[i].key]=1;
    while(q.length){
      var k=q.shift(), a=cur.items[k]; n++;
      for(j=0;j<cur.items.length;j++) if(!seen[cur.items[j].key] && cur.items[j].kind===a.kind && fcAdjacent(a,cur.items[j])){
        seen[cur.items[j].key]=1; q.push(j);
      }
    }
    if(n>=3) return true;
  }
  return false;
}
function fcEnsureMove(st){
  if (fcHasMove()) return;
  var row=(Math.random()*FC.rows)|0, start=(Math.random()*(FC.cols-2))|0, kind=fcRandomKind(st);
  for(var c=0;c<3;c++){
    var it=cur.items[row*FC.cols+start+c]; it.kind=kind; it.variant=(Math.random()*fcType(kind).junk.length)|0;
  }
}
function fcFill(st){
  cur.items=[];cur.fcKey=0;
  for(var r=0;r<FC.rows;r++) for(var c=0;c<FC.cols;c++){
    var kind=fcClusterKind(st,c,r,cur.items),tp=fcType(kind);
    cur.items.push({key:'fc'+(cur.fcKey++),row:r,col:c,kind:kind,variant:(Math.random()*tp.junk.length)|0,
      x:FC.x0+c*FC.dx,y:FC.y0+r*FC.dy});
  }
  var saveCount=Math.min(3,st.pool.length),used={};
  for(var s=0;s<saveCount;s++){
    var idx=(7+s*17+((Math.random()*9)|0))%cur.items.length;
    while(used[idx])idx=(idx+1)%cur.items.length;used[idx]=1;
    cur.items[idx].kind='save';cur.items[idx].variant=(s*3+st.pool.length)%FC_SAVES.length;
  }
  fcEnsureMove(st);
}
function fcDropBoard(keys,st){
  var gone={},next=[];for(var k=0;k<keys.length;k++)gone[keys[k]]=1;
  for(var c=0;c<FC.cols;c++){
    var column=[];
    for(var i=0;i<cur.items.length;i++)if(cur.items[i].col===c&&!gone[cur.items[i].key])column.push(cur.items[i]);
    column.sort(function(a,b){return b.row-a.row;});
    var row=FC.rows-1;
    for(i=0;i<column.length;i++,row--){
      var oldY=column[i].y;column[i].row=row;column[i].x=FC.x0+c*FC.dx;column[i].y=FC.y0+row*FC.dy;column[i].fromY=oldY;next.push(column[i]);
    }
    for(;row>=0;row--){
      var isSave=Math.random()<.06,kind=isSave?'save':fcClusterKind(st,c,row,next),tp=isSave?null:fcType(kind),targetY=FC.y0+row*FC.dy;
      next.push({key:'fc'+(cur.fcKey++),row:row,col:c,kind:kind,variant:isSave?((Math.random()*FC_SAVES.length)|0):((Math.random()*tp.junk.length)|0),
        x:FC.x0+c*FC.dx,y:targetY,fromY:FC.y0-(row+2)*24});
    }
  }
  next.sort(function(a,b){return a.row-b.row||a.col-b.col;});cur.items=next;
  cur.dropT=FC.dropSec;cur.dropMax=FC.dropSec;fcEnsureMove(st);
}
loadFactory = function(st){
  if(cur.fcRaf){cancelAnimationFrame(cur.fcRaf);cur.fcRaf=null;}
  cur.score=0; cur.products=0; cur.combo=0; cur.bestCombo=0; cur.left=FC.time;
  cur.playing=false; cur.over=false; cur.chain=[]; cur.chainType=null; cur.dragging=false;
  cur.made={};cur.specialSeq={};for(var mt=0;mt<FC_TYPES.length;mt++){cur.made[FC_TYPES[mt].id]=0;cur.specialSeq[FC_TYPES[mt].id]=0;}cur.bulkyParts=0;
  cur.longest=0;cur.specials=0;cur.rescued=0;cur.sorted=0;cur.sortMiss=0;cur.resultStored=false;
  cur.fever=0;cur.feverTime=0;cur.machine=null;cur.dropT=0;cur.trivia=(Math.random()*FC_TRIVIA.length)|0;
  cur.flash=null;cur.burst=null;cur.special=null;cur.rescue=null;cur.sortQuiz=null;fcFill(st);
};
factoryOK = function(){ return cur.over && cur.score >= curStage().target; };
function fcItemByKey(key){ for(var i=0;i<cur.items.length;i++) if(cur.items[i].key===key) return cur.items[i]; return null; }
function fcChainHas(key){ return cur.chain.indexOf(key)>=0; }
function fcRecycle(){
  if(cur.chain.length<3) return false;
  var st=curStage(),tp=fcType(cur.chainType),selected=[],variants=[],i;
  for(i=0;i<cur.chain.length;i++){
    var it=fcItemByKey(cur.chain[i]);
    if(!it || it.kind!==cur.chainType) return false;
    selected.push({x:it.x,y:it.y});variants.push(it.variant);
  }
  var isSpecial=cur.chain.length>=10,batches=1+Math.floor((cur.chain.length-3)/3),made=batches,phase='product';
  if(tp.id==='bulky'&&!isSpecial){
    var parts=cur.bulkyParts+batches;made=Math.floor(parts/2);cur.bulkyParts=parts%2;
    phase=made?'board':'dismantle';
  }else if(tp.id==='bulky'&&isSpecial){phase='reuse';made=batches;}
  if(cur.feverTime>0&&made>0)made*=2;
  cur.products+=made;cur.made[tp.id]+=made;cur.combo++;cur.bestCombo=Math.max(cur.bestCombo,cur.combo);cur.longest=Math.max(cur.longest,cur.chain.length);
  var startedFever=false;
  if(cur.feverTime<=0){
    cur.fever=Math.min(100,cur.fever+18+Math.max(0,cur.chain.length-3)*5);
    if(cur.fever>=100){cur.fever=100;cur.feverTime=FC.feverSec;startedFever=true;}
  }
  var specialBonus=isSpecial?300+(cur.chain.length-10)*60:0;
  cur.score+=cur.chain.length*10+made*25+Math.max(0,cur.combo-1)*8+Math.max(0,cur.chain.length-6)*5+specialBonus;
  var removed=cur.chain.slice();fcDropBoard(removed,st);
  var specialIndex=cur.specialSeq[tp.id],variant=variants[0],tr=fcTransform(tp.id,variant,isSpecial,specialIndex);if(isSpecial)cur.specialSeq[tp.id]++;
  cur.machine={kind:tp.id,phase:phase,t:1.25};
  cur.burst=made?{kind:tp.id,made:made,t:1.15,from:selected,transform:tr}:null;
  if(isSpecial){cur.specials++;cur.special={kind:tp.id,count:selected.length,bonus:specialBonus,t:1.75,transform:tr};}
  cur.flash={text:startedFever?'FEVERスタート！ 加工品 2ばい！':(isSpecial?tr.title+' 必殺技！ ＋'+specialBonus+'pt':(made?tr.to+'に 変身！':'そだいごみを 解体した！ あと1工程')),col:startedFever?'#FF5E4A':tp.col,t:1.35};
  cur.chain=[];cur.chainType=null;
  return true;
}
function fcRescueItem(it){
  if(!it||it.kind!=='save')return false;
  var info=FC_SAVES[it.variant%FC_SAVES.length];
  if(info.mode==='quiz'){
    cur.sortQuiz={item:it,info:info,answered:false,t:0};
    cur.flash={text:'危険ごみ！ 正しい 出し方を えらぼう',col:'#FF6B4A',t:1.3};
    return true;
  }
  cur.score+=150;cur.rescued++;cur.rescue={info:info,t:1.35};
  cur.flash={text:'すてちゃダメ！ 救出 ＋150pt',col:'#F5B324',t:1.3};
  fcDropBoard([it.key],curStage());return true;
}
function fcAnswerQuiz(answer){
  var q=cur.sortQuiz;if(!q||q.answered)return false;
  q.answered=true;q.chosen=answer;q.ok=answer===q.info.correct;q.t=1.55;
  if(q.ok){cur.score+=200;cur.sorted++;cur.flash={text:'分別せいかい！ ＋200pt',col:'#4FC46A',t:1.4};}
  else{cur.score=Math.max(0,cur.score-80);cur.left=Math.max(0,cur.left-3);cur.sortMiss++;cur.flash={text:'おしい！ −80pt・−3びょう',col:'#FF6B4A',t:1.4};}
  fcDropBoard([q.item.key],curStage());return true;
}
fcStep = function(dt){
  if(!cur.special&&!cur.rescue&&!cur.sortQuiz)cur.left=Math.max(0,cur.left-dt);
  if(cur.flash){cur.flash.t-=dt;if(cur.flash.t<=0)cur.flash=null;}
  if(cur.burst){cur.burst.t-=dt;if(cur.burst.t<=0)cur.burst=null;}
  if(cur.machine){cur.machine.t-=dt;if(cur.machine.t<=0)cur.machine=null;}
  if(cur.special){cur.special.t-=dt;if(cur.special.t<=0)cur.special=null;}
  if(cur.rescue){cur.rescue.t-=dt;if(cur.rescue.t<=0)cur.rescue=null;}
  if(cur.sortQuiz&&cur.sortQuiz.answered){cur.sortQuiz.t-=dt;if(cur.sortQuiz.t<=0){cur.sortQuiz=null;cur.fcNeedsRender=true;}}
  if(cur.dropT>0){cur.dropT=Math.max(0,cur.dropT-dt);if(cur.dropT<=0)for(var i=0;i<cur.items.length;i++)delete cur.items[i].fromY;}
  if(cur.feverTime>0){cur.feverTime=Math.max(0,cur.feverTime-dt);cur.fever=cur.feverTime/FC.feverSec*100;if(cur.feverTime<=0)cur.fever=0;}
  if(cur.left<=0&&!cur.sortQuiz) fcFinish();
};
fcFinish = function(){
  cur.playing=false;cur.over=true;cur.dragging=false;cur.chain=[];cur.chainType=null;
  if(cur.fcRaf){cancelAnimationFrame(cur.fcRaf);cur.fcRaf=null;}
  cur.noStar=!(cur.score>=curStage().star);fcStoreResult();renderFactory();
};
function fcStoreResult(){
  if(cur.resultStored||cur.score<curStage().target)return;
  var g=gameById(cur.gameId),st=curStage(),key=stageKey(g.id,cur.si),old=save.stages[key],perfect=cur.score>=st.star?1:0;
  if(old&&old.p)perfect=1;save.stages[key]={c:1,p:perfect};
  if(gameDone(g.id))save.cards[g.id]=gameGold(g.id)?2:1;
  store();renderStrip();cur.done=true;cur.resultStored=true;
}
fcSync = function(){
  var tm=document.getElementById('fc-time'),sc=document.getElementById('fc-score'),spc=document.getElementById('fc-specials'),fl=document.getElementById('fc-flash'),fg=document.getElementById('fc-fever-fill'),ft=document.getElementById('fc-fever-text');
  if(!tm)return false;
  tm.textContent=Math.ceil(cur.left);tm.setAttribute('fill',cur.left<=10?'#E05A4A':'#8A5B00');
  if(sc)sc.textContent=cur.score+' pt';if(spc)spc.textContent=cur.specials+'必・'+cur.rescued+'救・'+cur.sorted+'分';
  if(fl){fl.textContent=cur.flash?cur.flash.text:'';fl.setAttribute('opacity',cur.flash?Math.min(1,cur.flash.t*2).toFixed(2):0);}
  if(fg)fg.setAttribute('width',(3.72*cur.fever).toFixed(1));
  if(ft)ft.textContent=cur.feverTime>0?'FEVER! あと '+Math.ceil(cur.feverTime)+'びょう':'長くつないで フィーバー';
  return true;
};
/* クイズ中に毎フレームHTMLボタンを作り直すと、touchstart と touchend の間に
   押したボタンが別要素になり Safari の click が成立しない。クイズ開始・回答時だけ
   renderFactory() を呼び、解説終了時は fcNeedsRender で1回だけ更新する。 */
fcRender = function(full){ if(full||cur.fcNeedsRender||cur.burst||cur.machine||cur.special||cur.rescue||cur.dropT>0||!fcSync()){cur.fcNeedsRender=false;renderFactory();} };
fcLoop = function(){
  var last=null;
  function step(now){
    if(cur.kind!=='factory'||!cur.playing){cur.fcRaf=null;return;}
    if(last===null)last=now;var dt=Math.min(.05,(now-last)/1000);last=now;
    fcStep(dt);fcRender(false);if(cur.playing)cur.fcRaf=requestAnimationFrame(step);
  }
  cur.fcRaf=requestAnimationFrame(step);
};
function fcLineArt(){
  var s='',tp=cur.chainType?fcType(cur.chainType):null;
  for(var i=1;i<cur.chain.length;i++){
    var a=fcItemByKey(cur.chain[i-1]),b=fcItemByKey(cur.chain[i]);if(!a||!b)continue;
    s+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+(tp?tp.col:'#FFF4A8')+'" stroke-width="17" stroke-linecap="round" opacity=".75" filter="url(#fc-glow)"/>'+
       '<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="#FFF8B8" stroke-width="6" stroke-linecap="round"/>';
  }
  return s;
}
function fcNodeArt(it){
  var drawY=it.y;
  if(cur.dropT>0&&it.fromY!==undefined){var p=1-cur.dropT/cur.dropMax,ease=1-Math.pow(1-Math.max(0,Math.min(1,p)),3);drawY=it.fromY+(it.y-it.fromY)*ease;}
  if(it.kind==='save'){
    var keep=FC_SAVES[it.variant%FC_SAVES.length];
    var quiz=keep.mode==='quiz',label=quiz?'危険！タップ':'すてちゃダメ',bg=quiz?'#5B1723':'#251B48';
    return '<g data-fcnode="'+it.key+'" transform="translate('+it.x+','+drawY.toFixed(1)+')"><rect x="-34" y="-31" width="68" height="62" rx="15" fill="'+bg+'" stroke="#FFF176" stroke-width="4" filter="url(#fc-glow)"/><path d="M-24-21L-18-27M24-21L18-27" stroke="#fff" stroke-width="3"/><text x="0" y="7" font-size="30" text-anchor="middle">'+keep.icon+'</text><rect x="-30" y="13" width="60" height="15" rx="7" fill="'+(quiz?'#FF6B4A':'#E05A4A')+'"/><text x="0" y="24" font-size="7.8" font-weight="1000" fill="#fff" text-anchor="middle">'+label+'</text><rect x="-38" y="-35" width="76" height="70" rx="17" fill="#fff" fill-opacity=".001" data-fcnode="'+it.key+'"/></g>';
  }
  var tp=fcType(it.kind),j=tp.junk[it.variant%tp.junk.length],on=fcChainHas(it.key);
  var s='<g data-fcnode="'+it.key+'" transform="translate('+it.x+','+drawY.toFixed(1)+')'+(on?' scale(1.12)':'')+'">';
  if(on)s+='<rect x="-39" y="-36" width="78" height="72" rx="18" fill="#FFF8B8" stroke="#fff" stroke-width="4" filter="url(#fc-glow)"/><text x="-33" y="-24" font-size="15" fill="#fff">✦</text><text x="25" y="-17" font-size="11" fill="#FFF176">✦</text>';
  s+='<rect x="-32" y="-29" width="64" height="58" rx="12" fill="#F8FBFC" stroke="'+tp.dark+'" stroke-width="3"/>'+
     '<path d="M-32 11H32V18Q32 29 21 29H-21Q-32 29-32 18Z" fill="'+tp.col+'"/>'+
     '<path d="M-23 -20H23M-18 -25V-15M18 -25V-15" stroke="'+tp.col+'" stroke-width="3" opacity=".7"/>'+
     '<text x="0" y="6" font-size="27" text-anchor="middle">'+j[0]+'</text>'+
     '<text x="0" y="24" font-size="8.8" font-weight="900" fill="#fff" text-anchor="middle">'+tp.short+'</text>'+
     '<rect x="-38" y="-35" width="76" height="70" rx="17" fill="#fff" fill-opacity=".001" data-fcnode="'+it.key+'"/></g>';
  return s;
}
function fcMachinePos(kind){
  var pool=curStage().pool,idx=Math.max(0,pool.indexOf(kind)),gap=8,w=Math.min(132,(552-(pool.length-1)*gap)/pool.length);
  return {x:300-(pool.length*w+(pool.length-1)*gap)/2+w/2+idx*(w+gap),w:w};
}
function fcBurstArt(){
  if(!cur.burst)return '';
  var b=cur.burst,tp=fcType(b.kind),k=1-Math.max(0,b.t)/1.15,mp=fcMachinePos(b.kind),s='<g pointer-events="none">';
  b.from.forEach(function(p){
    var x=p.x+(mp.x-p.x)*k,y=p.y+(670-p.y)*k;
    s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(16*(1-k)+3).toFixed(1)+'" fill="'+tp.col+'" opacity="'+(1-k).toFixed(2)+'"/>';
  });
  var pop=Math.min(1,k*4),fade=Math.min(1,b.t*3);
  var tr=b.transform||fcTransform(b.kind,0,false);
  s+='<g transform="translate('+mp.x+',650) scale('+pop.toFixed(2)+')" opacity="'+fade.toFixed(2)+'">'+
     '<circle r="66" fill="#fff" stroke="#F5B324" stroke-width="6"/>'+
     '<circle r="54" fill="'+tp.col+'" opacity=".16"/>'+
     '<text x="-22" y="5" font-size="29" text-anchor="middle">'+tr.source+'</text><text x="0" y="4" font-size="17" font-weight="900" fill="#5A7C93" text-anchor="middle">→</text><text x="25" y="5" font-size="31" text-anchor="middle">'+tr.icon+'</text>'+
     '<text x="0" y="35" font-size="12" font-weight="900" fill="'+tp.dark+'" text-anchor="middle">'+tr.to+' ×'+b.made+'</text></g></g>';
  return s;
}
function fcSpecialArt(){
  if(!cur.special)return '';
  var sp=cur.special,tp=fcType(sp.kind),tr=sp.transform,age=1.75-sp.t;
  var pop=Math.min(1,age*5),fade=Math.min(1,sp.t*3),ring=82+age*36;
  return '<g pointer-events="none" opacity="'+fade.toFixed(2)+'">'+
    '<circle cx="300" cy="358" r="'+ring.toFixed(1)+'" fill="none" stroke="#FFF176" stroke-width="8" opacity=".45"/>'+
    '<circle cx="300" cy="358" r="'+(ring+24).toFixed(1)+'" fill="none" stroke="'+tp.col+'" stroke-width="5" opacity=".35"/>'+
    '<g transform="translate(300,358) scale('+pop.toFixed(2)+')" filter="url(#fc-card-shadow)">'+
    '<rect x="-218" y="-125" width="436" height="250" rx="34" fill="#092D42" stroke="#FFF176" stroke-width="7"/>'+
    '<image href="images/recycle-transform-machine-v1.webp" x="-211" y="-118" width="422" height="236" preserveAspectRatio="xMidYMid slice" opacity=".42" clip-path="url(#fc-special-clip)"/><rect x="-211" y="-118" width="422" height="236" rx="28" fill="#05283C" opacity=".5"/>'+
    '<path d="M-190-91H190" stroke="'+tp.col+'" stroke-width="10" stroke-linecap="round"/>'+
    '<text x="0" y="-61" font-size="35" font-weight="1000" fill="#FFF176" text-anchor="middle">'+tr.title+'！</text>'+
    '<text x="0" y="-30" font-size="17" font-weight="900" fill="#fff" text-anchor="middle">'+tp.short+' '+sp.count+'連鎖</text>'+
    '<g transform="translate(0,20)"><circle cx="-105" r="43" fill="#fff"/><text x="-105" y="13" font-size="47" text-anchor="middle">'+tr.source+'</text>'+
    '<text x="0" y="10" font-size="38" font-weight="1000" fill="#FFF176" text-anchor="middle">➜</text><circle cx="105" r="43" fill="#fff"/><text x="105" y="13" font-size="47" text-anchor="middle">'+tr.icon+'</text></g>'+
    '<text x="0" y="82" font-size="19" font-weight="900" fill="#fff" text-anchor="middle">→ '+tr.to+'</text>'+
    '<text x="0" y="108" font-size="11" font-weight="900" fill="#BFE8F2" text-anchor="middle">'+tr.note+'</text>'+
    '<rect x="132" y="-111" width="72" height="30" rx="15" fill="#FF5E4A"/><text x="168" y="-90" font-size="13" font-weight="1000" fill="#fff" text-anchor="middle">＋'+sp.bonus+'pt</text>'+
    '<text x="-190" y="-91" font-size="23" fill="#fff">✦</text><text x="183" y="-55" font-size="18" fill="#FFF176">✦</text></g></g>';
}
function fcRescueArt(){
  if(!cur.rescue)return '';
  var r=cur.rescue,info=r.info,age=1.35-r.t,pop=Math.min(1,age*6),fade=Math.min(1,r.t*4);
  return '<g pointer-events="none" opacity="'+fade.toFixed(2)+'"><g transform="translate(300,358) scale('+pop.toFixed(2)+')" filter="url(#fc-card-shadow)">'+
    '<rect x="-202" y="-105" width="404" height="210" rx="32" fill="#251B48" stroke="#FFF176" stroke-width="7"/>'+
    '<image href="images/recycle-transform-machine-v1.webp" x="-195" y="-98" width="390" height="196" preserveAspectRatio="xMidYMid slice" opacity=".2" clip-path="url(#fc-rescue-clip)"/>'+
    '<text x="0" y="-67" font-size="31" font-weight="1000" fill="#FFF176" text-anchor="middle">すてちゃダメ！</text>'+
    '<text x="0" y="-40" font-size="15" font-weight="900" fill="#fff" text-anchor="middle">'+info.name+'</text>'+
    '<circle cx="-88" cy="15" r="42" fill="#fff"/><text x="-88" y="29" font-size="48" text-anchor="middle">'+info.icon+'</text>'+
    '<text x="0" y="23" font-size="34" font-weight="1000" fill="#FFF176" text-anchor="middle">➜</text>'+
    '<rect x="50" y="-12" width="130" height="54" rx="17" fill="#2E9A4C"/><text x="115" y="21" font-size="15" font-weight="1000" fill="#fff" text-anchor="middle">'+info.to+'</text>'+
    '<text x="0" y="76" font-size="11" font-weight="900" fill="#D7F4EE" text-anchor="middle">'+info.note+'</text>'+
    '<rect x="119" y="-92" width="70" height="29" rx="15" fill="#FF5E4A"/><text x="154" y="-72" font-size="13" font-weight="1000" fill="#fff" text-anchor="middle">＋150pt</text></g></g>';
}
function fcSortQuizArt(){
  if(!cur.sortQuiz)return '';
  var q=cur.sortQuiz,info=q.info,s='<g><rect width="600" height="780" fill="#041D2B" opacity=".72"/><g transform="translate(300,358)" filter="url(#fc-card-shadow)"><rect x="-220" y="-178" width="440" height="356" rx="32" fill="#FFFDF7" stroke="#FFB52E" stroke-width="6"/>';
  if(!q.answered){
    s+='<text x="0" y="-137" font-size="25" font-weight="1000" fill="#D84932" text-anchor="middle">⚠ 危険ごみ 分別チャレンジ</text><text x="0" y="-102" font-size="48" text-anchor="middle">'+info.icon+'</text><text x="0" y="-70" font-size="18" font-weight="1000" fill="#173F55" text-anchor="middle">'+info.name+'は どこへ？</text>';
    s+='<text x="0" y="162" font-size="11" font-weight="900" fill="#7A5B2D" text-anchor="middle">正解 ＋200pt　／　まちがい −80pt・−3びょう</text>';
  }else{
    s+='<text x="0" y="-121" font-size="31" font-weight="1000" fill="'+(q.ok?'#2E9A4C':'#E05A4A')+'" text-anchor="middle">'+(q.ok?'○ 分別せいかい！':'△ おしい！')+'</text><text x="-84" y="-37" font-size="62" text-anchor="middle">'+info.icon+'</text><text x="0" y="-34" font-size="35" font-weight="1000" fill="#F5B324" text-anchor="middle">➜</text><rect x="44" y="-70" width="148" height="66" rx="18" fill="#2E9A4C"/><text x="118" y="-43" font-size="14" font-weight="1000" fill="#fff" text-anchor="middle">正しい分別</text><text x="118" y="-20" font-size="13" font-weight="1000" fill="#fff" text-anchor="middle">'+info.to+'</text><rect x="-186" y="18" width="372" height="96" rx="19" fill="#FFF4D7" stroke="#F5C15D" stroke-width="2"/><text x="0" y="52" font-size="13" font-weight="1000" fill="#6D4A18" text-anchor="middle">'+info.note+'</text><text x="0" y="88" font-size="11" font-weight="900" fill="#8A6B3B" text-anchor="middle">※ 名前や 出し方は 地域の ルールを たしかめよう</text><text x="0" y="151" font-size="14" font-weight="1000" fill="'+(q.ok?'#2E9A4C':'#E05A4A')+'" text-anchor="middle">'+(q.ok?'＋200 エコpt':'−80pt・タイム −3びょう')+'</text>';
  }
  return s+'</g></g>';
}
function fcMachineArt(id){
  var tp=fcType(id),p=fcMachinePos(id),active=cur.machine&&cur.machine.kind===id,pulse=active&&(((cur.machine.t*10)|0)%2===0);
  var proc=id==='burn'?'焼却・発電':id==='plastic'?'くだく・成形':id==='bulky'?'解体・圧縮':id==='bottle'?'色分け・カレット':id==='glass'?'安全に処分':'選別・溶解';
  var mark=id==='burn'?'🔥':id==='plastic'?'⚙️':id==='bulky'?'🪚':id==='bottle'?'🍾':id==='glass'?'⚠️':'♨️',s='<g transform="translate('+p.x+',686)">';
  s+='<rect x="'+(-p.w/2)+'" y="-62" width="'+p.w+'" height="124" rx="15" fill="#F8FBFC" stroke="'+(active?'#F5B324':tp.col)+'" stroke-width="'+(active?5:3)+'"/>'+
     '<rect x="'+(-p.w/2+8)+'" y="18" width="'+(p.w-16)+'" height="24" rx="5" fill="#607C8E"/>'+
     '<path d="M'+(-p.w/2+12)+' 29H'+(p.w/2-12)+'" stroke="#BFD1D8" stroke-width="5" stroke-dasharray="10 7"/>'+
     '<rect x="-30" y="-40" width="60" height="55" rx="8" fill="'+(active?tp.col:'#DCE7EB')+'" stroke="'+tp.dark+'" stroke-width="3"/>'+
     '<path d="M-23 4H23M-18-31V-18M0-31V-18M18-31V-18" stroke="#fff" stroke-width="3" opacity=".7"/>'+
     '<text x="0" y="-4" font-size="25" text-anchor="middle">'+mark+'</text>'+
     '<circle cx="'+(p.w/2-16)+'" cy="-46" r="6" fill="'+(pulse?'#FFF176':'#96AAB5')+'" stroke="#526C7B" stroke-width="2"/>'+
     '<text x="0" y="54" font-size="9" font-weight="900" fill="#607C8E" text-anchor="middle">'+proc+'</text>'+
     '<text x="'+(p.w/2-9)+'" y="-43" font-size="12" font-weight="900" fill="'+tp.dark+'" text-anchor="end">×'+cur.made[id]+'</text>';
  if(id==='bulky')s+='<text x="'+(-p.w/2+9)+'" y="-44" font-size="9" font-weight="900" fill="#8A5B33">部品 '+(cur.bulkyParts?'●':'○')+'</text>';
  s+='</g>';return s;
}
function fcEcoRank(st){
  var ratio=cur.score/Math.max(1,st.target),n=cur.score>=st.star?5:ratio>=1.2?4:ratio>=1?3:ratio>=.65?2:1;
  return {n:n,title:['分別の たね','エコ見習い','リサイクル名人','循環マスター','地球の ヒーロー'][n-1]};
}
function fcTriviaLines(text){
  var out=[],rest=text;
  while(rest.length&&out.length<3){
    if(rest.length<=27){out.push(rest);rest='';break;}
    var cut=rest.lastIndexOf('、',27);if(cut<14)cut=rest.lastIndexOf(' ',27);if(cut<14)cut=27;
    out.push(rest.slice(0,cut+1));rest=rest.slice(cut+1);
  }
  if(rest)out[out.length-1]+=rest;while(out.length<3)out.push('');return out;
}
function fcRenderControls(){
  var box=document.getElementById('fc-controls');if(!box)return;
  var h='';
  if(cur.sortQuiz&&!cur.sortQuiz.answered){
    h='<div class="fc-answer-buttons">';
    for(var i=0;i<cur.sortQuiz.info.answers.length;i++)h+='<button type="button" data-fc-answer-html="'+i+'">'+(i+1)+'　'+cur.sortQuiz.info.answers[i]+'</button>';
    h+='</div>';
  }else if(cur.over){
    /* ゲーム 1つだけの アプリには もどる 島が ない ので「← ステージへ」は 出さない。
       もんだいの えらび直しは がめん上の 1 2 3 の ならびから できる。 */
    h='<div class="fc-result-buttons">'+
      (HOME_GAME?'':'<button type="button" class="back-result" data-fc-back-html="1">← ステージへ</button>')+
      '<button type="button" class="again-result" data-fc-again-html="1">↺ もういちど</button></div>';
  }
  box.className='fc-controls'+((cur.sortQuiz||cur.over)?' on':'');box.innerHTML=h;
}
renderFactory = function(){
  var st=curStage(),s='';setBoardBox(600,FC.H);
  s+='<defs><linearGradient id="fc-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173F55"/><stop offset="1" stop-color="#082737"/></linearGradient>'+
     '<linearGradient id="fc-floor" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#C5D5DA"/><stop offset=".5" stop-color="#EEF4F5"/><stop offset="1" stop-color="#C5D5DA"/></linearGradient>'+
     '<pattern id="fc-grid" width="33" height="33" patternUnits="userSpaceOnUse"><path d="M33 0H0V33" fill="none" stroke="#80B5C4" stroke-width="1" opacity=".12"/></pattern>'+
     '<clipPath id="fc-special-clip"><rect x="-211" y="-118" width="422" height="236" rx="28"/></clipPath><clipPath id="fc-rescue-clip"><rect x="-195" y="-98" width="390" height="196" rx="25"/></clipPath>'+
     '<filter id="fc-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
     '<filter id="fc-card-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="9" stdDeviation="10" flood-color="#001722" flood-opacity=".75"/></filter></defs>';
  s+='<rect width="600" height="'+FC.H+'" rx="20" fill="#E8EFF1"/>'+
     '<rect x="14" y="94" width="572" height="508" rx="20" fill="url(#fc-bg)"/>'+
     '<rect x="14" y="94" width="572" height="508" rx="20" fill="url(#fc-grid)"/>'+
     '<path d="M28 586H572" stroke="#F5B324" stroke-width="5" stroke-dasharray="18 10" opacity=".7"/>'+
     '<rect x="14" y="615" width="572" height="137" rx="20" fill="url(#fc-floor)" stroke="#ADC2CA" stroke-width="2"/>';
  s+='<rect x="20" y="8" width="165" height="42" rx="13" fill="#fff" stroke="#D7E4EA" stroke-width="2"/>'+
     '<text x="34" y="25" font-size="10" font-weight="900" fill="#7791A5">必殺・救出・分別</text><text id="fc-specials" x="170" y="38" font-size="14" font-weight="900" fill="#E05A4A" text-anchor="end">'+cur.specials+'必・'+cur.rescued+'救・'+cur.sorted+'分</text>'+
     '<circle cx="300" cy="29" r="22" fill="'+(cur.left<=10?'#FFE3E0':'#FFF8E4')+'" stroke="'+(cur.left<=10?'#E05A4A':'#F5B324')+'" stroke-width="3"/>'+
     '<text id="fc-time" x="300" y="37" font-size="21" font-weight="900" fill="'+(cur.left<=10?'#E05A4A':'#8A5B00')+'" text-anchor="middle">'+Math.ceil(cur.left)+'</text>'+
     '<rect x="415" y="8" width="165" height="42" rx="13" fill="#fff" stroke="#D7E4EA" stroke-width="2"/>'+
     '<text x="429" y="25" font-size="10" font-weight="900" fill="#7791A5">エコポイント</text><text id="fc-score" x="566" y="38" font-size="20" font-weight="900" fill="#0F3350" text-anchor="end">'+cur.score+' pt</text>';
  s+='<rect x="110" y="59" width="380" height="23" rx="12" fill="#B9C8CE"/><rect id="fc-fever-fill" x="114" y="63" width="'+(3.72*cur.fever).toFixed(1)+'" height="15" rx="8" fill="'+(cur.feverTime>0?'#FF5E4A':'#F5B324')+'"/>'+
     '<text id="fc-fever-text" x="300" y="75" font-size="10" font-weight="900" fill="#173D53" text-anchor="middle">'+(cur.feverTime>0?'FEVER! あと '+Math.ceil(cur.feverTime)+'びょう':'長くつないで フィーバー')+'</text>';
  s+='<text x="31" y="111" font-size="9" font-weight="900" fill="#A9CBD6">BIG SORTING YARD　56 ITEMS</text><text x="569" y="111" font-size="10" font-weight="900" fill="#F8D66D" text-anchor="end">最長 '+cur.longest+'こ</text>';
  s+=fcLineArt();cur.items.forEach(function(it){s+=fcNodeArt(it);});
  s+='<text id="fc-flash" x="300" y="113" font-size="17" font-weight="900" fill="'+(cur.flash?cur.flash.col:'#fff')+'" stroke="#fff" stroke-width="4" paint-order="stroke" text-anchor="middle" opacity="'+(cur.flash?1:0)+'">'+(cur.flash?cur.flash.text:'')+'</text>'+
     '<text x="32" y="630" font-size="9" font-weight="900" fill="#557486">PROCESS LINE　加工ライン</text>';
  st.pool.forEach(function(id){s+=fcMachineArt(id);});s+=fcBurstArt();s+=fcSpecialArt();s+=fcRescueArt();s+=fcSortQuizArt();
  s+='<text x="300" y="772" font-size="11" font-weight="900" fill="#5A7C93" text-anchor="middle">消した あとは 下へ落ちる！　同じ ごみを どこまで 長くつなげる？</text>';
  if(cur.feverTime>0)s+='<rect x="8" y="54" width="584" height="704" rx="25" fill="none" stroke="#FF5E4A" stroke-width="7" opacity=".8"/>';
  if(!cur.playing&&!cur.over){
    s+='<rect width="600" height="'+FC.H+'" fill="#0F3350" opacity=".52"/><g transform="translate(300,390)"><rect x="-205" y="-128" width="410" height="256" rx="28" fill="#fff"/>'+
       '<text x="0" y="-86" font-size="21" font-weight="900" fill="#0F3350" text-anchor="middle">'+st.goal+'</text>'+
       '<text x="0" y="-51" font-size="13" font-weight="900" fill="#5A7C93" text-anchor="middle">60びょうで どこまで スコアを のばせる？</text>'+
       '<text x="0" y="-27" font-size="13" font-weight="900" fill="#5A7C93" text-anchor="middle">消したぶんは 上から落ちて つぎの連鎖へ！</text>'+
       '<text x="0" y="-3" font-size="12" font-weight="900" fill="#C9820A" text-anchor="middle">10こ以上の 超ロングチェーンを ねらおう</text>'+
       '<text x="0" y="21" font-size="10" font-weight="900" fill="#8A5B33" text-anchor="middle">紫は救出・赤は危険分別！ つながず タップ</text>'+
       '<rect x="-102" y="48" width="204" height="50" rx="25" fill="#2E9A4C"/><text x="0" y="80" font-size="18" font-weight="900" fill="#fff" text-anchor="middle">▶ 工場を うごかす</text>'+
       '<rect x="-205" y="-128" width="410" height="256" fill="#fff" fill-opacity=".001" data-fcgo="1"/></g>';
  }
  if(cur.over){
    var win=cur.score>=st.target,summary=[],eco=fcEcoRank(st),leaf='',trivia=FC_TRIVIA[cur.trivia%FC_TRIVIA.length],tl=fcTriviaLines(trivia);
    st.pool.forEach(function(id){var tp=fcType(id);summary.push(tp.product[0]+' '+cur.made[id]);});for(var z=0;z<5;z++)leaf+=z<eco.n?'🌿':'・';
    s+='<rect width="600" height="'+FC.H+'" fill="#0F3350" opacity=".58"/><g transform="translate(300,390)"><rect x="-235" y="-224" width="470" height="448" rx="30" fill="#fff"/>'+
       '<text x="0" y="-188" font-size="20" font-weight="1000" fill="'+(win?'#2E9A4C':'#E08A00')+'" text-anchor="middle">60びょうの エコ成果</text>'+
       '<text x="0" y="-151" font-size="34" font-weight="1000" fill="#0F3350" text-anchor="middle">'+cur.score+' エコpt</text>'+
       '<text x="0" y="-119" font-size="16" font-weight="1000" fill="#2E9A4C" text-anchor="middle">'+leaf+'　'+eco.title+'</text>'+
       '<text x="0" y="-91" font-size="11.5" font-weight="900" fill="#5A7C93" text-anchor="middle">加工品 '+cur.products+'　救出 '+cur.rescued+'　危険分別 '+cur.sorted+'（ミス '+cur.sortMiss+'）　必殺 '+cur.specials+'　最長 '+cur.longest+'</text>'+
       '<text x="0" y="-65" font-size="12" font-weight="900" fill="#3B5A70" text-anchor="middle">'+summary.slice(0,4).join('　')+'</text><text x="0" y="-45" font-size="12" font-weight="900" fill="#3B5A70" text-anchor="middle">'+summary.slice(4).join('　')+'</text>'+
       '<rect x="-207" y="-25" width="414" height="116" rx="19" fill="#EAF6F1" stroke="#9ACCB9" stroke-width="2"/>'+
       '<text x="-185" y="1" font-size="12" font-weight="1000" fill="#24805C">💡 きょうの 分別・リサイクル豆ちしき</text>'+
       '<text x="0" y="31" font-size="12" font-weight="900" fill="#315A4A" text-anchor="middle">'+tl[0]+'</text><text x="0" y="52" font-size="12" font-weight="900" fill="#315A4A" text-anchor="middle">'+tl[1]+'</text><text x="0" y="73" font-size="12" font-weight="900" fill="#315A4A" text-anchor="middle">'+tl[2]+'</text>'+
       '<text x="0" y="196" font-size="10" font-weight="900" fill="#8A6B3B" text-anchor="middle">※ 分別名・出し方は 地域のルールを たしかめよう</text></g>';
  }
  document.getElementById('board').innerHTML=s;
  fcRenderControls();
  if(cur.over||!cur.playing)setStatus('',false);else setStatus(cur.chain.length?(cur.chain.length+'こ つないだ！ '+(cur.chain.length>=10?'超ロング！':cur.chain.length>=3?'まだ のばせる！':'あと '+(3-cur.chain.length)+'こ')):(cur.feverTime>0?'フィーバー中！ 加工品 2ばい！':'同じ ごみを できるだけ 長くつなごう'),false);
};
function fcEventPoint(e){
  var src=(e.touches&&e.touches.length)?e.touches[0]:((e.changedTouches&&e.changedTouches.length)?e.changedTouches[0]:e);
  if(src.clientX===undefined)return null;
  var box=document.getElementById('board').getBoundingClientRect();
  return{x:(src.clientX-box.left)/box.width*600,y:(src.clientY-box.top)/box.height*FC.H};
}
function fcNodeAt(p){
  var best=null,d=38;
  cur.items.forEach(function(it){var q=Math.hypot(it.x-p.x,it.y-p.y);if(q<d){d=q;best=it;}});
  return best;
}
function downFactory(e){
  if(!cur.playing||cur.dropT>0||cur.special||cur.rescue||cur.sortQuiz)return;
  var key=attrUp(e.target,'data-fcnode'),it=key!==null?fcItemByKey(key):fcNodeAt(fcEventPoint(e));
  if(!it)return;if(e.cancelable)e.preventDefault();
  if(it.kind==='save'){fcRescueItem(it);renderFactory();return;}
  cur.dragging=true;cur.chain=[it.key];cur.chainType=it.kind;cur.flash=null;renderFactory();
}
function moveFactory(e){
  if(!cur.playing||cur.dropT>0||cur.special||cur.rescue||cur.sortQuiz||!cur.dragging||!cur.chain.length)return;
  if(e.cancelable)e.preventDefault();var p=fcEventPoint(e),it=p?fcNodeAt(p):null;if(!it)return;
  var last=fcItemByKey(cur.chain[cur.chain.length-1]);
  if(cur.chain.length>1&&it.key===cur.chain[cur.chain.length-2]){cur.chain.pop();renderFactory();return;}
  if(it.kind===cur.chainType&&!fcChainHas(it.key)&&fcAdjacent(last,it)){cur.chain.push(it.key);renderFactory();}
}
function upFactory(){
  if(!cur.dragging)return;cur.dragging=false;
  if(cur.chain.length>=3)fcRecycle();
  else{cur.combo=0;if(cur.feverTime<=0)cur.fever=Math.max(0,cur.fever-12);cur.flash={text:'3こ以上 つなごう',col:'#E08A00',t:1};cur.chain=[];cur.chainType=null;}
  renderFactory();
}
tapFactory = function(e){
  var ans=attrUp(e.target,'data-fcanswer');if(ans!==null){fcAnswerQuiz(parseInt(ans,10));renderFactory();return;}
  if(attrUp(e.target,'data-fcback')!==null){openIsland(gameById(cur.gameId).island);return;}
  if(attrUp(e.target,'data-fcgo')!==null){var st=curStage();loadFactory(st);cur.playing=true;renderFactory();fcLoop();}
};
ENGINES.factory={load:loadFactory,render:renderFactory,tap:tapFactory,down:downFactory,move:moveFactory,up:upFactory};

/* ★ここは この 型（リサイクル工場）の コード。2026-09-10 まで swing.js（ふりこ）の 中に あった。
   ゲーム 1つずつの アプリに 分けた とき、ふりこの 入って いない リサイクル工場の アプリで
   クイズも 結果の ボタンも ぜんぶ 効かなく なって 見つかった。
   HANDOFF の きまり「その 型の コードは ぜんぶ engines/○○.js に 置く」。 */
/* リサイクル工場のクイズ／結果は SVG の透明な当たり判定を使わず、
   Safariでも安定して押せる通常のHTMLボタンで受ける。 */
var fcLastControlTouch=0;
function fcControlAction(e){
  if(cur.kind!=='factory')return false;
  var ans=attrUp(e.target,'data-fc-answer-html');
  if(ans!==null){if(fcAnswerQuiz(parseInt(ans,10)))renderFactory();return true;}
  if(attrUp(e.target,'data-fc-back-html')!==null){openIsland(gameById(cur.gameId).island);return true;}
  if(attrUp(e.target,'data-fc-again-html')!==null){cur.done=false;loadFactory(curStage());cur.playing=true;renderFactory();fcLoop();return true;}
  return false;
}
document.getElementById('fc-controls').addEventListener('touchend',function(e){
  if(fcControlAction(e)){fcLastControlTouch=Date.now();if(e.cancelable)e.preventDefault();}
},{passive:false});
document.getElementById('fc-controls').addEventListener('click', function(e){
  if(Date.now()-fcLastControlTouch<700)return;fcControlAction(e);
});


