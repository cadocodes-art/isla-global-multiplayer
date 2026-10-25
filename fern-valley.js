/* Fern Valley — deterministic country roads, scenery and a decorative herd. */
'use strict';
(()=>{
 const W=Isla,T=THREE,M=IslaMaker,A=IslaMakerAssets;if(W.mapId!=='fern')return;
 const TAU=Math.PI*2,limit=2000,seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const F=W.fern={limits:{minX:-limit,maxX:limit,minZ:-limit,maxZ:limit},homes:[],cows:[],pastures:[{x:-850,z:-250,w:180,d:120},{x:760,z:400,w:160,d:120},{x:-800,z:850,w:180,d:130}]};
 Object.assign(W,{span:6000,depth:6000,N:401,NZ:401,minX:-3000,minZ:-3000,mapBounds:{x:-2100,z:-2100,size:4200}});
 W.mapRawHeight=(x,z)=>{const town=Math.exp(-((x/550)**2+((z+1300)/370)**2));const hills=30+9*Math.sin(x*.0023+.4)*Math.cos(z*.0019)+6*Math.sin(z*.004+x*.001)+5*W.fbm(x*.006,z*.006);return W.mix(hills,32,town*.9);};
 F.sand=(x,z)=>W.fbm(x*.0018+9,z*.0018-13);
 W.mapGroundColor=(x,z,h,slope,color)=>{const n=F.sand(x,z);color.set('#7c8a51').lerp(new T.Color('#c2a77b'),W.smooth(.39,.68,n));color.multiplyScalar(.91+W.noise(x*.031,z*.031)*.13);};
 W.groundType=(x,z)=>F.sand(x,z)>.56?'sand':'grass';W.environmentColor='#cdd5c4';W.roadColor='#777874';W.customRoadMarkings=true;
 W.extendRoads=W.makeRuizBuildings=W.makeRuizDetails=null;W.makeBridge=()=>{};W.bridgeSurface=W.approachSurface=()=>null;W.bridge={start:1e9,end:1e9+1,length:0,deckY:0};
 const object=(type,x,z,rotation=0,scale=1,extra={})=>({id:'fern-'+type+'-'+x+'-'+z,type,x,z,y:0,rotation,pitch:0,roll:0,scale,color:M.defaultColor(type),...extra});
 W.makeMapRoads=()=>{
  F.homes=[];const road=(points,width,closed,name,surface='asphalt')=>{W.addRoad(points,width,closed,name);const r=W.roads.at(-1);r.surface=surface;return r;};
  road([[0,-1050],[900,-1000],[1500,-200],[1250,950],[200,1550],[-1100,1100],[-1550,200],[-1000,-1000]],14,true,'Fern Valley Highway');
  road([[0,-1120],[-120,-1120],[-160,-1160],[-160,-1400],[-120,-1440],[120,-1440],[160,-1400],[160,-1160],[120,-1120]],12,true,'Fern Town Loop');
  road([[-160,-1300],[0,-1300],[160,-1300]],13,false,'Main Street');
  road([[0,-1120],[0,-1085],[0,-1050]],10,false,'Town Approach');
  road([[-1000,-1000],[-1140,-650],[-650,-450],[-420,-820],[0,-1050]],8,true,'Juniper Ranch Trail','gravel');
  road([[900,-1000],[650,-500],[1000,100],[1250,950],[550,850],[300,300],[440,-380]],8,true,'Cactus Creek Trail','gravel');
  road([[-1550,200],[-1050,400],[-500,700],[200,1550],[-1100,1100]],8,true,'Sunset Farm Road','gravel');
  // These continue into the horizon, past the invisible driving boundary.
  road([[-1550,200],[-1850,80],[-2200,-100],[-2950,-250]],12,false,'Western Route');
  road([[1250,950],[1600,1130],[2000,1320],[2600,1500],[2950,1500]],12,false,'Eastern Route');
  road([[0,-1440],[10,-1800],[-80,-2200],[-180,-2950]],12,false,'Northern Route');
  const shopNames=['FERN DINER','VALLEY GROCER','SUNSET CAFE','COUNTRY MARKET'];
  for(let i=0;i<15;i++){const north=i<8,j=north?i:i-8,x=-126+j*36,z=-1300+(north?-29:29),shop=i<4;F.homes.push(object(shop?'restaurant':i%3?'home1':'home2',x,z,north?0:Math.PI,shop?1.15:1.25,{district:'town',shopName:shop?shopNames[i]:null,name:shop?shopNames[i]:'Fern Town home '+(i+1),color:['#ccbba0','#c3c2a7','#b8a58d','#b5bfc0'][i%4],customColor:true}));}
  // Sparse houses connect to a nearby road by a short gravel driveway.
  for(const [ri,count]of [[0,10],[4,5],[5,5],[6,4]]){const r=W.roads[ri];for(let j=0;j<count;j++){
   const i=Math.floor((j+.37)*r.samples.length/count),p=r.samples[i],q=r.samples[Math.min(i+1,r.samples.length-1)],yaw=Math.atan2(q.x-p.x,q.z-p.z),side=j%2?1:-1,x=p.x+Math.cos(yaw)*side*42,z=p.z-Math.sin(yaw)*side*42;
   if(Math.abs(x)<420&&z<-950||F.homes.some(b=>Math.hypot(b.x-x,b.z-z)<85))continue;
   const near=W.nearestRoad(x,z,3);if(near.d<26||F.pastures.some(b=>Math.abs(x-b.x)<b.w/2+25&&Math.abs(z-b.z)<b.d/2+25))continue;
   const shop=ri===0&&(j===3||j===7),o=object(shop?'restaurant':j%4?'home1':'home2',x,z,yaw-side*Math.PI/2,1.2,{district:'country',name:shop?'Roadside diner':'Country home',color:['#c5b59e','#b8b9a3','#c4bcae'][j%3],customColor:true});F.homes.push(o);
   const front={x:x-Math.cos(yaw)*side*11,z:z+Math.sin(yaw)*side*11};road([[p.x,p.z],[(p.x+front.x)/2,(p.z+front.z)/2],[front.x,front.z]],5,false,'Home driveway','gravel');
  }}
  // A proper lane leads to each pasture, with its farmhouse outside the fence.
  F.pastures.forEach((b,i)=>{const choices=[];for(const axis of ['x','z'])for(const sign of [-1,1]){const x=b.x+(axis==='x'?sign*(b.w/2+32):0),z=b.z+(axis==='z'?sign*(b.d/2+32):0),near=W.nearestRoad(x,z,25);choices.push({x,z,near,axis,sign});}const choice=choices.sort((a,b)=>a.near.d-b.near.d)[0],{x,z,near,axis,sign}=choice,p=near.p,yaw=Math.atan2(p.x-x,p.z-z),front={x:x+Math.sin(yaw)*13,z:z+Math.cos(yaw)*13};b.gateAxis=axis;b.gateSign=sign;road([[p.x,p.z],[(p.x+front.x)/2,(p.z+front.z)/2],[front.x,front.z]],5,false,'Ranch lane','gravel');F.homes.push(object('home1',x,z,yaw,1.35,{district:'country',name:'Fern ranch house '+(i+1),color:'#c8b69c',customColor:true}));});
 };
 W.spawn={x:2.35,z:-1300,yaw:Math.PI/2};W.vehicle.lastSafe={...W.spawn};
 W.mapPreview=()=>({x:390,y:310,z:-860,lookX:0,lookY:30,lookZ:-1300,fov:54});
 W.placeName=(x,z)=>Math.abs(x)<420&&z<-980&&z>-1620?'FERN TOWN':F.pastures.some(p=>Math.hypot(x-p.x,z-p.z)<240)?'FERN VALLEY · RANCH COUNTRY':'FERN VALLEY · OPEN COUNTRY';
 W.makeBuildings=scene=>{W.buildings=[];W.colliders=[];for(const [id,o]of F.homes.entries()){
  const spec=M.types[o.type],group=A.object(o,W.height),h=spec.h*o.scale+(o.type.startsWith('home')?3*o.scale:0),b={id,name:o.name,x:o.x,z:o.z,y:W.height(o.x,o.z),yaw:o.rotation,w:spec.w*o.scale,d:spec.d*o.scale,h,hp:100,maxHp:100,group,wall:group.userData.wall,collapsed:false,lastHit:-10,cracks:[],windows:[],pieces:[],color:o.color,district:o.district};
  group.userData.dynamic=true;W.buildings.push(b);W.colliders.push(b);scene.add(group);
  const foundation=W.mat('#b3a58e');W.box(group,0,-.8,0,spec.w+.5,1.8,spec.d+.5,foundation);
 }};
 W.planRamps=()=>{if(W.ramps.length)return W.ramps;const rand=seeded(217341);let tries=0;while(W.ramps.length<18&&tries++<4000){const x=(rand()-.5)*3600,z=(rand()-.5)*3600,yaw=rand()*TAU,r={id:W.ramps.length+1,kind:'ramp',x,z,yaw,co:Math.cos(yaw),si:Math.sin(yaw),w:10,d:28,rise:6+(W.ramps.length%4)*.6,y:W.height(x,z)-1,h:14};
  if(Math.abs(x)<450&&z<-950||F.pastures.some(p=>Math.abs(x-p.x)<p.w/2+100&&Math.abs(z-p.z)<p.d/2+100)||W.ramps.some(p=>Math.hypot(x-p.x,z-p.z)<270))continue;
  let clear=true;for(let s=-40;s<=100;s+=10){const p=W.rampPoint(r,0,s),near=W.nearestRoad(p.x,p.z,2);if(near.d<(near.p?.width||0)/2+15||F.homes.some(b=>Math.hypot(b.x-p.x,b.z-p.z)<45)){clear=false;break;}}
  if(clear)W.ramps.push(r);
 }if(W.ramps.length!==18)throw Error('Fern Valley ramp layout is incomplete.');return W.ramps;};
 function instanceObject(scene,type,points){const meshes=[],template=A.object(object(type,0,0),()=>0),root=new T.Object3D(),matrix=new T.Matrix4();template.updateMatrixWorld(true);template.traverse(part=>{if(!part.isMesh)return;const mesh=new T.InstancedMesh(part.geometry,part.material,points.length);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;points.forEach((p,i)=>{root.position.set(p.x,p.y,p.z);root.rotation.set(0,p.a||0,0);root.scale.setScalar(p.s||1);root.updateMatrix();mesh.setMatrixAt(i,matrix.multiplyMatrices(root.matrix,part.matrixWorld));});scene.add(mesh);meshes.push(mesh);});return meshes;}
 function makeCows(scene){F.cows=[];const herd=new T.Group();herd.userData.dynamic=true;scene.add(herd);const white=W.mat('#e3dccb'),black=W.mat('#39362d'),pink=W.mat('#c79d89'),hoof=W.mat('#484036');const random=seeded(214223);
  for(const [pi,p]of F.pastures.entries())for(let i=0;i<8;i++){
   const root=new T.Group(),body=new T.Group();root.add(body);herd.add(root);W.box(body,0,1.25,0,1.05,1.15,2.3,white);W.box(body,-.53,1.5,-.3,.03,.65,.9,black);W.box(body,.53,1.35,.3,.03,.75,.85,black);W.box(body,0,1.84,-.45,.75,.03,.6,black);
   const head=new T.Group();head.position.set(0,1.45,1.15);body.add(head);W.box(head,0,-.2,.3,.65,.7,.85,white);W.box(head,0,-.43,.78,.68,.3,.2,pink);for(const side of [-1,1]){W.box(head,side*.42,.1,.2,.35,.15,.28,black);W.box(head,side*.333,-.06,.55,.025,.1,.1,black);}
   const legs=[];for(const x of [-.38,.38])for(const z of [-.8,.8]){const leg=new T.Group();leg.position.set(x,1,z);body.add(leg);W.box(leg,0,-.34,0,.2,.7,.23,white);W.box(leg,0,-.73,0,.23,.15,.26,hoof);legs.push(leg);}const tail=W.box(body,0,1.1,-1.22,.09,.85,.09,black);
   root.scale.setScalar(1.15+random()*.3);const phase=random()*TAU,anchorX=p.x+(random()-.5)*(p.w-45),anchorZ=p.z+(random()-.5)*(p.d-45);F.cows.push({root,head,legs,tail,phase,anchorX,anchorZ,pasture:pi});
  }
  // Four instanced draw calls for the entire herd, including animated heads and legs.
  const buckets=new Map();for(const c of F.cows){herd.remove(c.root);c.root.traverse(m=>{if(!m.isMesh)return;if(!buckets.has(m.material))buckets.set(m.material,[]);buckets.get(m.material).push(m);});}
  F.cowBatches=[];for(const [material,parts]of buckets){const mesh=new T.InstancedMesh(W.unitBox,material,parts.length);mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=true;herd.add(mesh);F.cowBatches.push({mesh,parts});}F.herd=herd;
 }
 W.makeVegetation=scene=>{W.trees=[];W.grass=new T.Group();scene.add(W.grass);const random=seeded(91821),shrubs=[],cacti=[],rocks=[];
  for(let i=0;i<4400;i++){const x=(random()-.5)*5600,z=(random()-.5)*5600,near=W.nearestRoad(x,z),s=.45+random()*1.3;if(near.d<(near.p?.width||0)/2+5||W.inRampClearing(x,z)||F.homes.some(b=>Math.hypot(x-b.x,z-b.z)<30)||F.pastures.some(b=>Math.abs(x-b.x)<b.w/2+4&&Math.abs(z-b.z)<b.d/2+4))continue;const p={x,z,y:W.height(x,z),a:random()*TAU,s};if(i%53===0){cacti.push(p);const o=object('cactus',x,z,p.a,s);W.colliders.push(A.collider(o,W.height));}else if(i%67===0){rocks.push({...p,s:s*1.4});}else shrubs.push({...p,s:s*.55});}
  F.cacti=cacti;F.shrubs=shrubs;instanceObject(scene,'cactus',cacti);instanceObject(W.grass,'bush',shrubs);const rockMeshes=instanceObject(scene,'rock',rocks);rocks.forEach((p,i)=>W.colliders.push(W.registerRock({kind:'rock',x:p.x,y:p.y,z:p.z,r:1.8*p.s},rockMeshes.map(mesh=>({mesh,index:i})))));
  makeCows(scene);
 };
 const strip=W.makeRoadStrip;W.makeRoadStrip=(scene,samples,width,material,offset=0,lift=.1)=>{if(samples[0]?.road.surface==='gravel'&&offset===0){if(!F.gravel){F.gravel=W.mat('#b09b79');F.gravel.map=W.textureCanvas(64,(c,n)=>{c.fillStyle='#d2bd99';c.fillRect(0,0,n,n);const random=seeded(732);for(let i=0;i<850;i++){c.fillStyle=i%2?'#8d806c':'#e5d3ac';c.fillRect(random()*n,random()*n,1,1);}});}material=F.gravel;}return strip(scene,samples,width,material,offset,lift);};
 W.makeRoadDetails=scene=>{
  const details=new T.Group();scene.add(details);const yellow=W.mat('#ddc28a'),white=W.mat('#ddd4be');
  for(const r of W.roads.filter(r=>r.surface==='asphalt')){for(const side of [-1,1])strip(details,r.samples,.12,white,side*(r.width/2-.6),.165);for(let i=1;i<r.samples.length-3;i+=7)strip(details,r.samples.slice(i,i+3),.14,yellow,0,.17);}
  const fencePoints=[];function fence(x,z,a){const o=object('fence',x,z,a);fencePoints.push({x,y:W.height(x,z),z,a});W.colliders.push(A.collider(o,W.height));}
  for(const p of F.pastures){for(const side of [-1,1]){for(let x=-p.w/2+3;x<p.w/2;x+=6){if(p.gateAxis==='z'&&side===p.gateSign&&Math.abs(x)<6)continue;fence(p.x+x,p.z+side*p.d/2,0);}for(let z=-p.d/2+3;z<p.d/2;z+=6){if(p.gateAxis==='x'&&side===p.gateSign&&Math.abs(z)<6)continue;fence(p.x+side*p.w/2,p.z+z,Math.PI/2);}}}
  for(const o of F.homes.filter(o=>o.district==='country'))for(let k=-2;k<=2;k++){const dx=k*6,dz=-15;fence(o.x+Math.cos(o.rotation)*dx+Math.sin(o.rotation)*dz,o.z-Math.sin(o.rotation)*dx+Math.cos(o.rotation)*dz,o.rotation);}
  instanceObject(details,'fence',fencePoints);
  for(const [x,z,yaw,text]of [[25,-1025,Math.PI,'FERN VALLEY\nTown center ↑'],[-181,-1290,Math.PI/2,'FERN TOWN\nDiner · Market · Grocer'],[181,-1290,-Math.PI/2,'COUNTRY ROUTES\nTake the long way'],[-1530,225,Math.PI/2,'JUNIPER RANCH\nCountry roads'],[1250,975,Math.PI,'SUNSET TRAIL\nGravel ahead']])scene.add(A.object(object('signLarge',x,z,yaw,1,{text,color:'#576c4a',customColor:true}),W.height));
  F.fenceCount=fencePoints.length;
 };
 W.initCityTraffic=(route,place)=>{W.traffic=[];W.trafficRoutes=[];for(const [ri,count]of [[0,4],[1,2],[4,1],[5,1]]){const r=route(W.roads[ri].samples);W.trafficRoutes.push(r);for(let i=0;i<count;i++){const speed=ri===0?19+i:ri===1?8:10,t={id:W.traffic.length,route:r,distance:(i+.31)*r.length/count,direction:i%2?-1:1,cruise:speed,speed,lane:2.35,offsetX:0,offsetZ:0,driftX:0,driftZ:0,stun:0,w:1.9,d:4.4,color:['#bfb9a5','#59726c','#c69a6c','#5c6470'][W.traffic.length%4]};W.traffic.push(t);place(t);}}};
 W.enforceMapBoundary=c=>{const pad=2.6*(W.getCarSpec?.()?.size??1);for(const axis of ['x','z']){const bound=limit-pad;if(c[axis]>bound){c[axis]=bound;if(c['v'+axis]>0)c['v'+axis]=0;}else if(c[axis]<-bound){c[axis]=-bound;if(c['v'+axis]<0)c['v'+axis]=0;}}};
 const step=W.stepVehicle;W.stepVehicle=(dt,input,time)=>{step(dt,input,time);const c=W.vehicle;W.enforceMapBoundary(c);if(c.surface==='ASPHALT'&&W.nearestRoad(c.x,c.z).p?.road.surface==='gravel')c.surface='GRAVEL';else if(c.surface==='BEACH')c.surface='SAND';else if(c.surface==='OFF ROAD')c.surface='DRY GRASS';};
 W.animateMap=(dt,time)=>{for(const c of F.cows){const a=time*.035+c.phase,x=c.anchorX+Math.sin(a)*6,z=c.anchorZ+Math.cos(a*.8)*4;c.root.position.set(x,W.height(x,z)+.02,z);c.root.rotation.y=Math.atan2(Math.cos(a)*.21,-Math.sin(a*.8)*.112);c.head.rotation.x=.35+Math.sin(time*.8+c.phase)*.24;c.tail.rotation.z=Math.sin(time*1.5+c.phase)*.2;c.legs.forEach((l,i)=>l.rotation.x=Math.sin(time*1.7+c.phase+(i%2)*Math.PI)*.13);c.root.updateMatrixWorld(true);}for(const b of F.cowBatches||[]){b.parts.forEach((part,i)=>b.mesh.setMatrixAt(i,part.matrixWorld));b.mesh.instanceMatrix.needsUpdate=true;}};
 W.applyMapLighting=(warm=0)=>{if(!W.scene)return;W.scene.fog.color.set(warm?'#dac7a9':'#d4d8c6');W.scene.fog.density=.00029;W.sun.color.set(warm?'#ffd3a0':'#fff0d2');W.sun.intensity=warm?1.6:1.8;W.hemi.groundColor.set('#a09268');W.hemi.intensity=.78;};
 const makeWorld=W.makeWorld;W.makeWorld=(scene,renderer)=>{makeWorld(scene,renderer);W.water.visible=false;
  // A coarse outer terrain ring continues the countryside beyond the playable area.
  const positions=[],colors=[],color=new T.Color(),outer=12000,inner=3000;
  for(const [x0,z0,x1,z1]of [[-outer,-outer,outer,-inner],[-outer,inner,outer,outer],[-outer,-inner,-inner,inner],[inner,-inner,outer,inner]]){const nx=Math.ceil((x1-x0)/150),nz=Math.ceil((z1-z0)/150);for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const points=[[i,j],[i,j+1],[i+1,j],[i+1,j+1]].map(([a,b])=>[W.mix(x0,x1,a/nx),W.mix(z0,z1,b/nz)]);for(const k of [0,1,2,2,1,3]){const [x,z]=points[k],h=W.mapRawHeight(x,z)-.12;positions.push(x,h,z);W.mapGroundColor(x,z,h,0,color);color.convertSRGBToLinear();colors.push(color.r,color.g,color.b);}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();const horizon=new T.Mesh(g,W.terrain.material);horizon.receiveShadow=true;scene.add(horizon);W.animateMap(0,0);W.applyMapLighting();
 };
})();
