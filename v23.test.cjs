'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const T=require('../public/three.min.js'),V=require('../public/v22-shared.js');
test('NPC shirt color buffers reserve every torso and sleeve before anybody is visible',()=>{
 const {W}=require('../scripts/source-world.cjs')('fern'),scene=new T.Scene();W.scene=scene;W.traffic=[];W.makeBuildings(scene);Object.assign(W.vehicle,{x:1e7,y:0,z:1e7,vx:0,vz:0});W.v22People.install(scene);const P=W.v22People;
 assert.equal(P.visibleCount,0);assert(P.shirt.instanceColor);assert.equal(P.shirt.instanceColor.count,P.maxPeople*3);const colors=P.shirt.instanceColor.array;
 const building=W.buildings.find(b=>b.group&&b.w>5&&b.d>5);Object.assign(W.vehicle,{x:building.x,y:building.y,z:building.z});P.refresh=0;P.update(.1,1);assert(P.visibleCount>0);assert.equal(P.shirt.count,P.visibleCount*3);assert.strictEqual(P.shirt.instanceColor.array,colors);
 for(let i=0;i<P.shirt.count;i++){const m=new T.Matrix4();P.shirt.getMatrixAt(i,m);assert(m.elements.every(Number.isFinite));assert(Math.abs(m.determinant())>.005);for(let c=0;c<3;c++)assert(colors[i*3+c]>0&&colors[i*3+c]<=1);}
 Object.assign(W.vehicle,{x:1e7,z:1e7});P.refresh=0;P.update(.1,2);assert.equal(P.shirt.count,0);Object.assign(W.vehicle,{x:building.x,z:building.z});P.refresh=0;P.update(.1,3);assert(P.shirt.count>0);assert.strictEqual(P.shirt.instanceColor.array,colors);
});
test('handbrake turns count with low lateral slip, while straight braking, idling, flight and water do not',()=>{
 const c={grounded:true,waterMode:'dry',vx:0,vz:20,slip:.3,yawRate:.35};assert(V.isDrifting(c,{handbrake:true,steer:.4}));assert(!V.isDrifting(c,{handbrake:false,steer:.4}));assert(!V.isDrifting({...c,yawRate:0},{handbrake:true,steer:0}));
 for(const change of [{grounded:false},{waterMode:'skimming'},{vz:2},{wall:{}},{yawRate:0}])assert(!V.isDrifting({...c,...change},{handbrake:true,steer:.4}));
 assert(V.isDrifting({...c,slip:3},{steer:.4}));assert(V.isDrifting({...c,slip:3},{handbrake:true,steer:0}));
});
test('profile rank markup omits hidden categories and zero-star ranks, and can be disabled',()=>{
 const C={escape:s=>String(s)},ctx=vm.createContext({IslaCommunity:C});vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../public/v23-leaderboard-ui.js'),'utf8'),ctx);
 const a={showRanks:true,stars:0,ranks:{aura:12,iscoins:null,stars:null}},html=C.profileRankPanel(a);assert.match(html,/#12/);assert(!html.includes('Iscoins'));assert(!html.includes('Stars'));assert.equal(C.profileRankPanel({...a,showRanks:false}),'');assert.equal(C.profileRankPanel({...a,ranks:null}),'');assert.match(C.profileRankPanel({...a,stars:3,ranks:{stars:4}}),/Stars/);
});
