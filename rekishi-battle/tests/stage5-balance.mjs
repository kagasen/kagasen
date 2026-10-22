// ローカルサーバー起動後: node rekishi-battle/tests/stage5-balance.mjs [画面幅] [JSON出力先]
// Lv50・基本/回復重視/攻撃型の3編成と7戦法を比較。本番のtick・技・ちからを使う。
// 隙＋旗、即撃ち＋支援、支援なしの出撃＋即撃ち、必殺なし、を区別する。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const bundled=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||(fs.existsSync(bundled)?bundled:'playwright'));
const chrome=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({headless:true,...(fs.existsSync(chrome)?{executablePath:chrome}:{})});
try{
 const p=await browser.newPage({viewport:{width:Number(process.argv[2])||1180,height:1024}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:8879/rekishi-battle/',{waitUntil:'networkidle'});
 const result=await p.evaluate(()=>{
  window.requestAnimationFrame=function(){return 0;};
  popup=function(){};cutIn=function(){};confettiBurst=function(){};SND_ON=false;BGM_ON=false;
  const decks=[['himiko','kiyomori','nobunaga','hideyoshi','yoshitsune','ieyasu','togo'],['himiko','shomu','nobunaga','hideyoshi','yoshitsune','kiyomori','togo']];
  const plans=[{mode:'opening-banner',deck:0},{mode:'opening-banner',deck:1},
   {mode:'opening-assault-banner',deck:0},{mode:'immediate-supported',deck:0},
   {mode:'blind',deck:0},{mode:'blind',deck:1},{mode:'no-special',deck:0}];
  const results=[];const before=JSON.stringify(STAGES);
  for(const level of [50]) for(const st of STAGES.filter(isLegendStage)) {
   const attempts=[];
   for(const plan of plans) {
    save.cards={};CHARS.forEach(ch=>save.cards[ch.id]={n:level,r:0,sr:0});save.deck=decks[plan.deck].slice();
    if(plan.mode.includes('assault')) save.deck=save.deck.map(id=>id==='himiko'?'tokimune':id);
    state.stage=st;startBattle();B.W=$('bfield').clientWidth;B.groundY=$('bfield').clientHeight*.15;
    spawnBase();trialBossStart(spawnEnemy(bsDef(st),'boss'));buildDeployRow();buildPowerRow();buildRain();tickerStart();
    let time=performance.now();B.last=time;let skillCount=0;
    for(let step=0;step<9000&&!B.over;step++) {
     if(step%5===0) {
      const weak=B.trial.phase==='opening';
      if(B.gauge>=GAUGE_MAX) {
       const ready=hisReady();let chosen=ready.filter(r=>r.u.type==='bushi').sort((a,b)=>b.u.atk-a.u.atk)[0];
       const base=B.units.find(u=>u.kind==='base');
       if(plan.mode.startsWith('opening')&&base.hp<base.maxHp*.55) chosen=ready.find(r=>r.u.type==='inori')||chosen;
       if(chosen&&plan.mode!=='no-special'&&(weak||plan.mode.startsWith('immediate')||plan.mode==='blind'||(plan.mode.startsWith('opening')&&chosen.u.type==='inori'))) {
        fireHissatsu(chosen.id,chosen.u.type==='inori'?'inori':'ichigeki');skillCount++;
       }
      }
      if(B.over)break;
      // Keep enough frontline, then buy powers; no extra money or changed combat stats.
      save.deck.forEach(id=>{if(B.money>=charStat(id).cost)deploy(id);});
      const allies=B.units.filter(u=>u.alive&&u.kind==='ally');
      if(plan.mode.endsWith('banner')&&allies.length>=3) {
       const front=allies.slice().sort((a,b)=>b.x-a.x)[0];
       if(B.flag||B.money>=POW_BY_ID.hata.cost+60) placeFlag(Math.min(powerFarX(0),front.x));
      }
      if(plan.mode!=='blind'&&allies.length>=3) {
       const hurt=B.units.some(u=>u.side==='a'&&u.alive&&u.hp<u.maxHp*.65);
       if(hurt){const a=B.units.filter(u=>u.kind==='ally'&&u.alive&&u.hp<u.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(a)giveNengu(a.x);}
       if(B.money>140)usePower('ame');
       if(B.money>160)usePower('kaze');
      }
     }
     time+=50;tick(time);
    }
    const base=B.units.find(u=>u.kind==='base');attempts.push({mode:plan.mode,deck:plan.deck,
     win:!B.trial.boss.alive,defeat:!base.alive,timeout:!B.over,t:Math.round(B.t),hp:Math.round(base.hp),
     boss:Math.round(B.trial.boss.hp),his:skillCount,cycle:B.trial.cycle});
   }
   results.push({level,id:st.id,key:legendOf(st).key,blockedPowers:st.blockedPowers.slice(),attempts});
  }
  if(before!==JSON.stringify(STAGES))throw new Error('ステージ定義が戦闘中に変更された');return results;
 });
 for(const r of result)console.log(r.id,r.key,r.attempts.map(a=>(a.win?'○':'×')+a.t+'秒').join(' / '));
 assert.deepEqual(errors,[]);
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify({viewport:Number(process.argv[2])||1180,result,errors},null,2)+'\n');
 assert.ok(result.every(r=>r.attempts.some(a=>a.mode.startsWith('opening')&&a.win)),'全10試練にLv50の既存42人で戦術を使う攻略例がある');
 assert.ok(result.every(r=>r.attempts.filter(a=>a.mode==='blind').every(a=>a.defeat)), 'Lv50でも出撃と即撃ち連打だけでは全試練に敗北する');
 assert.ok(result.every(r=>r.attempts.filter(a=>a.mode==='no-special').every(a=>a.defeat)), '必殺を使わず守り続けてもLv50で全試練に敗北する');
 console.log('PASS: Lv50で戦術ありの攻略例10/10、出撃＋即撃ちだけ・必殺なしは敗北。戦闘定義の変更・JSエラーなし');
}finally{await browser.close();}
