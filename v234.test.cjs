'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const create=require('../scripts/source-world.cjs'),world=require('../src/world-data.json'),V=require('../public/v22-shared.js');
const {W,buildings}=create('peaks');
test('V2.34 preserves the original map area, spawn, central town plots and building IDs',()=>{
 assert.equal(W.span,5000);assert.equal(W.depth,5000);assert.equal(W.mapBounds.x,-2400);assert.equal(W.mapBounds.z,-2400);assert.equal(W.mapBounds.size,4800);
 assert.equal(W.spawn.x,2.35);assert.equal(W.spawn.z,0);assert.equal(W.height(0,0),47.02817916870117);
 const hash=crypto.createHash('sha256').update(JSON.stringify(buildings.map(b=>[b.id,b.x,b.z]))).digest('hex');assert.equal(hash,'27aaedaea1ec5f8af7c4b3809bd477307dae2aea17786d3eed60c96fb6096204');
});
test('V2.34 high ground forms one northern mountain; the four former mountains stay low',()=>{
 assert.equal(W.peaks.length,1);assert(Math.abs(W.height(0,-1040)/512.5227416992187-1.2)<.005);
 for(let z=-2200;z<=2200;z+=50)for(let x=-2200;x<=2200;x+=50){const h=W.height(x,z);if(h>200){assert(z<-400);assert(Math.hypot(x,z+1040)<850);}}
 for(const [x,z]of [[1000,-325],[615,875],[-650,820],[-1030,-325]])for(let dz=-100;dz<=100;dz+=50)for(let dx=-100;dx<=100;dx+=50)assert(W.height(x+dx,z+dz)<80);
});
test('V2.34 server height and 240 personal coins agree with the remade map',()=>{
 const data=world.maps.peaks,height=V.coinHeight(data.coinWorld.terrain),coins=V.visitCoins(data,'v234-map-remake');assert.equal(coins.length,240);
 for(const [x,z]of [[0,-1040],[0,0],[1000,-325],[615,875],[-650,820],[-1030,-325]])assert(Math.abs(height(x,z)-W.height(x,z))<.026);
 for(const coin of coins){assert(coin.x>=-2400&&coin.x<=2400&&coin.z>=-2400&&coin.z<=2400);assert(coin.y>=height(coin.x,coin.z)+.76);}
});
