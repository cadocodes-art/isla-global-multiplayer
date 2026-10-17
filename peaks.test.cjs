'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const createWorld=require('../scripts/source-world.cjs'),manifest=require('../src/world-data.json');
const {W,buildings,trees}=createWorld('peaks',true);W.initTraffic();W.buildCollisionIndex();
test('third map is Islayan Peaks, including old obstacle bookmarks, with ordinary solo and global play',()=>{
 assert.equal(W.mapId,'peaks');assert.equal(W.mapInfo.name,'Islayan Peaks');assert(!W.course);assert.equal(W.ramps.length,0);
 const html=fs.readFileSync(require.resolve('../public/index.html'),'utf8'),maps=fs.readFileSync(require.resolve('../public/maps.js'),'utf8');assert(html.includes('peaks.js'));assert(!html.includes('course-client.js'));assert(maps.includes("requested==='obstacle'?'peaks'"));assert(!maps.includes('Void Run'));
 const old=createWorld('obstacle');assert.equal(old.W.mapId,'peaks');assert.deepEqual(old.buildings,buildings);
});
test('five separate peaks rise above a valley town, with the tallest over 400 metres',()=>{
 assert.equal(W.peaks.length,5);const heights=W.peaks.map(p=>W.height(p.x,p.z));assert(Math.max(...heights)>400);assert(Math.max(...heights)<600);assert(heights.every(h=>h>350));assert(W.height(0,0)<60);
 for(const p of W.peaks){assert(W.height(p.x,p.z)>W.height(p.x+100,p.z)+20);assert(W.height(p.x,p.z)>W.height(p.x,p.z+100)+20);}
 assert.deepEqual(buildings,manifest.maps.peaks.buildings);assert.deepEqual(trees,manifest.maps.peaks.trees);
});
test('irregular near-circular coastline has ocean all around and only a narrow sand edge',()=>{
 const radii=[];for(let i=0;i<120;i++){const a=i*Math.PI/60,r=W.peaksCoastRadius(a);radii.push(r);const h=d=>W.mapRawHeight(Math.cos(a)*(r-d),Math.sin(a)*(r-d));assert(h(-30)<-10);assert(h(3)>0&&h(3)<1);assert(h(100)>30);}
 assert(Math.max(...radii)/Math.min(...radii)<1.4);assert(Math.max(...radii)-Math.min(...radii)>200);
 const THREE=require('../public/three.min.js'),sand=new THREE.Color(),snow=new THREE.Color();W.mapGroundColor(0,W.peaksCoastRadius(Math.PI/2)-3,.5,0,sand);W.mapGroundColor(0,W.peaksCoastRadius(Math.PI/2)-12,2,0,snow);assert(snow.b>sand.b);
});
test('roads connect around mountain bases, stay above water and never cross a summit',()=>{
 assert.equal(W.roads.length,9);const loops=W.roads.filter(r=>r.closed);assert.equal(loops.length,2);
 for(const road of W.roads){assert(road.name);for(let i=0;i<road.samples.length;i++){const p=road.samples[i];assert(p.y>20);assert(W.peaks.every(m=>Math.hypot(m.x-p.x,m.z-p.z)>500));if(i){const q=road.samples[i-1];assert(Math.abs(p.y-q.y)/Math.hypot(p.x-q.x,p.z-q.z)<.13,road.name);}}
  if(road.closed)assert(Math.abs(road.samples[0].y-road.samples.at(-1).y)<.01);else for(const p of [road.samples[0],road.samples.at(-1)]){const q=loops.flatMap(r=>r.samples).reduce((a,b)=>Math.hypot(b.x-p.x,b.z-p.z)<Math.hypot(a.x-p.x,a.z-p.z)?b:a);assert(Math.hypot(q.x-p.x,q.z-p.z)<4);assert(Math.abs(q.y-p.y)<.01);}
 }
});
test('road driving and recovery stay on the surface across every graded route',()=>{
 W.getCarSpec=()=>W.carModels[0];let time=0;
 for(const r of W.roads)for(let i=4;i<r.samples.length-10;i+=37){const p=r.samples[i],q=r.samples[i+1],yaw=Math.atan2(q.x-p.x,q.z-p.z);W.resetVehicle(true);Object.assign(W.vehicle,{x:p.x,z:p.z,y:W.driveHeight(p.x,p.z)+.12,yaw,vx:Math.sin(yaw)*14,vz:Math.cos(yaw)*14});for(let j=0;j<8;j++)W.stepVehicle(1/120,{gas:1,steer:0,brake:0},time+=1/120);assert.equal(W.vehicle.waterMode,'dry');assert(Number.isFinite(W.vehicle.y));assert(Math.abs(W.vehicle.y-W.driveHeight(W.vehicle.x,W.vehicle.z))<.85,r.name);}
 W.vehicle.lastSafe={x:W.roads[4].samples[50].x,z:W.roads[4].samples[50].z,yaw:0};W.vehicle.y=-100;W.resetVehicle();assert(W.vehicle.y>20);assert.equal(W.vehicle.waterMode,'dry');
});
test('131 small houses sit in the valley and all 32 global spawns are clear',()=>{
 assert(buildings.length>=100&&buildings.length<=160);const plans=W.peakBuildingPlans();assert(plans.every(p=>p.h<15&&p.w<16&&p.d<13&&p.foundation<3.8));assert(plans.filter(p=>Math.hypot(p.x,p.z)<500).length>100);
 for(const b of buildings)assert(W.nearestRoad(b.x,b.z).d>15);
 for(const s of manifest.maps.peaks.spawns){assert(Math.abs(s.y-W.driveHeight(s.x,s.z)-.12)<.001);assert(buildings.every(b=>!W.circleOBB(s.x,s.z,2,b)));}
});
test('28 traffic cars loop through the village, passes and coast without leaving roads',()=>{
 assert.equal(W.traffic.length,28);assert.equal(W.trafficRoutes.length,3);assert(W.trafficRoutes[2].p.some(p=>Math.hypot(p.x,p.z)<400));assert(W.trafficRoutes[2].p.some(p=>Math.hypot(p.x,p.z)>1600));
 for(const r of W.trafficRoutes)for(let i=0;i<r.p.length;i+=7){const p=r.p[i],q=r.p[(i+1)%r.p.length],yaw=Math.atan2(q.x-p.x,q.z-p.z);for(const direction of [-1,1]){const x=p.x+Math.cos(yaw)*2.35*direction,z=p.z-Math.sin(yaw)*2.35*direction,near=W.nearestRoad(x,z);assert(near.d<near.p.width/2);assert(buildings.every(b=>!W.circleOBB(x,z,1.5,b)));assert(W.driveHeight(x,z)>20);}}
 const start=W.traffic.map(t=>t.distance);for(let i=0;i<120;i++)W.stepTraffic(1/60);assert(W.traffic.every((t,i)=>Math.abs(t.distance-start[i])>1));
});
test('snow-covered pines are lit, collidable and can be knocked down and restored',()=>{
 assert.equal(trees.length,2400);const tree=W.trees[100],part=tree.parts[1],THREE=require('../public/three.min.js'),color=new THREE.Color(),before=new THREE.Matrix4(),after=new THREE.Matrix4();
 for(const p of tree.parts){p.mesh.getColorAt(p.index,color);assert.deepEqual([color.r,color.g,color.b],[1,1,1]);}
 part.mesh.getMatrixAt(part.index,before);W.fellTree(tree,1,0);part.mesh.getMatrixAt(part.index,after);assert(tree.collapsed);assert(!before.equals(after));W.restoreTrees();part.mesh.getMatrixAt(part.index,after);assert(!tree.collapsed);assert(before.equals(after));
});
