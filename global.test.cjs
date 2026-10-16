'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare'),{WebSocket}=require('ws');
const world=require('../src/world-data.json'),rules=require('../public/player-rules.js');
let mf,url,wsURL;const clients=[];const delay=ms=>new Promise(r=>setTimeout(r,ms));
before(async()=>{mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'isla-test',modules:true,scriptPath:path.resolve(__dirname,'../build/worker.js'),compatibilityDate:'2026-10-16',durableObjects:{GLOBAL:{className:'GlobalRoom',useSQLite:true}}}],cf:false}));url=await mf.ready;wsURL=new URL('/ws',url).href.replace('http:','ws:');});
after(async()=>{for(const c of clients)c.ws.terminate();await mf?.dispose();});
async function client(){const ws=new WebSocket(wsURL),messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});const c={ws,messages,send:x=>ws.send(JSON.stringify(x)),wait:async(type,p=()=>true)=>{const end=Date.now()+5000;while(Date.now()<end){const m=messages.find(m=>m.type===type&&p(m));if(m)return m;await delay(10);}throw Error('Timed out: '+type);}};clients.push(c);return c;}
async function join(name='Coast_Runner.01'){const c=await client();c.send({type:'join',v:2,name});c.welcome=await c.wait('welcome');return c;}
async function leave(c){if(c.ws.readyState===1){c.send({type:'leave'});await c.wait('left');}}
test('name policy accepts boundaries and blocks characters, substrings, separators, repeats and leetspeak',()=>{
 for(const n of ['Car','123','___','...','Coast_Runner.01','ABCDEFGHIJ1234567890','N1tr0.Luz_99'])assert.equal(rules.validateName(n),'',n);
 for(const n of ['',null,'ab','a'.repeat(21),'Two Cars','car-name','name@car','<svg>','a\nb','Café','💀car','fuck_car','FuCkTruck','F.u_c.k','fuuuuck','sh1t','b1tch','c0ck','f4g','sh1.t','wanker','ass_car'])assert(rules.validateName(n),'accepted '+n);
});
test('Worker health, upgrade and cross-origin checks',async()=>{
 const health=await(await fetch(new URL('/healthz',url))).json();assert.equal(health.capacity,32);assert.equal(health.room,'GLOBAL');assert.equal((await fetch(new URL('/ws',url))).status,426);
 const bad=new WebSocket(wsURL,{origin:'https://unrelated.example'});await new Promise(r=>{bad.on('error',r);bad.on('open',()=>assert.fail('cross-origin accepted'));});
});
test('server rejects invalid names when browser checks are bypassed',async()=>{
 for(const name of ['ab','Spaces bad','F.u_c.k','Name-with-dash']){const c=await client();c.send({type:'join',v:2,name});assert((await c.wait('error')).message);assert(!c.messages.some(m=>m.type==='welcome'));c.ws.close();}
});
test('all players share one global room, custom paint, truck, nitro and traffic',async()=>{
 const a=await join('Luz_One'),b=await join('Ruiz.Two');assert.equal(a.welcome.code,b.welcome.code);assert.equal(b.welcome.players.length,2);
 a.send({type:'state',state:{...a.welcome.state,car:'truck',color:'#11CCEE',x:35,vx:25,speed:25,nitro:true,grounded:false,water:'skimming'}});
 const frame=await b.wait('frame',m=>m.players.some(p=>p.state.car==='truck'));
 const remote=frame.players.find(p=>p.id===a.welcome.id);assert.equal(remote.state.color,'#11ccee');assert.equal(remote.state.nitro,true);assert.equal(remote.state.grounded,false);assert.equal(frame.traffic.length,18);
 assert((await b.wait('roster',m=>m.players.some(p=>p.color==='#11ccee'))).players.some(p=>p.name==='Luz_One'));
 a.send({type:'state',state:{...a.welcome.state,car:'truck',color:'url(evil)',x:999}});await delay(120);a.send({type:'ping',at:Date.now()});const after=await b.wait('frame',m=>m.time>frame.time);assert.equal(after.players.find(p=>p.id===a.welcome.id).state.x,35);
 await leave(a);await leave(b);
});
test('shared damage, late join, heavy truck impact and no public world reset',async()=>{
 const a=await join('Heavy_Truck'),b=await join('Island_Viewer'),building=world.buildings[0];
 a.send({type:'state',state:{...a.welcome.state,car:'truck',x:building.x,y:building.y+.12,z:building.z+building.d/2+4,vz:-20,speed:20}});a.send({type:'hit',id:0,speed:20});
 const hit=await b.wait('building');assert(Math.abs(hit.hp-84.95)<1e-6);
 const c=await join('Late_Driver');assert.equal(c.welcome.hp[0],hit.hp);a.send({type:'reset'});assert.match((await a.wait('error')).message,/refresh/);
 await leave(a);await leave(b);await leave(c);
});
test('hibernation restores players, paint, score, damage and reconnect identity',async()=>{
 const a=await join('Sleepy_Truck'),b=await join('Awake_Car');a.send({type:'state',state:{...a.welcome.state,color:'#abcdef'}});a.send({type:'aura',seq:1,points:1200});await b.wait('roster',m=>m.players.some(p=>p.score===1200));
 await mf.unsafeEvictDurableObject('isla-test','GlobalRoom',{name:'isla-global-v2',webSockets:'hibernate'});
 a.send({type:'ping',at:12345});assert.equal((await a.wait('pong')).at,12345);
 const frame=await b.wait('frame',m=>m.players.some(p=>p.id===a.welcome.id&&p.state.color==='#abcdef'));assert(frame.players.some(p=>p.name==='Sleepy_Truck'));
 const late=await join('After_Sleep');assert(late.welcome.hp[0]<100);assert.equal(late.welcome.players.find(p=>p.id===a.welcome.id).score,1200);
 const token=a.welcome.token;a.ws.close();await b.wait('roster',m=>m.players.some(p=>p.id===a.welcome.id&&!p.connected));
 const c=await client();c.send({type:'resume',v:2,name:'Sleepy_Truck',token});const welcome=await c.wait('welcome');assert.equal(welcome.id,a.welcome.id);assert.equal(welcome.scoreSeq,1);assert.equal(welcome.state.color,'#abcdef');
 await leave(c);await leave(b);await leave(late);
});
test('32 shared slots accept more than four drivers and reject the 33rd',async()=>{
 const group=[];for(let i=0;i<32;i++)group.push(await join('Driver_'+i));assert.equal(group.at(-1).welcome.players.length,32);
 const extra=await client();extra.send({type:'join',v:2,name:'One_More'});assert.match((await extra.wait('error')).message,/full/);extra.ws.close();
 for(const c of group)await leave(c);
});
test('malformed and oversized messages close safely without taking down the room',async()=>{
 for(const payload of ['{bad','x'.repeat(9000)]){const c=await client();const closed=new Promise(r=>c.ws.once('close',r));c.ws.send(payload);assert([1008,1009].includes(await closed));}
 assert.equal((await fetch(new URL('/healthz',url))).status,200);
});
