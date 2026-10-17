const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.THREE=require('../../public/three.min.js');
for(const f of ['world.js','physics.js','garage.js','traffic.js'])vm.runInThisContext(fs.readFileSync(__dirname+'/../../public/'+f,'utf8'));
const W=Isla,truck=W.carModels.find(m=>m.id==='truck'),idle={gas:false,brake:false,steer:0,handbrake:false,boost:false};
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
let g=W.createGarage(storage);g.credit(69999);assert(!g.choose('truck').ok);assert.equal(g.balance,69999);g.credit(1);assert(g.choose('truck').ok);assert.equal(g.balance,0);g.credit(1234);g=W.createGarage(storage);assert.equal(g.selected,'truck');assert.equal(g.balance,1234);assert(g.choose('truck').ok);assert.equal(g.balance,1234);assert(g.owned.includes('classic'));
console.log('PASS: 70,000 aura purchase, no double charge, and truck ownership survive reloads.');
W.height=W.driveHeight=()=>0;W.slope=()=>({x:0,z:0});const road={samples:[{x:0,z:-1},{x:0,z:0},{x:0,z:1}]};W.nearestRoad=(x,z)=>({d:0,p:{x,z,width:12,index:1,road}});W.buildCollisionIndex();
function reset(id,speed=0){W.garage.selected=id;W.resetVehicle(true);Object.assign(W.vehicle,{x:0,z:0,yaw:0,vx:0,vz:speed});}
function step(seconds,input){for(let i=0;i<seconds*120;i++)W.stepVehicle(1/120,{...idle,...input},i/120);return W.vehicle.vz;}
reset('classic');const classicAccel=step(5,{gas:true});reset('truck');const truckAccel=step(5,{gas:true});assert(truckAccel<classicAccel*.6);
reset('classic');const classicMax=step(100,{gas:true});reset('truck');const truckMax=step(120,{gas:true});assert(Math.abs(truckMax/classicMax-2/3)<.02);
console.log('Flat-road cruising: Classic '+(classicMax*3.6).toFixed(1)+' km/h; Truck '+(truckMax*3.6).toFixed(1)+' km/h.');
reset('truck');step(3,{brake:true});assert(W.vehicle.vz<-.5);reset('truck',15);step(2,{gas:true,steer:1});assert(W.vehicle.yaw>0);assert(Number.isFinite(W.vehicle.y));
reset('classic',20);const classicBrake=step(1,{brake:true});reset('truck',20);const truckBrake=step(1,{brake:true});assert(truckBrake>classicBrake);
reset('classic');const damage=W.damageForImpact(20);reset('truck');assert.equal(W.damageForImpact(20),damage*2);assert.equal(W.damageForImpact(12),0);assert(W.damageForImpact(60)<100);
console.log('PASS: lower acceleration/speed, heavier braking, working steering/reverse and double impact energy without one-hit buildings.');
function collision(id){reset(id);W.colliders=[{x:1.65,y:0,z:0,yaw:0,w:.5,d:8,h:4,hp:100,lastHit:-10}];W.buildCollisionIndex();step(1/120,{});return W.vehicle.x;}
assert(Math.abs(collision('classic'))<.01);assert(collision('truck')<-.01);W.colliders=[];W.buildCollisionIndex();
function trafficImpact(id){reset(id,20);W.traffic=[{x:0,y:.12,z:4,yaw:0,w:1.9,d:4.4,vx:0,vz:0,offsetX:0,offsetZ:0,driftX:0,driftZ:0,speed:0}];W.resolveTraffic();return {retained:W.vehicle.vz,pushed:W.traffic[0].driftZ};}
const light=trafficImpact('classic'),heavy=trafficImpact('truck');assert(heavy.retained>light.retained);assert(heavy.pushed>light.pushed);
console.log('PASS: the wider truck hits obstacles the Classic clears and pushes traffic harder with less speed lost.');
const gradient={addColorStop(){}};const ctx=new Proxy({createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||(()=>{})});global.document={createElement:()=>({getContext:()=>ctx})};W.scene=new THREE.Scene();
const mesh=W.makeCar(truck),remote=W.makeCar(truck,true);assert.equal(mesh.size,1.5);assert.deepEqual(mesh.root.scale.toArray(),[1.5,1.5,1.5]);assert.equal(remote.size,1.5);assert.equal(mesh.wheels.length,4);assert.equal(mesh.nitro.jets.length,2);assert.equal(W.carMesh,mesh);assert(W.carPreview(truck).includes('The Big Truck'));
console.log('PASS: local/remote pickup geometry, four wheels, two exhaust flames and garage preview build successfully.');
