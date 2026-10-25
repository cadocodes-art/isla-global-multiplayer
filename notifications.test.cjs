const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare'),R=require('../public/social-rules.js'),M=require('../public/maker-core.js');
let mf,url,store,alice,bob,carol,owner;
const options=(owner='',revision=0)=>convertV4MiniflareOptions({workers:[{name:'notifications-test',modules:true,scriptPath:path.resolve(__dirname,'../build/worker.js'),compatibilityDate:'2026-10-16',compatibilityFlags:['nodejs_compat'],durableObjects:{GLOBAL:{className:'GlobalRoom',useSQLite:true},COMMUNITY:{className:'CommunityHub',useSQLite:true}},bindings:{OWNER_ACCOUNT_ID:owner,QA_REVISION:revision},outboundService:async()=>{throw Error('Social features must not contact external services.');}}],unsafeInspectDurableObjects:true,cf:false});
async function api(route,body,user,extra={}){const r=await fetch(new URL('/api/'+route,url),{method:body===undefined?'GET':'POST',headers:{Origin:url.origin,'Content-Type':'application/json',Connection:'close',...(user?.cookie?{Cookie:user.cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function signup(username){const r=await api('auth/signup',{username,password:'Notifications-test-password-123'});assert.equal(r.status,200,JSON.stringify(r.data));return {...r.data.account,cookie:r.cookie};}
async function clearLimits(){await store.exec("DELETE FROM limits WHERE key NOT LIKE 'login-%'");}
async function friend(a,b){await api('social/friend',{id:b.id,action:'request'},a);const r=await api('social/friend',{id:a.id,action:'accept'},b);assert.equal(r.status,200,JSON.stringify(r.data));}
async function send(a,b,text,nonce=randomUUID()){await store.exec('DELETE FROM limits WHERE key=?','message-second:'+a.id);return api('social/send',{id:b.id,text,nonce},a);}
async function post(a,text){await store.exec('DELETE FROM limits WHERE key=?','profile-post:'+a.id);return api('social/post',{text},a);}
before(async()=>{mf=new Miniflare(options());url=await mf.ready;alice=await signup('Alice_Driver');bob=await signup('Bob_Creator');carol=await signup('Carol_Racer');owner=await signup('Owner_Social');await mf.setOptions(options(owner.id));url=await mf.ready;store=await mf.unsafeGetDurableObjectStorage('notifications-test','CommunityHub',{name:'isla-community-v16'});});
after(async()=>{await mf?.dispose();});

test('notifications are private, persist, and retries create only one message alert',async()=>{
 assert.equal((await api('social/notifications')).status,401);await friend(alice,bob);
 const nonce=randomUUID(),r=await send(alice,bob,'Hello from the water park!',nonce);assert.equal(r.status,200);
 await send(alice,bob,'retry',nonce);let d=(await api('social/notifications?after=0',undefined,bob)).data;
 assert.equal(d.items.length,1);assert.equal(d.unread,1);assert.equal(d.items[0].target,alice.id);assert.equal(d.items[0].kind,'message');assert(!('text' in d.items[0]));
 assert.equal((await api('social/notifications?after=0',undefined,carol)).data.items.length,0);
 assert.equal((await api('social/notifications?after=0',undefined,owner)).data.items.length,0);
 await api('social/notifications/read',{through:d.cursor},carol);assert.equal((await api('social/notifications',undefined,bob)).data.unread,1);
 await mf.setOptions(options(owner.id,19));url=await mf.ready;store=await mf.unsafeGetDurableObjectStorage('notifications-test','CommunityHub',{name:'isla-community-v16'});
 assert.equal((await api('social/notifications',undefined,bob)).data.items.length,1);
 await api('social/read',{id:alice.id,seq:r.data.message.seq},bob);assert.equal((await api('social/notifications',undefined,bob)).data.unread,0);
 await api('social/block',{id:alice.id,block:true},bob);assert.equal((await api('social/notifications',undefined,bob)).data.items.length,0);
 await api('social/block',{id:alice.id,block:false},bob);await friend(alice,bob);
});
test('all eight map milestones fire exactly once at their unique-driver counts',async()=>{
 const saved=await api('drafts/save',{slot:0,name:'Milestone Map',description:'Test map.',document:M.fresh(),preview:'data:image/jpeg;base64,YQ=='},alice);assert.equal(saved.status,200,JSON.stringify(saved.data));const mid=saved.data.map.id;
 assert.equal((await api('maps/publish',{id:mid},alice)).status,200);
 let count=0;for(const milestone of [50,100,500,1000,5000,10000,50000,100000]){
  await store.exec('DELETE FROM plays WHERE map=?',mid);
  await store.exec('WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<?) INSERT INTO plays(visitor,map,at) SELECT CAST(x AS TEXT),?,1 FROM n',milestone-1,mid);
  const r=await api('play/start',{map:mid},bob);assert.equal(r.status,200);count++;
  let d=(await api('social/notifications',undefined,alice)).data;assert.equal(d.items.filter(n=>n.kind==='milestone').length,count);assert.equal(d.items[0].milestone,milestone);assert.equal(d.items[0].target,mid);
  await api('play/start',{map:mid},bob);assert.equal((await api('social/notifications',undefined,alice)).data.items.length,count);
  // Replaying after the 30-minute window still counts as the same driver.
  await store.exec('UPDATE plays SET at=1 WHERE visitor=? AND map=?',bob.id,mid);await api('play/start',{map:mid},bob);
  assert.equal((await api('maps/detail?id='+mid)).data.map.plays,milestone);
 }
 const d=(await api('social/notifications',undefined,alice)).data;await api('social/notifications/read',{through:d.cursor},alice);assert.equal((await api('social/notifications',undefined,alice)).data.unread,0);
 await api('maps/publish',{id:mid},alice);assert.equal((await api('social/notifications',undefined,alice)).data.items.length,8,'republish preserves milestone history');
});
test('notification cursor pagination never drops concurrent alerts and acknowledgements are scoped',async()=>{
 for(let i=0;i<45;i++){const mid=randomUUID();await store.exec('INSERT INTO messages(id,pair,sender,recipient,text,at,nonce) VALUES(?,?,?,?,?,?,?)',mid,[alice.id,bob.id].sort().join(':'),alice.id,bob.id,'Test',Date.now(),randomUUID());await store.exec('INSERT INTO notifications(account,kind,target,actor,at) VALUES(?,?,?,?,?)',bob.id,'message',mid,alice.id,Date.now());}
 const page=(await api('social/notifications?after=0',undefined,bob)).data;assert.equal(page.items.length,40);assert(page.more);
 const next=(await api('social/notifications?after='+page.cursor,undefined,bob)).data;assert.equal(next.items.length,6);assert(!next.more);assert(next.items.every(n=>n.seq>page.cursor));
 const latest=(await api('social/notifications',undefined,bob)).data;const older=(await api('social/notifications?before='+latest.items.at(-1).seq,undefined,bob)).data;assert.equal(latest.items.length+older.items.length,46);
 await api('social/notifications/read',{seq:next.items[0].seq},bob);assert.equal((await api('social/notifications',undefined,bob)).data.unread,44);
});
