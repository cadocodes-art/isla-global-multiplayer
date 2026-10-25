'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Run the same terrain and traffic model as the browser, without a renderer.
module.exports = function createWorld(mapId = 'islands', includeTrees = false) {
  const THREE = require('../public/three.min.js');
  const paint = new Proxy({measureText:s=>({width:String(s).length*20}),createRadialGradient:()=>({addColorStop(){}})}, { get: (o, k) => o[k] ?? (() => {}), set: (o, k, v) => (o[k] = v, true) });
  const context = vm.createContext({ THREE, console, document: { createElement: () => ({ getContext: () => paint }) } });
  context.window = context;context.IslaMapId=mapId;
  for (const file of ['v20-rules.js', 'world.js', 'islands.js', 'ramps.js', 'physics.js', 'garage.js', 'traffic.js', 'maps.js', 'peaks.js', 'player-rules.js', 'utility-cars.js', 'maker-core.js', 'maker-assets.js', 'maker-driving.js', 'playplace-bodies.js', 'playplace-balls.js', 'playplace-shared.js', 'playplace.js', 'playplace-v193.js', 'playplace-v20-shared.js', 'playplace-v20.js', 'waterpark-v201.js', 'fern-valley.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', file), 'utf8'), context, { filename: file });
  }
  const W = context.Isla;
  W.initTerrain();
  // The road texture consumes these seeded samples before browser building placement.
  for (let i = 0; i < 256 * 256; i++) W.rand();
  W.makeBuildings(new THREE.Scene());
  const buildings = Array.from(W.buildings, b => Object.fromEntries(['id', 'x', 'y', 'z', 'w', 'd', 'h', 'yaw', 'foundation'].map(k => [k, b[k]])));
  if(includeTrees){const scene=new THREE.Scene();W.makeRamps(scene);W.makeVegetation(scene);W.makeRuizDetails?.(scene);}
  const trees=Array.from(W.trees,t=>Object.fromEntries(['treeId','x','y','z','h','r'].map(k=>[k,t[k]])));
  let playground=null;if(mapId==='playplace'){W.makeRoadDetails(new THREE.Scene());const P=W.playplace;playground={pits:P.pits,foam:P.bodies.foam.map(b=>({x:b.x,y:b.y,z:b.z,w:b.w,h:b.h,d:b.d,pitch:b.pitch,roll:b.roll,yaw:b.yaw,index:b.index,tint:b.tint})),platforms:P.bodies.platforms.filter(b=>!b.seesaw).map(b=>b.plan),seesaws:P.seesaws.map(b=>({x:b.x,z:b.z,yaw:b.baseYaw})),ropes:P.ropes.map(r=>({x:r.x,z:r.z,length:r.length})),roads:P.roads.map(r=>({...r,samples:r.samples.map(({road,...p})=>p)})),colliders:W.colliders.map(b=>Object.fromEntries(['kind','x','y','z','w','h','d','yaw','preciseHeight'].map(k=>[k,b[k]]))),ramps:W.ramps.map(({group,...r})=>r)};}
  W.buildings = []; W.colliders = [];
  const rocks=Array.from(W.rocks||[],b=>Object.fromEntries(['rockId','x','y','z','r'].map(k=>[k,b[k]])));return { W, buildings, trees, rocks, playground };
};
