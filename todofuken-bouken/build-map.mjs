// 地図データ生成: map-full.svg → map-data.js（node todofuken-bouken/build-map.mjs）
// 生成物 map-data.js は手編集しない。直すときはこのスクリプトを直して再生成する。
//
// ■ 出典・ライセンス（公開時に index.html のクレジット表記を絶対に消さないこと）
//   元データ: Wikipedia「日本地図.svg」© Lincun / CC BY-SA 3.0
//   https://ja.wikipedia.org/wiki/ファイル:日本地図.svg
//   改変版: geolonia/japanese-prefectures（上記を元にしたSVG。map-full.svg として同梱）
//   https://github.com/geolonia/japanese-prefectures
//   本アプリでの改変: 固定色の除去・title/desc の削除（形状データは無改変）
import fs from 'node:fs';

const src = fs.readFileSync(new URL('./map-full.svg', import.meta.url), 'utf8');

const vbMatch = src.match(/viewBox="([^"]+)"/);
if (!vbMatch) throw new Error('viewBox が見つからない');
const viewBox = vbMatch[1];

let inner = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
inner = inner
  .replace(/<title>[\s\S]*?<\/title>/g, '')
  .replace(/<desc>[\s\S]*?<\/desc>/g, '')
  // 固定色・線幅を除去して CSS で塗り分けられるようにする
  .replace(/\s(?:fill|stroke|stroke-width)="[^"]*"/g, '')
  .replace(/\sstyle=""/g, '')
  .replace(/\n[ \t]*\n/g, '\n');

// 複数の島が1つの <path>（M…Z M…Z）にまとまっていると「本体だけのbbox」が取れないので、
// サブパスごとに <path> を分割する（東京の小笠原・長崎の五島などの対策。形は無改変）
inner = inner.replace(/<path([^>]*?)d="([^"]+)"([^>]*?)\/>/g, function (m, pre, d, post) {
  var subs = d.split(/(?=M)/).filter(function (s) { return s.trim(); });
  if (subs.length <= 1) return m;
  return subs.map(function (s) { return '<path' + pre + 'd="' + s.trim() + '"' + post + '/>'; }).join('');
});

// data-code が47都道府県ぶん揃っているか検査（欠落・重複の前例対策）
const codes = [...inner.matchAll(/data-code="(\d+)"/g)].map(m => Number(m[1])).sort((a, b) => a - b);
if (codes.length !== 47 || codes[0] !== 1 || codes[46] !== 47 || new Set(codes).size !== 47) {
  throw new Error('都道府県コードが47件そろっていない: ' + codes.join(','));
}

const out = '// 自動生成: node todofuken-bouken/build-map.mjs（手編集しない）\n' +
  '// 出典: 日本地図.svg © Lincun / CC BY-SA 3.0（geolonia/japanese-prefectures 改変版）\n' +
  'var MAP_VIEWBOX = ' + JSON.stringify(viewBox) + ';\n' +
  'var MAP_INNER = ' + JSON.stringify(inner) + ';\n';

fs.writeFileSync(new URL('./map-data.js', import.meta.url), out);
console.log('map-data.js を生成した（' + out.length + ' bytes / 47都道府県OK）');
