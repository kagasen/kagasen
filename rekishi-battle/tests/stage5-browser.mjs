// ローカルサーバー起動後: node rekishi-battle/tests/stage5-browser.mjs
// BASE_URL / PLAYWRIGHT_MODULE / CHROME_PATH で実行環境を指定できる。独立したブラウザの保存領域だけを使用。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const bundled=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||(fs.existsSync(bundled)?bundled:'playwright'));
const chrome=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({headless:true,...(fs.existsSync(chrome)?{executablePath:chrome}:{})});
const base=process.env.BASE_URL||'http://127.0.0.1:8879/rekishi-battle/';
const ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../chars-data.js',import.meta.url),'utf8'),ctx);
const baseline={};vm.createContext(baseline);
vm.runInContext(execFileSync('git',['show','HEAD:rekishi-battle/chars-data.js'],{encoding:'utf8'}),baseline);
assert.equal(JSON.stringify(ctx.REKISHI_CHARS),JSON.stringify(baseline.REKISHI_CHARS));
assert.equal(JSON.stringify(ctx.REKISHI_STAGES.slice(0,68)),JSON.stringify(baseline.REKISHI_STAGES.slice(0,68)));
const seed={ver:1,cards:{},deck:['himiko','kiyomori','nobunaga','hideyoshi','yoshitsune','ieyasu','togo'],
  cleared:{},chal:{st1:{clear:true,era:true}},gold:{himiko:true},wins:{himiko:12},mvp:{nobunaga:8},
  qseen:['old'],tseen:[1,9],sound:false,bgm:false,ending1:true,ending2:true,custom:'keep'};
for(const ch of ctx.REKISHI_CHARS)seed.cards[ch.id]={n:20,r:0,sr:1};
for(const st of ctx.REKISHI_STAGES.slice(0,68))seed.cleared[st.id]=true;
const outputs=path.resolve('tmp/rekishi5');fs.mkdirSync(outputs,{recursive:true});
try {
  const context=await browser.newContext({viewport:{width:1180,height:820}});
  const page=await context.newPage(),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await page.addInitScript(seed=>{
    if(!localStorage.getItem('rekishiBattle.save.v1'))localStorage.setItem('rekishiBattle.save.v1',JSON.stringify(seed));
  },seed);
  await page.goto(base,{waitUntil:'networkidle'});
  assert.deepEqual(await page.evaluate(()=>({
    chars:CHARS.length,legends:LEGENDS.length,stages:STAGES.length,owned:ownedIds().length,
    first:stageUnlocked(68),last:stageUnlocked(77),gold:save.gold.himiko,custom:save.custom
  })),{chars:42,legends:10,stages:78,owned:42,first:true,last:false,gold:true,custom:'keep'});
  const lock=await page.evaluate(()=>{
    delete save.cleared.st17d;const first=stageUnlocked(68);save.cleared.st17d=true;
    save.cleared.st9e=true;const last=stageUnlocked(77);delete save.cleared.st9e;
    return {first,last};
  });
  assert.deepEqual(lock,{first:false,last:false});
  assert.equal(await page.locator('.stage-btn.hard5').count(),10);
  await page.locator('.stage-btn.hard5').first().click();
  await page.screenshot({path:path.join(outputs,'formation-ipad.png')});
  await page.click('#btn-fight');await page.waitForFunction(()=>B&&B.W>0&&B.trial);
  assert.equal(await page.evaluate(()=>B.units.some(u=>u.kind==='ebase')),false);
  await page.locator('.dep-btn').filter({hasText:'織田信長'}).click();
  assert.ok(await page.evaluate(()=>onField('nobunaga')));
  await page.evaluate(()=>hit(B.trial.boss,B.trial.boss.maxHp*100,false,'nobunaga'));
  assert.deepEqual(await page.evaluate(()=>({lv:charLevel('legend_mitsunari'),clear:save.cleared.st1e,next:stageUnlocked(69)})),{lv:40,clear:true,next:true});
  await page.screenshot({path:path.join(outputs,'recruit-ipad.png')});
  await page.locator('#b-overlay button').nth(1).click();
  assert.ok((await page.locator('#hensei-grid .pick-btn').first().textContent()).includes('石田三成'));
  // Empty one slot, select the newly recruited character, and deploy through real buttons.
  await page.locator('#hensei-grid .pick-btn.sel').filter({hasText:'東郷平八郎'}).click();
  await page.locator('#hensei-grid .pick-btn').filter({hasText:'石田三成'}).click();
  await page.click('#btn-fight');await page.waitForFunction(()=>B&&B.W>0&&state.stage.id==='st2e');
  await page.locator('.dep-btn').filter({hasText:'石田三成'}).click();
  assert.ok(await page.evaluate(()=>onField('legend_mitsunari')));
  assert.ok(await page.evaluate(()=>{
    const u=B.units.find(u=>u.kind==='ally'&&u.ch.id==='legend_mitsunari');
    const p=charPower(u.ch,ERA_MULT);return u.maxHp===p.hp&&u.atk===p.atk&&u.range===TYPES.chie.range;
  }));
  await page.evaluate(()=>hit(B.trial.boss,B.trial.boss.maxHp*100,false,'legend_mitsunari'));
  await page.locator('#b-overlay button').first().click();
  for(let i=0;i<3;i++){
    assert.equal(await page.locator('.quiz-choice').count(),3);
    await page.click('.quiz-choice[data-ok="1"]');await page.click('#btn-qok');await page.click('#btn-qnext');
  }
  assert.equal(await page.evaluate(()=>cur),'v-gacha');
  await page.click('#btn-spin');await page.waitForFunction(()=>cur==='v-reward');
  assert.ok(await page.evaluate(()=>!state.gacha.ch.legend),'通常ガチャに名将は混ざらない');
  assert.ok(await page.locator('#btn-legend-next').isVisible());
  console.log('PASS: 旧68面・42人、開放条件、実ボタンで撃破→加入→編成→出撃→3問クイズ→カード');

  const checks=await page.evaluate(()=>{
    window.requestAnimationFrame=function(){return 0;};
    popup=function(){};cutIn=function(){};confettiBurst=function(){};
    window.prepareTrial=function(st){
      state.stage=st;startBattle();B.W=$('bfield').clientWidth;B.groundY=$('bfield').clientHeight*.15;
      spawnBase();trialBossStart(spawnEnemy(bsDef(st),'boss'));buildDeployRow();buildPowerRow();buildRain();tickerStart();
    };
    const all=STAGES.filter(isLegendStage), rows=[];
    for(const st of all){
      prepareTrial(st);
      const hp=B.trial.boss.hp,phases=new Set([B.trial.phase]);
      for(let k=0;k<340;k++){B.t+=.05;tickTrial(.05);phases.add(B.trial.phase);}
      const phaseNames=[...phases];
      const boss=B.trial.boss;hit(boss,boss.maxHp*100,false,'nobunaga');
      const lv=charLevel(st.legendId),cardBefore=JSON.stringify(cardCnt(st.legendId));
      winBattle(); // 同じ勝利の二重呼び出しでも追加報酬を出さない。
      const duplicate=cardBefore===JSON.stringify(cardCnt(st.legendId));
      prepareTrial(st);const sameHp=B.trial.boss.hp===hp;hit(B.trial.boss,hp*100,false,'nobunaga');
      const trained=charLevel(st.legendId);
      prepareTrial(st);hit(B.trial.boss,hp*100,false,'nobunaga');
      prepareTrial(st);hit(B.trial.boss,hp*100,false,'nobunaga');
      rows.push({id:st.legendId,phaseNames,duplicate,sameHp,lv,trained,max:charLevel(st.legendId)});
    }
    // 全員の固有技が実際に発動し、別人の技名がMVP記録に混ざらない。
    const skills=[];
    for(const ch of LEGENDS){
      prepareTrial(all[0]);
      const u=spawnAlly(ch);u.x=B.trial.boss.x-30;
      const did=fireSkill(u), own=Object.keys(B.skillCnt[ch.id]||{});
      skills.push({id:ch.id,did,own:own.every(s=>skillList(ch,'sr').includes(s))});
    }
    // 戦闘の期限つき効果は新しい戦闘に残らず、期限切れでも消える。
    prepareTrial(all[0]);const a=spawnAlly(CHAR_BY_ID.nobunaga);a.hp=a.maxHp=10000;
    legendBuff(a,'guard',.5,2);hit(a,100,true);const guarded=a.hp===9950;
    B.t+=3;hit(a,100,true);const expired=a.hp===9850;
    // Lv50向け調整: 隙以外は受け流し。敵軍の闘志には上限があり、再戦では元へ戻る。
    const boss=B.trial.boss, hpBefore=boss.hp;
    B.trial.phase='rest';hit(boss,1000,true);
    const deflect=hpBefore-boss.hp;
    B.trial.phase='opening';const hpOpen=boss.hp;hit(boss,1000,true);
    const openingDamage=hpOpen-boss.hp;
    B.trial.phase='rest';B.trial.cycle=3;
    const minion=spawnEnemy(mnDef(all[0]),'minion');
    const pressureBoth=trialAttackMul(boss)===1.24&&trialAttackMul(minion)===1.24;
    B.trial.cycle=99;const pressureCap=trialAttackMul(boss)===2;
    drawLegendBar();const pressureShown=$('legendbar').textContent.indexOf('2.00')>=0;
    prepareTrial(all[0]);const pressureReset=trialPressure()===1;
    const recruited=LEGENDS.map(ch=>({id:ch.id,lv:charLevel(ch.id)}));
    prepareTrial(all[0]);
    ['himiko','kiyomori','nobunaga'].forEach(id=>deploy(id));
    B.gauge=GAUGE_MAX;B.trial.phase='charge';fireHissatsu('nobunaga','ichigeki');
    const earlyNotCounted=!thirdChalOk();
    B.gauge=GAUGE_MAX;B.trial.phase='opening';B.trial.left=4;fireHissatsu('nobunaga','ichigeki');
    const punishCounted=thirdChalOk();
    hit(B.trial.boss,B.trial.boss.maxHp*100,false,'nobunaga');
    const punishStar=!!save.chal[all[0].id].nohis;
    state.stage=STAGES[0];B.hisCount=2;const oldLimit=!thirdChalOk();B.hisCount=1;const oldOne=thirdChalOk();
    const endCount=END_STAGES.length;
    const was=save.cleared.st10e;delete save.cleared.st10e;prepareTrial(all[9]);
    const cards=JSON.stringify(save.cards);hit(B.units.find(u=>u.kind==='base'),999999,false);
    const noLossReward=cards===JSON.stringify(save.cards)&&!save.cleared.st10e;
    save.cleared.st10e=was;persist();
    return {rows,skills,guarded,expired,deflect,openingDamage,pressureBoth,pressureCap,pressureShown,pressureReset,
      recruited,endCount,noLossReward,lastOpen:stageUnlocked(77),solo:B.units.every(u=>u.kind!=='minion'),earlyNotCounted,punishCounted,punishStar,oldLimit,oldOne};
  });
  for(const r of checks.rows){
    assert.deepEqual(r.phaseNames,['rest','charge','active','opening'],r.id);
    assert.ok(r.duplicate&&r.sameHp,r.id);
    assert.ok(r.lv>=40&&r.trained>=45&&r.max===50,r.id);
  }
  for(const r of checks.skills)assert.ok(r.did&&r.own,r.id);
  assert.ok(checks.guarded&&checks.expired&&checks.noLossReward&&checks.lastOpen&&checks.solo);
  assert.equal(checks.deflect,80);assert.equal(checks.openingDamage,1800);
  assert.ok(checks.pressureBoth&&checks.pressureCap&&checks.pressureShown&&checks.pressureReset,'受け流し・隙の倍率と闘志の表示・上限・再戦時の復元');
  assert.equal(checks.endCount,51);
  assert.ok(checks.recruited.every(c=>c.lv===50));
  assert.ok(checks.earlyNotCounted&&checks.punishCounted&&checks.punishStar&&checks.oldLimit&&checks.oldOne,'5の隙のめあてと、1〜4の必殺1回までを分ける');
  console.log('PASS: 10人の予告・技・隙、再戦育成、二重報酬防止、敗北時報酬なし、仲間の固有技、効果の期限、既存エンディング維持');

  await page.reload({waitUntil:'networkidle'});
  assert.deepEqual(await page.evaluate(()=>({got:LEGENDS.filter(c=>ownedTotal(c.id)>0).length,gold:save.gold.himiko,custom:save.custom})),{got:10,gold:true,custom:'keep'});
  const viewports=[['ipad-landscape',1180,820],['ipad-portrait',768,1024],['phone',390,844],['phone-small',320,740]];
  for(const [label,width,height] of viewports){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>openStage(STAGES.find(s=>s.id==='st9e')));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),label+' formation');
    await page.click('#btn-fight');await page.waitForFunction(()=>B&&B.W>0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),label+' battle');
    await page.screenshot({path:path.join(outputs,'battle-'+label+'.png')});
    await page.evaluate(()=>hit(B.trial.boss,B.trial.boss.maxHp*100,false,'nobunaga'));
    assert.ok(await page.locator('#b-overlay button').first().isVisible());
    const button=await page.locator('#b-overlay button').first().boundingBox();
    assert.ok(button.y>=0&&button.y+button.height<=height,label+' victory action');
    await page.screenshot({path:path.join(outputs,'win-'+label+'.png')});
    await page.evaluate(()=>{goHome();renderCards();});
    assert.equal(await page.locator('.card-mini.legend-card').count(),10);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),label+' cards');
  }
  console.log('PASS: iPad横・縦／390px・320pxで編成・戦闘・勝利・図鑑が画面内');

  // 使った絵をSWに保存し、通信を切って再読み込み・名将戦を開始する。
  await page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    const files=[];
    LEGENDS.forEach(ch=>POSES.forEach(p=>files.push('images/chars/'+ch.id+'/'+p+'.webp?v='+ASSET_V)));
    await Promise.all(files.map(async file=>{
      const response=await fetch(file);if(!response.ok)throw new Error(file);
      await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve();im.onerror=()=>reject(new Error(file));im.src=file;});
    }));
    const keys=await caches.keys();if(!keys.includes('rekishi-cache-v17'))throw new Error('SW not updated');
  });
  await page.waitForTimeout(300);
  await context.setOffline(true);await page.reload({waitUntil:'load'});
  assert.equal(await page.evaluate(()=>STAGES.length),78);
  await page.evaluate(()=>{openStage(STAGES.find(s=>s.id==='st10e'));startBattle();});
  await page.waitForFunction(()=>B&&B.trial&&B.trial.boss.el.classList.contains('has-sprite'));
  assert.equal(await page.evaluate(()=>ownedIds().length),52);
  assert.ok(await page.evaluate(()=>save.gold.himiko&&save.custom==='keep'));
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS: 40枚のスプライト、再起動、オフライン戦闘、画像404・JSエラーなし');
} finally {
  await browser.close();
}
