/* Islayan Peak: one deterministic island shared by the browser and server. */
'use strict';
(()=>{
 const W=Isla,T=THREE;if(W.mapId!=='peaks')return;
 const TAU=Math.PI*2,{mix,smooth,clamp}=W,polar=(a,r)=>({x:Math.cos(a)*r,z:Math.sin(a)*r});
 // V2.34: retain the northern Crown footprint; summit rises from ~513 m to ~616 m.
 W.peaks=[{name:'Islayan Peak',x:0,z:-1040,r:1040,rise:570}];
 W.peaksCoastRadius=a=>2080*(1+.065*Math.sin(3*a+.7)+.038*Math.cos(5*a-.4)+.022*Math.sin(8*a));
 W.peaksCoastDistance=(x,z)=>W.peaksCoastRadius(Math.atan2(z,x))-Math.hypot(x,z);
 Object.assign(W,{span:5000,depth:5000,N:401,NZ:401,minX:-2500,minZ:-2500,mapBounds:{x:-2400,z:-2400,size:4800}});
 W.mapRawHeight=(x,z)=>{
  const coast=W.peaksCoastDistance(x,z);if(coast<0)return Math.max(-110,coast*.55);
  let mountain=0;for(const [i,p]of W.peaks.entries()){
   const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz)/p.r,a=Math.atan2(dz,dx);
   const ribs=1+Math.sin(a*5+i)*.11*smooth(.03,.25,d)+Math.sin(a*9-i)*.045*smooth(.08,.4,d);
   const t=Math.max(0,1-d/ribs);mountain=Math.max(mountain,p.rise*Math.pow(t,1.38));
  }
  const base=44+6*Math.sin(x*.0032)*Math.sin(z*.003)+W.fbm(x*.004,z*.004)*7;
  const crags=(W.fbm(x*.018+3,z*.018+8)-.5)*Math.min(23,mountain*.15)*smooth(40,200,mountain);
  const radius=Math.hypot(x,z),angle=Math.atan2(z,x);let raw=mix(47+W.noise(x*.005,z*.005)*3,base+mountain+crags,smooth(470,830,radius));
  // Keep the existing gentle valley approaches so the town and road network stay connected.
  for(let i=0;i<5;i++){const a=-Math.PI/2+(i+.5)*TAU/5,d=Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)))*radius;
   const valley=49+65*Math.sin(clamp((radius-450)/1500,0,1)*Math.PI),blend=Math.exp(-((d/185)**2))*smooth(450,650,radius);
   raw=mix(raw,Math.min(raw,valley),blend);
  }
  // Only the first five metres are sand; steep snowy slopes meet the water.
  return coast<5?coast*.18:mix(.9,raw,smooth(5,100,coast));
 };
 W.mapGroundColor=(x,z,h,slope,color)=>{
  const coast=W.peaksCoastDistance(x,z),grain=W.fbm(x*.027,z*.027);
  color.set(coast<5?'#a5a69e':'#dbe6e9');
  if(coast>=5){const exposed=smooth(.38,.86,slope)*(.5+W.noise(x*.055,z*.055)*.5);color.lerp(new T.Color('#586a78'),exposed*.83);color.lerp(new T.Color('#a3bac9'),(1-grain)*.15);}
  color.multiplyScalar(.90+grain*.13);
 };
 W.environmentColor='#bacbd9';W.roadColor='#6d7780';W.customRoadMarkings=true;
 W.extendRoads=W.makeRuizBuildings=W.makeRuizDetails=null;W.makeBridge=()=>{};W.bridgeSurface=W.approachSurface=()=>null;
 W.bridge={start:1e9,end:1e9+1,length:0,deckY:0};W.planRamps=()=>W.ramps;W.makeRamps=()=>{};
 const inner=a=>polar(a,350+22*Math.sin(3*a+.4)),outer=a=>polar(a,W.peaksCoastRadius(a)-255-35*Math.sin(2*a));
 const asArray=p=>[p.x,p.z];
 W.makeMapRoads=()=>{
  W.peakHomes=null;const ring=(fn,width,name)=>W.addRoad(Array.from({length:40},(_,i)=>asArray(fn(-Math.PI/2+i*TAU/40))),width,true,name);
  ring(inner,13,'Islayan Village Loop');ring(outer,12,'Ocean Rim Road');
  for(let i=0;i<5;i++){
   const a=-Math.PI/2+(i+.5)*TAU/5,points=[inner(a),polar(a+.06,650),polar(a-.065,1010),polar(a+.055,1390),outer(a)];
   W.addRoad(points.map(asArray),12,false,['Crown Pass','East Valley Road','South Shore Road','West Valley Road','North Shore Road'][i]);
  }
  W.addRoad([asArray(inner(Math.PI)),[-190,30],[0,0],[175,-22],asArray(inner(0))],13,false,'Village High Street');
  W.addRoad([asArray(inner(-Math.PI/2)),[25,-180],[0,0],[-25,175],asArray(inner(Math.PI/2))],12,false,'Chapel Lane');
  // Ease the road profiles to a driveable grade, cutting into the slope locally.
  for(const r of W.roads){r.graded=true;const s=r.samples;
   for(let pass=0;pass<12;pass++){if(r.closed)s[0].y=s.at(-1).y=Math.min(s[0].y,s.at(-1).y);for(let i=1;i<s.length;i++){const rise=Math.hypot(s[i].x-s[i-1].x,s[i].z-s[i-1].z)*.12;s[i].y=Math.min(s[i].y,s[i-1].y+rise);}for(let i=s.length-2;i>=0;i--){const rise=Math.hypot(s[i].x-s[i+1].x,s[i].z-s[i+1].z)*.12;s[i].y=Math.min(s[i].y,s[i+1].y+rise);}}
  }
  // Every branch ends on a loop. Blend its approach to the loop's exact height.
  for(const road of W.roads.filter(r=>!r.closed))for(const end of [0,road.samples.length-1]){const p=road.samples[end];let match=null,dist=Infinity;for(const r of W.roads.filter(r=>r.closed))for(const q of r.samples){const d=Math.hypot(q.x-p.x,q.z-p.z);if(d<dist){dist=d;match=q;}}if(dist>5)continue;const delta=match.y-p.y;for(const q of road.samples){const d=Math.hypot(q.x-p.x,q.z-p.z);if(d<100)q.y+=delta*(1-smooth(0,100,d));}}
 };
 // Interpolated asphalt height keeps narrow roads smooth on the terrain grid.
 const terrainDrive=W.driveHeight;
 W.peakRoadSurface=(x,z)=>{const near=W.nearestRoad(x,z);if(!near.p)return null;const s=near.p.road.samples,index=near.p.index;let best=null;
  for(const i of [index-1,index]){if(i<0||i>=s.length-1)continue;const a=s[i],b=s[i+1],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),d=Math.hypot(x-a.x-t*dx,z-a.z-t*dz);if(!best||d<best.d)best={d,y:mix(a.y,b.y,t),width:a.width};}return best;
 };
 W.driveHeight=(x,z)=>{const road=W.peakRoadSurface(x,z);return road&&road.d<=road.width/2+.6?road.y+.21:terrainDrive(x,z,true);};W.trafficHeight=W.driveHeight;
 W.spawn={x:2.35,z:0,yaw:0};W.vehicle.lastSafe={...W.spawn};
 W.placeName=(x,z,y)=>{if(Math.hypot(x,z)<450)return 'ISLAYAN VILLAGE';if(W.peaksCoastDistance(x,z)<350)return 'ISLAYAN · OCEAN RIM';const p=[...W.peaks].sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];if(Math.hypot(x-p.x,z-p.z)>p.r*1.15)return 'ISLAYAN · SNOWFIELDS';return p.name.toUpperCase()+(y>300?' · SUMMIT':' · FOOTHILLS');};
 W.mapPreview=()=>({x:2540,y:2450,z:2650,lookX:-130,lookY:80,lookZ:-180,fov:53});
 // Preserve the original village plots when the surrounding mountains are removed.
 const villagePlots=new Set(["-311.9160,30.8209","-301.1178,-14.9219","-257.0997,43.3423","-247.2826,-2.6210","-199.0926,53.1056","-195.4621,6.2461","-138.3366,47.7517","-145.5294,1.3053","-82.8798,38.3977","-91.0927,-7.8791","-36.2562,-17.7334","81.2876,11.8109","74.7062,-34.7260","135.9264,4.6727","130.5746,-42.0216","187.1115,2.0455","190.4441,-44.8362","241.2432,7.8740","247.1370,-38.7550","296.1981,15.2273","302.6472,-31.3282","-17.5141,-331.2214","27.9619,-338.1452","-9.1739,-275.9881","36.3363,-282.6826","-1.6308,-221.0865","44.0277,-226.6817","1.5394,-169.8284","47.4163,-166.4650","-5.0190,-115.9141","40.4988,-109.2708","-13.5701,-60.9596","31.8390,-53.6103","-31.2437,49.4827","14.1459,56.9515","-40.1107,105.0509","5.3722,111.9294","-47.3932,162.1823","-1.5369,165.8148","-42.7135,223.2212","2.7176,216.0086","-32.8417,278.9802","12.3635,270.4660","40.0399,-387.5914","79.2401,-325.6946","97.7825,-368.8823","124.3839,-300.7207","150.3289,-339.9107","165.7759,-268.3854","196.9709,-303.5403","203.7160,-230.5246","238.3237,-262.3257","238.6724,-188.9370","275.5145,-218.1202","270.4733,-145.1120","309.2471,-171.6750","298.4005,-99.0121","339.4662,-121.8727","364.0979,-68.1427","380.3941,-10.7085","338.8254,50.2736","385.8136,49.2215","332.3846,100.4475","314.8391,147.8626","357.6559,167.2462","287.0890,189.9565","324.3317,218.6268","250.7504,225.2993","280.9770,261.2903","207.7202,253.3176","230.6577,294.3404","159.8416,274.2967","176.2806,318.3281","108.7601,289.2440","120.1285,334.8484","55.9781,299.4887","63.6105,345.8649","-51.9402,355.2076","-103.7873,304.7999","-110.4534,351.3247","-154.7030,294.0071","-168.8719,338.8205","-202.7668,274.2765","-224.8400,315.7707","-245.3670,245.1095","-275.1376,281.4785","-279.7699,207.5790","-316.6118,236.7625","-304.3900,163.6771","-346.8141,183.9057","-318.8711,115.3934","-370.5648,65.7964","-366.0751,6.3230","-353.6115,-51.3210","-291.3678,-90.8680","-335.5855,-106.7991","-271.1630,-140.0682","-313.9113,-159.6023","-247.3185,-187.7854","-288.0086,-211.3080","-218.9729,-232.7551","-256.4067,-261.1753","-185.4927,-272.6898","-146.4728,-305.7562","-171.6612,-345.4367","-102.0500,-330.2232","-118.2748,-374.3339","-59.5437,-390.9259","278.3297,-320.1641","245.9773,-352.8646","318.0956,-359.8029","285.4454,-392.2061","357.4634,-400.1950","396.0086,111.2193","423.1772,178.4260","445.1472,138.0117","472.8093,204.9662","17.5759,368.8145","-36.7009,416.8201","8.7162,424.1196","-45.4118,472.2172","0.0646,479.1383","-375.9698,139.8911","-437.6922,101.9175","-431.4170,147.4875","-493.3463,109.9096","-243.7869,-306.4659","-227.1759,-376.9977","-268.4608,-356.7108","-252.1971,-427.2893","-293.2389,-406.5151"]);
 W.peakBuildingPlans=()=>{
  if(W.peakHomes)return W.peakHomes;const plans=[];
  const roads=[...W.roads.slice(7),W.roads[0],...W.roads.slice(2,7)];
  for(const road of roads){let next=35,distance=0;for(let i=1;i<road.samples.length-2;i++){
   const p=road.samples[i],prev=road.samples[i-1];distance+=Math.hypot(p.x-prev.x,p.z-prev.z);if(distance<next)continue;next=distance+53;
   if(Math.hypot(p.x,p.z)>780)continue;const q=road.samples[i+1],yaw=Math.atan2(q.x-prev.x,q.z-prev.z),nx=Math.cos(yaw),nz=-Math.sin(yaw);
   for(const side of [-1,1]){const off=road.width/2+17,x=p.x+nx*side*off,z=p.z+nz*side*off,n=W.noise(x*.1+5,z*.1+7),w=10+n*5,d=9+n*3;
    if(!villagePlots.has(x.toFixed(4)+','+z.toFixed(4)))continue;
    if(plans.some(b=>Math.hypot(b.x-x,b.z-z)<39)||Math.hypot(x,z)<40)continue;
    const a=yaw-side*Math.PI/2,co=Math.cos(a),si=Math.sin(a),corners=[];for(const dx of [-w/2-2,w/2+2])for(const dz of [-d/2-2,d/2+2])corners.push({x:x+co*dx+si*dz,z:z-si*dx+co*dz});
    if(corners.some(c=>{const r=W.nearestRoad(c.x,c.z,2);return r.p&&r.d<r.p.width/2+4;}))continue;
    const heights=corners.map(c=>W.height(c.x,c.z)),y=Math.min(...heights)-.2,foundation=Math.max(...heights)-y+.25;if(y<15||foundation>4.2)continue;
    const floors=n>.42?2:1;plans.push({id:plans.length,x,z,y,yaw:a,w,d,h:foundation+floors*3.2+3.1,foundation,floors,variant:plans.length%6,name:(Math.hypot(x,z)<450?'Islayan village house ':'Mountain chalet ')+(plans.length+1)});
   }
  }}W.peakHomes=plans;return plans;
 };
 function roofGeometry(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-.5,0,-.5,.5,0,-.5,0,1,-.5,-.5,0,.5,.5,0,.5,0,1,.5],3));g.setIndex([0,2,3,3,2,5,2,1,5,5,1,4,0,1,2,3,5,4]);g.computeVertexNormals();return g;}
 W.makeBuildings=scene=>{
  const snow=W.mat('#edf4f4'),stone=W.mat('#7a8790'),timber=W.mat('#495358'),roofGeo=roofGeometry();
  const colors=['#a55d42','#6c8d91','#b6a889','#778b78','#b8bfc2','#626f83'];
  const textures=colors.map(color=>{const t=W.textureCanvas(256,c=>{c.fillStyle=color;c.fillRect(0,0,256,256);c.fillStyle='#273c4a25';for(let y=0;y<256;y+=16)c.fillRect(0,y,256,2);for(const x of [30,150]){c.fillStyle='#f2e9d2';c.fillRect(x,48,64,112);c.fillStyle='#553c28';c.fillRect(x+5,53,54,102);c.fillStyle='#ffdc8b';c.fillRect(x+9,57,46,94);c.fillStyle='#f1e4c6';c.fillRect(x+29,53,5,102);c.fillRect(x+5,99,54,4);c.fillStyle='#e7f0f1';c.fillRect(x-5,160,74,9);}});t.encoding=T.sRGBEncoding;return t;});
  for(const p of W.peakBuildingPlans()){
   const group=new T.Group();group.position.set(p.x,p.y,p.z);group.rotation.y=p.yaw;scene.add(group);
   const wall=W.mat('#ffffff',.87);wall.map=textures[p.variant];const b={...p,group,wall,color:'#ffffff',hp:100,maxHp:100,collapsed:false,lastHit:-10,cracks:[],windows:[],pieces:[]};W.buildings.push(b);W.colliders.push(b);
   W.box(group,0,p.foundation/2,0,p.w+.5,p.foundation,p.d+.5,stone);const height=p.floors*3.2;
   b.body=W.box(group,0,p.foundation+height/2,0,p.w,height,p.d,wall);b.body.geometry=W.unitBox.clone();const uv=b.body.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*p.floors);
   const roof=new T.Mesh(roofGeo,snow);roof.position.y=p.foundation+height;roof.scale.set(p.w+2,3.1,p.d+2);roof.castShadow=roof.receiveShadow=true;group.add(roof);
   W.box(group,p.w*.25,p.h-1,-p.d*.2,.85,2.2,.9,stone);W.box(group,p.w*.25,p.h+.15,-p.d*.2,1.15,.15,1.2,snow);
   W.box(group,0,p.foundation+1.15,p.d/2+.06,1.5,2.3,.15,timber);W.box(group,0,p.foundation+.08,p.d/2+1,3.6,.22,2,stone);
   W.box(group,0,p.foundation+2.75,p.d/2+1.1,4.2,.28,2.8,snow);
   for(const side of [-1,1])W.box(group,side*1.8,p.foundation+1.4,p.d/2+2,.14,2.8,.14,timber);
  }
  W.mapInfo.specs=['1 mountain peak',Math.round(Math.max(...W.peaks.map(p=>W.height(p.x,p.z))))+' m highest summit','Snowfall · valley town'];
 };
 W.makeVegetation=scene=>{
  W.grass=new T.Group();scene.add(W.grass);const trees=[];let seed=725318;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<14000&&trees.length<2400;i++){
   const x=(random()-.5)*4300,z=(random()-.5)*4300,y=W.height(x,z),near=W.nearestRoad(x,z),slope=W.slope(x,z);
   if(y<16||y>315||W.peaksCoastDistance(x,z)<38||Math.hypot(slope.x,slope.z)>.6||near.d<(near.p?near.p.width/2+7:12)||W.buildings.some(b=>Math.hypot(b.x-x,b.z-z)<Math.hypot(b.w,b.d)/2+6))continue;
   if(W.noise(x*.006,z*.006)<.3)continue;trees.push({x,y,z,s:1+random()*.65,a:random()*TAU});
  }
  const trunk=new T.InstancedMesh(new T.CylinderGeometry(.19,.3,5,5),W.mat('#625c58'),trees.length),green=new T.InstancedMesh(new T.ConeGeometry(2.3,5,7),W.mat('#324f54'),trees.length*3),snow=new T.InstancedMesh(new T.ConeGeometry(2.24,4.2,7),W.mat('#e3edef'),trees.length*3),o=new T.Object3D();
  const tint=new T.Color(1,1,1);trees.forEach((p,i)=>{o.rotation.set(0,p.a,0);o.position.set(p.x,p.y+2.5*p.s,p.z);o.scale.setScalar(p.s);o.updateMatrix();trunk.setMatrixAt(i,o.matrix);trunk.setColorAt(i,tint);const parts=[{mesh:trunk,index:i}];for(let j=0;j<3;j++){const scale=p.s*(1-j*.22);o.position.y=p.y+(3.8+j*1.8)*p.s;o.scale.setScalar(scale);o.updateMatrix();green.setMatrixAt(i*3+j,o.matrix);green.setColorAt(i*3+j,tint);o.position.y+=.5*scale;o.updateMatrix();snow.setMatrixAt(i*3+j,o.matrix);snow.setColorAt(i*3+j,tint);parts.push({mesh:green,index:i*3+j},{mesh:snow,index:i*3+j});}W.colliders.push(W.registerTree({kind:'tree',x:p.x,z:p.z,y:p.y,r:.32*p.s,h:11*p.s},parts));});
  trunk.castShadow=green.castShadow=true;trunk.receiveShadow=green.receiveShadow=snow.receiveShadow=true;scene.add(trunk,green,snow);W.peakPines=trees;
 };
 W.makeRoadDetails=scene=>{
  const white=W.mat('#d6dde0'),yellow=W.mat('#d6b86c'),snow=W.mat('#e5edef'),pole=W.mat('#536773'),lamp=new T.MeshStandardMaterial({color:'#ffe9b1',emissive:'#ffd381',emissiveIntensity:.65});
  const details=new T.Group();scene.add(details);
  for(const r of W.roads){for(const side of [-1,1]){W.makeRoadStrip(details,r.samples,.12,white,side*(r.width/2-.55),.16);W.makeRoadStrip(details,r.samples,1.3,snow,side*(r.width/2+1),.26);}for(let i=1;i<r.samples.length-4;i+=6)W.makeRoadStrip(details,r.samples.slice(i,i+3),.15,yellow,0,.17);
   for(let i=20;i<r.samples.length-20;i+=25){const p=r.samples[i],q=r.samples[i+1],a=Math.atan2(q.x-p.x,q.z-p.z);for(const side of [-1,1]){const x=p.x+Math.cos(a)*side*(r.width/2+1.7),z=p.z-Math.sin(a)*side*(r.width/2+1.7),y=W.height(x,z);W.box(details,x,y+.9,z,.12,1.8,.12,pole,false);W.box(details,x,y+1.58,z,.16,.28,.16,yellow,false);}}
  }
  for(const r of [W.roads[0],...W.roads.slice(7)])for(let i=16;i<r.samples.length-10;i+=30){const p=r.samples[i],q=r.samples[i+1],a=Math.atan2(q.x-p.x,q.z-p.z),x=p.x+Math.cos(a)*(r.width/2+3),z=p.z-Math.sin(a)*(r.width/2+3),y=W.height(x,z);W.box(details,x,y+3.2,z,.16,6.4,.16,pole,false);W.box(details,x,y+6.5,z,1.2,.4,1.2,lamp,false);W.box(details,x,y+6.75,z,1.45,.16,1.45,snow,false);}
  const signTex=W.textureCanvas(512,c=>{c.fillStyle='#203e50';c.fillRect(0,0,512,512);c.strokeStyle='#ccdde2';c.lineWidth=6;c.strokeRect(10,120,492,260);c.fillStyle='#f1ede3';c.textAlign='center';c.font='bold 47px Arial';c.fillText('ISLAYAN',256,228);c.font='24px Arial';c.fillText('ONE PEAK · ONE ISLAND',256,292);});signTex.encoding=T.sRGBEncoding;
  const sign=new T.Mesh(new T.PlaneGeometry(9,4.5),new T.MeshStandardMaterial({map:signTex,side:T.DoubleSide})),signY=W.height(33,32);sign.position.set(33,signY+4.8,32);sign.rotation.y=Math.PI;details.add(sign);for(const side of [-1,1])W.box(details,33+side*3,signY+2.5,32,.2,5,.2,pole);
 };
 W.initCityTraffic=(route,place)=>{
  W.trafficRoutes=[];W.traffic=[];const colors=['#d5dce1','#3d6778','#ad6246','#8f9d8b','#d1b86b','#4c5360'];
  const paths=[W.roads[0].samples,W.roads[1].samples];
  // A third loop links the village to the ocean through two neighbouring passes.
  const a=W.roads[2].samples,b=W.roads[3].samples,arc=(ring,from,to)=>{let start=0,end=0;for(let i=0;i<ring.length-1;i++){if(Math.hypot(ring[i].x-from.x,ring[i].z-from.z)<Math.hypot(ring[start].x-from.x,ring[start].z-from.z))start=i;if(Math.hypot(ring[i].x-to.x,ring[i].z-to.z)<Math.hypot(ring[end].x-to.x,ring[end].z-to.z))end=i;}const result=[];for(let i=start;i!==end;i=(i+1)%(ring.length-1))result.push(ring[i]);result.push(ring[end]);return result;};
  paths.push([...a,...arc(W.roads[1].samples,a.at(-1),b.at(-1)),...b.slice().reverse(),...arc(W.roads[0].samples,b[0],a[0])]);
  paths.forEach((points,ri)=>{const r=route(points);W.trafficRoutes.push(r);const count=[10,12,6][ri];for(let i=0;i<count;i++){const cruise=ri===0?8+i%3:12+i%4;const t={id:W.traffic.length,route:r,distance:(i+.37)*r.length/count,direction:i%2?1:-1,cruise,speed:cruise,lane:2.35,offsetX:0,offsetZ:0,driftX:0,driftZ:0,stun:0,w:1.9,d:4.4,color:colors[(i+ri)%6]};W.traffic.push(t);place(t);}});
 };
 const stepVehicle=W.stepVehicle;W.stepVehicle=(dt,input,time)=>{stepVehicle(dt,input,time);if(W.vehicle.surface==='OFF ROAD')W.vehicle.surface='SNOW';};
 W.applyMapLighting=(warm=0)=>{if(!W.scene)return;W.scene.fog.color.set(warm?'#b6bdc6':'#adc3d0');W.scene.fog.density=.00039;W.sun.color.set(warm?'#ffe2c5':'#e6efff');W.sun.intensity=warm?1.05:1.15;W.hemi.color.set('#d8e9f5');W.hemi.groundColor.set('#738291');W.hemi.intensity=.95;};
 function snowfall(scene){
  const layers=[];for(const [count,width,height,size]of [[2400,125,100,.09],[2600,480,240,.17]]){
   const positions=new Float32Array(count*3);for(let i=0;i<count;i++){positions[i*3]=W.noise(i*.31,7)*width;positions[i*3+1]=W.noise(8,i*.71)*height;positions[i*3+2]=W.noise(i*.61,19)*width;}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},center:{value:new T.Vector3()},extent:{value:new T.Vector3(width,height,width)},flakeSize:{value:size},pixelRatio:{value:1}},vertexShader:`uniform float time;uniform vec3 center;uniform vec3 extent;uniform float flakeSize;uniform float pixelRatio;varying float fade;void main(){vec3 drift=vec3(time*2.1+sin(time*.7+position.y)*1.8,-time*(3.+fract(position.x)*1.6),time*.65);vec3 p=mod(position+drift-center+extent*.5,extent)-extent*.5+center;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(flakeSize*pixelRatio*650./max(1.,-mv.z),1.1,5.);fade=(1.-smoothstep(15.,extent.x*.58,length(p.xz-center.xz)))*.82;}`,fragmentShader:`varying float fade;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;gl_FragColor=vec4(.94,.98,1.,(1.-smoothstep(.10,.5,r))*fade);}`});const points=new T.Points(geo,mat);points.frustumCulled=false;scene.add(points);layers.push(points);
  }W.snowLayers=layers;
 }
 W.animateMap=(dt,time,camera)=>{W.scene.fog.density=document.getElementById('intro').classList.contains('hidden')?.00039:.00012;for(const p of W.snowLayers||[]){p.material.uniforms.time.value=time;p.material.uniforms.center.value.copy(camera.position);p.material.uniforms.pixelRatio.value=W.renderer.getPixelRatio();}};
 const makeWorld=W.makeWorld;W.makeWorld=(scene,renderer)=>{
  makeWorld(scene,renderer);W.sky.material.fragmentShader=`varying vec3 vWorld;uniform vec3 sunDirection;uniform float warm;void main(){vec3 d=normalize(vWorld);float h=max(0.,d.y);float cloud=sin(d.x*17.+d.z*9.)*.018+sin(d.x*31.-d.z*22.)*.012;vec3 col=mix(vec3(.67,.76,.81),vec3(.31,.43,.55),pow(h,.55))+cloud;col=mix(col,vec3(.58,.59,.62),warm*.25);gl_FragColor=vec4(col,1.);}`;W.sky.material.needsUpdate=true;
  W.water.material.fragmentShader=W.water.material.fragmentShader.replace('vec3(.08,.51,.49),vec3(.025,.20,.28)','vec3(.12,.27,.33),vec3(.025,.095,.17)').replace('*spec*1.8','*spec*.12');W.water.material.needsUpdate=true;W.water.geometry.dispose();W.water.geometry=new T.PlaneGeometry(50000,50000);
  W.applyMapLighting();snowfall(scene);if(typeof document!=='undefined'&&document.body){document.body.classList.add('peaks-map');const select=document.getElementById('daylight');if(select){select.options[0].text='Winter daylight';select.options[1].text='Winter dusk';}}
 };
})();
