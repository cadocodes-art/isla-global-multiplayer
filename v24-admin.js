// Owner analytics and moderation. Every owner route is checked on the server.
const MIN=60000,DAY=86400000,KEEP=30*DAY,LEASE=75000;
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
export function installAdmin(h){h.db.exec(`CREATE TABLE IF NOT EXISTS v24_presence(id TEXT PRIMARY KEY,seen INTEGER,map TEXT);
CREATE TABLE IF NOT EXISTS v24_activity(at INTEGER PRIMARY KEY,seconds REAL DEFAULT 0,peak INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS v24_admin_meta(key TEXT PRIMARY KEY,value INTEGER);
CREATE TABLE IF NOT EXISTS v24_audit(id TEXT PRIMARY KEY,actor TEXT,action TEXT,target TEXT,label TEXT,at INTEGER);
CREATE TABLE IF NOT EXISTS v24_map_backups(id TEXT PRIMARY KEY,map TEXT,document TEXT,preview TEXT,name TEXT,description TEXT,revision INTEGER,at INTEGER);`);
 const now=Date.now();for(const key of ['started','last','purged'])h.db.exec('INSERT OR IGNORE INTO v24_admin_meta VALUES(?,?)',key,now);
}
export function audit(h,a,action,target,label){h.db.exec('INSERT INTO v24_audit VALUES(?,?,?,?,?,?)',crypto.randomUUID(),a.id,action,String(target||''),String(label||'').slice(0,200),Date.now());}
export function advanceActivity(h,now=Date.now()){
 let t=Math.max(Number(h.one("SELECT value FROM v24_admin_meta WHERE key='last'")?.value||now),now-KEEP);
 const leases=h.rows('SELECT seen FROM v24_presence WHERE seen+?>?',LEASE,t).map(r=>Number(r.seen)+LEASE);
 while(t<now&&leases.some(e=>e>t)){
  const n=leases.filter(e=>e>t).length,at=Math.floor(t/MIN)*MIN,end=Math.min(now,at+MIN,...leases.filter(e=>e>t));
  if(end<=t)break;
  h.db.exec('INSERT INTO v24_activity VALUES(?,?,?) ON CONFLICT(at) DO UPDATE SET seconds=seconds+excluded.seconds,peak=MAX(peak,excluded.peak)',at,n*(end-t)/1000,n);t=end;
 }
 h.db.exec("UPDATE v24_admin_meta SET value=? WHERE key='last'",now);
 h.db.exec('DELETE FROM v24_presence WHERE seen<=?',now-LEASE);
}
export async function adminAlarm(h){advanceActivity(h);const now=Date.now(),last=Number(h.one("SELECT value FROM v24_admin_meta WHERE key='purged'")?.value||0);if(now-last>=DAY){await h.purge();h.db.exec('DELETE FROM v24_activity WHERE at<?',now-KEEP);h.db.exec('DELETE FROM v24_map_backups WHERE at<?',now-7*DAY);h.db.exec("UPDATE v24_admin_meta SET value=? WHERE key='purged'",now);}await h.ctx.storage.setAlarm(now+(h.count('SELECT COUNT(*) n FROM v24_presence')?MIN:DAY));}
function stats(h,url){
 const now=Date.now();advanceActivity(h,now);const ranges={'1h':3600000,'24h':DAY,'7d':7*DAY,'30d':KEEP},range=url.searchParams.get('range')||'24h',duration=ranges[range]||DAY;
 const started=Number(h.one("SELECT value FROM v24_admin_meta WHERE key='started'").value),from=Math.max(started,now-duration),step=duration<=3600000?MIN:duration<=DAY?15*MIN:duration<=7*DAY?3600000:6*3600000,start=Math.floor(from/step)*step;
 const data=h.rows('SELECT * FROM v24_activity WHERE at>=? AND at<=? ORDER BY at',Math.floor(from/MIN)*MIN,now),bins=new Map();
 for(let at=start;at<=now;at+=step)bins.set(at,{at,players:0,peak:0,seconds:0});
 let total=0,peak=0;const weekdays=Array.from({length:7},(_,day)=>({day,playerHours:0,average:0,seconds:0,observedHours:0}));
 for(const r of data){const end=Math.min(now,r.at+MIN),fraction=from===started?1:Math.max(0,end-Math.max(from,r.at))/Math.max(1,end-r.at),seconds=r.seconds*fraction,b=bins.get(Math.floor(r.at/step)*step);if(b){b.seconds+=seconds;b.peak=Math.max(b.peak,r.peak);}total+=seconds;peak=Math.max(peak,r.peak);weekdays[new Date(r.at).getUTCDay()].seconds+=seconds;}
 for(let t=from;t<now;){const end=Math.min(now,Math.floor(t/DAY)*DAY+DAY);weekdays[new Date(t).getUTCDay()].observedHours+=(end-t)/3600000;t=end;}
 for(const b of bins.values())b.players=b.seconds/Math.max(1,(Math.min(now,b.at+step)-Math.max(from,b.at))/1000);
 for(const d of weekdays){d.playerHours=d.seconds/3600;d.average=d.observedHours?d.playerHours/d.observedHours:0;delete d.seconds;}
 return {range,from,to:now,started,step,points:[...bins.values()].map(({at,players,peak})=>({at,players,peak})),weekdays,current:h.count('SELECT COUNT(*) n FROM v24_presence'),average:total/Math.max(1,(now-from)/1000),peak,playerHours:total/3600,totals:{accounts:h.count('SELECT COUNT(*) n FROM accounts WHERE verified=1'),maps:h.count('SELECT COUNT(*) n FROM maps WHERE published IS NOT NULL AND deleted=0'),approved:h.count('SELECT COUNT(*) n FROM maps WHERE approved=1 AND published IS NOT NULL AND deleted=0 AND hidden=0'),plays:h.count('SELECT COUNT(*) n FROM plays'),comments:h.count('SELECT COUNT(*) n FROM comments'),reports:h.count('SELECT COUNT(*) n FROM reports WHERE resolved=0')}};
}
function liveRecord(h,m){return {...h.draftInfo(m),id:'admin:'+m.id,adminId:m.id,baseRevision:m.revision,document:JSON.parse(m.published),preview:m.published_preview||m.preview,deleted:0};}
export async function adminRoute(h,{path,method,url,body,a,admin,censor}){
 if(path==='activity/pulse'&&method==='POST'){
  if(typeof body.device!=='string'||!/^[-A-Za-z0-9_]{8,80}$/.test(body.device))fail('Invalid activity session.');
  const id=a?'account:'+a.id:'guest:'+body.device;advanceActivity(h);if(body.active===false)h.db.exec('DELETE FROM v24_presence WHERE id=?',id);else{h.db.exec('INSERT OR REPLACE INTO v24_presence VALUES(?,?,?)',id,Date.now(),String(body.map||'islands').slice(0,80));await h.ctx.storage.setAlarm(Date.now()+MIN);}return {ok:true};
 }
 if(!path.startsWith('admin/v24/'))return null;
 admin();const action=path.slice(10),id=method==='GET'?url.searchParams.get('id'):body.id,now=Date.now();
 if(action==='stats'&&method==='GET')return stats(h,url);
 if(action==='list'&&method==='GET'){
  const kind=url.searchParams.get('kind'),q='%'+String(url.searchParams.get('q')||'').slice(0,80)+'%',page=Math.max(0,Math.min(100000,Math.floor(Number(url.searchParams.get('page'))||0)));let sql,args=[q],count;
  if(kind==='accounts'){sql='SELECT a.id,a.username,a.created,(SELECT COUNT(*) FROM maps m WHERE m.owner=a.id) maps FROM accounts a WHERE a.verified=1 AND a.username LIKE ?';count='SELECT COUNT(*) n FROM accounts a WHERE a.verified=1 AND a.username LIKE ?';}
  else if(kind==='maps'){sql='SELECT m.id,m.name,m.revision,m.hidden,m.approved,a.username FROM maps m LEFT JOIN accounts a ON a.id=m.owner WHERE m.published IS NOT NULL AND m.deleted=0 AND (m.name LIKE ? OR a.username LIKE ?)';count='SELECT COUNT(*) n FROM maps m LEFT JOIN accounts a ON a.id=m.owner WHERE m.published IS NOT NULL AND m.deleted=0 AND (m.name LIKE ? OR a.username LIKE ?)';args=[q,q];}
  else if(kind==='comments'){sql='SELECT c.id,c.text,c.at,m.name,a.username FROM comments c LEFT JOIN maps m ON m.id=c.map LEFT JOIN accounts a ON a.id=c.account WHERE c.text LIKE ? OR a.username LIKE ? OR m.name LIKE ?';count='SELECT COUNT(*) n FROM comments c LEFT JOIN maps m ON m.id=c.map LEFT JOIN accounts a ON a.id=c.account WHERE c.text LIKE ? OR a.username LIKE ? OR m.name LIKE ?';args=[q,q,q];}
  else if(kind==='history'){sql='SELECT * FROM v24_audit WHERE label LIKE ?';count='SELECT COUNT(*) n FROM v24_audit WHERE label LIKE ?';}else fail('Choose an owner section.');
  const order=kind==='accounts'?'created DESC':kind==='maps'?'m.updated DESC':'at DESC';return {items:h.rows(sql+' ORDER BY '+order+' LIMIT 20 OFFSET ?',...args,page*20),total:h.count(count,...args),page};
 }
 if(action==='account/delete'&&method==='POST'){
  const target=h.one('SELECT id,username FROM accounts WHERE id=?',id);if(!target)fail('Account not found.',404);if(id===a.id||id===h.env.OWNER_ACCOUNT_ID?.trim())fail('The current owner account cannot be deleted.',403);
  const maps=h.count('SELECT COUNT(*) n FROM maps WHERE owner=?',id);if(body.confirm!==target.username||body.mapCount!==maps)fail('The account or map count changed. Refresh and confirm again.',409);
  h.ctx.storage.transactionSync(()=>{advanceActivity(h);for(const table of ['sessions','recovery_keys'])h.db.exec('DELETE FROM '+table+' WHERE account=?',id);h.db.exec('DELETE FROM maps WHERE owner=?',id);h.db.exec('DELETE FROM accounts WHERE id=?',id);h.db.exec('DELETE FROM v24_presence WHERE id=?','account:'+id);audit(h,a,'Deleted account',id,target.username+' · '+maps+' maps');});return {ok:true};
 }
 if(action==='comment/delete'&&method==='POST'){const c=h.one('SELECT * FROM comments WHERE id=?',id);if(!c)fail('Comment not found.',404);h.db.exec('DELETE FROM comments WHERE id=?',id);audit(h,a,'Deleted comment',id,c.text);return {ok:true};}
 if(action==='map/visibility'&&method==='POST'){const m=h.one('SELECT * FROM maps WHERE id=? AND published IS NOT NULL AND deleted=0',id);if(!m)fail('Map not found.',404);if(typeof body.hidden!=='boolean')fail('Choose a visibility.');h.db.exec('UPDATE maps SET hidden=?,approved=CASE WHEN ?=1 THEN 0 ELSE approved END WHERE id=?',body.hidden?1:0,body.hidden?1:0,id);audit(h,a,body.hidden?'Hid map':'Restored map',id,m.name);return {ok:true};}
 if(action==='map/edit'&&method==='GET'){const m=h.one('SELECT * FROM maps WHERE id=? AND published IS NOT NULL AND deleted=0',id);if(!m)fail('Map not found.',404);return {map:liveRecord(h,m)};}
 if(action==='map/save'&&method==='POST'){
  const m=h.one('SELECT * FROM maps WHERE id=? AND published IS NOT NULL AND deleted=0',body.adminId);if(!m)fail('Map not found.',404);if(body.baseRevision!==m.revision)fail('This map changed while you were editing. Reopen it before saving.',409);
  const document=globalThis.IslaMaker.validate(body.document),name=String(body.name||'').trim(),description=String(body.description||'').trim(),preview=h.preview(body.preview);if(!name||name.length>30||description.length>150||censor(name)!==name||censor(description)!==description)fail('Use a clean name (1–30 characters) and description (up to 150).');
  h.ctx.storage.transactionSync(()=>{h.db.exec('INSERT INTO v24_map_backups VALUES(?,?,?,?,?,?,?,?)',crypto.randomUUID(),m.id,m.published,m.published_preview,m.name,m.description,m.revision,now);h.db.exec('UPDATE maps SET published=?,published_preview=?,name=?,description=?,revision=revision+1,updated=? WHERE id=?',JSON.stringify(document),preview,name,description,now,m.id);audit(h,a,'Edited published map',m.id,name+' · revision '+(m.revision+1));});return {map:liveRecord(h,h.one('SELECT * FROM maps WHERE id=?',m.id))};
 }
 if(action==='map/undo'&&method==='POST'){
  const m=h.one('SELECT * FROM maps WHERE id=? AND published IS NOT NULL AND deleted=0',id),b=h.one('SELECT * FROM v24_map_backups WHERE map=? AND at>? ORDER BY at DESC LIMIT 1',id,now-7*DAY);if(!m||!b)fail('No owner edit to undo within the last seven days.');
  if(body.revision!==m.revision||m.revision!==b.revision+1)fail('The map changed again. Open it and review the current version.',409);
  h.ctx.storage.transactionSync(()=>{h.db.exec('UPDATE maps SET published=?,published_preview=?,name=?,description=?,revision=revision+1,updated=? WHERE id=?',b.document,b.preview,b.name,b.description,now,id);h.db.exec('DELETE FROM v24_map_backups WHERE id=?',b.id);audit(h,a,'Undid owner map edit',id,b.name);});return {ok:true};
 }
 fail('Owner action not found.',404);
}
