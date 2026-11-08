'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const T=require('../public/three.min.js'),create=require('../scripts/source-world.cjs'),idle={gas:0,brake:0,steer:0,handbrake:false,boost:false};
function fixture(height){const ctx=vm.createContext({THREE:T,console});ctx.window=ctx;for(const f of ['world.js','physics.js','aura.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',f),'utf8'),ctx);const W=ctx.Isla;W.height=W.driveHeight=height;W.slope=()=>({x:0,z:0});W.nearestRoad=()=>({p:null,d:Infinity});Object.assign(W,{minX:-500,minZ:-500,span:1000,depth:1000,step:10,mapBounds:{x:-500,z:-500,size:1000},spawn:{x:-400,z:0,yaw:0},traffic:[]});W.buildCollisionIndex();W.aura=W.createAuraTracker();return W;}
test('sinking and water Recover choose the nearer island, clear motion and Aura, and replace the old checkpoint',()=>{
 for(const mode of ['sinking','skimming']){
  const W=fixture(x=>x< -200||x>100?4:-20),c=W.vehicle;Object.assign(c,{x:70,z:20,y:-1,vx:0,vy:-2,vz:0,waterMode:mode,waterTime:1.39,grounded:false,lastSafe:{x:-400,z:-300,yaw:0},nitroCharge:.4,boatUsed:30});W.aura.flight={seconds:3,distance:80,height:10};W.aura.total=1234;
  if(mode==='sinking')W.stepVehicle(.02,idle,10);else W.resetVehicle();
  assert(c.x>100&&c.x<105);assert(Math.abs(c.z-20)<1);assert.equal(c.waterMode,'dry');assert.equal(c.y,4.12);assert.equal(c.vx,0);assert.equal(c.vy,0);assert.equal(c.vz,0);assert.equal(W.aura.total,1234);assert.equal(W.aura.flight,null);assert.equal(c.boatUsed,30);assert(c.nitroCharge<.41);
  const shore={x:c.x,z:c.z};W.resetVehicle();assert.equal(c.x,shore.x);assert.equal(c.z,shore.z);
 }
});
test('nearest land leaves chassis clearance from the sea, buildings, rocks and steep ground',()=>{
 const W=fixture((x,z)=>x<0?-12:z>60?4+(z-60)*2:4);W.colliders=[{x:8,z:0,y:4,w:15,d:40,h:10,yaw:0},{kind:'rock',x:5,z:-30,y:4,r:5,h:8}];W.buildCollisionIndex();
 const p=W.nearestDryLand(-30,0);assert(p);assert(p.x>=3.25);assert(p.z<60);for(const b of W.colliders)assert(b.w?!W.circleOBB(p.x,p.z,3.25,b):Math.hypot(p.x-b.x,p.z-b.z)>=3.25+b.r);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;assert(W.height(p.x+Math.cos(a)*3,p.z+Math.sin(a)*3)>=0);}
 let nearest=Infinity;for(let z=-80;z<=60;z+=.5)for(let x=3.5;x<=50;x+=.5){if(W.colliders.some(b=>b.w?W.circleOBB(x,z,3.25,b):Math.hypot(x-b.x,z-b.z)<3.25+b.r))continue;nearest=Math.min(nearest,Math.hypot(x+30,z));}assert(Math.hypot(p.x+30,p.z)<=nearest+1);
});
test('Islayan Peak sea recovery stays on the nearby coast rather than returning to a mountain-side road',()=>{
 const {W}=create('peaks'),c=W.vehicle;W.makeBuildings(new T.Scene());W.buildCollisionIndex();W.traffic=[];
 Object.assign(c,{x:0,z:2250,y:-2,vx:0,vy:-2,vz:0,waterMode:'sinking',waterTime:1.39,grounded:false,lastSafe:{x:600,z:-900,yaw:0}});
 W.stepVehicle(.02,idle,1);assert.equal(c.waterMode,'dry');assert(c.z>1600);assert(Math.hypot(c.x,c.z-2250)<600);assert(W.height(c.x,c.z)>=0);assert.equal(c.lastSafe.z,c.z);
 const spawn={x:c.x,z:c.z};for(let i=0;i<120;i++)W.stepVehicle(1/120,idle,2+i/120);assert.equal(c.waterMode,'dry');assert(Math.hypot(c.x-spawn.x,c.z-spawn.z)<5);
});
test('Play Place pools use their elevated water level and recover beside the pool',()=>{
 const {W}=create('playplace'),pool=W.waterLevelAt;
 // Find water in the rendered pool layout without assuming sea-level water.
 let wet;for(let z=-500;z<=500&&!wet;z+=10)for(let x=-550;x<=550;x+=10)if(pool(x,z)>0&&W.height(x,z)<pool(x,z)-1){wet={x,z};break;}
 assert(wet);W.traffic=[];W.buildCollisionIndex();const p=W.nearestDryLand(wet.x,wet.z);assert(p);assert(Math.hypot(p.x-wet.x,p.z-wet.z)<160);assert(W.height(p.x,p.z)>=W.waterLevelAt(p.x,p.z));assert(p.x>-600&&p.x<600&&p.z>-525&&p.z<525);
});
test('ordinary dry recovery and starting a map retain their previous behavior',()=>{
 const W=fixture(()=>4),c=W.vehicle;c.lastSafe={x:50,z:60,yaw:1};c.waterMode='dry';W.resetVehicle();assert.equal(c.x,50);assert.equal(c.z,60);W.resetVehicle(true);assert.equal(c.x,-400);assert.equal(c.z,0);
});
test('tiny custom islands are found even between grid samples',()=>{
 const x=111.3,z=-35.7,W=fixture((a,b)=>Math.hypot(a-x,b-z)<=5?4:-18);W.customMap={size:1024,terrain:[{x,z,height:22,radius:5}]};const p=W.nearestDryLand(75,z);assert(p);assert(Math.hypot(p.x-x,p.z-z)<2);assert(p.x<x);
});
test('custom-map recovery keeps the nearby island instead of restoring its earlier lastDry location',async()=>{
 const M=require('../public/maker-core.js'),map=M.fresh('ocean');map.terrain=[{x:-300,z:0,radius:90,height:45},{x:150,z:0,radius:90,height:45}];map.objects[0].x=-300;
 const paint=new Proxy({measureText:s=>({width:s.length*38})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),ctx=vm.createContext({THREE:T,console,document:{createElement:()=>({getContext:()=>paint})},URLSearchParams});ctx.window=ctx;
 ctx.IslaCommunity={query:new URLSearchParams('?map=custom&draft=recovery'),init:async()=>{},draft:async()=>({id:'recovery',name:'Recovery test',document:map}),installGarage(){}};
 for(const f of ['world.js','islands.js','ramps.js','physics.js','garage.js','traffic.js','maps.js','peaks.js','player-rules.js','utility-cars.js','maker-core.js','maker-assets.js','maker-driving.js','custom-map.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',f),'utf8'),ctx,{filename:f});
 const W=ctx.Isla;await W.prepareCommunity();W.initTerrain();W.buildCollisionIndex();W.resetVehicle(true);Object.assign(W.vehicle,{x:70,z:0,y:-1,waterMode:'sinking',waterTime:1.39,vx:0,vy:-1,vz:0,grounded:false});W.stepVehicle(.02,idle,1);
 assert(W.vehicle.x>90);assert.equal(W.vehicle.waterMode,'dry');const p={x:W.vehicle.x,z:W.vehicle.z};W.resetVehicle();assert.equal(W.vehicle.x,p.x);assert.equal(W.vehicle.z,p.z);
});
