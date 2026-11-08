'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm'),{randomUUID,webcrypto}=require('node:crypto');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare'),M=require('../public/maker-core.js');
let mf,url,store,owner,player,map,other;
const options=revision=>convertV4MiniflareOptions({workers:[{name:'map-plays-test',modules:true,scriptPath:path.resolve(__dirname,'../build/worker.js'),compatibilityDate:'2026-10-16',compatibilityFlags:['nodejs_compat'],durableObjects:{GLOBAL:{className:'GlobalRoom',useSQLite:true},COMMUNITY:{className:'CommunityHub',useSQLite:true}},bindings:{QA_REVISION:revision}}],unsafeInspectDurableObjects:true,cf:false});
async function api(route,body,user){const r=await fetch(new URL('/api/'+route,url),{method:body===undefined?'GET':'POST',headers:{Origin:url.origin,'Content-Type':'application/json',Connection:'close',...(user?{Cookie:user.cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function account(username){const r=await api('auth/signup',{username,password:'Map-plays-test-password-123'});assert.equal(r.status,200);return {...r.data.account,cookie:r.cookie};}
async function create(slot,name){const r=await api('drafts/save',{slot,name,document:M.fresh(),preview:'data:image/jpeg;base64,YQ=='},owner);assert.equal(r.status,200);const id=r.data.map.id;assert.equal((await api('maps/publish',{id},owner)).status,200);return id;}
const count=async id=>(await api('maps/detail?id='+id)).data.map.plays;
before(async()=>{mf=new Miniflare(options(1));url=await mf.ready;owner=await account('Plays_Owner');player=await account('Plays_Player');map=await create(0,'Repeat visits');other=await create(1,'Other map');store=await mf.unsafeGetDurableObjectStorage('map-plays-test','CommunityHub',{name:'isla-community-v16'});});
after(async()=>{await mf?.dispose();});
test('legacy visit rows migrate without loss and count repeated people as separate recorded plays',async()=>{
 await store.exec('DROP TABLE plays');
 await store.exec('CREATE TABLE plays(visitor TEXT,map TEXT,at INTEGER,PRIMARY KEY(visitor,map,at))');
 await store.exec('INSERT INTO plays VALUES(?,?,?),(?,?,?)',player.id,map,100,player.id,map,200);
 await mf.setOptions(options(2));url=await mf.ready;
 assert.equal(await count(map),2);
 store=await mf.unsafeGetDurableObjectStorage('map-plays-test','CommunityHub',{name:'isla-community-v16'});
 assert((await store.exec('PRAGMA table_info(plays)')).some(c=>c.name==='visit'));
});
test('repeat plays count immediately; concurrent retries of one visit count once',async()=>{
 const visit=randomUUID(),requests=await Promise.all([api('play/start',{map,visit},player),api('play/start',{map,visit},player)]);assert(requests.every(r=>r.status===200));assert.equal(await count(map),3);
 await api('play/start',{map,visit:randomUUID()},player);assert.equal(await count(map),4);
 await api('play/start',{map,visit:randomUUID()},player);assert.equal(await count(map),5);
 await api('play/start',{map,visit},player);assert.equal(await count(map),5);
 assert.equal((await api('play/start',{map,visit:{}},player)).status,400);assert.equal(await count(map),5);
});
test('guest replays count, keys are scoped by visitor and map, and counts survive restart',async()=>{
 const visit=randomUUID();await api('play/start',{map,visit});await api('play/start',{map,visit});assert.equal(await count(map),6);
 await api('play/start',{map,visit:randomUUID()});assert.equal(await count(map),7);
 await api('play/start',{map,visit},owner);assert.equal(await count(map),8);
 await api('play/start',{map:other,visit},owner);assert.equal(await count(other),1);
 await mf.setOptions(options(3));url=await mf.ready;assert.equal(await count(map),8);await api('play/start',{map,visit},owner);assert.equal(await count(map),8);
});
test('search, popularity and trending use plays; viewing a card or details adds no play',async()=>{
 const a=await count(map);for(const tab of ['popular-unapproved','trending']){const r=await api('maps/search?tab='+tab);assert.equal(r.status,200);assert.equal(r.data.items[0].id,map);assert.equal(r.data.items[0].plays,a);}
 assert.equal(await count(map),a);const ui=fs.readFileSync(path.join(__dirname,'../public/community-ui.js'),'utf8');assert(ui.includes('${m.plays} plays'));assert(!ui.includes('${m.plays} drivers'));
});
function client(){const c=vm.createContext({location:{protocol:'https:',search:''},URLSearchParams,URL,crypto:webcrypto,Isla:{mapId:'custom'}});c.window=c;vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/community-api.js'),'utf8'),c);c.IslaCommunity.custom={info:{id:'test-map'}};return c.IslaCommunity;}
test('guest/unapproved clients cache a successful start even without an aura run',async()=>{
 let calls=0,firstVisit;const c=client();c.api=async(_,body)=>{calls++;firstVisit=body.visit;return {run:null,eligible:false};};await Promise.all([c.startRun(),c.startRun()]);await c.startRun();assert.equal(calls,1);const next=client();next.api=async(_,body)=>{assert.notEqual(body.visit,firstVisit);return {run:null,eligible:false};};await next.startRun();
});
test('a lost start response retries with the same visit key',async()=>{
 const c=client(),keys=[];c.api=async(_,body)=>{keys.push(body.visit);if(keys.length===1)throw Error('Lost reply');return {run:'reward-session',eligible:true};};await assert.rejects(()=>c.startRun());await c.startRun();await c.startRun();assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);assert.equal(c.getRun(),'reward-session');
});
