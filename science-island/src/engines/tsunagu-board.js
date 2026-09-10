/* ------------------------------------------------------------------ *
 * 5. つなぐ型エンジン：ばんめんの え と そうさ
 * ------------------------------------------------------------------ */
var GX = function(gx){ return 80 + gx * 115; };
var GY = function(gy){ return 90 + gy * 105; };
var TERMS = {
  battery:{ p:{dx: 44, dy:0},  m:{dx:-44, dy:0} },
  lamp:   { a:{dx:-44, dy:14}, b:{dx: 44, dy:14} },
  motor:  { a:{dx:-44, dy:0},  b:{dx: 44, dy:0} },
  galv:   { a:{dx:-44, dy:0},  b:{dx: 44, dy:0} },
  'switch':{ a:{dx:-44, dy:0}, b:{dx: 44, dy:0} }
};
function termPos(part, key){
  var t = TERMS[part.type][key];
  return { x: GX(part.gx) + t.dx, y: GY(part.gy) + t.dy };
}
function termList(parts){
  var out = [];
  parts.forEach(function(p){
    Object.keys(TERMS[p.type]).forEach(function(k){
      var pos = termPos(p, k);
      out.push({ id: p.id + ':' + k, x: pos.x, y: pos.y });
    });
  });
  return out;
}
function findTerm(parts, id){
  var a = id.split(':'), p = null;
  for (var i=0;i<parts.length;i++){ if (parts[i].id === a[0]) p = parts[i]; }
  if (!p) return null;
  var pos = termPos(p, a[1]);
  return { id:id, x:pos.x, y:pos.y };
}

/* ゆるく ふくらませた せん。ばんの まん中から そとがわへ そらせるので、
   おなじ ぶひんの 2つの はしを つないでも かくれずに 見える。 */
function wireD(a, b){
  var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  var dx = b.x - a.x, dy = b.y - a.y;
  var len = Math.sqrt(dx*dx + dy*dy) || 1;
  var nx = -dy / len, ny = dx / len;
  var away = ((mx - 300) * nx + (my - 190) * ny) >= 0 ? 1 : -1;
  /* おなじ ぶひんの 2つの はしを つないだ せん（＝ショート）は、ぶひんの 下に
     かくれて 見えなく なるので、大きく ふくらませて かならず 見えるように する。 */
  var samePart = a.id && b.id && a.id.split(':')[0] === b.id.split(':')[0];
  var bow = (samePart ? 62 : Math.min(26, len * 0.16)) * away;
  return 'M' + a.x + ' ' + a.y + ' Q' + (mx + nx*bow*2) + ' ' + (my + ny*bow*2) + ' ' + b.x + ' ' + b.y;
}

/* ぶひんの 名ふだ。せんの 上に えがかれるので、白い ふだを しいて どこに せんが
   通っても 読めるように する。はばは 文字の 数から 見つもる（半角=0.58・全角=1.0）。 */
function svgLabel(y, text, color){
  var w = 0;
  for (var i=0;i<text.length;i++) w += (text.charCodeAt(i) < 0x100 ? 0.58 : 1);
  var W = w * 13 + 12;
  return '<rect x="' + (-W/2).toFixed(1) + '" y="' + (y - 13) + '" width="' + W.toFixed(1) +
         '" height="17" rx="6" fill="#fff" opacity=".86"/>' +
         '<text x="0" y="' + y + '" font-size="13" font-weight="900" fill="' + color +
         '" text-anchor="middle">' + text + '</text>';
}

function svgBattery(p, showName){
  var x = GX(p.gx), y = GY(p.gy);
  return '<g transform="translate(' + x + ',' + y + ')">' +
    '<rect x="-36" y="-24" width="72" height="48" rx="10" fill="#F4C34E" stroke="#A9812A" stroke-width="3"/>' +
    '<rect x="-36" y="-24" width="26" height="48" rx="10" fill="#E0A93A" stroke="none"/>' +
    '<rect x="-13" y="-24" width="4" height="48" fill="#A9812A" opacity=".5"/>' +
    '<rect x="36" y="-11" width="10" height="22" rx="3" fill="#C9A227" stroke="#A9812A" stroke-width="2"/>' +
    '<text x="20" y="8" font-size="24" font-weight="900" fill="#7A5200" text-anchor="middle">＋</text>' +
    '<text x="-23" y="8" font-size="24" font-weight="900" fill="#fff" text-anchor="middle">−</text>' +
    (showName ? svgLabel(42, 'かんでんち', '#7A5200') : '') +
    '</g>';
}
/* 明るさ 5だんかいの 見た目。ray は とびだす 光の せんの ながさ（0 なら 出さない）。 */
var GLOW = {
  faint:  { glass:'#FBFAEC', o:.14, k:.62, ray:0  },
  dim:    { glass:'#FFF2BE', o:.28, k:.82, ray:0  },
  full:   { glass:'#FFE066', o:.55, k:1,   ray:14 },
  bright: { glass:'#FFF6A0', o:.80, k:1.3, ray:24 }
};
function svgLamp(p, cat, showName){
  var x = GX(p.gx), y = GY(p.gy);
  var gl = GLOW[cat] || null;
  var glass = gl ? gl.glass : '#F4F6F8';
  var s = '<g transform="translate(' + x + ',' + y + ')">';
  if (gl){
    s += '<circle cx="0" cy="-14" r="' + (46 * gl.k).toFixed(1) + '" fill="#FFD54F" opacity="' + gl.o + '"/>';
    s += '<circle cx="0" cy="-14" r="' + (34 * gl.k).toFixed(1) + '" fill="#FFE082" opacity="' + gl.o + '"/>';
    if (gl.ray){
      for (var i=0;i<8;i++){
        var a = i * Math.PI / 4;
        s += '<line x1="' + (Math.cos(a)*40).toFixed(1) + '" y1="' + (-14 + Math.sin(a)*40).toFixed(1) +
             '" x2="' + (Math.cos(a)*(40 + gl.ray)).toFixed(1) + '" y2="' + (-14 + Math.sin(a)*(40 + gl.ray)).toFixed(1) +
             '" stroke="#FFC107" stroke-width="5" stroke-linecap="round" opacity=".85"/>';
      }
    }
  }
  s += '<circle cx="0" cy="-14" r="25" fill="' + glass + '" stroke="#8A8D93" stroke-width="3"/>';
  s += '<path d="M-9 -8 L-4 -18 L0 -8 L4 -18 L9 -8" fill="none" stroke="' +
       (gl ? '#E08A00' : '#B0B4BA') + '" stroke-width="3" stroke-linecap="round"/>';
  s += '<rect x="-15" y="6" width="30" height="16" rx="4" fill="#C3C7CD" stroke="#8A8D93" stroke-width="2"/>';
  s += '<rect x="-44" y="10" width="88" height="9" rx="4" fill="#D5D9DE" stroke="#9AA0A6" stroke-width="2"/>';
  if (showName) s += svgLabel(46, p.id, '#5A7C93');
  return s + '</g>';
}
/* モーター。回る むきは 矢じるし、はやさは ことばと 矢じるしの ふとさで 見せる。
   はしっこ（たんし）は でんきゅうと 同じで ひだり ＝ a・みぎ ＝ b。
   a→b に でんきが ながれる ときを「みぎ回り」と きめて いる（evalCircuit の dir）。 */
function svgMotor(p, r, name){
  var x = GX(p.gx), y = GY(p.gy), cat = r.cat, dir = r.dir;
  var spd = (cat === 'faint' || cat === 'dim') ? 'ゆっくり ' : (cat === 'bright' ? 'はやく ' : '');
  var word = cat === 'off' ? 'とまって いる' : (spd + (dir === 'right' ? 'みぎ回り' : 'ひだり回り'));
  var body = cat === 'off' ? '#DDE3E8' : '#BFE3F5';
  var s = '<g transform="translate(' + x + ',' + y + ')">';
  s += '<rect x="-44" y="-6" width="88" height="12" rx="6" fill="#D5D9DE" stroke="#9AA0A6" stroke-width="2"/>';
  s += '<circle cx="0" cy="-36" r="28" fill="' + body + '" stroke="#4A7C97" stroke-width="3"/>';
  s += '<rect x="-6" y="-14" width="12" height="14" fill="#8A8D93"/>';
  if (cat !== 'off'){
    var w = cat === 'bright' ? 8 : (cat === 'full' ? 6 : 4);
    var arc = (dir === 'right')
      ? 'M-34.6 -56 A40 40 0 0 1 34.6 -56'
      : 'M34.6 -56 A40 40 0 0 0 -34.6 -56';
    var head = (dir === 'right') ? 'translate(34.6,-56) rotate(60)' : 'translate(-34.6,-56) rotate(120)';
    s += '<path d="' + arc + '" fill="none" stroke="#E8618C" stroke-width="' + w + '" stroke-linecap="round"/>';
    s += '<g transform="' + head + '"><polygon points="0,0 -13,-8 -13,8" fill="#E8618C"/></g>';
    s += '<text x="0" y="-30" font-size="18" font-weight="900" fill="#2A5D78" text-anchor="middle">M</text>';
  } else {
    s += '<text x="0" y="-30" font-size="18" font-weight="900" fill="#8A9AA6" text-anchor="middle">M</text>';
  }
  if (name) s += svgLabel(24, name, '#4A7C97');
  s += svgLabel(name ? 41 : 24, word, cat === 'off' ? '#8A9AA6' : '#E8618C');
  return s + '</g>';
}

/* けんりゅうけい。まん中が 0 で、はりが ひだり・みぎに ふれる。
   ふれる 大きさは でんりゅうに くらべた ばいりつ（さいだい 2ばいで いっぱい）。 */
function svgGalv(p, r, name){
  var x = GX(p.gx), y = GY(p.gy), cat = r.cat, dir = r.dir;
  var amt = Math.min(r.i / REF_I, 2) / 2;
  var deg = (dir === 'none' ? 0 : (dir === 'right' ? 1 : -1)) * amt * 62;
  var a = deg * Math.PI / 180;
  var tipX = (38 * Math.sin(a)).toFixed(1), tipY = (-10 - 38 * Math.cos(a)).toFixed(1);
  var size = (cat === 'faint' || cat === 'dim') ? '小さく ' : (cat === 'bright' ? '大きく ' : '');
  var word = cat === 'off' ? 'ふれない' : (dir === 'right' ? 'みぎに ' : 'ひだりに ') + size + 'ふれた';
  var s = '<g transform="translate(' + x + ',' + y + ')">';
  s += '<rect x="-44" y="-6" width="88" height="12" rx="6" fill="#D5D9DE" stroke="#9AA0A6" stroke-width="2"/>';
  s += '<rect x="-40" y="-58" width="80" height="54" rx="9" fill="#FFFDF5" stroke="#5A7C93" stroke-width="3"/>';
  s += '<path d="M-37.1 -29.7 A42 42 0 0 1 37.1 -29.7" fill="none" stroke="#C3CDD5" stroke-width="3"/>';
  s += '<line x1="0" y1="-52" x2="0" y2="-45" stroke="#5A7C93" stroke-width="3"/>';
  s += '<text x="-30" y="-14" font-size="12" font-weight="900" fill="#9AA6B0" text-anchor="middle">−</text>';
  s += '<text x="30" y="-14" font-size="12" font-weight="900" fill="#9AA6B0" text-anchor="middle">＋</text>';
  s += '<line x1="0" y1="-10" x2="' + tipX + '" y2="' + tipY + '" stroke="' +
       (cat === 'off' ? '#8A9AA6' : '#E05A4A') + '" stroke-width="4" stroke-linecap="round"/>';
  s += '<circle cx="0" cy="-10" r="5" fill="#5A7C93"/>';
  if (name) s += svgLabel(24, name, '#4A7C97');
  s += svgLabel(name ? 41 : 24, word, cat === 'off' ? '#8A9AA6' : '#E05A4A');
  return s + '</g>';
}

function svgSwitch(p){
  var x = GX(p.gx), y = GY(p.gy);
  var lever = p.on
    ? '<line x1="-28" y1="0" x2="28" y2="0" stroke="#5A7C93" stroke-width="8" stroke-linecap="round"/>'
    : '<line x1="-28" y1="0" x2="16" y2="-30" stroke="#5A7C93" stroke-width="8" stroke-linecap="round"/>';
  return '<g transform="translate(' + x + ',' + y + ')">' +
    '<rect x="-46" y="-8" width="92" height="30" rx="9" fill="#EFE6D2" stroke="#B9A87F" stroke-width="3"/>' +
    lever +
    '<circle cx="-28" cy="0" r="7" fill="#8A8D93"/><circle cx="28" cy="0" r="7" fill="#8A8D93"/>' +
    '<rect x="-46" y="-34" width="92" height="56" fill="transparent" data-sw="' + p.id + '"/>' +
    svgLabel(40, 'スイッチ：' + (p.on ? '入' : '切'), p.on ? '#2E9A4C' : '#E05A4A') +
    '</g>';
}
