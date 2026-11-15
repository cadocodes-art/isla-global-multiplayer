/* Per-car grappling state, shared by desktop, touch and both split-screen drivers. */
(function(root){'use strict';const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),descent=.65,duration=10,cooldown=5;
 function upright(c){c.pitch=0;c.roll=0;c.trickAngle=0;c.trickSpin=false;c.roadMode=false;c.roadFrame=null;c.wallMode='';c.wall=null;c.ramp=null;c.roof=null;c.playSupport=null;}
 function nearest(c,buildings,range){let best=null;for(const b of buildings||[]){if(b.collapsed||!b.w||!b.d||!b.h)continue;const co=Math.cos(b.yaw||0),si=Math.sin(b.yaw||0),dx=c.x-b.x,dz=c.z-b.z,lx=dx*co-dz*si,lz=dx*si+dz*co;
   let x=clamp(lx,-b.w/2,b.w/2),z=clamp(lz,-b.d/2,b.d/2);if(x===lx&&z===lz){if(b.w/2-Math.abs(lx)<b.d/2-Math.abs(lz))x=(lx<0?-1:1)*b.w/2;else z=(lz<0?-1:1)*b.d/2;}
   const ax=b.x+x*co+z*si,az=b.z-x*si+z*co,y=clamp(c.y+Math.min(18,b.h*.65),b.y+Math.min(3,b.h*.5),b.y+b.h-.2),d=Math.hypot(ax-c.x,az-c.z),length=Math.hypot(ax-c.x,y-c.y,az-c.z);if(d<2||length>range)continue;if(!best||length<best.score)best={x:ax,y,z:az,score:length,length,target:b};}return best;
 }
 function attach(c,anchor){if(!anchor||c.grapple||(c.grappleCooldown||0)>1e-8)return false;const b=anchor.target,dx=c.x-b.x,dz=c.z-b.z,r=Math.hypot(dx,dz),angle=Math.atan2(dx,dz),tangent=(c.vx||0)*Math.cos(angle)-(c.vz||0)*Math.sin(angle);
   const takeoff=!!c.grounded&&!c.grappleChain;
   c.grapple={...anchor,remaining:duration,cx:b.x,cz:b.z,halfDiagonal:Math.hypot(b.w,b.d)/2,angularSpeed:r?clamp(tangent/r,-2,2):0,direction:Math.sign(tangent)||-1,height:c.y,takeoff:takeoff?c.y+5:null};
   c.grappleChain=true;c.grappleFloorTime=0;c.grappleLaunchCoast=false;c.grappleActive=true;c.grounded=false;upright(c);if(!takeoff)c.vy=-descent;return true;}
 function release(c){if(c.grapple)c.grappleCooldown=cooldown;c.grapple=null;c.grappleActive=false;}
 function status(c){const remaining=Math.max(0,c.grapple?.remaining??0),waiting=Math.max(0,c.grappleCooldown||0);return {remaining,cooldown:waiting,disabled:!c.grapple&&waiting>0,label:c.grapple?'RELEASE · '+remaining.toFixed(1)+'s':waiting>0?'COOLDOWN · '+waiting.toFixed(1)+'s':'GRAPPLE · F'};}
 function launch(c,s){if(!c.grapple)return false;const speed=Math.hypot(c.vx,c.vz);release(c);upright(c);if(speed>4){const target=Math.max(speed,Math.min(speed*1.65+12,(s.boostLimit||279/3.6)*1.6));c.vx*=target/speed;c.vz*=target/speed;c.yaw=Math.atan2(c.vx,c.vz);c.yawRate=0;c.speed=target;c.grappleLaunchCoast=true;}return true;}
 function finish(dt,c,s){if(c.grapple){upright(c);if(!c.grapple.takeoff&&c.grounded&&c.waterMode==='dry')release(c);}
   if(!s.grappler||c.waterMode==='sinking'){c.grappleLaunchCoast=false;c.grappleChain=false;c.grappleFloorTime=0;}
   else if(!c.grapple&&c.grounded&&c.waterMode==='dry'){c.grappleLaunchCoast=false;c.grappleFloorTime=(c.grappleFloorTime||0)+dt;if(c.grappleFloorTime>=.75)c.grappleChain=false;}else c.grappleFloorTime=0;
 }
 function step(dt,input,c,s,ground){if(!Number.isFinite(dt)||dt<=0)return;c.grappleCooldown=Math.max(0,(c.grappleCooldown||0)-dt);if(c.grappleCooldown<1e-8)c.grappleCooldown=0;const g=c.grapple;if(!g)return;g.remaining=Math.max(0,(g.remaining??duration)-dt);if(g.remaining<1e-8){release(c);return;}if(!s.grappler||g.target?.collapsed||c.waterMode==='sinking'){release(c);return;}const b=g.target,dx=c.x-g.cx,dz=c.z-g.cz,r=Math.hypot(dx,dz);if(!Number.isFinite(r)||r<.1||r>g.halfDiagonal+s.grappleRange*1.8){release(c);return;}
   const size=s.size||1,clearance=5*size+1,minRadius=g.halfDiagonal+clearance,steer=clamp(input.steer||0,-1,1),gas=clamp(input.gas||0,0,1),brake=Math.max(clamp(input.brake||0,0,1),input.handbrake?1:0),angle=Math.atan2(dx,dz);
   if(Math.abs(steer)>.12)g.direction=-Math.sign(steer);
   // First move outward on the current face. Turning starts only outside the
   // circle that encloses every corner plus the full car and a safety margin.
   const entering=r<minRadius,goal=minRadius+.8+1.2*(1-gas),radial=clamp((goal-r)*7,-24,32),nextRadius=Math.max(.1,r+radial*dt);
   const levelFactor=clamp((s.grapplePull||28)/28,1,1.35),limit=s.boostLimit||279/3.6,speed=Math.min(limit*(input.boost?1:.92),75*levelFactor)*(1-brake),omega=entering?0:g.direction*Math.min(3.2*levelFactor,speed/r);
   g.angularSpeed+=(omega-g.angularSpeed)*(1-Math.exp(-dt*(brake?14:9)));if(entering)g.angularSpeed=0;
   const nextAngle=angle+g.angularSpeed*dt;
   // Exact arc integration supplies the centripetal motion that a weak pull
   // cannot provide at this speed. Normal game physics still handles impacts.
   c.vx=(g.cx+Math.sin(nextAngle)*nextRadius-c.x)/dt;c.vz=(g.cz+Math.cos(nextAngle)*nextRadius-c.z)/dt;
   // Only a fresh hook from the ground gets a gradual five-meter lift-off.
   // An airborne re-hook inherits its exact height, even on a taller building.
   if(g.takeoff!==null){g.height=Math.min(g.takeoff,g.height+5*dt);c.vy=clamp((g.height-c.y)/dt,-descent,5)+9.81*dt;if(g.height>=g.takeoff&&c.y>=g.takeoff-.1)g.takeoff=null;}
   else{g.height=Math.min(g.height,c.y)-descent*dt;c.vy=clamp((g.height-c.y)/dt,-descent,0)+9.81*dt;}
   upright(c);
   const v=Math.hypot(c.vx,c.vz);if(v>2){c.yaw+=wrap(Math.atan2(c.vx,c.vz)-c.yaw)*(1-Math.exp(-dt*12));c.yawRate=0;}
   // The hook/rope follows the visible near face as it wraps around corners;
   // its physical orbit remains centered on the entire building.
   const co=Math.cos(b.yaw||0),si=Math.sin(b.yaw||0),lx=dx*co-dz*si,lz=dx*si+dz*co,x=clamp(lx,-b.w/2,b.w/2),z=clamp(lz,-b.d/2,b.d/2);g.x=b.x+x*co+z*si;g.z=b.z-x*si+z*co;
   const hx=g.x-c.x,hz=g.z-c.z,hy=g.y-c.y;g.length=Math.hypot(hx,hy,hz);c.grappleDistance=g.length;c.grappleAimYaw=wrap(Math.atan2(hx,hz)-c.yaw);c.grappleAimPitch=Math.atan2(hy,Math.hypot(hx,hz));c.grappleActive=true;
 }
 root.IslaGrapple={nearest,attach,release,launch,finish,upright,step,descent,duration,cooldown,status};if(typeof module!=='undefined')module.exports=root.IslaGrapple;
})(globalThis);
