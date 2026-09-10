#!/usr/bin/env node
/* =====================================================================
   circuit-audit.mjs — でんき回路の もんだいを「しらみつぶし」に しらべる

   使い方:  node science-island/circuit-audit.mjs        （ぜんぶ）
            node science-island/circuit-audit.mjs 10     （だい10もんだけ）
   終了コード: 問題あり=1 / なし=0

   なぜ要るか:
     verify.mjs は「用意した こたえが 通るか」「用意した まちがいが 落ちるか」を見る。
     でも **子どもは 大人が 思いつかない つなぎ方を する**。そこで こちらは
     「その もんだいで 作れる つなぎ方を ぜんぶ」数えあげて、つぎを たしかめる。

       ① そもそも 解が あるか（0とおりなら 出題ミス）
       ② 何とおり あるか（1とおりしか ないと むずかしすぎる かも）
       ③ **ぬけ道**が ないか ＝ ぶひんを つかわずに（つながない／両はしを つないで
          バイパスして）クリアできて しまわないか。もんだいの めあてを 通らずに
          クリアできるなら、それは 出題の 穴。

   やり方:
     つながり方の 本しつは「はしっこ（たんし）を どう グループ分け するか」だけなので、
     たんしの **集合の分割** を ぜんぶ 作り、必要な線の本数が maxWires 以下の ものを
     じっさいに checkGoal に かける。ムダな 枝は 先に 切る（光る はずの ぶひんの
     両はしが 同じ グループ、など）。Node標準機能のみ・外部パッケージなし。
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const stubEl = new Proxy({}, { get: (_, k) => {
  if (k === 'addEventListener' || k === 'appendChild' || k === 'setAttribute') return () => {};
  if (k === 'getContext') return () => new Proxy({}, { get: () => () => {} });
  if (k === 'querySelector') return () => null;
  if (k === 'style' || k === 'classList') return new Proxy({}, { get: () => () => {}, set: () => true });
  return '';
}, set: () => true });
globalThis.document = { getElementById: () => stubEl, addEventListener: () => {} };
globalThis.window = { addEventListener: () => {}, scrollTo: () => {}, innerWidth: 800, innerHeight: 600 };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.alert = () => {};
globalThis.requestAnimationFrame = () => {};

const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
const A = new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1] +
  '; return { gameById, checkGoal, evalCircuit, TERMS };')();
const g = A.gameById('energy-denki');
const only = process.argv[2] ? parseInt(process.argv[2], 10) : null;
let ng = 0;

const termsOf = (parts) => {
  const o = [];
  parts.forEach((p) => Object.keys(A.TERMS[p.type]).forEach((k) => o.push(p.id + ':' + k)));
  return o;
};

g.stages.forEach((st, si) => {
  if (only !== null && si !== only - 1) return;
  const parts = st.parts.map((p) => ({ ...p, on: p.type === 'switch' }));
  const T = termsOf(parts), n = T.length, mx = st.goal.maxWires;
  const idx = {}; T.forEach((t, i) => { idx[t] = i; });
  const cs = st.goal.anyOf ? st.goal.anyOf.flat() : st.goal.checks;
  const need = new Set();
  cs.forEach((ck) => {
    (ck.on || []).forEach((x) => need.add(x));
    Object.entries(ck.bright || {}).forEach(([k, v]) => { if (v !== 'off') need.add(k); });
  });
  /* 光る／回る はずの ぶひんは、両はしが べつの グループで、どちらも 1こきりでない */
  const pairs = [...need].map((id) => {
    const p = parts.find((q) => q.id === id), ks = Object.keys(A.TERMS[p.type]);
    return [idx[id + ':' + ks[0]], idx[id + ':' + ks[1]]];
  });
  const batts = parts.filter((p) => p.type === 'battery').map((p) => [idx[p.id + ':p'], idx[p.id + ':m']]);

  const sols = [], idleSols = [];
  const a = new Array(n).fill(0);
  (function rec(i, mxb) {
    if (i === n) {
      const nb = mxb + 1;
      if (n - nb > mx) return;                                    // 線が 足りない
      const size = new Array(nb).fill(0);
      for (let k = 0; k < n; k++) size[a[k]]++;
      for (const [x, y] of pairs) if (a[x] === a[y] || size[a[x]] < 2 || size[a[y]] < 2) return;
      if (!batts.some(([x, y]) => a[x] !== a[y] && size[a[x]] >= 2 && size[a[y]] >= 2)) return;
      const blocks = Array.from({ length: nb }, () => []);
      for (let k = 0; k < n; k++) blocks[a[k]].push(T[k]);
      const w = [];
      blocks.forEach((b) => { for (let k = 1; k < b.length; k++) w.push([b[k - 1], b[k]]); });
      if (!A.checkGoal(st, parts, w)) return;
      sols.push(w);
      /* ぬけ道さがし …… goal の どの じょうたいでも でんきが ながれない ぶひんが あるか。
         （だい22もんの ように「スイッチを 入れると 消える」のが 正解の もんだいも あるので、
          ぜんぶの スイッチじょうたいで 一度も つかわれない ぶひんだけを 問題に する） */
      const states = cs.map((ck) => ck.sw || null);
      const everUsed = {};
      states.forEach((sw) => {
        const r = A.evalCircuit(parts, w, sw);
        parts.forEach((p) => { if (r.used[p.id]) everUsed[p.id] = 1; });
      });
      const idle = parts.filter((p) => p.type !== 'switch' && !everUsed[p.id]).map((p) => p.id);
      if (idle.length) idleSols.push({ w, idle });
      return;
    }
    for (let v = 0; v <= mxb + 1; v++) { a[i] = v; rec(i + 1, Math.max(mxb, v)); }
  })(0, -1);

  const minW = sols.length ? Math.min(...sols.map((s) => s.w ? s.w.length : s.length)) : null;
  const tag = `だい${si + 1}もん ${st.t}`;
  if (!sols.length) { ng++; console.log(`❌ ${tag}\n     解が 1つも ない（出題ミス）`); return; }
  if (idleSols.length) {
    ng++;
    const kinds = {};
    idleSols.forEach((b) => { const k = b.idle.join(','); kinds[k] = (kinds[k] || 0) + 1; });
    console.log(`❌ ${tag}`);
    console.log(`     せいかい ${sols.length}とおり のうち ${idleSols.length}とおりが ぶひんを つかわずに 通る`);
    Object.entries(kinds).forEach(([k, c]) => console.log(`       「${k}」を 一度も つかわない … ${c}とおり`));
    console.log(`       れい: ` + idleSols[0].w.map((x) => x.join('–')).join('  '));
    return;
  }
  const warn = sols.length === 1 ? '   ⚠️ こたえが 1とおりしか ない' : '';
  console.log(`✅ ${tag}\n     せいかい ${sols.length}とおり ／ さいしょうの線 ${minW}本（じょうげん ${mx}本）${warn}`);
});

console.log('\n----------------------------------------------------------------');
console.log(ng ? `結果: ❌ 出題の 穴 ${ng}件` : '結果: ✅ どの もんだいも 解けて、ぬけ道も ない');
process.exit(ng ? 1 : 0);
