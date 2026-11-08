'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const V=require('../public/v22-shared.js');

test('V2.33 server terrain stays within 2.5 cm and two visits get the map-specific number of safe slots',()=>{
 const world=require('../src/world-data.json'),source=require('../scripts/source-world.cjs');
 for(const id of ['islands','city','peaks','playplace','fern']){
  const data=id==='islands'?world:world.maps[id],{W}=source(id),height=V.coinHeight(data.coinWorld.terrain),a=V.visitCoins(data,'visit-A'),b=V.visitCoins(data,'visit-B');
  const count=id==='playplace'?100:240;assert.equal(a.length,count,id);assert.equal(b.length,count,id);assert.deepEqual(a,V.visitCoins(data,'visit-A'));assert.notDeepEqual(a,b);
  assert.deepEqual(a.map(c=>c.id),b.map(c=>c.id),'cooldown slots stay stable');
  assert(a.filter((c,i)=>Math.hypot(c.x-b[i].x,c.z-b[i].z)>10).length>count*.9,id+' fresh positions');
  for(const c of [...a,...b]){assert(Math.abs(height(c.x,c.z)-W.height(c.x,c.z))<=.026,id+' rendered terrain agreement');assert([1,5,10].includes(c.value));if(c.value!==10)assert(c.y>=W.height(c.x,c.z)+.76,id+' reachable above surface');}
  for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)assert(Math.hypot(a[i].x-a[j].x,a[i].z-a[j].z)>=32-1e-8);
 }
});

test('V2.33 starting the drive and overlapping initialization reuse one account visit',async()=>{
 let calls=0;function page(){const c=vm.createContext({location:{protocol:'https:',search:''},Isla:{mapId:'islands'},URLSearchParams,URL,console});c.window=c;vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/community-api.js'),'utf8'),c);c.IslaCommunity.api=async()=>({run:'visit-'+(++calls),eligible:true});return c.IslaCommunity;}
 const a=page(),[first,second]=await Promise.all([a.startRun(),a.startRun()]);assert.equal(calls,1);assert.equal(first.run,second.run);assert.equal((await a.startRun()).run,first.run);assert.equal(calls,1);
 assert.notEqual((await page().startRun()).run,first.run);assert.equal(calls,2);
});

test('V2.33 guest visits receive fresh seeds; repeated initialization within a page keeps its seed',()=>{
 const seeds=[],stop=Error('captured layout');function page(){const elem={setAttribute(){},append(){},classList:{toggle(){}}},W={garage:{iscoins:0},mapId:'islands',mapBounds:{x:-900,z:-900,size:1800},roads:[],buildings:[],height:()=>1},context=vm.createContext({Isla:W,IslaCommunity:{},IslaV22:{normalize:g=>g,coins:(...args)=>{seeds.push(args[5]);throw stop;}},crypto,THREE:{Object3D:class{}},document:{createElement:()=>elem,getElementById:()=>elem,body:elem,querySelectorAll:()=>[]}});vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/v22-economy-client.js'),'utf8'),context);return W;}
 const a=page();assert.throws(()=>a.initV22Economy(),e=>e===stop);assert.throws(()=>a.initV22Economy(),e=>e===stop);assert.throws(()=>page().initV22Economy(),e=>e===stop);assert.equal(seeds[0],seeds[1]);assert.notEqual(seeds[0],seeds[2]);assert(seeds.every(s=>typeof s==='string'&&s.length>10));
});
