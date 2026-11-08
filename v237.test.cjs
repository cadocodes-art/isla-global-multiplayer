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
