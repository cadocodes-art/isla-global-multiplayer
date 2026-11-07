'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{Miniflare,convertV4MiniflareOptions}=require('miniflare');
let mf,url,store,alpha,beta,gamma,delta,hidden,revision=0;const password='Leaderboard-local-test-2.3';
function options(){return convertV4MiniflareOptions({workers:[{name:'v23-test',modules:true,scriptPath:path.resolve(__dirname,'../build/worker.js'),compatibilityDate:'2026-10-16',compatibilityFlags:['nodejs_compat'],durableObjects:{GLOBAL:{className:'GlobalRoom',useSQLite:true},COMMUNITY:{className:'CommunityHub',useSQLite:true}},bindings:{QA_REVISION:revision}}],unsafeInspectDurableObjects:true,cf:false});}
async function api(route,body,user=alpha){const r=await fetch(new URL('/api/'+route,url),{method:body===undefined?'GET':'POST',headers:{Origin:url.origin,Connection:'close','Content-Type':'application/json',...(user?.cookie?{Cookie:user.cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function signup(username,earned,balance,iscoins){const r=await api('auth/signup',{username,password},null);assert.equal(r.status,200);const u={id:r.data.account.id,cookie:r.cookie};await store.exec('UPDATE accounts SET garage=? WHERE id=?',JSON.stringify({balance,earned,iscoins,owned:['classic'],selected:'classic',colors:{},showIscoins:true}),u.id);return u;}
const board=async(category='aura',scope='top',user=alpha,page=0)=>{const r=await api('leaderboard?'+new URLSearchParams({category,scope,page}),undefined,user);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
async function settings(user,changes={}){const r=await api('profile',{mood:'summer',showAura:true,showIscoins:true,...changes},user);assert.equal(r.status,200,JSON.stringify(r.data));}
async function friend(other){assert.equal((await api('social/friend',{id:alpha.id,action:'request'},other)).status,200);assert.equal((await api('social/friend',{id:other.id,action:'accept'})).status,200);}
before(async()=>{mf=new Miniflare(options());url=await mf.ready;await api('me',undefined,null);store=await mf.unsafeGetDurableObjectStorage('v23-test','CommunityHub',{name:'isla-community-v16'});alpha=await signup('Alpha_Driver',1000,10,40);beta=await signup('Beta_Driver',5000,0,20);gamma=await signup('Gamma_Driver',1000,999,80);delta=await signup('Delta_Driver',8000,2,10);hidden=await signup('Hidden_Driver',9000,0,999);await settings(hidden,{showAura:false,showIscoins:false});await friend(beta);await friend(gamma);await api('social/friend',{id:alpha.id,action:'request'},delta);await api('follow',{id:hidden.id,follow:true});for(const [u,n]of [[alpha,2],[beta,3],[delta,1]])for(let i=0;i<n;i++)await store.exec('INSERT INTO maps(id,owner,kind,approved,published,deleted,hidden) VALUES(?,?,?,?,?,?,?)',u.id+'-map-'+i,u.id,'original',1,'{}',0,0);await store.exec('INSERT INTO accounts(id,username,username_key,password,verified,garage) SELECT ?,?,?,password,0,? FROM accounts WHERE id=?','unverified','Unverified','unverified',JSON.stringify({earned:99999999,iscoins:99999999}),alpha.id);});
after(async()=>{
 if(process.env.ISLA_V23_FIXTURE){const boards={};for(const category of ['aura','iscoins','stars'])for(const scope of ['top','friends'])for(const page of (scope==='friends'?[0,1]:[0]))boards[category+':'+scope+':'+page]=await board(category,scope,alpha,page);const profiles={};for(const u of [alpha,gamma])profiles[u.id]=(await api('profile?id='+u.id)).data.account;require('node:fs').writeFileSync(process.env.ISLA_V23_FIXTURE,JSON.stringify({account:profiles[alpha.id],profiles,boards}));}
 await mf?.dispose();
});
test('leaderboards require an account and validate categories, scopes and methods',async()=>{
 assert.equal((await api('leaderboard',undefined,null)).status,401);
 for(const query of ['category=balance','category=__proto__','scope=everyone','page=-1','page=NaN'])assert.equal((await api('leaderboard?'+query)).status,400);
 assert.equal((await api('leaderboard',{})).status,405);
});
test('global rankings use lifetime Aura, current Iscoins and approved visible stars with shared tie ranks',async()=>{
 const aura=await board();assert.deepEqual(aura.items.map(p=>p.id),[delta.id,beta.id,alpha.id,gamma.id]);assert.deepEqual(aura.items.map(p=>p.globalRank),[1,2,3,3]);assert.equal(aura.me.score,1000);assert.equal(aura.me.friendRank,2);assert(!JSON.stringify(aura).includes('Hidden_Driver'));assert(!JSON.stringify(aura).includes('Unverified'));
 const coins=await board('iscoins');assert.deepEqual(coins.items.map(p=>p.id),[gamma.id,alpha.id,beta.id,delta.id]);assert.equal(coins.me.globalRank,2);
 const stars=await board('stars');assert.deepEqual(stars.items.map(p=>p.score),[3,2,1]);assert.equal(stars.me.globalRank,2);assert.equal(stars.me.friendRank,2);
});
test('You & friends includes accepted friends and self, with both global and friend ranks and zero-star dashes',async()=>{
 const aura=await board('aura','friends');assert.deepEqual(aura.items.map(p=>p.id),[beta.id,alpha.id,gamma.id]);assert.deepEqual(aura.items.map(p=>p.friendRank),[1,2,2]);assert.deepEqual(aura.items.map(p=>p.globalRank),[2,3,3]);
 const stars=await board('stars','friends');const zero=stars.items.find(p=>p.id===gamma.id);assert.equal(zero.score,0);assert.equal(zero.globalRank,null);assert.equal(zero.friendRank,null);assert(!stars.items.some(p=>p.id===delta.id||p.id===hidden.id));
 const personal=await board('stars','top',gamma);assert.equal(personal.me.score,0);assert.equal(personal.me.globalRank,null);assert.equal(personal.me.friendRank,null);
});
test('category hiding excludes balances and ranks from both boards and profile badges immediately',async()=>{
 await settings(alpha,{showAura:false});let data=await board('aura');assert(!data.items.some(p=>p.id===alpha.id));assert.equal(data.me.score,null);assert.equal(data.me.globalRank,null);assert.equal(data.me.friendRank,null);assert(data.me.excluded);assert(!(await board('aura','friends')).items.some(p=>p.id===alpha.id));assert((await board('iscoins')).items.some(p=>p.id===alpha.id));
 let p=(await api('profile?id='+alpha.id,undefined,beta)).data.account;assert.equal(p.aura,null);assert.equal(p.ranks.aura,null);assert.equal(p.ranks.iscoins,2);
 await settings(gamma,{showIscoins:false});data=await board('iscoins','friends');assert(!data.items.some(p=>p.id===gamma.id));assert.equal(data.me.globalRank,1);p=(await api('profile?id='+gamma.id,undefined,beta)).data.account;assert.equal(p.iscoins,null);assert.equal(p.ranks.iscoins,null);
 await settings(alpha);await settings(gamma);
});
test('the optional profile rank panel is account-owned, persists and never bypasses signed-in access',async()=>{
 let p=(await api('profile?id='+alpha.id)).data.account;assert(p.showRanks);assert.deepEqual(p.ranks,{aura:3,iscoins:2,stars:2});assert.equal((await api('profile?id='+alpha.id,undefined,null)).data.account.ranks,null);
 await settings(alpha,{showRanks:false,id:beta.id});assert.equal((await api('profile?id='+alpha.id,undefined,beta)).data.account.ranks,null);assert.equal((await api('profile?id='+beta.id)).data.account.showRanks,true);assert((await board()).items.some(p=>p.id===alpha.id));
 revision++;await mf.setOptions(options());url=await mf.ready;await api('me');store=await mf.unsafeGetDurableObjectStorage('v23-test','CommunityHub',{name:'isla-community-v16'});
 assert.equal((await api('profile?id='+alpha.id)).data.account.showRanks,false);await settings(alpha);assert.equal((await api('profile?id='+alpha.id)).data.account.showRanks,false);
 assert.equal((await api('profile',{mood:'cosmic',showAura:true,showRanks:'yes'})).status,400);await settings(alpha,{showRanks:true});assert((await api('profile?id='+alpha.id)).data.account.ranks.aura);
});
test('friend removal and blocking update the friend ranking without changing global ranks',async()=>{
 await api('social/block',{id:beta.id,block:true});let b=await board('aura','friends');assert.deepEqual(b.items.map(p=>p.id),[alpha.id,gamma.id]);assert.equal(b.me.friendRank,1);assert.equal(b.me.globalRank,3);await api('social/block',{id:beta.id,block:false});await friend(beta);
});
test('revoked, hidden, deleted and unpublished maps do not contribute stars or stale profile ranks',async()=>{
 for(const [id,approved,published,deleted,hiddenFlag]of [['pending',0,'{}',0,0],['hidden',1,'{}',0,1],['deleted',1,'{}',1,0],['draft',1,null,0,0]])await store.exec('INSERT INTO maps(id,owner,approved,published,deleted,hidden) VALUES(?,?,?,?,?,?)',id,alpha.id,approved,published,deleted,hiddenFlag);
 assert.equal((await board('stars')).me.score,2);await store.exec('UPDATE maps SET approved=0 WHERE owner=?',alpha.id);assert.equal((await board('stars')).me.score,0);assert.equal((await board('stars')).me.globalRank,null);assert.equal((await api('profile?id='+alpha.id)).data.account.ranks.stars,null);
 await store.exec('UPDATE maps SET approved=1 WHERE id=? OR id=?',alpha.id+'-map-0',alpha.id+'-map-1');
});
test('Top 100 has exactly 100 rows and retains the viewer rank outside the cutoff; friend paging is complete',async()=>{
 for(let i=0;i<106;i++){const id='seed-'+i,name='Seed_'+String(i).padStart(3,'0'),g=JSON.stringify({balance:0,earned:20000+i,iscoins:i,showIscoins:true});await store.exec('INSERT INTO accounts(id,username,username_key,password,verified,garage) SELECT ?,?,?,password,1,? FROM accounts WHERE id=?',id,name,name.toLowerCase(),g,alpha.id);const [first,second]=[alpha.id,id].sort();await store.exec('INSERT INTO friendships VALUES(?,?,?,?,?,?)',first+':'+second,first,second,alpha.id,'accepted',Date.now());}
 const top=await board();assert.equal(top.items.length,100);assert.equal(top.total,110);assert(!top.items.some(p=>p.id===alpha.id));assert.equal(top.me.globalRank,109);assert.equal(top.me.friendRank,108);
 const first=await board('aura','friends'),second=await board('aura','friends',alpha,1);assert.equal(first.total,109);assert.equal(first.pages,2);assert.equal(first.items.length,100);assert.equal(second.items.length,9);assert.equal(new Set([...first.items,...second.items].map(p=>p.id)).size,109);assert.deepEqual(first.me,second.me);
});
