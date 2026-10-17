// node hissan-fever/tests/music.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fn(name){const a=html.indexOf('function '+name+'('),line=html.indexOf('\n',a),b=html.indexOf('\n}',a);assert(a>=0,name);return html.slice(a,html.slice(a,line).endsWith('}')?line:b+2);}
const elements=Object.fromEntries(['bgmNow','bgmTrack','bgmInfo','homeNow','homeYt','homeNext'].map(id=>[id,{textContent:'',value:'',innerHTML:''}]));
const player={paused:true,ended:false,volume:1,currentTime:0,attrs:{},plays:0,loads:0,pauses:0,getAttribute(k){return this.attrs[k]||null},setAttribute(k,v){this.attrs[k]=v},load(){this.loads++;this.currentTime=0;this.ended=false},play(){this.plays++;this.paused=false;return Promise.resolve()},pause(){this.pauses++;this.paused=true}};
let connections=0;const gain=()=>({value:null,setTargetAtTime(v){this.value=v}});
const ctx={console,Number,Math,S:{sound:true,musicVolume:35,effectVolume:70,bgmTrack:'auto'},G:{P:{sk:'s'}},SK:{s:{g:2}},songPlayer:player,songNode:null,songIndex:0,songRequest:0,songStarting:false,songError:false,musicVoices:[],overlayHidden:true,
 document:{hidden:false,getElementById:id=>elements[id],addEventListener(t,f){ctx.listeners[t]=f}},listeners:{},$(){return {classList:{contains:()=>ctx.overlayHidden}}},save(){ctx.saves++},saves:0,AC:{currentTime:0,createMediaElementSource(){connections++;return {connect(){}}}},audioMaster:{gain:gain()},musicBus:{gain:gain()},effectBus:{gain:gain()},ac(){return ctx.AC}};
vm.createContext(ctx);vm.runInContext(html.match(/var BGM_SONGS = \[[\s\S]*?\n\];/)[0],ctx);
for(const name of ['musicAllowed','applySongVolume','updateMusicLabel','setSong','prepareMusic','startMusic','stopMusic','initMusic','syncAudio'])vm.runInContext(fn(name),ctx);
ctx.initMusic();assert.equal((elements.bgmTrack.innerHTML.match(/<option/g)||[]).length,4);
ctx.prepareMusic();ctx.startMusic();await Promise.resolve();assert.equal(player.attrs['data-track'],'kuku');assert.equal(player.paused,false);assert.equal(connections,1);ctx.syncAudio();assert.equal(ctx.musicBus.gain.value,.35);assert.equal(ctx.effectBus.gain.value,.7);assert.equal(player.volume,1);
player.currentTime=12;ctx.G.paused=true;ctx.stopMusic();assert(player.paused);ctx.G.paused=false;ctx.startMusic();await Promise.resolve();assert.equal(player.currentTime,12);assert.equal(connections,1);
ctx.S.sound=false;ctx.stopMusic();ctx.syncAudio();ctx.startMusic();assert(player.paused);assert.equal(ctx.audioMaster.gain.value,0);
ctx.S.sound=true;ctx.S.musicVolume=0;ctx.syncAudio();ctx.startMusic();assert(player.paused);assert.equal(ctx.musicBus.gain.value,0);assert.equal(ctx.effectBus.gain.value,.7);
ctx.S.musicVolume=35;ctx.startMusic();await Promise.resolve();player.onended();await Promise.resolve();assert.equal(player.attrs['data-track'],'formula');player.onended();await Promise.resolve();assert.equal(player.attrs['data-track'],'kumowa');player.onended();await Promise.resolve();assert.equal(player.attrs['data-track'],'kuku');
for(const [plays,id] of [[1,'kuku'],[2,'formula'],[3,'kumowa']]){ctx.S.plays=plays;ctx.prepareMusic();assert.equal(player.attrs['data-track'],id);}
elements.bgmTrack.value='formula';elements.bgmTrack.onchange();await Promise.resolve();assert.equal(ctx.S.bgmTrack,'formula');player.currentTime=45;player.onended();await Promise.resolve();assert.equal(player.currentTime,0);assert.equal(player.attrs['data-track'],'formula');assert.equal(ctx.saves,1);
ctx.G.musicDone=true;ctx.stopMusic();ctx.startMusic();assert(player.paused);ctx.G.musicDone=false;
ctx.document.hidden=true;ctx.stopMusic();ctx.startMusic();assert(player.paused);ctx.document.hidden=false;
player.onerror();assert(ctx.songError);assert(elements.bgmNow.textContent.includes('よみこめません'));ctx.prepareMusic();assert.equal(ctx.songError,false);
ctx.songNode=null;ctx.AC=null;ctx.applySongVolume();assert(Math.abs(player.volume-.252)<1e-8);
// 遅れて解決する古いplay()が新しい再生を止めないこと。
const pending=[];player.play=function(){this.plays++;this.paused=false;return new Promise(resolve=>pending.push(resolve))};ctx.stopMusic();ctx.startMusic();ctx.stopMusic();ctx.startMusic();pending[0]();await Promise.resolve();assert.equal(player.paused,false);ctx.G.paused=true;pending[1]();await Promise.resolve();assert.equal(player.paused,true);
// ホーム（G=null）でも ながれ、YouTube の リンクと「つぎの きょく」が うごくこと。
ctx.G=null;ctx.stopMusic();ctx.S.bgmTrack='auto';ctx.setSong(0,true);assert.equal(elements.homeYt.href,'https://www.youtube.com/watch?v=EgWja7KAGRI');assert.equal(elements.homeNow.textContent,'♫ 九九くる');
player.play=function(){this.plays++;this.paused=false;return Promise.resolve()};ctx.listeners.pointerdown();await Promise.resolve();assert.equal(player.paused,false);
elements.homeNext.onclick();await Promise.resolve();assert.equal(player.attrs['data-track'],'formula');assert.equal(player.paused,false);assert(elements.homeYt.href.endsWith('LaDycwkqsv4'));
ctx.S.bgmTrack='formula';elements.homeNext.onclick();await Promise.resolve();assert.equal(ctx.S.bgmTrack,'kumowa');assert(elements.homeYt.href.endsWith('wVluS0ZZIpc'));
player.onended();await Promise.resolve();assert.equal(player.attrs['data-track'],'kumowa');assert.equal(player.paused,false);
ctx.S.sound=false;ctx.stopMusic();ctx.listeners.pointerdown();assert(player.paused);ctx.S.sound=true;
let total=0;const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
for(const song of ctx.BGM_SONGS){const p=new URL('../'+song.src.split('?')[0],import.meta.url);assert(fs.statSync(p).size>1000000);total+=fs.statSync(p).size;assert(sw.includes(song.src));}
assert(total<10000000);
console.log('BGMテストOK: 3曲の選択/順送り/リピート、ミュート、独立音量、停止/続きから再開、非表示/結果停止、再生中断の競合、ホームでの再生・YouTubeリンク・つぎのきょく、同梱音源 '+total+' bytes');
