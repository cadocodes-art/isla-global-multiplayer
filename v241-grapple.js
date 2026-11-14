/* Per-car grappling state, shared by desktop, touch and both split-screen drivers. */
(function(root){'use strict';const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 function nearest(c,buildings,range){let best=null;for(const b of buildings||[]){if(b.collapsed||!b.w||!b.d||!b.h)continue;const co=Math.cos(b.yaw||0),si=Math.sin(b.yaw||0),dx=c.x-b.x,dz=c.z-b.z,lx=dx*co-dz*si,lz=dx*si+dz*co;
   let x=clamp(lx,-b.w/2,b.w/2),z=clamp(lz,-b.d/2,b.d/2);if(x===lx&&z===lz){if(b.w/2-Math.abs(lx)<b.d/2-Math.abs(lz))x=(lx<0?-1:1)*b.w/2;else z=(lz<0?-1:1)*b.d/2;}
   const ax=b.x+x*co+z*si,az=b.z-x*si+z*co,y=clamp(c.y+Math.min(18,b.h*.65),b.y+Math.min(3,b.h*.5),b.y+b.h-.2),d=Math.hypot(ax-c.x,az-c.z),length=Math.hypot(ax-c.x,y-c.y,az-c.z);if(d<2||length>range)continue;if(!best||length<best.score)best={x:ax,y,z:az,score:length,length,target:b};}return best;
 }
 function attach(c,anchor){if(!anchor)return false;c.grapple={...anchor};c.grappleActive=true;c.grounded=false;c.roadMode=false;c.roadFrame=null;c.vy=Math.max(c.vy||0,8);c.y+=.4;return true;}
 function release(c){c.grapple=null;c.grappleActive=false;}
 function step(dt,input,c,s){const g=c.grapple;if(!g)return;if(!s.grappler||g.target?.collapsed||c.waterMode==='sinking'){release(c);return;}const dx=g.x-c.x,dy=g.y-c.y,dz=g.z-c.z,d=Math.hypot(dx,dy,dz),horizontal=Math.hypot(dx,dz);if(d<3||d>s.grappleRange*1.5){release(c);return;}
   const nx=dx/d,ny=dy/d,nz=dz/d,steer=clamp(input.steer||0,-1,1),tx=horizontal>1e-5?dz/horizontal:Math.cos(c.yaw),tz=horizontal>1e-5?-dx/horizontal:-Math.sin(c.yaw),gas=clamp(input.gas||0,0,1),brake=clamp(input.brake||0,0,1);
   // Steering is tangent to the rope, so holding either direction produces a stable orbit.
   g.length=Math.max(9,g.length-dt*(3+gas*8));const pull=(s.grapplePull||28)*1.35+clamp(d-g.length,0,12)*5;
   c.vx+=nx*pull*dt+tx*steer*58*dt;c.vz+=nz*pull*dt+tz*steer*58*dt;c.vy+=ny*pull*dt+9*dt;
   const damping=Math.exp(-dt*(.08+brake*2.2));c.vx*=damping;c.vz*=damping;c.vy*=Math.exp(-dt*.12);
   if(d>=g.length){const radial=c.vx*nx+c.vy*ny+c.vz*nz;if(radial<0){c.vx-=nx*radial;c.vy-=ny*radial;c.vz-=nz*radial;}}
   const speed=Math.hypot(c.vx,c.vz),limit=Math.max(35,(s.boostLimit||279/3.6));if(speed>limit){c.vx*=limit/speed;c.vz*=limit/speed;}
   if(speed>2){c.yaw+=wrap(Math.atan2(c.vx,c.vz)-c.yaw)*(1-Math.exp(-dt*7));c.yawRate=0;}
   c.vy=clamp(c.vy,-24,32);c.grappleDistance=d;c.grappleAimYaw=wrap(Math.atan2(dx,dz)-c.yaw);c.grappleAimPitch=Math.atan2(dy,horizontal);c.grappleActive=true;
 }
 root.IslaGrapple={nearest,attach,release,step};if(typeof module!=='undefined')module.exports=root.IslaGrapple;
})(globalThis);
