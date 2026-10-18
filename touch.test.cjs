'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/game.js'),'utf8');
function setup(){
 const elements=new Map();function element(id,key){const classes=new Set(),captures=new Set();const el={style:{},dataset:{key},attributes:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},setAttribute:(k,v)=>el.attributes[k]=v,getBoundingClientRect:()=>({left:0,top:0,width:146,height:146}),setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>{captures.delete(id);el.onlostpointercapture?.({pointerId:id});}};elements.set(id,el);return el;}
 for(const id of ['driveStick','stickKnob','touchControls','touchMode','touchCamera','touchRecover','cameraSelect'])element(id);const nitro=element('touchNitro','ShiftLeft'),hb=element('touchHB','Space');
 const context=vm.createContext({started:true,paused:false,camMode:0,W:{resetVehicle(){this.recovered=true;}},toast(){},localStorage:{getItem(){return null;},setItem(){}},stickPointer:null,touchDrive:{gas:0,brake:0,steer:0},touchButtons:new Map(),keys:new Set(),$:id=>elements.get(id),clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),matchMedia:()=>({matches:false}),navigator:{maxTouchPoints:0},document:{body:element('body'),addEventListener(){},querySelectorAll:()=>[nitro,hb]}});
 vm.runInContext(source.slice(source.indexOf('function input()'),source.indexOf(' function frame(')),context);context.bindTouchControls();
 function event(id,x=73,y=73){return {pointerId:id,button:0,clientX:x,clientY:y,preventDefault(){}};}
 return {c:context,elements,stick:elements.get('driveStick'),knob:elements.get('stickKnob'),nitro,hb,event};
}
test('joystick gives proportional gas, brake/reverse and correctly signed steering with a neutral dead zone',()=>{
 const {c,stick,event}=setup();stick.onpointerdown(event(1,73,69));assert.equal(c.input().gas,0);
 stick.onpointermove(event(1,73,45));const gentle=c.input().gas;assert(gentle>0&&gentle<.6);
 stick.onpointermove(event(1,73,0));assert.equal(c.input().gas,1);assert.equal(c.input().brake,0);
 stick.onpointermove(event(1,0,73));assert.equal(c.input().steer,1);assert.equal(c.input().gas,0);
 stick.onpointermove(event(1,146,73));assert.equal(c.input().steer,-1);
 stick.onpointermove(event(1,73,146));assert.equal(c.input().brake,1);assert.equal(c.input().gas,0);
 stick.onpointermove(event(1,-100,-100));assert(c.input().gas>0&&c.input().gas<=1&&c.input().steer>0&&c.input().steer<=1);
 stick.onpointerup(event(1));assert.equal(c.input().gas,0);assert.equal(c.input().steer,0);
});
test('independent fingers can steer, boost and slide; releases, cancellation and capture loss clear only their owner',()=>{
 const {c,stick,nitro,hb,event}=setup();stick.onpointerdown(event(1,45,0));nitro.onpointerdown(event(2));hb.onpointerdown(event(3));
 assert(c.input().gas>0&&c.input().steer>0&&c.input().boost&&c.input().handbrake);
 stick.onpointerdown(event(4,73,146));stick.onpointerup(event(4));assert(c.input().gas>0);assert.equal(c.input().brake,0);
 nitro.onpointercancel(event(2));assert(!c.input().boost);assert(c.input().gas>0&&c.input().handbrake);
 stick.onlostpointercapture(event(1));assert.equal(c.input().gas,0);assert(c.input().handbrake);
 hb.onpointerup(event(3));assert(!c.input().handbrake);assert.equal(hb.attributes['aria-pressed'],'false');
 nitro.onpointerdown(event(5));nitro.onpointerdown(event(6));nitro.onpointerup(event(5));assert(c.input().boost);nitro.onpointerup(event(6));assert(!c.input().boost);
});
test('pause/rotation reset and keyboard coexistence cannot leave a pedal held',()=>{
 const {c,stick,nitro,hb,event}=setup();c.keys.add('ShiftRight');nitro.onpointerdown(event(2));nitro.onpointerup(event(2));assert(c.input().boost);c.keys.clear();
 c.keys.add('ArrowLeft');stick.onpointerdown(event(1,146,73));assert.equal(c.input().steer,1);c.keys.clear();assert.equal(c.input().steer,-1);
 nitro.onpointerdown(event(2));hb.onpointerdown(event(3));c.resetTouchControls();assert.equal(c.touchButtons.size,0);assert.equal(c.stickPointer,null);assert.equal(c.input().steer,0);assert(!c.input().boost&&!c.input().handbrake);
 stick.onpointermove(event(1,73,0));assert.equal(c.input().gas,0);c.paused=true;stick.onpointerdown(event(4,73,0));nitro.onpointerdown(event(5));assert.equal(c.input().gas,0);assert(!c.input().boost);
});
test('partial joystick pedals produce gentler acceleration and braking while full input matches keyboard',()=>{
 const context=vm.createContext({THREE:require('../public/three.min.js'),console});context.window=context;
 for(const file of ['world.js','physics.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),context);
 const W=context.Isla,road={samples:[{x:0,z:-10000},{x:0,z:0},{x:0,z:10000}]};W.height=W.driveHeight=()=>0;W.slope=()=>({x:0,z:0});W.nearestRoad=(x,z)=>({d:0,p:{x,z,width:12,index:1,road}});W.buildCollisionIndex();
 function run(input,speed=0,seconds=1){W.resetVehicle(true);Object.assign(W.vehicle,{x:0,z:0,y:.12,yaw:0,vx:0,vz:speed});for(let i=0;i<seconds*120;i++)W.stepVehicle(1/120,{gas:0,brake:0,steer:0,handbrake:false,boost:false,...input},i/120);return W.vehicle.vz;}
 const half=run({gas:.5}),full=run({gas:1});assert(half>0&&full>half*1.5);assert.equal(full,run({gas:true}));
 assert(run({brake:.35},20)>run({brake:1},20));assert(run({brake:1},0,2)<-1);
 assert.equal(run({brake:true},20),run({brake:1},20));
});

test('touch camera, recovery and input preference work without a keyboard',()=>{const {c,elements,stick,event}=setup();elements.get('touchCamera').onclick();assert.equal(c.camMode,1);assert.equal(elements.get('cameraSelect').value,1);elements.get('touchRecover').onclick();assert(c.W.recovered);stick.onpointerdown(event(1,73,0));assert(c.input().gas>0);const mode=elements.get('touchMode');mode.value='on';mode.onchange();assert(c.document.body.classList.contains('touch-mode'));assert.equal(c.input().gas,0);mode.value='off';mode.onchange();assert(!c.document.body.classList.contains('touch-mode'));c.paused=true;elements.get('touchCamera').onclick();assert.equal(c.camMode,1);});
