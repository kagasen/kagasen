/* ================================================================== *
 * つりあい型・上皿てんびん モード（ものの重さ＝しつりょうほぞん）
 *
 *   みぎの 皿に「すがたが かわった あとの もの」、ひだりの 皿に 分銅を のせて つり合わせる。
 *   **こたえの グラム数は データに 書いて いない。** かわる 前の ものの 重さを
 *   その場で たして 出して いるので、「すがたが かわっても 合計は 同じ」という
 *   きまりが そのまま 判定に なる。分銅の 組み合わせは どれでも 通る。
 * ================================================================== */
/* 分銅は 7こまで。これ いじょう ふやすと スマホ幅で 指で 押しにくく なる
   （ばんは 画面幅に あわせて ちぢむ ので、てもとの 間かくが そのまま 指の 大きさに なる）。 */
var TB = { fx:300, by:190, arm:150, rope:74, fundo:[50,50,20,20,10,10,5], gap:72, max:6 };
function tbMass(){ var m = 0; curStage().before.forEach(function(b){ m += b.g; }); return m; }
function tbSum(){ var s = 0; cur.placed.forEach(function(i){ s += TB.fundo[i]; }); return s; }
function loadTenbin(st){ cur.placed = []; cur.sel = null; }
function tenbinOK(){ return cur.placed.length > 0 && tbSum() === tbMass(); }

/* 分銅 1こ の え */
function tbFundo(g, on){
  var w = (g >= 20) ? 34 : 28, h = 17;
  return '<rect x="' + (-w/2) + '" y="' + (-h/2) + '" width="' + w + '" height="' + h + '" rx="4" fill="' +
         (on ? '#8FA8BC' : '#B7C8D6') + '" stroke="#5A7C93" stroke-width="2"/>' +
         '<rect x="' + (-w/2 + 4) + '" y="' + (-h/2 + 3) + '" width="' + (w - 8) + '" height="3" rx="1.5" fill="#DCE5EB"/>' +
         '<text x="0" y="5" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">' + g + 'g</text>';
}
/* 皿（かたむいても まっすぐ ぶら下がる） */
function tbPlate(sign, ang, inner, label){
  var x = TB.fx + sign * TB.arm;
  var s = '<g transform="translate(' + x + ',' + TB.by + ') rotate(' + (-ang).toFixed(2) + ')">';
  s += '<line x1="0" y1="0" x2="0" y2="' + TB.rope + '" stroke="#8A6A1E" stroke-width="3"/>';
  s += '<path d="M-48 ' + TB.rope + ' L48 ' + TB.rope + ' L36 ' + (TB.rope + 15) + ' L-36 ' + (TB.rope + 15) +
       ' Z" fill="#D8B15C" stroke="#A9812A" stroke-width="3" stroke-linejoin="round"/>';
  s += inner;
  s += '<g transform="translate(0,' + (TB.rope + 36) + ')"><rect x="-42" y="-14" width="84" height="27" rx="13" fill="#EAF3F8"/>' +
       '<text x="0" y="6" font-size="15" font-weight="900" fill="#0F3350" text-anchor="middle">' + label + '</text></g>';
  return s + '</g>';
}
function renderTenbin(){
  setBoardBox(600, 430);      /* かたむいた ときに 皿の 数字が てもとの 線に かぶらない 高さ */
  var st = curStage(), mass = tbMass(), sum = tbSum();
  var net = mass - sum;                                   /* ＋なら みぎ（もの）が おもい */
  var ang = 11 * net / (Math.abs(net) + 8);               /* 少しの ちがいでも かたむきが 見える */
  var s = '', i;

  /* ---- どんな へんかを させたか（上の おびら） ---- */
  s += '<rect x="20" y="12" width="560" height="82" rx="14" fill="#F5F9FB" stroke="#DCE5EB" stroke-width="2"/>';
  var n = st.before.length;
  st.before.forEach(function(b, bi){
    var bx = 140 + (bi - (n - 1) / 2) * 104;
    s += '<g transform="translate(' + bx + ',48)">' + itemArt(b.art, 19) + '</g>';
    s += '<text x="' + bx + '" y="84" font-size="12" font-weight="900" fill="#3B5A70" text-anchor="middle">' +
         b.label + ' ' + b.g + 'g</text>';
    if (bi < n - 1)
      s += '<text x="' + (bx + 52) + '" y="55" font-size="20" font-weight="900" fill="#8FA3B8" text-anchor="middle">＋</text>';
  });
  s += '<text x="300" y="52" font-size="24" font-weight="900" fill="#E08A00" text-anchor="middle">➡</text>';
  s += '<text x="300" y="76" font-size="11" font-weight="900" fill="#C9820A" text-anchor="middle">' + st.change + '</text>';
  s += '<g transform="translate(460,48)">' + itemArt(st.after.art, 19) + '</g>';
  s += '<text x="460" y="84" font-size="12" font-weight="900" fill="#3B5A70" text-anchor="middle">' +
       st.after.label + ' <tspan fill="#E08A00">？g</tspan></text>';

  /* ---- てんびんの だい ---- */
  s += '<rect x="' + (TB.fx - 5) + '" y="' + TB.by + '" width="10" height="112" fill="#B08420"/>';
  s += '<path d="M' + (TB.fx - 60) + ' 314 L' + (TB.fx - 40) + ' 300 L' + (TB.fx + 40) + ' 300 L' +
       (TB.fx + 60) + ' 314 Z" fill="#8A6A1E"/>';

  /* ---- うで（かたむく） ---- */
  s += '<g transform="rotate(' + ang.toFixed(2) + ' ' + TB.fx + ' ' + TB.by + ')">';
  s += '<rect x="' + (TB.fx - TB.arm - 12) + '" y="' + (TB.by - 7) + '" width="' + (TB.arm * 2 + 24) +
       '" height="14" rx="7" fill="#D8B15C" stroke="#A9812A" stroke-width="3"/>';
  s += '<circle cx="' + TB.fx + '" cy="' + TB.by + '" r="9" fill="#B08420" stroke="#8A6A1E" stroke-width="3"/>';

  /* ひだりの 皿：のせた 分銅 */
  var inner = '';
  cur.placed.forEach(function(fi, k){
    var col = k % 3, row = (k / 3) | 0;
    var inRow = Math.min(3, cur.placed.length - row * 3);          /* その だんの こ数で まん中よせ */
    inner += '<g transform="translate(' + ((col - (inRow - 1) / 2) * 30) + ',' + (TB.rope - 9 - row * 19) + ')">' +
             tbFundo(TB.fundo[fi], true) +
             '<rect x="-19" y="-13" width="38" height="26" fill="transparent" data-off="' + fi + '"/></g>';
  });
  s += tbPlate(-1, ang, inner, sum + ' g');

  /* みぎの 皿：かわった あとの もの */
  var right = '<g transform="translate(0,' + (TB.rope - 34) + ')">' +
    '<rect x="-46" y="-26" width="92" height="52" rx="12" fill="#fff" stroke="#B9C6D1" stroke-width="3"/>' +
    '<g transform="translate(-26,0)">' + itemArt(st.after.art, 17) + '</g>' +
    '<text x="18" y="7" font-size="20" font-weight="900" fill="#E08A00" text-anchor="middle">？</text></g>';
  s += tbPlate(1, ang, right, '？ g');
  s += '</g>';

  /* ---- てもとの 分銅 ---- */
  s += '<line x1="40" y1="352" x2="560" y2="352" stroke="#DCE5EB" stroke-width="3"/>';
  s += '<text x="300" y="372" font-size="13" font-weight="900" fill="#8FA3B8" text-anchor="middle">' +
       'てもとの 分銅（タップで のせる／のせた 分銅を タップで もどす）</text>';
  var rest = [];
  for (i = 0; i < TB.fundo.length; i++) if (cur.placed.indexOf(i) < 0) rest.push(i);
  rest.forEach(function(fi, k){
    var x = 300 + (k - (rest.length - 1) / 2) * TB.gap;
    s += '<g transform="translate(' + x + ',400)">' + tbFundo(TB.fundo[fi], false) +
         '<rect x="' + (-TB.gap/2 + 2) + '" y="-21" width="' + (TB.gap - 4) +
         '" height="42" fill="transparent" data-put="' + fi + '"/></g>';
  });
  document.getElementById('board').innerHTML = s;

  var ok = tenbinOK();
  /* あと 何g かは 教えない。ほんものの てんびんと 同じで「どちらが 下がったか」だけ 見せる。
     数を 教えて しまうと、たしざんを 考えずに その ぶんだけ のせて おわって しまう。 */
  if (!cur.placed.length) setStatus('分銅を のせて、右の ものと つり合わせよう', false);
  else if (net > 0) setStatus('みぎが 下がって いる ―― 分銅が 足りないよ', false);
  else if (net < 0) setStatus('ひだりが 下がって いる ―― 分銅が おもすぎるよ', false);
  else setStatus('', false);
  tryClear(ok);
}
function tapTenbin(e){
  var off = attrUp(e.target, 'data-off');
  if (off !== null){
    var oi = cur.placed.indexOf(parseInt(off, 10));
    if (oi >= 0) cur.placed.splice(oi, 1);
    renderBoard(); return;
  }
  var put = attrUp(e.target, 'data-put');
  if (put !== null){
    if (cur.placed.length < TB.max) cur.placed.push(parseInt(put, 10));
    renderBoard(); return;
  }
}
ENGINES.tenbin = { load:loadTenbin, render:renderTenbin, tap:tapTenbin };
