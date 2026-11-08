'use strict';
const fs=require('node:fs'),path=require('node:path');
// Row deltas retain the native terrain detail without a large JSON number array.
function packHeights(heights,nx){const bytes=[];let last=0;for(let i=0;i<heights.length;i++){const value=Math.round(heights[i]*20),delta=value-(i%nx?last:0);let n=delta<0?-delta*2-1:delta*2;do{bytes.push((n&127)|(n>127?128:0));n>>>=7;}while(n);last=value;}return Buffer.from(bytes).toString('base64');}
function build(mapId){const {W,buildings,trees,rocks,playground,coins,bounds,pools}=require('./source-world.cjs')(mapId,true);
W.initTraffic();
const round=n=>Math.round(n*10000)/10000;
const routes=W.trafficRoutes.map(r=>({length:r.length,lengths:r.lengths,lanes:[-1,1].map(direction=>r.p.map((p,i)=>{
 const q=r.p[(i+1)%r.p.length],yaw=Math.atan2(q.x-p.x,q.z-p.z)+(direction<0?Math.PI:0),x=p.x+Math.cos(yaw)*2.35,z=p.z-Math.sin(yaw)*2.35;
 return [round(x),round((W.trafficHeight||W.driveHeight)(x,z)+.12),round(z),round(yaw)];
}))}));
const traffic=W.traffic.map(t=>Object.fromEntries(['id','distance','direction','cruise','speed','offsetX','offsetZ','driftX','driftZ','stun'].map(k=>[k,t[k]]).concat([['route',W.trafficRoutes.indexOf(t.route)]])));
const spawns=W.globalSpawns||Array.from({length:32},(_,slot)=>{const p=W.roads[0].samples[slot*3],q=W.roads[0].samples[slot*3+1],yaw=Math.atan2(q.x-p.x,q.z-p.z),x=p.x+Math.cos(yaw)*2.35,z=p.z-Math.sin(yaw)*2.35;return {x,y:W.driveHeight(x,z)+.12,z,yaw};});
const step=16,nx=Math.ceil(W.span/step)+1,nz=Math.ceil(W.depth/step)+1,ground={x:W.minX,z:W.minZ,step,nx,nz,h:[]};for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)ground.h.push(Math.round(W.height(ground.x+i*step,ground.z+j*step)*100)/100);
// Preserve the rendered terrain grid to within 2.5 cm for per-visit server placement.
const terrain=W.inferno?{kind:'inferno',map:mapId}:mapId==='playplace'?{kind:'playplace',floor:W.playplace.floor,pits:W.playplace.pits,pools}:{kind:'grid',x:W.minX,z:W.minZ,step:W.step,nx:W.N,nz:W.NZ,scale:.05,packed:packHeights(W.heights,W.N)};
const coinWorld={terrain,bounds,roads:W.roads.map(r=>({width:r.width,samples:r.samples.map(p=>({x:round(p.x),z:round(p.z),y:round(p.y),width:p.width||r.width}))}))};
const data={mapId,ground:W.inferno?{kind:'inferno',map:mapId}:ground,rocks,coins,coinWorld,...(playground?{playground}:{}),buildings,trees,cars:W.carModels.map(m=>({...m,mass:m.mass||1})),bridge:{start:W.bridge.start,end:W.bridge.end},routes,traffic,spawns};

console.log('Prepared '+buildings.length+' buildings, '+traffic.length+' traffic cars, and '+spawns.length+' global spawn points for '+mapId+'.');return data;}
const data=build('islands');data.maps={city:build('city'),peaks:build('peaks'),playplace:build('playplace'),fern:build('fern'),inferno:build('inferno'),'inferno-vent':build('inferno-vent')};
fs.writeFileSync(path.resolve(__dirname,'../src/world-data.json'),JSON.stringify(data));
