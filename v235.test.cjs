'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('../scripts/source-world.cjs'),T=require('../public/three.min.js');
test('V2.35 plateau occupies the former southeast mountain site between roads at 18% of the remaining summit',()=>{
 const {W}=create('peaks'),p=W.peakPlateau;
 assert.equal(p.x,615);assert.equal(p.z,875);assert(Math.hypot(p.x-W.peaks[0].x,p.z-W.peaks[0].z)>2000);
 assert(Math.abs(W.height(p.x,p.z)/W.height(0,-1040)-.18)<.001);
 for(const road of W.roads)for(const s of road.samples)assert(Math.hypot((s.x-p.x)/p.rx,(s.z-p.z)/p.rz)>1.1,'plateau and road stay separated: '+road.name);
 for(const dx of [-150,-75,0,75,150])for(const dz of [-100,-50,0,50,100])assert(Math.abs(W.height(p.x+dx,p.z+dz)-111)<.02,'flat top');
 assert(W.height(0,1400)<80,'previous southern plateau removed');assert(W.height(0,-1775)<120,'no plateau behind the mountain');
 assert.equal(W.placeName(p.x,p.z,p.height),'ISLAYAN · PLATEAU');
 W.getCarSpec=()=>W.carModels[0];W.buildCollisionIndex();W.resetVehicle(true);Object.assign(W.vehicle,{x:p.x,z:p.z,y:p.height+.12,yaw:Math.PI,vx:0,vy:0,vz:0,grounded:true});
 for(let i=0;i<180;i++)W.stepVehicle(1/120,{gas:1,steer:0,brake:0},i/120);
 assert(W.vehicle.z<p.z-5);assert(W.vehicle.grounded);assert(Math.abs(W.vehicle.y-111.12)<.05);
});
test('V2.35 faces and hands use matching diverse, stable skin colors without reallocating visible instances',()=>{
 for(const map of ['fern','peaks']){
  const {W}=create(map),scene=new T.Scene();W.scene=scene;W.traffic=[];W.makeBuildings(scene);Object.assign(W.vehicle,{x:1e7,y:0,z:1e7,vx:0,vz:0});W.v22People.install(scene);const P=W.v22People;
  assert.equal(P.visibleCount,0);assert.equal(P.head.instanceColor.count,P.maxPeople);assert.equal(P.hands.instanceColor.count,P.maxPeople*2);
  const headBuffer=P.head.instanceColor.array,handBuffer=P.hands.instanceColor.array,seen=new Map(),tones=new Set(),counts={inside:0,outside:0},color=new T.Color(),hand=new T.Color(),m=new T.Matrix4();
  const sample=building=>{
   Object.assign(W.vehicle,{x:building.x,y:building.y,z:building.z});P.refresh=0;P.update(0,0);
   const people=P.active.flatMap(r=>[...(r.path?[r.outside]:[]),r.inside]).filter(n=>Number.isFinite(n.x));
   for(let i=0;i<P.visibleCount;i++){
    P.head.getMatrixAt(i,m);const n=people.find(n=>Math.hypot(n.x-m.elements[12],n.z-m.elements[14])<.001);assert(n);counts[n.inside?'inside':'outside']++;
    P.head.getColorAt(i,color);for(const j of [i*2,i*2+1]){P.hands.getColorAt(j,hand);assert(color.equals(hand));}
    assert(color.r>color.g&&color.g>color.b);const value=color.toArray().join(',');tones.add(value);if(seen.has(n.id))assert.equal(value,seen.get(n.id));seen.set(n.id,value);
   }
   assert.strictEqual(P.head.instanceColor.array,headBuffer);assert.strictEqual(P.hands.instanceColor.array,handBuffer);assert.equal(P.batches.length,6);
  };
  const buildings=W.buildings.filter(b=>P.records.some(r=>r.b===b));for(const b of buildings.slice(0,16))sample(b);
  Object.assign(W.vehicle,{x:1e7,z:1e7});P.refresh=0;P.update(0,0);assert.equal(P.visibleCount,0);sample(buildings[0]);
  assert(tones.size>=8,'light through deep skin tones appear on '+map);assert(counts.inside>0&&counts.outside>0);
 }
});
