/* The Playplace: one enormous indoor playground, with solid driveable elevated routes. */
(()=>{'use strict';const W=Isla,T=THREE,M=IslaMaker,A=IslaMakerAssets;if(W.mapId!=='playplace')return;
 const floor=12,roof=124,halfX=800,halfZ=700,TAU=Math.PI*2;
 Object.assign(W,{span:1640,depth:1440,N:165,NZ:145,minX:-820,minZ:-720,mapBounds:{x:-800,z:-800,size:1600},environmentColor:'#a8b8cd'});
 const pits=[{x:-470,z:330,w:135,d:120},{x:460,z:60,w:140,d:130}],pads=[];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)pads.push({x:-260+col*66,z:70+row*64,w:44,d:44,power:24+row*4});
 const ropes=Array.from({length:15},(_,i)=>({x:100+i%5*32,z:240+Math.floor(i/5)*38,length:35,ax:0,az:0,vx:0,vz:0}));
 W.playplace={floor,roof,pits,pads,ropes,roads:[],cubes:[]};
 const inBox=(c,b,margin=0)=>Math.abs(c.x-b.x)<b.w/2+margin&&Math.abs(c.z-b.z)<b.d/2+margin;
 W.playPitAt=(x,z)=>pits.find(p=>inBox({x,z},p));
 W.mapRawHeight=(x,z)=>{const pit=W.playPitAt(x,z);if(!pit)return floor;const edge=Math.min(pit.w/2-Math.abs(x-pit.x),pit.d/2-Math.abs(z-pit.z));return floor-4*W.smooth(0,13,edge);};
 W.height=W.mapRawHeight;W.driveHeight=W.height;W.trafficHeight=W.height;W.groundType=()=> 'asphalt';W.mapGroundColor=(x,z,h,s,c)=>c.set('#475777');
 W.makeBridge=W.makeRuizDetails=W.makeRoadStrip=()=>{};W.extendRoads=null;W.bridge={start:1e9,end:1e9+1,length:0,deckY:0};W.bridgeSurface=W.approachSurface=()=>null;W.ramps=[];W.planRamps=()=>W.ramps;W.makeRamps=()=>{};W.customRoadMarkings=true;
 W.makeMapRoads=()=>{W.addRoad([[-620,-530],[-150,-570],[400,-530],[650,-400],[650,400],[450,580],[-450,580],[-650,400],[-650,-400]],24,true,'Playplace perimeter');};
 W.spawn={x:-55,z:560,yaw:Math.PI};W.placeName=(x,z)=>W.playPitAt(x,z)?'FOAM BAY':pads.some(p=>inBox({x,z},p,30))?'BOUNCE GARDEN':z>210&&z<390&&x>60&&x<280?'ROPE GROVE':'THE PLAYPLACE';
 W.mapPreview=()=>({x:-20,y:88,z:510,lookX:-30,lookY:22,lookZ:30,fov:72});
 W.makeBuildings=()=>{W.buildings=[];W.colliders=[];};W.makeVegetation=scene=>{W.trees=[];W.grass=new T.Group();scene.add(W.grass);};W.initCityTraffic=()=>{W.traffic=[];W.trafficRoutes=[];};
 function route(name,points,width,color){const samples=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],t=new T.Vector3(b.x-a.x,b.y-a.y,b.z-a.z).normalize(),right=new T.Vector3(t.z,0,-t.x).normalize(),up=new T.Vector3().crossVectors(t,right).normalize();return {...p,tangent:{x:t.x,y:t.y,z:t.z},right:{x:right.x,y:0,z:right.z},up:{x:up.x,y:up.y,z:up.z},width};});const r={name,width,color,surface:'asphalt',conform:false,elevated:true,samples};samples.forEach((p,index)=>{p.road=r;p.index=index;});W.playplace.roads.push(r);return r;}
 const line=(a,b,n=80)=>Array.from({length:n+1},(_,i)=>({x:W.mix(a.x,b.x,i/n),y:W.mix(a.y,b.y,i/n),z:W.mix(a.z,b.z,i/n)}));
 function spiral(cx,cz,rise,color){const r=90,n=360;route('Spiral climb',Array.from({length:n+1},(_,i)=>{const a=i/n*TAU;return {x:cx+r*Math.cos(a),z:cz+r*Math.sin(a),y:floor+rise*i/n};}),28,color);route('Spiral approach',line({x:cx+r,z:cz-125,y:floor},{x:cx+r,z:cz,y:floor}),28,color);}
 spiral(-350,-260,48,'#e9a74b');spiral(350,350,30,'#58b7cc');
 route('Skybridge',line({x:-260,y:60,z:-260},{x:260,y:60,z:-260},180),32,'#b7a5ed');
 route('Long slide',Array.from({length:181},(_,i)=>({x:260,z:-260+i*2.4,y:12+48*(1+Math.cos(Math.PI*i/180))/2})),32,'#f0809f');
 route('Cloud bridge',line({x:440,y:42,z:350},{x:-220,y:42,z:480},220),28,'#6acaba');
 route('Wide slide',Array.from({length:121},(_,i)=>({x:-220-i*2.3,z:480,y:12+30*(1+Math.cos(Math.PI*i/120))/2})),30,'#ee9f55');
 // Square turning decks meet the spirals, bridges and slides without gaps.
 for(const p of [{x:-260,y:60,z:-260},{x:260,y:60,z:-260},{x:440,y:42,z:350},{x:-220,y:42,z:480}])route('Turning deck',line({...p,z:p.z-23},{...p,z:p.z+23},16),46,'#8e9aba');
 W.installMakerDriving(W.playplace.roads,W.height);
 const palettes=['#f5b755','#eb7499','#68bdb8','#8e8ad0','#75badd'],ropesGroup=new T.Group();ropesGroup.userData.dynamic=true;
 function collider(x,y,z,w,h,d){W.colliders.push({kind:'playframe',x,y,z,w,h,d,yaw:0});}
 function label(scene,text,x,y,z,width=65,color='#f3edce',yaw=0){const tex=W.textureCanvas(1024,(c,s)=>{c.clearRect(0,0,s,s);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='bold 80px Arial';c.fillText(text,s/2,s/2,s-40);});const mesh=new T.Mesh(new T.PlaneGeometry(width,width*.3),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=yaw;scene.add(mesh);}
 W.makeRoadDetails=scene=>{
  const shell=new T.Group(),wall=W.mat('#9babc2'),steel=W.mat('#465a73',.4,.6),soft=W.mat('#384966'),cream=W.mat('#e5e2d3'),ceiling=W.mat('#61748e');scene.add(shell);
  W.box(shell,0,roof,0,1600,2,1400,ceiling);for(const x of [-halfX,halfX]){W.box(shell,x,68,0,2,112,1400,wall);collider(x,12,0,2,112,1400);}for(const z of [-halfZ,halfZ]){W.box(shell,0,68,z,1600,112,2,wall);collider(0,12,z,1600,112,2);}
  for(let x=-700;x<=700;x+=140){W.box(shell,x,121,0,1.5,4,1400,steel);for(const z of [-690,690]){W.box(shell,x,67,z,2,110,2,steel);collider(x,12,z,2,110,2);}}
  const glowing=new T.MeshStandardMaterial({color:0xe7f6ff,emissive:0xcce9ff,emissiveIntensity:1.4});for(let x=-600;x<=600;x+=200)for(let z=-550;z<=550;z+=220)W.box(shell,x,118,z,70,.3,8,glowing,false);
  for(const z of [-699,699])for(let x=-700;x<=700;x+=100){W.box(shell,x,28,z,86,22,.3,W.mat(palettes[Math.abs(Math.round(x/100))%5]));W.box(shell,x,78,z,85,34,.4,new T.MeshStandardMaterial({color:0xadcbdc,emissive:0x718a9c,emissiveIntensity:.25}));}
  for(const [x,z,w,d,color]of [[-194,134,218,215,'#635a89'],[164,280,205,165,'#b89666'],[35,-30,95,235,'#5b979d'],[-540,-150,70,240,'#b89761']]){const tile=new T.Mesh(new T.PlaneGeometry(w,d),W.mat(color));tile.rotation.x=-Math.PI/2;tile.position.set(x,12.03,z);tile.receiveShadow=true;scene.add(tile);}
  for(const r of W.playplace.roads){scene.add(A.roadMesh(r,W.height));for(const p of M.roadSupports(r,W.height))collider(p.x,p.y,p.z,p.w,p.h,p.w);
   // Low padded rails mark the bridges; slides and spiral ramps remain open at their entries.
   if(r.name.includes('bridge'))for(let i=0;i<r.samples.length;i+=8){const p=r.samples[i];for(const sign of [-1,1])W.box(shell,p.x+p.right.x*r.width*.5*sign,p.y+.65,p.z+p.right.z*r.width*.5*sign,.45,1,4,W.mat('#dbe5ea'));}
  }
  const fabric=W.textureCanvas(128,(c,s)=>{c.fillStyle='#21344f';c.fillRect(0,0,s,s);c.strokeStyle='#60768d';c.lineWidth=1;for(let i=0;i<s;i+=8){c.beginPath();c.moveTo(i,0);c.lineTo(i,s);c.moveTo(0,i);c.lineTo(s,i);c.stroke();}},4),trampMat=new T.MeshStandardMaterial({map:fabric,roughness:1});
  for(const [i,p]of pads.entries()){const mesh=new T.Mesh(new T.PlaneGeometry(p.w,p.d,8,8),trampMat);mesh.rotation.x=-Math.PI/2;mesh.position.set(p.x,12.16,p.z);mesh.receiveShadow=true;mesh.userData.dynamic=true;scene.add(mesh);p.mesh=mesh;const trim=W.mat(palettes[i%5]);for(const side of [-1,1]){W.box(shell,p.x+side*(p.w/2+1),12.2,p.z,2,.4,p.d+4,trim);W.box(shell,p.x,12.2,p.z+side*(p.d/2+1),p.w,.4,2,trim);}}
  for(const p of pits){for(const side of [-1,1]){W.box(shell,p.x+side*(p.w/2+2),12.18,p.z,4,.36,p.d+8,W.mat('#8d8ac3'));W.box(shell,p.x,12.18,p.z+side*(p.d/2+2),p.w,.36,4,W.mat('#8d8ac3'));}}
  const cubes=[],count=384,cubeMesh=new T.InstancedMesh(new T.BoxGeometry(4.2,4.2,4.2),new T.MeshStandardMaterial({roughness:1}),count),dummy=new T.Object3D();cubeMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);cubeMesh.castShadow=cubeMesh.receiveShadow=true;cubeMesh.frustumCulled=false;scene.add(cubeMesh);
  for(let i=0;i<count;i++){const pit=pits[i%2],j=Math.floor(i/2),x=pit.x+(j%16-7.5)*7.4,z=pit.z+(Math.floor(j/16)-5.5)*8.3,y=W.height(x,z)+2.2;const q={x,y,z,homeX:x,homeZ:z,homeY:y,vx:0,vy:0,vz:0,spin:i*2.4};cubes.push(q);dummy.position.set(x,y,z);dummy.rotation.set(i*.19,i*.81,i*.37);dummy.updateMatrix();cubeMesh.setMatrixAt(i,dummy.matrix);cubeMesh.setColorAt(i,new T.Color(palettes[i%5]).convertSRGBToLinear());}W.playplace.cubes=cubes;W.playplace.cubeMesh=cubeMesh;
  scene.add(ropesGroup);const ropeMaterial=W.mat('#d3c095'),padded=W.mat('#e7ab69');for(const [i,r]of ropes.entries()){const g=new T.Group();g.position.set(r.x,49,r.z);ropesGroup.add(g);const cord=new T.Mesh(new T.CylinderGeometry(.20,.20,r.length,6),ropeMaterial);cord.position.y=-r.length/2;g.add(cord);const ball=new T.Mesh(new T.SphereGeometry(2.4,12,8),padded);ball.position.y=-r.length;g.add(ball);r.mesh=g;W.box(shell,r.x,49.5,r.z,3,1,4,steel);}
  for(const x of [78,250])for(const z of [230,320]){W.box(shell,x,31,z,2.5,38,2.5,W.mat('#bd8b60'));collider(x,12,z,2.5,38,2.5);}
  for(let x=100;x<=228;x+=32)W.box(shell,x,50,278,1.2,2,135,steel);for(const z of [230,320])W.box(shell,164,51,z,200,1.6,1.4,steel);
  // Two broad open-ended tunnels. Cars can pass under each curved shell.
  for(const [cx,cz,length,color]of [[40,-30,180,'#71bfc0'],[-540,-150,200,'#e4a951']]){const material=W.mat(color,.6),geo=new T.CylinderGeometry(21,21,length,28,1,true,Math.PI/2,Math.PI),tube=new T.Mesh(geo,material);material.side=T.DoubleSide;tube.rotation.x=Math.PI/2;tube.position.set(cx,12,cz);tube.castShadow=tube.receiveShadow=true;scene.add(tube);for(const side of [-1,1])collider(cx+side*21,12,cz,1,21,length);for(const end of [-1,1]){const hoop=new T.Mesh(new T.TorusGeometry(21,.8,6,32,Math.PI),cream);hoop.position.set(cx,12,cz+end*length/2);scene.add(hoop);}}
  label(scene,'THE PLAYPLACE',0,54,-698,300);label(scene,'BOUNCE GARDEN',-180,20,-35,120);label(scene,'ROPE GROVE',170,26,210,90);label(scene,'FOAM BAY',-470,21,250,90);label(scene,'SKYBRIDGE',-130,70,-260,120);label(scene,'TAKE THE SLIDE',260,70,-257,92);
 };
 W.applyMapLighting=()=>{W.scene.fog.color.set('#7d91ad');W.scene.fog.density=.00085;W.sun.intensity=.7;W.sun.castShadow=false;W.hemi.color.set('#e4efff');W.hemi.groundColor.set('#72849c');W.hemi.intensity=1.45;W.renderer.toneMappingExposure=1.05;};
 const world=W.makeWorld;W.makeWorld=(scene,renderer)=>{world(scene,renderer);W.terrain.material=new T.MeshStandardMaterial({color:'#a1afc4',roughness:.9});W.water.visible=false;W.sky.visible=false;scene.background=new T.Color('#8191ab');W.applyMapLighting();};
 W.playBounce=(c,from,time)=>{const p=pads.find(p=>inBox(c,p,-1));if(!p||c.waterMode!=='dry'||from.vy>1||c.y>floor+.5||from.y<floor-.4||time<(c.playBounceAt||0))return false;c.y=floor+.5;c.vy=Math.max(p.power,Math.min(38,Math.abs(from.vy||0)*.82+p.power*.3));c.grounded=false;c.contact=0;c.ramp=null;c.roadFrame=null;c.roadMode=false;c.airtime=.01;c.playBounceAt=time+.8;p.bounced=time;W.onPlayBounce?.();return true;};
 const step=W.stepVehicle;W.stepVehicle=(dt,input,time)=>{const c=W.vehicle,from={x:c.x,y:c.y,z:c.z,vy:c.vy};if(!W.stepMakerRoad(dt,input,time)){step(dt,input,time);W.sweepMakerRoad(from);}W.playBounce(c,from,time);if(W.playPitAt(c.x,c.z)&&c.y<floor+.4){const drag=Math.exp(-dt*1.4);c.vx*=drag;c.vz*=drag;c.surface='SOFT FOAM';}const xlimit=halfX-3,zlimit=halfZ-3;if(Math.abs(c.x)>xlimit){c.x=W.clamp(c.x,-xlimit,xlimit);c.vx*=-.25;}if(Math.abs(c.z)>zlimit){c.z=W.clamp(c.z,-zlimit,zlimit);c.vz*=-.25;}if(c.y>roof-4){c.y=roof-4;c.vy=Math.min(0,-c.vy*.15);}c.lastSafe={...W.spawn};};
 W.swingRope=(r,car,dt)=>{const x=r.x+Math.sin(r.ax)*r.length,z=r.z+Math.sin(r.az)*r.length,y=49-Math.cos(Math.hypot(r.ax,r.az))*r.length;if(Math.hypot(car.x-x,car.z-z)<3.8*(car.size||1)&&Math.abs(car.y+1-y)<4){r.vx+=(car.vx||0)*dt*.16;r.vz+=(car.vz||0)*dt*.16;}r.vx+=(-r.ax*9.81/r.length-r.vx*.28)*dt;r.vz+=(-r.az*9.81/r.length-r.vz*.28)*dt;r.ax=W.clamp(r.ax+r.vx*dt,-1.2,1.2);r.az=W.clamp(r.az+r.vz*dt,-1.2,1.2);};
 const dummy=new T.Object3D();W.animateMap=(dt,time)=>{dt=Math.min(dt,.04);const cars=[W.vehicle,...[...(W.net?.remotes?.values()||[])].map(r=>({...r.current,...r.target,x:r.current.x,y:r.current.y,z:r.current.z}))];for(const r of ropes){for(const car of cars)W.swingRope(r,car,dt/cars.length);if(r.mesh)r.mesh.rotation.set(-r.az,0,r.ax);}
  for(const p of pads)if(p.mesh)p.mesh.position.y=12.16-Math.sin(Math.min(Math.PI,(time-(p.bounced??-10))*8))*.15;
  const mesh=W.playplace.cubeMesh;if(!mesh)return;for(const [i,q]of W.playplace.cubes.entries()){let active=Math.abs(q.vx)+Math.abs(q.vz)+Math.abs(q.vy)>.01;for(const c of cars)if(Math.abs(c.x-q.x)<6&&Math.abs(c.z-q.z)<6&&Math.abs(c.y-q.y)<5&&Math.hypot(c.vx,c.vz)>1){q.vx+=(c.vx-q.vx)*dt*3;q.vz+=(c.vz-q.vz)*dt*3;q.vy=Math.max(q.vy,3);active=true;}if(active){q.vx+=((q.homeX-q.x)*.3-q.vx*1.3)*dt;q.vz+=((q.homeZ-q.z)*.3-q.vz*1.3)*dt;q.vy+=((q.homeY-q.y)*5-q.vy*2)*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.spin+=Math.hypot(q.vx,q.vz)*dt*.08;dummy.position.set(q.x,q.y,q.z);dummy.rotation.set(i*.19,q.spin,i*.37);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}}mesh.instanceMatrix.needsUpdate=true;
 };
})();
