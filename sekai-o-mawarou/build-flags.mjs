// 国旗データの生成: node sekai-o-mawarou/build-flags.mjs
// 生成物 flags-data.js は手編集しない。
//
// ■ 出典・ライセンス（index.html のクレジット表記を絶対に消さないこと・CLAUDE.md §7）
//   国旗: flag-icons © lipis ほか / MIT License（https://github.com/lipis/flag-icons）
//   本アプリでの改変: SVG を小さなPNG（幅96）に変換して埋めこんでいる。
//   ※ SVGのまま入れると2.7MBになり、教室の回線で初回が重すぎるため。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import { EXTRA } from './country-extra.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const CACHE = path.join(HERE, '.cache');
const DIR = path.join(CACHE, 'fi', 'package', 'flags', '4x3');

if (!fs.existsSync(DIR)) {
  console.log('flag-icons をダウンロード中 ...');
  // シェルを通さない execFileSync を使う（URLをそのままシェルに渡さないため）
  const meta = JSON.parse(execFileSync('curl', ['-sS', 'https://registry.npmjs.org/flag-icons/latest']).toString());
  const tgz = path.join(CACHE, 'flags.tgz');
  execFileSync('curl', ['-sSL', '-o', tgz, meta.dist.tarball]);
  fs.mkdirSync(path.join(CACHE, 'fi'), { recursive: true });
  execFileSync('tar', ['xzf', tgz, '-C', path.join(CACHE, 'fi')]);
}

const codes = Object.keys(EXTRA).filter((c) => c.slice(0, 2) !== '__').sort();
const flags = {};
let total = 0;
const missing = [];
for (const code of codes) {
  const file = path.join(DIR, code.toLowerCase() + '.svg');
  if (!fs.existsSync(file)) { missing.push(code); continue; }
  const png = new Resvg(fs.readFileSync(file, 'utf8'), { fitTo: { mode: 'width', value: 96 } })
    .render().asPng();
  flags[code] = 'data:image/png;base64,' + Buffer.from(png).toString('base64');
  total += flags[code].length;
}
if (missing.length) console.log('⚠ 国旗が見つからない国: ' + missing.join(','));
console.log('国旗: ' + Object.keys(flags).length + 'ヶ国 / 合計 ' + Math.round(total / 1024) + 'KB');

fs.writeFileSync(path.join(HERE, 'flags-data.js'),
  '// 自動生成: node sekai-o-mawarou/build-flags.mjs（手編集しない）\n' +
  '// 国旗: flag-icons © lipis ほか / MIT License（SVGを幅96のPNGに変換して埋めこみ）\n' +
  'var FLAGS = ' + JSON.stringify(flags) + ';\n');
console.log('flags-data.js ' + fs.statSync(path.join(HERE, 'flags-data.js')).size + ' bytes');
