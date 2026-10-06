// build-bgm.mjs — Suno で つくった 曲を ゲームの BGM に する
//
//   1. goisen/bgm-src/ に 曲を おく（名前は 下の TRACKS と 同じ。mp3 / wav / m4a）
//        title.mp3  タイトル      map.mp3   ワールドマップ・ずかん
//        battle.mp3 ふつうの バトル  boss.mp3  ボス戦     ending.mp3 最強エンディング
//   2. node goisen/build-bgm.mjs
//   → goisen/assets/bgm/<曲>.m4a（AAC 112kbps・音量を -16 LUFS に そろえる・はじめ 0.3秒 フェードイン）
//   → index.html の BGM_V と sw.js の CACHE を 自動で くりあげる（CLAUDE.md §4）
// ★ない 曲は とばす（その 曲だけ sfx.js の 合成BGMの まま）。
// ★BGM は 大きいので sw.js の ASSETS には 入れない（さいしょに 鳴った ときに キャッシュされる）。
// ★Suno の 曲の 利用条件（プランごとに ちがう）を 確かめてから 入れること。出典は タイトルの .credit と エンディングに 書く。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(HERE, 'bgm-src'), OUT = path.join(HERE, 'assets', 'bgm');
const TRACKS = ['title', 'map', 'battle', 'boss', 'ending'];
fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const t of TRACKS) {
  const src = ['mp3', 'wav', 'm4a'].map((e) => path.join(SRC, t + '.' + e)).find((f) => fs.existsSync(f));
  if (!src) { console.log('  - ' + t + ': ない（合成BGMの まま）'); continue; }
  const out = path.join(OUT, t + '.m4a');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vn', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.3',
    '-c:a', 'aac', '-b:a', '112k', '-ar', '44100', '-ac', '2', out]);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log('  ✓ ' + t + ': ' + path.basename(src) + ' → assets/bgm/' + t + '.m4a（' + kb + 'KB）');
  n++;
}
if (n) {
  const ip = path.join(HERE, 'index.html');
  let html = fs.readFileSync(ip, 'utf8');
  html = html.replace(/var BGM_V = (\d+);/, (m, v) => 'var BGM_V = ' + (+v + 1) + ';');
  fs.writeFileSync(ip, html);
  const sp = path.join(HERE, 'sw.js');
  let sw = fs.readFileSync(sp, 'utf8');
  sw = sw.replace(/goisen-cache-v(\d+)/, (m, v) => 'goisen-cache-v' + (+v + 1));
  fs.writeFileSync(sp, sw);
  console.log('BGM_V と sw.js の CACHE を くりあげた');
}
