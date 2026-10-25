'use strict';
const fs=require('node:fs'),path=require('node:path');
function build(mapId){const {W,buildings,trees,playground}=require('./source-world.cjs')(mapId,true);
W.initTraffic();
const round=n=>Math.round(n*10000)/10000;
const routes=W.trafficRoutes.map(r=>({length:r.length,lengths:r.lengths,lanes:[-1,1].map(direction=>r.p.map((p,i)=>{
 const q=r.p[(i+1)%r.p.length],yaw=Math.atan2(q.x-p.x,q.z-p.z)+(direction<0?Math.PI:0),x=p.x+Math.cos(yaw)*2.35,z=p.z-Math.sin(yaw)*2.35;
 return [round(x),round((W.trafficHeight||W.driveHeight)(x,z)+.12),round(z),round(yaw)];
}))}));
const traffic=W.traffic.map(t=>Object.fromEntries(['id','distance','direction','cruise','speed','offsetX','offsetZ','driftX','driftZ','stun'].map(k=>[k,t[k]]).concat([['route',W.trafficRoutes.indexOf(t.route)]])));
const spawns=Array.from({length:32},(_,slot)=>{const p=W.roads[0].samples[slot*3],q=W.roads[0].samples[slot*3+1],yaw=Math.atan2(q.x-p.x,q.z-p.z),x=p.x+Math.cos(yaw)*2.35,z=p.z-Math.sin(yaw)*2.35;return {x,y:W.driveHeight(x,z)+.12,z,yaw};});
const data={mapId,...(playground?{playground}:{}),buildings,trees,cars:W.carModels.map(m=>({...m,mass:m.mass||1})),bridge:{start:W.bridge.start,end:W.bridge.end},routes,traffic,spawns};

console.log('Prepared '+buildings.length+' buildings, '+traffic.length+' traffic cars, and '+spawns.length+' global spawn points for '+mapId+'.');return data;}
const data=build('islands');data.maps={city:build('city'),peaks:build('peaks'),playplace:build('playplace')};
fs.writeFileSync(path.resolve(__dirname,'../src/world-data.json'),JSON.stringify(data));
