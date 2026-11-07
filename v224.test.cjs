'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const V=require('../public/v22-shared.js'),M=require('../public/maker-core.js');
const oldCosts={classic:[100,250],rally:[125,300],gt:[150,350],truck:[140,325],solstice:[180,400],moonlight:[195,425],nuker:[225,400],plane:[230,500],firetruck:[160,375],stick:[210,450],beast:[220,450],waterskidder:[200,425],micro:[180,400],vespera:[230,475],cruiser:[120,280],launcher:[210,450],ultra:[275,575],hover:[200,425],flappy:[240,500]};
test('V2.24 charges 25% more for all 38 upgrades, rounds up and preserves existing unlocks',()=>{
 for(const [id,costs]of Object.entries(oldCosts)){for(const level of [2,3])assert.equal(V.catalog[id][level].cost,Math.ceil(costs[level-2]*1.25));const g=V.normalize({owned:[id],upgrades:{[id]:3},levels:{[id]:2},iscoins:17});assert.equal(g.upgrades[id],3);assert.equal(g.levels[id],2);assert.equal(g.iscoins,17);V.chooseLevel(g,id,1);assert.equal(g.iscoins,17);}
 assert.equal(V.coinRespawn,180000);assert.equal(V.prices.flappy,705000);
});
function roadNear(c,roads){for(const road of roads)for(let i=0;i<road.samples.length;i++){const p=road.samples[i],q=road.samples[Math.min(i+1,road.samples.length-1)],dx=q.x-p.x,dz=q.z-p.z,t=Math.max(0,Math.min(1,((c.x-p.x)*dx+(c.z-p.z)*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(c.x-p.x-t*dx,c.z-p.z-t*dz)<=(p.width||road.width||8)/2+12)return true;}return false;}
test('all five main maps have the reduced count and true 40/60 geography, with rare roof/water tens',()=>{
 const source=require('../scripts/source-world.cjs'),built=require('../src/world-data.json');
 for(const id of ['islands','city','peaks','playplace','fern']){
  const {W,buildings,coins}=source(id),max=id==='playplace'?60:120;
  assert.equal(coins.length,max,id);assert.equal(coins.filter(c=>c.nearRoad).length,max*.4,id);
  assert.deepEqual(JSON.parse(JSON.stringify(coins)),(id==='islands'?built:built.maps[id]).coins,id+' client/server equality');
  const rare=coins.filter(c=>c.value===10);assert.equal(rare.length,Math.round(max*.02));
  for(const [i,c]of coins.entries()){
   assert.equal(roadNear(c,W.roads),c.nearRoad,id+' road classification');assert([1,5,10].includes(c.value));assert(c.id>=224000);
   for(const d of coins.slice(i+1))assert(Math.hypot(c.x-d.x,c.z-d.z)>=32-1e-8,id+' spacing');
   if(c.placement==='roof')assert(buildings.some(b=>Math.hypot(b.x-c.x,b.z-c.z)<.02&&Math.abs(b.y+b.h+.8-c.y)<.02),id+' roof height');
   else if(c.placement==='water'){assert(W.height(c.x,c.z)<-1);assert.equal(c.y,.8);}
   else assert(c.y>=W.height(c.x,c.z)+.7,id+' above ground');
  }
  assert(rare.every(c=>['roof','water'].includes(c.placement)),id+' rare placement');
 }
});
test('approved custom maps get deterministic reachable coins even without roads, buildings or water',()=>{
 const m=M.fresh(),a=M.worldData(m).coins,b=M.worldData(m).coins;assert.deepEqual(a,b);assert.equal(a.length,120);assert(a.every(c=>c.value===10||c.value===1||c.value===5));assert.equal(a.filter(c=>c.value===10).length,2);assert(a.every(c=>Math.abs(c.x)<m.size/2-5&&Math.abs(c.z)<m.size/2-5));
 const empty=V.coins('empty',[],[],()=>-5,{minX:-100,maxX:100,minZ:-100,maxZ:100});assert.equal(empty.length,2);assert(empty.every(c=>c.value===10&&c.placement==='water'));
});
test('new layout cannot be hidden by old numerical coin IDs and never exceeds its map budget',()=>{
 const road={width:8,samples:Array.from({length:121},(_,i)=>({x:-1800+i*30,z:0,y:1}))},args=['test',[road],[],()=>1,{minX:-2000,maxX:2000,minZ:-2000,maxZ:2000}],a=V.coins(...args);assert.deepEqual(a,V.coins(...args));assert.equal(a.length,120);assert.equal(a.filter(c=>c.nearRoad).length,48);assert.equal(new Set(a.map(c=>c.id)).size,120);assert(a.every(c=>c.id>159));
});
test('release entry points and offline export have no soundtrack dependency',()=>{
 const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');assert.match(html,/V2\.24/);assert(!/menu-music|elektronomia/.test(html));assert(!/elektronomia/.test(fs.readFileSync(path.join(root,'scripts/build-offline.cjs'),'utf8')));const manifest=JSON.parse(fs.readFileSync(path.join(root,'isla-v16-upload.json')));assert.equal(manifest.version,'2.24');assert(!manifest.files.some(f=>/menu-music|elektronomia|Menu-Music/.test(f.name)));
});
