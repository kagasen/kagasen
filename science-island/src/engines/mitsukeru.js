/* ================================================================== *
 * みつける型 — 図の 上の 正しい ところを タップ する
 *
 *   targets に「あたり」の まるを おいて、asks で 1つずつ 聞く。
 *   まちがえても せめない。タップした ところの 名まえを 教えて、もういちど。
 *   あたった ものは 図に 名まえが のこるので、すすむほど 図が 完成する。
 * ================================================================== */
function loadMitsukeru(st){
  cur.qi = 0; cur.found = []; cur.miss = null;
}
function mkTarget(id){
  var ts = curStage().targets;
  for (var i=0;i<ts.length;i++){ if (ts[i].id === id) return ts[i]; }
  return null;
}
/* --- 図の とうろく。st.art で えらぶ（書かなければ 'karada'）。
       あたらしい 単元を 足すときは ここに 1つ 足すだけ --- */
var ARTS = {};
var ART_MSG = { karada:'からだの 図を タップ してね', suiyoueki:'びんを タップ してね' };

/* --- 人のからだ の 図（前から 見た すがた。見る人の みぎが 本人の ひだり） --- */
function bodyArt(){
  var s = '';
  /* からだの りんかく */
  s += '<circle cx="300" cy="100" r="32" fill="#FFE0C4" stroke="#E0B48C" stroke-width="3"/>';
  s += '<rect x="287" y="126" width="26" height="24" fill="#FFE0C4" stroke="#E0B48C" stroke-width="3"/>';
  s += '<path d="M236 150 Q300 138 364 150 L376 336 Q376 396 300 400 Q224 396 224 336 Z" fill="#FFEFE1" stroke="#E0B48C" stroke-width="3"/>';
  /* 口 */
  s += '<ellipse cx="300" cy="116" rx="15" ry="8" fill="#E0555F" stroke="#B03A45" stroke-width="2"/>';
  /* 食道 → 胃 */
  s += '<path d="M300 124 L300 210 Q300 250 328 262" fill="none" stroke="#EFC6B2" stroke-width="11" stroke-linecap="round"/>';
  /* 肺（左右） */
  s += '<path d="M284 160 Q244 162 238 200 Q234 236 262 234 Q282 230 284 200 Z" fill="#F7A8B8" stroke="#D07A8C" stroke-width="3"/>';
  s += '<path d="M316 160 Q356 162 362 200 Q366 236 338 234 Q318 230 316 200 Z" fill="#F7A8B8" stroke="#D07A8C" stroke-width="3"/>';
  s += '<path d="M256 196 h20 M338 196 h20" stroke="#E8909F" stroke-width="3" stroke-linecap="round"/>';
  /* 心臓 */
  s += '<path d="M300 208 Q285 204 283 224 Q281 248 302 254 Q321 246 319 224 Q317 206 300 208 Z" fill="#E0555F" stroke="#B03A45" stroke-width="3"/>';
  /* かん臓（本人の みぎ ＝ 見る人の ひだり） */
  s += '<path d="M230 248 Q276 240 294 254 Q290 288 258 290 Q232 286 230 248 Z" fill="#B4715A" stroke="#8C543F" stroke-width="3"/>';
  /* 胃（本人の ひだり ＝ 見る人の みぎ） */
  s += '<path d="M326 252 Q364 246 370 276 Q374 302 346 302 Q322 300 320 280 Q319 260 326 252 Z" fill="#F0B562" stroke="#C98C36" stroke-width="3"/>';
  /* 大腸（小腸を かこむ） */
  s += '<path d="M246 372 L246 316 Q246 304 258 304 L342 304 Q354 304 354 316 L354 372" fill="none" stroke="#C99A6B" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>';
  /* 小腸（おりかえす かん） */
  s += '<path d="M274 322 h52 v14 h-52 v14 h52 v14 h-52" fill="none" stroke="#F3C98B" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>';
  return s;
}
ARTS.karada = bodyArt;

/* --- 花の つくり（たてに 切った ところ）。おしべ・めしべ・花びら・がく・子ぼう --- */
function hanaArt(){
  var s = '';
  s += '<path d="M300 412 V300" stroke="#2E9A4C" stroke-width="9" stroke-linecap="round"/>';
  s += '<path d="M300 366 q-40 -8 -58 -34 q34 -6 58 18 Z" fill="#4FC46A" stroke="#2E9A4C" stroke-width="2.5"/>';
  /* 花びら（4まい） */
  [[196,146,-28],[404,146,28]].forEach(function(q){
    s += '<g transform="translate(' + q[0] + ',' + q[1] + ') rotate(' + q[2] + ')">' +
         '<path d="M0 46 q-42 -18 -40 -52 q2 -30 40 -34 q38 4 40 34 q2 34 -40 52 Z" fill="#F7A8C4" stroke="#D07A9C" stroke-width="3"/></g>';
  });
  /* がく */
  s += '<path d="M300 302 q-40 -4 -74 16 q30 18 74 0 Z" fill="#4FC46A" stroke="#2E9A4C" stroke-width="3"/>';
  s += '<path d="M300 302 q40 -4 74 16 q-30 18 -74 0 Z" fill="#4FC46A" stroke="#2E9A4C" stroke-width="3"/>';
  /* 子ぼう（実に なる ところ） */
  s += '<ellipse cx="300" cy="288" rx="30" ry="26" fill="#B9E4C4" stroke="#2E9A4C" stroke-width="3"/>';
  [[-10,288],[0,294],[10,286]].forEach(function(q){
    s += '<circle cx="' + (300 + q[0]) + '" cy="' + q[1] + '" r="5" fill="#fff" stroke="#2E9A4C" stroke-width="1.6"/>';
  });
  /* おしべ（2本。先に 花ふん） */
  [[-1, 238, 204], [1, 362, 204]].forEach(function(q){
    s += '<path d="M300 274 Q' + (300 + q[0] * 52) + ' 250 ' + q[1] + ' ' + (q[2] + 10) +
         '" fill="none" stroke="#C9A227" stroke-width="4"/>';
    s += '<ellipse cx="' + q[1] + '" cy="' + q[2] + '" rx="15" ry="11" fill="#F5B324" stroke="#C9820A" stroke-width="2.5" transform="rotate(' +
         (q[0] * 24) + ' ' + q[1] + ' ' + q[2] + ')"/>';
    for (var i = 0; i < 4; i++)
      s += '<circle cx="' + (q[1] + q[0] * (8 + i * 5)) + '" cy="' + (q[2] - 16 - i * 4) + '" r="2.6" fill="#F5B324"/>';
  });
  /* めしべ（子ぼうから 上へ。先が ちゅうとう） */
  s += '<path d="M300 268 V196" stroke="#7FBF8E" stroke-width="6" stroke-linecap="round"/>';
  s += '<ellipse cx="300" cy="186" rx="17" ry="13" fill="#B9E4C4" stroke="#2E9A4C" stroke-width="3"/>';
  return s;
}
ARTS.hana = hanaArt;
ART_MSG.hana = '花の 図を タップ してね';

/* --- 川を 上から 見た 図（S字に 2回 まがる）。外がわ／内がわを 目で 見て 考える --- */
function kawaArt(){
  var d = 'M40 150 C140 150 140 90 240 90 C340 90 340 300 440 300 C500 300 530 330 560 344';
  var s = '';
  /* はいけいは しつもんバー（y=14〜60）を かくさない ように 下から */
  s += '<rect x="20" y="68" width="560" height="352" rx="14" fill="#EAF6EC"/>';
  /* 山（上流がわ）と 海（下流がわ） */
  s += '<path d="M26 114 L82 74 L138 114 Z" fill="#BFD9C4" stroke="#8FB89A" stroke-width="2"/>';
  s += '<text x="82" y="107" font-size="11" font-weight="900" fill="#4A6C58" text-anchor="middle">山</text>';
  s += '<path d="M580 420 L462 420 Q512 376 580 368 Z" fill="#BEDCEE" stroke="#7FB6D6" stroke-width="2"/>';
  s += '<text x="536" y="408" font-size="12" font-weight="900" fill="#3B5A70" text-anchor="middle">海</text>';
  /* 川 */
  s += '<path d="' + d + '" fill="none" stroke="#C9A98A" stroke-width="56" stroke-linecap="round"/>';
  s += '<path d="' + d + '" fill="none" stroke="#8FC9E8" stroke-width="44" stroke-linecap="round"/>';
  /* 流れる むき */
  [[150,118,18],[240,90,0],[340,196,72],[440,300,0],[520,318,32]].forEach(function(q){
    s += '<g transform="translate(' + q[0] + ',' + q[1] + ') rotate(' + q[2] + ')">' +
         '<path d="M-9 -7 L7 0 L-9 7 Z" fill="#fff" opacity=".85"/></g>';
  });
  s += '<text x="46" y="182" font-size="12" font-weight="900" fill="#5A7C93">水は こちらから ながれる</text>';
  return s;
}
ARTS.kawa = kawaArt;
ART_MSG.kawa = '川の 図を タップ してね';

/* --- グラフを 読む（ふりこの 長さ と 1おうふくの 時間） --- */
var GR_PTS = [[110,234,'25cm','1.0'],[247,194,'50cm','1.4'],[383,163,'75cm','1.7'],[520,137,'100cm','2.0']];
function graphArt(){
  var s = '', i;
  s += '<rect x="20" y="60" width="560" height="300" rx="14" fill="#F7FAFC" stroke="#DCE5EB" stroke-width="2"/>';
  /* じく */
  s += '<line x1="110" y1="330" x2="556" y2="330" stroke="#5A7C93" stroke-width="3"/>';
  s += '<line x1="110" y1="330" x2="110" y2="86" stroke="#5A7C93" stroke-width="3"/>';
  for (i = 1; i <= 4; i++){
    var gy = 330 - i * 48;
    s += '<line x1="110" y1="' + gy + '" x2="556" y2="' + gy + '" stroke="#E4EBF0" stroke-width="2"/>';
    s += '<text x="100" y="' + (gy + 5) + '" font-size="11" font-weight="900" fill="#8FA3B8" text-anchor="end">' + (i * 0.5).toFixed(1) + '</text>';
  }
  /* 点と 線 */
  var dd = '';
  GR_PTS.forEach(function(q, qi){
    dd += (qi ? ' L' : 'M') + q[0] + ' ' + q[1];
    s += '<text x="' + q[0] + '" y="352" font-size="12" font-weight="900" fill="#5A7C93" text-anchor="middle">' + q[2] + '</text>';
  });
  s += '<path d="' + dd + '" fill="none" stroke="#3EA7D8" stroke-width="4" stroke-linecap="round"/>';
  GR_PTS.forEach(function(q){
    s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="8" fill="#fff" stroke="#1B7FA8" stroke-width="4"/>';
    var vx = (q[0] > 480) ? q[0] - 26 : q[0] + 26;      /* たてじくの めもりと かさならない ように よこへ */
    s += '<text x="' + vx + '" y="' + (q[1] - 6) + '" font-size="11" font-weight="900" fill="#1B7FA8" text-anchor="middle">' + q[3] + '</text>';
  });
  /* しらべて いない ところ */
  s += '<rect x="536" y="170" width="60" height="60" rx="10" fill="#FFF3E0" stroke="#E08A00" stroke-width="2.5" stroke-dasharray="6 5"/>';
  s += '<text x="566" y="207" font-size="24" font-weight="900" fill="#E08A00" text-anchor="middle">？</text>';
  /* じくの 名まえ */
  s += '<rect x="238" y="374" width="156" height="26" rx="10" fill="#EAF3F8"/>';
  s += '<text x="316" y="392" font-size="13" font-weight="900" fill="#3B5A70" text-anchor="middle">ふりこの 長さ</text>';
  s += '<g transform="translate(48,208) rotate(-90)"><rect x="-78" y="-13" width="156" height="26" rx="10" fill="#EAF3F8"/>' +
       '<text x="0" y="5" font-size="13" font-weight="900" fill="#3B5A70" text-anchor="middle">1おうふくの 時間</text></g>';
  return s;
}
ARTS.graph = graphArt;
ART_MSG.graph = 'グラフの 上を タップ してね';

function renderMitsukeru(){
  var st = curStage(), ask = st.asks[cur.qi];
  setBoardBox(600, st.boardH || 476);
  var s = '';
  /* きいて いること */
  s += '<rect x="20" y="14" width="560" height="46" rx="14" fill="#EAF3F8" stroke="#9FC3D6" stroke-width="2"/>';
  s += '<text x="300" y="34" font-size="12" font-weight="900" fill="#5A7C93" text-anchor="middle">' +
       (cur.qi + 1) + ' / ' + st.asks.length + '　どこかな？</text>';
  /* SVGの <text> の 中では <b> は つかえない（そこで 文が 切れて しまう）ので タグを 取る */
  s += '<text x="300" y="53" font-size="15" font-weight="900" fill="#0F3350" text-anchor="middle">' +
       (ask ? ask.q.replace(/<[^>]+>/g, '') : '') + '</text>';
  s += (ARTS[st.art || 'karada'] || bodyArt)();

  /* みつけた ところに しるしを つける */
  cur.found.forEach(function(id){
    var tg = mkTarget(id), h = tg.hits[0];
    tg.hits.forEach(function(hh){
      s += '<circle cx="' + hh[0] + '" cy="' + hh[1] + '" r="' + (hh[2] - 4) +
           '" fill="none" stroke="#2E9A4C" stroke-width="3"/>';
    });
    if (tg.lx === undefined){
      /* 名まえが えの 中に ある 図（水よう液など）は ✓ だけ */
      s += '<g transform="translate(' + (h[0] + h[2] - 10) + ',' + (h[1] - h[2] + 10) + ')">' +
           '<circle cx="0" cy="0" r="14" fill="#2E9A4C"/>' +
           '<text x="0" y="6" font-size="16" font-weight="900" fill="#fff" text-anchor="middle">✓</text></g>';
      return;
    }
    var right = tg.lx > 300;
    s += '<line x1="' + tg.lx + '" y1="' + tg.ly + '" x2="' + h[0] + '" y2="' + h[1] +
         '" stroke="#2E9A4C" stroke-width="2.5" stroke-dasharray="4 4"/>';
    var w = tg.label.length * 15 + 30;
    s += '<g transform="translate(' + tg.lx + ',' + tg.ly + ')">' +
         '<rect x="' + (right ? 0 : -w) + '" y="-15" width="' + w + '" height="30" rx="12" fill="#2E9A4C"/>' +
         '<text x="' + (right ? w/2 : -w/2) + '" y="6" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">✓ ' +
         tg.label + '</text></g>';
  });
  /* あたり（見えない） */
  st.targets.forEach(function(tg){
    if (cur.found.indexOf(tg.id) >= 0) return;
    tg.hits.forEach(function(hh){
      s += '<circle cx="' + hh[0] + '" cy="' + hh[1] + '" r="' + hh[2] +
           '" fill="transparent" data-find="' + tg.id + '"/>';
    });
  });
  document.getElementById('board').innerHTML = s;

  if (cur.miss) setStatus('それは「' + cur.miss + '」だね。もういちど さがして みよう！', false);
  else setStatus(ART_MSG[st.art || 'karada'] || 'えの 上を タップ してね', false);
  tryClear(cur.qi >= st.asks.length);
}
function tapMitsukeru(e){
  var id = attrUp(e.target, 'data-find');
  if (id === null) return;
  var st = curStage(), ask = st.asks[cur.qi];
  if (!ask) return;
  if (id === ask.t){
    cur.found.push(id); cur.qi++; cur.miss = null;
  } else {
    var tg = mkTarget(id);
    cur.miss = tg ? tg.label : '';
  }
  renderBoard();
}
ENGINES.mitsukeru = { load:loadMitsukeru, render:renderMitsukeru, tap:tapMitsukeru };
