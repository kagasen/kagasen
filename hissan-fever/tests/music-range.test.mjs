// node hissan-fever/tests/music-range.test.mjs — オフライン音源の途中読み込み
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');const bytes=Uint8Array.from({length:20},(_,i)=>i);let cached=true,fetched=0,stored=0;
const response=()=>new Response(bytes,{headers:{'Content-Type':'audio/mp4'}});
const c={Request,Response,Number,CACHE:'test',caches:{match:async()=>cached?response():undefined,open:async()=>({put:async()=>{stored++}})},fetch:async()=>{fetched++;return response()}};
vm.createContext(c);vm.runInContext(code.slice(code.indexOf('async function serveSongRange')),c);
const get=range=>c.serveSongRange(new Request('https://example.test/assets/bgm/song.m4a?v=1',{headers:{Range:range}}));
for(const [range,start,end]of[['bytes=0-1',0,1],['bytes=5-9',5,9],['bytes=10-',10,19],['bytes=-4',16,19],['bytes=18-100',18,19]]){
 const r=await get(range);assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),`bytes ${start}-${end}/20`);assert.equal(r.headers.get('Content-Length'),String(end-start+1));assert.equal(r.headers.get('Content-Type'),'audio/mp4');assert.deepEqual(new Uint8Array(await r.arrayBuffer()),bytes.slice(start,end+1));
}
assert.equal(fetched,0);
for(const range of ['bytes=20-','bytes=999-','bytes=10-4','bytes=-0','bytes=-','bytes=0-1,5-6','invalid']){const r=await get(range);assert.equal(r.status,416);assert.equal(r.headers.get('Content-Range'),'bytes */20');}
cached=false;assert.equal((await get('bytes=0-1')).status,206);await Promise.resolve();assert.equal(fetched,1);assert.equal(stored,1);
console.log('音源RangeテストOK: キャッシュだけで再生可能、先頭/途中/末尾/開区間/不正範囲、ネット取得とキャッシュ保存');
