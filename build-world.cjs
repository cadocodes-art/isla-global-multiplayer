'use strict';
const fs=require('node:fs'),path=require('node:path');
const {W,buildings}=require('./source-world.cjs')();
W.initTraffic();
const round=n=>Math.round(n*10000)/10000;
const routes=W.trafficRoutes.map(r=>({length:r.length,lengths:r.lengths,lanes:[-1,1].map(direction=>r.p.map((p,i)=>{
 const q=r.p[(i+1)%r.p.length],yaw=Math.atan2(q.x-p.x,q.z-p.z)+(direction<0?Math.PI:0),x=p.x+Math.cos(yaw)*2.35,z=p.z-Math.sin(yaw)*2.35;
 return [round(x),round(W.driveHeight(x,z)+.12),round(z),round(yaw)];
}))}));
const traffic=W.traffic.map(t=>Object.fromEntries(['id','distance','direction','cruise','speed','offsetX','offsetZ','driftX','driftZ','stun'].map(k=>[k,t[k]]).concat([['route',W.trafficRoutes.indexOf(t.route)]])));
const spawns=Array.from({length:32},(_,slot)=>{const p=W.roads[0].samples[slot*3],q=W.roads[0].samples[slot*3+1],yaw=Math.atan2(q.x-p.x,q.z-p.z),x=p.x+Math.cos(yaw)*2.35,z=p.z-Math.sin(yaw)*2.35;return {x,y:W.driveHeight(x,z)+.12,z,yaw};});
const data={buildings,cars:W.carModels.map(m=>({id:m.id,color:m.color,mass:m.mass||1})),bridge:{start:W.bridge.start,end:W.bridge.end},routes,traffic,spawns};
const out=path.resolve(__dirname,'../src/world-data.json');fs.writeFileSync(out,JSON.stringify(data));
console.log('Prepared '+buildings.length+' buildings, '+traffic.length+' traffic cars, and '+spawns.length+' global spawn points.');
