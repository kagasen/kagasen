// node --test rekishi-battle/tests/stage5-data.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('chars-data.js', root), 'utf8'), ctx);
const {REKISHI_CHARS: chars, REKISHI_LEGENDS: legends, REKISHI_STAGES: stages} = ctx;

test('基本42人と68面を維持し、名将10人と10試練を追加する', () => {
  assert.equal(chars.length, 42);
  assert.equal(legends.length, 10);
  assert.equal(stages.length, 78);
  assert.ok(stages.slice(0,68).every(s => !s.legendId));
  assert.ok(stages.slice(68).every(s => s.series === 5 && s.mode === 'duel' && !s.ebase));
  assert.equal(new Set([...chars,...legends].map(c => c.id)).size,52);
  assert.equal(new Set(stages.map(s => s.id)).size,78);
  assert.equal(stages.at(-1).legendId,'legend_musashi');
  assert.ok(stages.at(-1).solo);
});

test('全名将に本番用4ポーズ、固有技、重複のない3択クイズ3問がある', () => {
  for (const ch of legends) {
    assert.ok(ch.skill && ch.skill2 && ch.skill3 && ch.ally && ch.hint);
    assert.equal(ch.quiz.length,3,ch.name);
    assert.equal(new Set(ch.quiz.map(q=>q[0])).size,3,ch.name);
    for (const [q,choices] of ch.quiz) {
      assert.ok(q);
      assert.equal(choices.length,3);
      assert.equal(new Set(choices).size,3,q);
    }
    for (const pose of ['stand','walk','atk','down']) {
      const bytes=fs.readFileSync(new URL('images/chars/'+ch.id+'/'+pose+'.webp',root));
      assert.equal(bytes.toString('ascii',0,4),'RIFF');
      assert.equal(bytes.toString('ascii',8,12),'WEBP');
      assert.ok(bytes.length>1000,ch.id+'/'+pose);
    }
  }
});

test('10試練で城のちからを1つずつ別々に制限し、既存68面には制限を加えない', () => {
  const powers=['yumi','tetsuhau','hi','kaminari','saku','hata','ame','kikin','kaze','nengu'];
  assert.ok(stages.slice(0,68).every(st=>!st.blockedPowers));
  const bans=stages.slice(68).map(st=>{
    assert.equal(st.blockedPowers.length,1);
    assert.ok(st.powerTip);
    assert.ok(powers.includes(st.blockedPowers[0]));
    return st.blockedPowers[0];
  });
  assert.equal(new Set(bans).size,10);
});

test('外部JSとインラインJSは構文が正しく、SWのデータ版が一致する', () => {
  const html=fs.readFileSync(new URL('index.html',root),'utf8');
  const sw=fs.readFileSync(new URL('sw.js',root),'utf8');
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (match[1].trim()) new vm.Script(match[1]);
  }
  const version=html.match(/chars-data\.js\?v=\d+/)[0];
  assert.ok(sw.includes(version));
});
