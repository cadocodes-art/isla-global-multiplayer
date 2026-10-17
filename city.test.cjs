'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const createWorld=require('../scripts/source-world.cjs'),manifest=require('../src/world-data.json');
const {W,buildings}=createWorld('city');W.initTraffic();W.planRamps();
const F=W.cityToWorld,input={gas:true,brake:false,steer:0,handbrake:false,boost:false};let time=0;
const step=()=>W.stepVehicle(1/120,input,time+=1/120);
function place(u,v,yaw,speed=0,deck=false){W.resetVehicle(true);const p=F(u,v);Object.assign(W.vehicle,{...p,y:(deck?W.cityDeckHeight:W.driveHeight(p.x,p.z,true))+.12,yaw,vx:Math.sin(yaw)*speed,vz:Math.cos(yaw)*speed});}
test('coastal city keeps deterministic buildings, traffic and clear multiplayer spawns',()=>{
 assert.equal(W.mapId,'city');assert(buildings.length>=240);assert(W.roads.length>=20);assert.equal(W.traffic.length,72);assert.equal(W.ramps.length,6);assert.deepEqual(buildings,manifest.maps.city.buildings);assert.equal(manifest.buildings.length,69);assert.equal(manifest.traffic.length,18);
 for(const s of manifest.maps.city.spawns){assert(Math.abs(s.y-W.driveHeight(s.x,s.z)-.12)<.001);assert(buildings.every(b=>!W.circleOBB(s.x,s.z,2,b)));}
 const plans=W.cityBuildingPlans();for(const b of buildings){assert(W.cityShoreDistance(b.x,b.z)>60);assert(plans[b.id].foundation>.2);assert(W.nearestRoad(b.x,b.z).d>15);}
});
test('ocean is northeast, skyline is coastal, outskirts curve, and roads have gentle grades',()=>{
 assert(W.height(850,-850)<0);assert(W.height(-850,850)>10);assert(W.height(-970,-900)>0);assert(W.height(950,850)>0);
 const tall=[...buildings].sort((a,b)=>b.h-a.h).slice(0,20);assert(tall.reduce((n,b)=>n+W.cityShoreDistance(b.x,b.z),0)/tall.length<330);
 const heights=W.roads.flatMap(r=>r.samples.map(p=>p.y));assert(Math.max(...heights)-Math.min(...heights)>12);
 for(const road of W.roads)for(let i=1;i<road.samples.length;i++){const a=road.samples[i-1],b=road.samples[i];assert(Math.abs(b.y-a.y)/Math.hypot(b.x-a.x,b.z-a.z)<.2,road.name+' too steep');if(!road.residential&&!road.coastal)assert(Math.abs(b.x)<1050&&Math.abs(b.z)<1050);assert(W.mapRawHeight(b.x,b.z)>0);}
 assert(W.roads.some(r=>r.name==='Waterfront Drive'));assert(W.roads.some(r=>r.name==='West Ridge Road'));
 const a=F(-640,-500),b=F(-640,500),mid=F(-640,0),off=Math.abs((b.x-a.x)*(a.z-mid.z)-(a.x-mid.x)*(b.z-a.z))/Math.hypot(b.x-a.x,b.z-a.z);assert(off>15,'outer avenues still straight');
});
test('traffic follows curved ground streets, avoids buildings and clears ramp crossings',()=>{
 let underpasses=0;for(let frame=0;frame<900;frame++){W.stepTraffic(1/30);if(frame%30)continue;
  for(const t of W.traffic){const near=W.nearestRoad(t.x,t.z,2);assert(near.p&&near.d<near.p.width/2-1,'traffic leaves road');assert(Math.abs(t.y-W.driveHeight(t.x,t.z,true)-.12)<.001);assert(buildings.every(b=>!W.circleOBB(t.x,t.z,1.5,b)),'traffic clips building');
   for(const r of W.ramps.filter(r=>r.role==='approach')){const p=W.rampLocal(r,t.x,t.z);if(Math.abs(p.across)<r.w/2&&p.along>0&&p.along<r.d){assert(t.y+1.6<W.rampUnderside(r,t.x,t.z));underpasses++;}}
  }
 }assert(underpasses>0);
});
test('cars climb every supported approach and jump to the opposite deck',()=>{
 const scene=new W.T.Scene();W.makeBuildings(scene);W.makeRamps(scene);W.makeBridge(scene);W.makeVegetation(scene);W.makeRoadDetails(scene);W.buildCollisionIndex();
 for(const r of W.ramps.filter(r=>r.role==='approach')){const p=W.rampPoint(r,0,-15);W.resetVehicle(true);Object.assign(W.vehicle,{...p,y:W.driveHeight(p.x,p.z,true)+.12,yaw:r.yaw,vx:r.si*28,vz:r.co*28});let climbed=false,onDeck=false;
  for(let i=0;i<1100;i++){step();const c=W.vehicle,q=W.cityLocal(c.x,c.z);if(c.ramp===r)climbed=true;if(Math.abs(q.v)<230&&c.y>W.cityDeckHeight-1){onDeck=true;break;}}assert(climbed&&onDeck,'cannot reach deck from ramp '+r.id);
 }
 place(320,70,Math.PI-W.cityAngle,40,true);let airborne=false,landed=false;
 for(let i=0;i<550;i++){step();const c=W.vehicle,q=W.cityLocal(c.x,c.z);if(q.v<12&&!c.grounded)airborne=true;if(q.v< -12&&c.grounded&&c.y>W.cityDeckHeight-1){landed=true;break;}}assert(airborne&&landed);
});
test('cars and the Big Truck pass beneath approaches and overpasses in both directions',()=>{
 const original=W.getCarSpec;try{for(const model of ['classic','truck']){W.getCarSpec=()=>W.carModels.find(m=>m.id===model);const size=W.getCarSpec().size||1;
  for(const r of W.ramps.filter(r=>r.role==='approach'))for(const direction of [-1,1])for(const lane of [-2.35,2.35]){
   const v=r.end*320+lane;place(r.u-direction*17,v,direction*Math.PI/2-W.cityAngle,14);let crossed=false;
   for(let i=0;i<420;i++){step();const c=W.vehicle,q=W.cityLocal(c.x,c.z);if(Math.abs(q.u-r.u)<r.w/2){assert.equal(c.ramp,null);assert(c.y+1.6*size<W.rampUnderside(r,c.x,c.z));}if((q.u-r.u)*direction>17){crossed=true;break;}}assert(crossed,model+' blocked under ramp '+r.id);
  }
  place(300,160,Math.PI/2-W.cityAngle,20);for(let i=0;i<180;i++)step();assert(W.cityLocal(W.vehicle.x,W.vehicle.z).u>330);assert(W.vehicle.y<W.cityDeckHeight-10);
 }}finally{W.getCarSpec=original;}
});
test('ramp posts and low ends remain solid',()=>{
 const r=W.ramps.find(r=>r.role==='approach'),post=r.supports.find(s=>s.h>5),yaw=Math.PI/2-W.cityAngle;W.resetVehicle(true);Object.assign(W.vehicle,{x:post.x-Math.sin(yaw)*8,z:post.z-Math.cos(yaw)*8,y:post.y+.12,yaw,vx:Math.sin(yaw)*14,vz:Math.cos(yaw)*14});
 let furthest=-Infinity;for(let i=0;i<100;i++){step();furthest=Math.max(furthest,(W.vehicle.x-post.x)*Math.sin(yaw)+(W.vehicle.z-post.z)*Math.cos(yaw));}assert(furthest<0);
 const p=W.rampPoint(r,0,85);W.resetVehicle(true);Object.assign(W.vehicle,{...p,y:W.driveHeight(p.x,p.z,true)+.12,yaw:r.yaw+Math.PI,vx:-r.si*14,vz:-r.co*14});for(let i=0;i<450;i++)step();assert(W.rampLocal(r,W.vehicle.x,W.vehicle.z).along>25);assert.equal(W.vehicle.ramp,null);
});
test('invisible land limits stop outward motion without walls or impact effects',()=>{
 assert.equal(W.cityBorderSegments.length,0);assert(!W.colliders.some(b=>b.kind==='border'));const original=W.onImpact;let impacts=0;W.onImpact=()=>impacts++;
 for(const [axis,sign,other]of [['x',-1,0],['x',1,800],['z',1,0],['z',-1,-990]])for(const height of [20,180]){const c={x:axis==='x'?sign*1010:other,z:axis==='z'?sign*1010:other,y:height,vx:axis==='x'?sign*70:12,vz:axis==='z'?sign*70:12};W.enforceMapBoundary(c);assert(Math.abs(c[axis])<1000);assert.equal(c[axis==='x'?'vx':'vz'],0);assert.equal(c[axis==='x'?'vz':'vx'],12);}
 W.onImpact=original;assert.equal(impacts,0);
 const sea={x:800,z:-1030,y:3,vx:0,vz:-40};W.enforceMapBoundary(sea);assert.equal(sea.z,-1030);
});
test('small suburban homes fill the outskirts and continue beyond each land edge',()=>{
 const plans=W.citySuburbPlans(),homes=plans.filter(p=>!p.scenery),far=plans.filter(p=>p.scenery);assert(homes.length>250);assert(far.length>1000);
 for(const p of homes){assert(p.floors===1||p.floors===2);assert(p.w<16&&p.d<13&&p.h<12);assert(W.buildings.some(b=>b.house&&b.x===p.x&&b.z===p.z));assert(W.nearestRoad(p.x,p.z).d>16);}
 for(const [x,z]of [[-1000,0],[0,1000],[1000,800],[-1000,-900]]){assert(far.filter(p=>Math.hypot(x-p.x,z-p.z)<350).length>=8,'missing houses past land edge');assert(homes.some(p=>Math.hypot(x-p.x,z-p.z)<350),'empty playable outskirts');}
 assert(W.roads.some(r=>r.residential&&r.samples.some(p=>Math.max(Math.abs(p.x),Math.abs(p.z))>1800)));
});
test('coastal street ends meet another road without beach stubs or gaps',()=>{
 const distance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=W.clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);};let checked=0;
 for(const road of W.roads)for(const p of [road.samples[0],road.samples.at(-1)]){if(Math.max(Math.abs(p.x),Math.abs(p.z))>1000||W.cityShoreDistance(p.x,p.z)>200)continue;checked++;
  assert(W.roads.some(other=>other!==road&&other.samples.some((q,i)=>i&&distance(p,other.samples[i-1],q)<1)),road.name+' ends without joining another road');
 }
 assert(checked>=20);assert(W.roads.some(r=>r.coastal&&r.samples[0].x< -2000&&r.samples.at(-1).x>2000));
 for(const road of W.roads.filter(r=>!r.coastal))for(const p of road.samples)assert(p.z-W.cityCoastRoadZ(p.x)>-.6,'road overshoots Waterfront Drive onto the beach');
});
test('24 slower cars use three complete safe routes through residential neighborhoods',()=>{
 const traffic=W.traffic.filter(t=>t.route.suburban),routes=W.trafficRoutes.filter(r=>r.suburban),houses=W.citySuburbPlans().filter(p=>!p.scenery);assert.equal(traffic.length,24);assert.equal(routes.length,3);assert(traffic.every(t=>t.cruise>=8&&t.cruise<11));
 for(const route of routes){let homesAlongRoute=0;for(let i=0;i<route.p.length;i++){const p=route.p[i],q=route.p[(i+1)%route.p.length],yaw=Math.atan2(q.x-p.x,q.z-p.z);if(houses.some(h=>Math.hypot(h.x-p.x,h.z-p.z)<65))homesAlongRoute++;
   for(const side of [-1,1]){const x=p.x+Math.cos(yaw)*2.35*side,z=p.z-Math.sin(yaw)*2.35*side,n=W.nearestRoad(x,z,2);assert(Math.max(Math.abs(x),Math.abs(z))<990,'traffic crosses invisible land limit');assert(n.p&&n.d<n.p.width/2-1.2,'lane leaves pavement');assert(buildings.every(b=>!W.circleOBB(x,z,1.5,b)),'route clips a home');
    for(const length of [-2.2,2.2])for(const width of [-.95,.95]){const xx=x+Math.sin(yaw)*length+Math.cos(yaw)*width,zz=z+Math.cos(yaw)*length-Math.sin(yaw)*width,edge=W.nearestRoad(xx,zz,2);assert(edge.p&&edge.d<edge.p.width/2+.35,'car cuts across a yard');}
   }
  }assert(homesAlongRoute/route.p.length>.3,'route misses the houses');
 }
});

test('both overpass jump ramps retain upward launch momentum at 205-285 km/h for every car',()=>{
 const previous=W.garage.selected;
 try{for(const model of W.carModels)for(const initialKph of [205,240,285])for(const boost of [false,true])for(const r of W.ramps.filter(r=>r.role==='jump')){
  W.garage.selected=model.id;W.resetVehicle(true);const p=W.rampPoint(r,0,-5);
  Object.assign(W.vehicle,{...p,y:W.driveHeight(p.x,p.z)+.12,yaw:r.yaw,vx:r.si*initialKph/3.6,vz:r.co*initialKph/3.6});
  let attached=false,launch=null,checked=false;
  for(let frame=0;frame<500;frame++){
   W.stepVehicle(1/120,{...input,boost},time+=1/120);const c=W.vehicle;
   if(c.ramp===r)attached=true;
   if(attached&&!c.ramp&&!launch){
    const grade=W.rampGradient(r,c.x,c.z),tangent=grade.x*c.vx+grade.z*c.vz;
    assert(!c.grounded);assert(c.vy>4,model.id+' loses upward speed on ramp '+r.id);assert(Math.abs(c.vy-tangent)<.7,'departure should follow the ramp tangent');
    launch={frame,y:c.y,vy:c.vy};
   }
   if(launch&&frame===launch.frame+30){assert(c.y>launch.y+.5,'car must keep rising after takeoff');assert(!c.grounded,'car snaps back to the overpass');checked=true;break;}
  }
  assert(attached&&launch&&checked,model.id+' failed to launch at '+initialKph+' km/h');
 }}finally{W.garage.selected=previous;}
});

test('Plane Car transitions from an actual ramp into a sustained boosted glide',()=>{
 const previous=W.garage.selected;try{
  W.garage.selected='plane';const r=W.ramps.find(r=>r.role==='jump'),p=W.rampPoint(r,0,-5);W.resetVehicle(true);
  Object.assign(W.vehicle,{...p,y:W.driveHeight(p.x,p.z)+.12,yaw:r.yaw,vx:r.si*240/3.6,vz:r.co*240/3.6});let attached=false,launch=null,peakSpeed=0,checked=false;
  for(let frame=0;frame<800;frame++){
   const boost=!!launch;W.stepVehicle(1/120,{...input,boost},time+=1/120);const c=W.vehicle;
   if(c.ramp===r)attached=true;if(attached&&!c.ramp&&!launch)launch={frame,y:c.y};
   if(launch){peakSpeed=Math.max(peakSpeed,Math.hypot(c.vx,c.vz)*3.6);if(frame===launch.frame+360){assert(!c.grounded);assert(c.y>launch.y+15,'glider loses its takeoff lift');assert(peakSpeed>289,'air nitro never reaches 290 km/h');checked=true;break;}}
  }
  assert(launch&&checked,'Plane Car never completed its glide');
 }finally{W.garage.selected=previous;}
});
