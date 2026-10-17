// 世界地図の同梱データ生成。実行: node hissan-fever/build-world-map.mjs [sekai-o-mawarouのパス]
// 元形状: Natural Earth / Public Domain。既存アプリの生成物と同じ日本中心のミラー図法。
// 出力assets/world-map.jsは手編集しない。実行時は完全オフライン。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const source=process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(here,'../sekai-o-mawarou');
const m={}, c={}, trip={};
for(const [name,context] of [['map-data.js',m],['country-data.js',c]]){
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(source,name),'utf8'),context);
}
vm.createContext(trip);
vm.runInContext(fs.readFileSync(path.join(here,'index.html'),'utf8').match(/var WORLD_TRIP = \[[\s\S]*?\n\];/)[0],trip);
const geo=JSON.parse(fs.readFileSync(path.join(source,'.cache/ne50.geojson'),'utf8'));
const paths={},centers={},regions={},small=[];
function project(lon,lat){let x=lon-150;while(x< -180)x+=360;while(x>180)x-=360;return [x,-1.25*Math.log(Math.tan(Math.PI/4+.4*lat*Math.PI/180))*180/Math.PI];}
function dot(x,y){const r=1.1,k=r*.4142;return 'M'+[[-k,-r],[k,-r],[r,-k],[r,k],[k,r],[-k,r],[-r,k],[-r,-k]].map(p=>+(x+p[0]).toFixed(2)+' '+ +(y+p[1]).toFixed(2)).join('L')+'Z';}
for(const entry of trip.WORLD_TRIP){
 const code=entry[3];
 if(m.MAP_PATHS[code]){
  paths[code]=m.MAP_PATHS[code];centers[code]=m.MAP_CENTER[code];regions[code]=c.COUNTRIES[code].cont;
  if(m.MAP_SMALL.includes(code))small.push(code);
 }else{
  // クック諸島・ニウエも元のNatural Earthデータのラベル位置から描く。
  const f=geo.features.find(f=>f.properties.ISO_A2===code);
  if(!f)throw Error('地図データに国がありません: '+code);
  const point=project(f.properties.LABEL_X,f.properties.LABEL_Y);
  centers[code]=point.map(x=>+x.toFixed(2));paths[code]=dot(...point);regions[code]='oceania';small.push(code);
 }
 if(!paths[code]||!centers[code].every(Number.isFinite))throw Error('国の形か座標が不正: '+code);
}
if(Object.keys(paths).length!==196||new Set(trip.WORLD_TRIP.map(x=>x[3])).size!==196)throw Error('196か国が揃っていません');
// 旅の対象外の土地も背景に残す。
const excluded=Object.keys(m.MAP_PATHS).filter(code=>!paths[code]).map(code=>m.MAP_PATHS[code]).join('');
const data={viewBox:m.MAP_VIEWBOX,paths,centers,small,regions,other:m.MAP_OTHER+excluded};
fs.writeFileSync(path.join(here,'assets/world-map.js'),'// 自動生成: node hissan-fever/build-world-map.mjs\n// 地図: Natural Earth (Public Domain)。日本中心のミラー図法。小国は点で表示。\nvar HISSAN_WORLD_MAP = '+JSON.stringify(data)+';\n');
console.log('世界地図: '+Object.keys(paths).length+'か国 / 小国マーカー '+small.length+'か国');
