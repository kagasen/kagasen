// ポータル用サムネイル生成: map-data.js → ../images/todofuken-bouken.svg
//   （node todofuken-bouken/build-thumb.mjs）
// 生成物のSVGは手編集しない。直すときはこのスクリプトを直して再生成する（CLAUDE.md §4）。
//
// 中身は「アプリの位置あてクイズ画面（ちずをタップして県をえらぶところ）」を背景にして、
// そこに キャッチコピー「これで都道府県が完璧に」をのせたもの。
// 地図は アプリ本体と同じ map-data.js の MAP_INNER を使うので、地図データを直しても ズレない。
//
// ★★ いちばん大事な前提: ポータルのカードは 高さ160px固定＋object-fit:cover なので、
//    400x260 のサムネイルは 上下が 切られる。カード幅ごとに 見える範囲を計算すると
//      3列(320px幅) → y 30〜230 ／ 1列(607px幅) → y 77〜183
//    つまり **どの画面幅でも かならず見えるのは y=78〜182 の 104pxぶんだけ**。
//    キャッチコピーなど「絶対に見せたいもの」は この帯(SAFE)の中に入れること。
//    帯の外(y<78, y>182)は「切られてもいい飾り」だけを置く。
//
// ■ 出典・ライセンス（消さないこと）
//   元データ: Wikipedia「日本地図.svg」© Lincun / CC BY-SA 3.0
//   改変版: geolonia/japanese-prefectures（map-full.svg として同梱 → build-map.mjs で map-data.js を生成）
import fs from 'node:fs';

const dataJs = fs.readFileSync(new URL('./map-data.js', import.meta.url), 'utf8');
// map-data.js は build-map.mjs が JSON.stringify で書いた `var MAP_INNER = "…";` の形。
// eval せずに その文字列リテラルだけを JSON.parse で取り出す。
const m = dataJs.match(/var MAP_INNER = ("(?:[^"\\]|\\.)*");/);
if (!m) throw new Error('map-data.js から MAP_INNER が読めない（build-map.mjs の出力形式を確認）');
const MAP_INNER = JSON.parse(m[1]);
if (MAP_INNER.length < 20000) throw new Error('MAP_INNER が短すぎる: ' + MAP_INNER.length);
const codes = [...MAP_INNER.matchAll(/data-code="(\d+)"/g)].length;
if (codes !== 47) throw new Error('都道府県が47件そろっていない: ' + codes);

// 地図の切り抜き。中身の実測bboxは (0,0)-(997,1000)（沖縄インセットと区切り線を ふくむ）。
// ★これより せまく切ると 北海道の上や 沖縄が 欠ける（古いサムネイルは "15 60 970 910" で
//   北海道の上を 60ぶん 切っていた）。すこし外側に とって 欠けないようにする。
const MAP_VIEW = { x: -8, y: -8, w: 1013, h: 1016 };
// 正解の県＝秋田県の中心（上の切り抜き座標での実測値。ブラウザの getScreenCTM から算出）
const AKITA = { x: 624, y: 404 };

// --- 地図の置きかた（カードで切られても 秋田県が SAFE帯に入るように 逆算する） ---
const MAP = { x: 205, y: -30, w: 195, h: 300 };   // 置き場所（右がわ・上下に はみ出す）
// preserveAspectRatio="xMidYMid meet" のときの 実際の倍率と 位置
const scale = Math.min(MAP.w / MAP_VIEW.w, MAP.h / MAP_VIEW.h);
const drawnW = MAP_VIEW.w * scale, drawnH = MAP_VIEW.h * scale;
const originX = MAP.x + (MAP.w - drawnW) / 2, originY = MAP.y + (MAP.h - drawnH) / 2;
const akitaY = originY + (AKITA.y - MAP_VIEW.y) * scale;
const SAFE = { top: 78, bottom: 182 };
// キャッチコピーの帯。秋田県のタップの波より 下に置く（地図の見どころを かくさない）
const BAND = { y: 120, h: 62 };
if (akitaY < SAFE.top + 6 || akitaY > BAND.y - 6) {
  throw new Error('秋田県が 見える帯からはずれる（akitaY=' + akitaY.toFixed(1) + '）。MAPの位置を直す');
}
if (BAND.y + BAND.h > SAFE.bottom) throw new Error('キャッチコピーの帯が 見える範囲から はみ出す');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">
  <title>都道府県の冒険 ― ちずをタップして都道府県をえらぶクイズ</title>
  <style>
    .t { font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif; font-weight: 800; }
    .prefecture { fill: #faf6ec; stroke: #8b6f5e; stroke-width: 1.4; }
    /* えらんだ県は アプリの正解表示と同じ「うすい緑＋こい緑の太わく」（.prefecture より あとに書く） */
    .akita { fill: #a5d6a7; stroke: #2e7d32; stroke-width: 3.4; }
    .boundary-line { stroke: #90caf9; stroke-width: 3; stroke-dasharray: 7 7; fill: none; }
  </style>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#bbdefb"/><stop offset="1" stop-color="#eaf6fe"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1e88e5"/><stop offset="1" stop-color="#12539c"/>
    </linearGradient>
  </defs>

  <!-- ▼ここから背景＝アプリの「ばしょあてクイズ」の画面 -->
  <rect width="400" height="260" fill="#ffffff"/>
  <rect width="400" height="44" fill="url(#sky)"/>

  <!-- 5もんの すすみぐあい（2もん せいかいずみ・3もんめ）。
       見える帯の外なので「切られてもいい かざり」。y=58 に置くと 3列レイアウト
       （見えるのが y=30〜230）では 出て、1列（y=77〜183）では 切れる、という あつかい。
       ★ラベルなしで 左上に まるを ならべると パソコンの窓ボタンに 見えるので 文字を そえる -->
  <g>
    <circle cx="46" cy="58" r="4.5" fill="#66bb6a"/>
    <circle cx="60" cy="58" r="4.5" fill="#66bb6a"/>
    <circle cx="74" cy="58" r="6" fill="#29b6f6"/>
    <circle cx="89" cy="58" r="4.5" fill="#cfd8dc"/>
    <circle cx="103" cy="58" r="4.5" fill="#cfd8dc"/>
  </g>
  <text class="t" x="116" y="62" font-size="12" fill="#78909c">3もんめ / 5もん</text>

  <!-- 日本地図（ここをタップして県をえらぶ）。秋田県が えらばれた 緑 -->
  <svg x="${MAP.x}" y="${MAP.y}" width="${MAP.w}" height="${MAP.h}" viewBox="${MAP_VIEW.x} ${MAP_VIEW.y} ${MAP_VIEW.w} ${MAP_VIEW.h}" preserveAspectRatio="xMidYMid meet">
    ${MAP_INNER}
    <!-- タップの波（ゆびで おした ところ） -->
    <g fill="none" stroke="#2e7d32">
      <circle cx="${AKITA.x}" cy="${AKITA.y}" r="88" stroke-width="15" opacity="0.5"/>
      <circle cx="${AKITA.x}" cy="${AKITA.y}" r="136" stroke-width="11" opacity="0.26"/>
      <circle cx="${AKITA.x}" cy="${AKITA.y}" r="186" stroke-width="9" opacity="0.12"/>
    </g>
  </svg>

  <!-- もんだい文（アプリの位置あてクイズと同じ言いかた）。
       ★見える帯(y=78〜182)の中に 字の上まで おさまる高さに置く（36px/baseline103 だと
         字の上が y=78 に かかって 切れて見えた）。
       ★x=44 から はじめるのは、ポータルのカードの お気に入り★ボタンが 左上（SVG換算で
         x=7〜40 あたり）に かぶるため。ここより左に 字を置くと ★と重なって 読めない。
       ★白いプレートを 下に敷くのは、うしろの地図（沖縄インセット）と 字が かさなっても
         かならず読めるようにするため。 -->
  <rect x="38" y="82" width="196" height="32" rx="16" fill="#ffffff" opacity="0.93"/>
  <text class="t" x="48" y="105" font-size="26" fill="#1565c0">秋田県</text>
  <text class="t" x="128" y="105" font-size="14" fill="#37474f">は どこかな？</text>

  <!-- ▼キャッチコピー（かならず見える帯 y=78〜182 の中） -->
  <rect x="0" y="${BAND.y}" width="400" height="${BAND.h}" fill="url(#band)"/>
  <rect x="0" y="${BAND.y}" width="400" height="2" fill="#ffffff" opacity="0.35"/>
  <text class="t" x="200" y="${BAND.y + 33}" font-size="27" text-anchor="middle" fill="#ffffff">これで都道府県が完璧に</text>
  <text class="t" x="200" y="${BAND.y + 52}" font-size="12" text-anchor="middle" fill="#bbdefb">47都道府県の ばしょ・かたち・めいぶつを ぜんぶ おぼえよう！</text>

  <!-- ▼ここから下は カードでは 切られる かざり -->
  <rect x="14" y="196" width="150" height="34" rx="17" fill="#e3f2fd"/>
  <text class="t" x="89" y="218" font-size="15" text-anchor="middle" fill="#1565c0">ちずを タップ！</text>
</svg>
`;

const out = new URL('../images/todofuken-bouken.svg', import.meta.url);
fs.writeFileSync(out, svg);
console.log('サムネイルを生成した（' + svg.length + ' bytes / 47都道府県OK / ' +
  '秋田県の中心 y=' + akitaY.toFixed(1) + '・キャッチコピー y=' + BAND.y + '〜' + (BAND.y + BAND.h) +
  ' は どちらも 見える帯 y=' + SAFE.top + '〜' + SAFE.bottom + ' の中）');
