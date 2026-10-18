/* V1.7: contact against the same three-dimensional road strips that are drawn. */
(()=>{'use strict';const W=Isla,M=IslaMaker,T=THREE;
 W.makerBoxHit=(x,y,z,r,b)=>{const o=b.obb,delta=new T.Vector3(x-o.origin.x,y-o.origin.y,z-o.origin.z),axes=o.axes.map(a=>new T.Vector3(a.x,a.y,a.z)),p=axes.map(a=>delta.dot(a)),lo=[-o.w/2,0,-o.d/2],hi=[o.w/2,o.h,o.d/2],q=p.map((n,i)=>W.clamp(n,lo[i],hi[i])),d=p.map((n,i)=>n-q[i]);let distance=Math.hypot(...d),depth=r-distance;if(depth<=0)return null;if(distance<1e-7){let edge=Infinity,axis=0,sign=1;for(let i=0;i<3;i++)for(const direction of [-1,1]){const gap=direction<0?p[i]-lo[i]:hi[i]-p[i];if(gap<edge){edge=gap;axis=i;sign=direction;}}d.fill(0);d[axis]=sign;distance=1;depth=r+edge;}const n=new T.Vector3();axes.forEach((a,i)=>n.addScaledVector(a,d[i]/distance));return {nx:n.x,ny:n.y,nz:n.z,depth};};
 W.installMakerDriving=(roads,height)=>{
  const bins=new Map(),cell=24,triangles=[],v=p=>new T.Vector3(p.x,p.y,p.z);
  for(const road of roads){const corners=M.roadCorners(road,height);for(let i=1;i<corners.length;i++){const pts=[...corners[i-1],...corners[i]].map(v);for(const ix of [[0,2,1],[1,2,3]]){const triangle=new T.Triangle(...ix.map(j=>pts[j])),normal=triangle.getNormal(new T.Vector3());if(normal.lengthSq()<.5)continue;const data={triangle,normal,road},box=new T.Box3().setFromPoints(ix.map(j=>pts[j])).expandByScalar(1);triangles.push(data);for(let x=Math.floor(box.min.x/cell);x<=Math.floor(box.max.x/cell);x++)for(let y=Math.floor(box.min.y/cell);y<=Math.floor(box.max.y/cell);y++)for(let z=Math.floor(box.min.z/cell);z<=Math.floor(box.max.z/cell);z++){const key=x+','+y+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(data);}}}}
  function contact(position,range=.7,previous=null){const list=bins.get(Math.floor(position.x/cell)+','+Math.floor(position.y/cell)+','+Math.floor(position.z/cell))||[],q=new T.Vector3(),bary=new T.Vector3(),feet=new T.Vector3();let best=null,score=range;
   for(const data of list){
    const gap=position.clone().sub(data.triangle.a).dot(data.normal);
    if(gap<-.35||gap>range||previous&&previous.dot(data.normal)<.5)continue;
    // Contact must be above the actual road face. Clamping to a triangle's
    // closest edge repeatedly pulls an exiting car back, forming an invisible wall.
    q.copy(position).addScaledVector(data.normal,-gap);data.triangle.getBarycoord(q,bary);
    if(Math.min(bary.x,bary.y,bary.z)<-1e-7)continue;
    // A tilted piece may extend underground. Its hidden face cannot replace
    // the terrain underneath the car, including when reversing down the piece.
    feet.copy(q).addScaledVector(data.normal,.12);
    if(feet.y<height(feet.x,feet.z)+.10-1e-6)continue;
    const d=Math.abs(gap);if(d<score){score=d;best={...data,point:q.clone(),gap};}
   }
   return best;
  }
  W.makerRoadContact=(p,range)=>contact(v(p),range);W.makerRoadTriangles=triangles;
  W.stepMakerRoad=(dt,input,time)=>{
   const c=W.vehicle;if(c.wall)return false;let pos=v(c),velocity=new T.Vector3(c.vx,c.vy,c.vz),speed=velocity.length(),hit=contact(pos,.7,c.roadFrame?.up);
   if(!hit||!c.roadFrame&&velocity.dot(hit.normal)>4||hit.normal.y<.25&&speed<15){c.roadFrame=null;c.roadMode=false;return false;}
   const previousAir=c.airtime,spec=W.getCarSpec(),size=spec.size||1,mass=spec.mass||1,up=hit.normal.clone();let forward=c.roadFrame?.forward.clone()||new T.Vector3(Math.sin(c.yaw),0,Math.cos(c.yaw));forward.addScaledVector(up,-forward.dot(up));if(forward.lengthSq()<.01)forward=velocity.clone().addScaledVector(up,-velocity.dot(up));if(forward.lengthSq()<.01){c.roadMode=false;return false;}forward.normalize();
   let along=velocity.dot(forward);if(!input.boost)c.nitroTime=0;if(input.boost&&!c.nitroHeld&&c.nitroTime<=0&&c.nitroCharge===1&&along>=-.6){c.nitroDuration=5+Math.random()*2;c.nitroTime=c.nitroDuration;W.onNitroStart?.(c.nitroDuration);}c.nitroHeld=!!input.boost;const boost=c.nitroTime>0,gas=boost?1:W.clamp(Number(input.gas)||0,0,1),brake=W.clamp(Number(input.brake)||0,0,1),scale=spec.speedScale||1,engine=spec.engine||1;
   c.steer=W.mix(c.steer,(input.steer||0)*.56/(1+Math.abs(along)*.027),1-Math.exp(-dt*5.5/Math.sqrt(mass)));const turn=W.clamp(along/(2.85*size)*Math.tan(c.steer),-10/Math.max(4,Math.abs(along)),10/Math.max(4,Math.abs(along)));forward.applyAxisAngle(up,turn*dt);const right=new T.Vector3().crossVectors(up,forward).normalize();
   const lateral=velocity.dot(right);let acceleration=gas?(along<-.6?10:Math.min(7.6*engine,220*engine/(Math.abs(along)/scale+12)))*gas:brake?(along>.6?-11.8:-4.2)*brake:-Math.sign(along)*(.2+Math.abs(along)*.016);
   acceleration=acceleration*scale/mass-(along/scale*Math.abs(along/scale)*.0016+Math.sign(along)*.14)*scale/mass;
   if(boost&&!brake&&!input.handbrake)acceleration+=(spec.thrust||8)/mass*W.clamp(((spec.boostMax||53)-Math.max(0,along))/7,0,1);
   if(input.handbrake)acceleration-=Math.sign(along)*5.1/mass;
   velocity.addScaledVector(up,-velocity.dot(up));velocity.addScaledVector(forward,acceleration*dt);velocity.addScaledVector(right,-lateral*Math.min(1,dt*(input.handbrake?1.5:7.5)));
   const gravity=new T.Vector3(0,-9.81,0);gravity.addScaledVector(up,-gravity.dot(up));velocity.addScaledVector(gravity,dt);
   const max=boost?(spec.boostLimit||spec.boostMax||53):Math.max(66,spec.boostMax||66);if(velocity.length()>max)velocity.setLength(max);
   pos.copy(hit.point).addScaledVector(up,.12).addScaledVector(velocity,dt);const next=contact(pos,1,up);
   if(next){const q=new T.Quaternion().setFromUnitVectors(up,next.normal);forward.applyQuaternion(q).normalize();velocity.applyQuaternion(q);up.copy(next.normal);pos.copy(next.point).addScaledVector(up,.12);hit=next;}
   // Hand back to terrain physics at ground level, without spending a frame
   // below the surface when a road descends into it.
   const terrain=height(pos.x,pos.z),terrainLanding=!next&&terrain>=-.5&&pos.y<terrain+.12;
   if(terrainLanding){pos.y=terrain+.12;velocity.y=Math.max(0,velocity.y);}
   const lateralAxis=new T.Vector3().crossVectors(up,forward).normalize(),orientation=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(lateralAxis,up,forward)),euler=new T.Euler().setFromQuaternion(orientation,'YXZ');
   Object.assign(c,{x:pos.x,y:pos.y,z:pos.z,vx:velocity.x,vy:velocity.y,vz:velocity.z,yaw:euler.y,pitch:-euler.x,roll:euler.z,yawRate:turn,speed:velocity.dot(forward),grounded:!!next||terrainLanding,roadMode:!!next,roadFrame:next?{up,forward}:null,ramp:null,contact:next||terrainLanding?1:0,surface:terrainLanding?'OFF ROAD':hit.road.surface==='stone'?'STONE ROAD':'ASPHALT',waterMode:'dry',skimTime:0,waterTime:0,airtime:next||terrainLanding?0:dt,throttle:gas,brake,slip:Math.abs(lateral)});
   c.distance+=velocity.length()*dt;c.gear=c.speed<-.7?-1:Math.abs(c.speed)<.3?0:Math.min(5,1+Math.floor(Math.abs(c.speed)/13));c.rpm=W.mix(c.rpm,Math.min(7200,1000+Math.abs(c.speed)*90+gas*500),1-Math.exp(-dt*10));
   if(boost){c.nitroTime=Math.max(0,c.nitroTime-dt);c.nitroCharge=Math.max(0,c.nitroCharge-dt/c.nitroDuration);}else{c.nitroCharge=Math.min(1,c.nitroCharge+dt/W.nitro.rechargeDuration);if(c.nitroCharge>1-1e-9)c.nitroCharge=1;}
   if(previousAir>.27)W.onLanding?.(previousAir,velocity.dot(up));W.collideVehicle?.(c,time);return true;
  };
 };
})();
