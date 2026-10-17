// node hissan-fever/tests/world-map.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const c={S:{journey:{world:0}},worldMapRegion:'all'};vm.createContext(c);
vm.runInContext(fs.readFileSync(new URL('../assets/world-map.js',import.meta.url),'utf8'),c);
vm.runInContext(html.match(/var WORLD_TRIP = \[[\s\S]*?\n\];/)[0],c);
function fn(name){const start=html.indexOf('function '+name+'('),end=html.indexOf('\n}',start);assert(start>=0&&end>start,name);return html.slice(start,end+2);}
for(const name of ['worldMapViewBox','worldMapSVG','worldMapHTML'])vm.runInContext(fn(name),c);
const data=c.HISSAN_WORLD_MAP;
assert.equal(Object.keys(data.paths).length,196);assert.equal(Object.keys(data.centers).length,196);
for(const stop of c.WORLD_TRIP){assert(data.paths[stop[3]],stop[3]);assert(data.centers[stop[3]].every(Number.isFinite));assert(['asia','europe','africa','namerica','samerica','oceania'].includes(data.regions[stop[3]]));}
for(const id of ['VA','XK','CK','NU','JP'])assert(data.paths[id]);
for(const id of ['CK','NU'])assert(data.small.includes(id));
for(const n of [0,1,24,25,100,193,194,195,196]){
 c.S.journey.world=n;const before=JSON.stringify(c.S);const svg=c.worldMapSVG('all');
 const groups=Array.from(svg.matchAll(/<g data-world-code="([A-Z]{2})" data-visit="(visited|next|later)">/g));
 assert.equal(groups.length,196);assert.equal(new Set(groups.map(x=>x[1])).size,196);
 assert.equal(groups.filter(x=>x[2]==='visited').length,n);assert.equal(groups.filter(x=>x[2]==='next').length,n===196?0:1);
 for(let i=0;i<196;i++){assert.equal(groups[i][1],c.WORLD_TRIP[i][3]);assert.equal(groups[i][2],i<n?'visited':i===n?'next':'later');}
 assert(svg.includes('たびした '+n+'か国'));assert.equal(before,JSON.stringify(c.S));
}
c.S.journey.world=24;const svg=c.worldMapSVG('all');
assert(/data-world-code="KR" data-visit="visited"><title>[^<]*<\/title><path [^>]*fill="#E6A66A"/.test(svg));
assert(/data-world-code="MN" data-visit="next"><title>[^<]*<\/title><path [^>]*fill="#FFDB73"/.test(svg));
assert(/data-world-code="JP" data-visit="later"><title>[^<]*<\/title><path [^>]*fill="#D9DDD6"/.test(svg));
for(let n=0;n<196;n++){
 c.S.journey.world=n;const box=c.worldMapViewBox('next').split(' ').map(Number);assert.equal(box.length,4);assert(box.every(Number.isFinite));assert(box[2]>0&&box[3]>0);
}
for(const view of ['all','asia','europe','africa','namerica','samerica','oceania','invalid']){const box=c.worldMapViewBox(view).split(' ').map(Number);assert(box.every(Number.isFinite));assert(box[2]>0&&box[3]>0);}
c.S.journey.world=196;c.worldMapRegion='next';assert(c.worldMapHTML().includes('196 / 196'));assert.equal(c.worldMapRegion,'all');
assert(html.includes('assets/world-map.js?v=1'));assert(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8').includes('assets/world-map.js?v=1'));
console.log('世界地図テストOK: 全196か国の形/位置・訪問数と国の塗り分け・小国63か国・全行き先の拡大・記録非変更・オフライン同梱');
