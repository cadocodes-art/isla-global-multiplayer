const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function game(){
 const THREE=require('../public/three.min.js'),gradient={addColorStop(){}},canvas=new Proxy({createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||(()=>{})});
 const c=vm.createContext({THREE,console,document:{createElement:()=>({getContext:()=>canvas})}});c.window=c;
 for(const name of ['world','physics','player-rules','garage','specials'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../public/'+name+'.js'),'utf8'),c);
 const W=c.Isla;W.scene=new THREE.Scene();W.height=W.driveHeight=()=>0;W.slope=()=>({x:0,z:0});const road={samples:[{x:0,z:-1},{x:0,z:0},{x:0,z:1}]};W.nearestRoad=(x,z)=>({d:0,p:{x,z,width:12,index:1,road}});W.buildCollisionIndex();
 const reset=(id,kph=100,y=.12)=>{W.garage.selected=id;W.resetVehicle(true);Object.assign(W.vehicle,{x:0,z:0,y,yaw:0,vx:0,vz:kph/3.6});};
 const step=(seconds,controls={})=>{for(let i=0;i<Math.round(seconds*120);i++)W.stepVehicle(1/120,{gas:true,brake:false,handbrake:false,steer:0,boost:false,...controls},i/120);return Math.hypot(W.vehicle.vx,W.vehicle.vz)*3.6;};
 return {W,c,reset,step};
}
test('three new purchases keep existing saves, deduct aura once, save paint, and build local/remote geometry',()=>{
 const {W}=game(),memory=new Map([['isla-drive-garage-v2',JSON.stringify({balance:825000,earned:1000000,owned:['classic','solstice'],selected:'solstice',colors:{solstice:'#123456'}})]]),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};W.garage=W.createGarage(storage);
 for(const [id,price,size]of [['moonlight',250000,.8],['nuker',275000,1.2],['plane',300000,1]]){const before=W.garage.balance;assert(W.garage.choose(id).ok);assert.equal(W.garage.balance,before-price);assert(W.garage.choose(id).ok);assert.equal(W.garage.balance,before-price);const spec=W.getCarSpec(),mesh=W.makeCar(),remote=W.makeCar(spec,true);assert.equal(mesh.size,size);assert.equal(remote.size,size);assert.equal(mesh.wheels.length,4);assert(W.carPreview(spec).includes(spec.name));}
 W.garage.setColor('#112233');W.garage=W.createGarage(storage);assert.equal(W.garage.balance,0);assert.equal(W.garage.selected,'plane');assert.equal(W.garage.getColor(),'#112233');assert.equal(W.garage.getColor('solstice'),'#123456');assert.equal(W.garage.getColor('moonlight'),'#000000');assert(W.garage.owned.includes('solstice'));
 const plane=W.makeCar(W.getCarSpec(),true);assert(new (require('../public/three.min.js').Box3)().setFromObject(plane.root).getSize(new (require('../public/three.min.js').Vector3)()).x>7,'fixed wings extend beyond chassis');
});
test('new ground nitro reaches its rating within a burst and never exceeds its own limit',()=>{
 const {W,c,reset,step}=game();vm.runInContext('Math.random=()=>.999999',c);
 for(const [id,limit]of [['moonlight',285],['nuker',270],['plane',240]]){reset(id);const kph=step(6.9,{boost:true});console.log(id+' ground nitro: '+kph.toFixed(2));assert(kph>=limit-1&&kph<=limit+.01,id+' got '+kph);assert(W.vehicle.grounded);}
});
test('Plane Car glides without nitro, can steer, accelerates to 290 in the air, and lands at the ground limit',()=>{
 const {W,c,reset,step}=game();vm.runInContext('Math.random=()=>.999999',c);
 reset('solstice',180,80);step(3);const normalY=W.vehicle.y;
 reset('plane',180,80);step(3);assert(W.vehicle.y>normalY+15);assert(W.vehicle.vy>=-7.01);assert.equal(W.vehicle.nitroTime,0);
 reset('plane',240,100);const kph=step(5,{boost:true});console.log('Plane airborne nitro: '+kph.toFixed(2));assert(kph>289&&kph<=290.01);assert(!W.vehicle.grounded);
 W.vehicle.y=.15;W.vehicle.vy=-1;step(.02,{boost:true});assert(W.vehicle.grounded);assert(Math.hypot(W.vehicle.vx,W.vehicle.vz)*3.6<=240.01);
 reset('plane',180,80);step(1,{steer:1});assert(W.vehicle.yaw>.03);assert(W.vehicle.x>0);assert(W.vehicle.y>60);
});
test('automatic rear nuke waits 15 seconds and blasts nearby buildings and traffic behind, not ahead',()=>{
 const {W,c,reset}=game();reset('nuker',0);const shots=[],show=W.showNuke;W.showNuke=(...a)=>{shots.push(a[0]);show(...a);};
 for(let i=0;i<1799;i++)W.stepWeapons(1/120);assert.equal(shots.length,0);W.stepWeapons(1/120);assert.equal(shots.length,1);assert(shots[0].target.z<W.vehicle.z-30);
 const building=(id,z)=>({id,x:0,y:0,z,yaw:0,w:10,d:10,h:8,hp:100,collapsed:false});W.buildings=[building(0,-42),building(1,30),building(2,-100)];W.traffic=[{x:5,y:0,z:-40,speed:10,driftX:0,driftZ:0}];
 W.updateWeapons(.74);assert.equal(W.buildings[0].hp,100);W.updateWeapons(.02);assert.equal(W.buildings[0].hp,0);assert.equal(W.buildings[1].hp,100);assert.equal(W.buildings[2].hp,100);assert(W.traffic[0].speed<3);assert(W.traffic[0].driftX>10);
 W.resetVehicle();W.stepWeapons(1/120);assert.equal(shots.length,1,'recover does not immediately fire');W.vehicle.waterMode='sinking';W.stepWeapons(30);assert.equal(shots.length,1);W.garage.selected='classic';W.stepWeapons(30);assert.equal(shots.length,1);
 W.clearWeapons();assert.equal(W.scene.children.length,0,'temporary blast meshes are cleaned up');
 const R=c.IslaRules;assert(!R.blastHits({x:0,y:100,z:0},building(3,0)),'high airborne explosion leaves low buildings outside sphere');
});
