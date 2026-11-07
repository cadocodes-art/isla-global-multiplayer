/* ISLA 2.2: shared economy, upgrade specifications and deterministic collectibles. */
(function(root){'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const prices={classic:0,rally:60000,gt:160000,truck:140000,solstice:360000,moonlight:500000,nuker:550000,plane:660000,firetruck:270000,stick:630000,beast:640000,waterskidder:560000,micro:400000,vespera:680000,cruiser:80000,launcher:580000,ultra:1000000,hover:510000,flappy:705000};
 const catalog={};
 function add(id,c2,c3,n2,n3,p2,p3,d2,d3){catalog[id]={2:{cost:Math.ceil(c2*1.25),name:n2,params:p2,description:d2},3:{cost:Math.ceil(c3*1.25),name:n3,params:{...p2,...p3},description:d3}};}
 add('classic',100,250,'Road Ready','Street Original',{"landingStability":0.6,"brakeFactor":1.35,"driftRecharge":0.08},{"landingStability":0.8,"brakeFactor":1.5,"driftRecharge":0.12},"Strong landing stabilization, 35% stronger brakes and nitro recharge while drifting.","Even stronger stabilization, 50% stronger brakes and faster drift recharge.");
 add('rally',125,300,'Trail Scout','Summit Rally',{"airSteer":0.4,"offroadFactor":1.35,"rampLift":2},{"airSteer":0.6,"offroadFactor":1.65,"rampLift":5},"Responsive air steering, 35% better off-road tires and extra ramp lift.","65% better off-road tires, stronger air steering and big ramp launches.");
 add('gt',150,350,'Drift Edition','Exit Boost',{"driftSteer":1.35,"steerResponse":1.3,"driftRecovery":2.8,"driftExitBoost":3},{"driftSteer":1.5,"steerResponse":1.45,"driftRecovery":3.5,"driftExitBoost":6},"Sharper drifts and a 3 m/s exit boost after a two-second drift; six-second cooldown.","Stronger drift control and a 6 m/s drift-exit boost; six-second cooldown.");
 add('truck',140,325,'Reinforced','Heavy Hauler',{"ramFactor":1.8,"massFactor":1.15},{"ramFactor":2.4,"massFactor":1.3,"impactPulse":10,"pulseRadius":9},"Reinforced bumper delivers 80% stronger ramming and a heavier chassis.","140% stronger ramming; hard impacts shove traffic and props within nine meters.");
 add('solstice',180,400,'Aero R','Endurance R',{"airBrake":1.4,"gripFactor":1.2,"nitroMin":8,"nitroMax":10,"nitroRecharge":5},{"airBrake":1.8,"nitroMin":10,"nitroMax":12,"nitroRecharge":4,"gripFactor":1.35},"Strong air brakes, extra grip and 8–10-second nitro with a five-second refill.","10–12-second nitro with a four-second refill, stronger brakes and more grip.");
 add('moonlight',195,425,'Night Dash','Shadow Z',{"airDash":9,"gripFactor":1.18},{"airDash":14,"sizeOverride":0.7,"nitroRecharge":4,"landingStability":0.7},"One powerful 9 m/s forward dash per flight. Press F / DASH.","A 14 m/s dash, smaller body, stabilized landings and four-second nitro refill.");
 add('nuker',225,400,'Triple Battery','Target Lock',{"nukeCooldown":6,"cannons":3,"sizeFactor":1.15,"massFactor":1.2},{"nukeCooldown":5,"autoAim":true,"aimRange":110,"manualNukes":true,"massFactor":1.35},"Three forward cannons fire every six seconds; 15% larger, heavier body.","Auto-target cars and buildings up to 110 meters ahead. Optional manual fire retains its five-second cooldown.");
 add('plane',230,500,'Flight Control','Sky Lifter',{"airBrake":1.3,"airSteer":0.6,"descentLimit":4.5},{"airBrake":1.6,"airSteer":0.8,"descentLimit":3.5,"airLift":9},"Strong air brakes, responsive steering and slower descent.","An upward lift of 9 m/s per flight, sharp air steering and a gentler glide. F / LIFT.");
 add('firetruck',160,375,'High Pressure','Rescue Monitor',{"hoseRange":32,"hosePush":3.5},{"hoseRange":42,"hosePush":5,"roofHose":true},"32-meter high-pressure water jets shove traffic and loose balls.","42-meter jets with stronger push; adds a front roof hose that aims with steering.");
 add('stick',210,450,'Grip Climber','Wall Crawler',{"climbFactor":1.65,"wallHold":true},{"climbFactor":2.2,"wallTraverse":7},"Climb 65% faster and hold position with the brake.","Climb 120% faster and steer sideways along walls at 7 m/s.");
 add('beast',220,450,'Rock Crusher','Groundbreaker',{"massFactor":1.15,"offroadFactor":1.35,"rockCrusher":true},{"massFactor":1.3,"offroadFactor":1.55,"impactPulse":14,"pulseRadius":10},"Front plow tosses rocks; heavier chassis and 35% stronger off-road grip.","Hard impacts shove traffic and props within ten meters; even tougher off-road handling.");
 add('waterskidder',200,425,'Hydro Rudder','Harbor Turn',{"waterSteer":1.9,"waterGrip":1.6,"waterBrake":1.5},{"waterSteer":2.3,"waterGrip":1.9,"waterBrake":1.8,"waterPivot":0.8,"waterBurst":true,"waterBurstDuration":2.5,"waterBurstAcceleration":18,"waterBurstCooldown":8},"Much sharper water steering, grip and braking. Water limit remains 30 seconds.","Strong low-speed turning; F / SURGE gives a 2.5-second boost with an eight-second cooldown.");
 add('micro',180,400,'Pocket Hopper','Nano',{"hop":7,"hopCooldown":4,"gripFactor":1.2},{"sizeOverride":0.34,"hop":9.5,"hopCooldown":3,"gripFactor":1.4},"F / HOP launches a 7 m/s jump; four-second cooldown and extra grip.","Smaller body, a 9.5 m/s hop every three seconds and much stronger grip.");
 add('vespera',230,475,'Slipstream','Velocity',{"slipstream":true,"slipstreamPower":0.9,"gripFactor":1.25},{"slipstreamPower":1.4,"slipstreamRecharge":0.12,"nitroMin":10,"nitroMax":12,"gripFactor":1.45},"Following a moving car closely gives much stronger acceleration and improved grip.","Stronger slipstream acceleration recharges nitro; 10–12-second bursts and extra grip.");
 add('cruiser',120,280,'Touring','Grand Touring',{"cruise":140,"gripFactor":1.2},{"cruise":185,"adaptiveCruise":true,"nitroRecharge":4,"gripFactor":1.35},"F / CRUISE holds up to 140 km/h; extra road grip. Brake cancels.","Cruise up to 185 km/h, slow for traffic ahead and refill nitro in four seconds.");
 add('launcher',210,450,'Wide Scoop','Sky Scoop',{"launchMinimum":30.555555555555554,"treeMinimum":45.833333333333336,"scoopRadius":1.5,"throwFactor":0.62,"throwCap":52},{"launchMinimum":25.0,"treeMinimum":38.888888888888886,"throwFactor":0.8,"throwCap":64,"treeChance":1},"Wide scoop and stronger throws; launch cars/rocks at 110 km/h and trees at 165.","Huge throws; launch cars/rocks at 90 km/h and trees at 140, with reliable tree uprooting.");
 add('ultra',275,575,'Vector Jets','Long Burn',{"rocketSteer":0.46,"rocketDuration":10,"rocketCooldownMin":20,"rocketCooldownMax":23},{"rocketSteer":0.58,"rocketDuration":12,"rocketCooldownMin":15,"rocketCooldownMax":18},"Ten-second rocket burst, sharper steering and a 20–23-second cooldown.","Twelve-second rocket burst, strong steering and a 15–18-second cooldown.");
 add('hover',200,425,'Rotor Control','Lift Pulse',{"airSteer":0.4,"descentLimit":7,"gripFactor":1.25,"offroadFactor":1.3},{"airSteer":0.6,"descentLimit":5,"hop":8,"hopCooldown":5,"gripFactor":1.4,"offroadFactor":1.5},"Strong air steering, slower descent and improved grip on and off the road.","F / HOP gives an 8 m/s rotor-powered jump every five seconds, plus stronger air control.");
 add('flappy',240,500,'Seraph','Archangel',{"flaps":30,"flapImpulse":4.2,"flapCap":12,"airSteer":0.45},{"flaps":40,"flapImpulse":5.2,"flapCap":15,"airSteer":0.65,"airBrake":1.3},"30 flaps per takeoff, stronger lift and responsive air steering.","40 powerful flaps, stronger air control and wing air brakes.");
 const flappy={id:'flappy',name:'Flappy Car',price:705000,color:'#e9e4ff',style:'hyper',size:1,engine:1.9,grip:1.2,offroad:1,boostMax:79,thrust:24,boostKph:268,boostLimit:268/3.6,flappy:true,flaps:20,flapImpulse:3.2,flapCap:9,tag:'WINGS OF YOUR OWN',description:'Angel wings and 20 midair flaps. Each flap gives a little upward jump. Press F or FLAP.'};
 function level(v){return Number.isInteger(v)&&v>=1&&v<=3?v:1;}
 function spec(base,l=1){if(!base)return null;l=level(l);const p=catalog[base.id]?.[l]?.params||{},f=l===2?1.25:l===3?1.5:1,m={...base,...p,upgradeLevel:l,upgradeName:catalog[base.id]?.[l]?.name||'Original',price:prices[base.id]??base.price};
  m.boostKph=Math.round(base.boostKph*f);m.boostMax=base.boostMax*f;m.boostLimit=m.boostKph/3.6;if(l>1)m.boostMax=Math.max(m.boostMax,m.boostLimit+5);m.engine=base.engine*(l===2?1.25:l===3?1.5:1);m.thrust=base.thrust*f*f;m.grip=base.grip*(p.gripFactor||1);m.offroad=base.offroad*(p.offroadFactor||1);m.mass=(base.mass||1)*(p.massFactor||1);m.size=p.sizeOverride??(base.size||1)*(p.sizeFactor||1);if(l>1){m.nitroMin=p.nitroMin??(l===2?6:8);m.nitroMax=p.nitroMax??(l===2?8:10);m.nitroRecharge=p.nitroRecharge??(l===2?6:5);}if(base.airBoostLimit)m.airBoostLimit=Math.round(base.airBoostLimit*3.6*f)/3.6;return m;}
 function normalize(g={}){const n=v=>Number.isSafeInteger(v)&&v>=0?Math.min(1e12,v):0;g.iscoins=n(g.iscoins);g.upgrades=g.upgrades&&typeof g.upgrades==='object'&&!Array.isArray(g.upgrades)?g.upgrades:{};g.levels=g.levels&&typeof g.levels==='object'&&!Array.isArray(g.levels)?g.levels:{};for(const id of Object.keys(prices)){g.upgrades[id]=g.owned?.includes(id)?level(g.upgrades[id]):1;g.levels[id]=Math.min(g.upgrades[id],level(g.levels[id]));}g.trailColor=/^#[0-9a-f]{6}$/i.test(g.trailColor||'')?g.trailColor:'#a5d8ef';g.showIscoins=g.showIscoins!==false;g.manualNukes=g.manualNukes===true;return g;}
 function purchase(g,id,to){normalize(g);if(!own(prices,id)||!g.owned?.includes(id))throw Error('Own this car before upgrading it.');if(to!==g.upgrades[id]+1||!catalog[id]?.[to])throw Error('Unlock each level in order.');const cost=catalog[id][to].cost;if(g.iscoins<cost)throw Error('Collect more Iscoins for this upgrade.');g.iscoins-=cost;g.upgrades[id]=to;g.levels[id]=to;return g;}
 function chooseLevel(g,id,l){normalize(g);if(!g.owned?.includes(id)||!Number.isInteger(l)||l<1||l>g.upgrades[id])throw Error('That upgrade level is not unlocked.');g.levels[id]=l;return g;}
 function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 function random(seed){let s=hash(seed);return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
 function buildingKey(b){if(b.rewardKey)return b.rewardKey;if(b.object?.id)return 'object:'+b.object.id;return [b.x,b.y,b.z,b.w,b.d].map(v=>Math.round(v*10)).join(':');}
 // Layouts are deterministic; pickup timers remain personal. New IDs avoid old-layout cooldowns.
 function coins(key,roads,buildings,height,bounds){
  const rand=random('iscoins-2.24:'+key),result=[],samples=[],segments=new Map(),blocks=new Map();
  const max=key==='playplace'?60:120,b=bounds||{minX:-900,maxX:900,minZ:-900,maxZ:900};
  const cell=(x,z)=>Math.floor(x/64)+','+Math.floor(z/64);
  function index(grid,item,x0,x1,z0,z1){for(let x=Math.floor(x0/64);x<=Math.floor(x1/64);x++)for(let z=Math.floor(z0/64);z<=Math.floor(z1/64);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(item);}}
  for(const r of roads||[]){const ps=(r.samples||[]).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.z));for(let i=0;i<ps.length;i++){const p=ps[i],q=ps[Math.min(i+1,ps.length-1)],width=Math.max(1,p.width||r.width||8),pad=width/2+12,s={p,q,pad};samples.push(p);index(segments,s,Math.min(p.x,q.x)-pad,Math.max(p.x,q.x)+pad,Math.min(p.z,q.z)-pad,Math.max(p.z,q.z)+pad);}}
  const roofs=[];
  for(const building of buildings||[]){const r=Math.hypot(building.w,building.d)/2+4;index(blocks,building,building.x-r,building.x+r,building.z-r,building.z+r);if(!building.obb&&building.w>=5&&building.d>=5&&Number.isFinite(building.y+building.h))roofs.push(building);}
  function nearRoad(x,z){return (segments.get(cell(x,z))||[]).some(({p,q,pad})=>{const dx=q.x-p.x,dz=q.z-p.z,t=clamp(((x-p.x)*dx+(z-p.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-p.x-dx*t,z-p.z-dz*t)<=pad;});}
  function blocked(x,z,y){return (blocks.get(cell(x,z))||[]).some(o=>{const co=Math.cos(o.yaw||0),si=Math.sin(o.yaw||0),dx=x-o.x,dz=z-o.z;return y<o.y+o.h+.6&&y>o.y-2&&Math.abs(dx*co-dz*si)<o.w/2+3&&Math.abs(dx*si+dz*co)<o.d/2+3;});}
  const targets={road:samples.length?Math.round(max*.4):0,away:samples.length?max-Math.round(max*.4):max},counts={road:0,away:0};
  function add(x,y,z,value,placement){
   // Quantize before validation so clients and the server classify the identical position.
   x=Math.round(x*100)/100;y=Math.round(y*100)/100;z=Math.round(z*100)/100;
   if(![x,y,z].every(Number.isFinite)||x<=b.minX+5||x>=b.maxX-5||z<=b.minZ+5||z>=b.maxZ-5||blocked(x,z,y)||result.some(c=>Math.hypot(c.x-x,c.z-z)<32))return false;
   const near=nearRoad(x,z),bucket=near?'road':'away';if(counts[bucket]>=targets[bucket])return false;
   result.push({id:224000+result.length,x,y,z,value,nearRoad:near,placement});counts[bucket]++;return true;
  }
  const point=()=>({x:b.minX+rand()*(b.maxX-b.minX),z:b.minZ+rand()*(b.maxZ-b.minZ)});
  const rare=Math.max(1,Math.round(max*.02));
  for(let n=0;n<rare;n++){
   let placed=false;
   for(let k=0;k<1800&&!placed;k++){
    if(roofs.length&&(k%2===n%2)){const roof=roofs[Math.floor(rand()*roofs.length)];placed=add(roof.x,roof.y+roof.h+.8,roof.z,10,'roof');}
    else{const p=point();if(height(p.x,p.z)<-1)placed=add(p.x,.8,p.z,10,'water');}
   }
   // Dry, building-free maps still get a rare collectible on accessible ground.
   for(let k=0;k<1200&&!placed;k++){const p=point(),y=height(p.x,p.z);if(y>=0&&Math.abs(height(p.x+3,p.z)-y)<4&&Math.abs(height(p.x,p.z+3)-y)<4)placed=add(p.x,y+.8,p.z,10,'ground');}
  }
  for(const bucket of ['road','away'])for(let k=0;k<max*100&&counts[bucket]<targets[bucket];k++){
   let p,y,placement='ground';
   if(bucket==='road'){if(!samples.length)break;p=samples[Math.floor(rand()*samples.length)];y=Number.isFinite(p.y)?Math.max(p.y,height(p.x,p.z))+.8:height(p.x,p.z)+.8;placement='road';if(y<.8)continue;}
   else{p=point();y=height(p.x,p.z)+.8;if(y<.8||nearRoad(p.x,p.z)||Math.abs(height(p.x+3,p.z)-y+.8)>4||Math.abs(height(p.x,p.z+3)-y+.8)>4)continue;}
   add(p.x,y,p.z,rand()<.2?5:1,placement);
  }
  // A custom map with too little road may use the remaining safe off-road space.
  if(counts.road<targets.road){targets.away+=targets.road-counts.road;for(let k=0;k<max*80&&result.length<max;k++){const p=point(),y=height(p.x,p.z);if(y>=0&&!nearRoad(p.x,p.z)&&Math.abs(height(p.x+3,p.z)-y)<4&&Math.abs(height(p.x,p.z+3)-y)<4)add(p.x,y+.8,p.z,rand()<.2?5:1,'ground');}}
  return result;
 }
 const rewards={launch:[1100,1200],drift:[700,1300],nuke:[1000,2000],ram:[1200,1300],spare:[1200,1400],strike:[3000,4000],slide:[600,800],repeat:[100,200]};
 const reward=(kind,event)=>{const r=rewards[kind];return r?r[0]+hash(event)%(r[1]-r[0]+1):0;};
 function isDrifting(c,input={}){const speed=Math.hypot(c.vx||0,c.vz||0);return !!(c.grounded&&c.waterMode==='dry'&&!c.wall&&speed>7&&(c.slip>2.1&&(input.handbrake||Math.abs(input.steer||0)>.2)||input.handbrake&&Math.abs(c.yawRate||0)>.12&&(Math.abs(input.steer||0)>.15||c.slip>.6)));}
 function nukeShots(state,model,targets,shotFactory){
  const offsets=model.cannons===3?[0,-.48,.48]:[0],size=model.size||1;
  return offsets.map((offset,i)=>{const sx=Math.sin(state.yaw),sz=Math.cos(state.yaw),side=i===1?-1:i===2?1:0,s={...state,x:state.x+sz*side*.9*size,z:state.z-sx*side*.9*size,yaw:state.yaw+offset};
   if(model.autoAim){let best=null,score=Infinity;for(const t of targets||[]){if(t.collapsed||t.parked||t===state)continue;const dx=t.x-s.x,dz=t.z-s.z,d=Math.hypot(dx,dz),angle=Math.atan2(Math.sin(Math.atan2(dx,dz)-s.yaw),Math.cos(Math.atan2(dx,dz)-s.yaw));if(d<5||d>(model.aimRange||80)||dx*Math.sin(state.yaw)+dz*Math.cos(state.yaw)<=0||Math.abs(angle)>1.1||Math.abs((t.y||0)-s.y)>25)continue;const rank=Math.abs(angle)*30+d;if(rank<score){score=rank;best=t;}}if(best){s.yaw=Math.atan2(best.x-s.x,best.z-s.z);const shot=shotFactory(s,size);shot.target={x:best.x,y:(best.y||0)+Math.min(3,(best.h||2)/2),z:best.z};return shot;}}
   return shotFactory(s,size);
  });
 }
 const api={isDrifting,nukeShots,prices,catalog,flappy,level,spec,normalize,purchase,chooseLevel,hash,random,buildingKey,coins,rewards,reward,coinRespawn:180000};
 root.IslaV22=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
