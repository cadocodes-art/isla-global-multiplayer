'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const V=require('../public/v22-shared.js'),create=require('../scripts/source-world.cjs'),world=require('../src/world-data.json'),T=require('../public/three.min.js');
const data=world.maps.playplace;
test('V2.36 Play Place has no concession buildings, while attractions and other maps stay present',()=>{
 const {W,buildings}=create('playplace');assert.equal(buildings.length,0);assert.equal(data.buildings.length,0);
 const scene=new T.Scene();W.makeBuildings(scene);assert.equal(W.buildings.length,0);assert.equal(W.colliders.length,0);assert.equal(scene.children.length,0);
 assert.equal(W.playplace.pads.length,9);assert.equal(W.playplace.waterpark.tubes.length,3);assert(W.playplace.roads.some(r=>r.name==='Skybridge'));
 assert.equal(world.buildings.length,69);assert.equal(world.maps.peaks.buildings.length,131);assert(world.maps.fern.buildings.length>0);
});
test('V2.36 has 100 fresh personal slots, eight or more sky bridge coins, water park coins above the water, and matching guest/server positions',()=>{
 const {W,bounds,surfaces}=create('playplace');let previous;
 for(let i=0;i<12;i++){
  const seed='v236-visit-'+i,a=V.visitCoins(data,seed),local=V.coins('playplace',W.roads,[],W.height,bounds,seed,surfaces);
  assert.equal(a.length,100);assert.deepEqual(a,JSON.parse(JSON.stringify(local)));assert.deepEqual(a,V.visitCoins(data,seed));
  assert(a.filter(c=>c.placement==='skybridge').length>=8);assert.equal(a.filter(c=>c.value===10).length,2);assert(a.filter(c=>c.x>238&&c.z> -317&&c.z< -93).length>=12);
  if(previous){assert.notDeepEqual(a,previous);assert.deepEqual(a.map(c=>c.id),previous.map(c=>c.id));}previous=a;
  for(const c of a){assert(c.y>=W.height(c.x,c.z)+.79);if(c.placement==='water')assert.equal(c.y,12.8);if(['road','skybridge'].includes(c.placement)&&c.y>13){const h=W.makerRoadHeight(c.x,c.z,c.y-1.1,c.y-.5);assert(Math.abs(h-(c.y-.8))<.15,'coin floats above its real deck: '+JSON.stringify(c));}}
  for(let j=0;j<a.length;j++)for(let k=j+1;k<a.length;k++)assert(Math.hypot(a[j].x-a[k].x,a[j].z-a[k].z)>=32-1e-8);
 }
 for(const map of ['islands','city','peaks','fern'])assert.equal(V.visitCoins(map==='islands'?world:world.maps[map],'v236').length,240);
});
function tracker(){const W={driveHeight:()=>12},ctx=vm.createContext({Isla:W});vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/aura.js'),'utf8'),ctx);return {W,a:W.createAuraTracker()};}
function flight(a,trampoline,bonus=0){const c={x:0,z:0,y:12,vx:20,vz:0,grounded:true,waterMode:'dry',ramp:null};a.update(c,1/120);for(let i=1;i<=120;i++){Object.assign(c,{x:i/6,y:12+8*Math.sin(i/120*Math.PI),grounded:false,playBounceRewardPending:trampoline&&i===1});a.update(c,1/120);if(a.flight)a.flight.trickBonus=bonus;}c.grounded=true;c.y=12;a.update(c,1/120);return a.notice.points;}
test('V2.36 trampoline flights earn one fifth of normal Aura including chain and air tricks, with normal jumps unchanged',()=>{
 for(const chain of [0,2,4])for(const bonus of [0,.04]){
  const {a}=tracker();a.chainCount=chain;a.remaining=5;const reduced=flight(a,true,bonus),{a:normal}=tracker();normal.chainCount=chain;normal.remaining=5;const full=flight(normal,false,bonus);assert(Math.abs(reduced-full*.2)<=.6);assert.equal(normal.multiplier,Math.min(5,chain+1));
  a.interrupt();assert.equal(flight(a,false,bonus),flight(tracker().a,false,bonus),'discount must not leak to the next jump');
 }
});
test('real trampoline takeoffs keep their impulse and mark the flight even when a bounce occurs between airborne frames',()=>{
 const {W}=create('playplace'),c=W.vehicle,p=W.playplace.pads[0],{a}=tracker();
 Object.assign(c,{x:p.x,z:p.z,y:12.1,vy:-2,waterMode:'dry',playBouncePower:0,playBounceAt:0,playBounceRest:false,vx:0,vz:0});
 assert(W.playBounce(c,{y:12.3,vy:-2},1));assert.equal(c.vy,p.power);assert(c.playBounceRewardPending);a.update(c,1/120);assert(a.flight.trampoline);assert.equal(c.playBounceRewardPending,false);
 const original=a.flight;Object.assign(c,{y:12.1,vy:-3});assert(W.playBounce(c,{y:12.3,vy:-3},3));a.update(c,1/120);assert.strictEqual(a.flight,original);assert(a.flight.trampoline);assert(Math.abs(c.vy-p.power*.82)<1e-10);
 W.resetVehicle(true);assert.equal(c.playBounceRewardPending,false);
});
