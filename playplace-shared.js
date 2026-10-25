/* Shared V1.93 rope physics: used by the browser and the global room. */
(()=>{'use strict';globalThis.IslaPlayShared=(W,T,bodies)=>{const ropes=W.playplace.ropes;
 W.playRopePosition=r=>new T.Vector3(r.x,49,r.z).addScaledVector(r.dir,r.length);
 const ropeGravity=58;W.playplace.ropeGravity=ropeGravity;
 function integrateRope(r,dt){const gravity=new T.Vector3(0,-ropeGravity,0);gravity.addScaledVector(r.dir,-gravity.dot(r.dir));r.velocity.addScaledVector(gravity,dt).multiplyScalar(Math.exp(-.4*dt));r.dir.addScaledVector(r.velocity,dt/r.length).normalize();r.velocity.addScaledVector(r.dir,-r.velocity.dot(r.dir));r.ax=Math.asin(W.clamp(r.dir.x,-1,1));r.az=Math.asin(W.clamp(r.dir.z,-1,1));}
 function ropeCar(r,c,dt){if(Math.hypot(c.x-r.x,c.z-r.z)>r.length+8||c.y>52)return;
  for(let pass=0;pass<4;pass++){const car=bodies.shape(c),bob=W.playRopePosition(r),hit=bodies.sphereHit(car,bob,2.4);if(!hit)break;
   let n=hit.normal;if(Math.abs(n.y)>.75&&c.y<W.height(c.x,c.z)+.5){n=new T.Vector3(c.vx||Math.sin(c.yaw||0),0,c.vz||Math.cos(c.yaw||0)).normalize();let extent=0;for(let j=0;j<3;j++)extent+=Math.abs(n.dot(car.axes[j]))*car.half.getComponent(j);hit.depth=2.4+extent-bob.clone().sub(car.p).dot(n);}const amount=Math.max(0,new T.Vector3(c.vx||0,c.vy||0,c.vz||0).sub(r.velocity).dot(n));
   if(amount>0){r.velocity.addScaledVector(n,Math.min(42,amount*.88));c.vx=(c.vx||0)-n.x*amount*.10;c.vy=(c.vy||0)-n.y*amount*.10;c.vz=(c.vz||0)-n.z*amount*.10;}
   const target=bob.addScaledVector(n,hit.depth+.015);r.dir.copy(target.sub(new T.Vector3(r.x,49,r.z))).normalize();
   const left=bodies.sphereHit(car,W.playRopePosition(r),2.4);if(left){c.x-=left.normal.x*(left.depth+.01);c.y-=left.normal.y*(left.depth+.01);c.z-=left.normal.z*(left.depth+.01);}
   c.y=Math.max(W.height(c.x,c.z)+.03,c.y);
  }
  // Closest point on the thin cord against the full chassis, not just its centre.
  const car=bodies.shape(c),anchor=new T.Vector3(r.x,49,r.z),end=W.playRopePosition(r),distance=t=>{const p=anchor.clone().lerp(end,t).sub(car.p);let d=0;for(let i=0;i<3;i++){const e=Math.max(0,Math.abs(p.dot(car.axes[i]))-car.half.getComponent(i));d+=e*e;}return d;};
  let lo=.01,hi=1-2.4/r.length;for(let i=0;i<16;i++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(distance(a)<distance(b))hi=b;else lo=a;}
  const fraction=(lo+hi)/2,point=anchor.clone().lerp(end,fraction),cord=bodies.sphereHit(car,point,.20);if(cord){let n=point.clone().sub(car.p);n.addScaledVector(r.dir,-n.dot(r.dir));if(n.lengthSq()<1e-8)n.set(Math.sin(c.yaw||0),0,Math.cos(c.yaw||0));n.normalize();let extent=0;for(let j=0;j<3;j++)extent+=Math.abs(n.dot(car.axes[j]))*car.half.getComponent(j);const depth=Math.max(0,extent+.21-point.clone().sub(car.p).dot(n));c.x-=n.x*depth;c.y-=n.y*depth;c.z-=n.z*depth;const impact=Math.max(0,(c.vx||0)*n.x+(c.vy||0)*n.y+(c.vz||0)*n.z-r.velocity.dot(n)*fraction);r.velocity.addScaledVector(n,Math.min(28,impact*.65/fraction));c.vx=(c.vx||0)-n.x*impact*.35;c.vy=(c.vy||0)-n.y*impact*.35;c.vz=(c.vz||0)-n.z*impact*.35;}
  if(r.velocity.length()>45)r.velocity.setLength(45);r.velocity.addScaledVector(r.dir,-r.velocity.dot(r.dir));r.ax=Math.asin(W.clamp(r.dir.x,-1,1));r.az=Math.asin(W.clamp(r.dir.z,-1,1));
 }
 W.collidePlayRopes=(car,dt)=>{for(const r of ropes)ropeCar(r,car,dt);};
 W.swingRope=(r,car,dt)=>{for(let left=dt;left>1e-8;){const h=Math.min(left,1/120);left-=h;integrateRope(r,h);ropeCar(r,car,h);}if(r.mesh)r.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),r.dir);};

 W.addPlaySeesaws=plans=>{W.playplace.seesaws=[];for(const plan of plans){const b=bodies.create({kind:'platform',name:'SEESAW',seesaw:true,x:plan.x,y:16.4,z:plan.z,w:12,h:.8,d:40,yaw:plan.yaw});b.baseYaw=plan.yaw;b.angle=-.235;b.tiltSpeed=0;b.q.setFromEuler(new T.Euler(b.angle,b.baseYaw,0,'YXZ'));b.motion=(time,dt=1/120)=>{let torque=0;for(const c of W.playplace.drivers||[W.vehicle]){if(!c)continue;const top=bodies.surface(b,c.x,c.z);if(!top||Math.abs(c.y-top.y-.12)>1.5)continue;const along=(c.x-b.x)*Math.sin(b.baseYaw)+(c.z-b.z)*Math.cos(b.baseYaw),spec=W.carModels.find(m=>m.id===(c.car||W.garage?.selected));torque+=(spec?.mass||1)*along/20;}b.tiltSpeed+=(torque*1.8-(b.angle+.235)*.45-b.tiltSpeed*2.8)*dt;b.tiltSpeed=W.clamp(b.tiltSpeed,-1,1);b.angle+=b.tiltSpeed*dt;if(Math.abs(b.angle)>.235){b.angle=W.clamp(b.angle,-.235,.235);b.tiltSpeed=0;}b.q.setFromEuler(new T.Euler(b.angle,b.baseYaw,0,'YXZ'));return {x:b.x,y:b.y,z:b.z};};bodies.sync(b);W.playplace.seesaws.push(b);}bodies.reindex();};
 return {integrateRopes:dt=>{for(const r of ropes)integrateRope(r,dt);}};
};})();

globalThis.IslaPlayRampTriangles=(T,ramps)=>{const list=[];function quad(a,b,c,d){for(const p of [[a,c,b],[b,c,d]]){const triangle=new T.Triangle(...p);list.push({triangle,normal:triangle.getNormal(new T.Vector3())});}}for(const r of ramps){const point=(u,s,ground=false)=>new T.Vector3(r.x+Math.cos(r.yaw)*u+Math.sin(r.yaw)*(s-r.d/2),(r.baseY??12)+(ground?0:.04+r.rise*(s/r.d)**2),r.z-Math.sin(r.yaw)*u+Math.cos(r.yaw)*(s-r.d/2));for(let i=0;i<26;i++){const s=i*r.d/26,e=(i+1)*r.d/26,a=point(-r.w/2,s),b=point(r.w/2,s),c=point(-r.w/2,e),d=point(r.w/2,e);quad(a,b,c,d);quad(point(-r.w/2,s,true),a,point(-r.w/2,e,true),c);quad(b,point(r.w/2,s,true),d,point(r.w/2,e,true));}quad(point(-r.w/2,r.d,true),point(r.w/2,r.d,true),point(-r.w/2,r.d),point(r.w/2,r.d));}return list;};
