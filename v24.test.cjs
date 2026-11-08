'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),T=require('../public/three.min.js'),I=require('../public/inferno-shared.js'),V=require('../public/v22-shared.js'),make=require('../scripts/source-world.cjs');
test('V2.4 both Inferno layers have safe spawns and 240 personal coins with identical server geometry',()=>{
 for(const map of ['inferno','inferno-vent']){const {W,coins,buildings}=make(map,true);assert.equal(coins.length,240);assert.equal(W.globalSpawns.length,32);W.initTraffic();assert.equal(W.traffic.length,0);assert.equal(buildings.length,map==='inferno'?28:0);
 for(const p of [...coins,...W.globalSpawns]){assert(I.safe(map,p.x,p.z));assert(Math.abs(p.y-I.height(map,p.x,p.z))<1);}
 const data={mapId:map,buildings,coinWorld:{terrain:{kind:'inferno',map},roads:[],bounds:{}}},a=V.visitCoins(data,'one'),b=V.visitCoins(data,'two');assert.equal(a.length,240);assert.notDeepEqual(a,b);assert.deepEqual(a,V.coins(map,[],buildings,(x,z)=>I.height(map,x,z),{},'one'));assert.deepEqual(a.map(c=>c.id),b.map(c=>c.id));assert.equal(a.filter(c=>c.value===10).length,5);
 }
});
test('V2.4 vent connects all six entrances, supports bridges, and is 70 percent of surface dimensions',()=>{
 assert.equal(I.entrances.length,6);assert.equal(I.vent.width/I.surface.width,.7);assert.equal(I.vent.depth/I.surface.depth,.7);assert.equal(I.ventFloor(0,0)-I.ventLava(0,0),10);
 for(const e of I.edges)for(let k=0;k<=12;k++){const t=k/12,x=e.a.x+(e.b.x-e.a.x)*t,z=e.a.z+(e.b.z-e.a.z)*t;assert(I.interior(x,z));assert(I.ventFloor(x,z)>=(I.ventLava(x,z)??0)+3,'supported route '+e.id);}
 const seen=new Set(['0,0']);let changed=true;while(changed){changed=false;for(const e of I.edges){const a=e.a.x+','+e.a.z,b=e.b.x+','+e.b.z;if(seen.has(a)&&!seen.has(b)){seen.add(b);changed=true;}if(seen.has(b)&&!seen.has(a)){seen.add(a);changed=true;}}}for(const p of I.entrances)assert(seen.has(p.x+','+p.z));
});
test('V2.4 real driving enters the crater only after falling and recovers from lava without a reward',()=>{
 const {W}=make('inferno');let travel=null,interrupts=0;W.infernoTravel=target=>travel=target;W.aura={interrupt:()=>interrupts++};W.resetVehicle(true);const c=W.vehicle;Object.assign(c,{x:I.surface.cx,z:I.surface.cz,y:450,vy:-10,grounded:false,vx:0,vz:0});const input={gas:0,brake:0,steer:0};W.stepVehicle(1/120,input,0);assert.equal(travel,null);for(let i=0;i<1200&&!travel;i++)W.stepVehicle(1/120,input,i/120);assert.equal(travel,'inferno-vent');
 const l=I.lakes[0];Object.assign(c,{x:l.x,z:l.z,y:l.y,grounded:false,vy:-2,vx:0,vz:0});W.stepVehicle(1/120,input,20);assert(I.safe('inferno',c.x,c.z));assert(interrupts>1);
});
function bowling(){const c=vm.createContext({console,THREE:T});c.window=c;for(const n of ['playplace-bodies.js','playplace-v20-shared.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',n),'utf8'),c);const W={clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),mix:(a,b,t)=>a+(b-a)*t,getCarSpec:()=>({size:1}),playplace:{floor:12,clock:0,roads:[],seesaws:[],ropes:[],bodies:null,sports:{balls:[],hoop:{}}}};W.playplace.bodies=c.IslaPlayBodies(W,T);const A=c.IslaPlayAttractions(W,T);return {c,W,A,l:A.lanes[0]};}
function launch(b,r=.5){vm.runInContext('Math.random=()=>'+r,b.c);const {l,A}=b;A.hitBall(l.ball,{x:l.x+.2,z:l.start-5,y:12,yaw:0,vx:0,vz:20,size:1,driverId:'test',driverName:'Tester'},0);return l.curve;}
test('V2.4 bowling curves once per roll, restores exactly and still allows aimed strikes',()=>{
 for(const hz of [60,120])for(const r of [.01,.51]){const b=bowling(),curve=launch(b,r);assert.equal(b.l.phase,'rolling');assert(Math.abs(curve)>=.02&&Math.abs(curve)<=.08);const start=b.l.ball.p.x;for(let i=0;i<hz;i++){b.A.step(1/hz,i/hz);assert.equal(b.l.curve,curve);}const s=b.A.snapshot();assert(b.A.valid(s));const restored=bowling();assert(restored.A.apply(s));assert.equal(restored.l.curve,curve);s.lanes[0].curve=99;assert(!b.A.valid(s));for(let i=hz;i<hz*34&&b.l.phase==='rolling';i++)b.A.step(1/hz,i/hz);assert.equal(b.l.phase,'returning');assert.equal(b.l.total,10);assert.equal(b.l.result,'STRIKE!');b.A.reset(b.l);assert.equal(b.l.curve,0);assert.equal(b.l.ball.mass,120);}
});

test('V2.4 Vent bridge meshes and platforms match the drivable floor and contain finite geometry',()=>{
 const {W}=make('inferno-vent'),scene=new T.Scene();W.makeRoadDetails(scene);scene.updateMatrixWorld(true);let count=0;scene.traverse(o=>{if(o.isMesh){count++;for(const n of o.geometry.attributes.position.array)assert(Number.isFinite(n));}});assert(count>300);const ray=new T.Raycaster();for(const e of I.edges)for(const t of [.12,.4,.65,.88]){const x=e.a.x+(e.b.x-e.a.x)*t,z=e.a.z+(e.b.z-e.a.z)*t,y=I.ventFloor(x,z);ray.set(new T.Vector3(x,y+.9,z),new T.Vector3(0,-1,0));const hits=ray.intersectObjects(scene.children,true);assert(hits.length,'bridge '+e.id);assert(Math.abs(hits[0].point.y-y)<.7,'visible floor and collision agree on '+e.id);}
 const c=W.vehicle;W.resetVehicle(true);Object.assign(c,{x:120,z:40,y:150,vy:20,vx:0,vz:0,grounded:false});W.stepVehicle(1/120,{gas:0,brake:0,steer:0},1);assert(c.y<=I.ceiling(c.x,c.z));assert(I.interior(c.x,c.z));for(const p of I.platforms)assert.equal(I.ventFloor(p.x,p.z),p.y);
});
