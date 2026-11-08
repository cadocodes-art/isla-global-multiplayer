'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const create=require('../scripts/source-world.cjs'),world=require('../src/world-data.json'),V=require('../public/v22-shared.js');
const {W,buildings}=create('peaks');
test('V2.34 every village roof faces outward and stays above upright walls after mesh merging',()=>{
 const T=require('../public/three.min.js'),fs=require('node:fs'),vm=require('node:vm'),scene=new T.Scene();
 const source=fs.readFileSync(require.resolve('../public/game.js'),'utf8'),merge=vm.runInNewContext('('+source.match(/function mergeMeshes\(parent,meshes\)\{[\s\S]*?(?=\n function optimize)/)[0]+')',{T});
 const houses=create('peaks').W;houses.makeBuildings(scene);scene.updateMatrixWorld(true);assert.equal(houses.buildings.length,131);
 function check(b){
  const up=new T.Vector3(0,1,0).transformDirection(b.group.matrixWorld);assert(up.distanceTo(new T.Vector3(0,1,0))<1e-10);
  const ceiling=b.y+b.foundation+b.floors*3.2;
  for(const side of [-1,1]){
   const start=new T.Vector3(side*(b.w+2)*.25,b.foundation+b.floors*3.2+10,0).applyMatrix4(b.group.matrixWorld);
   const hit=new T.Raycaster(start,new T.Vector3(0,-1,0)).intersectObject(b.group,true)[0];
   assert(hit&&Math.abs(hit.point.y-(ceiling+1.55))<.001,'roof slope above walls for house '+b.id);
   const front=new T.Vector3(0,b.foundation+b.floors*3.2+1.5,side*(b.d/2+12)).applyMatrix4(b.group.matrixWorld),dir=new T.Vector3(0,0,-side).transformDirection(b.group.matrixWorld);
   const gable=new T.Raycaster(front,dir).intersectObject(b.group,true)[0];assert(gable,'gable visible for house '+b.id);
   assert(Math.abs(b.group.worldToLocal(gable.point.clone()).z-side*(b.d+2)/2)<.001);
  }
 }
 for(const b of houses.buildings){check(b);const meshes=[];b.group.traverse(o=>{if(o.isMesh)meshes.push(o);});merge(b.group,meshes);scene.updateMatrixWorld(true);check(b);}
});
test('V2.34 preserves the original map area, spawn, central town plots and building IDs',()=>{
 assert.equal(W.span,5000);assert.equal(W.depth,5000);assert.equal(W.mapBounds.x,-2400);assert.equal(W.mapBounds.z,-2400);assert.equal(W.mapBounds.size,4800);
 assert.equal(W.spawn.x,2.35);assert.equal(W.spawn.z,0);assert.equal(W.height(0,0),47.02817916870117);
 const hash=crypto.createHash('sha256').update(JSON.stringify(buildings.map(b=>[b.id,b.x,b.z]))).digest('hex');assert.equal(hash,'27aaedaea1ec5f8af7c4b3809bd477307dae2aea17786d3eed60c96fb6096204');
});
test('V2.34 high ground forms one northern mountain; the former mountains stay below the new plateau height',()=>{
 assert.equal(W.peaks.length,1);assert(Math.abs(W.height(0,-1040)/512.5227416992187-1.2)<.005);
 for(let z=-2200;z<=2200;z+=50)for(let x=-2200;x<=2200;x+=50){const h=W.height(x,z);if(h>200){assert(z<-400);assert(Math.hypot(x,z+1040)<850);}}
 for(const [x,z]of [[1000,-325],[615,875],[-650,820],[-1030,-325]])for(let dz=-100;dz<=100;dz+=50)for(let dx=-100;dx<=100;dx+=50)assert(W.height(x+dx,z+dz)<=111.01);
});
test('V2.34 server height and 240 personal coins agree with the remade map',()=>{
 const data=world.maps.peaks,height=V.coinHeight(data.coinWorld.terrain),coins=V.visitCoins(data,'v234-map-remake');assert.equal(coins.length,240);
 for(const [x,z]of [[0,-1040],[0,1400],[-200,1330],[200,1470],[0,-1775],[0,0],[1000,-325],[615,875],[-650,820],[-1030,-325]])assert(Math.abs(height(x,z)-W.height(x,z))<.026);
 for(const coin of coins){assert(coin.x>=-2400&&coin.x<=2400&&coin.z>=-2400&&coin.z<=2400);assert(coin.y>=height(coin.x,coin.z)+.76);}
});
