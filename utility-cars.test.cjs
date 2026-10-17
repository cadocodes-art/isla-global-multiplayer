const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function game(){
 const THREE=require('../public/three.min.js'),gradient={addColorStop(){}},canvas=new Proxy({createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||(()=>{})});
 const context=vm.createContext({THREE,console,document:{createElement:()=>({getContext:()=>canvas})}});context.window=context;
 for(const n of ['world','physics','player-rules','garage','traffic','utility-cars'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../public/'+n+'.js'),'utf8'),context);
 const W=context.Isla;W.scene=new THREE.Scene();W.height=W.driveHeight=()=>0;W.slope=()=>({x:0,z:0});const road={samples:[{x:0,z:-1},{x:0,z:0},{x:0,z:1}]};W.nearestRoad=(x,z)=>({d:0,p:{x,z,width:12,index:1,road}});
 const reset=(id,speed=0)=>{W.garage.selected=id;W.resetVehicle(true);Object.assign(W.vehicle,{x:0,z:0,y:.12,yaw:0,vx:0,vz:speed});};
 let time=0;const step=(seconds,controls={})=>{for(let i=0;i<Math.round(seconds*120);i++){time+=1/120;W.stepVehicle(1/120,{gas:1,brake:0,handbrake:false,steer:0,boost:false,...controls},time);}return W.vehicle;};
 const building=(id=0)=>({id,x:0,y:0,z:8,w:20,d:8,h:80,yaw:0,hp:100,collapsed:false,lastHit:-99});
 W.buildCollisionIndex();return {W,context,THREE,reset,step,building};
}
test('utility cars charge their prices once, preserve paint, and have the requested physical features',()=>{
 const {W}=game(),memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};W.garage=W.createGarage(storage);W.garage.credit(770000);
 for(const [id,price,size,wheels]of [['firetruck',135000,1.4,4],['stick',315000,1,4],['beast',320000,1.65,6]]){
  const before=W.garage.balance;assert(W.garage.choose(id).ok);assert.equal(W.garage.balance,before-price);W.garage.choose(id);assert.equal(W.garage.balance,before-price);
  for(const remote of [false,true]){const mesh=W.makeCar(W.getCarSpec(),remote);assert.equal(mesh.size,size);assert.equal(mesh.wheels.length,wheels);if(id==='stick')assert(mesh.wheels.every(w=>w.spin.children.some(c=>c.material?.isMeshPhysicalMaterial&&c.material.color.g>c.material.color.r*2)));}
  assert(W.carPreview(W.getCarSpec()).includes(W.getCarSpec().name));
 }
 W.garage.setColor('#123456');W.garage=W.createGarage(storage);assert.equal(W.garage.balance,0);assert.equal(W.garage.getColor(),'#123456');assert.equal(W.carModels.find(m=>m.id==='truck').price,70000);
});
test('all three utility cars reach and respect their nitro speed limits',()=>{
 const {W,context,reset,step}=game();vm.runInContext('Math.random=()=>.999999',context);
 for(const [id,kph]of [['stick',270],['firetruck',202],['beast',240]]){reset(id,100/3.6);step(6.9,{boost:true});const actual=Math.hypot(W.vehicle.vx,W.vehicle.vz)*3.6;console.log(id+' nitro '+actual.toFixed(2));assert(actual>=kph-.1&&actual<=kph+.01);}
});
test('StickCar attaches during a real collision, climbs 2–4 seconds then slides to ground without looping',()=>{
 const {W,context,reset,step,building}=game();const b=building();W.buildings=W.colliders=[b];W.buildCollisionIndex();
 for(const random of [0,.5,.99999]){vm.runInContext('Math.random=()=>'+random,context);reset('stick',12);step(.25);assert.equal(W.vehicle.wallMode,'climbing');assert(Math.abs(W.vehicle.wall.left+W.vehicle.wall.age-(2+random*2))<.001);const y=W.vehicle.y;step(1.5);assert(W.vehicle.y>y+10);assert.equal(b.hp,100);assert.equal(W.vehicle.pitch,Math.PI/2);step(W.vehicle.wall.left+.02);assert.equal(W.vehicle.wallMode,'sliding');step(7);assert.equal(W.vehicle.wallMode,'');assert(W.vehicle.y<.5);assert.equal(W.vehicle.wallBlocked,b);}
 reset('classic',12);step(.3);assert.equal(W.vehicle.wallMode,'');
 reset('stick',12);step(.25);step(.1,{gas:0});assert.equal(W.vehicle.wallMode,'sliding');b.collapsed=true;step(.01);assert.equal(W.vehicle.wallMode,'');
});
test('Beast rams buildings in one hit, crushes traffic and topples trees while keeping momentum',()=>{
 const {W,reset,step,building,THREE}=game(),b=building();W.buildings=W.colliders=[b];W.buildCollisionIndex();reset('beast',20);step(.22);assert.equal(b.hp,0);assert(b.collapsed);assert(W.vehicle.vz>19);
 const t={x:0,y:.12,z:4,w:1.9,d:4.4,yaw:0,vx:0,vz:0,speed:0,offsetX:0,offsetZ:0,driftX:0,driftZ:0};W.traffic=[t];reset('beast',12);W.resolveTraffic();assert(t.wrecked&&t.burning);assert.equal(W.vehicle.vz,12);
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,7,1),W.mat('#887755'),1),original=new THREE.Matrix4().makeTranslation(0,3.5,3);mesh.setMatrixAt(0,original);const tree=W.registerTree({kind:'tree',x:0,y:0,z:3,r:.35,h:7},[{mesh,index:0}]);W.colliders=[tree];W.buildCollisionIndex();reset('beast',12);step(.1);assert(tree.collapsed);const fallen=new THREE.Matrix4();mesh.getMatrixAt(0,fallen);assert.notDeepEqual(fallen.elements,original.elements);assert(W.vehicle.vz>11);W.restoreTrees();assert(!tree.collapsed);mesh.getMatrixAt(0,fallen);assert.deepEqual(fallen.elements,original.elements);
 reset('classic');assert(W.damageForImpact(20)<100);
});
test('both hoses wet nearby cars, leave droplet decals, respect walls, and extinguish wrecks',()=>{
 const {W,context,reset,THREE}=game(),R=context.IslaRules;reset('firetruck');
 const left={x:-8,y:.12,z:-.5,wetTime:0,wrecked:true,burning:true},right={x:8,y:.12,z:-.5,wetTime:0,wrecked:true,burning:true},behind={x:0,y:.12,z:10,wetTime:0,burning:true};W.traffic=[left,right,behind];
 W.updateUtilityEffects(.05);assert(left.wetTime>17&&right.wetTime>17);assert(!left.burning&&!right.burning);assert(behind.burning);assert(left.wrecked);assert(W.scene.children.filter(c=>c.material?.isMeshPhysicalMaterial&&c.material.map).length>=4,'wet droplet decals on cars and ground');assert(W.scene.children.some(c=>c.isPoints&&c.geometry.drawRange.count>0),'visible spray particles');
 const b={id:0,x:6,y:0,z:0,w:2,d:12,h:10,yaw:0};const jets=R.hoseJets(W.vehicle,[b],()=>0),blocked=jets.find(j=>j.dx>0);assert.equal(blocked.building,0);assert(Math.abs(blocked.end.x-5)<.01);assert(!R.inHose(blocked,right),'wall blocks downstream spray');
 W.garage.selected='classic';W.updateUtilityEffects(19);assert.equal(left.wetTime,0);assert.equal(W.scene.children.filter(c=>c.material?.isMeshPhysicalMaterial&&c.material.map).length,0,'wet decals dry out');W.clearUtilityEffects();
});


