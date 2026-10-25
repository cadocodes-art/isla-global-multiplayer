/* V2.0 rules shared by the browser and room simulation. */
(function(root){'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const rules={launcherMinimum:150/3.6,treeMinimum:210/3.6,burstDuration:8};
 rules.rocket=()=>({left:0,cooldown:0,normal:0,nitro:0});
 rules.start=(r,random=Math.random)=>{if(r.left>0||r.cooldown>0)return false;r.left=8;r.normal=(571+random()*12)/3.6;r.nitro=(613+random()*20)/3.6;return true;};
 rules.stop=(r,random=Math.random)=>{if(r.left<=0)return false;r.left=0;r.cooldown=30+random()*5;return true;};
 rules.tick=(r,dt,cancel=false,random=Math.random)=>{if(r.left>0){if(cancel||r.left<=dt)rules.stop(r,random);else r.left-=dt;}else r.cooldown=Math.max(0,r.cooldown-dt);};
 rules.front=(c,target,speed=rules.launcherMinimum)=>Math.hypot(c.vx,c.vz)>speed&&((target.x-c.x)*Math.sin(c.yaw)+(target.z-c.z)*Math.cos(c.yaw))>0;
 rules.throwVelocity=c=>({vx:c.vx*.58,vy:clamp(Math.hypot(c.vx,c.vz)*.48,22,42),vz:c.vz*.58});
 rules.launchTraffic=(t,c)=>{if(t.flight)return false;const v=rules.throwVelocity(c);t.flight={age:0,vx:v.vx,vy:v.vy,vz:v.vz,baseY:t.y};t.stun=3;t.wrecked=false;return true;};
 rules.stepTraffic=(t,dt,height)=>{const f=t.flight;if(!f)return false;f.age+=dt;f.vy-=9.81*dt;t.x+=f.vx*dt;t.y+=f.vy*dt;t.z+=f.vz*dt;t.vx=f.vx;t.vz=f.vz;t.flightPitch=Math.sin(f.age*2)*.48;const y=height(t.x,t.z)+.12;if(t.y<=y&&f.vy<0){t.y=y;t.flightPitch=0;t.flight=null;t.offsetX=clamp(t.offsetX+(t.x-(t.launchX??t.x)),-600,600);t.offsetZ=clamp(t.offsetZ+(t.z-(t.launchZ??t.z)),-600,600);t.stun=3;t.speed=0;}return true;};
 rules.gridHeight=(g,x,z)=>{if(!g)return 0;const u=clamp((x-g.x)/g.step,0,g.nx-1),v=clamp((z-g.z)/g.step,0,g.nz-1),i=Math.min(g.nx-2,Math.floor(u)),j=Math.min(g.nz-2,Math.floor(v)),fx=u-i,fz=v-j,a=g.h[j*g.nx+i]*(1-fx)+g.h[j*g.nx+i+1]*fx,b=g.h[(j+1)*g.nx+i]*(1-fx)+g.h[(j+1)*g.nx+i+1]*fx;return a*(1-fz)+b*fz;};
 rules.makeProp=(b,kind,id,c)=>{const v=rules.throwVelocity(c),h=kind==='tree'?(b.h||8):b.r*2;return {kind,id,x:b.x,y:b.y+h*.5,z:b.z,ox:b.x,oy:b.y+h*.5,oz:b.z,h,r:b.r||1,vx:v.vx,vy:v.vy,vz:v.vz,age:0,yaw:c.yaw,landed:false};};
 rules.stepProp=(p,dt,height)=>{if(p.landed)return;p.age+=dt;p.vy-=9.81*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;const bottom=height(p.x,p.z)+(p.kind==='tree'?Math.max(.5,p.r):p.r*.7);if(p.y<bottom&&p.vy<0){p.y=bottom;p.vx=p.vy=p.vz=0;p.landed=true;}};
 root.IslaV20=rules;if(typeof module!=='undefined')module.exports=rules;
})(typeof globalThis!=='undefined'?globalThis:this);
