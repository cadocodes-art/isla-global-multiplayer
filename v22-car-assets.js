/* V2.2 procedural car artwork. Load after cars-v20.js, before game.js.
 * All additions use the car's own paint material and disposable geometries.
 * The animation hook creates no meshes, geometries, textures or materials.
 */
(()=>{
 'use strict';
 const W=Isla,T=THREE,make=W.makeCar,preview=W.carPreview,oldVisual=W.updateCarSpecialVisual;
 const levelOf=m=>Math.max(1,Math.min(3,Math.round(Number(m?.upgradeLevel??m?.level)||1)));
 const safeColor=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'#c4cbe6';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function addMesh(parent,geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function box(g,x,y,z,w,h,d,m){return W.box(g,x,y,z,w,h,d,m);}
 function tube(g,x,y,z,r,length,m,axis='z'){
  const mesh=addMesh(g,new T.CylinderGeometry(r,r,length,12),m,x,y,z);
  if(axis==='z')mesh.rotation.x=Math.PI/2;else if(axis==='x')mesh.rotation.z=Math.PI/2;
  return mesh;
 }
 function ring(g,x,y,z,r,m,axis='z',thickness=.035){const mesh=addMesh(g,new T.TorusGeometry(r,thickness,5,16),m,x,y,z);if(axis==='x')mesh.rotation.y=Math.PI/2;if(axis==='y')mesh.rotation.x=Math.PI/2;return mesh;}
 function fin(g,x,y,z,w,h,d,mat,side=1){
  const geo=new T.BufferGeometry(),p=[-.5*w,0,-.5*d,.5*w,0,-.5*d,side*.4*w,h,-.25*d,-.5*w,0,.5*d,.5*w,0,.5*d,side*.4*w,h,-.25*d];
  geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);geo.computeVertexNormals();return addMesh(g,geo,mat,x,y,z);
 }
 function wing(g,mat,y=1.5,width=2.35,z=-1.95){for(const s of [-1,1])box(g,s*.7,y-.25,z,.08,.5,.12,mat);return box(g,0,y,z,width,.09,.48,mat);}
 function makeFeathers(level){
  const positions=[],colors=[],indices=[],white=new T.Color('#f5f1df').convertSRGBToLinear(),shade=new T.Color('#b9c5d5').convertSRGBToLinear(),gold=new T.Color(level===3?'#f2c464':'#ddd4a9').convertSRGBToLinear();
  function feather(ax,ay,az,tx,ty,tz,width,index){
   const dx=tx-ax,dz=tz-az,len=Math.hypot(dx,dz),nx=-dz/len*width,nz=dx/len*width,base=positions.length/3;
   // A raised quill gives each feather a readable, rounded spine.
   const points=[[ax,ay,az],[ax+dx*.40+nx,ay+(ty-ay)*.4,az+dz*.4+nz],[ax+dx*.55,ay+(ty-ay)*.55+.075,az+dz*.55],[ax+dx*.40-nx,ay+(ty-ay)*.4,az+dz*.4-nz],[tx,ty,tz]];
   points.forEach((p,j)=>{positions.push(...p);const c=j===4&&level>1?gold:j===3?shade:white;const light=.94+(index%3)*.025;colors.push(c.r*light,c.g*light,c.b*light);});
   indices.push(base,base+1,base+2,base,base+2,base+3,base+1,base+4,base+2,base+2,base+4,base+3);
  }
  for(let i=0;i<13;i++){const q=i/12,ax=.10+q*2.45,az=.38-q*.45;feather(ax,.08+Math.sin(q*Math.PI)*.22,az,ax+.48+q*.36,.04+q*.22,az-1.05-q*.72,.20,i);}
  for(let i=0;i<9;i++){const q=i/8,ax=.08+q*2.12;feather(ax,.19+Math.sin(q*Math.PI)*.22,.48-q*.35,ax+.55,.18+q*.2,-.30-q*.45,.23,i+13);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
 }
 function angel(car,level,materials){
  const data=car.v22,geometry=makeFeathers(level),featherMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.67,metalness:.06,side:T.DoubleSide});data.wings=[];
  for(const side of [-1,1]){
   const pivot=new T.Group();pivot.name='angel-wing-'+(side<0?'left':'right');pivot.position.set(side*.91,1.14,-.30);pivot.rotation.z=side*.40;car.body.add(pivot);
   const feathers=addMesh(pivot,geometry,featherMat);feathers.scale.x=side;
   const shoulder=addMesh(pivot,new T.SphereGeometry(.21,10,7),materials.accent);shoulder.scale.set(.7,1,1.2);
   data.wings.push({pivot,side});
  }
  box(car.body,0,1.27,-.42,.5,.14,.85,car.paint);
  if(level>=2){for(const side of [-1,1]){fin(car.body,side*.72,1.1,-1.65,.13,.5,.72,materials.accent,side);box(car.body,side*.78,.5,.55,.08,.08,1.7,materials.accent);}}
  if(level===3){const halo=ring(car.body,0,1.9,-.45,.42,materials.accent,'y',.045);halo.name='angel-halo';data.halo=halo;for(const side of [-1,1])fin(car.body,side*.55,.86,-2.0,.16,.4,.7,materials.white,side);}
 }
 function cannon(parent,x,y,z,scale,angle,m){
  const yaw=new T.Group();yaw.position.set(x,y,z);yaw.rotation.y=angle;parent.add(yaw);
  const barrel=new T.Group();barrel.name='forward-cannon';barrel.scale.setScalar(scale);yaw.add(barrel);
  tube(barrel,0,0,.67,.24,1.8,m.dark);for(const dz of [.0,.65,1.36])ring(barrel,0,0,dz,.25,m.accent);
  tube(barrel,0,0,1.59,.17,.04,m.black);ring(barrel,0,0,1.62,.205,m.metal,'z',.045);
  box(barrel,0,-.14,.08,.48,.22,.65,m.paint);return {yaw,barrel,rest:angle};
 }
 function nuker(car,level,m){
  const turret=new T.Group();turret.name='v22-nuke-turret';turret.position.set(0,1.55,-.55);car.body.add(turret);car.v22.turret=turret;
  tube(car.body,0,1.28,-.55,.45,.2,m.metal,'y');box(turret,0,-.05,-.12,.72,.38,.85,m.paint);
  car.v22.cannons=[cannon(turret,0,.15,.05,1,0,m)];
  if(level>=2)for(const side of [-1,1])car.v22.cannons.push(cannon(turret,side*.68,.02,-.05,.69,side*.48,m));
  if(level===3){const radar=new T.Group();radar.position.set(0,.62,-.55);turret.add(radar);tube(radar,0,.05,0,.06,.35,m.metal,'y');const dish=addMesh(radar,new T.SphereGeometry(.23,10,6,0,Math.PI*2,0,Math.PI/2),m.accent,0,.25,0);dish.rotation.x=.65;car.v22.radar=radar;box(turret,0,.17,-.58,.4,.14,.12,m.light);}
 }
 function upgrades(car,model,level,m){
  if(level<2)return;
  const g=car.body,L=level===3,n=L?3:2,id=model.id;
  // Painted add-ons deliberately share car.paint so repainting is immediate.
  for(const side of [-1,1]){box(g,side*1.025,.48,-.04,.065,.055,2.45,m.accent);for(let i=0;i<level;i++)box(g,side*1.015,.82,-1.1+i*.15,.027,.13,.07,m.accent);}
  if(['classic','gt','solstice','moonlight','vespera'].includes(id)){
   const tall=id==='solstice'?1.68:id==='vespera'?1.31:1.72;
   wing(g,m.paint,tall+(L?.15:0),L?2.55:2.28);
   for(const side of [-1,1]){const lip=box(g,side*.84,.42,1.97,.45,.075,.43,m.accent);lip.rotation.y=-side*.24;if(L)fin(g,side*.94,.42,1.65,.10,.28,.6,m.dark,side);}
   if(id==='classic'){box(g,0,.99,1.37,.62,.14,.55,m.dark);for(const s of [-1,1])box(g,s*.18,1.04,1.67,.20,.06,.04,m.accent);}
   if(id==='gt')for(const s of [-1,1])box(g,s*.40,.83,1.7,.13,.04,.5,m.white);
   if(id==='solstice'&&L){fin(g,0,1.24,-.8,.08,.44,1.7,m.accent);for(const s of [-1,1])box(g,s*.83,.75,-.75,.26,.1,.8,m.dark);}
   if(id==='moonlight'){ring(g,0,1.33,-1.77,.22,m.accent);if(L)for(const s of [-1,1])fin(g,s*.81,1.07,-1.68,.14,.43,.63,m.metal,s);}
   if(id==='vespera'){for(const s of [-1,1]){box(g,s*.67,.87,-1.63,.4,.05,.45,m.accent);if(L)fin(g,s*.65,1.08,-1.75,.10,.34,.6,m.paint,s);}}
  }else if(id==='rally'){
   for(const side of [-1,1]){box(g,side*.73,1.88,-.1,.06,.07,1.72,m.metal);box(g,side*1.0,.25,-1.76,.38,.35,.06,m.dark);}
   for(const x of [-.48,-.16,.16,.48])box(g,x,1.89,.70,.23,.16,.12,m.light);
   box(g,0,.45,2.40,1.95,.16,.18,m.metal);
   if(L){tube(g,.96,1.44,.63,.07,1.18,m.dark,'y');box(g,.96,2.07,.60,.22,.15,.34,m.dark);const spare=tube(g,0,1.99,-.35,.37,.19,m.dark,'y');ring(g,0,2.09,-.35,.20,m.accent,'y');car.v22.spare=spare;}
  }else if(id==='truck'||id==='beast'){
   const heavy=id==='beast',width=heavy?2.45:2.16;
   box(g,0,.70,2.46,width,.22,.25,m.metal);for(const side of [-1,1])box(g,side*.76,.91,2.46,.11,.62,.12,m.metal);
   for(const side of [-1,1]){tube(g,side*.75,1.6,-.65,.07,.95,m.metal,'y');box(g,side*1.03,.76,-1.2,.12,.37,1.24,m.paint);}
   box(g,0,2.04,-.65,1.64,.12,.12,m.metal);
   if(heavy){box(g,0,.76,2.65,2.3,.46,.22,m.paint);for(let x=-.8;x<=.81;x+=.4)box(g,x,.79,2.78,.12,.48,.06,m.accent);if(L)for(const side of [-1,1])fin(g,side*1.12,.56,2.6,.22,.6,.8,m.metal,side);}
   else if(L){tube(g,0,.66,2.65,.14,.75,m.dark,'x');for(const s of [-1,1])ring(g,s*.55,.45,2.62,.13,m.accent);}
  }else if(id==='plane'){
   car.v22.airbrakes=[];for(const side of [-1,1]){
    fin(g,side*3.63,.91,-.9,.12,L?.95:.62,.7,m.accent,side);
    const brake=new T.Group();brake.position.set(side*2.35,.89,-.85);g.add(brake);box(brake,0,0,-.28,.8,.055,.55,m.paint);car.v22.airbrakes.push(brake);
    if(L){tube(g,side*1.65,.61,-.5,.15,.9,m.metal);fin(g,side*.6,1.1,-1.85,.10,.65,.7,m.paint,side);}
   }
  }else if(id==='firetruck'){
   const mount=new T.Group();mount.position.set(0,2.17,.12);g.add(mount);tube(mount,0,0,0,.21,.18,m.metal,'y');car.v22.hoseTurret=mount;
   for(const s of L?[-1,1]:[0]){const nozzle=tube(mount,s*.22,.18,.36,.09,.9,m.metal);nozzle.rotation.x=Math.PI/2-.13;ring(mount,s*.22,.24,.80,.10,m.accent);}
   if(L){box(g,0,1.68,-1.23,1.16,.32,1.13,m.paint);box(g,0,1.87,-1.23,1.17,.06,.90,m.accent);}
  }else if(id==='stick'){
   const gel=new T.MeshStandardMaterial({color:'#83e63a',roughness:.2,metalness:.15,emissive:'#386d0c',emissiveIntensity:.28});
   for(const wheel of car.wheels)ring(wheel.spin,wheel.side*.17,0,0,L?.40:.37,gel,'x',L?.055:.035);
   for(const side of [-1,1]){tube(g,side*.65,1.01,-1.4,.13,.75,gel);if(L)fin(g,side*.77,1.1,-1.72,.11,.4,.6,m.accent,side);}
   if(L){box(g,0,1.29,-.3,.75,.13,.65,m.paint);ring(g,0,1.37,-.3,.23,gel,'y');}
  }else if(id==='waterskidder'){
   for(const side of [-1,1]){tube(g,side*.62,.53,-2.2,.16,.63,m.metal);ring(g,side*.62,.53,-2.53,.17,m.accent);fin(g,side*.94,.41,-1.45,.1,.37,1.05,m.paint,side);if(L){box(g,side*1.15,.66,-.1,.24,.30,2.5,m.paint);box(g,side*1.15,.84,-.15,.26,.055,2.3,m.accent);}}
   box(g,0,1.40,-1.25,1.38,.12,.21,m.accent);
  }else if(id==='micro'){
   wing(g,m.paint,L?1.7:1.5,L?2.35:2.1);tube(g,.7,1.67,-.65,.028,.8,m.dark,'y');addMesh(g,new T.SphereGeometry(.10,8,5),m.accent,.7,2.1,-.65);
   if(L)for(const side of [-1,1]){box(g,side*1.09,.6,-.1,.19,.25,1.35,m.paint);box(g,side*1.1,.75,-.3,.2,.035,.7,m.accent);}
  }else if(id==='cruiser'){
   for(const s of [-1,1])box(g,s*.53,1.76,-.1,.06,.12,1.45,m.metal);
   box(g,0,1.88,-.15,1.10,.22,1.30,m.paint);box(g,0,2.0,-.15,1.12,.05,1.32,m.accent);
   if(L){for(const side of [-1,1])box(g,side*.99,.76,.4,.04,.08,2.6,m.white);box(g,0,.95,1.37,.55,.10,.5,m.accent);}
  }else if(id==='launcher'){
   for(const side of [-1,1]){box(g,side*1.48,.73,2.83,.14,.76,1.2,m.paint);tube(g,side*1.19,.73,1.82,.1,1.15,m.metal);if(L){fin(g,side*1.53,.22,3.1,.13,.72,1.1,m.accent,side);box(g,side*1.39,.28,3.45,.18,.13,.85,m.metal);}}
   box(g,0,1.8,2.03,L?3.05:2.86,.10,.13,m.accent);
  }else if(id==='ultra'){
   for(const side of [-1,1]){for(const z of [-1.92,1.08])ring(g,side*1.55,1.0,z,L?.64:.61,m.accent);fin(g,side*1.86,1.0,-1.65,.09,L?.9:.55,1.18,m.paint,side);if(L)fin(g,side*1.54,.50,-1.68,.08,.62,1.12,m.metal,side);}
  }else if(id==='hover'){
   car.v22.extraRotors=[];for(const side of [-1,1]){fin(g,side*1.08,.64,-1.25,.12,.42,.85,m.accent,side);if(L)for(const z of [-.5,.5]){const rotor=new T.Group();rotor.position.set(side*1.28,.43,z);g.add(rotor);tube(rotor,0,0,0,.09,.16,m.dark,'y');for(let i=0;i<3;i++){const a=i*Math.PI*2/3,blade=box(rotor,Math.cos(a)*.16,0,-Math.sin(a)*.16,.34,.025,.07,m.accent);blade.rotation.y=a;}car.v22.extraRotors.push(rotor);}}
  }
  // Nuker and Flappy carry their own distinctive level accessories above.
  car.v22.level=n;
 }
 W.makeCar=(model=W.getCarSpec?.(),remote=false)=>{
  const actual=model||{id:'classic',style:'classic',color:'#9a3227'},level=levelOf(actual);
  // Replace the old rear launcher, including in remote-player cars.
  const baseModel=actual.id==='nuker'?{...actual,weapon:null}:actual.id==='flappy'?{...actual,glider:false}:actual;
  const car=make(baseModel,remote);car.model=actual;car.v22={level,time:0,flapAge:99,lastFlapAt:null,lastFlapSerial:null};
  const accent=W.mat(level===3?'#f4cf82':'#b7b4f2',.30,.68),metal=W.mat('#aab8ca',.28,.82),dark=W.mat('#253246',.5,.6),black=W.mat('#101923'),white=W.mat('#ecefe8',.6);
  const light=new T.MeshStandardMaterial({color:'#c6f4ff',emissive:'#87d7ff',emissiveIntensity:.55});
  const m={accent,metal,dark,black,white,light,paint:car.paint};
  if(actual.id==='flappy')angel(car,level,m);
  if(actual.id==='nuker')nuker(car,level,m);
  upgrades(car,actual,level,m);
  // Discard unused materials; callers already dispose materials on removed meshes.
  const used=new Set();car.root.traverse(o=>{if(Array.isArray(o.material))o.material.forEach(v=>used.add(v));else if(o.material)used.add(o.material);});
  for(const material of [accent,metal,dark,black,white,light])if(!used.has(material))material.dispose();
  return car;
 };
 function animate(car,dt,time,state){
  const d=car?.v22;if(!d)return;const c=state||{},step=clamp(Number(dt)||0,0,.1),t=Number(time)||0;
  d.time=t;
  if(d.wings){
   if(Number.isFinite(c.flapAt)&&c.flapAt!==d.lastFlapAt){d.lastFlapAt=c.flapAt;d.flapAge=0;}
   if(Number.isFinite(c.flapSerial)&&c.flapSerial!==d.lastFlapSerial){if(d.lastFlapSerial!==null)d.flapAge=0;d.lastFlapSerial=c.flapSerial;}
   d.flapAge+=step;const pulse=Number(c.flapPulse)||0,age=pulse>0?Math.max(0,.42-pulse):d.flapAge;
   const stroke=age<.48?Math.sin(age/.48*Math.PI*2)*.78:0,air=c.grounded===false,base=air?.12:.50;
   for(const w of d.wings){const target=w.side*(base+stroke+Math.sin(t*2.4)*.025);w.pivot.rotation.z+=(target-w.pivot.rotation.z)*(1-Math.exp(-step*24));}
   if(d.halo){d.halo.position.y=1.9+Math.sin(t*2)*.035;d.halo.rotation.z=Math.sin(t*.8)*.06;}
  }
  if(d.turret){const aimYaw=Number.isFinite(c.nukeAimYaw)?c.nukeAimYaw:car.v22AimYaw;let aim=Number.isFinite(aimYaw)?aimYaw-(c.yaw||0):Number(c.nukeAim)||0;aim=Math.atan2(Math.sin(aim),Math.cos(aim));const target=d.level===3?clamp(aim,-1.12,1.12):0;d.turret.rotation.y+=(target-d.turret.rotation.y)*(1-Math.exp(-step*9));if(d.radar)d.radar.rotation.y=t*.7;const recoil=clamp(Number(c.nukePulse)||0,0,1)*.12;for(const gun of d.cannons)gun.barrel.position.z=-recoil;}
  for(const brake of d.airbrakes||[]){const target=c.brake||c.handbrake?-.72:0;brake.rotation.x+=(target-brake.rotation.x)*(1-Math.exp(-step*7));}
  if(d.hoseTurret)d.hoseTurret.rotation.y=clamp(Number(c.hoseAim)||0,-1.1,1.1);
  for(const rotor of d.extraRotors||[])rotor.rotation.y+=step*(35+Math.min(80,Math.hypot(c.vx||0,c.vz||0)*3));
 }
 W.updateCarSpecialVisual=(car,c,dt,time)=>{oldVisual?.(car,c,dt,time);animate(car,dt,time,c);};
 function svgDetails(model,level){
  const id=model.id,paint=safeColor(model.color),a=level===3?'#f4cf82':'#b7b4f2',L=level===3;let out='';
  if(id==='flappy'){
   out+=`<path d="M150 66 Q119 13 40 6 Q51 36 93 57 L66 39 L76 64 L106 73 L82 58 L97 79 L139 84Z" fill="#f4f1e3" stroke="#adb9ca" stroke-width="2"/><path d="M166 65 Q199 11 278 6 Q267 39 224 58 L251 39 L240 66 L209 74 L233 58 L215 80 L174 85Z" fill="#fffaf0" stroke="#adb9ca" stroke-width="2"/><path d="M149 65 Q109 30 65 18 M166 65 Q207 30 253 18" fill="none" stroke="${level>1?a:'#d5dce3'}" stroke-width="3"/>`;
   if(L)out+='<ellipse cx="160" cy="13" rx="24" ry="6" fill="none" stroke="#f4cf82" stroke-width="4"/>';
  }else if(id==='nuker'){
   out+='<path d="M145 53 V39 H185 V53" fill="'+paint+'"/><path d="M163 37 H267 V48 H163Z" fill="#273444" stroke="#acb9c8" stroke-width="2"/><ellipse cx="269" cy="42.5" rx="4" ry="6" fill="#121d27"/>';
   if(level>1)out+='<path d="M151 49 L244 22 L247 30 L158 57Z M158 56 L253 62 L252 70 L151 62Z" fill="#46546a" stroke="'+a+'" stroke-width="2"/>';
   if(L)out+='<path d="M169 38 V25" stroke="#a7b9c8" stroke-width="3"/><path d="M154 17 Q169 36 184 17" fill="#f4cf82"/>';
  }
  if(level<2)return out;
  out+=`<path d="M104 90 H219" stroke="${a}" stroke-width="3"/><g fill="${a}">${Array.from({length:level},(_,i)=>`<rect x="${108+i*8}" y="72" width="4" height="7" transform="rotate(-18 ${110+i*8} 75)"/>`).join('')}</g>`;
  if(['classic','gt','solstice','moonlight','vespera','micro'].includes(id))out+=`<path d="M30 62 V${L?41:48} M62 60 V${L?41:48} M14 ${L?40:47} H78" stroke="${a}" stroke-width="${L?6:4}"/><path d="M273 83 L308 85 L301 91 H271" fill="${a}"/>`;
  if(id==='moonlight')out+=`<circle cx="55" cy="49" r="10" fill="none" stroke="${a}" stroke-width="3"/>`;
  if(id==='rally')out+=`<path d="M109 17 H195" stroke="${a}" stroke-width="4"/><g fill="#e6f8ff"><rect x="126" y="7" width="12" height="9"/><rect x="144" y="7" width="12" height="9"/><rect x="162" y="7" width="12" height="9"/></g>${L?'<path d="M213 50 V13 H202" fill="none" stroke="#304455" stroke-width="5"/>':''}`;
  if(id==='truck'||id==='beast')out+=`<path d="M291 62 V91 H310 V61" fill="none" stroke="${a}" stroke-width="${L?7:5}"/><path d="M47 41 V22 H99 V41" fill="none" stroke="#aebbc8" stroke-width="4"/>`;
  if(id==='plane')out+=`<path d="M129 71 L155 44 L183 58 L155 77Z" fill="${paint}" stroke="${a}" stroke-width="3"/>${L?'<path d="M71 64 L78 27 H95 L99 64Z" fill="'+a+'"/>':''}`;
  if(id==='firetruck')out+=`<path d="M133 28 V15 H190" fill="none" stroke="#b4c6d7" stroke-width="7"/><path d="M182 11 H200 V19 H182" fill="${a}"/>${L?'<path d="M135 15 L186 4" stroke="#b4c6d7" stroke-width="6"/>':''}`;
  if(id==='stick')out+=`<circle cx="77" cy="86" r="19" fill="none" stroke="#8af137" stroke-width="${L?5:3}"/><circle cx="245" cy="86" r="19" fill="none" stroke="#8af137" stroke-width="${L?5:3}"/><rect x="109" y="56" width="23" height="10" rx="4" fill="#8af137"/>`;
  if(id==='waterskidder')out+=`<path d="M28 85 H283" stroke="${a}" stroke-width="${L?7:4}"/><path d="M38 58 L24 72 L31 80" fill="none" stroke="#aac0cc" stroke-width="4"/>`;
  if(id==='cruiser')out+=`<rect x="123" y="${L?7:11}" width="62" height="13" rx="4" fill="${paint}" stroke="${a}" stroke-width="3"/>`;
  if(id==='launcher')out+=`<path d="M280 51 L310 94 L289 98" fill="none" stroke="${a}" stroke-width="${L?7:4}"/>${L?'<path d="M291 94 H318" stroke="#d7e1e7" stroke-width="6"/>':''}`;
  if(id==='ultra')out+=`<path d="M37 57 L29 ${L?20:34} L67 57 M37 76 L29 99 L67 76" fill="${paint}" stroke="${a}" stroke-width="2"/><path d="M55 58 V74 M220 58 V74" stroke="${a}" stroke-width="5"/>`;
  if(id==='hover')out+=`<path d="M65 73 L47 49 L95 73" fill="${a}"/>${L?'<path d="M123 91 H163 M133 85 L153 97" stroke="#81efed" stroke-width="4"/>':''}`;
  out+=`<g aria-hidden="true"><rect x="8" y="8" width="42" height="17" rx="5" fill="#3d305e"/><text x="29" y="20" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="${a}">LV ${level}</text></g>`;
  return out;
 }
 W.carPreview=model=>{
  const level=levelOf(model),baseModel=model.id==='nuker'?{...model,weapon:null}:model.id==='flappy'?{...model,glider:false}:model;
  let svg=preview(baseModel),details=svgDetails(model,level);
  // Wings are behind the chassis; all other equipment is drawn on top.
  if(model.id==='flappy'){const start=svg.indexOf('>')+1;svg=svg.slice(0,start)+details+svg.slice(start);}
  else svg=svg.replace('</svg>',details+'</svg>');
  return svg;
 };
 W.v22CarAssets=Object.freeze({animate,levelOf});
})();
