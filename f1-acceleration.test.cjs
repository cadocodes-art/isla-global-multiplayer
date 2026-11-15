const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../public'),T=require('../public/three.min.js');
function game(id='f1',level=1,mode='ground',random=0){
 const storage={getItem:()=>null,setItem(){}},ctx=vm.createContext({THREE:T,console,document:{},localStorage:storage});ctx.window=ctx;
 for(const n of ['v22-shared','world','physics','player-rules','garage','maker-core','maker-driving'])vm.runInContext(fs.readFileSync(path.join(root,n+'.js'),'utf8'),ctx,{filename:n});
 vm.runInContext('Math.random=()=>'+random,ctx);const W=ctx.Isla,s=ctx.IslaV22.spec(W.carModels.find(m=>m.id===id),level);W.getCarSpec=()=>s;W.height=W.driveHeight=()=>mode==='water'?-4:1;W.slope=()=>({x:0,z:0});const road={surface:'asphalt',samples:[{x:0,z:-1},{x:0,z:0},{x:0,z:1}]};W.nearestRoad=(x,z)=>({d:0,p:{x,z,width:12,index:1,road}});W.buildCollisionIndex();W.resetVehicle(true);
 const c=W.vehicle;Object.assign(c,{x:0,z:0,y:mode==='air'?1000:mode==='maker'?10.28:mode==='water'?.1:1.12,yaw:0,vx:0,vz:mode==='water'?200/3.6:0,vy:0});
 if(mode==='maker')W.installMakerDriving([{width:20,surface:'asphalt',samples:Array.from({length:151},(_,i)=>({x:0,y:10,z:i*20-100}))}],()=>1);
 let clock=0;const step=(dt,input={gas:1,boost:true})=>{clock+=dt;const controls={gas:0,brake:0,steer:0,handbrake:false,boost:false,...input};if(mode==='maker')assert(W.stepMakerRoad(dt,controls,clock));else W.stepVehicle(dt,controls,clock);return Math.hypot(c.vx,c.vz);};
 return {W,c,s,step};
}
test('F1 reaches its advertised nitro speed within one shortest burst at all upgrades and frame rates',()=>{
 for(const hz of [30,60,120])for(const level of [1,2,3]){const f=game('f1',level),seconds=level===1?5:level===2?6:8;let at99=null,previous=0,maxAcceleration=0;
  for(let n=0;n<hz*seconds;n++){const speed=f.step(1/hz);if(speed>=f.s.boostLimit*.99&&at99===null)at99=(n+1)/hz;maxAcceleration=Math.max(maxAcceleration,(speed-previous)*hz);previous=speed;assert(speed<=f.s.boostLimit+1e-8);}
  assert(at99>=4.3&&at99<=5.1,'time to top speed: '+at99);assert(Math.round(previous*3.6)===f.s.boostKph);assert(maxAcceleration<=f.s.boostLimit/(4.5+.25*(level-1))+1e-7);
 }
});
test('F1 time to top speed is comparable to the Vespera at every upgrade level',()=>{
 for(const level of [1,2,3]){const times=[];for(const id of ['vespera','f1']){const f=game(id,level);let time=null;for(let n=0;n<6*120;n++)if(f.step(1/120)>=f.s.boostLimit*.99){time=(n+1)/120;break;}assert(time);times.push(time);}assert(Math.abs(times[0]-times[1])<.3);}
});
test('ground, air and elevated Maker roads use the same F1 acceleration curve',()=>{
 for(const level of [1,2,3]){const modes=['ground','air','maker'].map(mode=>game('f1',level,mode));for(let n=0;n<600;n++){const speeds=modes.map(f=>f.step(1/120));for(const speed of speeds)assert(Math.abs(speed-speeds[0])<1e-6);}}
});
test('takeoff, landing and random nitro duration never trigger a late acceleration surge',()=>{
 for(const level of [1,2,3]){const a=game('f1',level,'ground',0),b=game('f1',level,'ground',.999);let previous=0;
  for(let n=0;n<600;n++){if(n===240){a.c.y=1000;a.c.vy=0;}if(n===360){a.c.y=1.2;a.c.vy=0;}const speed=a.step(1/120),comparison=b.step(1/120);assert(Math.abs(speed-comparison)<1e-6);assert((speed-previous)*120<=a.s.boostLimit/(4.5+.25*(level-1))+1e-7);previous=speed;}
 }
});
test('release, empty nitro and braking stop the extra F1 acceleration',()=>{
 for(const mode of ['ground','maker']){for(const action of ['release','brake','empty']){const f=game('f1',1,mode);for(let n=0;n<240;n++)f.step(1/120);const before=Math.hypot(f.c.vx,f.c.vz);if(action==='empty'){f.c.nitroTime=0;f.c.nitroCharge=0;}const speed=f.step(1/120,action==='brake'?{brake:1,boost:true}:action==='release'?{}:{boost:true});assert(speed<before,mode+' '+action);}}
});
test('water skimming does not unlock the old excessive F1 thrust',()=>{
 for(const level of [1,2,3]){const f=game('f1',level,'water');let previous=Math.hypot(f.c.vx,f.c.vz);for(let n=0;n<120;n++){const speed=f.step(1/120);assert.equal(f.c.waterMode,'skimming');assert((speed-previous)*120<=f.s.boostLimit/(4.5+.25*(level-1))+1e-7);previous=speed;}}
});
test('Maker roads retain F1 upgrade nitro durations, recharge and a fresh press to restart',()=>{
 for(const level of [1,2,3]){const f=game('f1',level,'maker');f.step(1/120);assert.equal(f.c.nitroDuration,f.s.nitroMin||5);for(let n=0;n<12*120;n++)f.step(1/120);assert.equal(f.c.nitroTime,0);f.step(1/120,{});for(let n=0;n<8*120;n++)f.step(1/120,{});assert.equal(f.c.nitroCharge,1);f.step(1/120);assert(f.c.nitroTime>0);}
});
