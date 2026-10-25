/* Shared capsule sweep. Only the room server decides player impacts. */
(function(root){'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function collide(a,b,oldA=a,oldB=b,modelA={},modelB={}){
  const sa=modelA.size||1,sb=modelB.size||1,ma=modelA.mass||1,mb=modelB.mass||1,ia=1/ma,ib=1/mb;
  if(a.water==='sinking'||b.water==='sinking'||Math.max(a.y,b.y)>Math.min(a.y+1.5*sa,b.y+1.5*sb))return null;
  const radius=(modelA.launcher?1.2:.94)*sa+(modelB.launcher?1.2:.94)*sb,point=(s,off,size)=>({x:s.x+Math.sin(s.yaw)*off*size,z:s.z+Math.cos(s.yaw)*off*size});let best=null;
  for(const oa of [-1.12,modelA.launcher?2.2:1.12])for(const ob of [-1.12,modelB.launcher?2.2:1.12]){const ap=point(a,oa,sa),bp=point(b,ob,sb),ao=point(oldA,oa,sa),bo=point(oldB,ob,sb),x=ao.x-bo.x,z=ao.z-bo.z,dx=ap.x-bp.x-x,dz=ap.z-bp.z-z,A=dx*dx+dz*dz,B=2*(x*dx+z*dz),C=x*x+z*z-radius*radius;let t=null;
   if(C<=0)t=0;else if(A>1e-9){const D=B*B-4*A*C;if(D>=0){const enter=(-B-Math.sqrt(D))/(2*A);if(enter>=0&&enter<=1)t=enter;}}
   if(t===null)continue;const hx=x+dx*t,hz=z+dz*t,d=Math.hypot(hx,hz),nx=d>1e-6?hx/d:1,nz=d>1e-6?hz/d:0,depth=radius-((ap.x-bp.x)*nx+(ap.z-bp.z)*nz);if(depth<=0)continue;if(!best||t<best.t)best={t,nx,nz,depth};
  }
  if(!best)return null;const {nx,nz}=best,closing=-((a.vx-b.vx)*nx+(a.vz-b.vz)*nz),impulse=Math.max(0,closing)*1.22/(ia+ib),correction=clamp(best.depth+.015,0,26)/(ia+ib);
  const result={a:{dx:nx*correction*ia,dz:nz*correction*ia,dvx:nx*impulse*ia,dvz:nz*impulse*ia},b:{dx:-nx*correction*ib,dz:-nz*correction*ib,dvx:-nx*impulse*ib,dvz:-nz*impulse*ib},speed:Math.max(0,closing)};
  for(const [source,target,model,delta]of [[a,b,modelA,result.b],[b,a,modelB,result.a]])if(model.launcher&&Math.hypot(source.vx,source.vz)>150/3.6&&closing>12&&(target.x-source.x)*Math.sin(source.yaw)+(target.z-source.z)*Math.cos(source.yaw)>0){delta.dvy=Math.min(42,Math.hypot(source.vx,source.vz)*.48);delta.dvx+=source.vx*.25;delta.dvz+=source.vz*.25;}
  return result;
 }
 const api={collide};root.IslaPlayerCollisions=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
