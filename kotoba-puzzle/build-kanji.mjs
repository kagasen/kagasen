// build-kanji.mjs — ことばパズルバトルの「部首の なかま」データ（kanji-data.js）を つくる
//
//   node kotoba-puzzle/build-kanji.mjs
//
// ★kanji-data.js は 生成物。手で直さず ここの FAMILIES を 直して つくりなおす（CLAUDE.md §4）。
//   つくりなおしたら index.html の kanji-data.js?v=N と sw.js の CACHE を 繰り上げる。
// よみ・ことば・いみ は 漢字の冒険（kanji-bouken/gradeN-data.js）から とる。
// FAMILIES の 字は 小学校で ならう 1026字だけ（ないと エラーで とまる）。重なりも エラー。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const KB = path.join(HERE, '..', 'kanji-bouken');

/* 玉の しゅるい = 部首の なかま。色は パズルの 6ぞくせい（heal=かいふく玉） */
const FAMILIES = [
  { id: 'mizu', bushu: '氵', name: 'さんずい', icon: '💧', color: 'blue',   hint: '水に かんけいする 字が おおいよ',
    kanji: '池海汽活泳温湖港消深注湯波油洋流漁浅清満' },
  { id: 'ki',   bushu: '木', name: 'きへん',   icon: '🌳', color: 'green',  hint: '木や 木で できた ものの 字が おおいよ',
    kanji: '林森村校板柱橋植横根松梅机標構機様材札桜' },
  { id: 'hi',   bushu: '火', name: 'ひ・れっか', icon: '🔥', color: 'red',  hint: '火や あつさに かんけいする 字が おおいよ（灬も 火の なかま）',
    kanji: '火灯炭焼熱照点然無災' },
  { id: 'nichi',bushu: '日', name: 'ひへん・にち', icon: '☀', color: 'yellow', hint: '日（たいよう）や 時間に かんけいする 字が おおいよ',
    kanji: '日明晴時曜昼暗映暖昨春星早景晩暑暮' },
  { id: 'gen',  bushu: '言', name: 'ごんべん', icon: '💬', color: 'purple', hint: 'ことばや 話すことに かんけいする 字が おおいよ',
    kanji: '記計語読話詩談調試説議訓設証謝講論誌誤' },
  { id: 'kokoro', bushu: '心', name: 'こころ',  icon: '❤', color: 'pink',  hint: '気もちに かんけいする 字が おおいよ（そろえると かいふく）', heal: true,
    kanji: '心思悲意感想息悪愛念急必志態応忘' },
];

const INFO = {};
for (let g = 1; g <= 6; g++) {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(KB, `grade${g}-data.js`), 'utf8').replace(/\bconst (\w+)\s*=/g, 'globalThis.$1 ='), ctx);
  for (const [ch, v] of Object.entries(ctx[`GRADE${g}_INFO`])) if (!v.kana) INFO[ch] = { g, ...v };
}
const seen = {}, errs = [];
const out = FAMILIES.map((f) => {
  const list = [...f.kanji].map((ch) => {
    const v = INFO[ch];
    if (!v) { errs.push(`${f.name}: 「${ch}」は 1026字に ない`); return null; }
    if (seen[ch]) errs.push(`「${ch}」が ${seen[ch]} と ${f.name} に ダブり`);
    seen[ch] = f.name;
    /* 玉に だす よみ: 訓よみ（くんの 1つめ・送りがな ぬき）→ なければ 音よみ（ひらがなに） */
    const kun = String(v.kun || '').split('・')[0].replace(/（.*?）/g, '').replace('—', '').trim();
    const on = String(v.on || '').split('・')[0].trim().replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
    return [ch, v.g, kun || on, v.quiz ? v.quiz.w : '', v.quiz ? v.quiz.r : '', v.quiz ? v.quiz.m : '', v.words || ''];
  }).filter(Boolean);
  const { kanji, ...rest } = f;
  return { ...rest, kanji: list };
});
if (errs.length) { console.error('エラー:\n  ' + errs.join('\n  ')); process.exit(1); }
let s = '/* ことばパズルバトルの 部首の なかま — build-kanji.mjs が つくる。手で 直さない。\n' +
  ' * 出典: 漢字の冒険（kanji-bouken）の 漢字データ\n' +
  ' * kanji: [字, 配当学年, 玉の よみ, ことば, ことばの よみ, いみ, ことば例] */\n';
s += 'var FAMILIES = ' + JSON.stringify(out, null, 0).replace(/\},\{"id"/g, '},\n{"id"') + ';\n';
fs.writeFileSync(path.join(HERE, 'kanji-data.js'), s);
for (const f of out) console.log(f.icon, f.name, f.kanji.length + '字', f.kanji.map((k) => k[0] + '(' + k[2] + ')').join(' '));
