// 記録を上書きしないLv50おためしモード。ユーザーとは別の保存領域で確認する。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const bundled=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||(fs.existsSync(bundled)?bundled:'playwright'));
const chrome=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({headless:true,...(fs.existsSync(chrome)?{executablePath:chrome}:{})});
const base=process.env.BASE_URL||'http://127.0.0.1:8879/rekishi-battle/';
const key='rekishiBattle.save.v1';
const seed={ver:1,cards:{himiko:{n:2,r:0,sr:0},shotoku:{n:1,r:0,sr:0},nobunaga:{n:3,r:0,sr:0}},deck:['himiko','shotoku','nobunaga'],cleared:{st1:true},gold:{himiko:true},custom:'keep-original',sound:false,bgm:false};
try{
 const context=await browser.newContext({viewport:{width:768,height:1024}});
 await context.addInitScript(({seed,key})=>{
  if(!localStorage.getItem('stage5-trial-test-seeded')){
   localStorage.setItem(key,JSON.stringify(seed));localStorage.setItem('rekishi-backup-test','keep-backup');
   localStorage.setItem('stage5-trial-test-seeded','1');
  }
 },{seed,key});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'?trial=stage5',{waitUntil:'networkidle'});
 assert.ok(await p.locator('#trial-notice').isVisible());
 assert.equal(await p.locator('#btn-backup').isVisible(),false);
 assert.equal(await p.locator('.stage-btn:enabled').count(),10);
 assert.equal(await p.locator('.stage-btn').count(),10);
 assert.ok(await p.evaluate(()=>STAGE5_TRIAL&&ownedIds().length===42&&CHARS.every(ch=>charLevel(ch.id)===50)&&save.custom===undefined));
 for(const width of [768,390,320]){
  await p.setViewportSize({width,height:1024});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await p.setViewportSize({width:768,height:1024});
 fs.mkdirSync('tmp/rekishi5',{recursive:true});
 await p.screenshot({path:'tmp/rekishi5/trial-home.png'});
 await p.locator('.stage-btn').last().click();await p.click('#btn-fight');
 await p.waitForFunction(()=>B&&B.trial&&B.W>0);
 assert.equal(await p.evaluate(()=>state.stage.id),'st10e');
 await p.locator('.dep-btn').filter({hasText:'織田信長'}).click();
 assert.ok(await p.evaluate(()=>onField('nobunaga')&&charLevel('nobunaga')===50));
 await p.click('#tb-back');
 await p.locator('.stage-btn').first().click();await p.click('#btn-fight');
 await p.waitForFunction(()=>B&&B.trial&&B.W>0);
 await p.evaluate(()=>hit(B.trial.boss,B.trial.boss.maxHp*100,false,'nobunaga'));
 assert.ok(await p.evaluate(()=>charLevel('legend_mitsunari')===40&&save.cleared.st1e));
 assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),JSON.stringify(seed));
 assert.equal(await p.evaluate(()=>localStorage.getItem('rekishi-backup-test')),'keep-backup');
 await p.reload({waitUntil:'networkidle'});
 assert.ok(await p.evaluate(()=>!ownedTotal('legend_mitsunari')&&!save.cleared.st1e));
 await p.locator('#trial-notice a').click();await p.waitForURL(url=>!url.search);
 assert.ok(await p.evaluate(()=>!STAGE5_TRIAL&&charLevel('himiko')===2&&charLevel('nobunaga')===3&&save.custom==='keep-original'&&save.gold.himiko));
 assert.equal(await p.locator('.stage-btn').count(),78);
 assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),JSON.stringify(seed));
 assert.ok(await p.locator('#btn-backup').isVisible());
 assert.deepEqual(errors,[]);
 await context.close();
 const fresh=await browser.newContext();const q=await fresh.newPage();
 await q.goto(base+'?trial=stage5',{waitUntil:'networkidle'});
 await q.evaluate(()=>{save.sound=true;persist();});
 assert.equal(await q.evaluate(key=>localStorage.getItem(key),key),null);
 await q.locator('#trial-notice a').click();await q.waitForURL(url=>!url.search);
 assert.ok(await q.evaluate(()=>!STAGE5_TRIAL&&ownedIds().length===0&&save.starterQ.length===3));
 await fresh.close();
 console.log('PASS: 42人Lv50・10試練選択・実ボタン出撃・加入は一時的・旧記録とバックアップ不変・通常モード復帰・初回プレイ不変・3画面幅・JSエラーなし');
}finally{await browser.close();}
