/* ------------------------------------------------------------------ *
 * 7. クリアの しょり と ごほうび
 * ------------------------------------------------------------------ */
function cardSVG(g, gold){
  var base = gold ? '#F5B324' : '#8FBFD8';
  var bg   = gold ? '#FFF6DE' : '#EFF7FB';
  return '<svg class="card-get" viewBox="0 0 150 200">' +
    '<rect x="4" y="4" width="142" height="192" rx="16" fill="' + bg + '" stroke="' + base + '" stroke-width="5"/>' +
    '<rect x="14" y="14" width="122" height="120" rx="10" fill="#fff" stroke="' + base + '" stroke-width="2"/>' +
    '<text x="75" y="96" font-size="62" text-anchor="middle">' + g.icon + '</text>' +
    '<text x="75" y="158" font-size="15" font-weight="900" fill="#0F3350" text-anchor="middle">' + g.card + '</text>' +
    '<text x="75" y="180" font-size="12" font-weight="900" fill="' + (gold ? '#8A5B00' : '#4A6C85') +
    '" text-anchor="middle">' + (gold ? '★ きんカード ★' : 'かがくカード') + '</text>' +
    '</svg>';
}

function onClear(){
  var g = gameById(cur.gameId), st = g.stages[cur.si], key = stageKey(g.id, cur.si);
  var old = save.stages[key];
  /* ★は「できた！」の おびが 出た しゅんかんに きめて ある（20-shell.js の showClearBar）。
     おびを 見て いる あいだに ヒントを ひらいても 下がらない。 */
  var perfect = (cur.gotStar === 0 || cur.gotStar === 1) ? cur.gotStar
              : ((cur.hint || cur.noStar) ? 0 : 1);
  if (old && old.p) perfect = 1;                    /* 一度とった パーフェクトは 下げない（§6 単調増加） */
  save.stages[key] = { c:1, p:perfect };
  var justFinished = gameDone(g.id) && !save.cards[g.id];
  if (gameDone(g.id)) save.cards[g.id] = gameGold(g.id) ? 2 : 1;
  store();
  renderStrip();

  document.getElementById('modal-jhs').innerHTML =
    g.jhs ? '<div class="jhs-note">🎓 中学でも つかうよ</div>' : '';
  document.getElementById('modal-title').textContent = perfect ? 'パーフェクト！' : 'クリア！';
  document.getElementById('modal-card').innerHTML = justFinished ? cardSVG(g, gameGold(g.id)) : '';
  document.getElementById('modal-learn').innerHTML =
    (justFinished ? '<b>「' + g.card + '」カード</b>を てにいれた！<br>' : '') + st.learn;
  var last = (cur.si >= g.stages.length - 1);
  /* ゲームが 1つだけの アプリには もどる 島が ない ので「とじる」に する */
  document.getElementById('modal-next').textContent =
    last ? (HOME_GAME ? 'とじる ▼' : '島に もどる ▶') : 'つぎへ ▶';
  document.getElementById('modal').className = 'modal on';
  confettiBurst(perfect ? 120 : 70);
}
document.getElementById('modal-again').onclick = function(){ closeModal(); loadStage(); };
document.getElementById('modal-next').onclick = function(){
  closeModal();
  var g = gameById(cur.gameId);
  if (cur.si >= g.stages.length - 1){
    if (HOME_GAME){ renderStrip(); return; }   /* 1ゲームの アプリ：もんだい えらびに もどるだけ */
    openIsland(g.island); return;
  }
  cur.si++; cur.hint = false; loadStage();
};

/* じぶんで かく コンフェッティ（外部ライブラリは つかわない） */
function confettiBurst(n){
  var cv = document.getElementById('confetti');
  var ctx = cv.getContext('2d');
  var W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
  cv.style.display = 'block';
  var cols = ['#F5B324','#4FC46A','#3EA7D8','#E8618C','#8B7BE8','#FF8A5B'];
  var ps = [];
  for (var i=0;i<n;i++){
    ps.push({ x:W/2 + (Math.random()-.5)*W*.5, y:H*.42,
      vx:(Math.random()-.5)*13, vy:-8 - Math.random()*11,
      w:6 + Math.random()*8, h:8 + Math.random()*10,
      r:Math.random()*6.28, vr:(Math.random()-.5)*.32,
      c:cols[(Math.random()*cols.length)|0], life:0 });
  }
  setTimeout(function(){ ctx.clearRect(0,0,W,H); cv.style.display = 'none'; }, 6500);  /* rAFが とまっても のこらないように */
  var t0 = 0;
  function tick(){
    ctx.clearRect(0,0,W,H);
    var alive = 0;
    ps.forEach(function(p){
      p.vy += .42; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
      if (p.y < H + 40){ alive++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
      }
    });
    t0++;
    if (alive && t0 < 260) requestAnimationFrame(tick);
    else { ctx.clearRect(0,0,W,H); cv.style.display = 'none'; }
  }
  requestAnimationFrame(tick);
}
