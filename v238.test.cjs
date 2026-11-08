'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),T=require('../public/three.min.js');
const source=n=>fs.readFileSync(path.join(__dirname,'../public',n),'utf8');
test('V2.38 opens directly with five maps and only Project 10 vault music',()=>{
 const root=path.join(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'isla-v16-upload.json'))),html=source('index.html');
 assert.equal(manifest.version,'2.38');assert.match(html,/V2\.38/);assert(!/iframe|soundtrack|project13|music-shell|startGate/i.test(html));
 for(const name of ['inferno.js','inferno-shared.js','drive.html','soundtrack.js','isla-project13.m4a'])assert(!manifest.files.some(f=>f.name===name));
 for(const name of ['vault-music.js','isla-project10.m4a'])assert(manifest.files.some(f=>f.name===name));
 assert(html.indexOf('vault-music.js')<html.indexOf('v224-vault.js'));
 const data=JSON.parse(fs.readFileSync(path.join(root,'src/world-data.json')));assert.deepEqual([data.mapId,...Object.keys(data.maps)].sort(),['city','fern','islands','peaks','playplace']);
 assert(!/inferno/i.test(source('maps.js')));assert(!/inferno/i.test(source('physics.js')));
 assert.match(fs.readFileSync(path.join(root,'src/v22-economy.js'),'utf8'),/Mount inferno/);
});
function music(){
 const listeners={},audios=[],store=new Map(),button={setAttribute(){}};
 const document={hidden:false,addEventListener:(k,f)=>listeners[k]=f,removeEventListener:k=>delete listeners[k]};
 class Audio {constructor(src){this.src=src;this.currentTime=0;this.plays=0;this.paused=true;audios.push(this);}play(){this.plays++;this.paused=false;return this.promise||(this.reject?Promise.reject(Error('blocked')):Promise.resolve());}pause(){this.paused=true;}removeAttribute(k){delete this[k];}load(){this.loaded=true;}}
 const c=vm.createContext({Audio,document,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});c.window=c;vm.runInContext(source('vault-music.js'),c);return {M:c.IslaVaultMusic(button),a:audios[0],button,listeners,document,store};
}
test('vault entry starts looping Project 10 immediately without a startup gesture',async()=>{
 const {M,a}=music();assert.equal(a.plays,0);assert.match(a.src,/project10/);assert(a.loop);M.open();assert.equal(a.plays,1);await Promise.resolve();assert(!a.paused);a.currentTime=31;M.close();assert(a.paused);M.open();assert.equal(a.currentTime,31);M.close();
});
test('vault mute, visibility, blocked playback retry and cleanup work',async()=>{
 const {M,a,button,store,document,listeners}=music();a.reject=true;M.open();await Promise.resolve();await Promise.resolve();assert.equal(button.textContent,'Enable music');a.reject=false;button.onclick();await Promise.resolve();assert(!a.paused);assert.equal(button.textContent,'Music: on');
 button.onclick();assert(a.paused);assert.equal(store.get('isla-music-muted'),'1');M.close();M.open();assert(a.paused);button.onclick();assert(!a.paused);document.hidden=true;listeners.visibilitychange();assert(a.paused);document.hidden=false;listeners.visibilitychange();assert(!a.paused);M.destroy();assert(a.paused);assert.equal(a.src,undefined);assert.equal(listeners.visibilitychange,undefined);M.open();assert(a.paused);
});
test('late playback completion cannot restart music after closing the vault',async()=>{
 const {M,a}=music();let resolve;a.promise=new Promise(r=>resolve=r);M.open();M.close();a.paused=false;resolve();await Promise.resolve();assert(a.paused);
});
function bowling(){const c=vm.createContext({console,THREE:T});c.window=c;for(const n of ['playplace-bodies.js','playplace-v20-shared.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',n),'utf8'),c);const W={clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),mix:(a,b,t)=>a+(b-a)*t,getCarSpec:()=>({size:1}),playplace:{floor:12,clock:0,roads:[],seesaws:[],ropes:[],bodies:null,sports:{balls:[],hoop:{}}}};W.playplace.bodies=c.IslaPlayBodies(W,T);const A=c.IslaPlayAttractions(W,T);return {c,W,A,l:A.lanes[0]};}
function launch(b,r=.5){vm.runInContext('Math.random=()=>'+r,b.c);const {l,A}=b;A.hitBall(l.ball,{x:l.x+.2,z:l.start-5,y:12,yaw:0,vx:0,vz:20,size:1,driverId:'test',driverName:'Tester'},0);return l.curve;}
test('V2.38 bowling curves once per roll, restores exactly and still allows aimed strikes',()=>{
 for(const hz of [60,120])for(const r of [.01,.51]){const b=bowling(),curve=launch(b,r);assert.equal(b.l.phase,'rolling');assert(Math.abs(curve)>=.02&&Math.abs(curve)<=.08);const start=b.l.ball.p.x;for(let i=0;i<hz;i++){b.A.step(1/hz,i/hz);assert.equal(b.l.curve,curve);}const s=b.A.snapshot();assert(b.A.valid(s));const restored=bowling();assert(restored.A.apply(s));assert.equal(restored.l.curve,curve);s.lanes[0].curve=99;assert(!b.A.valid(s));for(let i=hz;i<hz*34&&b.l.phase==='rolling';i++)b.A.step(1/hz,i/hz);assert.equal(b.l.phase,'returning');assert.equal(b.l.total,10);assert.equal(b.l.result,'STRIKE!');b.A.reset(b.l);assert.equal(b.l.curve,0);assert.equal(b.l.ball.mass,120);}
});

