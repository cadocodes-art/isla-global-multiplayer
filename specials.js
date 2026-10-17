'use strict';
(()=>{
 const W=Isla,T=THREE,R=IslaRules,nukes=[],bursts=[];
 let elapsed=0,lastCar='',flashGeo,ringGeo;
 W.nukeRemaining=()=>Math.max(0,R.nuke.cooldown-elapsed);
 W.stepWeapons=dt=>{
  const car=W.getCarSpec();if(lastCar!==car.id){elapsed=0;lastCar=car.id;}
  if(!car.weapon||W.vehicle.waterMode==='sinking')return;
  if(W.net?.active)return;
  elapsed+=dt;if(elapsed+1e-8<R.nuke.cooldown)return;elapsed=0;
  const shot=R.nukeShot(W.vehicle,car.size||1);W.showNuke(shot,true);
 };
 W.syncNukeTimer=remaining=>{elapsed=R.nuke.cooldown-W.clamp(remaining,0,R.nuke.cooldown);};
 W.showNuke=(shot,local=false)=>{
  if(!W.scene)return;
  const root=new T.Group(),metal=W.mat('#313c30',.45),gold=W.mat('#e8b646');
  const shell=new T.Mesh(new T.CylinderGeometry(.3,.3,1.5,12),metal);shell.rotation.x=Math.PI/2;root.add(shell);
  const nose=new T.Mesh(new T.ConeGeometry(.3,.55,12),gold);nose.rotation.x=-Math.PI/2;nose.position.z=-1;root.add(nose);
  for(const side of [-1,1])W.box(root,side*.35,0,.55,.5,.09,.5,gold);
  const flame=new T.Mesh(new T.ConeGeometry(.24,1,10),new T.MeshBasicMaterial({color:0xffab35}));flame.rotation.x=Math.PI/2;flame.position.z=1.2;root.add(flame);
  root.position.set(shot.x,shot.y,shot.z);root.rotation.y=shot.yaw;W.scene.add(root);nukes.push({shot,root,age:0,local});
 };
 function dispose(root){W.scene.remove(root);const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry&&o.geometry!==W.unitBox)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 W.blastDamage=blast=>{
  for(const b of W.buildings){if(b.collapsed||!R.blastHits(blast,b))continue;b.hp=0;b.collapsed=true;W.onBuildingDamage?.(b,100,0);W.onCollapse?.(b);}
  for(const t of W.traffic||[])R.blastTraffic(blast,t);
 };
 W.showNukeBlast=blast=>{
  if(!W.scene)return;
  flashGeo??=new T.SphereGeometry(1,20,12);ringGeo??=new T.RingGeometry(.93,1,48);
  const group=new T.Group(),fireMat=new T.MeshBasicMaterial({color:0xffac38,transparent:true,opacity:.8,depthWrite:false}),ringMat=new T.MeshBasicMaterial({color:0xffd393,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide});
  const fire=new T.Mesh(flashGeo,fireMat),ring=new T.Mesh(ringGeo,ringMat);ring.rotation.x=-Math.PI/2;group.add(fire,ring);group.position.set(blast.x,blast.y,blast.z);W.scene.add(group);bursts.push({group,fire,ring,age:0,fireMat,ringMat});W.onNukeBlast?.(blast);
 };
 W.updateWeapons=dt=>{
  for(let i=nukes.length-1;i>=0;i--){const n=nukes[i];n.age+=dt;const k=Math.min(1,n.age/R.nuke.flight),s=n.shot;n.root.position.set(W.mix(s.x,s.target.x,k),W.mix(s.y,s.target.y,k)+Math.sin(k*Math.PI)*3,W.mix(s.z,s.target.z,k));
   if(k===1){if(n.local){W.blastDamage(s.target);W.showNukeBlast(s.target);}dispose(n.root);nukes.splice(i,1);}
  }
  for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.age+=dt;const k=Math.min(1,b.age/1.4);b.fire.scale.setScalar(2+Math.sin(k*Math.PI)*R.nuke.radius*.65);b.ring.scale.setScalar(2+k*R.nuke.radius);b.fireMat.opacity=(1-k)*.65;b.ringMat.opacity=(1-k)*.8;
   if(k===1){W.scene.remove(b.group);b.fireMat.dispose();b.ringMat.dispose();bursts.splice(i,1);}
  }
 };
 W.clearWeapons=()=>{elapsed=0;lastCar='';for(const n of nukes)dispose(n.root);nukes.length=0;for(const b of bursts){W.scene.remove(b.group);b.fireMat.dispose();b.ringMat.dispose();}bursts.length=0;};
})();
