#!/usr/bin/env node
/* =====================================================================
   swing-audit.mjs — ふりこアクションの 面を ランダムに 自動プレイして たしかめる

   使い方:  node science-island/swing-audit.mjs [ためす回数]  ※ 回数が 少ないと
            いちばん むずかしい 面（せいこう率 0.05%くらい）を 見つけられず、
            まちがって「クリアできない」と 出る。**2万回 いじょう**で 走らせる こと。
   終了コード: クリアできない面あり=1 / なし=0

   なぜ要るか:
     アクションゲームは「解ける こたえ」を 数えあげられない。そこで
     **でたらめに あそぶ ロボット**を 何万回も 走らせて、
       ①そもそも ゴールできる 面か（できないなら 出題ミス）
       ②せいこう率（ひくすぎると 人には むずかしすぎる うたがい）
       ③**はじめの ボールの まま でも 解けて しまわないか**
         （解けて しまうなら「3つを つかいわける」に なって いない）
     を しらべる。お手本（ex）も ここで 見つけた そうさを みじかく した もの。
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const stubEl=new Proxy({},{get:(_,k)=>{if(k==='addEventListener'||k==='appendChild'||k==='setAttribute')return()=>{};if(k==='getContext')return()=>new Proxy({},{get:()=>()=>{}});if(k==='querySelector')return()=>null;if(k==='style'||k==='classList')return new Proxy({},{get:()=>()=>{},set:()=>true});return'';},set:()=>true});
globalThis.document={getElementById:()=>stubEl,addEventListener:()=>{}};
globalThis.window={addEventListener:()=>{},scrollTo:()=>{},innerWidth:800,innerHeight:600};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.alert=()=>{};globalThis.requestAnimationFrame=()=>{};
const A=new Function(fs.readFileSync(path.join(HERE,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]+
  '; return { swingInit, swingStep, swingGrab, swingRelease, swingSetW, swingSetR, swingSetL, swingNearHook, swingRun, SW_DT, SWW, swW, swR, swL };')();
const {swingInit,swingStep,swingGrab,swingRelease,swingSetW,swingSetR,swingSetL,swingNearHook,SW_DT,swW,swR,swL}=A;

/* mulberry32。まえの LCG は seed*1103515245 が 2^53 を こえて けたが おちて いた
   （みじかい くりかえしに なり、けっかが 走らせる たびに ばらついた）。 */
let seed=0x9E3779B9>>>0;
const rnd=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };

const tt=x=>Math.floor(x*1e4)/1e4;
function rollout(st,maxT=14){
  const s=swingInit(st), log=[];
  let hold=0;
  const lim=Math.round(maxT/SW_DT);
  for(let n=0;n<lim;n++){
    if(!s.hook){
      const h=swingNearHook(st,s);
      // フックが とどく なら たまに つかむ（すぐ／少し まって）
      if(h>=0 && rnd()<0.09){
        if(swingGrab(st,s)){
          log.push([tt(s.t),'g']);
          /* つかんだ ら おもさ／大きさを えらびなおす ことも ある */
          const ws=swW(st), rs=swR(st);
          if(rnd()<0.55){ const k=ws[Math.floor(rnd()*ws.length)]; if(swingSetW(st,s,k)) log.push([tt(s.t),'w:'+k]); }
          if(rnd()<0.25){ const k=rs[Math.floor(rnd()*rs.length)]; if(swingSetR(st,s,k)) log.push([tt(s.t),'r:'+k]); }
          const ls=swL(st);
          if(rnd()<0.4){ const k=ls[Math.floor(rnd()*ls.length)]; if(swingSetL(st,s,k)) log.push([tt(s.t),'L:'+k]); }
          hold=0.10+rnd()*1.5;
        }
      }
    } else {
      hold-=SW_DT;
      // 前むきに 上がって いる ときに はなす と よく 飛ぶ
      const good=(s.vx>40&&s.vy<40);
      if(hold<=0 && (good||rnd()<0.02)){ swingRelease(s); log.push([tt(s.t),'r']); }
    }
    swingStep(st,s,SW_DT);
    if(s.clear) return {ok:true,log,t:s.t};
    if(s.dead) return {ok:false};
  }
  return {ok:false};
}
/* 見つけた そうさを できるだけ みじかく する（お手本が 長いと 子どもが 見て いられない）。
   1つずつ 取りのぞいて みて、それでも クリアできるなら いらなかった、と いう こと。 */
function minimize(st,log){
  let cur=log.slice(), changed=true;
  while(changed){
    changed=false;
    for(let i=0;i<cur.length;i++){
      const t=cur.slice(0,i).concat(cur.slice(i+1));
      if(A.swingRun(st,t,16).clear){ cur=t; changed=true; break; }
    }
  }
  return cur;
}
function search(st,tries=40000){
  let best=null,hits=0;
  for(let i=0;i<tries;i++){
    const r=rollout(st);
    if(r.ok){ hits++; if(!best||r.log.length<best.log.length||(r.log.length===best.log.length&&r.t<best.t)) best=r; }
  }
  if(best){
    if(!A.swingRun(st,best.log,18).clear) return {best:null,hits,tries,replayFail:true};
    best.log=minimize(st,best.log);
    const chk=A.swingRun(st,best.log,18);
    if(!chk.clear) return {best:null,hits,tries,replayFail:true};
    best.t=chk.t;
  }
  return {best,hits,tries};
}
/* **その面は ほんとうに 3つの ボールが いるのか。**
   ボールを 1つに しばって（入れかえ なし）解けて しまうなら、その面は
   「1つだけで クリアできる」＝ ユーザーの ねらい（3つを つかいわける）に なって いない。 */
function soloCheck(st,tries){
  const r={};
  swW(st).forEach(k=>{
    const one=Object.assign({},st,{weights:[k],w0:k});
    let ok=false;
    for(let i=0;i<tries&&!ok;i++) ok=rollout(one).ok;
    r[k]=ok;
  });
  return r;
}
/* ほんとうに 大事な のは「**はじめの ボールの まま**（入れかえ なし）で 解けて しまわないか」。
   解けて しまうなら、その面で ボールを かえる 意味が ない。 */
function noSwapCheck(st,tries){
  const one=Object.assign({},st,{weights:[st.w0]});
  for(let i=0;i<tries;i++) if(rollout(one).ok) return true;
  return false;
}
/* **大きさ**を かえなくても 解けて しまわないか。
   「せまい すきま」の 面は、小さく しないと 通れない のが ねらい。 */
function noSizeCheck(st,tries){
  const one=Object.assign({},st,{sizes:[st.r0]});
  for(let i=0;i<tries;i++) if(rollout(one).ok) return true;
  return false;
}
const G=new Function(fs.readFileSync(path.join(HERE,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]+'; return gameById;')();
const levels=G('energy-swing').stages;
const out=[];
levels.forEach((st,i)=>{
  const {best,hits,tries}=search(st, +(process.argv[2]||24000));
  if(!best){ console.log(`❌ [${i+1}] ${st.memo||''} … クリアできる そうさが 見つからない（${tries}回 ためした）`); out.push(null); return; }
  const rate=(hits/tries*100).toFixed(2);
  const T=Math.round((+(process.argv[2]||24000))/2);
  const solo=soloCheck(st,T), soloOK=Object.keys(solo).filter(k=>solo[k]);
  const noSwap=noSwapCheck(st,T), noSize=noSizeCheck(st,T);
  const need=(noSwap?'':'★おもさ必須 ')+(noSize?'':'★大きさ必須 ')+
    ((noSwap&&noSize)?`（おもさも 大きさも かえずに 解ける：はじめ=${st.w0}g/${st.r0}）`
                    :`（1つの おもさだけで 解けるのは ${soloOK.join('g・')||'なし'}）`);
  console.log(`✅ [${i+1}] ${st.memo||''} … せいこう率 ${rate}%  そうさ${best.log.length}回  ${best.t.toFixed(1)}びょう  ${need}`);
  console.log(`      お手本: ${JSON.stringify(best.log)}`);
  out.push(best.log);
});
if(process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(out));
const ng=out.filter(x=>!x).length;
console.log('\n----------------------------------------------------------------');
console.log(ng?`結果: ❌ クリアできない 面 ${ng}件`:'結果: ✅ どの 面も クリアできる（ランダムに 自動プレイして たしかめた）');
process.exit(ng?1:0);
