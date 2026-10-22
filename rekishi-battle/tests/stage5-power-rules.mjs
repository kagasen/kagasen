// 10試練の禁止道具: 表示・ボタン・実処理と旧面への影響を確認する。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const bundled=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||(fs.existsSync(bundled)?bundled:'playwright'));
const chrome=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({headless:true,...(fs.existsSync(chrome)?{executablePath:chrome}:{})});
try{
 const p=await browser.newPage({viewport:{width:768,height:1024}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.BASE_URL||'http://127.0.0.1:8879/rekishi-battle/')+'?trial=stage5',{waitUntil:'networkidle'});
 const checks=await p.evaluate(()=>{
  requestAnimationFrame=function(){return 0;};SND_ON=false;BGM_ON=false;popup=function(){};cutIn=function(){};
  window.prepareRuleTest=function(st){
   openStage(st);startBattle();B.W=$('bfield').clientWidth;B.groundY=$('bfield').clientHeight*.15;
   spawnBase();const boss=spawnEnemy(bsDef(st),'boss');if(isLegendStage(st))trialBossStart(boss);
   buildDeployRow();buildPowerRow();const a=spawnAlly(CHAR_BY_ID.nobunaga);a.hp=a.maxHp/2;
   a.x=boss.x-10;B.money=2000;
  };
  const direct={yumi:()=>fireArrow(B.W-150,100),tetsuhau:()=>throwBomb(B.W-150),hi:()=>lightFire(100,180),
   kaminari:()=>{dropKaminari(B.trial.boss.x);fireKaminari(B.trial.boss.x);},saku:()=>placeWall(200),
   hata:()=>placeFlag(200),nengu:()=>giveNengu(B.units.find(u=>u.kind==='ally').x),
   ame:()=>usePower('ame'),kikin:()=>usePower('kikin'),kaze:()=>{usePower('kaze');blowKaze();}};
  function snapshot(){return JSON.stringify({money:B.money,cds:B.powCds,aim:B.aimMode,
   units:B.units.map(u=>[u.kind,u.hp,u.x,u.inv||0]),arrows:B.arrows.length,bombs:B.bombs.length,
   fires:B.fires.length,flag:!!B.flag,eff:B.eff,spawn:B.spawnT});}
  const rows=[];
  for(const st of STAGES.filter(isLegendStage)){
   openStage(st);const formation=$('hs-info').textContent.includes(POW_BY_ID[st.blockedPowers[0]].name+'は つかえない');
   prepareRuleTest(st);const id=st.blockedPowers[0],pb=B.pwBtns.find(p=>p.id===id),before=snapshot();
   pb.el.click();usePower(id);direct[id]();
   const stopped=before===snapshot();
   const banner=$('power-rule').textContent.includes(POW_BY_ID[id].name+'は つかえない');
   const unblocked=POWERS.filter(p=>p.id!==id).every(p=>powerAllowed(p.id));
   const disabled=pb.el.disabled&&pb.el.textContent.includes('つかえない')&&pb.el.classList.contains('banned');
   // 待ち時間・所持金の更新が、禁止ボタンを光らせたり有効にしたりしない。
   B.last=performance.now();tick(B.last+50);
   const staysBlocked=pb.el.disabled&&!pb.el.classList.contains('ok');
   rows.push({id:st.id,ban:id,formation,stopped,banner,unblocked,disabled,staysBlocked});
  }
  const old=[];
  for(const power of POWERS){
   prepareRuleTest(STAGES[0]);
   const a=B.units.find(u=>u.kind==='ally');
   const before=B.money;
   if(power.id==='kaminari')dropKaminari(B.units.find(u=>u.kind==='boss').x);
   else if(power.id==='nengu')giveNengu(a.x);
   else if(power.id==='yumi')fireArrow(B.W-150,100);
   else if(power.id==='tetsuhau')throwBomb(B.W-150);
   else if(power.id==='hi')lightFire(100,180);
   else if(power.id==='saku')placeWall(200);
   else if(power.id==='hata')placeFlag(200);
   else usePower(power.id);
   old.push({id:power.id,used:B.money<before,enabled:B.pwBtns.every(pb=>!pb.el.disabled),bannerHidden:$('power-rule').style.display==='none'});
  }
  return {rows,old,old68:STAGES.slice(0,68).every(st=>POWERS.every(p=>powerAllowed(p.id,st)))};
 });
 for(const row of checks.rows)for(const key of ['formation','stopped','banner','unblocked','disabled','staysBlocked'])assert.ok(row[key],row.id+' '+key);
 for(const row of checks.old)assert.ok(row.used&&row.enabled&&row.bannerHidden,row.id+' on old stage');
 assert.ok(checks.old68);
 fs.mkdirSync('tmp/rekishi5',{recursive:true});
 for(const width of [1180,768,390,320]){
  await p.setViewportSize({width,height:1024});
  await p.evaluate(()=>prepareRuleTest(STAGES.find(st=>st.id==='st9e')));
  assert.ok(await p.locator('[data-power="hata"]').isDisabled());
  assert.ok(await p.locator('#power-rule').isVisible());
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.screenshot({path:'tmp/rekishi5/power-rules-'+width+'.png'});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: 10種類の制限表示・無効ボタン・直接発動防止・資金不変・更新後も無効・旧68面の全10道具が使用可能・4画面幅・JSエラーなし');
}finally{await browser.close();}
