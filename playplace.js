/* V1.91: compact indoor playground; visible decks and physical surfaces agree. */
(()=>{'use strict';const W=Isla,T=THREE,M=IslaMaker;if(W.mapId!=='playplace')return;
 const floor=12,roof=124,scale=.75,halfX=600,halfZ=525,TAU=Math.PI*2,deckDepth=1.8;
 Object.assign(W,{span:1240,depth:1100,N:249,NZ:221,minX:-620,minZ:-550,mapBounds:{x:-600,z:-600,size:1200},environmentColor:'#a8b8cd'});
 const pits=[{x:-470,z:330,w:135,d:120},{x:460,z:60,w:140,d:130}].map(b=>({x:b.x*scale,z:b.z*scale,w:b.w*scale,d:b.d*scale})),pads=[];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)pads.push({x:(-260+col*66)*scale,z:(70+row*64)*scale,w:44*scale,d:44*scale,power:11+row});
 const ropes=Array.from({length:15},(_,i)=>({x:(-20+i%5*32)*scale,z:(240+Math.floor(i/5)*38)*scale,length:35,dir:new T.Vector3(0,-1,0),velocity:new T.Vector3(),touching:new Set(),ax:0,az:0}));
 W.playplace={floor,roof,pits,pads,ropes,roads:[],cubes:[],halfX,halfZ};
 const inBox=(c,b,margin=0)=>Math.abs(c.x-b.x)<b.w/2+margin&&Math.abs(c.z-b.z)<b.d/2+margin;
 W.playPitAt=(x,z)=>pits.find(p=>inBox({x,z},p));
 W.mapRawHeight=(x,z)=>{const pit=W.playPitAt(x,z);if(!pit)return floor;const edge=Math.min(pit.w/2-Math.abs(x-pit.x),pit.d/2-Math.abs(z-pit.z));return floor-4*W.smooth(0,13,edge);};
 W.height=W.mapRawHeight;W.trafficHeight=W.height;W.groundType=()=> 'asphalt';W.mapGroundColor=(x,z,h,s,c)=>c.set('#475777');
 W.makeBridge=W.makeRuizDetails=W.makeRoadStrip=()=>{};W.extendRoads=null;W.bridge={start:1e9,end:1e9+1,length:0,deckY:0};W.bridgeSurface=W.approachSurface=()=>null;W.ramps=[];W.planRamps=()=>W.ramps;W.makeRamps=()=>{};W.customRoadMarkings=true;
 W.makeMapRoads=()=>W.addRoad([[-620,-530],[-150,-570],[400,-530],[650,-400],[650,400],[450,580],[-450,580],[-650,400],[-650,-400]].map(p=>p.map(n=>n*scale)),24*scale,true,'Playplace perimeter');
 W.spawn={x:-55*scale,z:560*scale,yaw:Math.PI};W.placeName=(x,z)=>W.playPitAt(x,z)?'FOAM BAY':pads.some(p=>inBox({x,z},p,20))?'BOUNCE GARDEN':z>157&&z<293&&x>-45&&x<120?'ROPE GROVE':'THE PLAYPLACE';
 W.mapPreview=()=>({x:-20*scale,y:88,z:510*scale,lookX:-30*scale,lookY:22,lookZ:30*scale,fov:72});
 W.makeBuildings=()=>{W.buildings=[];W.colliders=[];};W.makeVegetation=scene=>{W.trees=[];W.grass=new T.Group();scene.add(W.grass);};W.initCityTraffic=()=>{W.traffic=[];W.trafficRoutes=[];};
 function route(name,points,width,color){points=points.map(p=>({x:p.x*scale,y:p.y,z:p.z*scale}));width*=scale;const samples=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],t=new T.Vector3(b.x-a.x,b.y-a.y,b.z-a.z).normalize(),right=new T.Vector3(t.z,0,-t.x).normalize(),up=new T.Vector3().crossVectors(t,right).normalize();return {...p,tangent:{x:t.x,y:t.y,z:t.z},right:{x:right.x,y:0,z:right.z},up:{x:up.x,y:up.y,z:up.z},width};});const r={name,width,color,thickness:deckDepth,surface:'asphalt',conform:false,elevated:true,samples};samples.forEach((p,index)=>{p.road=r;p.index=index;});W.playplace.roads.push(r);return r;}
 const line=(a,b,n=80)=>Array.from({length:n+1},(_,i)=>({x:W.mix(a.x,b.x,i/n),y:W.mix(a.y,b.y,i/n),z:W.mix(a.z,b.z,i/n)}));
 // Level lead-ins and landings extend beyond the turning decks: no overlapping
 // descending road under a junction, and no step at the floor entrance.
 const climb=u=>W.clamp((u-.035)/.87,0,1),slide=u=>(1+Math.cos(Math.PI*W.clamp((u-.14)/.78,0,1)))/2;
 function spiral(cx,cz,rise,color){const r=90,n=360;route('Spiral climb',Array.from({length:n+1},(_,i)=>{const a=i/n*TAU;return {x:cx+r*Math.cos(a),z:cz+r*Math.sin(a),y:floor+rise*climb(i/n)};}),28,color);route('Spiral approach',line({x:cx+r,z:cz-125,y:floor},{x:cx+r,z:cz,y:floor}),28,color);}
 spiral(-350,-260,48,'#e9a74b');spiral(350,350,30,'#58b7cc');
 route('Skybridge',line({x:-260,y:60,z:-260},{x:260,y:60,z:-260},180),32,'#b7a5ed');
 route('Long slide',Array.from({length:181},(_,i)=>({x:260,z:-260+i*2.4,y:12+48*slide(i/180)})),32,'#f0809f');
 route('Cloud bridge',line({x:440,y:42,z:350},{x:-220,y:42,z:480},220),28,'#6acaba');
 route('Wide slide',Array.from({length:121},(_,i)=>({x:-220-i*2.3,z:480,y:12+30*slide(i/120)})),30,'#ee9f55');
 for(const p of [{x:-260,y:60,z:-260},{x:260,y:60,z:-260},{x:440,y:42,z:350},{x:-220,y:42,z:480}])route('Turning deck',line({...p,z:p.z-23},{...p,z:p.z+23},16),46,'#8e9aba');
 W.installMakerDriving(W.playplace.roads,W.height);
 // The floor solver must see the flush entry surface, not the deck overhead.
 const foamBins=new Map(),foamKey=(x,z)=>Math.floor(x/8)+','+Math.floor(z/8);
 for(const pit of pits){const nx=Math.floor((pit.w-28)/4.4),nz=Math.floor((pit.d-28)/4.4);for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){const x=pit.x+(ix-(nx-1)/2)*4.4,z=pit.z+(iz-(nz-1)/2)*4.4,q={x,z,y:10.05,homeY:10.05,homeX:x,homeZ:z,compression:0,load:0,index:W.playplace.cubes.length};W.playplace.cubes.push(q);const k=foamKey(x,z);if(!foamBins.has(k))foamBins.set(k,[]);foamBins.get(k).push(q);}}
 function nearbyFoam(x,z){const out=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)out.push(...(foamBins.get((Math.floor(x/8)+dx)+','+(Math.floor(z/8)+dz))||[]));return out;}
 W.playFoamAt=(x,z)=>{for(const q of nearbyFoam(x,z))if(Math.abs(x-q.x)<=2.1&&Math.abs(z-q.z)<=2.1)return q;return null;};
 const foamTop=q=>q.homeY+2.1-q.compression;
 W.driveHeight=(x,z)=>{let h=Math.max(W.height(x,z),W.makerRoadHeight(x,z,floor-.01,floor+.45));const q=W.playFoamAt(x,z);if(q&&(W.vehicle?.y??-Infinity)>=foamTop(q)-.4)h=Math.max(h,foamTop(q));return h;};
 const palettes=['#f5b755','#eb7499','#68bdb8','#8e8ad0','#75badd'],ropesGroup=new T.Group();ropesGroup.userData.dynamic=true;
 function collider(x,y,z,w,h,d){W.colliders.push({kind:'playframe',x,y,z,w,h,d,yaw:0,preciseHeight:true});}
 const box=(g,x,y,z,w,h,d,m,shadow=true)=>W.box(g,x*scale,y,z*scale,w*scale,h,d*scale,m,shadow);
 const rawCollider=(x,y,z,w,h,d)=>collider(x*scale,y,z*scale,w*scale,h,d*scale);
 function label(scene,text,x,y,z,width=65,color='#f3edce',yaw=0){const tex=W.textureCanvas(1024,(c,s)=>{c.clearRect(0,0,s,s);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='bold 80px Arial';c.fillText(text,s/2,s/2,s-40);});const mesh=new T.Mesh(new T.PlaneGeometry(width*scale,width*.3*scale),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide}));mesh.position.set(x*scale,y,z*scale);mesh.rotation.y=yaw;scene.add(mesh);}
 function deckMesh(r){const corners=M.roadCorners(r,W.height),top=[],sides=[],bottom=p=>({...p,y:p.y-r.thickness}),quad=(list,a,b,c,d)=>{for(const p of [a,c,b,b,c,d])list.push(p.x,p.y,p.z);};for(let i=1;i<corners.length;i++){const [a,b]=corners[i-1],[c,d]=corners[i],aa=bottom(a),bb=bottom(b),cc=bottom(c),dd=bottom(d);quad(top,a,b,c,d);quad(sides,bb,aa,dd,cc);quad(sides,aa,a,cc,c);quad(sides,b,bb,d,dd);if(i===1)quad(sides,a,aa,b,bb);if(i===corners.length-1)quad(sides,cc,c,dd,d);}const group=new T.Group();for(const [positions,color]of [[top,r.color],[sides,'#56657c']]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();const mesh=new T.Mesh(g,W.mat(color,.85));mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}return group;}
 function supports(scene,r,steel){let distance=0;const corners=M.roadCorners(r,W.height);for(let i=1;i<r.samples.length;i++){const a=r.samples[i-1],b=r.samples[i];distance+=Math.hypot(b.x-a.x,b.z-a.z);if(distance<32)continue;distance=0;for(const edge of corners[i]){const y=W.height(edge.x,edge.z),top=edge.y-r.thickness;if(top-y<3)continue;const lower=W.makerRoadHeight(edge.x,edge.z,y+.5,top-1);if(Number.isFinite(lower))continue;const h=top-y;W.box(scene,edge.x,y+h/2,edge.z,1.15,h,1.15,steel);collider(edge.x,y,edge.z,1.15,h,1.15);}}}
 W.makeRoadDetails=scene=>{
  const shell=new T.Group(),wall=W.mat('#9babc2'),steel=W.mat('#465a73',.4,.6),cream=W.mat('#e5e2d3'),ceiling=W.mat('#61748e');scene.add(shell);
  box(shell,0,roof,0,1600,2,1400,ceiling);for(const x of [-800,800]){box(shell,x,68,0,2,112,1400,wall);rawCollider(x,12,0,2,112,1400);}for(const z of [-700,700]){box(shell,0,68,z,1600,112,2,wall);rawCollider(0,12,z,1600,112,2);}
  for(let x=-700;x<=700;x+=140){box(shell,x,121,0,1.5,4,1400,steel);for(const z of [-690,690]){box(shell,x,67,z,2,110,2,steel);rawCollider(x,12,z,2,110,2);}}
  const glowing=new T.MeshStandardMaterial({color:0xe7f6ff,emissive:0xcce9ff,emissiveIntensity:1.4});for(let x=-600;x<=600;x+=200)for(let z=-550;z<=550;z+=220)box(shell,x,118,z,70,.3,8,glowing,false);
  for(const z of [-699,699])for(let x=-700;x<=700;x+=100){box(shell,x,28,z,86,22,.3,W.mat(palettes[Math.abs(Math.round(x/100))%5]));box(shell,x,78,z,85,34,.4,new T.MeshStandardMaterial({color:0xadcbdc,emissive:0x718a9c,emissiveIntensity:.25}));}
  for(const [x,z,w,d,color]of [[-194,134,218,215,'#635a89'],[44,280,205,165,'#b89666'],[35,-30,95,235,'#5b979d'],[-540,-150,70,240,'#b89761']]){const tile=new T.Mesh(new T.PlaneGeometry(w*scale,d*scale),W.mat(color));tile.rotation.x=-Math.PI/2;tile.position.set(x*scale,12.03,z*scale);tile.receiveShadow=true;scene.add(tile);}
  for(const r of W.playplace.roads){scene.add(deckMesh(r));supports(shell,r,steel);}
  const fabric=W.textureCanvas(128,(c,s)=>{c.fillStyle='#21344f';c.fillRect(0,0,s,s);c.strokeStyle='#60768d';c.lineWidth=1;for(let i=0;i<s;i+=8){c.beginPath();c.moveTo(i,0);c.lineTo(i,s);c.moveTo(0,i);c.lineTo(s,i);c.stroke();}},4),trampMat=new T.MeshStandardMaterial({map:fabric,roughness:1});
  for(const [i,p]of pads.entries()){const mesh=new T.Mesh(new T.PlaneGeometry(p.w,p.d,8,8),trampMat);mesh.rotation.x=-Math.PI/2;mesh.position.set(p.x,12.16,p.z);mesh.receiveShadow=true;mesh.userData.dynamic=true;scene.add(mesh);p.mesh=mesh;const trim=W.mat(palettes[i%5]);for(const side of [-1,1]){W.box(shell,p.x+side*(p.w/2+1),12.2,p.z,2,.4,p.d+4,trim);W.box(shell,p.x,12.2,p.z+side*(p.d/2+1),p.w,.4,2,trim);}}
  for(const p of pits)for(const side of [-1,1]){W.box(shell,p.x+side*(p.w/2+2),12.18,p.z,4,.36,p.d+8,W.mat('#8d8ac3'));W.box(shell,p.x,12.18,p.z+side*(p.d/2+2),p.w,.36,4,W.mat('#8d8ac3'));}
  const cubes=W.playplace.cubes,cubeMesh=new T.InstancedMesh(new T.BoxGeometry(4.2,4.2,4.2),new T.MeshStandardMaterial({roughness:1}),cubes.length),dummy=new T.Object3D();cubeMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);cubeMesh.castShadow=cubeMesh.receiveShadow=true;cubeMesh.frustumCulled=false;scene.add(cubeMesh);
  for(const [i,q]of cubes.entries()){dummy.position.set(q.x,q.y,q.z);dummy.updateMatrix();cubeMesh.setMatrixAt(i,dummy.matrix);cubeMesh.setColorAt(i,new T.Color(palettes[i%5]).convertSRGBToLinear());}W.playplace.cubeMesh=cubeMesh;
  scene.add(ropesGroup);const ropeMaterial=W.mat('#d3c095'),padded=W.mat('#e7ab69');for(const r of ropes){const g=new T.Group();g.position.set(r.x,49,r.z);ropesGroup.add(g);const cord=new T.Mesh(new T.CylinderGeometry(.20,.20,r.length,6),ropeMaterial);cord.position.y=-r.length/2;g.add(cord);const ball=new T.Mesh(new T.SphereGeometry(2.4,12,8),padded);ball.position.y=-r.length;g.add(ball);r.mesh=g;W.box(shell,r.x,49.5,r.z,3,1,4,steel);}
  for(const x of [-42,130])for(const z of [230,320]){box(shell,x,31,z,2.5,38,2.5,W.mat('#bd8b60'));rawCollider(x,12,z,2.5,38,2.5);}
  for(let x=-20;x<=108;x+=32)box(shell,x,50,278,1.2,2,135,steel);for(const z of [230,320])box(shell,44,51,z,200,1.6,1.4,steel);
  for(const [cx,cz,length,color]of [[40,-30,180,'#71bfc0'],[-540,-150,200,'#e4a951']]){const radius=21*scale,material=W.mat(color,.6),geo=new T.CylinderGeometry(radius,radius,length*scale,28,1,true,Math.PI/2,Math.PI),tube=new T.Mesh(geo,material);material.side=T.DoubleSide;tube.rotation.x=Math.PI/2;tube.position.set(cx*scale,12,cz*scale);tube.castShadow=tube.receiveShadow=true;scene.add(tube);for(const side of [-1,1])collider((cx+side*21)*scale,12,cz*scale,.75,radius,length*scale);for(const end of [-1,1]){const hoop=new T.Mesh(new T.TorusGeometry(radius,.6,6,32,Math.PI),cream);hoop.position.set(cx*scale,12,(cz+end*length/2)*scale);scene.add(hoop);}}
  label(scene,'THE PLAYPLACE',0,54,-698,300);label(scene,'BOUNCE GARDEN',-180,20,-35,120);label(scene,'ROPE GROVE',50,26,210,90);label(scene,'FOAM BAY',-470,21,250,90);label(scene,'SKYBRIDGE',-130,70,-260,120);label(scene,'TAKE THE SLIDE',260,70,-257,92);
 };
 W.applyMapLighting=()=>{W.scene.fog.color.set('#7d91ad');W.scene.fog.density=.00085;W.sun.intensity=.7;W.sun.castShadow=false;W.hemi.color.set('#e4efff');W.hemi.groundColor.set('#72849c');W.hemi.intensity=1.45;W.renderer.toneMappingExposure=1.05;};
 const world=W.makeWorld;W.makeWorld=(scene,renderer)=>{world(scene,renderer);W.terrain.material=new T.MeshStandardMaterial({color:'#a1afc4',roughness:.9});W.water.visible=false;W.sky.visible=false;scene.background=new T.Color('#8191ab');W.applyMapLighting();};
 W.playBounce=(c,from,time)=>{const p=pads.find(p=>inBox(c,p,-1));if(!p||c.waterMode!=='dry'||from.vy>.5||c.y>floor+.5||from.y<floor-.4||time<(c.playBounceAt||0)||c.playBounceRest)return false;
  const launch=c.playBouncePower?c.playBouncePower*.82:Math.min(14,Math.max(p.power,Math.abs(from.vy||0)*.38));c.playBouncePower=launch;p.bounced=time;
  if(launch<2.2){c.playBounceRest=true;c.vy=0;return false;}
  c.y=floor+.5;c.vy=launch;c.grounded=false;c.contact=0;c.ramp=null;c.roadFrame=null;c.roadMode=false;c.airtime=.01;c.playAir=true;c.playBounceAt=time+.22;W.onPlayBounce?.();return true;
 };
 W.playFoamLand=(c,from,time)=>{if(!W.playPitAt(c.x,c.z))return;const size=W.getCarSpec?.()?.size||1,points=[0,-1.22,1.22].map(off=>({x:c.x+Math.sin(c.yaw)*off*size,z:c.z+Math.cos(c.yaw)*off*size})),blocks=points.map(p=>W.playFoamAt(p.x,p.z)).filter(Boolean);let top=-Infinity;for(const q of blocks)top=Math.max(top,foamTop(q));if(top===-Infinity||from.y<top-.4||c.y>top+.4||from.vy>.2)return;
  c.y=Math.max(c.y,top+.12);c.surface='SOFT FOAM';c.vy=0;c.grounded=true;c.contact=1;for(const q of blocks)q.load=Math.max(q.load,Math.min(.45,.12+Math.abs(from.vy)*.025));
  if(from.vy<-2&&time>=(c.playFoamBounceAt||0)){c.vy=Math.min(2.6,Math.abs(from.vy)*.22);c.grounded=false;c.contact=0;c.playFoamBounceAt=time+.3;c.airtime=.01;}
 };
 const reset=W.resetVehicle;W.resetVehicle=(...args)=>{reset(...args);Object.assign(W.vehicle,{playBouncePower:0,playBounceRest:false,playBounceAt:0,playAir:false,playFoamBounceAt:0});};
 const step=W.stepVehicle;W.stepVehicle=(dt,input,time)=>{const c=W.vehicle,from={x:c.x,y:c.y,z:c.z,vy:c.vy};
  if(c.playAir&&!c.grounded){const angle=(input.steer||0)*1.1*dt,cs=Math.cos(angle),sn=Math.sin(angle),vx=c.vx,vz=c.vz;c.vx=vx*cs+vz*sn;c.vz=vz*cs-vx*sn;c.yaw+=angle;const gas=Math.max(0,Number(input.gas)||0);if(gas&&Math.hypot(c.vx,c.vz)<14){c.vx+=Math.sin(c.yaw)*gas*4*dt;c.vz+=Math.cos(c.yaw)*gas*4*dt;}if(input.brake){const drag=Math.exp(-dt*1.2*input.brake);c.vx*=drag;c.vz*=drag;}}
  if(!W.stepMakerRoad(dt,input,time))step(dt,input,time);W.sweepMakerRoad(from);W.playBounce(c,from,time);W.playFoamLand(c,from,time);
  if(c.grounded&&!pads.some(p=>inBox(c,p,-1))){c.playBouncePower=0;c.playBounceRest=false;c.playAir=false;}
  if(W.playPitAt(c.x,c.z)&&c.y<floor+.4){const drag=Math.exp(-dt*(c.y<floor-1?1.2:.4));c.vx*=drag;c.vz*=drag;c.surface='SOFT FOAM';}
  const xlimit=halfX-3,zlimit=halfZ-3;if(Math.abs(c.x)>xlimit){c.x=W.clamp(c.x,-xlimit,xlimit);c.vx*=-.25;}if(Math.abs(c.z)>zlimit){c.z=W.clamp(c.z,-zlimit,zlimit);c.vz*=-.25;}if(c.y>roof-4){c.y=roof-4;c.vy=Math.min(0,-c.vy*.15);}c.lastSafe={...W.spawn};
 };
 W.playRopePosition=r=>new T.Vector3(r.x,49,r.z).addScaledVector(r.dir,r.length);
 function ropeStep(r,cars,dt){dt=Math.min(dt,.05);const bob=W.playRopePosition(r),now=new Set();
  for(const [i,car]of cars.entries()){const size=car.size||(car===W.vehicle?W.getCarSpec?.()?.size:W.carModels?.find(m=>m.id===car.car)?.size)||1,sx=Math.sin(car.yaw||0),sz=Math.cos(car.yaw||0),off=W.clamp((bob.x-car.x)*sx+(bob.z-car.z)*sz,-1.22*size,1.22*size),center=new T.Vector3(car.x+sx*off,car.y+.8*size,car.z+sz*off),key=car.id??i;
   if(center.distanceTo(bob)<2.4+.96*size){now.add(key);if(!r.touching.has(key)){const push=new T.Vector3(car.vx||0,car.vy||0,car.vz||0).sub(r.velocity);push.addScaledVector(r.dir,-push.dot(r.dir)).multiplyScalar(.55);if(push.length()>16)push.setLength(16);r.velocity.add(push);if(car===W.vehicle){car.vx-=push.x*.06;car.vz-=push.z*.06;}}}
  }r.touching=now;
  for(let left=dt;left>1e-8;){const h=Math.min(left,1/120);left-=h;const force=new T.Vector3(0,-9.81,0);force.addScaledVector(r.dir,-force.dot(r.dir));r.velocity.addScaledVector(force,h).multiplyScalar(Math.exp(-.32*h));r.dir.addScaledVector(r.velocity,h/r.length).normalize();r.velocity.addScaledVector(r.dir,-r.velocity.dot(r.dir));}
  r.ax=Math.asin(W.clamp(r.dir.x,-1,1));r.az=Math.asin(W.clamp(r.dir.z,-1,1));if(r.mesh)r.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),r.dir);
 }
 W.swingRope=(r,car,dt)=>ropeStep(r,[car],dt);
 const dummy=new T.Object3D();W.animateMap=(dt,time)=>{dt=Math.min(dt,.04);const cars=[W.vehicle,...[...(W.net?.remotes?.values()||[])].map(r=>({...r.target,...r.current}))];for(const r of ropes)ropeStep(r,cars,dt);
  for(const p of pads)if(p.mesh)p.mesh.position.y=12.16-Math.sin(Math.min(Math.PI,Math.max(0,time-(p.bounced??-10))*8))*.15;
  for(const c of cars)if(W.playPitAt(c.x,c.z)&&c.y>11.4&&c.y<12.7)for(const q of nearbyFoam(c.x,c.z))if(Math.hypot(c.x-q.x,c.z-q.z)<3)q.load=Math.max(q.load,.12);
  const mesh=W.playplace.cubeMesh;for(const q of W.playplace.cubes){q.compression=W.mix(q.compression,q.load,1-Math.exp(-dt*12));q.load*=Math.exp(-dt*6);q.y=q.homeY-q.compression/2;if(mesh){dummy.position.set(q.x,q.y,q.z);dummy.scale.set(1,1-q.compression/4.2,1);dummy.updateMatrix();mesh.setMatrixAt(q.index,dummy.matrix);}}if(mesh)mesh.instanceMatrix.needsUpdate=true;
 };
})();
