/* ------------------------------------------------------------------ *
 * 8. がめん：ホーム（地図）と 島
 * ------------------------------------------------------------------ */
function islandArt(isl, state){
  var s = '<svg class="isl-art" viewBox="0 0 200 156">' +
    '<ellipse cx="100" cy="132" rx="84" ry="16" fill="rgba(4,50,72,.28)"/>' +
    '<path d="M12 122 Q24 92 58 86 Q78 50 112 56 Q152 60 166 96 Q188 102 188 122 Z" fill="' + isl.sand + '"/>' +
    '<path d="M40 100 Q70 58 106 62 Q146 66 160 100 Z" fill="' + isl.color + '"/>' +
    '<text x="100" y="102" font-size="46" text-anchor="middle">' + (state === 'lock' ? '🔒' : isl.emoji) + '</text>';
  if (state === 'done') s += '<text x="158" y="112" font-size="30" text-anchor="middle">🏁</text>';
  return s + '</svg>';
}
function renderHome(){
  /* 島が 1つだけの アプリには 海の 地図が ない（ビルドが とりのぞく）。
     その ときは 何も しない。 */
  if (!document.getElementById('map-inner')) return;
  var open = methodOpen(), h = '', total = 0, got = 0;
  GAMES.forEach(function(g){
    if (g.soon || !g.stages) return;
    total += g.stages.length;
    got += clearedCount(g.id);
  });
  ISLANDS.forEach(function(isl){
    var lock = isl.needAll && !open;
    var list = playableOf(isl.id);
    var state = lock ? 'lock' : (list.length && islandDone(isl.id) ? 'done' : 'go');
    var n = 0, all = 0;
    list.forEach(function(g){ all += g.stages.length; n += clearedCount(g.id); });
    var label = lock ? '4つの島 クリアで ひらく'
              : (all ? n + ' / ' + all + ' もん' : 'じゅんびちゅう');
    h += '<button class="island' + (lock ? ' locked' : '') + '" style="--x:' + isl.mx + '%; --y:' + isl.my +
         '%; --nx:' + isl.nx + '%; --ny:' + isl.ny + '%" data-isl="' + isl.id + '">' + islandArt(isl, state) +
         '<span class="isl-name">' + isl.emoji + ' ' + isl.name + '</span>' +
         '<span class="isl-count">' + label + '</span></button>';
  });
  document.getElementById('map-inner').innerHTML = h;
  document.getElementById('home-prog').style.width = (total ? (got / total * 100) : 0) + '%';
  document.getElementById('home-note').textContent = 'クリアした もんだい　' + got + ' / ' + total;
}
if (document.getElementById('map-inner')) document.getElementById('map-inner').addEventListener('click', function(e){
  var id = attrUp(e.target, 'data-isl');
  if (!id) return;
  var isl = islandById(id);
  if (isl.needAll && !methodOpen()){
    alert('🔬 かんがえかたの島は、ほかの 4つの島を ぜんぶ クリアすると ひらくよ！');
    return;
  }
  openIsland(id);
});

function openIsland(id){
  /* ゲームが 1つだけの アプリ（でんき回路 など）には 島の がめんが ない。
     「島に もどる」で 行ける ところが ない ので、ゲームの がめんに とどまる。
     こうしないと まっ白な がめんに おちる（クリア後・リサイクル工場・ふりこ が
     openIsland を よぶ）。 */
  if (HOME_GAME){ go('game'); return; }
  /* 島が 1つだけの アプリには 島の がめんが 1まいしか ない（地図を とりのぞいて いる）。
     🔬かんがえかたの島の ゲームも その 1まいの 下に ならべて いる ので、
     どこから よばれても じぶんの 島の がめんを 出す。
     こうしないと 🔬の ゲームを おえた とき「🔬かんがえかたの島」だけの がめんに
     おりてしまい、もどるボタンが ない ので **そこから 出られなく なる**。 */
  if (HOME_ISLAND) id = HOME_ISLAND;
  var isl = islandById(id);
  document.getElementById('isl-bar-title').textContent = isl.emoji + ' ' + isl.name;
  var hero = document.getElementById('isl-hero');
  hero.style.background = 'linear-gradient(180deg,' + isl.color + ' 0%, ' + isl.color + 'CC 100%)';
  hero.innerHTML = '<div class="emoji">' + isl.emoji + '</div><h2>' + isl.name + '</h2><p>' + isl.desc + '</p>';
  var h = '';
  gamesOf(id).forEach(function(g){
    var n = g.stages ? clearedCount(g.id) : 0;
    var all = g.stages ? g.stages.length : 0;
    var pct = all ? (n / all * 100) : 0;
    var card = save.cards[g.id];
    h += '<button class="game-card' + (g.soon ? ' soon' : '') + '" data-g="' + g.id + '">' +
      '<span class="gc-ico" style="background:' + isl.color + '22">' + g.icon + '</span>' +
      '<span class="gc-body">' +
        '<span class="gc-name">' + g.name +
          (card ? (card === 2 ? ' <span class="tag jhs">★きんカード</span>' : ' <span class="tag grade">カード</span>') : '') +
          '<span class="tag grade">' + g.grade + '</span>' +
          (g.jhs ? '<span class="tag jhs">🎓中学でも</span>' : '') +
          (g.soon ? '<span class="tag soon">じゅんびちゅう</span>' : '') +
        '</span>' +
        '<span class="gc-sub">' + g.sub + (all ? '　' + n + '/' + all : '') + '</span>' +
        (all ? '<span class="gc-meter"><i style="width:' + pct + '%"></i></span>' : '') +
      '</span></button>';
  });
  /* 地図の ない アプリ（島が 1つだけ）では、🔬かんがえかたの島の 行き場が なくなる。
     じぶんの 島の ゲームの 下に つづけて 出す。ひらく までは 「あと なに が いるか」を 見せる。 */
  if (HOME_ISLAND && id === HOME_ISLAND) h += methodSection();
  document.getElementById('game-list').innerHTML = h;
  go('island');
}
/* まだ クリアして いない いちばん さいしょの もんだいの ばんごう */
function firstTodo(g){
  var si = 0;
  for (var i=0;i<g.stages.length;i++){ if (!stageRec(g.id, i)){ si = i; break; } si = i; }
  return si;
}
/* ゲームが 1つだけの アプリには この 一覧が ない（ビルドが がめんごと とりのぞく）。 */
if (document.getElementById('game-list')) document.getElementById('game-list').addEventListener('click', function(e){
  var id = attrUp(e.target, 'data-g');
  if (!id) return;
  var g = gameById(id);
  if (g.soon){ alert('この ミニゲームは じゅんびちゅう。もうすこし まってね！'); return; }
  startGame(id, firstTodo(g));
});

/* 🔬かんがえかたの島の ぶぶん（地図の ない アプリだけで つかう）。
   ひらいて いれば ゲームを ならべ、まだなら 何を すれば ひらくかを 出す。 */
function methodSection(){
  var isl = islandById('method');
  if (!isl) return '';
  if (!methodOpen()){
    return '<div class="method-lock">' +
      '<span class="ml-ico">🔒</span>' +
      '<b>' + isl.emoji + ' ' + isl.name + '</b>' +
      '<span>⚡🧪🌱🌏 <b>4つの島 ぜんぶ</b>を クリアすると ひらくよ。' +
      'ほかの島は 🏠アプリ集から いけるよ。</span></div>';
  }
  var h = '<div class="method-head">' + isl.emoji + ' ' + isl.name + '　<span>' + isl.desc + '</span></div>';
  gamesOf('method').forEach(function(g){
    var n = clearedCount(g.id), all = g.stages ? g.stages.length : 0;
    var card = save.cards[g.id];
    h += '<button class="game-card" data-g="' + g.id + '">' +
      '<span class="gc-ico" style="background:' + isl.color + '22">' + g.icon + '</span>' +
      '<span class="gc-body">' +
        '<span class="gc-name">' + g.name +
          (card ? (card === 2 ? ' <span class="tag jhs">★きんカード</span>' : ' <span class="tag grade">カードGET</span>') : '') +
          '<span class="tag grade">' + g.grade + '</span>' +
          (g.jhs ? '<span class="tag jhs">🎓中学でも</span>' : '') +
        '</span>' +
        '<span class="gc-sub">' + g.sub + (all ? '　' + n + '/' + all : '') + '</span>' +
        (all ? '<span class="gc-meter"><i style="width:' + (all ? (n / all * 100) : 0) + '%"></i></span>' : '') +
      '</span></button>';
  });
  return h;
}
