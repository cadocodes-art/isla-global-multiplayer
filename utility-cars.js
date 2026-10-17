'use strict';
(()=>{
 const W=Isla,T=THREE,R=IslaRules;W.trees=[];
 W.registerTree=(tree,parts)=>{tree.treeId=W.trees.length;tree.parts=parts;for(const p of parts)if(!p.mesh.instanceColor)p.mesh.setColorAt(p.index,new T.Color(1,1,1));W.trees.push(tree);return tree;};
 W.fellTree=(tree,dx=1,dz=0,remote=false)=>{
  if(!tree||tree.collapsed)return;tree.collapsed=true;
  const direction=new T.Vector3(dx,0,dz).normalize();if(direction.lengthSq()<.01)direction.set(1,0,0);
  const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction),transform=new T.Matrix4().makeTranslation(tree.x,tree.y+.2,tree.z).multiply(new T.Matrix4().makeRotationFromQuaternion(q)).multiply(new T.Matrix4().makeTranslation(-tree.x,-tree.y,-tree.z));
  for(const part of tree.parts||[]){part.original??=new T.Matrix4();if(!part.saved){part.mesh.getMatrixAt(part.index,part.original);part.saved=true;}part.mesh.setMatrixAt(part.index,new T.Matrix4().multiplyMatrices(transform,part.original));part.mesh.instanceMatrix.needsUpdate=true;}
  if(!remote)W.net?.treeHit?.(tree,dx,dz);
 };
 W.restoreTrees=()=>{for(const tree of W.trees){tree.collapsed=false;tree.wetTime=0;for(const p of tree.parts||[])if(p.saved){p.mesh.setMatrixAt(p.index,p.original);p.mesh.instanceMatrix.needsUpdate=true;}for(const p of tree.parts||[])if(p.mesh.instanceColor){p.mesh.setColorAt(p.index,new T.Color(1,1,1));p.mesh.instanceColor.needsUpdate=true;}}};
 W.wreckTraffic=t=>{if(t.wrecked)return;t.wrecked=true;t.burning=true;t.speed=0;t.stun=999;};
 W.tryWallClimb=(c,b,hit,approach)=>{
  if(!W.getCarSpec()?.sticky||c.wall||c.wallBlocked===b||!c.throttle||approach<2||b.h<5)return false;
  const nx=hit.nx,nz=hit.nz,tx=-nz,tz=nx,co=Math.cos(b.yaw),si=Math.sin(b.yaw),halfNormal=Math.abs(nx*co-nz*si)*b.w/2+Math.abs(nx*si+nz*co)*b.d/2,halfTangent=Math.abs(tx*co-tz*si)*b.w/2+Math.abs(tx*si+tz*co)*b.d/2;
  if(halfTangent<1.4)return false;const along=W.clamp((c.x-b.x)*tx+(c.z-b.z)*tz,-halfTangent+1.2,halfTangent-1.2),size=W.getCarSpec().size||1;
  c.wall={b,nx,nz,x:b.x+nx*(halfNormal+.12)+tx*along,z:b.z+nz*(halfNormal+.12)+tz*along,left:2+Math.random()*2,age:0,climbSpeed:W.clamp(approach*.35,8,18),floor:Math.max(b.y,W.driveHeight(c.x,c.z,true))+2.4*size};
  c.wallMode='climbing';c.ramp=null;c.grounded=true;c.y=Math.max(c.y,c.wall.floor);c.yaw=Math.atan2(-nx,-nz);c.vx=c.vz=0;c.vy=c.wall.climbSpeed;c.nitroTime=0;return true;
 };
 W.stepWallClimb=(dt,input)=>{
  const c=W.vehicle,spec=W.getCarSpec();
  if(c.wallBlocked&&(c.wallBlocked.collapsed||Math.hypot(c.x-c.wallBlocked.x,c.z-c.wallBlocked.z)>Math.hypot(c.wallBlocked.w,c.wallBlocked.d)/2+10))c.wallBlocked=null;
  if(!c.wall)return false;const w=c.wall;
  if(!spec.sticky||w.b.collapsed){c.wall=null;c.wallMode='';c.grounded=false;c.pitch=0;return false;}
  w.age+=dt;w.left=Math.max(0,w.left-dt);if(!input.gas||input.brake||w.left===0)c.wallMode='sliding';
  c.x=w.x;c.z=w.z;c.vx=c.vz=0;c.yawRate=0;c.steer=0;c.roll=0;c.pitch=Math.min(Math.PI/2,w.age*7);c.grounded=true;c.contact=1;c.waterMode='dry';c.airtime=0;c.surface=c.wallMode==='sliding'?'WALL SLIDE':'WALL CLIMB';c.nitroTime=0;c.nitroHeld=!!input.boost;c.nitroCharge=Math.min(1,c.nitroCharge+dt/W.nitro.rechargeDuration);
  c.vy=c.wallMode==='climbing'?w.climbSpeed:Math.max(-12,Math.min(0,c.vy)-7.5*dt);c.y+=c.vy*dt;
  const top=Math.max(w.floor,w.b.y+w.b.h-2.4*(spec.size||1));if(c.y>=top){c.y=top;if(c.vy>0)c.vy=0;}
  c.speed=c.vy;c.rpm=1500+Math.abs(c.vy)*160;c.distance+=Math.abs(c.vy)*dt;
  if(c.wallMode==='sliding'&&c.y<=w.floor){c.wallBlocked=w.b;c.wall=null;c.wallMode='';c.x+=w.nx*3;c.z+=w.nz*3;c.y=W.driveHeight(c.x,c.z,true)+.12;c.vx=w.nx*2;c.vz=w.nz*2;c.vy=0;c.pitch=0;c.speed=-2;}
  return true;
 };

 let streamMesh,streamCount=0,points,flames,waterGeo,fireGeo,dropTexture,wetGeometry,wetTexture,waterParticles=[],fireParticles=[],wetPatches=[],sprayClock=0;
 function init(){if(points)return;
  dropTexture=W.textureCanvas(64,(c,s)=>{const g=c.createRadialGradient(s/2,s/2,1,s/2,s/2,s/2);g.addColorStop(0,'#ffffff');g.addColorStop(.35,'#ffffffcc');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,s,s);});
  function cloud(max,size){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(max*3),3).setUsage(T.DynamicDrawUsage));geo.setAttribute('color',new T.BufferAttribute(new Float32Array(max*3),3).setUsage(T.DynamicDrawUsage));geo.setDrawRange(0,0);const mesh=new T.Points(geo,new T.PointsMaterial({map:dropTexture,size,transparent:true,depthWrite:false,vertexColors:true,opacity:.85}));mesh.frustumCulled=false;W.scene.add(mesh);return [mesh,geo];}
  streamMesh=new T.InstancedMesh(new T.CylinderGeometry(.07,.15,1,6),new T.MeshBasicMaterial({color:0x9cddff,transparent:true,opacity:.43,depthWrite:false}),768);streamMesh.count=0;streamMesh.frustumCulled=false;W.scene.add(streamMesh);
  [points,waterGeo]=cloud(1800,.32);[flames,fireGeo]=cloud(500,1.5);flames.material.blending=T.AdditiveBlending;flames.material.toneMapped=false;
  wetGeometry=new T.PlaneGeometry(1,1);wetTexture=W.textureCanvas(128,(c,s)=>{c.fillStyle='#42677525';c.fillRect(0,0,s,s);for(let i=0;i<55;i++){const x=(i*43.7)%s,y=(i*29.3)%s,r=1.2+i%5*.5;c.beginPath();c.ellipse(x,y,r,r*1.4,.4,0,Math.PI*2);c.fillStyle='#1b506e50';c.fill();c.strokeStyle='#d8f7ff9c';c.lineWidth=.65;c.stroke();c.fillStyle='#ffffffbb';c.fillRect(x-r*.4,y-r*.6,1,1);}});
 }
 function splash(jet){
  let patch=wetPatches.find(p=>(jet.car&&p.target===jet.car)||!jet.car&&!p.target&&p.building===jet.building&&Math.hypot(p.mesh.position.x-jet.end.x,p.mesh.position.y-jet.end.y,p.mesh.position.z-jet.end.z)<2);
  if(patch){patch.life=18;return;}
  if(wetPatches.length>=100){patch=wetPatches.shift();W.scene.remove(patch.mesh);patch.mesh.material.dispose();}
  const material=new T.MeshPhysicalMaterial({map:wetTexture,transparent:true,opacity:.68,roughness:.07,metalness:.15,clearcoat:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});const mesh=new T.Mesh(wetGeometry,material);mesh.position.set(jet.end.x,jet.end.y,jet.end.z);const normal=new T.Vector3(jet.normal?.x||0,jet.normal?.y??1,jet.normal?.z||0);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),normal);mesh.position.addScaledVector(normal,.025);mesh.scale.set(jet.car?1.6:jet.building!=null?2.4:4,jet.car?3.7:jet.building!=null?2.8:4,1);W.scene.add(mesh);wetPatches.push({mesh,life:18,target:jet.car,building:jet.building});
 }
 function spray(s,dt){
  const jets=R.hoseJets(s,W.buildings,(x,z)=>W.driveHeight(x,z,s.y<(W.bridgeSurface?.(x,z)??-Infinity)-.6));
  for(const jet of jets){
   for(let i=0;i<12&&streamCount<768;i++){const a=jet.distance*i/12,b=jet.distance*(i+1)/12,p=new T.Vector3(jet.start.x+jet.dx*a,jet.start.y+.10*a-.014*a*a,jet.start.z+jet.dz*a),q=new T.Vector3(jet.start.x+jet.dx*b,jet.start.y+.10*b-.014*b*b,jet.start.z+jet.dz*b),delta=q.clone().sub(p),matrix=new T.Matrix4().compose(p.add(q).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()),new T.Vector3(1,delta.length(),1));streamMesh.setMatrixAt(streamCount++,matrix);}
 
   for(let i=0;i<10;i++){const t=Math.random(),d=jet.distance*t;waterParticles.push({x:jet.start.x+jet.dx*d+(Math.random()-.5)*.25,y:jet.start.y+.10*d-.014*d*d+(Math.random()-.5)*.25,z:jet.start.z+jet.dz*d+(Math.random()-.5)*.25,vx:jet.dx*19,vy:2-d*.55,vz:jet.dz*19,life:Math.min(.22,(jet.distance-d)/19),span:.22});}
   splash(jet);
   for(const t of W.traffic){if(!R.inHose(jet,t))continue;t.wetTime=18;t.burning=false;splash({car:t,end:{x:t.x,y:t.y+1.54,z:t.z},normal:{y:1}});}
   for(const tree of W.trees)if(!tree.collapsed&&R.inHose(jet,tree)){tree.wetTime=18;for(const part of tree.parts||[]){part.mesh.setColorAt(part.index,new T.Color(.55,.72,.75));part.mesh.instanceColor.needsUpdate=true;}}
  }
 }
 W.updateUtilityEffects=(dt,active=true)=>{
  if(!W.scene)return;init();sprayClock+=dt;
  const emit=sprayClock>=.05;if(emit){sprayClock=0;streamCount=0;}
  const own=W.getCarSpec();if(active&&own.hoses&&W.vehicle.waterMode!=='sinking'&&emit)spray(W.vehicle,dt);
  for(const r of W.net?.remotes?.values()||[])if(r.car==='firetruck'&&r.connected&&!r.target.parked&&r.target.water!=='sinking'&&emit&&Math.hypot(r.current.x-W.vehicle.x,r.current.z-W.vehicle.z)<160)spray({...r.target,...r.current},dt);
  if(emit){streamMesh.count=streamCount;streamMesh.instanceMatrix.needsUpdate=true;}
  for(const t of W.traffic){t.wetTime=Math.max(0,(t.wetTime||0)-dt);if(t.wrecked&&t.burning&&emit&&Math.hypot(t.x-W.vehicle.x,t.z-W.vehicle.z)<180)for(let i=0;i<4;i++)fireParticles.push({x:t.x+(Math.random()-.5)*1.6,y:t.y+.7,z:t.z+(Math.random()-.5)*3,vx:(Math.random()-.5)*.5,vy:2+Math.random()*2,vz:(Math.random()-.5)*.5,life:.6+Math.random()*.5,span:1.1});}
  for(const tree of W.trees)if(tree.wetTime>0){tree.wetTime-=dt;if(tree.wetTime<=0)for(const part of tree.parts||[]){part.mesh.setColorAt(part.index,new T.Color(1,1,1));part.mesh.instanceColor.needsUpdate=true;}}
  function update(particles,geo,max,fire){if(particles.length>max)particles.splice(0,particles.length-max);for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(!fire)p.vy-=9.8*dt;}
   particles.forEach((p,i)=>{geo.attributes.position.setXYZ(i,p.x,p.y,p.z);const f=p.life/p.span;geo.attributes.color.setXYZ(i,fire?1:.58,fire?.25+f*.55:.85,fire?.03:1);});geo.setDrawRange(0,particles.length);geo.attributes.position.needsUpdate=geo.attributes.color.needsUpdate=true;
  }
  update(waterParticles,waterGeo,1800,false);update(fireParticles,fireGeo,500,true);
  for(let i=wetPatches.length-1;i>=0;i--){const p=wetPatches[i];p.life-=dt;if(p.building!=null&&W.buildings[p.building]?.collapsed)p.life=0;if(p.target){p.mesh.position.set(p.target.x,p.target.y+(p.target.wrecked?.8:1.54),p.target.z);p.mesh.rotation.set(-Math.PI/2,0,-p.target.yaw);}p.mesh.material.opacity=.68*Math.min(1,p.life/5);if(p.life<=0){W.scene.remove(p.mesh);p.mesh.material.dispose();wetPatches.splice(i,1);}}
 };
 W.clearUtilityEffects=()=>{if(streamMesh)streamMesh.count=0;waterParticles=[];fireParticles=[];for(const p of wetPatches){W.scene.remove(p.mesh);p.mesh.material.dispose();}wetPatches=[];W.restoreTrees();};
})();

