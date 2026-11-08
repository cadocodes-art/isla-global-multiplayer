'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare'),{WebSocket}=require('ws');
const V=require('../public/v22-shared.js'),world=require('../src/world-data.json');
const model=(id='classic',level=1)=>V.spec(world.cars.find(c=>c.id===id),level);
function local(spec=model()){
 const W={clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),mix:(a,b,t)=>a+(b-a)*t,colliders:[],getCarSpec:()=>spec};
 const context=vm.createContext({Isla:W});
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../public/physics.js'),'utf8'),context);
 return W;
}
const building=()=>({id:0,x:0,y:0,z:0,yaw:0,w:20,d:10,h:6,hp:100,maxHp:100,lastHit:-10,collapsed:false});
test('V2.23 faster rams keep increasing above the former damage cap for every car upgrade',()=>{
 for(const base of world.cars)for(const level of [1,2,3]){
  const W=local(model(base.id,level));
  if(base.beast){assert.equal(W.damageForImpact(3.99),0);assert.equal(W.damageForImpact(4),100);continue;}
  assert.equal(W.damageForImpact(14.99),0);assert.equal(W.damageForImpact(15),0);
  let previous=0;
  for(const speed of [20,30,40,50,60,80,120,190]){
   const damage=W.damageForImpact(speed);
   assert(damage>previous,base.id+' level '+level+' at '+speed+' m/s');previous=damage;
  }
 }
 const W=local();
 const slow=building(),medium=building(),fast=building();
 W.hitBuilding(slow,100/3.6,1);W.hitBuilding(medium,150/3.6,1);W.hitBuilding(fast,200/3.6,1);
 assert(slow.hp>76&&slow.hp<77);assert(medium.hp>35&&medium.hp<36);
 assert.equal(fast.hp,0);assert(fast.collapsed);
 assert(local(model('truck')).damageForImpact(30)>W.damageForImpact(30));
 assert(local(model('truck',3)).damageForImpact(30)>local(model('truck',2)).damageForImpact(30));
});
test('actual wall collisions use inward speed, while cooldown and collapse reward remain single-shot',()=>{
 function ram(vx,vz){
  const W=local(),b=building();W.colliders=[b];W.buildCollisionIndex();
  Object.assign(W.vehicle,{x:0,y:.12,z:-7,yaw:0,vx,vy:0,vz});
  W.collideVehicle(W.vehicle,1);return b;
 }
 assert(ram(0,40).hp>0);assert.equal(ram(0,60).hp,0);
 assert.equal(ram(60,10).hp,100,'fast grazing contact is not a hard ram');
 assert.equal(ram(60,0).hp,100,'sideways scraping cannot grind down buildings');
 const W=local(),b=building();let rewards=0,collapses=0;
 W.awardV22=kind=>{assert.equal(kind,'ram');rewards++;};W.onCollapse=()=>collapses++;
 W.hitBuilding(b,30,1);const hp=b.hp;
 assert.equal(W.hitBuilding(b,60,1.1),0);assert.equal(b.hp,hp);
 W.hitBuilding(b,60,1.8);assert.equal(b.hp,0);assert.equal(rewards,1);assert.equal(collapses,1);
 W.hitBuilding(b,60,3);assert.equal(rewards,1);assert.equal(collapses,1);
});

let mf,url;const sockets=[],delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
before(async()=>{
 mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'v223-test',modules:true,scriptPath:path.resolve(__dirname,'../build/worker.js'),compatibilityDate:'2026-10-16',durableObjects:{GLOBAL:{className:'GlobalRoom',useSQLite:true}}}],cf:false}));
 url=await mf.ready;
});
after(async()=>{for(const ws of sockets)ws.terminate();await mf?.dispose();});
async function join(name){
 const ws=new WebSocket(new URL('/ws',url).href.replace('http:','ws:')),messages=[];sockets.push(ws);
 ws.on('message',data=>messages.push(JSON.parse(data)));
 await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 const c={messages,send:data=>ws.send(JSON.stringify(data)),wait:async(type,predicate=()=>true)=>{
  const end=Date.now()+5000;
  while(Date.now()<end){const m=messages.find(m=>m.type===type&&predicate(m));if(m)return m;await delay(10);}
  throw Error('Missing '+type);
 }};
 c.send({type:'join',v:3,name});c.welcome=await c.wait('welcome');return c;
}
test('global multiplayer applies the same speed damage, validates hits, and preserves it for late joiners',async()=>{
 assert.equal((await (await fetch(new URL('/healthz',url))).json()).release,'2.36');
 const driver=await join('Ram_Tester'),viewer=await join('Ram_Viewer');
 const cases=[['classic',1,100/3.6],['classic',1,150/3.6],['classic',1,200/3.6],['truck',2,100/3.6],['truck',3,80/3.6],['nuker',2,35],['beast',1,4]];
 const expected=[];
 for(let i=0;i<cases.length;i++){
  const [car,upgradeLevel,speed]=cases[i],b=world.buildings[i],spec=model(car,upgradeLevel),W=local(spec),copy=building();
  W.hitBuilding(copy,speed,1);expected.push(copy.hp);
  await delay(80);
  driver.send({type:'state',state:{...driver.welcome.state,car,upgradeLevel,parked:false,x:b.x,y:b.y+.12,z:b.z+b.d/2+3,vx:0,vz:-speed,speed}});
  driver.send({type:'hit',id:b.id,speed});
  const hit=await viewer.wait('building',m=>m.id===b.id);
  assert(Math.abs(hit.hp-copy.hp)<1e-8,car+' level '+upgradeLevel);
  assert.equal(hit.actor,driver.welcome.id);
  driver.send({type:'hit',id:b.id,speed});
 }
 const b=world.buildings[cases.length];await delay(80);
 driver.send({type:'state',state:{...driver.welcome.state,car:'classic',parked:false,x:b.x,y:b.y+.12,z:b.z+b.d/2+3,vx:0,vz:0,speed:0}});
 for(const speed of [-1,14,191,null,150])driver.send({type:'hit',id:b.id,speed});
 driver.send({type:'hit',id:world.buildings.length-1,speed:20});
 driver.send({type:'ping',at:223});await driver.wait('pong',m=>m.at===223);
 assert(!viewer.messages.some(m=>m.type==='building'&&m.id===b.id));
 const late=await join('Ram_Late');
 for(let i=0;i<expected.length;i++)assert(Math.abs(late.welcome.hp[i]-expected[i])<1e-8);
 assert.equal(late.welcome.hp[b.id],100);
 assert.equal(late.welcome.hp.at(-1),100);
 assert.equal(viewer.messages.filter(m=>m.type==='building').length,cases.length,'repeated contacts cannot deal extra damage');
});
