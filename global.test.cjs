'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare'),{WebSocket}=require('ws');
const world=require('../src/world-data.json'),rules=require('../public/player-rules.js');
let mf,url,wsURL;const clients=[];const delay=ms=>new Promise(r=>setTimeout(r,ms));
before(async()=>{mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'isla-test',modules:true,scriptPath:path.resolve(__dirname,'../build/worker.js'),compatibilityDate:'2026-10-16',durableObjects:{GLOBAL:{className:'GlobalRoom',useSQLite:true}}}],cf:false}));url=await mf.ready;wsURL=new URL('/ws',url).href.replace('http:','ws:');});
after(async()=>{for(const c of clients)c.ws.terminate();await mf?.dispose();});
async function client(map='islands'){const ws=new WebSocket(wsURL+'?map='+map),messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});const c={ws,messages,send:x=>ws.send(JSON.stringify(x)),wait:async(type,p=()=>true)=>{const end=Date.now()+5000;while(Date.now()<end){const m=messages.find(m=>m.type===type&&p(m));if(m)return m;await delay(10);}throw Error('Timed out: '+type);}};clients.push(c);return c;}
async function join(name='Coast_Runner.01',map='islands'){const c=await client(map);c.send({type:'join',v:2,name});c.welcome=await c.wait('welcome');return c;}
async function leave(c){if(c.ws.readyState===1){c.send({type:'leave'});await c.wait('left');}}

test('utility abilities sync to other drivers, persist wrecks and trees, and water extinguishes shared fires',async()=>{
 const a=await join('Utility_Test'),b=await join('Utility_Watch');
 a.send({type:'state',state:{...a.welcome.state,car:'stick',wallMode:'climbing',pitch:Math.PI/2,y:20,vy:8}});
 const climb=await b.wait('frame',m=>m.players.some(p=>p.state.wallMode==='climbing'));assert.equal(climb.players.find(p=>p.id===a.welcome.id).state.car,'stick');
 const building=world.buildings.at(-1),tree=world.trees[0];await delay(120);
 a.send({type:'state',state:{...a.welcome.state,car:'beast',x:building.x,y:building.y+.12,z:building.z+building.d/2+3,vz:-12,speed:12}});a.send({type:'hit',id:building.id,speed:12});
 assert.equal((await b.wait('building',m=>m.id===building.id)).hp,0);
 await delay(120);a.send({type:'state',state:{...a.welcome.state,car:'beast',x:tree.x,y:tree.y+.12,z:tree.z+3,vz:-12,speed:12}});a.send({type:'treeHit',id:0,dx:0,dz:-1});assert.equal((await b.wait('treeDown')).id,0);
 const last=b.messages.filter(m=>m.type==='frame').at(-1),id=10,t=last.traffic[id];await delay(120);
 a.send({type:'state',state:{...a.welcome.state,car:'beast',x:t[0],y:t[1],z:t[2],vx:t[4]+12,vz:t[5],speed:12}});a.send({type:'trafficHit',id,nx:-1,nz:0,speed:12});await delay(120);a.send({type:'ping',at:900001});
 const wreck=await b.wait('frame',m=>m.traffic[id][8]&&m.traffic[id][9]);assert.equal(wreck.traffic[id][6],0);
 await mf.unsafeEvictDurableObject('isla-test','GlobalRoom',{name:'isla-global-v2',webSockets:'hibernate'});
 const late=await join('Utility_Late');assert.equal(late.welcome.hp[building.id],0);assert.deepEqual(late.welcome.trees.find(t=>t[0]===0),[0,0,-1]);a.send({type:'ping',at:900002});
 const restored=await late.wait('frame',m=>m.traffic[id][8]);assert(restored.traffic[id][9]);const w=restored.traffic[id];
 await delay(120);a.send({type:'state',state:{...a.welcome.state,car:'firetruck',x:w[0]-3,y:w[1],z:w[2]+.49,yaw:0,parked:false}});
 const wet=await b.wait('frame',m=>m.time>restored.time&&m.traffic[id][8]&&!m.traffic[id][9]);assert(wet.traffic[id][10]>0);
 const farTree=world.trees.find(t=>t.treeId!==0&&Math.hypot(t.x-w[0],t.z-w[2])>100);a.send({type:'treeHit',id:farTree.treeId,dx:1,dz:0});a.send({type:'ping',at:900003});await a.wait('pong',m=>m.at===900003);assert(!b.messages.some(m=>m.type==='treeDown'&&m.id===farTree.treeId));
 await leave(a);await leave(b);await leave(late);
});
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

test('quick chat has exactly 30 distinct presets in five groups',()=>{
 assert.equal(rules.quickChat.length,30);assert.equal(new Set(rules.quickChat.map(m=>m.text)).size,30);
 const categories=[...new Set(rules.quickChat.map(m=>m.category))];assert.equal(categories.length,5);
 for(const category of categories)assert.equal(rules.quickChat.filter(m=>m.category===category).length,6);
 for(let i=0;i<30;i++)assert(rules.validChat(i));
 for(const invalid of [-1,30,1.5,'1',null,{},'custom message'])assert(!rules.validChat(invalid));
});

test('preset bubbles reach both players, reject arbitrary text, and enforce cooldown across hibernation',async()=>{
 const a=await join('Chat_One'),b=await join('Chat_Two');
 for(const message of [-1,30,1.5,'Hey, drivers!',null])a.send({type:'chat',message});
 a.send({type:'ping',at:771});await a.wait('pong',m=>m.at===771);
 assert.equal(b.messages.filter(m=>m.type==='chat').length,0);assert.equal(a.messages.filter(m=>m.type==='chatError').length,5);
 // A caller cannot supply text, spoof another car, or lengthen the bubble.
 a.send({type:'chat',message:0,text:'unapproved text',id:b.welcome.id,duration:999999});
 const bubble=await b.wait('chat');assert.deepEqual(bubble,{type:'chat',id:a.welcome.id,message:0,duration:6000});
 assert.deepEqual(await a.wait('chat'),bubble);
 await mf.unsafeEvictDurableObject('isla-test','GlobalRoom',{name:'isla-global-v2',webSockets:'hibernate'});
 a.send({type:'chat',message:1});const cooldown=await a.wait('chatError',m=>m.retryAfter>0);assert(cooldown.retryAfter<=rules.chatCooldown);
 await delay(cooldown.retryAfter+60);a.send({type:'chat',message:29});assert.equal((await b.wait('chat',m=>m.message===29)).id,a.welcome.id);
 assert.equal(b.messages.filter(m=>m.type==='chat').length,2);
 await leave(a);await leave(b);
});

test('maps isolate players, traffic, chat and damage, including after hibernation',async()=>{
 const island=await join('Island_Watch'),a=await join('City_One','city'),b=await join('City_Two','city');
 assert.equal(a.welcome.mapId,'city');assert.equal(a.welcome.hp.length,world.maps.city.buildings.length);assert.equal(a.welcome.players.length,1);assert.equal(b.welcome.players.length,2);
 assert.equal(island.welcome.mapId,'islands');assert(!b.welcome.players.some(p=>p.id===island.welcome.id));
 const building=world.maps.city.buildings[0];a.send({type:'state',state:{...a.welcome.state,x:building.x,y:building.y+.12,z:building.z+building.d/2+4,vz:-30,speed:30}});a.send({type:'hit',id:0,speed:30});
 const damage=await b.wait('building');assert(damage.hp<100);const frame=await b.wait('frame');assert.equal(frame.traffic.length,72);
 const heights=world.maps.city.routes.flatMap(r=>r.lanes.flatMap(l=>l.map(p=>p[1]))),minY=Math.min(...heights),maxY=Math.max(...heights);
 assert(frame.traffic.every(t=>t[1]>=minY-.01&&t[1]<=maxY+.01),'traffic follows the coastal city road elevations');
 a.send({type:'chat',message:4});assert.equal((await b.wait('chat')).id,a.welcome.id);await delay(100);assert(!island.messages.some(m=>m.type==='chat'||m.type==='building'));
 await mf.unsafeEvictDurableObject('isla-test','GlobalRoom',{name:'isla-global-city-v4',webSockets:'hibernate'});
 a.send({type:'ping',at:54321});await a.wait('pong',m=>m.at===54321);
 const late=await join('City_Late','city');assert.equal(late.welcome.mapId,'city');assert.equal(late.welcome.hp[0],damage.hp);assert.equal(late.welcome.players.length,3);
 const wrong=await client();wrong.send({type:'resume',v:2,name:'City_One',token:a.welcome.token});assert.equal((await wrong.wait('error')).expired,true);wrong.ws.close();
 await leave(late);await leave(a);await leave(b);await leave(island);
});

test('new cars sync and automatic nukes honor driving time, survive hibernation, and share permanent damage',async()=>{
 const a=await join('Chaos_Driver'),b=await join('Chaos_Viewer'),building=world.buildings[6];
 for(const car of ['moonlight','plane','nuker']){
  a.send({type:'state',state:{...a.welcome.state,car,color:'#000000',parked:true}});
  assert((await b.wait('frame',m=>m.players.some(p=>p.id===a.welcome.id&&p.state.car===car))).players.some(p=>p.state.car===car));await delay(120);
 }
 const state={...a.welcome.state,car:'nuker',x:building.x,z:building.z+42,y:building.y+.12,yaw:0};
 a.send({type:'nuke',blast:{x:building.x,y:building.y,z:building.z}});a.send({type:'nukeBlast',buildings:[[building.id,0]]});await delay(250);assert(!b.messages.some(m=>m.type==='nukeLaunch'||m.type==='nukeBlast'));
 const start=Date.now();let hibernated=false;
 while(Date.now()-start<18000&&!b.messages.some(m=>m.type==='nukeLaunch')){
  a.send({type:'state',state});await delay(100);
  if(!hibernated&&Date.now()-start>7000){hibernated=true;await mf.unsafeEvictDurableObject('isla-test','GlobalRoom',{name:'isla-global-v2',webSockets:'hibernate'});}
 }
 const launch=await b.wait('nukeLaunch');assert(Date.now()-start>=14900);assert.equal(launch.id,a.welcome.id);assert(Math.abs(launch.shot.target.z-building.z)<.01);
 // Pending projectile is persisted and the alarm still detonates it after hibernating.
 await mf.unsafeEvictDurableObject('isla-test','GlobalRoom',{name:'isla-global-v2',webSockets:'hibernate'});
 a.send({type:'state',state:{...state,parked:true}});
 const blast=await b.wait('nukeBlast');assert(blast.buildings.some(([id,hp])=>id===building.id&&hp===0));assert.deepEqual(await a.wait('nukeBlast'),blast);
 for(let i=0;i<5;i++){a.send({type:'state',state});await delay(100);}assert.equal(b.messages.filter(m=>m.type==='nukeLaunch').length,1,'cannot immediately fire again');
 const late=await join('Blast_Witness');assert.equal(late.welcome.hp[building.id],0);
 await leave(late);await leave(a);await leave(b);
});

