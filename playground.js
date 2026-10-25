import * as T from '../public/three.min.js';
import '../public/playplace-bodies.js';
import '../public/playplace-balls.js';
import '../public/playplace-shared.js';
import '../public/playplace-state.js';
import '../public/playplace-v20-shared.js';
import '../public/v20-rules.js';
import '../public/maker-core.js';
// Each global room owns its simulation. Clients send car contacts, never object positions.
export function createPlayground(plan,cars){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
 const W={clamp,mix,carModels:cars,vehicle:null,colliders:plan.colliders,makerRoadTriangles:[],playplace:{clock:0,halfX:600,halfZ:525,roof:124,ropes:plan.ropes.map(r=>({...r,dir:new T.Vector3(0,-1,0),velocity:new T.Vector3()}))}};
 W.height=(x,z)=>{const pit=plan.pits.find(p=>Math.abs(x-p.x)<p.w/2&&Math.abs(z-p.z)<p.d/2);if(!pit)return 12;const edge=Math.min(pit.w/2-Math.abs(x-pit.x),pit.d/2-Math.abs(z-pit.z)),t=clamp(edge/13,0,1);return 12-4*t*t*(3-2*t);};
 const oldHeight=W.height;W.height=(x,z)=>globalThis.IslaPlayPoolHeight(oldHeight(x,z),x,z);
 W.getCarSpec=()=>cars.find(c=>c.id===W.vehicle?.car)||cars[0];W.hoverHeight=(spec,c)=>spec.hover&&c.grounded&&(c.waterMode||c.water||'dry')==='dry'&&!c.wallMode?Math.min(1,Math.hypot(c.vx,c.vz)/4)*.5:0;
 const triangles=W.makerRoadTriangles;function quad(a,b,c,d,road,blocking=false){for(const points of [[a,c,b],[b,c,d]]){const triangle=new T.Triangle(...points),normal=triangle.getNormal(new T.Vector3());triangles.push({triangle,normal,road,blocking});}}
 for(const r of plan.roads){const corners=globalThis.IslaMaker.roadCorners(r,W.height).map(pair=>pair.map(p=>new T.Vector3(p.x,p.y,p.z)));for(let i=1;i<corners.length;i++){const [a,b]=corners[i-1],[c,d]=corners[i],down=p=>p.clone().add(new T.Vector3(0,-r.thickness,0)),aa=down(a),bb=down(b),cc=down(c),dd=down(d);quad(a,b,c,d,r);quad(bb,aa,dd,cc,r);quad(aa,a,cc,c,r);quad(b,bb,d,dd,r);if(i===1)quad(a,aa,b,bb,r);if(i===corners.length-1)quad(cc,c,dd,d,r);}}
 for(const r of plan.roads)for(const face of r.walls||[]){const [a,b,c,d]=face.map(p=>new T.Vector3(p.x,p.y,p.z));quad(a,b,c,d,r,true);quad(b,a,d,c,r,true);}
 const groundBins=new Map();for(const t of triangles){if(t.blocking||t.normal.y<.15)continue;const box=new T.Box3().setFromPoints([t.triangle.a,t.triangle.b,t.triangle.c]);for(let x=Math.floor(box.min.x/24);x<=Math.floor(box.max.x/24);x++)for(let z=Math.floor(box.min.z/24);z<=Math.floor(box.max.z/24);z++){const k=x+','+z;if(!groundBins.has(k))groundBins.set(k,[]);groundBins.get(k).push(t);}}
 W.makerRoadHeight=(x,z,min=-Infinity,max=Infinity)=>{let best=-Infinity;for(const t of groundBins.get(Math.floor(x/24)+','+Math.floor(z/24))||[]){const a=t.triangle.a,n=t.normal,y=a.y-(n.x*(x-a.x)+n.z*(z-a.z))/n.y;if(y<min||y>max)continue;const bary=t.triangle.getBarycoord(new T.Vector3(x,y,z),new T.Vector3());if(Math.min(bary.x,bary.y,bary.z)>=-.00001)best=Math.max(best,y);}return best;};
 const B=W.playplace.bodies=globalThis.IslaPlayBodies(W,T);for(const b of plan.foam)B.create(b);
 const travel=(t,period)=>{const u=(t%period)/period;if(u<.12)return 0;if(u<.45){const f=(u-.12)/.33;return f*f*(3-2*f);}if(u<.62)return 1;if(u<.95){const f=(u-.62)/.33;return 1-f*f*(3-2*f);}return 0;};
 for(const p of plan.platforms){const b=B.create({kind:'platform',name:p.name,x:p.a.x,y:p.a.y-.9,z:p.a.z,w:p.w,d:p.d,h:1.8});b.motion=t=>{const f=travel(t,p.period);return {x:mix(p.a.x,p.b.x,f),y:mix(p.a.y,p.b.y,f)-.9,z:mix(p.a.z,p.b.z,f)};};}
 const S=W.playplace.sports=globalThis.IslaPlayBalls(W,T,B),shared=globalThis.IslaPlayShared(W,T,B);S.addTriangles(globalThis.IslaPlayRampTriangles(T,plan.ramps));W.addPlaySeesaws(plan.seesaws);B.reindex();const A=W.playplace.attractions=globalThis.IslaPlayAttractions(W,T);const codec=globalThis.IslaPlayState(W,T),previous=new Map();
 function contact(state){const c={...state,waterMode:state.water,playSupport:state.playSupport||null};W.vehicle=c;B.collideCar(c,{...c},1/60,W.playplace.clock);W.collidePlayRopes(c,1/60);S.collideCar(c,W.playplace.clock);}
 function advance(seconds,drivers){let elapsed=0;while(elapsed<seconds-1e-8){const dt=Math.min(1/60,seconds-elapsed);elapsed+=dt;const states=drivers.map(p=>{const old=previous.get(p.id),s=p.state,f=seconds?elapsed/seconds:1;if(!old||Math.hypot(s.x-old.x,s.y-old.y,s.z-old.z)>25)return {...s,driverId:p.id,driverName:p.name};return {...s,driverId:p.id,driverName:p.name,x:mix(old.x,s.x,f),y:mix(old.y,s.y,f),z:mix(old.z,s.z,f)};});W.playplace.drivers=states;W.playplace.clock+=dt;B.integrate(dt,W.playplace.clock);shared.integrateRopes(dt);S.step(dt,W.playplace.clock);A.step(dt,W.playplace.clock,states);for(const s of states)contact(s);}const ids=new Set(drivers.map(p=>p.id));for(const id of previous.keys())if(!ids.has(id))previous.delete(id);for(const p of drivers)previous.set(p.id,{...p.state});}
 return {advance,contact,snapshot:(full=false,remember=true)=>codec.capture(full,remember),restore:data=>codec.apply(data),world:W};
}
