import {DurableObject} from 'cloudflare:workers';
import {scrypt as nodeScrypt, timingSafeEqual} from 'node:crypto';
import '../public/maker-core.js';
import '../public/player-rules.js';
const M=globalThis.IslaMaker,DAY=86400000,COOKIE='__Host-isla_session';
const prices={classic:0,rally:30000,gt:80000,truck:70000,solstice:180000,moonlight:250000,nuker:275000,plane:300000,firetruck:135000,stick:315000,beast:320000};
const json=(v,status=200,headers={})=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const retryLater=seconds=>{const retryAfter=Math.max(1,Math.ceil(seconds));throw Object.assign(Error('Too many attempts. Try again in '+Math.floor(retryAfter/60)+':'+String(retryAfter%60).padStart(2,'0')+'.'),{status:429,retryAfter});};
const clean=(v,max)=>{if(typeof v!=='string'||v.trim().length<1||v.length>max)fail('Use between 1 and '+max+' characters.');return v.trim();};
const uid=()=>crypto.randomUUID(),hex=b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
const digest=async s=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
const emptyGarage=()=>({balance:0,earned:0,bestChain:0,owned:['classic'],selected:'classic',colors:{}});
export const censor=text=>text.replace(/f[\W_]*u[\W_]*c[\W_]*k(?:ing|ed|er|s)?|s[\W_]*h[\W_]*i[\W_]*t(?:ty|s)?|b[\W_]*i[\W_]*t[\W_]*c[\W_]*h(?:es)?|c[\W_]*u[\W_]*n[\W_]*t|\b(?:asshole|bastard|dick|pussy|cock|nigg\w*|fagg\w*|damn|hell)\b/gi,'****');
function validatePassword(p){if(typeof p!=='string'||p.length<12||p.length>128)fail('Use a password with 12–128 characters.');}
export const passwordHash=(password,salt=hex(crypto.getRandomValues(new Uint8Array(16))))=>new Promise((resolve,reject)=>nodeScrypt(password,salt,32,{N:16384,r:8,p:5,maxmem:32*1024*1024},(e,k)=>e?reject(e):resolve(salt+':'+hex(k))));
export async function passwordMatches(password,stored){if(typeof password!=='string'||password.length>128)return false;const salt=stored.split(':')[0],actual=await passwordHash(password,salt);return actual.length===stored.length&&timingSafeEqual(new TextEncoder().encode(actual),new TextEncoder().encode(stored));}
export class CommunityHub extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env;this.db=ctx.storage.sql;this.queue=Promise.resolve();ctx.blockConcurrencyWhile(async()=>{
  this.db.exec(`CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,username TEXT NOT NULL,username_key TEXT UNIQUE,email TEXT UNIQUE,password TEXT NOT NULL,verified INTEGER DEFAULT 0,mood TEXT DEFAULT 'summer',show_aura INTEGER DEFAULT 1,garage TEXT NOT NULL,created INTEGER,last_comment INTEGER DEFAULT 0,imported INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,account TEXT,expires INTEGER);
CREATE TABLE IF NOT EXISTS recovery_keys(account TEXT PRIMARY KEY,hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS codes(email TEXT,purpose TEXT,hash TEXT,expires INTEGER,tries INTEGER DEFAULT 0,PRIMARY KEY(email,purpose));
CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,at INTEGER,count INTEGER);
CREATE TABLE IF NOT EXISTS account_grants(id TEXT PRIMARY KEY,account TEXT NOT NULL,amount INTEGER NOT NULL,applied INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS maps(id TEXT PRIMARY KEY,owner TEXT,slot INTEGER,kind TEXT,name TEXT,description TEXT,draft TEXT,preview TEXT,published TEXT,published_preview TEXT,revision INTEGER DEFAULT 0,approved INTEGER DEFAULT 0,approved_at INTEGER DEFAULT 0,published_at INTEGER DEFAULT 0,updated INTEGER,deleted INTEGER DEFAULT 0,hidden INTEGER DEFAULT 0,source TEXT,source_name TEXT,fingerprint TEXT);
CREATE TABLE IF NOT EXISTS likes(account TEXT,map TEXT,at INTEGER,PRIMARY KEY(account,map));
CREATE TABLE IF NOT EXISTS follows(account TEXT,creator TEXT,at INTEGER,PRIMARY KEY(account,creator));
CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY,account TEXT,map TEXT,text TEXT,at INTEGER);
CREATE TABLE IF NOT EXISTS plays(visitor TEXT,map TEXT,at INTEGER,PRIMARY KEY(visitor,map,at));
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,account TEXT,map TEXT,reason TEXT,detail TEXT,at INTEGER,resolved INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS rewards(id TEXT PRIMARY KEY,account TEXT,map TEXT,revision INTEGER,at INTEGER,last INTEGER,total INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS reward_events(id TEXT PRIMARY KEY,run TEXT,at INTEGER);
CREATE INDEX IF NOT EXISTS maps_owner ON maps(owner,deleted);CREATE INDEX IF NOT EXISTS plays_recent ON plays(at);CREATE INDEX IF NOT EXISTS comments_map ON comments(map,at);`);
  this.applyAccountGrants();
  if(!await ctx.storage.getAlarm())await ctx.storage.setAlarm(Date.now()+DAY);
 });}
 rows(q,...a){return [...this.db.exec(q,...a)];}one(q,...a){return this.rows(q,...a)[0];}
 count(q,...a){return Number(this.one(q,...a)?.n||0);}
 applyAccountGrants(){
  // Owner-requested credit, pinned to the existing account ID. No public claim route.
  const grant={id:'momster-500k-2026-10-18',account:'b2d58971-f977-47c6-8c22-1b9e4debbd04',amount:500000};
  this.ctx.storage.transactionSync(()=>{
   if(this.one('SELECT 1 FROM account_grants WHERE id=?',grant.id))return;
   const a=this.one('SELECT garage FROM accounts WHERE id=? AND verified=1',grant.account);if(!a)return;
   const g=JSON.parse(a.garage);g.balance=Math.min(1e12,g.balance+grant.amount);g.earned=Math.min(1e12,g.earned+grant.amount);
   this.db.exec('UPDATE accounts SET garage=? WHERE id=?',JSON.stringify(g),grant.account);
   this.db.exec('INSERT INTO account_grants VALUES(?,?,?,?)',grant.id,grant.account,grant.amount,Date.now());
  });
 }
 // Ownership is granted only by the deployment operator, never by public signup.
 owner(a){return !!a?.verified&&!!this.env.OWNER_ACCOUNT_ID&&a.id===this.env.OWNER_ACCOUNT_ID.trim();}
 async newRecovery(a){const raw=hex(crypto.getRandomValues(new Uint8Array(16))).toUpperCase();this.db.exec('INSERT OR REPLACE INTO recovery_keys VALUES(?,?)',a.id,await digest(a.id+':'+raw));return raw.match(/.{4}/g).join('-');}
 async loginWithRecovery(a,remember=true,rotate=false){const recoveryCode=rotate||!this.one('SELECT 1 FROM recovery_keys WHERE account=?',a.id)?await this.newRecovery(a):null;const response=await this.login(a,remember);return json({...await response.json(),...(recoveryCode?{recoveryCode}:{})},200,{'Set-Cookie':response.headers.get('Set-Cookie')});}
 limitWait(key,max,period){const row=this.one('SELECT * FROM limits WHERE key=?',key);return row&&row.count>=max?Math.max(0,Math.ceil((row.at+period-Date.now())/1000)):0;}
 limit(key,max,period){const now=Date.now(),row=this.one('SELECT * FROM limits WHERE key=?',key);if(!row||now-row.at>=period)this.db.exec('INSERT OR REPLACE INTO limits VALUES(?,?,1)',key,now);else{if(row.count>=max)retryLater((row.at+period-now)/1000);this.db.exec('UPDATE limits SET count=count+1 WHERE key=?',key);}}
 async session(request){const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-isla_session=([^;]+)/)?.[1];if(!token||token.length>200)return null;const hash=await digest(token);return this.one('SELECT a.* FROM accounts a JOIN sessions s ON s.account=a.id WHERE s.token=? AND s.expires>? AND a.verified=1',hash,Date.now())||null;}
 async login(a,remember=true){const token=uid()+uid();await this.db.exec('INSERT INTO sessions VALUES(?,?,?)',await digest(token),a.id,Date.now()+(remember?30:1)*DAY);return json({account:this.profile(a,a),garage:JSON.parse(a.garage)},200,{'Set-Cookie':`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax${remember?'; Max-Age=2592000':''}`});}
 profile(a,viewer){if(!a)return null;const own=viewer?.id===a.id,stars=this.count('SELECT COUNT(*) n FROM maps WHERE owner=? AND approved=1 AND published IS NOT NULL AND deleted=0 AND hidden=0',a.id),g=JSON.parse(a.garage);return {id:a.id,username:a.username,stars,mood:a.mood,showAura:!!a.show_aura,aura:a.show_aura||own?g.balance:null,followers:this.count('SELECT COUNT(*) n FROM follows WHERE creator=?',a.id),following:!!viewer&&!!this.one('SELECT 1 FROM follows WHERE account=? AND creator=?',viewer.id,a.id),...(own?{owner:this.owner(a),imported:!!a.imported,recoveryReady:!!this.one('SELECT 1 FROM recovery_keys WHERE account=?',a.id)}:{})};}
 mapInfo(m,viewer){const creator=this.one('SELECT * FROM accounts WHERE id=?',m.owner);return {id:m.id,name:m.name,description:m.description,preview:m.published_preview||m.preview,creator:this.profile(creator,viewer),approved:!!m.approved,revision:m.revision,likes:this.count('SELECT COUNT(*) n FROM likes WHERE map=?',m.id),comments:this.count('SELECT COUNT(*) n FROM comments WHERE map=?',m.id),plays:this.count('SELECT COUNT(DISTINCT visitor) n FROM plays WHERE map=?',m.id),liked:!!viewer&&!!this.one('SELECT 1 FROM likes WHERE map=? AND account=?',m.id,viewer.id),source:m.source?{id:m.source,name:m.source_name}:null,at:m.published_at,updated:m.updated};}
 draftInfo(m){return {id:m.id,slot:m.slot,kind:m.kind,name:m.name,description:m.description,document:JSON.parse(m.draft),preview:m.preview,deleted:m.deleted,expires:m.deleted?m.deleted+5*DAY:null,published:!!m.published,approved:!!m.approved,revision:m.revision,updated:m.updated,source:m.source?{id:m.source,name:m.source_name}:null};}
 async fetch(request){const run=()=>this.handle(request).catch(e=>json({error:e.status?e.message:'Something went wrong. Please try again.',...(e.retryAfter?{retryAfter:e.retryAfter}:{})},e.status||500,e.retryAfter?{'Retry-After':String(e.retryAfter)}:{}));const response=this.queue.then(run,run);this.queue=response.then(()=>{});return response;}
 async handle(request){
  const url=new URL(request.url),path=url.pathname.replace(/^\/api\//,''),method=request.method,now=Date.now(),ip=request.headers.get('CF-Connecting-IP')||'local';
  if(!['GET','POST'].includes(method))fail('Method not allowed.',405);
  if(method==='POST'&&(request.headers.get('Origin')!==url.origin||!request.headers.get('Content-Type')?.startsWith('application/json')))fail('Request origin not allowed.',403);
  this.limit('api:'+ip,240,60000);let body={};if(method==='POST'){const reader=request.body?.getReader();let bytes=0,chunks=[];if(reader)while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>1800000){await reader.cancel();fail('This map is too large.',413);}chunks.push(value);}try{body=JSON.parse(new TextDecoder().decode((()=>{const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}return buffer;})()));}catch{fail('Invalid request.');}}
  if(!body||typeof body!=='object'||Array.isArray(body))fail('Invalid request.');
  const a=await this.session(request),need=()=>{if(!a)fail('Sign in to do that.',401);return a;},admin=()=>{need();if(!this.owner(a))fail('Only the owner can approve and moderate maps.',403);};
  if(path==='me'&&method==='GET')return json({account:this.profile(a,a),garage:a?JSON.parse(a.garage):null,authMode:'password-recovery'});
  if(path==='auth/signup'&&method==='POST'){
   this.limit('signup:'+ip,5,3600000);const username=clean(body.username,20),nameError=globalThis.IslaRules.validateName(username);if(nameError)fail(nameError);validatePassword(body.password);
   if(this.one('SELECT id FROM accounts WHERE username_key=?',username.toLowerCase()))fail('That username is already in use. Choose another or sign in.',409);
   const id=uid(),password=await passwordHash(body.password);this.db.exec('INSERT INTO accounts(id,username,username_key,email,password,verified,garage,created) VALUES(?,?,?,NULL,?,1,?,?)',id,username,username.toLowerCase(),password,JSON.stringify(emptyGarage()),now);
   return this.loginWithRecovery(this.one('SELECT * FROM accounts WHERE id=?',id),body.remember!==false);
  }
  if(['auth/verify','auth/resend','auth/forgot'].includes(path)&&method==='POST')fail('ISLA now uses usernames, passwords and recovery codes. Refresh the game to continue.',410);
  if(path==='auth/login'&&method==='POST'){
   const key=clean(body.username,254).toLowerCase();
   // Only failed sign-ins count. New keys discard the old successful-attempt lockouts.
   const nameBucket='login-failed-name:v2:'+key,ipBucket='login-failed-ip:v2:'+ip,period=600000;
   const wait=Math.max(this.limitWait(nameBucket,12,period),this.limitWait(ipBucket,60,period));if(wait)retryLater(wait);
   const user=this.one('SELECT * FROM accounts WHERE username_key=? OR email=?',key,key),hash=user?.password||'00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000';
   if(!await passwordMatches(body.password,hash)||!user){this.limit(nameBucket,12,period);this.limit(ipBucket,60,period);fail('Incorrect username or password.',401);}
   this.db.exec('DELETE FROM limits WHERE key=?',nameBucket);
   // Legacy pending accounts can activate with their original password. Email no longer grants privileges.
   if(!user.verified){this.db.exec('UPDATE accounts SET verified=1 WHERE id=?',user.id);user.verified=1;}
   return this.loginWithRecovery(user,body.remember!==false);
  }
  if(path==='auth/reset'&&method==='POST'){
   this.limit('reset:'+ip,10,600000);const key=clean(body.username,254).toLowerCase();this.limit('reset-name:'+key,5,600000);validatePassword(body.password);
   const code=typeof body.code==='string'&&body.code.length<=80?body.code.replace(/[\s-]/g,'').toUpperCase():'';
   const user=this.one('SELECT * FROM accounts WHERE username_key=? OR email=?',key,key),saved=user&&this.one('SELECT hash FROM recovery_keys WHERE account=?',user.id);
   const actual=await digest((user?.id||'unknown')+':'+code),expected=saved?.hash||'0'.repeat(64);
   if(!/^[A-F0-9]{32}$/.test(code)||!timingSafeEqual(new TextEncoder().encode(actual),new TextEncoder().encode(expected))||!saved)fail('Incorrect username or recovery code.');
   this.db.exec('UPDATE accounts SET password=?,verified=1 WHERE id=?',await passwordHash(body.password),user.id);user.verified=1;
   this.db.exec('DELETE FROM sessions WHERE account=?',user.id);return this.loginWithRecovery(user,body.remember!==false,true);
  }
  if((path==='auth/password'||path==='auth/recovery')&&method==='POST'){
   need();this.limit('account-security:'+a.id,6,600000);if(!await passwordMatches(body.current,a.password))fail('Current password is incorrect.',401);
   if(path==='auth/password'){validatePassword(body.password);this.db.exec('UPDATE accounts SET password=? WHERE id=?',await passwordHash(body.password),a.id);}
   this.db.exec('DELETE FROM sessions WHERE account=?',a.id);return this.loginWithRecovery(a,true,true);
  }
  if(path==='auth/logout'&&method==='POST'){const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-isla_session=([^;]+)/)?.[1];if(token)this.db.exec('DELETE FROM sessions WHERE token=?',await digest(token));return json({ok:true},200,{'Set-Cookie':`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`});}
  if(path==='profile'&&method==='GET'){const user=this.one('SELECT * FROM accounts WHERE id=? AND verified=1',url.searchParams.get('id'));if(!user)fail('Account not found.',404);return json({account:this.profile(user,a)});}
  if(path==='profile'&&method==='POST'){need();if(!['summer','cosmic','snowy'].includes(body.mood)||typeof body.showAura!=='boolean')fail('Choose a valid profile mood.');this.db.exec('UPDATE accounts SET mood=?,show_aura=? WHERE id=?',body.mood,body.showAura?1:0,a.id);return json({ok:true});}
  if(path==='follow'&&method==='POST'){need();if(body.id===a.id||!this.one('SELECT id FROM accounts WHERE id=? AND verified=1',body.id))fail('Choose another creator.');if(body.follow)this.db.exec('INSERT OR IGNORE INTO follows VALUES(?,?,?)',a.id,body.id,now);else this.db.exec('DELETE FROM follows WHERE account=? AND creator=?',a.id,body.id);return json({ok:true});}
  if(path==='drafts'&&method==='GET'){need();await this.purge();return json({maps:this.rows('SELECT * FROM maps WHERE owner=? ORDER BY updated DESC',a.id).map(m=>this.draftInfo(m))});}
  if(path==='drafts/save'&&method==='POST'){
   need();const map=M.validate(body.document),name=typeof body.name==='string'&&body.name.trim()?clean(body.name,30):'',description=typeof body.description==='string'?body.description.trim():'';if(description.length>150)fail('Descriptions can have up to 150 characters.');if(censor(name)!==name||censor(description)!==description)fail('Remove profanity from the map name and description.');const preview=this.preview(body.preview),old=body.id?this.one('SELECT * FROM maps WHERE id=?',body.id):null;if(body.id&&!old)fail('Map not found.',404);if(old&&(old.owner!==a.id||old.deleted))fail('This map is not editable.',403);let slot=old?.slot;
   if(!old){slot=Number(body.slot);if(!Number.isInteger(slot)||slot<0||slot>=30)fail('Choose one of your 30 map slots.');if(this.one("SELECT id FROM maps WHERE owner=? AND slot=? AND kind='original' AND deleted=0",a.id,slot))fail('That slot already has a map.',409);}
   const id=old?.id||uid();if(old)this.db.exec('UPDATE maps SET name=?,description=?,draft=?,preview=?,updated=? WHERE id=?',name,description,JSON.stringify(map),preview,now,id);else this.db.exec("INSERT INTO maps(id,owner,slot,kind,name,description,draft,preview,updated) VALUES(?,?,?,'original',?,?,?,?,?)",id,a.id,slot,name,description,JSON.stringify(map),preview,now);return json({map:this.draftInfo(this.one('SELECT * FROM maps WHERE id=?',id))});
  }
  if(path==='drafts/rename'&&method==='POST'){need();const m=this.owned(body.id,a),name=clean(body.name,30),description=String(body.description||'').trim();if(censor(name)!==name||censor(description)!==description)fail('Remove profanity from the map name and description.');if(description.length>150)fail('Descriptions can have up to 150 characters.');this.db.exec('UPDATE maps SET name=?,description=?,updated=? WHERE id=?',name,description,now,m.id);return json({ok:true});}
  if(path==='drafts/delete'&&method==='POST'){need();const m=this.owned(body.id,a);this.db.exec('UPDATE maps SET deleted=?,approved=0 WHERE id=?',now,m.id);return json({ok:true});}
  if(path==='drafts/restore'&&method==='POST'){need();await this.purge();const m=this.owned(body.id,a,true);if(!m.deleted)fail('This map is not in the trash.');let slot=m.slot;if(m.kind==='original'){const used=new Set(this.rows("SELECT slot FROM maps WHERE owner=? AND kind='original' AND deleted=0",a.id).map(x=>x.slot));if(used.has(slot)){slot=Array.from({length:30},(_,i)=>i).find(i=>!used.has(i));if(slot===undefined)fail('Free a map slot before restoring this map.');}}this.db.exec('UPDATE maps SET deleted=0,slot=?,updated=? WHERE id=?',slot,now,m.id);return json({ok:true});}
  if(path==='maps/publish'&&method==='POST'){need();this.limit('publish:'+a.id,10,3600000);const m=this.owned(body.id,a);clean(m.name,30);if(censor(m.name)!==m.name||censor(m.description)!==m.description)fail('Remove profanity from the map name and description.');const map=M.validate(JSON.parse(m.draft)),height=M.field(map),sp=map.objects.find(o=>o.type==='spawn');if(M.spawnPoint(map).y<.3)fail('Move the starting diamond onto dry land before sharing.');if(M.buildingPlans(map).some(b=>Math.hypot(b.x-sp.x,b.z-sp.z)<Math.hypot(b.w,b.d)/2+3))fail('Move the starting diamond clear of buildings.');const fingerprint=await digest(M.signature(map)),same=this.one('SELECT id,owner FROM maps WHERE fingerprint=? AND id<>? AND published IS NOT NULL',fingerprint,m.id);let source=m.source,sourceName=m.source_name;if(!source&&same){source=same.id;sourceName=this.one('SELECT username FROM accounts WHERE id=?',same.owner)?.username||'Original creator';}this.db.exec('UPDATE maps SET published=draft,published_preview=preview,revision=revision+1,approved=0,approved_at=0,published_at=?,updated=?,source=?,source_name=?,fingerprint=?,hidden=0 WHERE id=?',now,now,source||null,sourceName||null,fingerprint,m.id);return json({map:this.mapInfo(this.one('SELECT * FROM maps WHERE id=?',m.id),a)});}
  if(path==='maps/copy'&&method==='POST'){need();this.limit('copy:'+a.id,30,3600000);if(this.count("SELECT COUNT(*) n FROM maps WHERE owner=? AND kind='copy' AND deleted=0",a.id)>=30)fail('Level copies has 30 slots. Delete a copy to make room.');const original=this.publicMap(body.id),id=uid(),creator=this.one('SELECT username FROM accounts WHERE id=?',original.owner);this.db.exec("INSERT INTO maps(id,owner,slot,kind,name,description,draft,preview,updated,source,source_name) VALUES(?,?,-1,'copy',?,?,?,?,?,?,?)",id,a.id,original.name,original.description,original.published,original.published_preview,now,original.source||original.id,original.source_name||creator.username);return json({id});}
  if(path==='maps/detail'&&method==='GET'){const m=this.publicMap(url.searchParams.get('id'));return json({map:this.mapInfo(m,a)});}
  if(path==='maps/document'&&method==='GET'){const m=this.publicMap(url.searchParams.get('id'));return json({document:JSON.parse(m.published),map:this.mapInfo(m,a)});}
  if(path==='maps/search'&&method==='GET')return this.search(url,a);
  if(path==='maps/like'&&method==='POST'){need();const m=this.publicMap(body.id);if(body.like)this.db.exec('INSERT OR IGNORE INTO likes VALUES(?,?,?)',a.id,m.id,now);else this.db.exec('DELETE FROM likes WHERE account=? AND map=?',a.id,m.id);return json({ok:true});}
  if(path==='maps/comments'&&method==='GET'){const m=this.publicMap(url.searchParams.get('id')),page=Math.max(0,Math.min(10000,Number(url.searchParams.get('page'))||0));return json({comments:this.rows('SELECT c.*,a.username FROM comments c JOIN accounts a ON a.id=c.account WHERE c.map=? ORDER BY c.at DESC LIMIT 20 OFFSET ?',m.id,page*20),more:this.count('SELECT COUNT(*) n FROM comments WHERE map=?',m.id)>(page+1)*20});}
  if(path==='maps/comment'&&method==='POST'){need();const m=this.publicMap(body.id),text=censor(clean(body.text,150));if(now-a.last_comment<20000)fail('Wait 20 seconds between comments.',429);this.db.exec('INSERT INTO comments VALUES(?,?,?,?,?)',uid(),a.id,m.id,text,now);this.db.exec('UPDATE accounts SET last_comment=? WHERE id=?',now,a.id);return json({ok:true});}
  if(path==='maps/report'&&method==='POST'){need();const m=this.publicMap(body.id);this.limit('report:'+a.id,10,3600000);if(!['Stolen or copied content','Other'].includes(body.reason))fail('Choose a report reason.');const detail=body.reason==='Other'?clean(body.detail,300):String(body.detail||'').slice(0,300);this.db.exec('INSERT INTO reports VALUES(?,?,?,?,?,?,0)',uid(),a.id,m.id,body.reason,detail,now);return json({ok:true});}
  if(path==='admin/reports'&&method==='GET'){admin();return json({reports:this.rows('SELECT r.*,m.name,a.username FROM reports r LEFT JOIN maps m ON m.id=r.map LEFT JOIN accounts a ON a.id=r.account WHERE resolved=0 ORDER BY at DESC LIMIT 100')});}
  if(path==='admin/approve'&&method==='POST'){admin();const m=this.publicMap(body.id);if(body.approve&&m.source)fail('Copied maps cannot be approved.');this.db.exec('UPDATE maps SET approved=?,approved_at=? WHERE id=?',body.approve?1:0,body.approve?now:0,m.id);return json({ok:true});}
  if(path==='admin/moderate'&&method==='POST'){admin();if(body.map)this.db.exec('UPDATE maps SET hidden=1,approved=0 WHERE id=?',body.map);if(body.comment)this.db.exec('DELETE FROM comments WHERE id=?',body.comment);if(body.report)this.db.exec('UPDATE reports SET resolved=1 WHERE id=?',body.report);return json({ok:true});}
  if(path==='play/start'&&method==='POST'){
   const id=String(body.map||'islands');let revision=0,eligible=['islands','city','peaks'].includes(id);if(!eligible){const m=this.publicMap(id);revision=m.revision;eligible=!!m.approved;const visitor=a?.id||await digest('visitor:'+ip);if(!this.one('SELECT 1 FROM plays WHERE visitor=? AND map=? AND at>?',visitor,id,now-30*60000))this.db.exec('INSERT INTO plays VALUES(?,?,?)',visitor,id,now);}
   if(!a||!eligible)return json({run:null,eligible});const run=uid();this.db.exec('INSERT INTO rewards(id,account,map,revision,at,last,total) VALUES(?,?,?,?,?,?,0)',run,a.id,id,revision,now,now);return json({run,eligible:true});
  }
  if(path==='garage'&&method==='GET'){need();return json({garage:JSON.parse(a.garage)});}
  if(path==='garage/import'&&method==='POST'){need();if(a.imported)fail('This account already imported a previous garage.',409);const g=this.sanitizeGarage(body.garage);this.db.exec('UPDATE accounts SET garage=?,imported=1 WHERE id=?',JSON.stringify(g),a.id);return json({garage:g});}
  if(path==='garage/update'&&method==='POST'){need();let g=JSON.parse(a.garage);const selected=body.selected;if(!g.owned.includes(selected))fail('That car is not unlocked.');if(body.colors&&typeof body.colors==='object')for(const [id,c]of Object.entries(body.colors))if(g.owned.includes(id)&&/^#[0-9a-f]{6}$/i.test(c))g.colors[id]=c.toLowerCase();g.selected=selected;this.db.exec('UPDATE accounts SET garage=? WHERE id=?',JSON.stringify(g),a.id);return json({garage:g});}
  if(path==='garage/buy'&&method==='POST'){need();const g=JSON.parse(a.garage),price=Object.hasOwn(prices,body.car)?prices[body.car]:undefined;if(price===undefined)fail('Unknown car.');if(!g.owned.includes(body.car)){if(g.balance<price)fail('Earn more aura to unlock this car.');g.balance-=price;g.owned.push(body.car);}g.selected=body.car;this.db.exec('UPDATE accounts SET garage=? WHERE id=?',JSON.stringify(g),a.id);return json({garage:g});}
  if(path==='garage/earn'&&method==='POST'){
   need();const run=this.one('SELECT * FROM rewards WHERE id=? AND account=?',body.run,a.id);if(!run||now-run.at>8*3600000)fail('Restart driving to refresh your aura session.',409);if(!['islands','city','peaks'].includes(run.map)){const m=this.publicMap(run.map);if(!m.approved||m.revision!==run.revision)fail('This map version is not approved for aura.',403);}
   if(typeof body.event!=='string'||body.event.length>64)fail('Invalid reward.');if(this.one('SELECT 1 FROM reward_events WHERE id=?',body.event))return json({garage:JSON.parse(a.garage)});const points=body.points;if(!Number.isSafeInteger(points)||points<=0||points>100000||run.total+points>(now-run.at)/1000*5000+25000)fail('Aura claim is outside the stunt limits.',429);this.db.exec('INSERT INTO reward_events VALUES(?,?,?)',body.event,run.id,now);this.db.exec('UPDATE rewards SET total=total+?,last=? WHERE id=?',points,now,run.id);const g=JSON.parse(a.garage);g.balance=Math.min(1e12,g.balance+points);g.earned=Math.min(1e12,g.earned+points);g.bestChain=Math.max(g.bestChain,Math.min(Number(body.best)||0,run.total+points));this.db.exec('UPDATE accounts SET garage=? WHERE id=?',JSON.stringify(g),a.id);return json({garage:g});
  }
  fail('Not found.',404);
 }
 preview(v){if(typeof v!=='string'||v.length>180000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v))fail('Save a map preview before sharing.');return v;}
 owned(id,a,trash=false){const m=this.one('SELECT * FROM maps WHERE id=?',id);if(!m||m.owner!==a.id||(!trash&&m.deleted))fail('Map not found.',404);return m;}
 publicMap(id){const m=this.one('SELECT * FROM maps WHERE id=? AND published IS NOT NULL AND deleted=0 AND hidden=0',id);if(!m)fail('This map is not available.',404);return m;}
 sanitizeGarage(v){const g=emptyGarage();if(!v||typeof v!=='object')return g;for(const k of ['balance','earned','bestChain'])g[k]=Number.isFinite(v[k])?Math.max(0,Math.min(1e9,Math.floor(v[k]))):0;g.earned=Math.max(g.earned,g.balance);g.owned=[...new Set(['classic',...(Array.isArray(v.owned)?v.owned.filter(id=>Object.hasOwn(prices,id)):[])])];g.selected=g.owned.includes(v.selected)?v.selected:'classic';for(const id of g.owned)if(/^#[0-9a-f]{6}$/i.test(v.colors?.[id]||''))g.colors[id]=v.colors[id];return g;}
 search(url,a){const q=(url.searchParams.get('q')||'').trim().toLowerCase().slice(0,80),tab=url.searchParams.get('tab')||'latest-approved',creator=url.searchParams.get('creator'),page=Math.max(0,Math.min(10000,Number(url.searchParams.get('page'))||0));if(tab==='feed'&&!a)fail('Sign in to see Your feed.',401);
  let maps=this.rows('SELECT * FROM maps WHERE published IS NOT NULL AND deleted=0 AND hidden=0').filter(m=>!creator||m.owner===creator);const creators=new Map(this.rows('SELECT * FROM accounts WHERE verified=1').map(u=>[u.id,u])),stars=new Map(this.rows('SELECT owner,COUNT(*) n FROM maps WHERE approved=1 AND published IS NOT NULL AND deleted=0 AND hidden=0 GROUP BY owner').map(r=>[r.owner,r.n]));
  const follows=a?new Set(this.rows('SELECT creator FROM follows WHERE account=?',a.id).map(r=>r.creator)):new Set(),affinity=new Map();if(a){for(const r of this.rows('SELECT m.owner,COUNT(*) n FROM plays p JOIN maps m ON m.id=p.map WHERE p.visitor=? GROUP BY m.owner',a.id))affinity.set(r.owner,r.n);for(const r of this.rows('SELECT m.owner FROM likes l JOIN maps m ON m.id=l.map WHERE l.account=?',a.id))affinity.set(r.owner,(affinity.get(r.owner)||0)+4);}
  const likedTemplates=new Set(a?this.rows('SELECT m.published FROM likes l JOIN maps m ON m.id=l.map WHERE l.account=?',a.id).map(r=>JSON.parse(r.published).template):[]);
  const items=[];for(const m of maps){const u=creators.get(m.owner);if(!u)continue;if(q&&!(`${m.name} ${m.description} ${u.username}`.toLowerCase().includes(q)))continue;if(!q&&!creator){if(tab.endsWith('unapproved')&&m.approved)continue;if((tab==='latest-approved'||tab==='popular-approved')&&!m.approved)continue;if(tab==='potential'&&!stars.get(m.owner))continue;}
   const info=this.mapInfo(m,a),recent=this.count('SELECT COUNT(DISTINCT visitor) n FROM plays WHERE map=? AND at>?',m.id,Date.now()-2*DAY),recentLikes=this.count('SELECT COUNT(*) n FROM likes WHERE map=? AND at>?',m.id,Date.now()-2*DAY);let rank=info.likes*5+info.plays;
   if(!q&&!creator){if(tab.startsWith('latest'))rank=m.approved?m.approved_at:m.published_at;if(tab==='potential')rank=m.published_at;if(tab==='trending')rank=(recent+recentLikes*5)/Math.pow(1+Math.max(0,Date.now()-m.published_at)/DAY,.35);if(tab==='feed')rank+=(follows.has(m.owner)?10000:0)+(affinity.get(m.owner)||0)*100+(likedTemplates.has(JSON.parse(m.published).template)?150:0);}
   items.push({type:'map',...info,rank});}
  if(q&&!creator)for(const u of creators.values())if(u.username.toLowerCase().includes(q)){const profile=this.profile(u,a);items.push({type:'account',account:profile,rank:profile.followers*5+(stars.get(u.id)||0)*20});}
  items.sort((a,b)=>b.rank-a.rank||(b.at||0)-(a.at||0));return json({items:items.slice(page*9,page*9+9),page,total:items.length,pages:Math.max(1,Math.ceil(items.length/9))});
 }
 async internalIdentity(cookie){const a=await this.session(new Request("https://internal/",{headers:{Cookie:cookie||""}}));return a?{id:a.id,username:a.username}:null;}
 async internalMap(id){const m=this.publicMap(id);return {document:JSON.parse(m.published),id:m.id,revision:m.revision,approved:!!m.approved,name:m.name};}
 async purge(){const now=Date.now(),expired=this.rows('SELECT id FROM maps WHERE deleted>0 AND deleted<?',now-5*DAY);for(const m of expired){for(const table of ['likes','comments','plays','reports'])this.db.exec('DELETE FROM '+table+' WHERE map=?',m.id);this.db.exec('DELETE FROM maps WHERE id=?',m.id);}this.db.exec('DELETE FROM sessions WHERE expires<?',now);this.db.exec('DELETE FROM codes WHERE expires<?',now);this.db.exec('DELETE FROM limits WHERE at<?',now-DAY);this.db.exec('DELETE FROM rewards WHERE at<?',now-DAY);this.db.exec('DELETE FROM reward_events WHERE at<?',now-DAY);this.db.exec('DELETE FROM accounts WHERE verified=0 AND created<?',now-7*DAY);}
 async alarm(){await this.purge();await this.ctx.storage.setAlarm(Date.now()+DAY);}
}
