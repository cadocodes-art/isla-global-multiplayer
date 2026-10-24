'use strict';
(()=>{
 const W=Isla,T=THREE;
 const requested=typeof IslaMapId==='string'?IslaMapId:typeof location!=='undefined'?new URLSearchParams(location.search).get('map'):null;
 W.mapId=requested==='obstacle'?'peaks':['city','peaks','playplace'].includes(requested)?requested:'islands';
 W.mapInfo=W.mapId==='playplace'?{name:'The Playplace',short:'THE PLAYPLACE',index:4,headline:'Go big.<br><em>Play bigger.</em>',description:'An entire playground. Built for cars.<br>Bounce higher. Take the slide. Make some noise.',specs:['Giant indoor arena','Trampolines · foam pits','Spiral ramps · swinging ropes']}:W.mapId==='peaks'?{name:'Islayan Peaks',short:'ISLAYAN PEAKS',index:3,headline:'Above the clouds.<br><em>Beyond the coast.</em>',description:'Five peaks. An endless snowfall.<br>Follow the passes. Find your mountain town.',specs:['5 mountain peaks','500 m summit','Snowfall · valley town']}:W.mapId==='city'?{name:'Costa Metro',short:'COSTA METRO',index:2,headline:'The city.<br><em>At your mercy.</em>',description:'A skyline to chase. Streets to own.<br>Go above the traffic. Or straight through it.',specs:['Coastal downtown','72 traffic cars','Rolling hillside roads']}:{name:'Santa Luz + Santa Ruiz',short:'LUZ + RUIZ',index:1,headline:'Paradise.<br><em>With consequences.</em>',description:'Two islands. Your next obsession.<br>Find your road. Or make your own.',specs:['2 islands · 400 m bridge','Open terrain','Persistent destruction']};
 W.bindMapMenu=()=>{
  const $=id=>document.getElementById(id),info=W.mapInfo;
  $('mapName').textContent=info.name;$('mapNumber').textContent=String(info.index).padStart(2,'0')+' / 04';$('place').textContent=info.short;
  $('introTitle').innerHTML=info.headline;$('introDescription').innerHTML=info.description;$('introSpecs').innerHTML=info.specs.map(s=>'<span>'+W.units.text(s)+'</span>').join('<i></i>');
  $('mapCaption').textContent=info.short;$('mapScale').textContent=W.units.distance(W.mapId==='playplace'?1200:W.mapId==='peaks'?4800:W.mapId==='city'?2100:3400);$('world').setAttribute('aria-label',info.name+' driving game');
  $('roomMapName').textContent=info.short+' · ONE SHARED WORLD';$('roomIntro').textContent='Join other drivers exploring '+info.name+'.';
  $('mapNext').setAttribute('aria-label','Preview '+(W.mapId==='city'?'Islayan Peaks':W.mapId==='peaks'?'The Playplace':W.mapId==='playplace'?'the islands':'Costa Metro city'));
  const go=map=>{const url=new URL(location.href);url.searchParams.set('map',map);url.searchParams.set('menu','1');location.assign(url.href);};
  $('mapNext').onclick=()=>go(W.mapId==='city'?'peaks':W.mapId==='peaks'?'playplace':W.mapId==='playplace'?'islands':'city');
  $('mapMenuBtn').onclick=()=>{if(W.net?.active)W.net.leave();go(W.mapId);};
 };
 if(W.mapId!=='city')return;
 // World +X is east and -Z is north. The coastline opens to the northeast.
 const GRID=160,ANGLE=.48,CO=Math.cos(ANGLE),SI=Math.sin(ANGLE),streets=Array.from({length:9},(_,i)=>-640+i*GRID);
 const shore=[[-1300,-1210],[-1000,-1080],[-800,-850],[-560,-770],[-280,-735],[0,-690],[300,-540],[550,-300],[760,30],[1000,270],[1300,420]];
 W.cityAngle=ANGLE;W.cityLimits={minX:-1000,maxX:1000,minZ:-1000,maxZ:1000};W.mapBounds={x:-1050,z:-1050,size:2100};
 Object.assign(W,{span:2600,depth:2600,N:261,NZ:261,minX:-1300,minZ:-1300});
 W.cityShoreZ=x=>{let i=0;while(i<shore.length-2&&x>shore[i+1][0])i++;const a=shore[i],b=shore[i+1],prev=shore[Math.max(0,i-1)],next=shore[Math.min(shore.length-1,i+2)],d=b[0]-a[0],t=W.clamp((x-a[0])/d,0,1),m0=(b[1]-prev[1])/(b[0]-prev[0]),m1=(next[1]-a[1])/(next[0]-a[0]);return (2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*d*m0+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*d*m1;};
 W.cityShoreDistance=(x,z)=>{const slope=(W.cityShoreZ(x+2)-W.cityShoreZ(x-2))/4;return (z-W.cityShoreZ(x))/Math.hypot(1,slope);};
 W.cityCoastRoadZ=x=>{const slope=(W.cityShoreZ(x+2)-W.cityShoreZ(x-2))/4;return W.cityShoreZ(x)+82*Math.hypot(1,slope);};
 function warp(u,v){const a=W.smooth(400,670,Math.max(Math.abs(u),Math.abs(v)))*W.smooth(360,800,Math.hypot(u-80,(v+400)*.8));return {u:u+a*52*Math.sin(v/132+u/310),v:v+a*60*Math.sin(u/175+.8)};}
 W.cityToWorld=(u,v)=>{const p=warp(u,v);return {x:CO*p.u-SI*p.v,z:SI*p.u+CO*p.v};};
 W.cityLocal=(x,z)=>{const u=CO*x+SI*z,v=-SI*x+CO*z;let a=u,b=v;for(let i=0;i<5;i++){const p=warp(a,b);a+=u-p.u;b+=v-p.v;}return {u:a,v:b};};
 const F=W.cityToWorld,inside=(p,margin=0)=>Math.abs(p.x)<1000-margin&&Math.abs(p.z)<1000-margin;
 W.mapRawHeight=(x,z)=>{const d=W.cityShoreDistance(x,z);if(d<0)return -.5-Math.min(45,-d*.16);const inland=13+13*Math.exp(-((x+520)**2/190000+(z-330)**2/180000))+8*Math.exp(-((x-350)**2/150000+(z-630)**2/160000))+2.8*Math.sin(x*.004+1)*Math.sin(z*.003);return -.5+(inland+.5)*W.smooth(0,125,d);};
 W.customRoadMarkings=true;W.roadColor='#a5aaae';W.approachSurface=()=>null;W.extendRoads=null;W.makeRuizBuildings=null;W.makeRuizDetails=null;
 W.cityJunctions=[];
 W.makeMapRoads=()=>{
  W.suburbPlans=null;W.coastConnections=[];
  // End coastal streets exactly at Waterfront Drive, instead of beach stubs.
  function add(points,width,name,residential=false){let run=[];const land=p=>p.z-W.cityCoastRoadZ(p.x),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),flush=()=>{if(run.length>1&&distance(run.at(-1),run[0])>3){const clean=[run[0]];for(let i=1;i<run.length-1;i++)if(distance(run[i],clean.at(-1))>=8)clean.push(run[i]);if(clean.length>1&&distance(run.at(-1),clean.at(-1))<8)clean.pop();clean.push(run.at(-1));const road=W.addRoad(clean.map(p=>[p.x,p.z]),width,false,name);road.graded=true;road.residential=residential;
    // Keep both junction heights fixed while easing any steep approach samples.
    const s=road.samples;for(let pass=0;pass<2;pass++){for(let i=1;i<s.length-1;i++){const rise=distance(s[i],s[i-1])*.18;s[i].y=W.clamp(s[i].y,s[i-1].y-rise,s[i-1].y+rise);}for(let i=s.length-2;i>0;i--){const rise=distance(s[i],s[i+1])*.18;s[i].y=W.clamp(s[i].y,s[i+1].y-rise,s[i+1].y+rise);}}
   }run=[];};
   for(let i=0;i<points.length;i++){const p=points[i],a=points[i-1];if(a&&(land(a)>=0)!==(land(p)>=0)){let lo=0,hi=1;for(let n=0;n<25;n++){const t=(lo+hi)/2,q={x:W.mix(a.x,p.x,t),z:W.mix(a.z,p.z,t)};if((land(q)>=0)===(land(a)>=0))lo=t;else hi=t;}const t=(lo+hi)/2,hit={x:W.mix(a.x,p.x,t),z:W.mix(a.z,p.z,t)};run.push(hit);W.coastConnections.push(hit);if(land(p)<0)flush();}if(land(p)>=0)run.push(p);}flush();
  }
  for(const u of [0,...streets.filter(x=>x!==0)]){const pts=[];for(let v=720;v>=-720;v-=20)pts.push(F(u,v));add(pts,22,u===0?'Metro Boulevard':'City avenue');}
  for(const v of streets){const pts=[];for(let u=-720;u<=720;u+=20)pts.push(F(u,v));add(pts,22,'City cross street');}
  const coast=[];for(let x=-3600;x<=3600;x+=20)coast.push([x,W.cityCoastRoadZ(x)]);const waterfront=W.addRoad(coast,16,false,'Waterfront Drive');waterfront.graded=true;waterfront.coastal=true;
  for(const [name,points]of [['West Ridge Road',[[-640,-160],[-820,-220],[-900,-40],[-820,140],[-640,160]]],['Garden Loop',[[-480,640],[-540,770],[-350,870],[-140,760],[0,640]]],['East Hills Road',[[640,160],[780,240],[790,430],[620,520],[480,640]]]]){
   const road=W.addRoad(points.map(([u,v])=>{const p=F(u,v);return [p.x,p.z];}),14,false,name);road.graded=true;
  }
  // Neighborhood roads continue through the invisible play boundary into scenery.
  const residential=(axis,fixed,from,to)=>{const points=[];for(let t=from;t<=to;t+=20)points.push(axis==='u'?F(fixed,t):F(t,fixed));add(points,11,'Neighborhood street',true);};
  for(const axis of ['u','v']){for(const value of streets){residential(axis,value,-2240,-720);residential(axis,value,720,2240);}for(let value=800;value<=2240;value+=160)for(const sign of [-1,1])residential(axis,sign*value,-2240,2240);}
  W.cityJunctions=[];for(const u of streets)for(const v of streets){const p=F(u,v);if(inside(p,50)&&W.cityShoreDistance(p.x,p.z)>108)W.cityJunctions.push({u,v,...p});}
 };
 const parkKeys=new Set(['3,3','4,4','1,6']);W.cityBlocks=[];
 for(let ix=0;ix<8;ix++)for(let iz=0;iz<8;iz++){const u=-640+ix*GRID,v=-640+iz*GRID,key=ix+','+iz;let valid=true;for(const a of [14,80,146])for(const b of [14,80,146]){const p=F(u+a,v+b);if(!inside(p,65)||W.cityShoreDistance(p.x,p.z)<55)valid=false;}if(valid)W.cityBlocks.push({ix,iz,u,v,key,park:parkKeys.has(key)});}
 const blockKeys=new Set(W.cityBlocks.map(b=>b.key)),groundDrive=W.driveHeight;
 W.driveHeight=(x,z,belowDeck=false)=>{const h=groundDrive(x,z,belowDeck),deck=W.bridgeSurface(x,z);if(deck!=null&&!belowDeck)return h;const near=W.nearestRoad(x,z);if(near.p&&near.d<=near.p.width/2+.2)return h;const p=W.cityLocal(x,z),ix=Math.floor((p.u+640)/GRID),iz=Math.floor((p.v+640)/GRID),a=p.u+640-ix*GRID,b=p.v+640-iz*GRID;return h+(blockKeys.has(ix+','+iz)&&a>11&&a<149&&b>11&&b<149?.32:0);};
 W.trafficHeight=(x,z)=>W.driveHeight(x,z,true);
 W.bridge={start:1e9,end:1e9+1,length:0,deckY:55};
 function deckHeight(){if(W.cityDeckHeight==null){let highest=0;for(const u of [-320,320])for(let v=-380;v<=380;v+=20){const p=F(u,v);highest=Math.max(highest,W.height(p.x,p.z));}W.cityDeckHeight=highest+18;W.bridge.deckY=W.cityDeckHeight;}return W.cityDeckHeight;}
 W.bridgeSurface=(x,z)=>{const u=CO*x+SI*z,v=-SI*x+CO*z;return [-320,320].some(cx=>Math.abs(u-cx)<=5.6)&&Math.abs(v)<=240&&Math.abs(v)>=12?deckHeight():null;};
 const sp=F(3,570);W.spawn={...sp,yaw:Math.PI-ANGLE};W.vehicle.lastSafe={...W.spawn};
 W.cityDowntown=F(80,-400);
 W.placeName=(x,z,y)=>{const p=W.cityLocal(x,z);if(Math.abs(p.u)<340&&Math.abs(p.v)<390&&y>deckHeight()-6)return 'SKYLINE RUN';if(Math.hypot(x-W.cityDowntown.x,z-W.cityDowntown.z)<300)return 'COSTA METRO · DOWNTOWN';if(W.cityShoreDistance(x,z)<180)return 'COSTA METRO · WATERFRONT';return Math.max(Math.abs(p.u),Math.abs(p.v))>500?'COSTA METRO · HILLSIDE':'COSTA METRO';};
 W.mapPreview=()=>{const t=typeof performance!=='undefined'?performance.now()*.000018:0;return {x:-570+Math.sin(t)*40,y:255,z:730+Math.cos(t)*30,lookX:160,lookY:36,lookZ:-330,fov:58};};
 W.cityBuildingPlans=()=>{const plans=[];for(const block of W.cityBlocks){if(block.park)continue;for(let a=0;a<2;a++)for(let b=0;b<3;b++){
  const u=block.u+40+a*80,v=block.v+36+b*44,p=F(u,v),tangent=F(u+1,v),yaw=-Math.atan2(tangent.z-p.z,tangent.x-p.x),n=W.noise(block.ix*4+a+.27,block.iz*5+b+.73),center=Math.exp(-((u-80)**2+(v+400)**2)/85000),floors=3+Math.floor(n*5+center*29)+(center>.88&&n>.45?10:0),w=36+Math.floor(n*10),d=24+Math.floor(n*7),co=Math.cos(yaw),si=Math.sin(yaw);
  const corners=[];for(const x of [-w/2-1,w/2+1])for(const z of [-d/2-1,d/2+1])corners.push({x:p.x+co*x+si*z,z:p.z-si*x+co*z});
  if(corners.some(q=>{const r=W.nearestRoad(q.x,q.z,2);return r.p&&r.d<r.p.width/2+2;}))continue;
  const heights=corners.map(q=>W.height(q.x,q.z)),y=Math.min(...heights)-.12,foundation=Math.max(...heights)-y+.42;
  plans.push({id:plans.length,...p,y,yaw,w,d,h:floors*3.4+foundation,foundation,floors,name:(center>.48?'Waterfront tower':Math.max(Math.abs(u),Math.abs(v))>500?'Hillside apartments':'Metro block')+' '+(plans.length+1)});
 }}for(const p of W.citySuburbPlans())if(!p.scenery)plans.push({...p,id:plans.length});return plans;};
 const suburbGround=(x,z)=>Math.max(Math.abs(x),Math.abs(z))<=1300?W.height(x,z):W.mapRawHeight(x,z);
 W.citySuburbPlans=()=>{if(W.suburbPlans)return W.suburbPlans;const plans=[],cells=new Map();
  const occupied=(x,z)=>{const cx=Math.floor(x/32),cz=Math.floor(z/32);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const p of cells.get((cx+a)+','+(cz+b))||[])if(Math.hypot(p.x-x,p.z-z)<28)return true;return false;};
  // Existing winding loops get houses too; the downtown blocks remain intact.
  for(const road of W.roads){let distance=0,next=18;for(let i=1;i<road.samples.length-1;i++){const q=road.samples[i],prev=road.samples[i-1];distance+=Math.hypot(q.x-prev.x,q.z-prev.z);if(distance<next)continue;next=distance+38;
   const after=road.samples[i+1],dx=after.x-prev.x,dz=after.z-prev.z,len=Math.hypot(dx,dz)||1,nx=dz/len,nz=-dx/len;
   for(const side of [-1,1]){const offset=road.width/2+17,x=q.x+nx*offset*side,z=q.z+nz*offset*side,local=W.cityLocal(x,z);
    if(Math.max(Math.abs(local.u),Math.abs(local.v))<705||W.cityShoreDistance(x,z)<115||occupied(x,z))continue;
    const n=W.noise(x*.037+4.3,z*.041+8.1),floors=n>.58?2:1,w=11+n*4,d=9+n*3,yaw=Math.atan2(-nx*side,-nz*side),co=Math.cos(yaw),si=Math.sin(yaw),corners=[];
    const nearest=W.nearestRoad(x,z,2);if(nearest.p&&nearest.d<nearest.p.width/2+Math.hypot(w,d)/2+3)continue;
    for(const a of [-w/2-2,w/2+2])for(const b of [-d/2-2,d/2+2])corners.push({x:x+co*a+si*b,z:z-si*a+co*b});
    if(corners.some(p=>{const near=W.nearestRoad(p.x,p.z,2);return near.p&&near.d<near.p.width/2+3;}))continue;
    const heights=corners.map(p=>suburbGround(p.x,p.z)),y=Math.min(...heights)-.1,foundation=Math.max(...heights)-y+.22;
    if(foundation>2.4)continue;
    const p={x,z,y,yaw,w,d,foundation,floors,h:foundation+floors*3.1+2.2,house:true,variant:Math.floor(n*6),scenery:Math.max(Math.abs(x),Math.abs(z))>980,name:'Neighborhood home '+(plans.length+1)};
    plans.push(p);const key=Math.floor(x/32)+','+Math.floor(z/32);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(p);
   }
  }}W.suburbPlans=plans;return plans;};
 function cityBox(parent,u,y,v,w,h,d,material,shadow=true){const p=F(u,v),q=F(u+1,v),mesh=W.box(parent,p.x,y,p.z,w,h,d,material,shadow);mesh.rotation.y=-Math.atan2(q.z-p.z,q.x-p.x);return mesh;}
 function surfacePatch(parent,block,material){const vertices=[],indices=[],n=7;for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const p=F(block.u+11.4+i*137.2/n,block.v+11.4+j*137.2/n);vertices.push(p.x,W.height(p.x,p.z)+.32,p.z);}for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i;indices.push(a,a+n+1,a+1,a+1,a+n+1,a+n+2);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new T.Mesh(geo,material);mesh.receiveShadow=true;parent.add(mesh);}
 W.makeBuildings=scene=>{
  const trim=W.mat('#b5b5af'),roof=W.mat('#4c565c'),pavers=W.mat('#8b9290'),park=W.mat('#527250'),colors=['#c3b9a6','#b0b8b9','#bca896','#91a4ae','#c9c6b8','#8d9a9d'];
  const homeColors=['#e0d1b4','#a3bec0','#bd967d','#c8cfb9','#dcc8a2','#aab4c8'],homeRoofs=['#635b51','#53616a','#815b45'],roofGeo=new T.ConeGeometry(1,1,4);roofGeo.rotateY(Math.PI/4);
  const homeWalls=homeColors.map(color=>{const m=W.mat('#ffffff',.9),t=W.textureCanvas(128,(c,s)=>{c.fillStyle=color;c.fillRect(0,0,s,s);c.fillStyle='#57615c30';for(let y=0;y<s;y+=8)c.fillRect(0,y,s,1);for(const x of [22,80]){c.fillStyle='#f3ead7';c.fillRect(x,34,29,55);c.fillStyle='#355565';c.fillRect(x+4,38,21,47);c.fillStyle='#e4e5d3';c.fillRect(x+13,38,2,47);c.fillRect(x+4,61,21,2);}});t.encoding=T.sRGBEncoding;m.map=t;return m;});
  const homeRoofMats=homeRoofs.map(c=>W.mat(c)),doorMat=W.mat('#475a52');
  const atlases=colors.map((color,k)=>W.textureCanvas(256,(c,s)=>{c.fillStyle=color;c.fillRect(0,0,s,s);for(let row=0;row<8;row++){c.fillStyle='#6c747955';c.fillRect(0,row*32,s,2);for(let col=0;col<6;col++){const xx=col*42+8,yy=row*32+7;c.fillStyle='#e5e4d6';c.fillRect(xx-2,yy-2,29,21);c.fillStyle=(row+col+k)%7===0?'#b8c4b1':'#345362';c.fillRect(xx,yy,25,17);c.fillStyle='#b4cbd03b';c.fillRect(xx+1,yy+1,11,15);c.fillStyle='#172d394f';c.fillRect(xx,yy+13,25,4);}}}));atlases.forEach(t=>t.encoding=T.sRGBEncoding);
  const crackTexture=W.textureCanvas(128,c=>{c.clearRect(0,0,128,128);c.strokeStyle='#18242bd9';c.lineWidth=1.5;for(let k=0;k<7;k++){c.beginPath();c.moveTo(64,50);for(let j=1;j<=5;j++)c.lineTo(64+Math.cos(k*.9+j*.19)*j*13,50+Math.sin(k*.9-j*.13)*j*15);c.stroke();}}),crackMat=new T.MeshBasicMaterial({map:crackTexture,transparent:true,depthWrite:false});
  for(const block of W.cityBlocks)surfacePatch(scene,block,block.park?park:pavers);
  for(const p of W.cityBuildingPlans()){
   const group=new T.Group();group.position.set(p.x,p.y,p.z);group.rotation.y=p.yaw;scene.add(group);const wall=p.house?homeWalls[p.variant].clone():W.mat('#ffffff',.55,.16);if(!p.house)wall.map=atlases[p.id%6];const b={...p,group,wall,color:'#ffffff',hp:100,maxHp:100,collapsed:false,lastHit:-10,cracks:[],windows:[],pieces:[]};W.buildings.push(b);W.colliders.push(b);
   if(p.house){const height=p.floors*3.1;W.box(group,0,p.foundation/2,0,p.w+.25,p.foundation,p.d+.25,trim);b.body=W.box(group,0,p.foundation+height/2,0,p.w,height,p.d,wall);b.body.geometry=W.unitBox.clone();const uv=b.body.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*p.floors);
    const top=new T.Mesh(roofGeo,homeRoofMats[p.variant%3]);top.position.y=p.foundation+height+1.1;top.scale.set(p.w*.78,2.2,p.d*.78);top.castShadow=top.receiveShadow=true;group.add(top);W.box(group,0,p.foundation+1.15,p.d/2+.08,1.3,2.3,.18,doorMat);W.box(group,0,p.foundation+.08,p.d/2+.8,3.6,.2,1.8,trim);W.box(group,p.w*.26,p.h-.2,-p.d*.18,.8,2,.8,trim);continue;
   }
   W.box(group,0,p.foundation/2,0,p.w+1,p.foundation,p.d+1,trim);const tower=p.h-p.foundation;b.body=W.box(group,0,p.foundation+tower/2,0,p.w,tower,p.d,wall);b.body.geometry=W.unitBox.clone();const uv=b.body.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*p.floors/8);W.box(group,0,p.h+.12,0,p.w+1,.35,p.d+1,trim);W.box(group,p.w*.18,p.h+1.3,0,p.w*.34,2.2,p.d*.4,roof);
   const storefront=W.mat(['#334954','#35635c','#794a37','#414b61'][p.id%4]);W.box(group,0,p.foundation+1.5,p.d/2+.1,p.w*.82,2.7,.22,storefront,false);W.box(group,0,p.foundation+3.3,p.d/2+.5,p.w*.9,.2,1.5,trim);
   for(const side of [-1,1]){const crack=new T.Mesh(new T.PlaneGeometry(p.w,tower),crackMat);crack.position.set(0,p.foundation+tower/2,side*(p.d/2+.25));crack.rotation.y=side<0?Math.PI:0;crack.visible=false;group.add(crack);b.cracks.push(crack);}
  }
  W.makeSuburbScenery(scene,{walls:homeWalls,roofs:homeRoofMats,roofGeo,trim});
  W.mapInfo.specs=[W.buildings.length+' buildings & homes','Coastal downtown','Hillside neighborhoods'];
 };
 W.makeSuburbScenery=(scene,materials)=>{
  const plans=W.citySuburbPlans(),far=plans.filter(p=>p.scenery),o=new T.Object3D();W.suburbSceneryCount=far.length;
  // Instancing keeps the many houses beyond the driveable area inexpensive.
  for(let variant=0;variant<6;variant++){const homes=far.filter(p=>p.variant===variant);if(!homes.length)continue;const bodies=new T.InstancedMesh(W.unitBox,materials.walls[variant],homes.length),roofs=new T.InstancedMesh(materials.roofGeo,materials.roofs[variant%3],homes.length),foundations=new T.InstancedMesh(W.unitBox,materials.trim,homes.length);
   homes.forEach((p,i)=>{o.rotation.set(0,p.yaw,0);o.position.set(p.x,p.y+p.foundation+p.floors*1.55,p.z);o.scale.set(p.w,p.floors*3.1,p.d);o.updateMatrix();bodies.setMatrixAt(i,o.matrix);o.position.y=p.y+p.foundation+p.floors*3.1+1.1;o.scale.set(p.w*.78,2.2,p.d*.78);o.updateMatrix();roofs.setMatrixAt(i,o.matrix);o.position.y=p.y+p.foundation/2;o.scale.set(p.w+.25,p.foundation,p.d+.25);o.updateMatrix();foundations.setMatrixAt(i,o.matrix);});bodies.castShadow=roofs.castShadow=true;bodies.receiveShadow=roofs.receiveShadow=foundations.receiveShadow=true;scene.add(bodies,roofs,foundations);
  }
  const yards=[],drives=[],indices=[];function quad(target,p,w,d,offset,lift){const co=Math.cos(p.yaw),si=Math.sin(p.yaw);for(const [a,b]of [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){const x=p.x+co*a+si*(b+offset),z=p.z-si*a+co*(b+offset);target.push(x,suburbGround(x,z)+lift,z);}}
  for(const p of plans){quad(yards,p,p.w+10,p.d+14,-2,.04);quad(drives,p,3.5,12,p.d/2+6,.09);const a=indices.length/6*4;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  for(const [positions,color]of [[yards,'#6e885b'],[drives,'#b4b3a7']]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const mesh=new T.Mesh(g,W.mat(color));mesh.receiveShadow=true;scene.add(mesh);}
  // Land continues far beyond the invisible limit, then disappears into the haze.
  const positions=[],colors=[],triangles=[],c=new T.Color();for(let z=-6000;z<6000;z+=80)for(let x=-6000;x<6000;x+=80){if(x>=-1280&&x+80<=1280&&z>=-1280&&z+80<=1280)continue;const base=positions.length/3;
   for(const [dx,dz]of [[0,0],[80,0],[0,80],[80,80]]){const px=x+dx,pz=z+dz,near=W.nearestRoad(px,pz),raw=W.mapRawHeight(px,pz),height=near.p?W.mix(raw,near.p.y-.15,1-W.smooth(near.p.width/2+2,near.p.width/2+17,near.d)):raw;positions.push(px,height-.2,pz);c.set(height<7?'#b8ad80':'#71805a').multiplyScalar(.84+W.noise(px*.013,pz*.013)*.18).convertSRGBToLinear();colors.push(c.r,c.g,c.b);}triangles.push(base,base+2,base+1,base+1,base+2,base+3);
  }const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(triangles);g.computeVertexNormals();const land=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));land.receiveShadow=true;scene.add(land);
 };
 W.planRamps=()=>{if(W.ramps.length)return W.ramps;const deck=deckHeight();
  for(const u of [-320,320])for(const end of [-1,1]){const p=F(u,end*310),start=F(u,end*380),baseY=W.driveHeight(start.x,start.z,true),r={id:W.ramps.length+1,kind:'ramp',role:'approach',u,end,...p,yaw:(end>0?Math.PI:0)-ANGLE,w:10.5,d:140,rise:deck-baseY-.04,baseY,profile:'smooth',openFrame:true,supportGround:true,deckThickness:.5,supportAlong:[32,96,136]};r.co=Math.cos(r.yaw);r.si=Math.sin(r.yaw);r.y=Math.min(baseY,W.height(p.x,p.z))-3;r.h=deck-r.y+2;W.ramps.push(r);}
  for(const u of [-320,320]){const p=F(u,25),r={id:W.ramps.length+1,kind:'ramp',role:'jump',u,...p,yaw:Math.PI-ANGLE,w:10.5,d:26,rise:3,baseY:deck,openFrame:true,deckThickness:.35,supportAlong:[12,22]};r.co=Math.cos(r.yaw);r.si=Math.sin(r.yaw);r.y=deck-.2;r.h=5;W.ramps.push(r);}return W.ramps;
 };
 W.makeBridge=scene=>{const deck=deckHeight(),concrete=W.mat('#929c9e'),steel=W.mat('#758992',.5,.5),asphalt=W.mat('#626b70'),stripe=W.mat('#e1c586'),rail=W.mat('#d0d4cb');
  for(const u of [-320,320])for(const end of [-1,1]){const v=end*126;cityBox(scene,u,deck-.55,v,12.3,1.1,228,concrete);cityBox(scene,u,deck+.025,v,10.8,.05,228,asphalt);
   for(const side of [-1,1]){const p=F(u+side*5.9,v);cityBox(scene,u+side*5.9,deck+.55,v,.22,1.1,228,rail);W.colliders.push({kind:'barrier',...p,y:deck,yaw:-ANGLE,w:.3,d:228,h:1.2});}
   for(let vv=32;vv<231;vv+=42){for(const side of [-1,1]){const p=F(u+side*4.4,end*vv),y=W.driveHeight(p.x,p.z,true),h=deck-1.1-y;cityBox(scene,u+side*4.4,y+h/2,end*vv,1,h,1,concrete);W.colliders.push({kind:'pier',...p,y,r:.6,h});}cityBox(scene,u,deck-1.3,end*vv,11,.5,.65,steel);}for(let vv=45;vv<230;vv+=16)cityBox(scene,u,deck+.06,end*vv,.18,.025,6,stripe,false);
  }
 };
 W.makeVegetation=scene=>{W.grass=new T.Group();scene.add(W.grass);const positions=[];for(const b of W.cityBlocks){for(const [u,v]of [[15,55],[145,105]]){const p=F(b.u+u,b.v+v);if(W.nearestRoad(p.x,p.z).d>12)positions.push(p);}if(b.park)for(let i=0;i<16;i++)positions.push(F(b.u+32+i%4*32,b.v+32+Math.floor(i/4)*32));}
  for(let i=0;i<700&&positions.length<300;i++){const x=-970+W.noise(i*2.37,.7)*1940,z=-970+W.noise(.3,i*3.17)*1940,p=W.cityLocal(x,z);if(Math.max(Math.abs(p.u),Math.abs(p.v))<745||W.cityShoreDistance(x,z)<60||W.nearestRoad(x,z,2).d<15||W.buildings.some(b=>W.circleOBB(x,z,4,b)))continue;positions.push({x,z});}
  const trunk=new T.InstancedMesh(new T.CylinderGeometry(.28,.38,4,6),W.mat('#6e5d4b'),positions.length),leaves=new T.InstancedMesh(new T.IcosahedronGeometry(2.8,1),W.mat('#42654e'),positions.length),o=new T.Object3D();positions.forEach(({x,z},i)=>{const y=W.driveHeight(x,z,true);o.position.set(x,y+2,z);o.updateMatrix();trunk.setMatrixAt(i,o.matrix);o.position.y=y+4.8;o.scale.set(1,1.2,1);o.updateMatrix();leaves.setMatrixAt(i,o.matrix);o.scale.set(1,1,1);W.colliders.push(W.registerTree?W.registerTree({kind:'tree',x,z,y,r:.35,h:7},[{mesh:trunk,index:i},{mesh:leaves,index:i}]):{kind:'tree',x,z,y,r:.35,h:7});});trunk.castShadow=leaves.castShadow=true;scene.add(trunk,leaves);
 };
 W.makeRoadDetails=scene=>{const white=W.mat('#e0dfcf'),yellow=W.mat('#ddbb65'),pole=W.mat('#4b5b60',.5,.5),lamp=W.mat('#e4e6ce'),signal=W.mat('#285346'),group=new T.Group();scene.add(group);
  const sidewalk=W.mat('#bebdb0');for(const road of W.roads){if(road.residential){for(const side of [-1,1]){W.makeRoadStrip(group,road.samples,1.6,sidewalk,side*(road.width/2+1),.21);W.makeRoadStrip(group,road.samples,.12,white,side*(road.width/2-.4),.17);}continue;}for(let i=1;i<road.samples.length-4;i+=4){const samples=road.samples.slice(i,i+5),p=samples[2];if(W.cityJunctions.some(j=>Math.hypot(p.x-j.x,p.z-j.z)<20))continue;for(const side of [-1,1]){W.makeRoadStrip(group,samples,.13,yellow,side*.22,.17);W.makeRoadStrip(group,samples,.13,white,side*(road.width/2-.5),.17);if(road.width>18)W.makeRoadStrip(group,samples.slice(0,3),.12,white,side*5.5,.17);}}}
  for(const j of W.cityJunctions){for(const side of [-1,1])for(let k=-4;k<=4;k++){for(const [u,v,w,d]of [[j.u+k*1.8,j.v+side*15,1,3.5],[j.u+side*15,j.v+k*1.8,3.5,1]]){const p=F(u,v);cityBox(group,u,W.height(p.x,p.z)+.31,v,w,.025,d,white,false);}}
   for(const side of [-1,1]){const u=j.u+side*13,v=j.v+side*13,p=F(u,v),y=W.driveHeight(p.x,p.z,true);cityBox(group,u,y+4,v,.18,8,.18,pole,false);cityBox(group,u-side*2.5,y+8,v,5,.16,.16,pole,false);cityBox(group,u-side*4.5,y+7.85,v,1.5,.13,.7,lamp,false);cityBox(group,u,y+4.5,v,.55,1.3,.45,signal,false);}
  }
  for(const b of W.cityBlocks.filter(b=>b.park)){const u=b.u+80,v=b.v+80,p=F(u,v),y=W.height(p.x,p.z)+.4;cityBox(group,u,y,v,24,.65,24,W.mat('#89999e'));cityBox(group,u,y+.35,v,21,.06,21,W.mat('#548e96',.18,.4));}
  // The land limit has no wall, fence, sign, or visible collision geometry.
  W.cityBorderSegments=[];
 };
 W.enforceMapBoundary=c=>{const size=W.getCarSpec?.()?.size??1,pad=2.6*size;for(const axis of ['x','z'])for(const sign of [-1,1]){const bound=sign*(1000-pad),crossed=sign*c[axis]>sign*bound;if(!crossed)continue;const x=axis==='x'?sign*1000:W.clamp(c.x,-1000,1000),z=axis==='z'?sign*1000:W.clamp(c.z,-1000,1000);if(W.cityShoreDistance(x,z)<0)continue;const velocity=axis==='x'?'vx':'vz';c[axis]=bound;if(c[velocity]*sign>0)c[velocity]=0;}};
 const stepVehicle=W.stepVehicle;W.stepVehicle=(dt,input,time)=>{stepVehicle(dt,input,time);W.enforceMapBoundary(W.vehicle);};
 W.initCityTraffic=(route,place)=>{
  const rectangles=[[-480,-320,160,480],[-480,-320,480,320],[-160,-480,160,-160],[-960,-160,-800,0],[640,160,800,480],[-480,320,160,640],[-320,640,0,800],[-480,-160,160,160],[-160,-160,480,160]],suburban=new Set([3,4,6]),colors=['#d4d8cc','#306375','#b7a261','#2f454d','#9f443b','#56746b','#bfc7cb','#dfb543'];W.trafficRoutes=[];W.traffic=[];
  for(const [ri,[u0,v0,u1,v1]]of rectangles.entries()){const corners=[],radius=suburban.has(ri)?5.5:9;for(const [u,v,start]of [[u0+radius,v0+radius,Math.PI],[u1-radius,v0+radius,Math.PI*1.5],[u1-radius,v1-radius,0],[u0+radius,v1-radius,Math.PI*.5]])for(let i=0;i<=6;i++){const a=start+i*Math.PI/12;corners.push({u:u+Math.cos(a)*radius,v:v+Math.sin(a)*radius});}
   const points=[];for(let i=0;i<corners.length;i++){const a=corners[i],b=corners[(i+1)%corners.length],steps=Math.ceil(Math.hypot(a.u-b.u,a.v-b.v)/6);for(let j=0;j<steps;j++)points.push(F(W.mix(a.u,b.u,j/steps),W.mix(a.v,b.v,j/steps)));}const r=route(points);W.trafficRoutes.push(r);
   r.suburban=suburban.has(ri);for(let i=0;i<8;i++){const cruise=r.suburban?8+(i%3)*1.2:10+(i%4)*2,t={id:W.traffic.length,route:r,distance:(i+.37)*r.length/8,direction:i%2?1:-1,cruise,speed:cruise,lane:2.35,offsetX:0,offsetZ:0,driftX:0,driftZ:0,stun:0,w:1.9,d:4.4,color:colors[(ri+i)%8]};W.traffic.push(t);place(t);}
  }
 };
 const makeWorld=W.makeWorld;W.makeWorld=(scene,renderer)=>{makeWorld(scene,renderer);scene.fog.density=.00075;};
})();
