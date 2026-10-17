import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const source=html.match(/<script>\s*\(function\(\)\{([\s\S]*?)\}\)\(\);\s*<\/script>/)[1];
function fn(name){const start=source.indexOf('function '+name+'(');assert(start>=0,name);const end=source.indexOf('\n}',start);const lineEnd=source.indexOf('\n',start);return source.slice(start, source.slice(start,lineEnd).endsWith('}') ? lineEnd : end+2);}
const store=new Map();let now=0,timers=[];const elements=new Map();
const el=()=>({innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},contains(){return true}},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}});
const ctx={console,Number,Math,JSON,isFinite,Array,Object,Date:{now:()=>now},SAVE_KEY:'test',WORLD_TOTAL:196,WORLD_STAMP_PAGE:28,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},COIN_REWARDS:[0,10,20,35,50,70,100],CLEAR_WAIT:450,NOTE_WAIT:900,EXTRA_WAIT:350,OLD_KEY:{'tasu-1':'h-tasu1'},SK:{'h-tasu1':{g:2,cat:'tasu'},'a-tasu2':{g:1,cat:'tasu'}},document:{querySelectorAll:()=>[]},$:(id)=>{if(!elements.has(id))elements.set(id,el());return elements.get(id)},setTimeout:(fn,ms)=>timers.push({fn,at:now+ms}),syncWallet(){},ac(){},sfx:{clear(){},fanfare(){}},mascot(){},ring(){},burst(){},cannons(){},rain(){},coins(){},ribbons(){},edgeGlow(){},banner(){},pick:a=>a[0],PRAISE:['やったね'],record(){ctx.records++},records:0,updateStats(){},startQ(){ctx.started++},started:0,baseDone(){ctx.completed++},completed:0,goTitle(){},showTravel(route,msg){ctx.travelShown={route,msg}},travelView:'japan'};
vm.createContext(ctx);
vm.runInContext(source.match(/var BGM_SONGS = \[[\s\S]*?\n\];/)[0],ctx);
vm.runInContext(source.slice(source.indexOf('var JAPAN_TRIP'),source.indexOf('function tripCost')),ctx);
vm.runInContext(fs.readFileSync(new URL('../assets/japan-map.js', import.meta.url),'utf8'),ctx);
for(const name of ['japanMapHTML','load','save','tripCost','activeTrip','rewardQuestion','buyTrip','afterGame','qClear'])vm.runInContext(fn(name),ctx);
function advance(ms){const target=now+ms;while(true){timers.sort((a,b)=>a.at-b.at);if(!timers.length||timers[0].at>target)break;const t=timers.shift();now=t.at;t.fn()}now=target;}
ctx.S=ctx.load();
for(const n of [0,1,13,46,47]){ctx.S.journey.japan=n;const m=ctx.japanMapHTML();assert.equal((m.match(/data-visit="visited"/g)||[]).length,n);assert.equal((m.match(/data-visit="next"/g)||[]).length,n===47?0:1);assert.equal((m.match(/data-code=/g)||[]).length,47);}
ctx.S.journey.japan=0;assert.equal(ctx.S.coins,0);assert.equal(ctx.S.journey.japan,0);
for(let g=1;g<=6;g++){ctx.SK.skill={g};ctx.G={kind:'play',P:{sk:'skill'},earned:0,qRewarded:false};const before=ctx.S.coins;assert.equal(ctx.rewardQuestion(),[0,10,20,35,50,70,100][g]);assert.equal(ctx.S.coins,before+ctx.COIN_REWARDS[g]);assert.equal(ctx.rewardQuestion(),0)}
ctx.G={kind:'demo',P:{sk:'skill'},earned:0,qRewarded:false};assert.equal(ctx.rewardQuestion(),0);
const legacy={best:{'tasu-1':{score:100,time:1234,nomiss:true}},rank:{'tasu-1':4},maxUnit:5,plays:8,last:{course:'tasu',lv:1},stat:{sample:{n:9,m:1,r:'111'}},note:[{sk:'h-tasu1',t:'example'}],sound:false};store.set('test',JSON.stringify(legacy));ctx.S=ctx.load();assert.equal(ctx.S.best['h-tasu1'].score,100);assert.equal(ctx.S.rank['h-tasu1'],4);assert.equal(ctx.S.stat.sample.n,9);assert.equal(ctx.S.note.length,1);assert.equal(ctx.S.coins,0);
for (const route of ['japan','world']) { for(let i=1;i<(route==='japan'?47:196);i++) assert(ctx.tripCost(route,i)>ctx.tripCost(route,i-1)); }
assert.equal(ctx.JAPAN_TRIP.length,47);assert.equal(new Set(ctx.JAPAN_TRIP.map(d=>d[1])).size,47);assert.equal(ctx.WORLD_TRIP.length,196);assert.equal(new Set(ctx.WORLD_TRIP.map(d=>d[1])).size,196);

const oldOrder = ['KR','CN','VN','TH','SG','IN','AE','EG','KE','ZA','TR','GR','IT','CH','DE','FR','ES','GB','CA','US','MX','PE','BR','AU'];
assert.deepEqual(Array.from(ctx.WORLD_TRIP.slice(0,24),d=>d[3]),oldOrder);
assert.equal(new Set(ctx.WORLD_TRIP.map(d=>d[3])).size,196);
const codes=new Set(ctx.WORLD_TRIP.map(d=>d[3]));
for(const id of ['VA','XK','CK','NU','JP'])assert(codes.has(id),id);
for(const id of ['KP','PS','TW'])assert(!codes.has(id),id);
assert.equal(ctx.WORLD_TRIP[195][3],'JP');
for(const n of [0,1,23,24,25,195,196]){
 store.set('test',JSON.stringify({...legacy,v:3,coins:123456,journey:{japan:47,world:n}}));
 const migrated=ctx.load();assert.equal(migrated.journey.world,n);assert.equal(migrated.coins,123456);assert.equal(migrated.best['h-tasu1'].score,100);
}
for(let i=0;i<24;i++)assert.equal(ctx.tripCost('world',i),Math.round(10000*Math.pow(1.12,i)/10)*10);
assert.equal(ctx.tripCost('world',195),1133120);
for(let i=0;i<196;i++)assert(Number.isSafeInteger(ctx.tripCost('world',i)));
store.set('test',JSON.stringify(legacy));ctx.S=ctx.load();

assert.equal(ctx.S.bgmTrack,'auto');
for(const [saved,expected] of [['formula','formula'],['kumowa','kumowa'],['unknown','auto']]){store.set('test',JSON.stringify({...legacy,bgmTrack:saved}));assert.equal(ctx.load().bgmTrack,expected);}
ctx.G=null;ctx.S.coins=99;ctx.buyTrip('japan',0);assert.equal(ctx.S.journey.japan,0);assert.equal(ctx.S.coins,99);
ctx.S.coins=1000000000;let spent=0;for(let i=0;i<47;i++){const before=ctx.S.coins,cost=ctx.tripCost('japan',i);ctx.buyTrip('japan',i);assert.equal(ctx.S.coins,before-cost);assert.equal(ctx.S.journey.japan,i+1);ctx.buyTrip('japan',i);assert.equal(ctx.S.coins,before-cost);advance(650);spent+=cost;}
assert.equal(ctx.activeTrip(),'world');for(let i=0;i<196;i++){const before=ctx.S.coins,cost=ctx.tripCost('world',i);ctx.buyTrip('world',i);assert.equal(ctx.S.coins,before-cost);assert.equal(ctx.S.journey.world,i+1);advance(650);spent+=cost;}
assert.equal(ctx.load().journey.world,196);ctx.buyTrip('world',196);assert.equal(ctx.S.journey.world,196);
function newGame(kind='play',mode='base',note=false){ctx.G={kind,mode,lock:false,qRewarded:false,over:false,P:{sk:'h-tasu1',note},earned:0,combo:2,ok:0,exOk:0,qi:0,N:5,qMiss:true,qs:[]};}
ctx.S.coins=0;newGame();ctx.qClear(0,0);assert.equal(ctx.S.coins,20);assert.equal(ctx.records,1);ctx.qClear(0,0);assert.equal(ctx.S.coins,20);advance(449);assert.equal(ctx.started,0);advance(1);assert.equal(ctx.started,1);assert.equal(ctx.G.qi,1);
newGame('play','base',true);ctx.qClear(0,0);advance(899);assert.equal(ctx.G.qi,0);advance(1);assert.equal(ctx.G.qi,1);
newGame();ctx.qClear(0,0);const game=ctx.G;ctx.G=null;advance(450);assert.equal(game.qi,0);assert.equal(ctx.load().coins,60);
newGame();ctx.qClear(0,0);advance(100);ctx.G.paused=1;advance(1000);assert.equal(ctx.G.qi,0);ctx.G.paused=0;advance(450);assert.equal(ctx.G.qi,1);
ctx.genQ=()=>({sk:'h-tasu1'});newGame('play','ex');ctx.qClear(0,0);advance(349);assert.equal(ctx.G.exOk,1);assert.equal(ctx.G.qi,0);advance(1);assert.equal(ctx.G.qi,1);
newGame('play','ex');ctx.qClear(0,0);ctx.G.over=true;advance(350);assert.equal(ctx.G.qi,0);
console.log(JSON.stringify({ok:true,checks:['全6学年の報酬・二重付与防止','旧学習記録の移行と保存','47都道府県→196か国の解放・費用・再読込','残高不足・連打・制覇後の購入防止','450ms/説明900ms/EX350msの遷移','途中終了・一時停止・EX時間切れ'],totalTravelCost:spent}));
