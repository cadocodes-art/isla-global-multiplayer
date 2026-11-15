const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('../public/v241-grapple.js');
const s={grappler:true,grappleRange:75,grapplePull:28,boostLimit:279/3.6},b={x:0,y:0,z:0,w:16,d:12,h:180,yaw:.3};
const car=()=>({x:0,y:90,z:-22,vx:0,vy:-2,vz:50,yaw:0,grounded:false,waterMode:'dry'});
test('every upgrade expires at ten seconds and blocks reattachment for five seconds at 30/60/120 Hz',()=>{
 for(const hz of [30,60,120])for(const level of [1,2,3]){const c=car(),spec={...s,grappleRange:75+level*20,grapplePull:28+level*5},anchor=G.nearest(c,[b],spec.grappleRange);assert(G.attach(c,anchor));
  for(let i=0;i<10*hz-1;i++)G.step(1/hz,{},c,spec,()=>0);
  assert(c.grapple);const v=[c.vx,c.vy,c.vz];G.step(1/hz,{},c,spec,()=>0);assert.equal(c.grapple,null);assert.equal(c.grappleCooldown,5);assert.deepEqual([c.vx,c.vy,c.vz],v);assert.equal(G.attach(c,anchor),false);
  for(let i=0;i<5*hz-1;i++){G.step(1/hz,{},c,spec,()=>0);assert.equal(G.attach(c,anchor),false);}
  G.step(1/hz,{},c,spec,()=>0);assert.equal(c.grappleCooldown,0);assert(G.attach(c,anchor));assert.equal(c.grapple.remaining,10);
 }
});
test('early launch, lost anchors, sinking and ground contact each start a full cooldown',()=>{
 for(const reason of ['launch','release','collapsed','sinking','ground','change-car','range']){const c=car(),target={...b},anchor=G.nearest(c,[target],75);assert(G.attach(c,anchor));G.step(.25,{},c,s,()=>0);
  if(reason==='launch')G.launch(c,s);else if(reason==='release')G.release(c);else if(reason==='ground'){c.grounded=true;G.finish(.01,c,s);}else{if(reason==='collapsed')target.collapsed=true;if(reason==='sinking')c.waterMode='sinking';if(reason==='range')c.x=1000;G.step(.01,{},c,reason==='change-car'?{}:s,()=>0);}
  assert(!c.grapple,reason);assert.equal(c.grappleCooldown,5,reason);assert.equal(G.attach(c,anchor),false,reason);
  G.release(c);assert.equal(c.grappleCooldown,5);G.step(2,{},c,s,()=>0);G.release(c);assert.equal(c.grappleCooldown,3,'repeated idle releases do not extend the timer');
 }
});
test('invalid and repeated hooks cannot reset a timer, and UI reports release/cooldown/ready',()=>{
 const c=car(),anchor=G.nearest(c,[b],75);assert.equal(G.attach(c,null),false);assert.equal(G.status(c).label,'GRAPPLE · F');assert(G.attach(c,anchor));assert.equal(G.status(c).label,'RELEASE · 10.0s');assert.equal(G.status(c).disabled,false);G.step(2,{},c,s,()=>0);assert.equal(G.attach(c,anchor),false);assert.equal(c.grapple.remaining,8);
 G.launch(c,s);assert.equal(G.status(c).label,'COOLDOWN · 5.0s');assert.equal(G.status(c).disabled,true);G.step(4.9,{},c,s,()=>0);assert(G.status(c).disabled);G.step(.1,{},c,s,()=>0);assert.equal(G.status(c).label,'GRAPPLE · F');assert.equal(G.status(c).disabled,false);
});
test('paused time and invalid time steps cannot consume or refill grapple timers',()=>{const c=car();G.attach(c,G.nearest(c,[b],75));for(const dt of [0,-1,NaN,Infinity])G.step(dt,{},c,s,()=>0);assert.equal(c.grapple.remaining,10);G.release(c);for(const dt of [0,-1,NaN,Infinity])G.step(dt,{},c,s,()=>0);assert.equal(c.grappleCooldown,5);});
