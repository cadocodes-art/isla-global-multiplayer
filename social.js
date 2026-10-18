import '../public/social-rules.js';
const R=globalThis.IslaSocialRules;
const fail=(text,status=400)=>{throw Object.assign(Error(text),{status});};
const pair=(a,b)=>[a,b].sort().join(':');
const person=a=>({id:a.id,username:a.username});
const integer=(v,fallback=0)=>/^\d+$/.test(String(v))?Math.min(Number(v),Number.MAX_SAFE_INTEGER):fallback;

export function installSocial(h){h.db.exec(`
CREATE TABLE IF NOT EXISTS friendships(pair TEXT PRIMARY KEY,first TEXT,second TEXT,requester TEXT,status TEXT,at INTEGER);
CREATE INDEX IF NOT EXISTS friends_first ON friendships(first,status);
CREATE INDEX IF NOT EXISTS friends_second ON friendships(second,status);
CREATE TABLE IF NOT EXISTS blocks(account TEXT,target TEXT,at INTEGER,PRIMARY KEY(account,target));
CREATE TABLE IF NOT EXISTS profile_posts(id TEXT PRIMARY KEY,author TEXT,text TEXT,at INTEGER,removed INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS posts_author ON profile_posts(author,at);
CREATE TABLE IF NOT EXISTS post_likes(account TEXT,post TEXT,at INTEGER,PRIMARY KEY(account,post));
CREATE TABLE IF NOT EXISTS messages(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE,pair TEXT,sender TEXT,recipient TEXT,text TEXT,at INTEGER,nonce TEXT,removed INTEGER DEFAULT 0,UNIQUE(sender,nonce));
CREATE INDEX IF NOT EXISTS messages_pair ON messages(pair,seq);
CREATE TABLE IF NOT EXISTS message_reads(account TEXT,pair TEXT,seq INTEGER,PRIMARY KEY(account,pair));
CREATE TABLE IF NOT EXISTS social_reports(id TEXT PRIMARY KEY,reporter TEXT,kind TEXT,target TEXT,author TEXT,text TEXT,reason TEXT,detail TEXT,at INTEGER,resolved INTEGER DEFAULT 0,UNIQUE(reporter,kind,target));
`);}
function blocked(h,a,b){return !!h.one('SELECT 1 FROM blocks WHERE (account=? AND target=?) OR (account=? AND target=?)',a,b,b,a);}
export function relationship(h,a,b){
 if(!a||a===b)return {status:'none'};
 if(h.one('SELECT 1 FROM blocks WHERE account=? AND target=?',a,b))return {status:'blocked'};
 if(blocked(h,a,b))return {status:'unavailable'};
 const f=h.one('SELECT * FROM friendships WHERE pair=?',pair(a,b));
 return {status:!f?'none':f.status==='accepted'?'friends':f.requester===a?'outgoing':'incoming'};
}
export function socialAffinity(h,a){
 const scores=new Map(),hidden=new Set();if(!a)return {scores,hidden};
 for(const b of h.rows('SELECT account,target FROM blocks WHERE account=? OR target=?',a.id,a.id))hidden.add(b.account===a.id?b.target:b.account);
 for(const f of h.rows('SELECT * FROM friendships WHERE first=? OR second=?',a.id,a.id))if(f.status==='accepted'||f.requester===a.id)scores.set(f.first===a.id?f.second:f.first,f.status==='accepted'?5000:2500);
 for(const p of h.rows('SELECT p.author,COUNT(*) n FROM post_likes l JOIN profile_posts p ON p.id=l.post WHERE l.account=? AND p.removed=0 GROUP BY p.author',a.id))if(p.author!==a.id)scores.set(p.author,(scores.get(p.author)||0)+Math.min(600,p.n*150));
 for(const id of hidden)scores.delete(id);return {scores,hidden};
}
export async function socialRoute(h,{path,method,url,body,a,need,admin,censor}){
 if(!path.startsWith('social/')&&!path.startsWith('admin/social'))return null;
 const now=Date.now(),id=()=>crypto.randomUUID(),getUser=v=>{if(typeof v!=='string'||v.length>100)fail('Choose an account.');const u=h.one('SELECT id,username FROM accounts WHERE id=? AND verified=1',v);if(!u)fail('Account not found.',404);return u;};
 const other=v=>{const u=getUser(v);if(u.id===a.id)fail('Choose another driver.');return u;};
 const content=(v,max)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail('Use between 1 and '+max+' characters.');return censor(v.trim());};
 const messageView=m=>({id:m.id,seq:m.seq,sender:m.sender,recipient:m.recipient,text:m.removed?'Message removed':m.text,at:m.at,removed:!!m.removed});
 const postView=p=>({id:p.id,author:p.author,text:p.text,at:p.at,likes:h.count('SELECT COUNT(*) n FROM post_likes WHERE post=?',p.id),liked:!!a&&!!h.one('SELECT 1 FROM post_likes WHERE post=? AND account=?',p.id,a.id)});
 const visiblePost=v=>{const p=h.one('SELECT * FROM profile_posts WHERE id=? AND removed=0',v);if(!p)fail('Post not found.',404);if(a&&blocked(h,a.id,p.author))fail('This post is unavailable.',403);return p;};
 if(path==='social/posts'&&method==='GET'){
  const u=getUser(url.searchParams.get('id')),page=integer(url.searchParams.get('page'));if(a&&blocked(h,a.id,u.id))return {posts:[],more:false,relationship:relationship(h,a.id,u.id)};
  const posts=h.rows('SELECT * FROM profile_posts WHERE author=? AND removed=0 ORDER BY at DESC,id DESC LIMIT 11 OFFSET ?',u.id,Math.min(page,10000)*10);
  return {posts:posts.slice(0,10).map(postView),more:posts.length>10,relationship:relationship(h,a?.id,u.id)};
 }
 need();
 if(path==='social/relationship'&&method==='GET')return relationship(h,a.id,other(url.searchParams.get('id')).id);
 if(path==='social/friend'&&method==='POST'){
  const u=other(body.id),key=pair(a.id,u.id),f=h.one('SELECT * FROM friendships WHERE pair=?',key);
  if(blocked(h,a.id,u.id))fail('This connection is unavailable.',403);
  if(body.action==='request'){
   if(f)return relationship(h,a.id,u.id);
   h.limit('friend-request:'+a.id,15,3600000);
   if(h.count("SELECT COUNT(*) n FROM friendships WHERE requester=? AND status='pending'",a.id)>=50)fail('Cancel an older request before sending another.');
   const [first,second]=[a.id,u.id].sort();h.db.exec('INSERT INTO friendships VALUES(?,?,?,?,?,?)',key,first,second,a.id,'pending',now);
  }else if(body.action==='accept'){
   if(!f||f.status!=='pending'||f.requester===a.id)fail('Only the recipient can accept this request.',403);
   h.db.exec("UPDATE friendships SET status='accepted',at=? WHERE pair=?",now,key);
  }else if(body.action==='decline'||body.action==='cancel'){
   if(!f||f.status!=='pending'||(body.action==='cancel')!==(f.requester===a.id))fail('This request cannot be changed.',403);
   h.db.exec('DELETE FROM friendships WHERE pair=?',key);
  }else if(body.action==='unfriend'){
   if(f?.status!=='accepted')fail('You are not friends.');h.db.exec('DELETE FROM friendships WHERE pair=?',key);
  }else fail('Choose a friend action.');
  return relationship(h,a.id,u.id);
 }
 if(path==='social/block'&&method==='POST'){
  const u=other(body.id);if(typeof body.block!=='boolean')fail('Choose block or unblock.');
  if(body.block){h.db.exec('INSERT OR IGNORE INTO blocks VALUES(?,?,?)',a.id,u.id,now);h.db.exec('DELETE FROM friendships WHERE pair=?',pair(a.id,u.id));h.db.exec('DELETE FROM follows WHERE (account=? AND creator=?) OR (account=? AND creator=?)',a.id,u.id,u.id,a.id);}else h.db.exec('DELETE FROM blocks WHERE account=? AND target=?',a.id,u.id);
  return relationship(h,a.id,u.id);
 }
 if(path==='social/inbox'&&method==='GET'){
  const connections=h.rows('SELECT f.*,a.id,a.username FROM friendships f JOIN accounts a ON a.id=CASE WHEN f.first=? THEN f.second ELSE f.first END WHERE f.first=? OR f.second=?',a.id,a.id,a.id);
  const friends=connections.filter(f=>f.status==='accepted').map(person),incoming=connections.filter(f=>f.status==='pending'&&f.requester!==a.id).map(person),outgoing=connections.filter(f=>f.status==='pending'&&f.requester===a.id).map(person);
  const conversations=h.rows(`SELECT m.*,a.username,r.seq AS read_seq FROM messages m JOIN accounts a ON a.id=CASE WHEN m.sender=? THEN m.recipient ELSE m.sender END LEFT JOIN message_reads r ON r.account=? AND r.pair=m.pair WHERE m.seq IN (SELECT MAX(seq) FROM messages WHERE sender=? OR recipient=? GROUP BY pair) ORDER BY m.seq DESC LIMIT 100`,a.id,a.id,a.id,a.id).map(m=>({id:m.sender===a.id?m.recipient:m.sender,username:m.username,last:messageView(m),unread:h.count('SELECT COUNT(*) n FROM messages WHERE pair=? AND recipient=? AND seq>? AND removed=0',m.pair,a.id,m.read_seq||0)}));
  const blocks=h.rows('SELECT a.id,a.username FROM blocks b JOIN accounts a ON a.id=b.target WHERE b.account=?',a.id);
  return {friends,incoming,outgoing,conversations,blocks};
 }
 if(path==='social/post'&&method==='POST'){
  const text=content(body.text,150);h.limit('profile-post:'+a.id,1,20000);h.limit('profile-post-day:'+a.id,100,86400000);
  const post=id();h.db.exec('INSERT INTO profile_posts(id,author,text,at) VALUES(?,?,?,?)',post,a.id,text,now);return {post:postView(h.one('SELECT * FROM profile_posts WHERE id=?',post))};
 }
 if(path==='social/post/delete'&&method==='POST'){
  const p=visiblePost(body.id);if(p.author!==a.id)fail('You can only delete your own posts.',403);h.db.exec('UPDATE profile_posts SET removed=1,text=? WHERE id=?','Post removed',p.id);h.db.exec('DELETE FROM post_likes WHERE post=?',p.id);return {ok:true};
 }
 if(path==='social/post/like'&&method==='POST'){
  const p=visiblePost(body.id);if(p.author===a.id)fail('You cannot like your own post.');if(typeof body.like!=='boolean')fail('Choose like or unlike.');
  if(body.like)h.db.exec('INSERT OR IGNORE INTO post_likes VALUES(?,?,?)',a.id,p.id,now);else h.db.exec('DELETE FROM post_likes WHERE account=? AND post=?',a.id,p.id);return {post:postView(p)};
 }
 if(path==='social/messages'&&method==='GET'){
  const u=other(url.searchParams.get('id')),key=pair(a.id,u.id),rel=relationship(h,a.id,u.id);
  if(rel.status!=='friends'&&!h.one('SELECT 1 FROM messages WHERE pair=?',key))fail('Accept a friend request to start a conversation.',403);
  const after=integer(url.searchParams.get('after')),before=integer(url.searchParams.get('before'));
  const rows=after?h.rows('SELECT * FROM messages WHERE pair=? AND seq>? ORDER BY seq LIMIT 51',key,after):h.rows('SELECT * FROM messages WHERE pair=? AND seq<? ORDER BY seq DESC LIMIT 51',key,before||Number.MAX_SAFE_INTEGER);
  return {account:u,relationship:rel,messages:(after?rows.slice(0,50):rows.slice(0,50).reverse()).map(messageView),more:rows.length>50};
 }
 if(path==='social/read'&&method==='POST'){
  const u=other(body.id),key=pair(a.id,u.id),seq=integer(body.seq),m=h.one('SELECT seq FROM messages WHERE pair=? AND seq=?',key,seq);if(!m)fail('Message not found.',404);
  h.db.exec('INSERT INTO message_reads VALUES(?,?,?) ON CONFLICT(account,pair) DO UPDATE SET seq=MAX(seq,excluded.seq)',a.id,key,seq);return {ok:true};
 }
 if(path==='social/send'&&method==='POST'){
  const u=other(body.id),key=pair(a.id,u.id);if(relationship(h,a.id,u.id).status!=='friends')fail('You must be accepted friends to send messages.',403);
  if(typeof body.nonce!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(body.nonce))fail('Refresh the conversation and try again.');
  const old=h.one('SELECT * FROM messages WHERE sender=? AND nonce=?',a.id,body.nonce);if(old){if(old.recipient!==u.id)fail('This message was already used.',409);return {message:messageView(old)};}
  const problem=R.messageError(body.text);if(problem)fail(problem);const text=content(body.text,500);
  h.limit('message-second:'+a.id,1,1000);h.limit('message-minute:'+a.id,30,60000);
  const mid=id();h.db.exec('INSERT INTO messages(id,pair,sender,recipient,text,at,nonce) VALUES(?,?,?,?,?,?,?)',mid,key,a.id,u.id,text,now,body.nonce);return {message:messageView(h.one('SELECT * FROM messages WHERE id=?',mid))};
 }
 if(path==='social/report'&&method==='POST'){
  if(!['message','post'].includes(body.kind)||!R.messageReasons.includes(body.reason))fail('Choose a report reason.');
  let item;if(body.kind==='message'){item=h.one('SELECT id,sender AS author,text FROM messages WHERE id=? AND recipient=?',body.id,a.id);if(!item)fail('You can only report messages sent to you.',403);}else item=visiblePost(body.id);
  if(item.author===a.id)fail('Choose someone else’s post.');
  const detail=typeof body.detail==='string'?body.detail.trim():'';if(detail.length>300||body.reason==='Other'&&!detail)fail('Add a description of up to 300 characters.');
  if(h.one('SELECT id FROM social_reports WHERE reporter=? AND kind=? AND target=?',a.id,body.kind,item.id))return {ok:true};
  h.limit('social-report:'+a.id,10,3600000);h.db.exec('INSERT INTO social_reports(id,reporter,kind,target,author,text,reason,detail,at) VALUES(?,?,?,?,?,?,?,?,?)',id(),a.id,body.kind,item.id,item.author,item.text,body.reason,detail,now);return {ok:true};
 }
 if(path==='admin/social-reports'&&method==='GET'){
  admin();return {reports:h.rows('SELECT r.*,a.username,b.username AS reporter_name FROM social_reports r JOIN accounts a ON a.id=r.author JOIN accounts b ON b.id=r.reporter WHERE resolved=0 ORDER BY at DESC LIMIT 100')};
 }
 if(path==='admin/social-moderate'&&method==='POST'){
  admin();const r=h.one('SELECT * FROM social_reports WHERE id=?',body.id);if(!r)fail('Report not found.',404);
  if(body.remove===true){if(r.kind==='message')h.db.exec('UPDATE messages SET removed=1,text=? WHERE id=?','Message removed',r.target);else{h.db.exec('UPDATE profile_posts SET removed=1,text=? WHERE id=?','Post removed',r.target);h.db.exec('DELETE FROM post_likes WHERE post=?',r.target);}}
  h.db.exec('UPDATE social_reports SET resolved=1 WHERE id=?',r.id);return {ok:true};
 }
 fail('Not found.',404);
}
