/* V2.2: themed storefronts and bounded, decorative pedestrians. No player walking. */
(()=>{'use strict';
 const W=Isla,T=THREE,M=IslaMaker,A=IslaMakerAssets;
 const themes={restaurant:{label:'Restaurant',sign:'ISLA DINER',color:'#b86645'},shop:{label:'Shop',sign:'ISLA MARKET',color:'#468b79'},police:{label:'Police station',sign:'ISLA POLICE',color:'#3b6489'},clinic:{label:'Clinic',sign:'ISLA CLINIC',color:'#719ca3'}};
 const specs={shop:{label:'Shop',w:16,d:12,h:5.5,group:'Buildings'},police:{label:'Police station',w:22,d:16,h:8,group:'Buildings'},clinic:{label:'Clinic',w:18,d:14,h:7,group:'Buildings'}};
 Object.assign(M.types,specs);
 const colors=new Map(),signs=new Map(),unit=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,10,7);
 const mat=color=>{if(!colors.has(color))colors.set(color,new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness:.82}));return colors.get(color);};
 const box=(g,x,y,z,w,h,d,m)=>{const mesh=new T.Mesh(unit,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;};
 function signMaterial(type){if(signs.has(type))return signs.get(type);const theme=themes[type],canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle=theme.color;c.fillRect(0,0,512,96);c.fillStyle='#faf5df';c.textAlign='center';c.textBaseline='middle';c.font='bold 46px Arial';c.fillText(theme.sign,256,50,480);const tex=new T.CanvasTexture(canvas);tex.encoding=T.sRGBEncoding;const result=new T.MeshStandardMaterial({map:tex,roughness:.8});signs.set(type,result);return result;}
 function themeFor(b){const type=b.object?.type||b.group?.userData.v22Theme;if(themes[type])return type;if(W.customMap)return null;if(/diner|cafe|restaurant/i.test(b.name||''))return 'restaurant';return ['restaurant','shop','police','clinic'][b.id%4];}
 const point=(b,x,z)=>({x:b.x+Math.cos(b.yaw)*x+Math.sin(b.yaw)*z,z:b.z-Math.sin(b.yaw)*x+Math.cos(b.yaw)*z});
 const local=(b,x,z)=>{const dx=x-b.x,dz=z-b.z;return {x:Math.cos(b.yaw)*dx-Math.sin(b.yaw)*dz,z:Math.sin(b.yaw)*dx+Math.cos(b.yaw)*dz};};
 function footprintDistance(b,x,z){const p=local(b,x,z);return Math.hypot(Math.max(0,Math.abs(p.x)-b.w/2),Math.max(0,Math.abs(p.z)-b.d/2));}
 // Open only the existing ground-floor glass panes. Doors, frames, crossbars and the rest of the facade stay intact.
 // Only marked wall/backing surfaces are clipped; shared geometry and materials are never mutated.
 function cutWindow(root,opening,front){root.updateMatrixWorld(true);const basis=new T.Matrix4().copy(root.matrixWorld).invert(),meshes=[];root.traverse(m=>{if(m.isMesh&&!m.isInstancedMesh&&m.userData.v237Wall)meshes.push(m);});
  const min=[opening.x-opening.w/2,opening.y-opening.h/2,front-.3],max=[opening.x+opening.w/2,opening.y+opening.h/2,front+.3];
  const clip=(poly,axis,bound,sign)=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-bound)*sign,db=(b[axis]-bound)*sign;if(da>=-1e-8)out.push(a);if(da*db<0){const t=da/(da-db);out.push(a.map((v,k)=>v+(b[k]-v)*t));}}return out;};
  for(const mesh of meshes){const src=mesh.geometry;if(!src?.attributes.position)continue;const transform=new T.Matrix4().multiplyMatrices(basis,mesh.matrixWorld),bounds=new T.Box3().setFromBufferAttribute(src.attributes.position).applyMatrix4(transform);if(bounds.max.x<min[0]||bounds.min.x>max[0]||bounds.max.y<min[1]||bounds.min.y>max[1]||bounds.max.z<min[2]||bounds.min.z>max[2])continue;
   const p=src.attributes.position,n=src.attributes.normal,uv=src.attributes.uv,index=src.index,normalMatrix=new T.Matrix3().getNormalMatrix(transform),positions=[],normals=[],uvs=[],groups=[];
   const read=i=>{const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(transform),normal=n?new T.Vector3().fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize():new T.Vector3(0,1,0);return [v.x,v.y,v.z,normal.x,normal.y,normal.z,uv?uv.getX(i):0,uv?uv.getY(i):0];};
   const emit=poly=>{for(let i=1;i<poly.length-1;i++)for(const v of [poly[0],poly[i],poly[i+1]]){positions.push(v[0],v[1],v[2]);normals.push(v[3],v[4],v[5]);uvs.push(v[6],v[7]);}};
   for(const g of src.groups.length?src.groups:[{start:0,count:index?index.count:p.count,materialIndex:0}]){const start=positions.length/3;for(let i=g.start;i<g.start+g.count;i+=3){let inside=[0,1,2].map(k=>read(index?index.getX(i+k):i+k));for(let axis=0;axis<3&&inside.length;axis++){emit(clip(inside,axis,min[axis],-1));inside=clip(inside,axis,min[axis],1);if(!inside.length)break;emit(clip(inside,axis,max[axis],1));inside=clip(inside,axis,max[axis],-1);}}groups.push({start,count:positions.length/3-start,materialIndex:g.materialIndex});}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));if(Array.isArray(mesh.material))for(const g of groups)geo.addGroup(g.start,g.count,g.materialIndex);geo.applyMatrix4(transform.invert());geo.computeBoundingSphere();if(mesh.userData.v22WindowCut)src.dispose();mesh.geometry=geo;mesh.userData.v22WindowCut=true;
  }
 }
 function openWindows(root,front){const panes=root.userData.v237Windows||[];
  for(const pane of panes)cutWindow(root,pane,front);
  root.traverse(mesh=>{if(!mesh.userData.v237Pane)return;const glass=mesh.material.clone();glass.color.set('#9dc3c9').convertSRGBToLinear();glass.transparent=true;glass.opacity=.18;glass.depthWrite=false;mesh.material=glass;mesh.castShadow=false;mesh.receiveShadow=false;});
  const glass=new T.MeshStandardMaterial({color:new T.Color('#9dc3c9').convertSRGBToLinear(),roughness:.25,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide});
  for(const pane of panes){if(!pane.painted)continue;const mesh=new T.Mesh(new T.PlaneGeometry(pane.w,pane.h),glass);mesh.position.set(pane.x,pane.y,front+(pane.frame?.23:.015));mesh.userData.v237Glazing=true;root.add(mesh);
   if(pane.frame){const frame=mat('#e8e3d4');for(const side of [-1,1]){box(root,pane.x+side*(pane.w/2+.055),pane.y,front+.23,.11,pane.h+.22,.1,frame);box(root,pane.x,pane.y+side*(pane.h/2+.055),front+.23,pane.w,.11,.1,frame);}}
  }return panes;
 }
 function furnish(root,w,d,h,type,floor=0){if(root.userData.v22Room)return root.userData.v22Room;const panes=openWindows(root,d/2),room={w:Math.max(2,w-.6),front:d/2,floor:Math.min(Math.max(0,floor),Math.max(0,h-2.8))};room.ceiling=Math.max(2.9,...panes.map(p=>p.y+p.h/2-room.floor+.15));
  const g=new T.Group();g.userData.v22Interior=true;g.userData.dynamic=true;root.add(g);const plaster=mat('#d9d2bc'),trim=mat('#eee7d5'),wood=mat('#856e53'),dark=mat('#344b54'),accent=mat(themes[type]?.color||'#668b85'),z=room.front,y=room.floor,wide=room.w,ceiling=room.ceiling,signWide=Math.min(6,w*.55);
  box(g,0,y+.05,z-1.45,wide+.35,.15,3.1,wood);box(g,0,y+ceiling,z-1.45,wide+.35,.12,3.1,plaster);box(g,0,y+ceiling/2,z-3,wide+.35,ceiling,.15,plaster);for(const s of [-1,1])box(g,s*(wide/2+.1),y+ceiling/2,z-1.45,.15,ceiling,3.1,plaster);
  box(g,0,y+.55,z-2.45,wide*.7,1.05,.65,wood);box(g,0,y+1.11,z-2.45,wide*.76,.1,.8,trim);
  if(type==='shop'){for(const s of [-1,1])for(const yy of [.65,1.3,1.95]){box(g,s*(wide/2-.45),y+yy,z-1.7,.7,.12,1.7,wood);for(let i=0;i<3;i++)box(g,s*(wide/2-.45),y+yy+.2,z-2.2+i*.5,.28,.3,.28,mat(['#b56548','#779750','#c6aa65'][i]));}}
  else if(type==='restaurant'){for(const s of [-1,1]){box(g,s*wide*.29,y+.68,z-1.25,.85,.1,.85,trim);box(g,s*wide*.29,y+.34,z-1.25,.13,.68,.13,dark);box(g,s*wide*.29,y+.4,z-1.9,.8,.18,.45,accent);}}
  else if(type==='police'){box(g,-wide*.2,y+1.45,z-2.5,.65,.5,.12,dark);box(g,wide*.23,y+1.9,z-2.88,.8,.75,.1,accent);}
  else if(type==='clinic'){box(g,wide*.25,y+.6,z-1.7,.9,.2,1.5,trim);box(g,-wide*.28,y+1.65,z-2.83,.65,.65,.15,mat('#a95248'));box(g,-wide*.28,y+1.65,z-2.73,.15,.5,.05,trim);box(g,-wide*.28,y+1.65,z-2.72,.5,.15,.05,trim);}
  else{box(g,-wide*.28,y+.4,z-1.65,.75,.7,1.1,accent);box(g,wide*.27,y+1.55,z-2.85,1,.7,.1,dark);}
  if(type){box(g,0,y+3.05,z+.18,Math.min(w-.3,signWide+2),.8,.25,accent);const sign=new T.Mesh(new T.PlaneGeometry(Math.min(w-.5,signWide+1.7),.65),signMaterial(type));sign.position.set(0,y+3.05,z+.32);g.add(sign);if(type==='restaurant'||type==='shop')for(let i=0;i<8;i++)box(g,(i-3.5)*(signWide+.5)/8,y+2.8,z+.65,(signWide+.5)/8,.12,1.3,i%2?accent:trim);if(type==='police'){for(const s of [-1,1])box(g,s*(signWide/2+.45),y+3.4,z+.2,.3,.22,.3,mat(s<0?'#558fc8':'#c56358'));}}
  room.group=g;root.userData.v22Room=room;return room;
 }
 const originalObject=A.object;
 A.object=(o,height,editor=false)=>{const g=originalObject(o,height,editor);if(themes[o.type]){g.userData.v22Theme=o.type;const s=M.types[o.type];furnish(g,s.w,s.d,s.h,o.type);}return g;};
 const P=W.v22People={records:[],active:[],batches:[],clock:0,scene:null,refresh:0,maxPeople:72,footprintDistance,point,themeFor};

 function clearOfRoad(x,z){const near=W.nearestRoad(x,z,2);return !near.p||near.d>near.p.width/2+1.25;}
 function safe(b,x,z){if(footprintDistance(b,x,z)>4.8||!clearOfRoad(x,z))return false;const y=W.height(x,z);if(!Number.isFinite(y)||y<.3)return false;for(const other of W.buildings){if(other===b||other.collapsed||Math.hypot(x-other.x,z-other.z)>Math.hypot(other.w,other.d)/2+1)continue;const q=local(other,x,z);if(Math.abs(q.x)<other.w/2+.45&&Math.abs(q.z)<other.d/2+.45)return false;}return true;}
 // City routes are static and validated every half metre once; reuse their ground samples for the larger crowd.
 function outsidePath(b){for(let k=0;k<4;k++){const side=(k+b.id)%4,front=side%2===0,sign=side<2?1:-1,span=Math.min(3,(front?b.w:b.d)/2-.6),offset=(front?b.d:b.w)/2+2.2,points=[];let min=Infinity,max=-Infinity,ok=true;for(let i=0;i<=12;i++){const along=-span+2*span*i/12,p=point(b,front?along:sign*offset,front?sign*offset:along);if(!safe(b,p.x,p.z)){ok=false;break;}p.y=(P.density===3?W.driveHeight(p.x,p.z,true):W.height(p.x,p.z))+.02;min=Math.min(min,p.y);max=Math.max(max,p.y);points.push(p);}if(ok&&max-min<1.3)return {points,span,front,sign,offset};}return null;}
 function makeBatch(scene,geo,color,count,colored=false){const mesh=new T.InstancedMesh(geo,mat(color),count);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);if(colored)mesh.instanceColor=new T.InstancedBufferAttribute(new Float32Array(count*3).fill(1),3).setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=true;mesh.count=0;mesh.userData.dynamic=true;scene.add(mesh);P.batches.push(mesh);return mesh;}
 // Costa Metro has three residents of each kind per building; other maps keep their original pair.
 const person=(id,phase,inside=false)=>({id,phase,inside,tumble:0,immune:0});
 function parkPoint(n,angle){const u=n.block.u+80+Math.cos(angle)*n.radius,v=n.block.v+80+Math.sin(angle)*n.radius;return {...W.cityToWorld(u,v),u,v};}
 function parkSafe(n,p){const u=p.u-n.block.u,v=p.v-n.block.v;if(u<20||u>140||v<20||v>140||Math.abs(u-80)<14&&Math.abs(v-80)<14||!clearOfRoad(p.x,p.z))return false;const y=W.height(p.x,p.z);return Number.isFinite(y)&&y>.3&&!(W.trees||[]).some(t=>Math.hypot(t.x-p.x,t.z-p.z)<(t.r||.4)+.65);}
 function parkResidents(){const records=[];if(P.density!==3)return records;
  for(const block of W.cityBlocks||[]){if(!block.park)continue;const center=W.cityToWorld(block.u+80,block.v+80),people=[];
   for(let lane=0;lane<3;lane++){const route={block,radius:34+lane*6},valid=Array.from({length:96},(_,i)=>parkPoint(route,i*Math.PI/48)).every(p=>parkSafe(route,p));if(!valid)continue;
    for(let i=0;i<4;i++)people.push({...person(1000000+block.ix*1000+block.iz*100+lane*4+i,i*Math.PI/2+lane*.37),...route,direction:lane===1?-1:1});
   }if(people.length)records.push({block,center,people});
  }return records;
 }
 P.install=scene=>{if(P.scene===scene&&P.initialized)return;for(const mesh of P.batches){mesh.parent?.remove(mesh);mesh.dispose?.();}P.batches=[];P.scene=scene;P.initialized=true;P.records=[];P.active=[];P.activePark=[];P.clock=P.refresh=0;P.previousCars=new Map();P.density=W.mapId==='city'&&!W.customMap?3:1;P.peoplePerBuilding=2*P.density;P.maxPeople=72*P.density;
  for(const b of W.buildings){if(!b.group||b.scenery||b.w<5||b.d<5||b.h<2.9||b.object&&(Math.abs(b.object.pitch||0)>.01||Math.abs(b.object.roll||0)>.01))continue;const residents=[];
   for(let i=0;i<P.density;i++){const offset=i*Math.PI*2/3,id=i?200000+i*10000+b.id*2:b.id*2;residents.push(person(id,b.id*.913+offset),person(id+1,b.id*.627+offset,true));}
   P.records.push({b,path:undefined,room:null,facade:null,residents,outside:residents[0],inside:residents[1]});
  }P.parks=parkResidents();
  P.head=makeBatch(scene,sphere,'#ffffff',P.maxPeople,true);P.hair=makeBatch(scene,sphere,'#3d342d',P.maxPeople);P.shirt=makeBatch(scene,unit,'#ffffff',P.maxPeople*3,true);P.hands=makeBatch(scene,unit,'#ffffff',P.maxPeople*2,true);P.pants=makeBatch(scene,unit,'#344553',P.maxPeople*2);P.shoes=makeBatch(scene,unit,'#292f32',P.maxPeople*2);P.update(0,0);
 };
 function prepare(rec){const b=rec.b;if(rec.path===undefined)rec.path=outsidePath(b);if(rec.room)return;const scale=b.group.scale.x||1;let room=b.group.userData.v22Room;if(!room){const floor=Math.max(b.foundation||0,W.height(b.x,b.z)-b.y+.08);room=furnish(b.group,b.w/scale,b.d/scale,b.h/scale,b.id%3===0||W.mapId==='playplace'?themeFor(b):null,floor/scale);}rec.room=room;rec.roomScale=scale;rec.facade=room.group;}
 const root=new T.Object3D(),part=new T.Object3D(),joint=new T.Object3D(),matrix=new T.Matrix4(),limbMatrix=new T.Matrix4(),tint=new T.Color();
 const shirtColors=['#6a8a9b','#bc8b59','#8e799e','#64897a','#aa6c62','#9b9c7b'];
 const skinColors=['#f2d3bc','#e7ba96','#d9a178','#c58b60','#b77950','#9d6342','#855038','#70422e','#593526','#43291f'];
 function render(n,index,time){const age=n.tumble?3-n.tumble:0,recover=n.tumble>0&&n.tumble<.5?n.tumble/.5:1,fall=n.tumble?Math.min(1,age/.3)*recover:0;root.position.set(n.x,n.y+(n.tumble?Math.sin(Math.min(1,age/.55)*Math.PI)*.45:.0),n.z);root.rotation.set(fall*.2,n.yaw||0,fall*1.45);root.scale.setScalar(1);root.updateMatrix();
  const put=(mesh,i,x,y,z,sx,sy,sz,rx=0,rz=0,parent=root.matrix)=>{part.position.set(x,y,z);part.rotation.set(rx,0,rz);part.scale.set(sx,sy,sz);part.updateMatrix();mesh.setMatrixAt(i,matrix.multiplyMatrices(parent,part.matrix));};
  const step=Math.sin(time*4+n.phase)*.35*(n.inside?.3:1),arms=n.tumble?1.1*recover:0;
  put(P.head,index,0,1.66,0,.13,.16,.13);put(P.hair,index,0,1.76,-.025,.135,.095,.125);put(P.shirt,index*3,0,1.2,0,.43,.58,.28);
  for(let s=0;s<2;s++){const sign=s?1:-1; joint.position.set(sign*.29,1.4,0);joint.rotation.set(step*sign,0,sign*(arms+.08));joint.scale.set(1,1,1);joint.updateMatrix();limbMatrix.multiplyMatrices(root.matrix,joint.matrix);put(P.shirt,index*3+s+1,0,-.19,0,.14,.38,.17,0,0,limbMatrix);put(P.hands,index*2+s,0,-.44,0,.12,.16,.14,0,0,limbMatrix);
   joint.position.set(sign*.115,.92,0);joint.rotation.set(-step*sign,0,sign*arms*.3);joint.updateMatrix();limbMatrix.multiplyMatrices(root.matrix,joint.matrix);put(P.pants,index*2+s,0,-.35,0,.17,.72,.2,0,0,limbMatrix);put(P.shoes,index*2+s,0,-.76,.06,.19,.14,.32,0,0,limbMatrix);
  }tint.set(shirtColors[n.id%shirtColors.length]).convertSRGBToLinear();for(let i=0;i<3;i++)P.shirt.setColorAt(index*3+i,tint);
  // Stable person IDs keep the same complexion when nearby NPCs reorder or reload.
  tint.set(skinColors[(Math.imul(n.id+1,2654435761)>>>0)%skinColors.length]).convertSRGBToLinear();P.head.setColorAt(index,tint);for(let i=0;i<2;i++)P.hands.setColorAt(index*2+i,tint);
 }
 function vehicles(dt){const list=[['local',W.vehicle,W.carMesh?.size||1]];for(const [id,remote]of W.net?.remotes?.entries()||[])if(remote.connected!==false)list.push(['remote:'+id,{...remote.target,...remote.current},remote.mesh?.size||1]);for(const t of W.traffic||[])list.push(['traffic:'+t.id,t,t.size||1]);const current=new Map(),out=[];
  for(const [id,c,size]of list){if(!c||![c.x,c.y,c.z].every(Number.isFinite))continue;const prev=P.previousCars.get(id)||c,motion=Math.hypot(c.x-prev.x,c.z-prev.z),velocity=Math.hypot(c.vx||0,c.vz||0),speed=Math.max(velocity,motion/Math.max(.001,dt));current.set(id,{x:c.x,y:c.y,z:c.z});if(speed<1.8||motion>Math.max(15,velocity*Math.max(dt,.001)*3+2))continue;out.push({c,prev,size});}P.previousCars=current;return out;
 }
 function collision(n,record,cars){if(n.inside||n.tumble||n.immune>0)return;for(const {c,prev,size}of cars){if(Math.abs(c.y-n.y)>2.5*size)continue;const dx=c.x-prev.x,dz=c.z-prev.z,d=dx*dx+dz*dz,t=d?Math.max(0,Math.min(1,((n.x-prev.x)*dx+(n.z-prev.z)*dz)/d)):1,x=prev.x+dx*t,z=prev.z+dz*t,co=Math.cos(c.yaw||0),si=Math.sin(c.yaw||0),across=(n.x-x)*co-(n.z-z)*si,along=(n.x-x)*si+(n.z-z)*co;if(Math.abs(across)>size+.3||Math.abs(along)>2.25*size+.3)continue;n.tumble=3;n.tumbleUntil=P.clock+3;n.hitX=n.x;n.hitZ=n.z;n.hitY=n.y;n.hitYaw=n.yaw;return;}}
 P.update=(dt,time)=>{if(!P.scene)return;dt=Math.max(0,Math.min(.1,Number(dt)||0));P.clock+=dt;const focus=W.vehicle||{x:0,z:0};P.refresh-=dt;
  if(P.refresh<=0){P.refresh=.35;for(const r of P.records)if(r.facade)r.facade.visible=false;P.activePark=P.parks.filter(r=>Math.hypot(r.center.x-focus.x,r.center.z-focus.z)<221).flatMap(r=>r.people);const buildings=Math.floor((P.maxPeople-P.activePark.length)/P.peoplePerBuilding);P.active=P.records.filter(r=>!r.b.collapsed&&Math.hypot(r.b.x-focus.x,r.b.z-focus.z)<175+Math.hypot(r.b.w,r.b.d)/2).sort((a,b)=>Math.hypot(a.b.x-focus.x,a.b.z-focus.z)-Math.hypot(b.b.x-focus.x,b.b.z-focus.z)).slice(0,buildings);for(const r of P.active){prepare(r);if(r.facade)r.facade.visible=true;}}
  const cars=vehicles(dt);let count=0;
  for(const r of P.active){if(r.b.collapsed)continue;const b=r.b,room=r.room;
   for(const n of r.residents){const inside=n.inside;if(!inside&&!r.path)continue;n.immune=Math.max(0,n.immune-dt);if(n.tumble){n.tumble=Math.max(0,n.tumbleUntil-P.clock);if(!n.tumble)n.immune=1.5;}
    if(n.tumble){n.x=n.hitX;n.y=n.hitY+.12;n.z=n.hitZ;n.yaw=n.hitYaw;}
    else if(inside){const scale=r.roomScale,p=point(b,Math.sin(P.clock*.4+n.phase)*room.w*.42*scale,(room.front-.85)*scale);n.x=p.x;n.z=p.z;n.y=b.y+room.floor*scale+.14;n.yaw=b.yaw+(Math.cos(P.clock*.4+n.phase)>0?Math.PI/2:-Math.PI/2);}
    else{const path=r.path,along=Math.sin(P.clock*.28+n.phase)*path.span,p=point(b,path.front?along:path.sign*path.offset,path.front?path.sign*path.offset:along);if(P.density!==3&&!safe(b,p.x,p.z))continue;n.x=p.x;n.z=p.z;if(P.density===3){const t=(along/path.span+1)*.5*(path.points.length-1),i=Math.min(path.points.length-2,Math.floor(t));n.y=path.points[i].y+(path.points[i+1].y-path.points[i].y)*(t-i);}else n.y=W.height(p.x,p.z)+.02;n.yaw=b.yaw+(path.front?Math.PI/2:0)+(Math.cos(P.clock*.28+n.phase)<0?Math.PI:0);}
    collision(n,r,cars);render(n,count++,P.clock);if(count>=P.maxPeople)break;
   }if(count>=P.maxPeople)break;
  }
  P.visibleParkCount=0;
  for(const n of P.activePark){if(count>=P.maxPeople)break;n.immune=Math.max(0,n.immune-dt);if(n.tumble){n.tumble=Math.max(0,n.tumbleUntil-P.clock);if(!n.tumble)n.immune=1.5;}
   if(n.tumble){n.x=n.hitX;n.y=n.hitY+.12;n.z=n.hitZ;n.yaw=n.hitYaw;}
   else{const angle=n.phase+P.clock*1.05/n.radius*n.direction,p=parkPoint(n,angle);if(!parkSafe(n,p))continue;const next=parkPoint(n,angle+.01*n.direction);n.x=p.x;n.z=p.z;n.y=W.driveHeight(p.x,p.z,true)+.02;n.yaw=Math.atan2(next.x-p.x,next.z-p.z);}
   collision(n,null,cars);render(n,count++,P.clock);P.visibleParkCount++;
  }P.head.count=P.hair.count=count;P.shirt.count=count*3;P.hands.count=P.pants.count=P.shoes.count=count*2;for(const mesh of P.batches){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}P.visibleCount=count;
 };
})();
