/* ================================================================== *
 * じっけん型 — じょうけん制御（かえるのは 1つだけ）＋ ほんとうに じっけんを 走らせる
 *
 *   ながれ:  ①くみたて（A と B の じょうけんを えらぶ＋よそう）
 *            ②じっけん（アニメで 走る。ストップウォッチが うごく）
 *            ③けっか（時間を くらべて けつろん）
 *
 *   せいかいは「しらべたい じょうけんだけ ちがう。ほかは ぜんぶ 同じ」という
 *   <ルール> で 判定する。こたえの 組み合わせを 人が 用意する 必要が ない。
 *
 *   だいじ: 答えを 文で 教えない。**じっけんを 走らせて 見せる**。
 *   じょうけんを そろえずに 走らせる ことも できて、その ときは
 *   「時間は ちがったけど どっちが きいたの？」と 気づかせる。ここが この型の キモ。
 *
 *   st.sim で どの じっけんを 走らせるか きめる（SIMS に とうろく）。
 *   st.sim が なければ くみたてだけ（アニメなし）。
 * ================================================================== */
var JK = { rowH:74, top:112, speed:4 };
function jkVal(x){ return (x && x.label !== undefined) ? x.label : x; }
function jkNum(x){ return (x && x.v !== undefined) ? x.v : null; }

/* ---- じっけんの なかみ。あたらしい じっけんは ここに 1つ 足す ----
   やくそく（いらない ものは 書かなくて よい）:
     measure(v)          くらべる 数ち。**大きい ほうが よそうの「そのがわ」**
     total(v)            アニメの 長さ（びょう）
     summary(v)          じょうけんの 1行（「じっけん A」の 下）
     readout(inf,shown)  ばんの したの 数字 {top, bottom}
     art(side,cx,v,inf,t,stopped)  え
     line(A,B,diff)      けっかの 3行目（見えた ことを ことばに する）
     ask / hint          よそうの しつもん と したの ひとこと
     words.name          くらべて いる ものの 名まえ（「〜は かわった」の 〜）
     words.sameSetup     A と B が 同じに なって いた ときの 1行目
     speed               はやおくり（きめないと 4ばい）
     tick(side,cx,inf,t,fin)  毎フレームの こまかい こうしん。
                         なければ **数字が かわった ときだけ** かきなおす（かるくする ため）
   ------------------------------------------------------------------ */
var SIMS = {};

/* えらんだ じょうけんを 数ちに する（ぜんぶの じっけん 共通） */
function jkVals(side){
  var st = curStage(), v = {};
  st.vars.forEach(function(vr){
    var pick = cur.exp[side][vr.id];
    v[vr.id] = (pick === undefined) ? null : jkNum(vr.values[pick]);
  });
  return v;
}

/* ================== ①でんじしゃく ==================
   つよさ ∝ まきかず × でんりゅう。しんが 鉄で ないと クリップは つかない。
   ここも「つく こ数」を 計算で 出して いる（人が 用意した 正かいは ない）。 */
function jishakuN(v){
  if (v.shin !== 'tetsu') return 0;                 /* 鉄しんが ないと じしゃくに ならない */
  return Math.round((v.maki / 100) * v.denchi * 5);
}
SIMS.jishaku = {
  ask:  'よそう：クリップが たくさん つくのは？',
  hint: 'どちらが つよいか よそうして みよう',
  speed: 1,
  words:{ name:'つく クリップの 数', sameSetup:'A と B が 同じ でんじしゃくに なって いたよ。' },
  measure: function(v){ return jishakuN(v); },
  total: function(v){ return 1.0 + jishakuN(v) * 0.12 + 0.3; },
  summary: function(v){
    return (v.shin === 'tetsu' ? '鉄しん' : 'アルミしん') + ' ・ ' + v.maki + 'かい ・ でんち' + v.denchi + 'こ';
  },
  n: function(inf, shown){
    if (!inf.val) return 0;
    return Math.max(0, Math.min(inf.val, Math.floor((shown - 0.9) / 0.12)));
  },
  readout: function(inf, shown){
    return { top:'ついた クリップ', bottom: SIMS.jishaku.n(inf, shown) + ' こ' };
  },
  line: function(A, B, diff){
    return diff ? '（A は ' + A.val + 'こ、B は ' + B.val + 'こ ついた）'
                : 'どちらも ' + A.val + 'こ。同じ つよさ！';
  },
  art: function(side, cx, v, inf, t, stopped){
    var n = SIMS.jishaku.n(inf, stopped ? inf.total : t);
    var col = (side === 'A') ? '#3EA7D8' : '#E8618C';
    var s = '', i;
    /* かんでんち（よこに ならべる） */
    var bw = 46, bx0 = cx - ((v.denchi - 1) * (bw + 8)) / 2;
    for (i = 0; i < v.denchi; i++){
      var bx = bx0 + i * (bw + 8);
      s += '<g transform="translate(' + bx + ',80)">' +
           '<rect x="-23" y="-11" width="46" height="22" rx="5" fill="#F0B562" stroke="#C98C36" stroke-width="2"/>' +
           '<rect x="17" y="-5" width="8" height="10" rx="2" fill="#C98C36"/>' +
           '<text x="-4" y="5" font-size="11" font-weight="900" fill="#8A5B00" text-anchor="middle">＋−</text></g>';
    }
    /* どうせん（でんちから コイルへ） */
    s += '<path d="M' + (bx0 - 23) + ' 80 L' + (cx - 44) + ' 80 L' + (cx - 44) + ' 122 L' + (cx - 17) + ' 128" ' +
         'fill="none" stroke="#5A7C93" stroke-width="4" stroke-linecap="round"/>';
    s += '<path d="M' + (bx0 + (v.denchi - 1) * (bw + 8) + 23) + ' 80 L' + (cx + 44) + ' 80 L' + (cx + 44) +
         ' 122 L' + (cx + 17) + ' 128" fill="none" stroke="#5A7C93" stroke-width="4" stroke-linecap="round"/>';
    /* しん（鉄／アルミ） */
    var core = (v.shin === 'tetsu') ? '#9AA7B4' : '#DCE3E9';
    s += '<rect x="' + (cx - 9) + '" y="118" width="18" height="112" rx="4" fill="' + core +
         '" stroke="#7A8794" stroke-width="2"/>';
    s += '<text x="' + (cx + 44) + '" y="150" font-size="11" font-weight="900" fill="#8FA3B8" text-anchor="middle">' +
         (v.shin === 'tetsu' ? '鉄' : 'アルミ') + '</text>';
    /* コイル（まきかずに あわせて わっかの 数を かえる） */
    var loops = Math.round(v.maki / 20);             /* 100かい→5・200かい→10 の え */
    for (i = 0; i < loops; i++){
      var ly = 130 + i * (86 / loops);
      s += '<ellipse cx="' + cx + '" cy="' + ly.toFixed(1) + '" rx="17" ry="5" fill="none" stroke="#C97A3C" stroke-width="3.5"/>';
    }
    /* クリップ（下の はしに くっつく） */
    for (i = 0; i < n; i++){
      var r0 = (i / 5) | 0, c0 = i % 5;
      var cxx = cx + (c0 - 2) * 15, cyy = 234 + r0 * 17;
      /* ゼムクリップの かたち（まるい はしの はりがね） */
      s += '<g transform="translate(' + cxx + ',' + cyy + ')">' +
           '<path d="M-4 14 V5 a4,4 0 0 1 8,0 v10 a2.6,2.6 0 0 1 -5.2,0 V6" fill="none" stroke="' + col +
           '" stroke-width="2" stroke-linecap="round"/></g>';
    }
    if (!inf.val && (stopped || t > 1.1))
      s += '<text x="' + cx + '" y="252" font-size="13" font-weight="900" fill="#8FA3B8" text-anchor="middle">クリップは つかない…</text>';
    return s;
  }
};

/* ================== ②もののとけ方 ==================
   とける りょうは 「水の りょう」に ひれい し、「おん度」の きき方は **ものに よって ちがう**。
   じっさいの ようかい度（水50mLあたり・g）を まるめて つかう。 */
function tokeG(v){ return TOKE_MONO[v.mono].per50[v.ondo] * (v.mizu / 50); }
SIMS.tokekata = {
  ask:  'よそう：たくさん とけるのは？',
  hint: 'どちらが たくさん とけるか よそうして みよう',
  speed: 1,
  words:{ name:'とける りょう', sameSetup:'A と B が 同じ じょうけんに なって いたよ。' },
  eps: 2,                                           /* 1〜2g の ちがいは 実験の ごさ。「ほとんど かわらない」と 見る */
  measure: function(v){ return tokeG(v); },
  total: function(v){ return 1.0 + (tokeG(v) + 4) * 0.055; },
  summary: function(v){ return TOKE_MONO[v.mono].name + ' ・ 水' + v.mizu + 'mL ・ ' + v.ondo + 'ど'; },
  /* 入れた りょう（とける ぶん ＋ とけのこる 4g まで 入れて みる） */
  put: function(inf, shown){
    var max = inf.val + 4;
    return Math.max(0, Math.min(max, Math.floor(((shown - 0.6) / (inf.total - 0.6)) * max)));
  },
  readout: function(inf, shown){
    var p = SIMS.tokekata.put(inf, shown);
    return { top:'入れた ' + p + 'g', bottom:'とけた ' + Math.min(p, inf.val) + 'g' };
  },
  line: function(A, B, diff){
    if (diff) return '（A は ' + A.val + 'g、B は ' + B.val + 'g とけた）';
    return (A.val === B.val) ? 'どちらも ' + A.val + 'g。ぴったり 同じ！'
                             : '（A は ' + A.val + 'g、B は ' + B.val + 'g。ほとんど 同じ）';
  },
  art: function(side, cx, v, inf, t, stopped){
    var mono = TOKE_MONO[v.mono];
    var p = SIMS.tokekata.put(inf, stopped ? inf.total : t);
    var nokori = Math.max(0, p - inf.val);
    var s = '', i;
    /* ビーカー（水の りょうで 水めんの 高さが かわる） */
    var top = 110, bot = 266, bw = 56;
    var wy = (v.mizu >= 100) ? top + 24 : top + 82;
    s += '<rect x="' + (cx - bw) + '" y="' + wy + '" width="' + (bw * 2) + '" height="' + (bot - wy) +
         '" fill="' + mono.water + '"/>';
    s += '<path d="M' + (cx - bw) + ' ' + top + ' L' + (cx - bw) + ' ' + bot + ' L' + (cx + bw) + ' ' + bot +
         ' L' + (cx + bw) + ' ' + top + '" fill="none" stroke="#8FA3B8" stroke-width="4" stroke-linejoin="round"/>';
    s += '<line x1="' + (cx - bw) + '" y1="' + wy + '" x2="' + (cx + bw) + '" y2="' + wy +
         '" stroke="#7FB6D6" stroke-width="3"/>';
    s += '<text x="' + (cx + bw + 14) + '" y="' + (wy + 5) + '" font-size="11" font-weight="900" fill="#8FA3B8">' +
         v.mizu + '<tspan font-size="9">mL</tspan></text>';
    /* おん度が 高い ときは あたためて いる ようす */
    if (v.ondo >= 60){
      for (i = 0; i < 3; i++){
        var fx = cx - 26 + i * 26;
        s += '<path d="M' + fx + ' ' + (bot + 24) + ' q-7 -10 0 -18 q7 8 0 18 Z" fill="#F5B324" opacity=".9"/>';
      }
      s += '<text x="' + cx + '" y="' + (bot + 40) + '" font-size="10" font-weight="900" fill="#C9820A" text-anchor="middle">あたためて いる</text>';
    }
    /* スプーンから 入れて いる ようす */
    if (!stopped && p < inf.val + 4){
      s += '<g transform="translate(' + (cx - 4) + ',' + (top - 22) + ')">' +
           '<ellipse cx="0" cy="0" rx="13" ry="7" fill="#DCE5EB" stroke="#8FA3B8" stroke-width="2"/>' +
           '<rect x="12" y="-3" width="26" height="5" rx="2" fill="#8FA3B8"/></g>';
      for (i = 0; i < 3; i++)
        s += '<circle cx="' + (cx - 8 + i * 7) + '" cy="' + (top - 4 + i * 6) + '" r="2.6" fill="' +
             mono.grain + '" stroke="' + mono.line + '" stroke-width="1"/>';
    }
    /* とけのこり（そこに つもる） */
    for (i = 0; i < Math.min(nokori * 3, 24); i++){
      var gx = cx - 44 + (i % 12) * 8, gy = bot - 6 - ((i / 12) | 0) * 7;
      s += '<circle cx="' + gx + '" cy="' + gy + '" r="3.4" fill="' + mono.grain +
           '" stroke="' + mono.line + '" stroke-width="1.2"/>';
    }
    if (nokori > 0)
      s += '<text x="' + cx + '" y="' + (bot - 26) + '" font-size="11" font-weight="900" fill="#E08A00" text-anchor="middle">とけのこった</text>';
    return s;
  }
};

/* ================== ③たねの 発芽 ==================
   10つぶ まいて 何こ 芽が 出るか。水・空気・温度が そろって いれば 9こ、
   1つでも かけて いれば 0こ。日光と 肥料では かわらない ―― それを 目で 見せる。 */
function hatsugaN(v){
  var kuki = (v.kuki === null || v.kuki === undefined) ? 1 : v.kuki;
  return (v.mizu && kuki && v.ondo >= 20) ? 9 : 0;
}
SIMS.hatsuga = {
  ask:  'よそう：たくさん 芽が 出るのは？',
  hint: 'どちらが たくさん 芽を 出すか よそうして みよう',
  speed: 1,
  words:{ name:'発芽した たねの 数', sameSetup:'A と B が 同じ じょうけんに なって いたよ。' },
  measure: function(v){ return hatsugaN(v); },
  total: function(v){ return 2.6; },
  summary: function(v){
    var t = [];
    t.push(v.mizu ? '水あり' : '水なし');
    if (v.kuki !== null && v.kuki !== undefined) t.push(v.kuki ? '空気あり' : '水の中');
    t.push(v.ondo + 'ど');
    if (v.hikari !== null && v.hikari !== undefined) t.push(v.hikari ? '日光あり' : '日光なし');
    if (v.hiryo !== null && v.hiryo !== undefined) t.push(v.hiryo ? '肥料あり' : '肥料なし');
    return t.join(' ・ ');
  },
  n: function(inf, shown){
    if (!inf.val) return 0;
    return Math.max(0, Math.min(inf.val, Math.floor((shown - 0.7) / 0.18)));
  },
  readout: function(inf, shown){
    return { top:'まいた たね 10つぶ', bottom: SIMS.hatsuga.n(inf, shown) + ' こ 発芽' };
  },
  line: function(A, B, diff){
    return diff ? '（A は ' + A.val + 'こ、B は ' + B.val + 'こ 発芽した）'
                : 'どちらも ' + A.val + 'こ。ぴったり 同じ！';
  },
  art: function(side, cx, v, inf, t, stopped){
    var n = SIMS.hatsuga.n(inf, stopped ? inf.total : t), i;
    var s = '', top = 130;
    /* シャーレ */
    s += '<ellipse cx="' + cx + '" cy="' + (top + 76) + '" rx="86" ry="26" fill="#EEF3F7" stroke="#8FA3B8" stroke-width="3"/>';
    s += '<path d="M' + (cx - 86) + ' ' + (top + 60) + ' v16 M' + (cx + 86) + ' ' + (top + 60) + ' v16" stroke="#8FA3B8" stroke-width="3"/>';
    s += '<ellipse cx="' + cx + '" cy="' + (top + 60) + '" rx="86" ry="26" fill="' + (v.mizu ? '#DCEBF5' : '#F6EFE2') +
         '" stroke="#8FA3B8" stroke-width="3"/>';
    if (v.kuki === 0)
      s += '<ellipse cx="' + cx + '" cy="' + (top + 44) + '" rx="86" ry="26" fill="#BEDCEE" opacity=".75" stroke="#7FB6D6" stroke-width="3"/>';
    /* たね 10つぶ */
    for (i = 0; i < 10; i++){
      var a = i * 2.39, rad = 62 * Math.sqrt((i + 0.5) / 10);
      var sx = cx + Math.cos(a) * rad, sy = top + 60 + Math.sin(a) * rad * 0.3;
      s += '<ellipse cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" rx="6" ry="4.5" fill="#B4844F" stroke="#8C6135" stroke-width="1.5"/>';
      if (i < n)
        s += '<path d="M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' q-3 -12 4 -18 q3 8 -1 18" fill="#4FC46A" stroke="#2E9A4C" stroke-width="1.6"/>';
    }
    /* おん度と 日光の ようす */
    s += '<text x="' + cx + '" y="' + (top - 22) + '" font-size="13" font-weight="900" fill="' +
         (v.ondo >= 20 ? '#E08A00' : '#3EA7D8') + '" text-anchor="middle">' +
         (v.ondo >= 20 ? '🌡️ あたたかい へや' : '🧊 さむい れいぞうこ') + '</text>';
    if (v.hikari === 0)
      s += '<text x="' + cx + '" y="' + (top - 44) + '" font-size="12" font-weight="900" fill="#5A7C93" text-anchor="middle">🌑 はこを かぶせて 光を 通さない</text>';
    else if (v.hikari === 1)
      s += '<text x="' + cx + '" y="' + (top - 44) + '" font-size="12" font-weight="900" fill="#C9820A" text-anchor="middle">☀️ 日光を あてる</text>';
    return s;
  }
};

function jkStop(){
  if (cur.raf){ cancelAnimationFrame(cur.raf); cur.raf = null; }
}
function loadJikken(st){
  jkStop();
  cur.exp = { A:{}, B:{} };
  /* えらびようが 1つしか ない じょうけんは 先に 入れて おく（子どもを 迷わせない） */
  st.vars.forEach(function(v){
    if (v.values.length === 1){ cur.exp.A[v.id] = 0; cur.exp.B[v.id] = 0; }
  });
  cur.phase = 'set'; cur.pred = null; cur.t = 0; cur.fin = { A:null, B:null };
}
function jikkenState(){
  var st = curStage(), all = true, targetDiff = false, othersSame = true;
  st.vars.forEach(function(v){
    var a = cur.exp.A[v.id], b = cur.exp.B[v.id];
    if (a === undefined || b === undefined){ all = false; return; }
    if (v.id === st.target){ if (a !== b) targetDiff = true; }
    else if (a !== b) othersSame = false;
  });
  return { all:all, targetDiff:targetDiff, othersSame:othersSame };
}
function jikkenFair(){
  var r = jikkenState();
  return r.all && r.targetDiff && r.othersSame;
}
/* クリアは「くみ立てが 正しくて、じっけんを 走らせて けっかを 見た」ときだけ */
function jikkenOK(){ return cur.phase === 'done' && jikkenFair(); }

function jkSim(){ return SIMS[curStage().sim]; }
function jkInfo(side){
  var sim = jkSim(), v = jkVals(side);
  var T = sim.period ? sim.period(v) : 0;
  var total = sim.total ? sim.total(v) : T * sim.laps;
  var val = sim.measure ? sim.measure(v) : T;
  return { v:v, T:T, total:total, val:val };
}

/* ------------------ ①くみたての がめん ------------------ */
function jkRenderSet(){
  var st = curStage(), n = st.vars.length, sim = jkSim() || {};
  setBoardBox(600, JK.top + n * JK.rowH + 146);
  var s = '';
  s += '<rect x="24" y="18" width="552" height="42" rx="14" fill="#FFF8E4" stroke="#F5B324" stroke-width="2"/>';
  s += '<text x="300" y="45" font-size="15" font-weight="900" fill="#8A5B00" text-anchor="middle">🎯 ' + st.question + '</text>';
  [['A', 265, '#3EA7D8'], ['B', 465, '#E8618C']].forEach(function(c){
    s += '<rect x="' + (c[1] - 92) + '" y="72" width="184" height="30" rx="12" fill="' + c[2] + '"/>';
    s += '<text x="' + c[1] + '" y="93" font-size="15" font-weight="900" fill="#fff" text-anchor="middle">じっけん ' + c[0] + '</text>';
  });
  st.vars.forEach(function(v, ri){
    var y = JK.top + ri * JK.rowH;
    if (ri % 2 === 0) s += '<rect x="16" y="' + (y - 6) + '" width="568" height="' + (JK.rowH - 6) + '" rx="12" fill="#F5F9FB"/>';
    s += '<text x="28" y="' + (y + 26) + '" font-size="14" font-weight="900" fill="#3B5A70">' + v.label + '</text>';
    var a = cur.exp.A[v.id], b = cur.exp.B[v.id];
    if (a !== undefined && b !== undefined){
      var same = (a === b);
      s += '<text x="28" y="' + (y + 46) + '" font-size="12" font-weight="900" fill="' +
           (same ? '#8FA3B8' : '#E08A00') + '">' + (same ? '＝ 同じ' : '≠ ちがう') + '</text>';
    }
    [['A', 265], ['B', 465]].forEach(function(c){
      v.values.forEach(function(val, vi){
        var w = 84, cx = c[1] + (vi - (v.values.length - 1) / 2) * (w + 8);
        var on = (cur.exp[c[0]][v.id] === vi);
        s += '<g transform="translate(' + cx + ',' + (y + 22) + ')">' +
             '<rect x="' + (-w/2) + '" y="-17" width="' + w + '" height="38" rx="12" fill="' +
             (on ? '#1B7FA8' : '#fff') + '" stroke="' + (on ? '#0E5B7C' : '#B9C6D1') + '" stroke-width="' + (on ? 4 : 3) + '"/>' +
             '<text x="0" y="8" font-size="14" font-weight="900" fill="' + (on ? '#fff' : '#3B5A70') +
             '" text-anchor="middle">' + jkVal(val) + '</text>' +
             '<rect x="' + (-w/2) + '" y="-19" width="' + w + '" height="42" fill="transparent" data-exp="' +
             c[0] + '|' + v.id + '|' + vi + '"/></g>';
      });
    });
  });
  /* よそう */
  var py = JK.top + n * JK.rowH + 22;
  s += '<text x="28" y="' + py + '" font-size="14" font-weight="900" fill="#3B5A70">' +
       (sim.ask || 'よそう：大きく なるのは？') + '</text>';
  [['A','A のほう',186],['B','B のほう',300],['same','同じ',414]].forEach(function(c){
    var on = (cur.pred === c[0]);
    s += '<g transform="translate(' + c[2] + ',' + (py + 30) + ')">' +
         '<rect x="-54" y="-17" width="108" height="36" rx="14" fill="' + (on ? '#F5B324' : '#fff') +
         '" stroke="' + (on ? '#C9820A' : '#B9C6D1') + '" stroke-width="' + (on ? 4 : 3) + '"/>' +
         '<text x="0" y="7" font-size="14" font-weight="900" fill="' + (on ? '#fff' : '#3B5A70') +
         '" text-anchor="middle">' + c[1] + '</text>' +
         '<rect x="-54" y="-19" width="108" height="40" fill="transparent" data-pred="' + c[0] + '"/></g>';
  });
  /* スタート（じょうけんが そろって いなくても おせる。まちがいからも 学べる） */
  var ready = jikkenState().all && cur.pred !== null;
  var by = py + 76;
  s += '<g transform="translate(300,' + by + ')">' +
       '<rect x="-140" y="-22" width="280" height="44" rx="22" fill="' + (ready ? '#2E9A4C' : '#DCE5EB') + '"/>' +
       '<text x="0" y="8" font-size="18" font-weight="900" fill="' + (ready ? '#fff' : '#A9B7C2') +
       '" text-anchor="middle">▶ じっけん スタート！</text>' +
       (ready ? '<rect x="-140" y="-22" width="280" height="44" fill="transparent" data-go2="run"/>' : '') +
       '</g>';
  document.getElementById('board').innerHTML = s;
  if (!jikkenState().all) setStatus('A と B の ぜんぶを えらぼう', false);
  else if (cur.pred === null) setStatus(sim.hint || 'どちらが 大きいか よそうして みよう', false);
  else setStatus('じっけん スタート を おそう！', false);
}

/* ------------------ ②③ じっけん／けっかの がめん ------------------ */
function jkRead(sim, inf, shown){
  return sim.readout ? sim.readout(inf, shown) : { top:'', bottom: shown.toFixed(1) + ' びょう' };
}
function jkRenderRun(){
  var sim = jkSim();
  var A = jkInfo('A'), B = jkInfo('B');
  var done = (cur.phase === 'done');
  /* けっかパネルは 文の 行数で 高さが かわる。ばんの 高さも それに あわせる
     （そろえないと「もういちど」ボタンが 文字に かぶる） */
  var vd = done ? jkVerdict(A, B) : null;
  var panelY = 386;
  var panelH = vd ? (26 + vd.lines.length * 22 + (vd.retry ? 44 : 10)) : 0;
  setBoardBox(600, done ? (panelY + panelH + 14) : 500);
  var s = '';
  s += '<text x="300" y="30" font-size="16" font-weight="900" fill="#0F3350" text-anchor="middle">' +
       (done ? '🔬 けっか' : '⏱ じっけん ちゅう…') + '</text>';
  if (!done)
    s += '<text x="300" y="486" font-size="12" font-weight="900" fill="#8FA3B8" text-anchor="middle">' +
         ((sim.speed || JK.speed) > 1 ? '▶▶ ' + (sim.speed || JK.speed) + 'ばい はやおくり　／　' : '') +
         'タップで けっかへ</text>';
  [['A', 170, A, '#3EA7D8'], ['B', 430, B, '#E8618C']].forEach(function(c){
    var side = c[0], cx = c[1], inf = c[2];
    var fin = cur.fin[side];
    var shown = (fin !== null) ? fin : cur.t;
    var ro = jkRead(sim, inf, shown);
    s += '<text x="' + cx + '" y="50" font-size="14" font-weight="900" fill="' + c[3] +
         '" text-anchor="middle">じっけん ' + side + '</text>';
    s += '<text x="' + cx + '" y="66" font-size="11" font-weight="900" fill="#8FA3B8" text-anchor="middle">' +
         (sim.summary ? sim.summary(inf.v) : '') + '</text>';
    s += sim.art(side, cx, inf.v, inf, cur.t, fin !== null && done);
    s += '<rect x="' + (cx - 108) + '" y="312" width="216" height="62" rx="14" fill="' +
         (fin !== null ? '#E6F7EA' : '#F1F6F9') + '" stroke="' + (fin !== null ? '#2E9A4C' : '#DCE5EB') + '" stroke-width="2"/>';
    s += '<text id="jk-lap' + side + '" x="' + cx + '" y="335" font-size="14" font-weight="900" fill="#3B5A70" text-anchor="middle">' +
         ro.top + '</text>';
    s += '<text id="jk-tim' + side + '" x="' + cx + '" y="362" font-size="20" font-weight="900" fill="#0F3350" text-anchor="middle">' +
         ro.bottom + '</text>';
  });
  if (done){
    s += '<rect x="24" y="' + panelY + '" width="552" height="' + panelH + '" rx="16" fill="' +
         (vd.good ? '#E6F7EA' : '#FFF3E0') + '" stroke="' + (vd.good ? '#2E9A4C' : '#E08A00') + '" stroke-width="2"/>';
    vd.lines.forEach(function(ln, i){
      s += '<text x="300" y="' + (panelY + 26 + i * 22) + '" font-size="14" font-weight="900" fill="' +
           (vd.good ? '#1E6E37' : '#8A5B00') + '" text-anchor="middle">' + ln + '</text>';
    });
    if (vd.retry){
      var by2 = panelY + 26 + vd.lines.length * 22 + 14;
      s += '<g transform="translate(300,' + by2 + ')"><rect x="-116" y="-17" width="232" height="34" rx="17" fill="#E08A00"/>' +
           '<text x="0" y="6" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">↺ もういちど くみたてる</text>' +
           '<rect x="-116" y="-17" width="232" height="34" fill="transparent" data-go2="set"/></g>';
    }
  }
  document.getElementById('board').innerHTML = s;
  setStatus(done ? '' : 'よく 見てね…', false);
  if (done) tryClear(jikkenOK());
}
/* けっかの こうひょう。ここで 答えを 言うのでは なく、見えた ことを ことばに する */
function jkVerdict(A, B){
  var st = curStage(), sim = jkSim(), r = jikkenState();
  var w = sim.words || {};
  var mName = w.name || 'けっか';
  var d = Math.abs(A.val - B.val);
  var diff = d > (sim.eps || 0.05);
  /* ごさの はんいの ちがいを「かわらなかった」と 言いきると うそに なるので ことばを 分ける */
  var changed = diff ? 'かわった' : (d > 1e-9 ? 'ほとんど かわらなかった' : 'かわらなかった');
  var tName = '';
  st.vars.forEach(function(v){ if (v.id === st.target) tName = v.label; });
  if (!r.targetDiff)
    return { good:false, retry:true, lines:[
      w.sameSetup || 'A と B が 同じ じょうけんに なって いたよ。',
      'これでは「' + tName + '」を くらべられないね。'] };
  if (!r.othersSame)
    return { good:false, retry:true, lines:[
      mName + 'は ' + (diff ? 'ちがった' : '同じだった') + '。でも…',
      'A と B は ちがう ところが 2つ いじょう あるよ。',
      'これでは どちらが きいたのか 分からないね。'] };
  var predOK = (cur.pred === 'same' && !diff) ||
               (cur.pred === 'A' && diff && A.val > B.val) ||
               (cur.pred === 'B' && diff && B.val > A.val);
  return { good:true, retry:false, lines:[
    (predOK ? '⭐ よそう どおり！' : '✨ よそうと ちがった！ それが 発見だよ'),
    '「' + tName + '」だけを かえたら、' + mName + 'は ' + changed + '。',
    sim.line(A, B, diff)] };
}

/* ------------------ アニメ ------------------ */
function jkTick(){
  var sim = jkSim(), changed = false;
  ['A','B'].forEach(function(side){
    var inf = jkInfo(side);
    if (cur.fin[side] === null && cur.t >= inf.total) cur.fin[side] = inf.total;
    var fin = cur.fin[side];
    var shown = (fin !== null) ? fin : cur.t;
    var ro = jkRead(sim, inf, shown);
    var lt = document.getElementById('jk-lap' + side), tt = document.getElementById('jk-tim' + side);
    if (lt && lt.textContent !== ro.top){ lt.textContent = ro.top; changed = true; }
    if (tt && tt.textContent !== ro.bottom){ tt.textContent = ro.bottom; changed = true; }
    if (sim.tick) sim.tick(side, side === 'A' ? 170 : 430, inf, cur.t, fin);
  });
  /* えが なめらかに うごかない じっけんは、数字が かわった ときだけ かきなおす（かるくする ため） */
  if (!sim.tick && changed && cur.phase === 'run') renderBoard();
}
function jkStartRun(){
  cur.phase = 'run'; cur.t = 0; cur.fin = { A:null, B:null };
  renderBoard();
  var speed = jkSim().speed || JK.speed;
  var last = null;
  function step(now){
    if (cur.phase !== 'run' || cur.kind !== 'jikken'){ cur.raf = null; return; }
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    cur.t += dt * speed;
    jkTick();
    if (cur.fin.A !== null && cur.fin.B !== null){ cur.raf = null; jkFinish(); return; }
    cur.raf = requestAnimationFrame(step);
  }
  cur.raf = requestAnimationFrame(step);
}
function jkFinish(){
  jkStop();
  ['A','B'].forEach(function(side){ if (cur.fin[side] === null) cur.fin[side] = jkInfo(side).total; });
  cur.phase = 'done';
  renderBoard();
}

function renderJikken(){
  if (cur.phase === 'set' || !jkSim()) jkRenderSet();
  else jkRenderRun();
}
function tapJikken(e){
  var g2 = attrUp(e.target, 'data-go2');
  if (g2 !== null){
    jkStop();
    if (g2 === 'run') jkStartRun();
    else { cur.phase = 'set'; renderBoard(); }
    return;
  }
  if (cur.phase === 'run'){ jkFinish(); return; }      /* まちきれない ときは タップで けっかへ */
  if (cur.phase === 'done') return;
  var pr = attrUp(e.target, 'data-pred');
  if (pr !== null){ cur.pred = pr; renderBoard(); return; }
  var v = attrUp(e.target, 'data-exp');
  if (v === null) return;
  var a = v.split('|');
  cur.exp[a[0]][a[1]] = parseInt(a[2], 10);
  renderBoard();
}
ENGINES.jikken = { load:loadJikken, render:renderJikken, tap:tapJikken };
