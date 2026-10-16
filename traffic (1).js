import data from './world-data.json';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function place(t){
 const r=data.routes[t.route],s=(t.distance%r.length+r.length)%r.length,points=r.lanes[t.direction<0?0:1];
 let lo=0,hi=points.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(r.lengths[mid]<=s)lo=mid;else hi=mid-1;}
 const p=points[lo],q=points[(lo+1)%points.length],f=(s-r.lengths[lo])/(r.lengths[lo+1]-r.lengths[lo]);
 t.x=p[0]+(q[0]-p[0])*f+t.offsetX;t.y=p[1]+(q[1]-p[1])*f;t.z=p[2]+(q[2]-p[2])*f+t.offsetZ;
 t.yaw=p[3]+Math.atan2(Math.sin(q[3]-p[3]),Math.cos(q[3]-p[3]))*f;
 t.vx=Math.sin(t.yaw)*t.speed+t.driftX;t.vz=Math.cos(t.yaw)*t.speed+t.driftZ;return t;
}
export const freshTraffic=()=>data.traffic.map(t=>place({...t}));
export function stepTraffic(traffic,players,dt){
 for(const t of traffic){let target=t.cruise,sx=Math.sin(t.yaw),sz=Math.cos(t.yaw);
  for(const other of [...traffic,...players]){if(other===t||Math.abs(other.y-t.y)>2.4)continue;const dx=other.x-t.x,dz=other.z-t.z,ahead=dx*sx+dz*sz,cross=dx*sz-dz*sx;if(ahead>0&&ahead<55&&Math.abs(cross)<2.4)target=Math.min(target,Math.max(0,(ahead-7)*.55));}
  if(t.stun>0){t.stun=Math.max(0,t.stun-dt);target=0;}
  t.speed+=clamp(target-t.speed,-6*dt,1.8*dt);t.distance+=t.speed*t.direction*dt;
  t.offsetX=clamp((t.offsetX+t.driftX*dt)*Math.exp(-dt*.65),-5,5);t.offsetZ=clamp((t.offsetZ+t.driftZ*dt)*Math.exp(-dt*.65),-5,5);t.driftX*=Math.exp(-dt*2.4);t.driftZ*=Math.exp(-dt*2.4);
  place(t);if(t.x>=data.bridge.start&&t.x<=data.bridge.end&&Math.abs(t.z)<6){t.offsetZ=clamp(t.offsetZ,-1,1);place(t);}
 }
}
