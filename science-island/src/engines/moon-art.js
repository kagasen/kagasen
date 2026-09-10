/* ================================================================== *
 * 月の え（ならべる型・むすぶ型で つかう）
 *
 * p = 0 新月 / 0.25 上げんの月（右半分）/ 0.5 満月 / 0.75 下げんの月（左半分）。
 * 光って いる ところは「まるい ふちの 半分」＋「明暗の さかいめ（だ円）」の
 * 2つの こで つくる。さかいめの よこ半径 a = r*cos(2πp) が ＋なら みぎに、
 * −なら ひだりに ふくらむ。これで 8こ ぜんぶ 正しい 形に なる。
 * ================================================================== */
function moonPath(p, r){
  var th = 2 * Math.PI * p;
  var a = r * Math.cos(th);
  var waxing = p < 0.5;                 /* みちていく あいだは みぎがわが 光る（日本から 見た とき） */
  var limb = waxing ? 1 : 0;
  var term = waxing ? (a >= 0 ? 0 : 1) : (a >= 0 ? 1 : 0);
  return 'M0,' + (-r) + ' A' + r + ',' + r + ' 0 0,' + limb + ' 0,' + r +
         ' A' + Math.abs(a).toFixed(2) + ',' + r + ' 0 0,' + term + ' 0,' + (-r) + ' Z';
}
function moonArt(p, r){
  return '<circle cx="0" cy="0" r="' + r + '" fill="#2F3F52"/>' +
         '<path d="' + moonPath(p, r) + '" fill="#FFF3C4"/>' +
         '<circle cx="0" cy="0" r="' + r + '" fill="none" stroke="#8FA3B8" stroke-width="2"/>';
}
/* びんの 中の ろうそく。mode = closed（ふたあり）／top（上だけ あき）／both（上も 下も あき）。
   字が 読めなくても「どこから 空気が 入るか」が 見て 分かるように、すきまと 矢じるしを かく。 */
function jarArt(mode, r){
  var k = r / 26, bot = (mode === 'both') ? 18 : 24;
  var lid = (mode === 'closed' || mode === 'empty' || mode === 'out');
  var s = '<g transform="scale(' + k.toFixed(3) + ')">';
  s += '<line x1="-30" y1="25" x2="30" y2="25" stroke="#C99A6B" stroke-width="4" stroke-linecap="round"/>';
  /* びん（ガラス） */
  s += '<path d="M-17 -24 V' + bot + ' H17 V-24" fill="#F2F9FC" stroke="#8FA3B8" stroke-width="3" stroke-linejoin="round"/>';
  if (lid) s += '<rect x="-21" y="-31" width="42" height="8" rx="3" fill="#8FA3B8"/>';
  else {
    s += '<path d="M-17 -24 h-5 M17 -24 h5" stroke="#8FA3B8" stroke-width="3" stroke-linecap="round"/>';
    s += '<path d="M0 -30 v-9 M0 -39 l-5 6 M0 -39 l5 6" stroke="#5FA8C7" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }
  if (mode === 'both'){
    /* 下の すきま（ねんどで 少し うかせて ある）と、入って くる 空気 */
    s += '<rect x="-17" y="18" width="7" height="7" fill="#C08A5E"/><rect x="10" y="18" width="7" height="7" fill="#C08A5E"/>';
    s += '<path d="M-32 21 h9 M-23 21 l-6 -4 M-23 21 l-6 4" stroke="#5FA8C7" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }
  /* ろうそくと ほのお（empty＝中み なし／out＝もえた あと。けむりだけ） */
  if (mode !== 'empty'){
    s += '<rect x="-4" y="2" width="8" height="' + (bot - 2) + '" fill="#FFF6DE" stroke="#D9C89A" stroke-width="2"/>';
    if (mode === 'out')
      s += '<path d="M0 0 q-6 -5 0 -9 q6 -4 0 -9" fill="none" stroke="#B9C6D1" stroke-width="2.5" stroke-linecap="round"/>';
    else
      s += '<path d="M0 -2 q-6 5 0 10 q6 -5 0 -10 Z" fill="#F5B324"/>';
  }
  return s + '</g>';
}

/* ものの重さ で つかう もの の え。r は 半分の 大きさの めやす */
var OBJ_ART = {};
function beakerArt(r, water, lvl){
  var k = r / 20;
  return '<g transform="scale(' + k.toFixed(3) + ')">' +
    '<path d="M-15 ' + lvl + ' V16 q0 5 5 5 h20 q5 0 5 -5 V' + lvl + ' Z" fill="' + water + '"/>' +
    '<path d="M-15 -20 V16 q0 5 5 5 h20 q5 0 5 -5 V-20" fill="none" stroke="#8FA3B8" stroke-width="3" stroke-linejoin="round"/>' +
    '<line x1="-15" y1="' + lvl + '" x2="15" y2="' + lvl + '" stroke="#9FB4C4" stroke-width="2"/></g>';
}
OBJ_ART.nendo = function(r){
  return '<circle cx="0" cy="0" r="' + r + '" fill="#B4715A" stroke="#8C543F" stroke-width="2.5"/>' +
         '<circle cx="' + (-r*0.3) + '" cy="' + (-r*0.25) + '" r="' + (r*0.16) + '" fill="#C98872"/>' +
         '<circle cx="' + (r*0.25) + '" cy="' + (r*0.2) + '" r="' + (r*0.13) + '" fill="#C98872"/>';
};
OBJ_ART.nendo2 = function(r){
  var s = '', p = [[-0.6,-0.3,0.34],[0.1,-0.55,0.28],[0.62,-0.1,0.3],[-0.25,0.35,0.32],[0.45,0.5,0.26],[-0.7,0.55,0.22]];
  p.forEach(function(q){
    s += '<circle cx="' + (q[0]*r).toFixed(1) + '" cy="' + (q[1]*r).toFixed(1) + '" r="' + (q[2]*r).toFixed(1) +
         '" fill="#B4715A" stroke="#8C543F" stroke-width="2"/>';
  });
  return s;
};
OBJ_ART.mizu     = function(r){ return beakerArt(r, '#BEDCEE', -4); };
OBJ_ART.satomizu = function(r){ return beakerArt(r, '#E4D9C4', -4); };
OBJ_ART.sato = function(r){
  var s = '<path d="M' + (-r) + ' ' + (r*0.7) + ' Q0 ' + (-r*0.55) + ' ' + r + ' ' + (r*0.7) +
          ' Z" fill="#FFFDF6" stroke="#D9C89A" stroke-width="2.5"/>';
  [[-0.35,0.3],[0.05,0.05],[0.35,0.35],[-0.05,0.45]].forEach(function(q){
    s += '<circle cx="' + (q[0]*r).toFixed(1) + '" cy="' + (q[1]*r).toFixed(1) + '" r="' + (r*0.1).toFixed(1) + '" fill="#E8DDC2"/>';
  });
  return s;
};
OBJ_ART.kori = function(r){
  return '<rect x="' + (-r*0.85) + '" y="' + (-r*0.85) + '" width="' + (r*1.7) + '" height="' + (r*1.7) +
         '" rx="' + (r*0.28) + '" fill="#BFE4F5" stroke="#5FA8C7" stroke-width="2.5"/>' +
         '<path d="M' + (-r*0.5) + ' ' + (r*0.3) + ' L' + (r*0.1) + ' ' + (-r*0.45) +
         '" stroke="#fff" stroke-width="' + (r*0.24) + '" stroke-linecap="round" opacity=".9"/>' +
         '<path d="M' + (r*0.1) + ' ' + (r*0.45) + ' L' + (r*0.5) + ' ' + (-r*0.05) +
         '" stroke="#fff" stroke-width="' + (r*0.16) + '" stroke-linecap="round" opacity=".75"/>';
};
/* メダカの たまごの 中の 変化（d = 0〜1 で そだちぐあい） */
OBJ_ART.tamago = function(r, d){
  d = (d === undefined) ? 0 : d;
  if (d > 1) d = d / 100;                             /* 'obj:tamago.35' の ように 百分率でも わたせる */
  var s = '<circle cx="0" cy="0" r="' + r + '" fill="#EAF7EE" stroke="#7FB6D6" stroke-width="2.5"/>';
  s += '<circle cx="0" cy="0" r="' + (r * 0.72) + '" fill="#FBF6D8" stroke="#D9C89A" stroke-width="1.5"/>';
  if (d < 0.3){
    [[-0.3,-0.2],[0.2,-0.3],[0.05,0.25],[-0.25,0.3]].forEach(function(q){
      s += '<circle cx="' + (q[0]*r).toFixed(1) + '" cy="' + (q[1]*r).toFixed(1) + '" r="' + (r*0.13).toFixed(1) + '" fill="#fff" stroke="#D9C89A" stroke-width="1"/>';
    });
  } else {
    var bend = (d - 0.3) * 1.4;
    s += '<path d="M' + (-r*0.45) + ' ' + (r*0.3) + ' q' + (r*0.5) + ' ' + (-r*0.9*bend - r*0.1) + ' ' + (r*0.9) + ' ' + (-r*0.1) +
         '" fill="none" stroke="#7A8794" stroke-width="' + (2 + d * 2).toFixed(1) + '" stroke-linecap="round"/>';
    s += '<circle cx="' + (r*0.42) + '" cy="' + (-r*0.14) + '" r="' + (r*0.16).toFixed(1) + '" fill="#2F3F52"/>';
    if (d >= 0.65) s += '<circle cx="' + (-r*0.1) + '" cy="' + (r*0.06) + '" r="' + (r*0.1).toFixed(1) + '" fill="#E05A4A"/>';
  }
  return s;
};
OBJ_ART.medaka = function(r){
  return '<path d="M' + (-r*0.9) + ' 0 q' + (r*0.5) + ' ' + (-r*0.5) + ' ' + (r*1.2) + ' 0 q' + (-r*0.7) + ' ' + (r*0.5) + ' ' + (-r*1.2) + ' 0 Z" fill="#B7C8D6" stroke="#5A7C93" stroke-width="2"/>' +
         '<path d="M' + (r*0.3) + ' 0 l' + (r*0.6) + ' ' + (-r*0.4) + ' v' + (r*0.8) + ' Z" fill="#DCE5EB" stroke="#5A7C93" stroke-width="2"/>' +
         '<circle cx="' + (-r*0.5) + '" cy="' + (-r*0.08) + '" r="' + (r*0.13).toFixed(1) + '" fill="#2F3F52"/>';
};
/* 地層の 1まい（つぶの 大きさで えが かわる） */
OBJ_ART.sou = function(r, kind){
  var col = { reki:'#C9A98A', suna:'#EBD9A8', doro:'#B9A88F', kazan:'#C8C2CE' }[kind] || '#DCE5EB';
  var s = '<rect x="' + (-r) + '" y="' + (-r*0.62) + '" width="' + (2*r) + '" height="' + (r*1.24) +
          '" rx="4" fill="' + col + '" stroke="#8C7355" stroke-width="2.5"/>';
  var n = { reki:5, suna:14, doro:0, kazan:20 }[kind];
  var rr = { reki:r*0.2, suna:r*0.08, doro:0, kazan:r*0.05 }[kind];
  for (var i = 0; i < n; i++){
    var a = (i * 2.39), rad = r * 0.72 * Math.sqrt((i + 0.5) / n);
    s += '<circle cx="' + (Math.cos(a) * rad).toFixed(1) + '" cy="' + (Math.sin(a) * rad * 0.55).toFixed(1) +
         '" r="' + rr.toFixed(1) + '" fill="#fff" opacity="' + (kind === 'kazan' ? 0.75 : 0.55) + '" stroke="#8C7355" stroke-width="1"/>';
  }
  if (kind === 'doro')
    for (i = 0; i < 3; i++)
      s += '<line x1="' + (-r*0.7) + '" y1="' + (-r*0.3 + i * r*0.3) + '" x2="' + (r*0.7) + '" y2="' + (-r*0.3 + i * r*0.3) +
           '" stroke="#8C7355" stroke-width="1.6" opacity=".5"/>';
  return s;
};
OBJ_ART.rousoku = function(r){
  return '<rect x="' + (-r*0.28) + '" y="' + (-r*0.35) + '" width="' + (r*0.56) + '" height="' + (r*1.2) +
         '" fill="#FFF6DE" stroke="#D9C89A" stroke-width="2.5"/>' +
         '<path d="M0 ' + (-r*0.45) + ' q' + (-r*0.34) + ' ' + (r*0.3) + ' 0 ' + (r*0.6) + ' q' + (r*0.34) + ' ' +
         (-r*0.3) + ' 0 ' + (-r*0.6) + ' Z" fill="#F5B324"/>';
};
/* 空の え。p＝雲（台風）の いち 0=西 1=東。「西から 東へ うつる」を 目で 見せる ためのもの */
function skyArt(p, kind, r){
  var x = (-0.62 + 1.24 * p) * r, s = '';
  s += '<rect x="' + (-r) + '" y="' + (-r*0.78) + '" width="' + (2*r) + '" height="' + (r*1.56) +
       '" rx="6" fill="#DCEEF8" stroke="#9FC3D6" stroke-width="2"/>';
  s += '<rect x="' + (-r) + '" y="' + (r*0.44) + '" width="' + (2*r) + '" height="' + (r*0.34) + '" fill="#9FD9A8"/>';
  s += '<text x="' + (-r*0.78) + '" y="' + (r*0.72) + '" font-size="' + (r*0.34).toFixed(0) + '" font-weight="900" fill="#5A7C93">西</text>';
  s += '<text x="' + (r*0.5) + '" y="' + (r*0.72) + '" font-size="' + (r*0.34).toFixed(0) + '" font-weight="900" fill="#5A7C93">東</text>';
  /* 見て いる ばしょ（まん中）。これが ないと 雲が どちらに いるのか 読みとりにくい */
  s += '<path d="M0 ' + (r*0.44) + ' l' + (-r*0.16) + ' ' + (-r*0.2) + ' h' + (r*0.32) + ' Z" fill="#E05A4A"/>';
  s += '<line x1="0" y1="' + (-r*0.78) + '" x2="0" y2="' + (r*0.44) + '" stroke="#B9C6D1" stroke-width="1.4" stroke-dasharray="3 3"/>';
  if (kind === 't'){
    s += '<g transform="translate(' + x.toFixed(1) + ',' + (-r*0.12) + ')">';
    for (var i = 0; i < 3; i++)
      s += '<path d="M0 0 q' + (r*0.34) + ' ' + (-r*0.28) + ' ' + (r*0.44) + ' ' + (r*0.06) +
           '" fill="none" stroke="#5A7C93" stroke-width="' + (r*0.11).toFixed(1) + '" stroke-linecap="round" transform="rotate(' + (i*120) + ')"/>';
    s += '<circle cx="0" cy="0" r="' + (r*0.09).toFixed(1) + '" fill="#E05A4A"/></g>';
  } else {
    s += '<g transform="translate(' + x.toFixed(1) + ',' + (-r*0.16) + ')">' +
         '<ellipse cx="0" cy="0" rx="' + (r*0.42) + '" ry="' + (r*0.26) + '" fill="#fff" stroke="#B9C6D1" stroke-width="1.8"/>' +
         '<ellipse cx="' + (-r*0.22) + '" cy="' + (r*0.06) + '" rx="' + (r*0.24) + '" ry="' + (r*0.18) + '" fill="#fff" stroke="#B9C6D1" stroke-width="1.8"/>' +
         '<ellipse cx="' + (r*0.24) + '" cy="' + (r*0.04) + '" rx="' + (r*0.2) + '" ry="' + (r*0.16) + '" fill="#fff" stroke="#B9C6D1" stroke-width="1.8"/></g>';
  }
  return s;
}
/* カードの え。あたらしい えを ふやすときは ここに 1行 足す */
function itemArt(art, r){
  if (!art) return '';
  if (art.indexOf('moon:') === 0) return moonArt(parseFloat(art.slice(5)), r);
  if (art.indexOf('jar:') === 0) return jarArt(art.slice(4), r);
  if (art.indexOf('obj:') === 0){
    var a2 = art.slice(4).split('.');                 /* obj:tamago.0.5 のように 数ちを わたせる */
    return OBJ_ART[a2[0]] ? OBJ_ART[a2[0]](r, a2.length > 1 ? (isNaN(parseFloat(a2[1])) ? a2[1] : parseFloat(a2[1])) : undefined) : '';
  }
  if (art.indexOf('sky:') === 0) return skyArt(parseFloat(art.slice(4).split(':')[0]), art.slice(4).split(':')[1], r);
  if (art.indexOf('emoji:') === 0)
    return '<text x="0" y="' + (r * 0.36) + '" font-size="' + Math.round(r * 1.5) +
           '" text-anchor="middle">' + art.slice(6) + '</text>';
  return '';
}
function shuffled(arr){
  var a = arr.slice(), i, j, t;
  for (i = a.length - 1; i > 0; i--){ j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
