#!/usr/bin/env node
/* images/ogp.svg から images/ogp.png（1200x630）を 作る。
   SNSや 検索結果の カード画像は SVGだと 出ない ところが 多いので PNGに 焼く。
   使い方: node build-ogp.mjs   （@resvg/resvg-js は devDependency）  */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const svg = fs.readFileSync(path.join(ROOT, 'images/ogp.svg'), 'utf8');
const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true } })
  .render().asPng();
fs.writeFileSync(path.join(ROOT, 'images/ogp.png'), png);
console.log('images/ogp.png  ' + Math.round(png.length / 1024) + 'KB');
