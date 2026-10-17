'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Run the same terrain and traffic model as the browser, without a renderer.
module.exports = function createWorld(mapId = 'islands', includeTrees = false) {
  const THREE = require('../public/three.min.js');
  const paint = new Proxy({}, { get: (o, k) => o[k] ?? (() => {}), set: (o, k, v) => (o[k] = v, true) });
  const context = vm.createContext({ THREE, console, document: { createElement: () => ({ getContext: () => paint }) } });
  context.window = context;context.IslaMapId=mapId;
  for (const file of ['world.js', 'islands.js', 'ramps.js', 'physics.js', 'garage.js', 'traffic.js', 'maps.js', 'peaks.js', 'player-rules.js', 'utility-cars.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', file), 'utf8'), context, { filename: file });
  }
  const W = context.Isla;
  W.initTerrain();
  // The road texture consumes these seeded samples before browser building placement.
  for (let i = 0; i < 256 * 256; i++) W.rand();
  W.makeBuildings(new THREE.Scene());
  const buildings = Array.from(W.buildings, b => Object.fromEntries(['id', 'x', 'y', 'z', 'w', 'd', 'h', 'yaw'].map(k => [k, b[k]])));
  if(includeTrees){const scene=new THREE.Scene();W.makeRamps(scene);W.makeVegetation(scene);W.makeRuizDetails?.(scene);}
  const trees=Array.from(W.trees,t=>Object.fromEntries(['treeId','x','y','z','h','r'].map(k=>[k,t[k]])));
  W.buildings = []; W.colliders = [];
  return { W, buildings, trees };
};
