const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare'),R=require('../public/social-rules.js'),M=require('../public/maker-core.js');
let mf,url,store,alice,bob,carol,owner;
const options=(owner='',revision=0)=>convertV4MiniflareOptions({workers:[{name:'social-test',modules:true,scriptPath:path.resolve(__dirname,'../build/worker.js'),compatibilityDate:'2026-10-16',compatibilityFlags:['nodejs_compat'],durableObjects:{GLOBAL:{className:'GlobalRoom',useSQLite:true},COMMUNITY:{className:'CommunityHub',useSQLite:true}},bindings:{OWNER_ACCOUNT_ID:owner,QA_REVISION:revision},outboundService:async()=>{throw Error('Social features must not contact external services.');}}],unsafeInspectDurableObjects:true,cf:false});
async function api(route,body,user,extra={}){const r=await fetch(new URL('/api/'+route,url),{method:body===undefined?'GET':'POST',headers:{Origin:url.origin,'Content-Type':'application/json',Connection:'close',...(user?.cookie?{Cookie:user.cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function signup(username){const r=await api('auth/signup',{username,password:'Social-test-password-123'});assert.equal(r.status,200,JSON.stringify(r.data));return {...r.data.account,cookie:r.cookie};}
async function clearLimits(){await store.exec("DELETE FROM limits WHERE key NOT LIKE 'login-%'");}
async function friend(a,b){await api('social/friend',{id:b.id,action:'request'},a);const r=await api('social/friend',{id:a.id,action:'accept'},b);assert.equal(r.status,200,JSON.stringify(r.data));}
async function send(a,b,text,nonce=randomUUID()){await store.exec('DELETE FROM limits WHERE key=?','message-second:'+a.id);return api('social/send',{id:b.id,text,nonce},a);}
async function post(a,text){await store.exec('DELETE FROM limits WHERE key=?','profile-post:'+a.id);return api('social/post',{text},a);}
before(async()=>{mf=new Miniflare(options());url=await mf.ready;alice=await signup('Alice_Driver');bob=await signup('Bob_Creator');carol=await signup('Carol_Racer');owner=await signup('Owner_Social');await mf.setOptions(options(owner.id));url=await mf.ready;store=await mf.unsafeGetDurableObjectStorage('social-test','CommunityHub',{name:'isla-community-v16'});});
after(async()=>{await mf?.dispose();});

test('message policy rejects links and location patterns, preserves ordinary game chat',()=>{
 for(const text of ['https://example.com','HTTP : / /example.com','www.example.org','example.xyz/path','discord.gg/test','a dot com','example [dot] net','e x a m p l e . c o m','a@b.co','a (at) b dot com','127.0.0.1','ｈｔｔｐｓ：／／ｅｘａｍｐｌｅ．ｃｏｍ','exa\u200bmple.com','123 Main Street','42 N Oak Rd','PO Box 123','10 Downing St','37.77490, -122.41940','SW1A 1AA','K1A 0B1','Unit #23','rue Victor Hugo 42'])assert(R.messageError(text),text);
 for(const text of ['Just reached 800k aura!','Meet at the city ramp. Bring the truck!','Nice. Great jump!','I got 3.5 seconds of air','Race at 8?','Going 285 kph!','Hit 285 kph on the mountain road','Earned 800k aura on the long road','Finished in 5th place','Try the long road behind the mountain','a'.repeat(500)])assert.equal(R.messageError(text),'',text);
 assert(R.messageError('a'.repeat(501)));assert(R.messageError('   '));
});
test('friend consent, crossed requests, authentication, and sender authority',async()=>{
 assert.equal((await api('social/inbox')).status,401);
 assert.equal((await api('social/send',{id:bob.id,text:'Hi',nonce:randomUUID()},alice)).status,403);
 assert.equal((await api('social/friend',{id:alice.id,action:'request'},alice)).status,400);
 assert.equal((await api('social/friend',{id:bob.id,action:'request'},alice)).data.status,'outgoing');
 assert.equal((await api('social/friend',{id:bob.id,action:'accept'},alice)).status,403);
 assert.equal((await api('social/friend',{id:alice.id,action:'request'},bob)).data.status,'incoming');
 assert.equal((await api('social/friend',{id:alice.id,action:'cancel'},bob)).status,403);
 assert.equal((await api('social/friend',{id:bob.id,action:'accept'},carol)).status,403);
 assert.equal((await api('social/inbox',undefined,bob)).data.incoming[0].id,alice.id);
 assert.equal((await api('social/friend',{id:alice.id,action:'accept'},bob)).data.status,'friends');
 assert.equal((await api('social/inbox',undefined,alice)).data.friends[0].id,bob.id);
 assert.equal((await api('social/post',{text:'Forged'},alice,{Origin:'https://attacker.invalid'})).status,403);
});
test('messages persist, retry safely, censor profanity, and are private even from owner',async()=>{
 const nonce=randomUUID(),r=await send(alice,bob,'That was a damn good jump!',nonce);assert.equal(r.status,200,JSON.stringify(r.data));assert.match(r.data.message.text,/\*\*\*\*/);
 const duplicate=await api('social/send',{id:bob.id,text:'Same retry',nonce},alice);assert.equal(duplicate.data.message.id,r.data.message.id);
 assert.equal((await api('social/send',{id:bob.id,text:'Too fast',nonce:randomUUID()},alice)).status,429);
 assert.equal((await api('social/messages?id='+bob.id,undefined,carol)).status,403);
 assert.equal((await api('social/messages?id='+bob.id,undefined,owner)).status,403);
 assert.equal((await api('social/messages?id='+alice.id,undefined,bob)).data.messages[0].id,r.data.message.id);
 let inbox=(await api('social/inbox',undefined,bob)).data;assert.equal(inbox.conversations[0].unread,1);
 assert.equal((await api('social/read',{id:alice.id,seq:r.data.message.seq},bob)).status,200);
 assert.equal((await api('social/inbox',undefined,bob)).data.conversations[0].unread,0);
 assert.equal((await api('social/read',{id:alice.id,seq:r.data.message.seq},carol)).status,404);
 const before=(await api('social/messages?id='+alice.id,undefined,bob)).data.messages.length;
 for(const text of ['look at example.com','123 Main Street','a'.repeat(501)])assert.equal((await send(alice,bob,text)).status,400);
 assert.equal((await api('social/messages?id='+alice.id,undefined,bob)).data.messages.length,before);
 assert.equal((await send(bob,alice,'x'.repeat(500))).status,200);
 await mf.setOptions(options(owner.id,1));url=await mf.ready;store=await mf.unsafeGetDurableObjectStorage('social-test','CommunityHub',{name:'isla-community-v16'});
 assert.equal((await api('social/messages?id='+bob.id,undefined,alice)).data.messages.length,2);
});
test('message pagination and reports expose only selected evidence to the owner',async()=>{
 await clearLimits();
 const key=[alice.id,bob.id].sort().join(':');for(let i=0;i<55;i++)await store.exec('INSERT INTO messages(id,pair,sender,recipient,text,at,nonce) VALUES(?,?,?,?,?,?,?)',randomUUID(),key,alice.id,bob.id,'History '+i,Date.now()+i,randomUUID());
 const d=(await api('social/messages?id='+alice.id,undefined,bob)).data;assert.equal(d.messages.length,50);assert(d.more);assert(d.messages.every((m,i)=>!i||m.seq>d.messages[i-1].seq));
 const older=(await api('social/messages?id='+alice.id+'&before='+d.messages[0].seq,undefined,bob)).data;assert.equal(older.messages.length,7);assert(!older.more);
 const newer=(await api('social/messages?id='+alice.id+'&after='+older.messages.at(-1).seq,undefined,bob)).data;assert.equal(newer.messages.length,50);assert.equal(newer.messages[0].id,d.messages[0].id);
 const target=d.messages[0];assert.equal((await api('social/report',{kind:'message',id:target.id,reason:'Scam / phishing'},carol)).status,403);
 assert.equal((await api('social/report',{kind:'message',id:target.id,reason:'Scam / phishing'},alice)).status,403);
 assert.equal((await api('social/report',{kind:'message',id:target.id,reason:'Made up'},bob)).status,400);
 assert.equal((await api('social/report',{kind:'message',id:target.id,reason:'Other'},bob)).status,400);
 for(let i=0;i<2;i++)assert.equal((await api('social/report',{kind:'message',id:target.id,reason:'Bullying / harassment',detail:'Review this message'},bob)).status,200);
 assert.equal((await api('admin/social-reports',undefined,bob)).status,403);
 const reports=(await api('admin/social-reports',undefined,owner)).data.reports;assert.equal(reports.length,1);assert.equal(reports[0].text,target.text);assert.equal(reports[0].target,target.id);
 assert.equal((await api('admin/social-moderate',{id:reports[0].id,remove:true},bob)).status,403);
 assert.equal((await api('admin/social-moderate',{id:reports[0].id,remove:true},owner)).status,200);
 const changed=(await api('social/messages?id='+alice.id,undefined,bob)).data.messages.find(m=>m.id===target.id);assert(changed.removed);assert.equal(changed.text,'Message removed');
});
test('unfriend and block stop both directions without losing reportable history',async()=>{
 assert.equal((await api('social/friend',{id:bob.id,action:'unfriend'},alice)).status,200);
 assert.equal((await send(bob,alice,'Still there?')).status,403);
 assert.equal((await api('social/messages?id='+bob.id,undefined,alice)).status,200);
 await friend(alice,bob);
 assert.equal((await api('social/block',{id:bob.id,block:true},alice)).data.status,'blocked');
 assert.equal((await send(alice,bob,'Blocked')).status,403);assert.equal((await send(bob,alice,'Blocked')).status,403);
 assert.equal((await api('social/friend',{id:alice.id,action:'request'},bob)).status,403);
 assert.equal((await api('social/inbox',undefined,alice)).data.blocks[0].id,bob.id);
 assert.equal((await api('social/relationship?id='+alice.id,undefined,bob)).data.status,'unavailable');
 assert.equal((await api('social/block',{id:bob.id,block:false},alice)).data.status,'none');
 assert.equal((await send(alice,bob,'No automatic friendship')).status,403);
});
test('posts, likes, ownership, moderation, rate limits, and public visibility',async()=>{
 await clearLimits();const r=await post(bob,'Just reached 800k aura! damn');assert.equal(r.status,200,JSON.stringify(r.data));const p=r.data.post;assert.match(p.text,/\*\*\*\*/);
 assert.equal((await api('social/post',{text:'Another update'},bob)).status,429);
 assert.equal((await post(bob,'x'.repeat(151))).status,400);assert.equal((await post(bob,'x'.repeat(150))).status,200);
 assert.equal((await api('social/posts?id='+bob.id)).data.posts.length,2);
 for(let i=0;i<2;i++)assert.equal((await api('social/post/like',{id:p.id,like:true},alice)).data.post.likes,1);
 assert.equal((await api('social/post/like',{id:p.id,like:true},bob)).status,400);
 assert.equal((await api('social/post/delete',{id:p.id},alice)).status,403);
 assert.equal((await api('social/report',{kind:'post',id:p.id,reason:'Inappropriate content'},alice)).status,200);
 assert.equal((await api('social/post/delete',{id:p.id},bob)).status,200);
 const evidence=(await api('admin/social-reports',undefined,owner)).data.reports.find(r=>r.target===p.id);assert.equal(evidence.text,p.text);
 assert.equal((await api('social/posts?id='+bob.id)).data.posts.length,1);
 await api('social/block',{id:bob.id,block:true},alice);assert.equal((await api('social/posts?id='+bob.id,undefined,alice)).data.posts.length,0);assert.equal((await api('social/post/like',{id:p.id,like:true},alice)).status,404);await api('social/block',{id:bob.id,block:false},alice);
});
test('Your feed gains modest post affinity, larger sent-request and friendship affinity; new map report reasons work',async()=>{
 await clearLimits();const published=JSON.stringify(M.fresh('grass',256));
 for(const u of [bob,carol])await store.exec('INSERT INTO maps(id,owner,slot,kind,name,description,draft,preview,published,published_preview,published_at,updated) VALUES(?,?,0,?,?,?,?,?,?,?,?,?)','map-'+u.id,u.id,'original','Roads by '+u.username,'',published,'data:image/jpeg;base64,YQ==',published,'data:image/jpeg;base64,YQ==',Date.now(),Date.now());
 const ranks=async()=>new Map((await api('maps/search?tab=feed',undefined,alice)).data.items.map(m=>[m.creator.id,m.rank]));
 const base=(await ranks()).get(bob.id),p=(await post(bob,'A new mountain road!')).data.post;
 await api('social/post/like',{id:p.id,like:true},alice);assert.equal((await ranks()).get(bob.id)-base,150);
 await api('social/friend',{id:bob.id,action:'request'},alice);assert.equal((await ranks()).get(bob.id)-base,2650);
 const reverse=(await api('maps/search?tab=feed',undefined,bob)).data.items;assert(reverse);
 await api('social/friend',{id:alice.id,action:'accept'},bob);assert.equal((await ranks()).get(bob.id)-base,5150);
 await api('social/post/like',{id:p.id,like:false},alice);assert.equal((await ranks()).get(bob.id)-base,5000);
 await api('social/friend',{id:bob.id,action:'unfriend'},alice);assert.equal((await ranks()).get(bob.id),base);
 await api('social/block',{id:bob.id,block:true},alice);assert(!(await ranks()).has(bob.id));await api('social/block',{id:bob.id,block:false},alice);
 for(const reason of [...R.mapReasons,'Stolen or copied content'])assert.equal((await api('maps/report',{id:'map-'+bob.id,reason,detail:'Test report details'},alice)).status,200,reason);
});
