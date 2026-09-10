/* ================================================================== *
 * すいり型 — 「正体を あばけ」（水よう液）
 *
 *   ラベルの ない びんが ならぶ。道具（リトマス紙・じょうはつ・におい・鉄くぎ・石灰水）を
 *   **好きな びんに 好きな じゅんばんで** つかい、出て きた けっかから 正体を 当てる。
 *
 *   ここも 答えを 人が 用意して いない。道具の けっかは ぜんぶ SUI_EKI の
 *   せいしつ表から **計算して** 出す。だから しらべる じゅんばんは 何どおりでも よく、
 *   「どの 道具を つかえば いちばん しぼれるか」を 考えるのが この あそびの 中みに なる。
 *
 *   ★（きんカード）は「しらべた 回数 ≦ target」かつ「こたえあわせ 1回で 的中」。
 *   → あてずっぽうで 名まえを 入れかえても ★は 取れない。
 * ================================================================== */
var SR = { top:8, by:112, memo:200, mline:17, sep:282, t1:308, t2:358, btn:420, H:462 };

function suiEki(id){ for (var i=0;i<SUI_EKI.length;i++){ if (SUI_EKI[i].id === id) return SUI_EKI[i]; } return null; }
function suiTool(id){ for (var i=0;i<SUI_TOOLS.length;i++){ if (SUI_TOOLS[i].id === id) return SUI_TOOLS[i]; } return null; }
function suiX(i){
  var n = curStage().ekis.length;
  return 300 + (i - (n - 1) / 2) * (n >= 6 ? 90 : (n >= 5 ? 106 : 128));
}
function loadSuiri(st){
  cur.slots = shuffled(st.ekis);            /* どの びんに 何が 入って いるかは まいかい かわる */
  cur.probes = st.ekis.map(function(){ return {}; });
  cur.labels = st.ekis.map(function(){ return null; });
  cur.tool = null; cur.pick = null; cur.msg = '';
  cur.nProbe = 0; cur.nCheck = 0; cur.solved = false;
}
function suiriOK(){ return cur.solved === true; }

/* ---- びんの え ---- */
function suiBottle(cx, cy, ekiId, mark, sel){
  var e = ekiId ? suiEki(ekiId) : null;
  var s = '<g transform="translate(' + cx + ',' + cy + ')">';
  if (sel) s += '<rect x="-42" y="-66" width="84" height="130" rx="16" fill="#1B7FA8" opacity=".16"/>';
  s += '<rect x="-15" y="-60" width="30" height="11" rx="3" fill="#8FA3B8"/>';
  s += '<rect x="-11" y="-50" width="22" height="13" fill="#DCE5EB" stroke="#8FA3B8" stroke-width="2.5"/>';
  s += '<path d="M-30 -36 q0 -5 9 -7 h42 q9 2 9 7 v66 q0 7 -7 7 h-46 q-7 0 -7 -7 Z" fill="#F7FAFC" stroke="' +
       (sel ? '#1B7FA8' : '#8FA3B8') + '" stroke-width="' + (sel ? 4 : 3) + '"/>';
  /* 中みは ぜんぶ 見た目 おなじ「とうめい」。あわだけは 目で 見て 分かる */
  s += '<path d="M-27 -2 h54 v28 q0 5 -5 5 h-44 q-5 0 -5 -5 Z" fill="#E8F2F8"/>';
  s += '<line x1="-27" y1="-2" x2="27" y2="-2" stroke="#9FB4C4" stroke-width="2"/>';
  if (e && e.awa){
    [[-15,20,3.4],[-3,10,2.6],[9,17,3],[16,7,2.2],[-8,3,2]].forEach(function(b){
      s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="none" stroke="#5FA8C7" stroke-width="1.6"/>';
    });
  }
  /* びんの ラベル（記号だけ。中みの 名まえは 書いて ない） */
  s += '<rect x="-19" y="-30" width="38" height="22" rx="4" fill="#fff" stroke="#C3D0DA" stroke-width="2"/>';
  s += '<text x="0" y="-13" font-size="15" font-weight="900" fill="#3B5A70" text-anchor="middle">' + mark + '</text>';
  return s + '</g>';
}
/* 道具の 小さい アイコン（12x12くらい。字が 読めなくても 分かるように） */
function suiIcon(id, k){
  var s = '<g transform="scale(' + k + ')">';
  if (id === 'litmus') s += '<rect x="-3" y="-8" width="6" height="16" rx="1" fill="#7FB6D6"/><rect x="-3" y="0" width="6" height="8" rx="1" fill="#E05A4A"/>';
  else if (id === 'evap') s += '<path d="M-8 -2 h16 q0 8 -8 8 q-8 0 -8 -8 Z" fill="#DCE5EB" stroke="#8FA3B8" stroke-width="1.6"/><path d="M0 8 q-4 4 0 7 q4 -3 0 -7 Z" fill="#F5B324"/>';
  else if (id === 'nioi') s += '<path d="M-7 -5 q4 -3 8 0 M-7 0 q4 -3 8 0 M-7 5 q4 -3 8 0" fill="none" stroke="#8FA3B8" stroke-width="1.8" stroke-linecap="round"/>';
  else if (id === 'tetsu') s += '<rect x="-6" y="-8" width="12" height="3" rx="1" fill="#8FA3B8"/><path d="M0 -5 L2 6 L0 9 L-2 6 Z" fill="#9AA7B4"/>';
  else if (id === 'sekkai') s += '<path d="M0 -8 q6 7 6 11 a6,6 0 0 1 -12,0 q0 -4 6 -11 Z" fill="#EFEFF3" stroke="#8FA3B8" stroke-width="1.6"/>';
  else s += '<path d="M-8 -5 h11 l5 5 -5 5 h-11 Z" fill="#F5B324" stroke="#C9820A" stroke-width="1.6"/>';   /* なふだ */
  return s + '</g>';
}
function renderSuiri(){
  var st = curStage(), n = st.ekis.length, i;
  setBoardBox(600, SR.H);
  var s = '';
  /* ---- ミッション帯 ---- */
  var over = (cur.nProbe > st.target || cur.nCheck > 1);
  s += '<rect x="20" y="' + SR.top + '" width="560" height="34" rx="12" fill="' + (over ? '#FFF3E0' : '#FFF8E4') +
       '" stroke="' + (over ? '#E08A00' : '#F5B324') + '" stroke-width="2"/>';
  s += '<text x="36" y="' + (SR.top + 23) + '" font-size="13" font-weight="900" fill="#8A5B00">🎯 ' + n + '本の 正体を あてろ</text>';
  s += '<text x="564" y="' + (SR.top + 23) + '" font-size="13" font-weight="900" fill="' + (over ? '#E08A00' : '#8A5B00') +
       '" text-anchor="end">しらべた ' + cur.nProbe + '回　★' + st.target + '回まで／1発で 的中</text>';

  /* ---- びん ---- */
  for (i = 0; i < n; i++){
    var cx = suiX(i), mark = 'ABCDEF'.charAt(i);
    s += suiBottle(cx, SR.by, cur.slots[i], mark, cur.pick === i);
    /* 名ふだ */
    var lab = cur.labels[i];
    if (lab){
      s += '<rect x="' + (cx - 42) + '" y="165" width="84" height="24" rx="10" fill="#2E9A4C"/>';
      s += '<text x="' + cx + '" y="182" font-size="' + (suiEki(lab).name.length >= 6 ? 10 : 12) +
           '" font-weight="900" fill="#fff" text-anchor="middle">' + suiEki(lab).name + '</text>';
    } else {
      s += '<rect x="' + (cx - 42) + '" y="165" width="84" height="24" rx="10" fill="#F1F6F9" stroke="#C3D0DA" stroke-width="2" stroke-dasharray="5 4"/>';
      s += '<text x="' + cx + '" y="182" font-size="11" font-weight="900" fill="#A9B7C2" text-anchor="middle">なふだ？</text>';
    }
    /* しらべた メモ */
    var k = 0;
    SUI_TOOLS.forEach(function(tl){
      if (st.tools.indexOf(tl.id) < 0) return;
      var r = cur.probes[i][tl.id];
      if (!r) return;
      var my = SR.memo + k * SR.mline;
      s += '<g transform="translate(' + (cx - 36) + ',' + (my - 4) + ')">' + suiIcon(tl.id, 0.62) + '</g>';
      s += '<text x="' + (cx - 26) + '" y="' + my + '" font-size="10" font-weight="900" fill="' + r.c + '">' + r.t + '</text>';
      k++;
    });
    /* びん ぜんたいの あたり（メモの ところまで 押せる） */
    s += '<rect x="' + (cx - 44) + '" y="46" width="88" height="' + (SR.sep - 50) +
         '" fill="transparent" data-bin="' + i + '"/>';
  }

  /* まだ 何も しらべて いない ときは、ここに たまる ことを 見せて おく */
  if (cur.nProbe === 0)
    s += '<text x="300" y="' + (SR.memo + 24) + '" font-size="13" font-weight="900" fill="#C3D0DA" text-anchor="middle">' +
         'しらべた けっかは ここに たまるよ</text>';

  /* ---- 道具ばこ ---- */
  s += '<line x1="30" y1="' + SR.sep + '" x2="570" y2="' + SR.sep + '" stroke="#DCE5EB" stroke-width="3"/>';
  var btns = [{ id:null, name:'なふだを つける' }];
  SUI_TOOLS.forEach(function(tl){ if (st.tools.indexOf(tl.id) >= 0) btns.push(tl); });
  btns.forEach(function(b, bi){
    var col = bi % 3, row = (bi / 3) | 0;
    var bx = 108 + col * 192, by = (row === 0 ? SR.t1 : SR.t2);
    var on = (cur.tool === b.id);
    s += '<g transform="translate(' + bx + ',' + by + ')">';
    s += '<rect x="-90" y="-22" width="180" height="44" rx="14" fill="' + (on ? '#1B7FA8' : '#fff') +
         '" stroke="' + (on ? '#0E5B7C' : '#B9C6D1') + '" stroke-width="' + (on ? 4 : 3) + '"/>';
    s += '<g transform="translate(-66,0)">' + suiIcon(b.id || 'label', 1) + '</g>';
    s += '<text x="12" y="6" font-size="' + (b.name.length >= 8 ? 12 : 14) + '" font-weight="900" fill="' +
         (on ? '#fff' : '#3B5A70') + '" text-anchor="middle">' + b.name + '</text>';
    s += '<rect x="-90" y="-22" width="180" height="44" fill="transparent" data-tool="' + (b.id || '') + '"/>';
    s += '</g>';
  });

  /* ---- こたえあわせ ---- */
  var full = true;
  for (i = 0; i < n; i++) if (!cur.labels[i]) full = false;
  s += '<g transform="translate(300,' + SR.btn + ')">';
  s += '<rect x="-130" y="-23" width="260" height="46" rx="23" fill="' + (full ? '#2E9A4C' : '#DCE5EB') + '"/>';
  s += '<text x="0" y="8" font-size="18" font-weight="900" fill="' + (full ? '#fff' : '#A9B7C2') +
       '" text-anchor="middle">▶ こたえあわせ</text>';
  if (full) s += '<rect x="-130" y="-23" width="260" height="46" fill="transparent" data-judge="1"/>';
  s += '</g>';

  /* ---- なふだを えらぶ パネル ---- */
  if (cur.pick !== null){
    var rows = Math.ceil(n / 2), ph = 96 + rows * 56;
    var py = (SR.H - ph) / 2;
    s += '<rect x="0" y="0" width="600" height="' + SR.H + '" fill="#0F3350" opacity=".28" data-close="1"/>';
    s += '<rect x="40" y="' + py + '" width="520" height="' + ph + '" rx="20" fill="#fff" stroke="#B9C6D1" stroke-width="3"/>';
    s += '<text x="300" y="' + (py + 34) + '" font-size="17" font-weight="900" fill="#0F3350" text-anchor="middle">びん ' +
         'ABCDEF'.charAt(cur.pick) + ' の 正体は？</text>';
    st.ekis.forEach(function(id, ei){
      var col = ei % 2, row = (ei / 2) | 0;
      var bx = 175 + col * 250, by = py + 76 + row * 56;
      var used = cur.labels.indexOf(id);
      s += '<g transform="translate(' + bx + ',' + by + ')">';
      s += '<rect x="-115" y="-22" width="230" height="44" rx="14" fill="' + (used >= 0 ? '#EEF3F7' : '#fff') +
           '" stroke="#B9C6D1" stroke-width="3"/>';
      s += '<text x="0" y="6" font-size="15" font-weight="900" fill="' + (used >= 0 ? '#A9B7C2' : '#3B5A70') +
           '" text-anchor="middle">' + suiEki(id).name + (used >= 0 ? '（' + 'ABCDEF'.charAt(used) + 'に つけた）' : '') + '</text>';
      s += '<rect x="-115" y="-22" width="230" height="44" fill="transparent" data-name="' + id + '"/>';
      s += '</g>';
    });
    s += '<g transform="translate(300,' + (py + ph - 30) + ')">' +
         '<rect x="-90" y="-19" width="180" height="38" rx="19" fill="#F1F6F9" stroke="#B9C6D1" stroke-width="2"/>' +
         '<text x="0" y="6" font-size="14" font-weight="900" fill="#5A7C93" text-anchor="middle">なふだを はずす</text>' +
         '<rect x="-90" y="-19" width="180" height="38" fill="transparent" data-name=""/></g>';
  }
  document.getElementById('board').innerHTML = s;

  if (cur.msg) setStatus(cur.msg, cur.msgBad === true);
  else if (cur.pick !== null) setStatus('正体を えらぼう', false);
  else if (cur.tool) setStatus(suiTool(cur.tool).hint, false);
  else setStatus('道具を えらんで びんを タップ／なふだを つける ときは 左上の ボタン', false);
  tryClear(suiriOK());
}
function tapSuiri(e){
  var st = curStage();
  if (attrUp(e.target, 'data-close') !== null){ cur.pick = null; renderBoard(); return; }
  var nm = attrUp(e.target, 'data-name');
  if (nm !== null){
    if (cur.pick !== null){
      var old = cur.labels.indexOf(nm);
      if (nm && old >= 0) cur.labels[old] = null;      /* 名まえは 1つの びんにしか つかない */
      cur.labels[cur.pick] = nm || null;
      cur.pick = null; cur.msg = '';
    }
    renderBoard(); return;
  }
  var tl = attrUp(e.target, 'data-tool');
  if (tl !== null){ cur.tool = tl || null; cur.pick = null; cur.msg = ''; renderBoard(); return; }
  var jd = attrUp(e.target, 'data-judge');
  if (jd !== null){
    cur.nCheck++;
    var right = 0;
    for (var i = 0; i < cur.slots.length; i++) if (cur.labels[i] === cur.slots[i]) right++;
    if (right === cur.slots.length){
      cur.solved = true;
      cur.noStar = (cur.nProbe > st.target || cur.nCheck > 1);
      cur.msg = 'ぜんぶ 正かい！';
      cur.msgBad = false;
    } else {
      cur.msg = cur.slots.length + '本のうち ' + right + '本 あって いる。もういちど しらべて みよう';
      cur.msgBad = true;
    }
    renderBoard(); return;
  }
  var bi = attrUp(e.target, 'data-bin');
  if (bi !== null){
    bi = parseInt(bi, 10);
    if (!cur.tool){ cur.pick = bi; cur.msg = ''; renderBoard(); return; }
    var tool = suiTool(cur.tool), eki = suiEki(cur.slots[bi]);
    if (cur.probes[bi][tool.id]){
      cur.msg = 'びん ' + 'ABCDEF'.charAt(bi) + ' は もう ' + tool.name + 'で しらべたよ';
      cur.msgBad = false;
    } else {
      cur.probes[bi][tool.id] = tool.read(eki);
      cur.nProbe++;
      cur.msg = 'びん ' + 'ABCDEF'.charAt(bi) + '：' + tool.full(eki);
      cur.msgBad = false;
    }
    renderBoard(); return;
  }
  if (cur.pick !== null){ cur.pick = null; renderBoard(); }
}
ENGINES.suiri = { load:loadSuiri, render:renderSuiri, tap:tapSuiri };
