/* ================================================================== *
 * つりあい型 — てこ・上皿てんびん
 *
 *   つり合う じょうけんは  おもさ × 支点からの きょり  が 左右で 同じ。
 *   これは 中学の「力のつり合い」、高校物理の「モーメント」に そのまま つながる、
 *   小学校の 内容が いちばん 長生きする ところ。
 *   ここも 正かいの おき方を 人が 用意して いない。式を 計算して 判定するので、
 *   べつの おき方でも つり合って いれば ちゃんと せいかいに なる。
 * ================================================================== */
var TR = { px:300, py:210, step:42, maxP:6, wGap:3, gram:10 };  /* step は いちばん 大きい おもりの はば(38)より 広く する */
/* おもりは 3しゅるい。おもい ほど 大きく えがく ので、字が 読めなくても 見て 分かる。
   （ぜんぶ 同じ おもさだと「おもさ × きょり」が ただの「数 × きょり」に なって しまうため、
     2026-08-28 に 20g・30g を 足した。g を 書かない データは これまで どおり 10g） */
var TRW = {
  10:{ w:26, h:16, c:'#8FA8BC', s:'#5A7C93', fc:'#D8B15C', fs:'#8A6A1E' },
  20:{ w:32, h:19, c:'#6E93AE', s:'#3F6683', fc:'#C9A227', fs:'#7A5200' },
  30:{ w:38, h:22, c:'#4E7796', s:'#2C4E67', fc:'#B08420', fs:'#5E3F00' }
};
/* てもとの おもり（グラム）の ならび。数だけ 書いて あれば ぜんぶ 10g。 */
function trTray(st){
  var tr = (st || curStage()).tray;
  if (typeof tr === 'number'){ var a = []; for (var i=0;i<tr;i++) a.push(TR.gram); return a; }
  return tr.slice();
}
function trGramOf(w){ return trTray()[w.gi]; }
function trMoment(side){
  var st = curStage(), sum = 0;
  (st.fixed || []).forEach(function(f){ if (f.side === side) sum += (f.g || TR.gram) * f.n * f.p; });
  cur.placed.forEach(function(w){ if (w.side === side) sum += trGramOf(w) * w.p; });
  return sum;
}
/* その ばしょに いくつ おもりが あるか */
function trCount(side, p){
  var st = curStage(), n = 0;
  (st.fixed || []).forEach(function(f){ if (f.side === side && f.p === p) n += f.n; });
  cur.placed.forEach(function(w){ if (w.side === side && w.p === p) n++; });
  return n;
}
function trFixedCount(side, p){
  var n = 0;
  (curStage().fixed || []).forEach(function(f){ if (f.side === side && f.p === p) n += f.n; });
  return n;
}
function loadTsuriai(st){ cur.placed = []; cur.sel = null; cur.trSel = null; }
function tsuriaiOK(){
  if (cur.placed.length !== trTray().length) return false;  /* 手もちを ぜんぶ つかう */
  return trMoment('L') === trMoment('R');
}
function trWeight(x, y, fixed, g, sel){
  var d = TRW[g || TR.gram] || TRW[10];
  var fill = fixed ? d.fc : d.c, line = fixed ? d.fs : d.s;
  return '<g transform="translate(' + x + ',' + y + ')">' +
    (sel ? '<rect x="' + (-d.w/2 - 5) + '" y="-5" width="' + (d.w + 10) + '" height="' + (d.h + 10) +
           '" rx="9" fill="none" stroke="#1B7FA8" stroke-width="4"/>' : '') +
    '<rect x="' + (-d.w/2) + '" y="0" width="' + d.w + '" height="' + d.h +
    '" rx="5" fill="' + fill + '" stroke="' + line + '" stroke-width="2"/>' +
    '<rect x="' + (-d.w/2 + 4) + '" y="3" width="' + (d.w - 8) + '" height="3" rx="2" fill="#FFFFFF" opacity=".45"/>' +
    '<text x="0" y="' + (d.h - 4) + '" font-size="' + (d.h > 18 ? 11 : 9) +
    '" font-weight="900" fill="#fff" text-anchor="middle">' + (g || TR.gram) + 'g</text></g>';
}
function renderTsuriai(){
  setBoardBox(600, 470);
  var st = curStage();
  var mL = trMoment('L'), mR = trMoment('R');
  var net = mR - mL;
  /* かたむきの 見た目。20g・30gが 入って はたらきが 360まで 大きく なったので、
     「差 ÷ 8」だと すぐ さいだいまで かたむいて、ひだり はしの おもりが
     てもとの らんに はみ出して しまう。**大きい ほうに くらべた わりあい**で かたむける。 */
  var scale = Math.max(60, Math.max(mL, mR));
  var ang = Math.max(-10, Math.min(10, 10 * net / scale));
  var s = '';

  /* ---- 左右の「はたらき」の 大きさ ---- */
  s += '<g><rect x="34" y="26" width="180" height="46" rx="14" fill="#EAF3F8"/>' +
       '<text x="124" y="46" font-size="12" font-weight="900" fill="#5A7C93" text-anchor="middle">ひだりの はたらき</text>' +
       '<text x="124" y="66" font-size="19" font-weight="900" fill="#0F3350" text-anchor="middle">' + mL + '</text></g>';
  s += '<g><rect x="386" y="26" width="180" height="46" rx="14" fill="#EAF3F8"/>' +
       '<text x="476" y="46" font-size="12" font-weight="900" fill="#5A7C93" text-anchor="middle">みぎの はたらき</text>' +
       '<text x="476" y="66" font-size="19" font-weight="900" fill="#0F3350" text-anchor="middle">' + mR + '</text></g>';
  s += '<text x="300" y="58" font-size="22" font-weight="900" fill="' +
       (mL === mR ? '#2E9A4C' : '#B9C6D1') + '" text-anchor="middle">' + (mL === mR ? '＝' : (mL > mR ? '＞' : '＜')) + '</text>';

  /* ---- 支点（うごかない） ---- */
  s += '<path d="M300 ' + (TR.py + 12) + ' L274 ' + (TR.py + 100) + ' L326 ' + (TR.py + 100) + ' Z" fill="#B08420"/>';
  s += '<rect x="250" y="' + (TR.py + 100) + '" width="100" height="11" rx="6" fill="#8A6A1E"/>';

  /* ---- うで（かたむく） ---- */
  s += '<g transform="rotate(' + ang.toFixed(2) + ' ' + TR.px + ' ' + TR.py + ')">';
  s += '<rect x="' + (TR.px - 262) + '" y="' + (TR.py - 9) + '" width="524" height="18" rx="8" fill="#D8B15C" stroke="#A9812A" stroke-width="3"/>';
  ['L','R'].forEach(function(side){
    var sign = (side === 'L') ? -1 : 1;
    for (var p = 1; p <= TR.maxP; p++){
      var hx = TR.px + sign * TR.step * p;
      /* めもりの ばんごう */
      s += '<text x="' + hx + '" y="' + (TR.py - 18) + '" font-size="13" font-weight="900" fill="#8A6A1E" text-anchor="middle">' + p + '</text>';
      /* フック（ここを タップ すると おもりを おける） */
      var full = trCount(side, p) >= 3;
      s += '<circle cx="' + hx + '" cy="' + (TR.py + 9) + '" r="6" fill="' + (full ? '#C9CDD3' : '#fff') +
           '" stroke="#A9812A" stroke-width="3"/>';
      s += '<circle cx="' + hx + '" cy="' + (TR.py + 9) + '" r="19" fill="transparent" data-hook="' + side + p + '"/>';
      /* おもり（かたむいても まっすぐ ぶら下がる） */
      /* ここに ぶら下がる おもりを、とめて ある もの → 自分で つるした もの の じゅんに つむ */
      var hang = [];
      (st.fixed || []).forEach(function(f){
        if (f.side === side && f.p === p) for (var q=0;q<f.n;q++) hang.push({ g:(f.g || TR.gram), fixed:true });
      });
      cur.placed.forEach(function(w){ if (w.side === side && w.p === p) hang.push({ g:trGramOf(w), fixed:false }); });
      if (hang.length){
        s += '<g transform="translate(' + hx + ',' + (TR.py + 9) + ') rotate(' + (-ang).toFixed(2) + ')">';
        var wy = 8;
        hang.forEach(function(h){
          var d = TRW[h.g] || TRW[10];
          s += trWeight(0, wy, h.fixed, h.g, false);
          if (!h.fixed)
            s += '<rect x="' + (-d.w/2 - 4) + '" y="' + (wy - 2) + '" width="' + (d.w + 8) + '" height="' +
                 (d.h + 4) + '" fill="transparent" data-take="' + side + p + '"/>';
          wy += d.h + TR.wGap;
        });
        if (hang[0].fixed) s += '<text x="0" y="' + (wy + 10) +
                       '" font-size="10" font-weight="900" fill="#8A6A1E" text-anchor="middle">とめてある</text>';
        s += '</g>';
      }
    }
  });
  s += '</g>';

  /* ---- 手もちの おもり。おもさが ちがう ときは タップ して えらべる ---- */
  var tray = trTray(), used = {};
  cur.placed.forEach(function(w){ used[w.gi] = 1; });
  var rest = [];
  tray.forEach(function(gm, i){ if (!used[i]) rest.push({ gi:i, g:gm }); });
  var mixed = tray.some(function(x){ return x !== tray[0]; });
  s += '<line x1="40" y1="384" x2="560" y2="384" stroke="#DCE5EB" stroke-width="3"/>';
  s += '<text x="300" y="406" font-size="14" font-weight="900" fill="#8FA3B8" text-anchor="middle">' +
       (rest.length ? ('てもとの おもり（あと ' + rest.length + 'こ）　' +
                       (mixed ? 'おもりを えらんでから めもりを タップ' : 'めもりを タップ すると つるせるよ'))
                    : 'てもとの おもりは ぜんぶ つるした') + '</text>';
  var totW = 0;
  rest.forEach(function(r){ totW += (TRW[r.g] || TRW[10]).w + 14; });
  var cx = 300 - totW / 2;
  rest.forEach(function(r){
    var d = TRW[r.g] || TRW[10];
    cx += d.w / 2 + 7;
    s += trWeight(cx, 416, false, r.g, cur.trSel === r.gi);
    s += '<rect x="' + (cx - d.w/2 - 8) + '" y="410" width="' + (d.w + 16) + '" height="' + (d.h + 12) +
         '" fill="transparent" data-tray="' + r.gi + '"/>';
    cx += d.w / 2 + 7;
  });

  document.getElementById('board').innerHTML = s;

  var ok = tsuriaiOK();
  if (rest.length) setStatus('あと ' + rest.length + 'こ つるそう', false);
  else if (mL !== mR) setStatus('かたむいて いるよ。おもりの ばしょを かえて みよう', false);
  else setStatus('', false);
  tryClear(ok);
}
function tapTsuriai(e){
  /* てもとの おもりを えらぶ */
  var tv = attrUp(e.target, 'data-tray');
  if (tv !== null){
    var gi = parseInt(tv, 10);
    cur.trSel = (cur.trSel === gi) ? null : gi;
    renderBoard(); return;
  }
  /* つるして ある おもりを タップ → てもとに もどして、そのまま えらんだ ことに する */
  var take = attrUp(e.target, 'data-take');
  if (take !== null){
    var ts = take.charAt(0), tp = parseInt(take.slice(1), 10);
    for (var i = cur.placed.length - 1; i >= 0; i--){
      if (cur.placed[i].side === ts && cur.placed[i].p === tp){
        cur.trSel = cur.placed[i].gi; cur.placed.splice(i, 1); break;
      }
    }
    renderBoard(); return;
  }
  /* めもりを タップ → えらんで いる おもりを つるす（えらんで いなければ てもとの さいしょの もの） */
  var hk = attrUp(e.target, 'data-hook');
  if (hk !== null){
    var hs = hk.charAt(0), hp = parseInt(hk.slice(1), 10);
    var tray = trTray(), used = {};
    cur.placed.forEach(function(w){ used[w.gi] = 1; });
    var pick = (cur.trSel !== null && cur.trSel !== undefined && !used[cur.trSel]) ? cur.trSel : -1;
    if (pick < 0){ for (var k=0;k<tray.length;k++){ if (!used[k]){ pick = k; break; } } }
    if (pick >= 0 && trCount(hs, hp) < 3){ cur.placed.push({ side:hs, p:hp, gi:pick }); cur.trSel = null; }
    renderBoard(); return;
  }
}
ENGINES.tsuriai = { load:loadTsuriai, render:renderTsuriai, tap:tapTsuriai };

/* つりあい型（てこ）の「こたえの れい」。
   ex は **てもとの おもりの じゅんばん**で ['L'/'R', めもり] を ならべた もの。
   （tray の 1こ目が ex の 1つ目。おもさが ちがう ので この 対おうが だいじ） */
function hintAnswerTsuriai(st){
  if (!st.ex) return '';
  var tray = trTray(st), li = '';
  st.ex.forEach(function(e, i){
    li += '<li><b>' + tray[i] + 'g</b> の おもりを <b>' + (e[0] === 'L' ? 'ひだり' : 'みぎ') +
          'の めもり ' + e[1] + '</b> に つるす</li>';
  });
  var mixed = tray.some(function(x){ return x !== tray[0]; });
  return '<details class="ans"><summary>▶ それでも こまったら「こたえの れい」を 見る</summary>' +
    '<div class="ans-in">つぎの じゅんに やって みよう。' +
    (mixed ? '<br>（おもさが ちがう ので、<b>てもとの おもりを タップ して えらんでから</b> めもりを タップ するよ）' : '') +
    '<ol>' + li + '</ol>' +
    '<div class="ans-note">これは こたえの <b>1つ</b>。<b>ほかの つるし方でも つり合えば せいかい</b>だよ。' +
    'つるした おもりを タップ すると てもとに もどせる。</div></div></details>';
}
ENGINES.tsuriai.hintAnswer = hintAnswerTsuriai;
