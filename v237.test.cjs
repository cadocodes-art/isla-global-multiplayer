'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const create=require('../scripts/source-world.cjs'),T=require('../public/three.min.js'),V=require('../public/v22-shared.js');
function codec(W){const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/playplace-state.js'),'utf8'),ctx);return ctx.IslaPlayState(W,T);}
test('V2.37 scores downward hoop crossings for the last driver once and persists ownership in snapshots',()=>{
 const {W}=create('playplace'),S=W.playplace.sports,b=S.balls[0],h=S.hoop,events=[];W.onBasketScored=e=>events.push(e);
 const c={...W.vehicle,car:'classic',x:b.p.x,y:12.12,z:b.p.z+3.5,yaw:Math.PI,vx:0,vy:0,vz:-25,driverId:'shooter_A',parked:false};S.collideCar(c,2);assert.equal(b.lastTouch,'shooter_A');
 const state=codec(W),saved=state.capture(true);assert(state.valid(saved));assert(saved.ballTouches.some(t=>t[0]===b.id&&t[1]==='shooter_A'));b.lastTouch=null;assert(state.apply(saved));assert.equal(b.lastTouch,'shooter_A');
 const drop=(time,x=h.x)=>{b.previous.set(x,h.y+1,h.z);b.p.set(x,h.y-1,h.z);b.velocity.set(0,-5,0);S.score(b,time);};
 drop(3,h.x+h.r);assert.equal(events.length,0,'missing the rim gives no reward');b.previous.set(h.x,h.y-1,h.z);b.p.set(h.x,h.y+1,h.z);b.velocity.y=5;S.score(b,3);assert.equal(events.length,0,'upward crossings do not score');
 drop(4);assert.equal(events.length,1);assert.equal(events[0].driverId,'shooter_A');assert.equal(events[0].ball,b.id);assert.equal(b.lastTouch,null);assert(V.reward('basket',events[0].target)>=7000&&V.reward('basket',events[0].target)<=9000);
 drop(4.01);drop(7);assert.equal(events.length,1,'untouched rebounds cannot pay twice');S.touch(b,{driverId:'shooter_B'});drop(9);assert.equal(events.length,2);assert.equal(events[1].driverId,'shooter_B');assert.notEqual(events[0].target,events[1].target);
 W.net={active:false,id:'former_global_id'};S.touch(b,{});assert.equal(b.lastTouch,'local','leaving a global room restores solo attribution');
 const invalid={...saved,ballTouches:[[99,'fake']]};assert(!state.valid(invalid));
});
test('V2.37 lighter bowling balls respond twice as strongly and accept gentle forward nudges',()=>{
 const {W}=create('playplace'),P=W.playplace,A=P.attractions,l=A.lanes[0],b=l.ball;assert.equal(b.mass,120);
 const hit=speed=>{A.reset(l);const c={...W.vehicle,x:l.x,y:12.12,z:l.start-5,yaw:0,vx:0,vy:0,vz:speed,driverId:'bowler'};assert(A.hitBall(b,c,1));return {phase:l.phase,speed:b.velocity.z,owner:l.owner};};
 const faster=hit(10);assert.equal(faster.phase,'rolling');assert.equal(faster.speed,17);assert.equal(faster.owner,'bowler');b.mass=240;assert.equal(hit(10).speed,8.5);assert.equal(hit(.8).phase,'ready');b.mass=120;assert.equal(hit(.8).phase,'rolling');assert.equal(hit(-10).phase,'ready');
});
test('V2.37 every solo palm instance starts with a neutral tint and coloring one leaves the others intact',()=>{
 const {W}=create('islands',true);assert(W.trees.length>500);const batches=new Set(W.trees.flatMap(t=>t.parts.map(p=>p.mesh)));assert(batches.size>=4,'Santa Luz and Ruiz foliage both included');
 const color=new T.Color();for(const mesh of batches){assert.equal(mesh.instanceColor.count,mesh.instanceMatrix.count);for(let i=0;i<mesh.instanceColor.count;i++){mesh.getColorAt(i,color);assert(color.equals(new T.Color(1,1,1)));}}
 const part=W.trees[0].parts[0],buffer=part.mesh.instanceColor.array;part.mesh.setColorAt(part.index,new T.Color(.55,.72,.75));for(let i=0;i<part.mesh.instanceColor.count;i++)if(i!==part.index){part.mesh.getColorAt(i,color);assert(color.equals(new T.Color(1,1,1)));}assert.strictEqual(part.mesh.instanceColor.array,buffer);
});

function checkWindows(W,b,{npc=true}={}){
 const root=b.group,scene=new T.Scene();scene.add(root);W.buildings=[b];W.traffic=[];
 // Match the startup renderer: it batches the house BEFORE installing nearby NPCs.
 const game=fs.readFileSync(path.join(__dirname,'../public/game.js'),'utf8'),merge=vm.runInNewContext('('+game.match(/function mergeMeshes\(parent,meshes\)\{[\s\S]*?(?=\n function optimize)/)[0]+')',{T}),meshes=[];
 root.traverse(m=>{if(m.isMesh&&m.visible)meshes.push(m);});merge(root,meshes);
 const untouched=new Map();root.traverse(m=>{if(m.isMesh&&!m.userData.v237Wall)untouched.set(m,m.geometry);});
 const shared=Array.from(W.unitBox?.attributes.position.array||[]);
 W.scene=scene;Object.assign(W.vehicle,{x:b.x,y:b.y,z:b.z,vx:0,vz:0});W.v22People.install(scene);
 root.updateMatrixWorld(true);const panes=root.userData.v237Windows;assert(panes?.length>=2,b.name+' has actual windows');
 const surfaces=[];root.traverse(m=>{if(m.userData.v237Wall)surfaces.push(m);});assert(surfaces.length);
 const scale=root.getWorldScale(new T.Vector3()).x,front=b.d/scale/2;
 const ray=(x,y,objects,start=.35,depth=.7)=>new T.Raycaster(root.localToWorld(new T.Vector3(x,y,front+start)),new T.Vector3(0,0,-1).transformDirection(root.matrixWorld),0,depth*scale).intersectObjects(objects,false);
 for(const p of panes)assert.equal(ray(p.x,p.y,surfaces).length,0,'glass has a real opening behind it');
 let wallSamples=0;const floor=(b.foundation||0)/scale;
 for(let ix=0;ix<27;ix++)for(let iy=0;iy<11;iy++){
  const x=(-.42+ix*.84/26)*b.w/scale,y=floor+.4+iy*.2;
  if(panes.some(p=>Math.abs(x-p.x)<p.w/2+.015&&Math.abs(y-p.y)<p.h/2+.015))continue;
  assert(ray(x,y,[b.body||surfaces[0]]).length,'wall between and below the windows stays solid');wallSamples++;
 }
 assert(wallSamples>120,'no giant rectangular opening');
 for(const [mesh,geometry]of untouched)assert.strictEqual(mesh.geometry,geometry,'doors, roofs, posts and mullions retain their original geometry');
 assert.deepEqual(Array.from(W.unitBox?.attributes.position.array||[]),shared,'shared boxes stay intact');
 const glazing=[];root.traverse(m=>{if(m.userData.v237Pane||m.userData.v237Glazing)glazing.push(m);});assert(glazing.length>0);for(const p of panes)assert(ray(p.x,p.y,glazing).length,'each real opening retains its glass after batching');
 for(const m of glazing){assert(m.material.transparent);assert(m.material.opacity>0&&m.material.opacity<.3);assert.equal(m.material.depthWrite,false);assert.equal(m.castShadow,false);}
 if(npc){
  const P=W.v22People,opaque=[];root.traverse(m=>{if(m.isMesh&&m.visible&&!m.material.transparent)opaque.push(m);});let visible=0;
  for(let t=0;t<20;t+=.2){P.clock=t;P.update(0,t);const n=P.records[0].inside,p=root.worldToLocal(new T.Vector3(n.x,n.y+1.66,n.z));if(!ray(p.x,p.y,opaque,.35,front+.35-p.z-.05).length)visible++;}
  assert(visible>0,'the indoor person actually passes behind the see-through windows');
 }
 assert(root.userData.v22Room.group.children.length>5,'batching preserves the separately culled room');
 const geometry=surfaces[0].geometry;W.v22People.refresh=0;W.v22People.update(0,30);assert.strictEqual(surfaces[0].geometry,geometry,'revisiting does not repeatedly cut the facade');
}
test('V2.37 real house windows reveal NPCs while doors, mullions and surrounding walls remain intact on every populated main map',()=>{
 for(const map of ['islands','peaks','city','fern']){
  const {W}=create(map);W.makeBuildings(new T.Scene());const homes=W.buildings;
  const b=homes.find(b=>b.group?.userData.v237Windows?.length&&(map!=='city'||b.house)&&b.id%3!==0);assert(b,map+' home exists');checkWindows(W,b);
  if(map==='city'){const tower=homes.find(b=>!b.house&&b.group?.userData.v237Windows?.length&&b.id%3!==0);assert(tower);checkWindows(W,tower);}
 }
});
test('V2.37 rotated and scaled Map Maker houses and themed buildings use their own window apertures',()=>{
 const paint=new Proxy({measureText:()=>({width:100})},{get:(o,k)=>o[k]||(()=>{})}),W={vehicle:{},height:()=>5,nearestRoad:()=>({p:null}),buildings:[],traffic:[],customMap:true,mapId:'custom'},ctx=vm.createContext({THREE:T,Isla:W,document:{createElement:()=>({getContext:()=>paint})}});ctx.window=ctx;
 for(const file of ['maker-core.js','maker-assets.js','v22-people-buildings.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),ctx,{filename:file});
 for(const type of ['home1','home2','restaurant','shop','police','clinic']){
  const spec=ctx.IslaMaker.types[type],o={id:type,type,x:80,z:-30,y:0,rotation:1.17,scale:1.8},group=ctx.IslaMakerAssets.object(o,W.height),b={id:1,name:type,object:o,x:o.x,z:o.z,y:5,yaw:o.rotation,w:spec.w*o.scale,d:spec.d*o.scale,h:spec.h*o.scale,group};
  checkWindows(W,b,{npc:false});
 }
});
