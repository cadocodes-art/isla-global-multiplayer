/* V2.4 procedural vehicle artwork. Load after v22-car-assets.js.
 * All instances (player, second local driver and network cars) use this factory.
 * car.v24 exposes visual-only controls; no movement or ability rules live here.
 */
(()=>{
 'use strict';
 const W=Isla,T=THREE,make=W.makeCar,preview=W.carPreview,previousVisual=W.updateCarSpecialVisual;
 const ids=new Set(['inferno','grappler','f1']),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const levelOf=m=>clamp(Math.round(Number(m?.upgradeLevel??m?.level)||1),1,3);
 const safeColor=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
 const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function mesh(group,geometry,material,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 const box=(g,x,y,z,w,h,d,m)=>W.box(g,x,y,z,w,h,d,m);
 function tube(g,a,b,r,m){const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.sub(from),o=mesh(g,new T.CylinderGeometry(r,r,delta.length(),8),m);o.position.copy(from).addScaledVector(delta,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
 function ring(g,x,y,z,r,thickness,m,axis='z'){const o=mesh(g,new T.TorusGeometry(r,thickness,5,16),m,x,y,z);if(axis==='x')o.rotation.y=Math.PI/2;if(axis==='y')o.rotation.x=Math.PI/2;return o;}
 function shell(g,rings,material){
  const positions=[],uv=[],indices=[];
  rings.forEach(([z,w,bottom,top],i)=>{positions.push(-w,bottom,z,w,bottom,z,w,top-.07,z,w*.83,top,z,-w*.83,top,z,-w,top-.07,z);for(let j=0;j<6;j++)uv.push(j/5,i/(rings.length-1)*2);});
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<6;j++){const a=i*6+j,b=i*6+(j+1)%6;indices.push(a,b,a+6,b,b+6,a+6);}
  indices.push(0,2,1,0,4,2,0,5,4);const n=(rings.length-1)*6;indices.push(n,n+1,n+2,n,n+2,n+4,n,n+4,n+5);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return mesh(g,geo,material);
 }
 // One draw per material for static artwork, with dynamic parts kept separate.
 function batch(group){
  const batches=new Map(),disposed=new Set();
  for(const part of [...group.children]){
   if(!part.isMesh||part.isInstancedMesh||part.userData.v24Dynamic||Array.isArray(part.material))continue;
   const b=batches.get(part.material)||{positions:[],normals:[],uv:[],indices:[]};batches.set(part.material,b);part.updateMatrix();
   const geo=part.geometry,p=geo.attributes.position,n=geo.attributes.normal,u=geo.attributes.uv,start=b.positions.length/3,normal=new T.Matrix3().getNormalMatrix(part.matrix),v=new T.Vector3();
   for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(part.matrix);b.positions.push(v.x,v.y,v.z);if(n)v.fromBufferAttribute(n,i).applyMatrix3(normal).normalize();else v.set(0,1,0);b.normals.push(v.x,v.y,v.z);b.uv.push(u?u.getX(i):0,u?u.getY(i):0);}
   if(geo.index)for(let i=0;i<geo.index.count;i++)b.indices.push(start+geo.index.getX(i));else for(let i=0;i<p.count;i++)b.indices.push(start+i);
   group.remove(part);if(geo!==W.unitBox)disposed.add(geo);
  }
  disposed.forEach(g=>g.dispose());
  for(const [material,b]of batches){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));geo.setIndex(b.indices);mesh(group,geo,material);}
 }
 function materials(car,level){return {paint:car.paint,tail:car.tail,dark:W.mat('#101820',.65,.35),metal:W.mat('#9bb1be',.32,.78),accent:W.mat(level===3?'#ffce6b':'#b4f6ed',.32,.65),glass:W.mat('#132e3b',.12,.6),light:new T.MeshStandardMaterial({color:'#e6fff6',emissive:'#a2ffec',emissiveIntensity:1.05})};}
 function levelMarks(g,level,m){for(const s of [-1,1])for(let i=0;i<level;i++)box(g,s*.81,.71,-.7+i*.17,.025,.12,.055,m.accent);}
 function suppressBody(car){
  // Leave the factory's live exhaust group and light in place. The wheels,
  // contact shadow and complete air-trick rig remain the original objects.
  for(const child of car.body.children)if(child!==car.nitro.group&&child!==car.nitro.light)child.visible=false;
 }
 function lavaTexture(){
  const size=128,data=new Uint8Array(size*size*4),sites=[];let seed=24061;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<6;y++)for(let x=0;x<6;x++)sites.push([(x+.18+rand()*.64)/6,(y+.18+rand()*.64)/6]);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   let first=9,second=9;for(const p of sites){const dx=Math.min(Math.abs(x/size-p[0]),1-Math.abs(x/size-p[0])),dy=Math.min(Math.abs(y/size-p[1]),1-Math.abs(y/size-p[1])),d=dx*dx+dy*dy;if(d<first){second=first;first=d;}else if(d<second)second=d;}
   const edge=clamp(1-(Math.sqrt(second)-Math.sqrt(first))/.014,0,1),core=edge*edge,i=(y*size+x)*4;data[i]=Math.round(edge*255);data[i+1]=Math.round(core*180);data[i+2]=Math.round(core*55);data[i+3]=255;
  }
  const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=texture.minFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
 }
 function inferno(car,g,m,level){
  const d=car.v24;m.paint.roughness=.6;m.paint.metalness=.34;m.paint.emissive.set('#ff8d37');m.paint.emissiveMap=lavaTexture();m.paint.emissiveIntensity=2.2;m.paint.needsUpdate=true;d.heatMaterial=m.paint;
  shell(g,[[-2.28,.80,.35,.68],[-1.55,1.02,.31,.93],[-.55,.94,.32,.85],[.65,.94,.32,.73],[1.8,.9,.35,.60],[2.34,.68,.39,.45]],m.paint);
  shell(g,[[-1.12,.63,.79,.86],[-.52,.59,.81,1.17],[.22,.57,.75,1.14],[.96,.67,.68,.75]],m.glass);
  box(g,0,1.16,-.18,.9,.045,.66,m.dark);box(g,0,.31,2.13,1.95,.09,.52,m.dark);box(g,0,.35,-2.22,1.92,.15,.35,m.dark);
  for(const s of [-1,1]){
   box(g,s*.96,.33,-.1,.11,.09,3.36,m.dark);box(g,s*.94,.66,-.74,.08,.28,.69,m.dark);
   const lamp=box(g,s*.64,.59,1.96,.48,.035,.06,m.light);lamp.rotation.y=s*.27;box(g,s*.64,.70,-2.26,.49,.055,.045,m.tail);
   tube(g,[s*.52,.45,-2.12],[s*.52,.45,-2.40],.11,m.metal);box(g,s*.68,.96,-1.88,.07,.37,.11,m.dark);
   if(level>1){const blade=box(g,s*.97,.46,1.70,.3,.055,.57,m.accent);blade.rotation.y=-s*.28;}
  }
  box(g,0,1.17+(level-1)*.08,-1.94,2.08+(level-1)*.12,.07,.44,m.paint);
  if(level===3){shell(g,[[-1.7,.045,.9,1.42],[-.85,.04,.83,1.10]],m.dark);box(g,0,1.37,-1.94,2.22,.045,.13,m.accent);}
  levelMarks(g,level,m);
  const flames=new T.Group();flames.name='inferno-living-flames';car.body.add(flames);d.flames=[];
  const outerMat=new T.MeshBasicMaterial({color:'#ff4b08',transparent:true,opacity:.72,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}),innerMat=new T.MeshBasicMaterial({color:'#ffe58b',transparent:true,opacity:.88,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  const geo=new T.ConeGeometry(.14,.65,5),innerGeo=new T.ConeGeometry(.071,.43,5),sites=[[-.78,.90,-1.55],[.78,.90,-1.55],[-.92,.65,-.30],[.92,.65,-.30],[-.58,.72,-2.02],[.58,.72,-2.02],[-.72,.61,1.30],[.72,.61,1.30]];
  d.flameOuter=new T.InstancedMesh(geo,outerMat,sites.length);d.flameInner=new T.InstancedMesh(innerGeo,innerMat,sites.length);flames.add(d.flameOuter,d.flameInner);d.flameOuter.frustumCulled=d.flameInner.frustumCulled=false;d.flameOuter.instanceMatrix.setUsage(T.DynamicDrawUsage);d.flameInner.instanceMatrix.setUsage(T.DynamicDrawUsage);d.flameSites=sites;d.flameTransform=new T.Object3D();
  const aura=mesh(car.body,new T.RingGeometry(.73,1,32),new T.MeshBasicMaterial({color:'#ff5c11',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false}),0,.045,0);aura.rotation.x=-Math.PI/2;aura.visible=false;aura.castShadow=aura.receiveShadow=false;d.heatAura=aura;
  d.setHeat=value=>{d.heat=clamp(Number(value)||0,0,1);return d.heat;};d.heat=0;
 }
 function grappler(car,g,m,level){
  const d=car.v24;
  shell(g,[[-2.10,.72,.39,.69],[-1.48,.83,.31,.82],[-.55,.77,.34,.71],[.65,.69,.34,.62],[1.55,.76,.35,.68],[2.12,.62,.42,.50]],m.paint);
  box(g,0,.38,.0,1.58,.14,3.7,m.dark);box(g,0,.58,1.97,1.47,.10,.20,m.dark);box(g,0,.83,-1.72,1.48,.12,.55,m.dark);
  for(const s of [-1,1]){
   box(g,s*.39,.69,-.06,.43,.10,.68,m.dark);const seat=box(g,s*.39,.94,-.37,.43,.53,.16,m.dark);seat.rotation.x=-.15;
   tube(g,[s*.73,.63,-.99],[s*.63,1.55,-.59],.055,m.metal);tube(g,[s*.63,1.55,-.59],[s*.58,1.51,.52],.055,m.metal);tube(g,[s*.58,1.51,.52],[s*.75,.61,1.00],.055,m.metal);
   tube(g,[s*.77,.62,-.95],[s*.76,.63,.98],.055,m.metal);tube(g,[s*.77,.64,-.93],[s*.65,1.47,.51],.034,m.dark);
   for(const z of [-1.43,1.42]){box(g,s*.94,.88,z,.39,.08,.85,m.paint);tube(g,[s*.70,.68,z-.2],[s*1.05,.42,z+.12],.055,m.accent);}
   box(g,s*.53,.68,1.99,.31,.10,.06,m.light);box(g,s*.57,.70,-2.11,.22,.09,.04,m.tail);
   if(level>1)box(g,s*.80,.44,-.06,.12,.10,2.22,m.accent);
  }
  for(const z of [-.59,.52])tube(g,[-.63,1.53,z],[.63,1.53,z],.055,m.metal);
  box(g,0,1.56,-.05,1.35,.07,1.14,m.paint);box(g,0,1.61,.50,.8,.07,.12,m.dark);
  if(level===3)for(const x of [-.42,-.14,.14,.42])box(g,x,1.67,.53,.18,.11,.09,m.light);
  const turret=new T.Group();turret.name='grappler-roof-launcher';turret.position.set(0,1.70,-.11);car.body.add(turret);d.turret=turret;
  const base=new T.Mesh(new T.CylinderGeometry(.32,.38,.12,12),m.dark);turret.add(base);
  const barrel=new T.Group();barrel.name='grappler-aim';turret.add(barrel);d.barrel=barrel;
  box(barrel,0,.14,.12,.35,.28,.88,m.paint);tube(barrel,[0,.17,.02],[0,.17,.92],.11,m.dark);ring(barrel,0,.17,.91,.12,.035,m.accent);
  const spool=new T.Group();spool.name='grappler-visible-spool';spool.position.set(0,.19,-.45);turret.add(spool);d.spool=spool;
  tube(spool,[-.30,0,0],[.30,0,0],.24,m.dark);for(const x of [-.31,.31])ring(spool,x,0,0,.26,.045,m.accent,'x');
  for(const x of [-.19,-.09,.01,.11,.21])ring(spool,x,0,0,.245,.016,m.metal,'x');
  tube(turret,[-.42,-.08,-.45],[-.42,.2,-.45],.045,m.metal);tube(turret,[.42,-.08,-.45],[.42,.2,-.45],.045,m.metal);
  const muzzle=new T.Object3D();muzzle.position.set(0,.17,1.05);barrel.add(muzzle);d.muzzle=muzzle;
  const hook=new T.Group();hook.name='grappler-loaded-hook';hook.position.copy(muzzle.position);barrel.add(hook);d.hook=hook;
  tube(hook,[0,0,-.1],[0,0,.25],.037,m.metal);
  for(const s of [-1,1]){tube(hook,[0,0,.18],[s*.19,0,.02],.032,m.accent);tube(hook,[s*.19,0,.02],[s*.19,0,-.12],.032,m.accent);}
  const cable=mesh(barrel,new T.CylinderGeometry(.013,.013,1,5),m.metal);cable.rotation.x=Math.PI/2;cable.visible=false;cable.userData.v24Dynamic=true;d.cable=cable;
  d.setAim=(yaw=0,pitch=0)=>{turret.rotation.y=clamp(Number(yaw)||0,-Math.PI,Math.PI);barrel.rotation.x=-clamp(Number(pitch)||0,-.35,1.15);};
  // Optional local-space extension. External world-space tether effects may hide
  // this loaded hook and use muzzle.getWorldPosition(out) as their origin.
  d.setHook=distance=>{const length=clamp(Number(distance)||0,0,160);hook.position.z=1.05+length;cable.visible=length>.02;cable.position.set(0,.17,1.05+length*.5);cable.scale.y=Math.max(.001,length);d.hookDistance=length;};d.hookDistance=0;
  levelMarks(g,level,m);batch(turret);batch(barrel);batch(spool);batch(hook);
  for(const w of car.wheels){w.pivot.position.x=w.side*1.03;w.pivot.scale.set(1.30,1.10,1.10);}
 }
 function formula(car,g,m,level){
  const d=car.v24;
  // A separate open-wheel chassis, with no road-car cabin or covered fenders.
  box(g,0,.29,-.12,1.56,.12,3.76,m.dark);
  shell(g,[[-2.00,.20,.35,.60],[-1.35,.34,.32,.97],[-.71,.40,.32,.79]],m.paint);
  shell(g,[[.14,.37,.33,.63],[.75,.29,.32,.61],[1.44,.20,.32,.48],[2.26,.105,.31,.38]],m.paint);
  for(const s of [-1,1]){
   shell(g,[[-1.53,.28,.35,.60],[-.90,.35,.33,.72],[.31,.29,.33,.67],[.63,.17,.35,.53]],m.paint).position.x=s*.59;
   box(g,s*.47,.68,.46,.24,.16,.035,m.dark);box(g,s*.38,.72,-.31,.12,.20,.94,m.paint);
   for(const z of [-1.43,1.42]){tube(g,[s*.25,.38,z-.36],[s*1.17,.39,z],.028,m.dark);tube(g,[s*.26,.44,z+.26],[s*1.17,.39,z],.028,m.dark);tube(g,[s*.28,.68,z-.08],[s*1.17,.43,z],.025,m.metal);}
   tube(g,[s*.39,.78,-.69],[s*.34,1.08,-.28],.035,m.dark);tube(g,[s*.34,1.08,-.28],[0,1.03,.42],.035,m.dark);
   box(g,s*.70,.40,-.61,.40,.04,1.45,m.accent);box(g,s*.14,.35,2.00,.055,.26,.17,m.dark);
   box(g,s*1.27,.35,2.16,.055,.34,.62,m.paint);box(g,s*1.03,1.07,-2.03,.055,.47,.64,m.paint);
   box(g,s*.34,.79,-1.98,.055,.54,.17,m.dark);box(g,s*.45,.62,-1.91,.12,.06,.035,m.tail);
  }
  box(g,0,.62,-.30,.64,.09,.80,m.dark);const seat=box(g,0,.80,-.62,.47,.39,.12,m.dark);seat.rotation.x=-.25;
  const helmet=mesh(g,new T.SphereGeometry(.18,12,8),m.accent,0,.98,-.40);helmet.scale.set(.89,1,1.04);box(g,0,1.01,-.24,.25,.065,.065,m.glass);
  tube(g,[0,.70,.43],[0,1.03,.42],.035,m.dark);
  const intake=mesh(g,new T.CylinderGeometry(.16,.21,.44,8),m.paint,0,1.02,-.97);intake.rotation.x=-.19;box(g,0,1.20,-.90,.21,.12,.04,m.dark);
  for(let i=0;i<2+level;i++){box(g,0,.18+i*.065,2.17-i*.12,2.48,.045,.18,m.dark);box(g,0,1.15+i*.055,-2.09+i*.08,2.04,.04,.18,i===0?m.paint:m.dark);}
  box(g,0,.33,-2.03,1.43,.17,.25,m.dark);for(const x of [-.53,-.27,0,.27,.53])box(g,x,.27,-2.13,.035,.21,.42,m.dark);
  tube(g,[0,.62,-1.80],[0,.62,-2.28],.075,m.metal);box(g,0,.74,-2.05,.12,.09,.04,m.tail);
  if(level>=2){for(const s of [-1,1])box(g,s*.78,.72,-.75,.035,.17,.68,m.accent);}
  if(level===3)shell(g,[[-1.74,.025,.65,1.30],[-.98,.025,.82,1.30]],m.paint);
  levelMarks(g,level,m);
  for(const w of car.wheels){w.pivot.position.x=w.side*1.16;w.pivot.scale.set(1.70,1.14,1.14);ring(w.spin,w.side*.14,0,0,.31,.014,m.accent,'x');}
  // Keep both existing animated jets while moving them to the central exhaust.
  for(let i=0;i<car.nitro.jets.length;i++)car.nitro.jets[i].jet.position.set((i?1:-1)*.065,.62,-2.30);
  d.frontWingZ=2.17;d.openWheel=true;
 }
 W.makeCar=(model=W.getCarSpec?.(),detached=false)=>{
  if(!model||!ids.has(model.id))return make(model,detached);
  const level=levelOf(model),car=make({...model,style:'hyper'},detached);car.model=model;suppressBody(car);
  const group=new T.Group();group.name='v24-'+model.id+'-body';car.body.add(group);
  car.v24={id:model.id,level,group,heat:0,hookDistance:0};car.root.userData.v24={id:model.id};
  const m=materials(car,level);if(model.id==='inferno')inferno(car,group,m,level);else if(model.id==='grappler')grappler(car,group,m,level);else formula(car,group,m,level);batch(group);
  // The normal car disposal traversal sees this material map, just like paint.
  // Mirror it into map only on a hidden, zero-draw holder so old disposal code
  // that knows only material.map also releases the procedural emissive texture.
  if(car.paint.emissiveMap){const holder=mesh(group,new T.BufferGeometry(),new T.MeshBasicMaterial({map:car.paint.emissiveMap}));holder.visible=false;}
  const used=new Set();car.root.traverse(o=>{for(const material of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])used.add(material);});for(const material of Object.values(m))if(!used.has(material))material.dispose();
  animate(car,0,0,{});return car;
 };
 function animate(car,dt,time,state={}){
  const d=car?.v24;if(!d)return;const t=Number(time)||0,step=clamp(Number(dt)||0,0,.1),ud=car.root.userData;
  if(d.id==='inferno'){
   const value=Number.isFinite(state.infernoHeat)?state.infernoHeat:Number.isFinite(ud.infernoHeat)?ud.infernoHeat:d.heat;d.setHeat(value);const heat=d.heat;
   d.heatMaterial.emissiveIntensity=1.8+heat*2.1+Math.sin(t*7)*.20;d.flameOuter.material.opacity=.60+heat*.22;
   for(let i=0;i<d.flameSites.length;i++){const p=d.flameSites[i],o=d.flameTransform,flicker=.8+Math.sin(t*17+i*2.3)*.14+Math.sin(t*31+i)*.09,height=(1+heat*1.25)*flicker;o.position.set(p[0]+Math.sin(t*5+i)*.025,p[1]+.25*height,p[2]);o.rotation.set(Math.sin(t*8+i)*.12,0,Math.cos(t*7+i)*.12);o.scale.set(1+heat*.4,height,1+heat*.4);o.updateMatrix();d.flameOuter.setMatrixAt(i,o.matrix);o.position.y-=.08*height;o.updateMatrix();d.flameInner.setMatrixAt(i,o.matrix);}
   d.flameOuter.instanceMatrix.needsUpdate=d.flameInner.instanceMatrix.needsUpdate=true;d.heatAura.visible=heat>.01;d.heatAura.material.opacity=heat*(.10+Math.sin(t*6)*.025);d.heatAura.scale.setScalar(2.1+heat*2.6+Math.sin(t*3)*.08);
  }else if(d.id==='grappler'){
   if(Number.isFinite(state.grappleAimYaw)||Number.isFinite(state.grappleAimPitch))d.setAim(state.grappleAimYaw||0,state.grappleAimPitch||0);
   if(Number.isFinite(state.grappleDistance))d.setHook(state.grappleDistance);
   d.spool.rotation.x+=step*(state.grappleActive?14:state.grappleRetracting?-18:0);
  }
 }
 W.updateCarSpecialVisual=(car,state,dt,time)=>{previousVisual?.(car,state,dt,time);animate(car,dt,time,state||{});};
 function levelBadge(level){return `<g aria-hidden="true"><rect x="9" y="8" width="42" height="17" rx="5" fill="#172c3b"/><text x="30" y="20" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="${level===3?'#ffce6b':'#b4f6ed'}">LV ${level}</text></g>`;}
 W.carPreview=model=>{
  if(!ids.has(model?.id))return preview(model);const level=levelOf(model),paint=safeColor(model.color,'#d94627'),accent=level===3?'#ffce6b':'#b4f6ed';let art='';
  if(model.id==='inferno')art=`<path d="M28 75 L45 61 L104 55 L143 34 H197 L237 58 L286 67 L304 83 L292 93 H28Z" fill="${paint}"/><path d="M109 56 L147 39 H193 L222 60Z" fill="#172d3b"/><path d="M33 72 L64 64 L77 76 L92 66 L111 76 L138 65 L151 83 L178 75 L190 89 M202 68 L220 76 L245 67 L266 80 L291 75 M57 65 L61 88 M120 75 L109 89 M240 72 L232 90" fill="none" stroke="#ff601a" stroke-width="4"/><path d="M36 73 L65 66 L78 77 L93 68 M203 70 L222 78 L244 69 L265 82" fill="none" stroke="#ffe17c" stroke-width="1.4"/><path d="M27 82 H300 M28 53 H82 M45 53 V63 M71 53 V61" stroke="#111d26" stroke-width="6"/><path d="M38 60 Q26 45 40 33 Q35 48 51 42 Q48 52 60 60 M74 60 Q66 39 80 24 Q76 42 88 37 Q86 50 98 58 M218 67 Q209 49 221 39 Q219 53 230 48 Q230 61 240 69" fill="#ff6420"/><path d="M40 59 Q34 50 42 44 L53 60 M77 59 Q72 48 80 39 L89 59" fill="#ffdc73"/><path d="M277 71 H294" stroke="#fff2a6" stroke-width="3"/><g fill="#131b23" stroke="#e96725" stroke-width="3"><circle cx="76" cy="86" r="18"/><circle cx="246" cy="86" r="18"/></g><g fill="#93816c"><circle cx="76" cy="86" r="9"/><circle cx="246" cy="86" r="9"/></g>${level>1?`<path d="M22 52 H84 M285 88 H308" stroke="${accent}" stroke-width="${level+1}"/>`:''}`;
  else if(model.id==='grappler')art=`<path d="M25 76 L44 59 H109 L130 69 H206 L231 58 L278 64 L302 81 L290 91 H31Z" fill="${paint}"/><path d="M99 64 L119 28 H185 L219 67 M117 29 L125 65 M184 28 L180 67 M101 63 L186 30 M99 67 H216" fill="none" stroke="#99b7c6" stroke-width="5"/><path d="M115 28 H191" stroke="${paint}" stroke-width="9"/><path d="M131 65 V48 H146 V67 M171 66 V48 H186 V67" fill="#18252e"/><path d="M132 26 H223 V36 H132Z" fill="#324454" stroke="${accent}" stroke-width="2"/><path d="M219 31 H244 L251 25 M244 31 L251 37" fill="none" stroke="#e2f1f6" stroke-width="3"/><circle cx="135" cy="30" r="13" fill="#19252e" stroke="${accent}" stroke-width="3"/><circle cx="135" cy="30" r="7" fill="none" stroke="#a7bfca" stroke-width="3"/><path d="M28 85 H294 M29 58 H84 M230 57 H281" stroke="#172b36" stroke-width="6"/><g fill="#13212b" stroke="#455b65" stroke-width="4"><circle cx="67" cy="84" r="23"/><circle cx="257" cy="84" r="23"/></g><g fill="#a6bfcc" stroke="#243b49" stroke-width="4"><circle cx="67" cy="84" r="12"/><circle cx="257" cy="84" r="12"/></g>${level>1?`<path d="M104 84 H220" stroke="${accent}" stroke-width="4"/>`:''}${level===3?'<path d="M189 25 H207" stroke="#eefff4" stroke-width="7"/>':''}`;
  else art=`<path d="M27 65 V39 H71 V72 M26 39 H78 M29 47 H76" fill="${paint}" stroke="#17232e" stroke-width="4"/><path d="M58 79 L90 57 L126 51 L144 63 H170 L182 71 L276 81 L296 88 H63Z" fill="${paint}"/><path d="M113 51 L126 30 H142 L153 63" fill="${paint}"/><path d="M128 30 H139 V40 H126Z" fill="#14212b"/><path d="M132 65 H170 L180 72 H126Z" fill="#14212b"/><path d="M142 60 Q149 45 158 48 Q166 49 166 60" fill="${accent}"/><path d="M147 52 H164" stroke="#1a3948" stroke-width="4"/><path d="M132 64 Q128 42 174 57 L180 71 M158 55 L168 70" fill="none" stroke="#283b47" stroke-width="3"/><path d="M67 82 H272 M245 89 H312 M250 82 H307 M282 78 V93 M51 80 L109 75 M215 83 L270 76" stroke="#13232e" stroke-width="5"/><path d="M83 78 L112 69 H131 L128 82 M179 75 L205 79 L200 84 H174" fill="#172b35"/><g fill="#131a21"><rect x="45" y="63" width="38" height="42" rx="13"/><rect x="247" y="66" width="34" height="39" rx="12"/></g><g fill="none" stroke="${accent}" stroke-width="2"><ellipse cx="64" cy="84" rx="13" ry="18"/><ellipse cx="264" cy="85" rx="11" ry="16"/></g><g fill="#748b99"><ellipse cx="64" cy="84" rx="7" ry="11"/><ellipse cx="264" cy="85" rx="6" ry="10"/></g>${level>1?`<path d="M95 77 H120 M185 80 H207 M27 34 H78" stroke="${accent}" stroke-width="3"/>`:''}${level===3?`<path d="M91 54 L107 31 H124 L119 52Z" fill="${paint}"/>`:''}`;
  return `<svg viewBox="0 0 320 110" role="img" aria-label="${escape(model.name||model.id)} level ${level}"><ellipse cx="160" cy="103" rx="143" ry="5" fill="#000" opacity=".2"/>${art}${levelBadge(level)}</svg>`;
 };
 W.v24CarAssets=Object.freeze({animate,levelOf,ids:Object.freeze([...ids])});
})();
