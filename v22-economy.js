import '../public/v22-shared.js';
import world from './world-data.json';
const V=globalThis.IslaV22,fail=(m,s=400)=>{throw Object.assign(Error(m),{status:s});};
const maps=new Set(['islands','city','peaks','playplace','fern']);
export function installV22(h){
 h.db.exec(`CREATE TABLE IF NOT EXISTS v22_grants(id TEXT PRIMARY KEY,account TEXT NOT NULL,aura INTEGER NOT NULL,coins INTEGER NOT NULL,at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS v22_coins(account TEXT,map TEXT,coin INTEGER,at INTEGER,PRIMARY KEY(account,map,coin));
 CREATE TABLE IF NOT EXISTS v22_buildings(account TEXT,map TEXT,building TEXT,at INTEGER,PRIMARY KEY(account,map,building));
 CREATE TABLE IF NOT EXISTS v22_events(account TEXT,event TEXT,kind TEXT,map TEXT,target TEXT,amount INTEGER,at INTEGER,PRIMARY KEY(account,event));
 CREATE TABLE IF NOT EXISTS v224_vault_claims(account TEXT,code TEXT,currency TEXT,amount INTEGER,at INTEGER,PRIMARY KEY(account,code));
 CREATE INDEX IF NOT EXISTS v22_event_recent ON v22_events(account,kind,at);`);
 // One-time migration resolves the already-existing exact account, then pins its ID in the audit record.
 // No public claim endpoint and no guest/player-name match grants any currency.
 h.ctx.storage.transactionSync(()=>{
  const id='isla-v22-cado-codes-test-credit';if(h.one('SELECT 1 FROM v22_grants WHERE id=?',id))return;
  const a=h.one('SELECT id,garage FROM accounts WHERE username_key=? AND verified=1','cado_codes');if(!a)return;
  const g=V.normalize(JSON.parse(a.garage));g.balance=Math.min(1e12,g.balance+5000000);g.earned=Math.min(1e12,g.earned+5000000);g.iscoins=Math.min(1e12,g.iscoins+10000);
  h.db.exec('UPDATE accounts SET garage=? WHERE id=?',JSON.stringify(g),a.id);
  h.db.exec('INSERT INTO v22_grants VALUES(?,?,?,?,?)',id,a.id,5000000,10000,Date.now());
 });
}
function context(h,a,runId,withCoins=false){const run=h.one('SELECT * FROM rewards WHERE id=? AND account=?',runId,a.id);if(!run||Date.now()-run.at>8*3600000)fail('Start driving again to refresh this session.',409);let data;if(maps.has(run.map))data=run.map==='islands'?world:world.maps[run.map];else{const map=h.publicMap(run.map);if(!map.approved||map.revision!==run.revision)fail('This map revision is not approved for rewards.',403);data=globalThis.IslaMaker.worldData(JSON.parse(map.published),withCoins?run.id:'');}if(withCoins&&maps.has(run.map)){h.v233Layouts??=new Map();let coins=h.v233Layouts.get(run.id);if(!coins){coins=V.visitCoins(data,run.id);if(h.v233Layouts.size>=24)h.v233Layouts.delete(h.v233Layouts.keys().next().value);h.v233Layouts.set(run.id,coins);}data={...data,coins};}return {run,data};}
function position(p){return p&&['x','y','z'].every(k=>Number.isFinite(p[k])&&Math.abs(p[k])<20000);}
export function rewardProfile(garage,own){const g=V.normalize(garage);return {showIscoins:g.showIscoins,iscoins:g.showIscoins||own?g.iscoins:null};}
export async function v22Route(h,{path,method,body,a,need}){
 if(!path.startsWith('v22/')&&path!=='v224/vault')return null;need();if(method!=='POST')fail('Use a POST request.',405);const now=Date.now();
 const fresh=()=>V.normalize(JSON.parse(h.one('SELECT garage FROM accounts WHERE id=?',a.id).garage));
 const save=g=>h.db.exec('UPDATE accounts SET garage=? WHERE id=?',JSON.stringify(g),a.id);
 const vaultRewards=[
  ['Cado_Codes','iscoins',15],['Fern Valley','aura',5000],['1234','aura',1234],['Supernova','aura',1],
  ['Mount inferno','iscoins',10],['Drive without limits','aura',2000],['ISLA','aura',5],['Why','iscoins',5],
  ['Impossible','aura',6000],['The Beast','iscoins',3],['Cats_Are_The_Best','aura',10000],
  ['Iscoins','aura',1000],['Aura','iscoins',10],['Password','iscoins',1],['Dogs_Are_Kinda_Cool_I_Guess','iscoins',30]
 ];
 if(path==='v224/vault'){
  if(!['status','redeem'].includes(body.action))fail('Unknown vault action.');
  const remaining=g=>Math.max(0,1000000-(Number.isFinite(g.earned)?g.earned:0));
  if(body.action==='status'){const g=fresh(),missing=remaining(g);return {garage:g,access:missing===0,remaining:missing};}
  h.limit('vault:'+a.id,30,10000);
  if(typeof body.code!=='string'||body.code.length>100)fail('Access denied. Unknown passcode.');
  const code=body.code.trim().toLowerCase(),reward=vaultRewards.find(r=>r[0].toLowerCase()===code);
  return h.ctx.storage.transactionSync(()=>{
   const g=fresh(),missing=remaining(g);
   if(missing)fail('System Error. Error code: needs '+missing.toLocaleString('en-US')+' amount of aura.',403);
   if(!reward)fail('Access denied. Unknown passcode.');
   if(h.one('SELECT 1 FROM v224_vault_claims WHERE account=? AND code=?',a.id,code))fail('This passcode has already been claimed on your account.',409);
   const [,currency,amount]=reward;
   if(currency==='aura'){g.balance=Math.min(1e12,g.balance+amount);g.earned=Math.min(1e12,g.earned+amount);}else g.iscoins=Math.min(1e12,g.iscoins+amount);
   save(g);h.db.exec('INSERT INTO v224_vault_claims VALUES(?,?,?,?,?)',a.id,code,currency,amount,now);
   return {garage:g,claimed:true,reward:{currency,amount}};
  });
 }
 if(path==='v22/upgrade'||path==='v22/level')return h.ctx.storage.transactionSync(()=>{const g=fresh();try{if(path.endsWith('/upgrade'))V.purchase(g,body.car,body.level);else V.chooseLevel(g,body.car,body.level);}catch(e){fail(e.message);}save(g);return {garage:g};});
 if(path==='v22/settings'){const g=fresh();if(body.trailColor!==undefined){if(!/^#[0-9a-f]{6}$/i.test(body.trailColor))fail('Choose a six-digit trail color.');g.trailColor=body.trailColor.toLowerCase();}if(typeof body.showIscoins==='boolean')g.showIscoins=body.showIscoins;if(typeof body.manualNukes==='boolean')g.manualNukes=body.manualNukes;save(g);return {garage:g};}
 const {run,data}=context(h,a,body.run,path==='v22/map'||path==='v22/collect');
 if(path==='v22/map')return {coins:data.coins||[],claimed:h.rows('SELECT coin,at FROM v22_coins WHERE account=? AND map=? AND at>?',a.id,run.map,now-V.coinRespawn),respawn:V.coinRespawn};
 if(path==='v22/collect'){
  h.limit('coin:'+a.id,12,1000);const coin=data.coins?.find(c=>c.id===body.coin),g=fresh();if(!coin||!position(body.position)||Math.hypot(body.position.x-coin.x,body.position.z-coin.z)>7||Math.abs(body.position.y-coin.y)>6)fail('Drive closer to that coin.');
  return h.ctx.storage.transactionSync(()=>{const previous=h.one('SELECT at FROM v22_coins WHERE account=? AND map=? AND coin=?',a.id,run.map,coin.id);if(previous&&now-previous.at<V.coinRespawn)return {garage:fresh(),collected:false,readyAt:previous.at+V.coinRespawn};const current=fresh();current.iscoins=Math.min(1e12,current.iscoins+coin.value);save(current);h.db.exec('INSERT OR REPLACE INTO v22_coins VALUES(?,?,?,?)',a.id,run.map,coin.id,now);return {garage:current,collected:true,value:coin.value,readyAt:now+V.coinRespawn};});
 }
 if(path==='v22/reward'){
  const {kind,event}=body;if(!V.rewards[kind]||kind==='repeat'||typeof event!=='string'||!/^[A-Za-z0-9:_-]{8,100}$/.test(event))fail('Invalid activity.');
  const duplicate=h.one('SELECT amount FROM v22_events WHERE account=? AND event=?',a.id,event);if(duplicate)return {garage:fresh(),awarded:false,points:0};
  h.limit('activity:'+a.id,40,10000);const g=fresh();if(!g.owned.includes(body.car)||!position(body.position))fail('Invalid car or position.');
  let target=String(body.target??'').slice(0,140),b=null,category=kind;
  if(kind==='ram'||kind==='nuke'){
   b=data.buildings.find(b=>b.id===body.target);if(!b)fail('That building is not in this map.');if(kind==='nuke'&&body.car!=='nuker')fail('Use Nuker for this activity.');
   const distance=Math.hypot(body.position.x-b.x,body.position.z-b.z);if(distance>Math.hypot(b.w,b.d)/2+(kind==='nuke'?160:20))fail('Drive closer to that building.');target=V.buildingKey(b);category='building';
  }else if(kind==='drift'){if(!(body.duration>=2&&body.duration<=120&&body.speed>=7&&body.speed<=200))fail('Complete a controlled drift first.');}
  else if(kind==='launch'){if(body.car!=='launcher'||!body.target||!(body.speed>=(V.catalog.launcher[g.levels.launcher]?.params.launchMinimum??150/3.6)&&body.speed<=200))fail('Launch an object with Launcher first.');}
  else if(kind==='basket'){if(run.map!=='playplace'||!Number.isInteger(body.ball)||body.ball<0||body.ball>=14||!/^basket:[A-Za-z0-9:_-]{8,90}$/.test(target)||event!==target)fail('Score a basket in The Playplace first.');}
  else if(['strike','spare','slide'].includes(kind)){if(run.map!=='playplace')fail('This activity is in The Playplace.');if(kind==='slide'&&!(body.duration>=2&&body.duration<=120))fail('Complete the waterslide first.');if(kind!=='slide'&&body.pins!==10)fail('Complete the bowling roll first.');}
  const previous=h.one('SELECT at FROM v22_events WHERE account=? AND kind=? AND map=? AND target=? ORDER BY at DESC LIMIT 1',a.id,category,run.map,target);
  const wait=category==='building'?8000:kind==='drift'?2500:kind==='launch'?750:kind==='slide'?8000:8000;
  if(previous&&now-previous.at<wait)fail('Complete another activity before claiming this reward.',429);
  return h.ctx.storage.transactionSync(()=>{let which=kind;if(b){if(h.one('SELECT 1 FROM v22_buildings WHERE account=? AND map=? AND building=?',a.id,run.map,target))which='repeat';else h.db.exec('INSERT INTO v22_buildings VALUES(?,?,?,?)',a.id,run.map,target,now);}const points=V.reward(which,event),current=fresh();current.balance=Math.min(1e12,current.balance+points);current.earned=Math.min(1e12,current.earned+points);save(current);h.db.exec('INSERT INTO v22_events VALUES(?,?,?,?,?,?,?)',a.id,event,category,run.map,target,points,now);return {garage:current,awarded:true,points,repeat:which==='repeat'};});
 }
 fail('Unknown V2.2 action.',404);
}
