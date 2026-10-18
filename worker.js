
import {DurableObject} from 'cloudflare:workers';
import '../public/player-rules.js';
import world from './world-data.json';
import {freshTraffic,place,stepTraffic} from './traffic.js';
import '../public/maker-core.js';
export {CommunityHub} from './community.js';
const rules=globalThis.IslaRules,models=new Map(world.cars.map(m=>[m.id,m]));
const RECONNECT=90000,EMPTY_RESET=600000,MAX_SOCKETS=48;
const numeric=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const park=s=>Object.assign(s,{parked:true,nitro:false,vx:0,vy:0,vz:0,speed:0});
const spawn=(slot,data=world)=>({...data.spawns[slot],vx:0,vy:0,vz:0,pitch:0,roll:0,steer:0,speed:0,car:'classic',color:models.get('classic').color,nitro:false,grounded:true,water:'dry',brake:false,parked:false});
function validState(s){return s&&models.has(s.car)&&rules.validColor(s.color)&&[['x',-3000,4000],['y',-100,1500],['z',-3000,3000],['yaw',-100000,100000],['vx',-120,120],['vy',-150,150],['vz',-120,120],['pitch',-4,4],['roll',-4,4],['steer',-2,2],['speed',-120,120]].every(([k,a,b])=>numeric(s[k],a,b))&&['dry','skimming','sinking'].includes(s.water);}
function reply(ws,data){try{ws.send(JSON.stringify(data));return true;}catch{return false;}}
function serial(p){const {ws,previous,...saved}=p;return saved;}
export class GlobalRoom extends DurableObject {
 constructor(ctx,env){
  super(ctx,env);this.ctx=ctx;this.players=new Map();this.meta=new Map();this.attempts=new Map();this.configureMap('islands');this.mapBound=false;this.lastTick=Date.now();this.lastFrame=0;this.emptyAt=Date.now();this.nextAlarm=0;
  ctx.blockConcurrencyWhile(async()=>{

   const saved=await ctx.storage.get('world-v2');
   if(saved){if(saved.custom)this.configureCustom(saved.custom);else this.configureMap(saved.mapId||'islands');this.mapBound=true;if(Array.isArray(saved.hp)&&saved.hp.length===this.hp.length)this.hp=saved.hp;this.fallenTrees=saved.fallenTrees||[];this.hits=saved.hits||[];this.nukes=saved.nukes||[];this.emptyAt=saved.emptyAt||0;
    if(saved.traffic?.length===this.world.traffic.length)this.traffic=saved.traffic.map(t=>place(t,this.world));
    for(const p of saved.reservations||[])if(Date.now()-p.disconnectedAt<RECONNECT&&!rules.validateName(p.name))this.players.set(p.id,{...p,ws:null,previous:null});
   }
   for(const ws of ctx.getWebSockets()){const a=ws.deserializeAttachment();if(!a)continue;this.meta.set(ws,a.meta);
    if(a.player&&!rules.validateName(a.player.name)&&validState(a.player.state)){const p={...a.player,ws,previous:null,disconnectedAt:0};this.players.set(p.id,p);}else if(a.player){ws.close(1008,'Choose a valid car name');}
   }
   this.nextAlarm=await ctx.storage.getAlarm()||0;this.cleanup();
  });
 }
 configureMap(mapId){this.mapId=['city','peaks'].includes(mapId)?mapId:'islands';this.world=this.mapId==='islands'?world:world.maps[this.mapId];this.hp=this.world.buildings.map(()=>100);this.hits=[];this.fallenTrees=[];this.nukes=[];this.traffic=freshTraffic(this.world);}
 configureCustom(info){this.custom=info;this.mapId='custom:'+info.id;this.world=globalThis.IslaMaker.worldData(info.document);this.hp=this.world.buildings.map(()=>100);this.hits=[];this.fallenTrees=[];this.nukes=[];this.traffic=freshTraffic(this.world);}
 async prepareCustom(info){if(this.mapBound){if(!this.custom||this.custom.id!==info.id||this.custom.revision!==info.revision)throw Error('Map version mismatch');return;}this.configureCustom(info);this.mapBound=true;await this.checkpoint();}
 attach(ws,p){const meta=this.meta.get(ws);if(meta)ws.serializeAttachment({meta,player:p?serial(p):null});}
 roster(){return [...this.players.values()].map(p=>({id:p.id,name:p.name,guest:p.guest!==false,score:p.score,connected:!!p.ws,car:p.state.car,color:p.state.color}));}
 broadcast(data){const text=JSON.stringify(data);for(const p of this.players.values())if(p.ws)try{p.ws.send(text);}catch{}}
 announce(){this.broadcast({type:'roster',players:this.roster(),host:null});}
 async schedule(){const now=Date.now(),due=Math.max(now+1,Math.min(now+30000,...this.nukes.map(n=>n.at)));if(this.nextAlarm>now&&this.nextAlarm<=due)return;this.nextAlarm=due;await this.ctx.storage.setAlarm(due);}
 async checkpoint(){await this.ctx.storage.put('world-v2',{mapId:this.mapId,custom:this.custom||null,hp:this.hp,hits:this.hits,fallenTrees:this.fallenTrees,nukes:this.nukes,traffic:this.traffic,emptyAt:this.emptyAt,reservations:[...this.players.values()].filter(p=>!p.ws).map(serial)});}
 cleanup(){
  const now=Date.now();let changed=false;
  for(const [id,p]of this.players)if(!p.ws&&now-p.disconnectedAt>=RECONNECT){this.players.delete(id);changed=true;}
  if(!this.players.size&&!this.emptyAt)this.emptyAt=now;
  if(!this.players.size&&this.emptyAt&&now-this.emptyAt>=EMPTY_RESET){this.hp.fill(100);this.hits=[];this.fallenTrees=[];this.nukes=[];this.traffic=freshTraffic(this.world);this.emptyAt=now;}
  for(const [ip,b]of this.attempts)if(now-b.at>60000)this.attempts.delete(ip);
  for(const [ws,m]of this.meta)if(!this.playerFor(ws)&&now-m.createdAt>15000){try{ws.close(1008,'Join the global room');}catch{}this.meta.delete(ws);}
  if(changed)this.announce();
 }
 playerFor(ws){return [...this.players.values()].find(p=>p.ws===ws);}
 async fetch(request){

  const requested=new URL(request.url).searchParams.get('map'),mapId=requested?.startsWith('custom:')?requested:['city','peaks'].includes(requested)?requested:'islands';
  if(!this.mapBound){this.configureMap(mapId);this.mapBound=true;await this.checkpoint();}
  if(mapId!==this.mapId)return new Response('Wrong map',{status:409});
  this.cleanup();const now=Date.now(),ip=request.headers.get('CF-Connecting-IP')||'local';
  let bucket=this.attempts.get(ip);if(!bucket||now-bucket.at>60000)this.attempts.set(ip,bucket={at:now,count:0});
  if(++bucket.count>60)return new Response('Too many connections. Try again shortly.',{status:429});
  if(this.ctx.getWebSockets().length>=MAX_SOCKETS)return new Response('The global room is busy. Try again shortly.',{status:503});
  const pair=new WebSocketPair(),[client,server]=Object.values(pair);
  this.ctx.acceptWebSocket(server);let account=null;try{account=JSON.parse(request.headers.get('X-Isla-Account')||'null');}catch{}this.meta.set(server,{createdAt:now,rateAt:now,count:0,lastJoin:0,account});this.attach(server,null);await this.schedule();
  return new Response(null,{status:101,webSocket:client});
 }
 async join(ws,data){
  if(this.playerFor(ws))return reply(ws,{type:'error',message:'You are already in the global room.'});
  if(data.v!==rules.protocol)return reply(ws,{type:'error',message:'Refresh the game to join this version.'});
  const account=this.meta.get(ws)?.account;if(account)data.name=account.username;
  const error=rules.validateName(data.name);if(error)return reply(ws,{type:'error',message:error});
  this.cleanup();let p,resumed=false;
  if(data.type==='resume'){
   p=[...this.players.values()].find(q=>q.token===data.token&&(!q.disconnectedAt||Date.now()-q.disconnectedAt<RECONNECT));
   if(!p||p.name!==data.name||(p.account||null)!==(account?.id||null))return reply(ws,{type:'error',message:'Your reserved spot expired. Join the global room again.',expired:true});resumed=true;
  }else{
   if(this.players.size>=rules.capacity)return reply(ws,{type:'error',message:'The global room is full (32 drivers). Try again shortly.'});
   const used=new Set([...this.players.values()].map(q=>q.slot));let slot=0;while(used.has(slot))slot++;
   p={id:crypto.randomUUID(),token:crypto.randomUUID()+crypto.randomUUID(),name:data.name,guest:!account,account:account?.id||null,slot,score:0,scoreSeq:0,lastScoreAt:0,lastTrafficHit:0,lastStateAt:0,state:spawn(slot,this.world),previous:null,disconnectedAt:0,ws:null};this.players.set(p.id,p);
  }
  const old=p.ws;if(old&&old!==ws){this.meta.delete(old);try{old.serializeAttachment({meta:{createdAt:Date.now()},player:null});old.close(4001,'Connection replaced');}catch{}}
  p.ws=ws;p.disconnectedAt=0;this.emptyAt=0;this.attach(ws,p);await this.checkpoint();
  reply(ws,{type:'welcome',mapId:this.mapId,v:rules.protocol,code:'GLOBAL',id:p.id,token:p.token,resumed,state:p.state,scoreSeq:p.scoreSeq,hp:this.hp,trees:this.fallenTrees,buildings:this.world.buildings.map(b=>[b.id,Math.round(b.x*100),Math.round(b.z*100)]),players:this.roster(),host:null});
  this.announce();await this.schedule();
 }
 updateWeapon(p,s,now){
  if(s.car!=='nuker'||p.state.car!=='nuker'){p.nukeCharge=0;return;}
  if(s.parked||p.state.parked||s.water==='sinking')return;
  p.nukeCharge=(p.nukeCharge||0)+Math.max(0,Math.min(250,now-p.lastStateAt));
  if(p.nukeCharge+1<rules.nuke.cooldown*1000)return;
  p.nukeCharge=0;const shot=rules.nukeShot(s,1.2);this.nukes.push({shot,at:now+rules.nuke.flight*1000});this.broadcast({type:'nukeLaunch',id:p.id,shot});
 }
 detonateNukes(now){
  const ready=this.nukes.filter(n=>n.at<=now);this.nukes=this.nukes.filter(n=>n.at>now);
  for(const n of ready){const blast=n.shot.target,buildings=[];for(const b of this.world.buildings)if(this.hp[b.id]>0&&rules.blastHits(blast,b)){this.hp[b.id]=0;this.hits[b.id]=now;buildings.push([b.id,0]);}
   for(const t of this.traffic)rules.blastTraffic(blast,t);this.broadcast({type:'nukeBlast',blast,buildings});
  }
  return ready.length>0;
 }
 frame(){
  const now=Date.now();if(now-this.lastFrame<95)return;
  let remaining=Math.min(.3,(now-this.lastTick)/1000);const obstacles=[...this.players.values()].map(p=>p.state);
  while(remaining>0){const dt=Math.min(1/30,remaining);stepTraffic(this.traffic,obstacles,dt,this.world);remaining-=dt;}
  this.lastTick=now;this.lastFrame=now;
  const liveBuildings=this.world.buildings.filter(b=>this.hp[b.id]>0);
  for(const p of this.players.values())if(p.ws&&p.state.car==='firetruck'&&!p.state.parked&&p.state.water!=='sinking')for(const jet of rules.hoseJets(p.state,liveBuildings))for(const t of this.traffic)if(rules.inHose(jet,t)){t.wetTime=18;if(t.burning){t.burning=false;this.wetDirty=true;}}
 
  this.broadcast({type:'frame',time:now,players:[...this.players.values()].map(p=>({id:p.id,name:p.name,guest:p.guest!==false,connected:!!p.ws,state:p.state,nukeRemaining:Math.max(0,rules.nuke.cooldown-(p.nukeCharge||0)/1000)})),traffic:this.traffic.map(t=>[t.x,t.y,t.z,t.yaw,t.vx,t.vz,t.speed,t.distance,!!t.wrecked,!!t.burning,t.wetTime||0])});
 }
 async webSocketMessage(ws,raw){

  const meta=this.meta.get(ws);if(!meta)return;
  if(typeof raw!=='string'||raw.length>8192){ws.close(1009,'Invalid message size');return;}
  const now=Date.now();if(now-meta.rateAt>=1000){meta.count=0;meta.rateAt=now;}if(++meta.count>40){ws.close(1008,'Too many messages');return;}
  let data;try{data=JSON.parse(raw);}catch{ws.close(1008,'Invalid message');return;}
  if(!data||typeof data!=='object'||Array.isArray(data))return;
  if(['join','resume'].includes(data.type)){if(now-meta.lastJoin<700)return;meta.lastJoin=now;await this.join(ws,data);return;}
  const p=this.playerFor(ws);if(!p)return;
  if(this.detonateNukes(now))await this.checkpoint();
  if(data.type==='state'&&validState(data.state)){
   if(now-p.lastStateAt<40)return;const s=data.state,appearance=p.state.car!==s.car||p.state.color!==s.color.toLowerCase();this.updateWeapon(p,s,now);p.previous=p.state;p.lastStateAt=now;
   p.state=Object.fromEntries(['x','y','z','yaw','vx','vy','vz','pitch','roll','steer','speed','car','water'].map(k=>[k,s[k]]));p.state.color=s.color.toLowerCase();p.state.roadMode=s.roadMode===true;p.state.wallMode=s.car==='stick'&&['climbing','sliding'].includes(s.wallMode)?s.wallMode:'';
   for(const k of ['nitro','grounded','brake','parked'])p.state[k]=s[k]===true;if(p.state.parked)park(p.state);
   if(appearance)this.announce();this.frame();
  }else if(data.type==='chat'){
   if(!rules.validChat(data.message))return reply(ws,{type:'chatError',message:'Choose one of the preset messages.'});
   const remaining=rules.chatCooldown-(now-(p.lastChatAt||0));
   if(remaining>0)return reply(ws,{type:'chatError',message:'Give it a moment before your next message.',retryAfter:remaining});
   // Only the preset index is accepted. Identity and bubble lifetime come from the server.
   p.lastChatAt=now;this.broadcast({type:'chat',id:p.id,message:data.message,duration:rules.chatDuration});
  }else if(data.type==='hit'){
   const b=this.world.buildings[data.id],s=p.state;
   if(!Number.isInteger(data.id)||!b||this.hp[b.id]<=0||now-(this.hits[b.id]||0)<700||!numeric(data.speed,s.car==='beast'?4:15,95))return;
   if(Math.hypot(s.x-b.x,s.z-b.z)>Math.hypot(b.w,b.d)/2+10||s.y>b.y+b.h+2||s.y<b.y-3)return;
   const recent=Math.max(Math.hypot(s.vx,s.vz),p.previous?Math.hypot(p.previous.vx,p.previous.vz):0);if(data.speed>recent+12)return;
   this.hits[b.id]=now;this.hp[b.id]=Math.max(0,this.hp[b.id]-(s.car==='beast'?100:Math.min(44,(data.speed**2-225)*.043*models.get(s.car).mass)));this.broadcast({type:'building',id:b.id,hp:this.hp[b.id],speed:data.speed});await this.checkpoint();
   }else if(data.type==='treeHit'){
   const t=this.world.trees?.[data.id],s=p.state;if(s.car!=='beast'||!Number.isInteger(data.id)||!t||this.fallenTrees.some(a=>a[0]===data.id)||Math.hypot(s.x-t.x,s.z-t.z)>8||s.y>t.y+t.h||s.y<t.y-3||Math.hypot(s.vx,s.vz)<4||!numeric(data.dx,-1,1)||!numeric(data.dz,-1,1))return;
   this.fallenTrees.push([data.id,data.dx,data.dz]);this.broadcast({type:'treeDown',id:data.id,dx:data.dx,dz:data.dz});await this.checkpoint();
  }else if(data.type==='trafficHit'){
 
   const t=this.traffic[data.id],s=p.state;if(!Number.isInteger(data.id)||!t||now-p.lastTrafficHit<220||Math.hypot(s.x-t.x,s.z-t.z)>12||Math.abs(s.y-t.y)>3||!numeric(data.nx,-1,1)||!numeric(data.nz,-1,1)||!numeric(data.speed,0,95))return;
   const mass=models.get(s.car).mass,power=Math.min(data.speed,Math.hypot(s.vx-t.vx,s.vz-t.vz)+8)*.6*mass/(mass+1);p.lastTrafficHit=now;t.driftX-=data.nx*power;t.driftZ-=data.nz*power;t.speed*=.45;t.stun=1.6;if(s.car==='beast'&&data.speed>=4&&Math.hypot(s.vx-t.vx,s.vz-t.vz)>=4){t.wrecked=true;t.burning=true;t.speed=0;t.stun=999;await this.checkpoint();}
  }else if(data.type==='aura'){
   if(!Number.isSafeInteger(data.seq)||data.seq!==p.scoreSeq+1||!Number.isSafeInteger(data.points)||data.points<=0||data.points>25000||now-p.lastScoreAt<100)return;
   p.scoreSeq=data.seq;p.lastScoreAt=now;p.score=Math.min(1e9,p.score+data.points);this.announce();
  }else if(data.type==='reset'){reply(ws,{type:'error',message:'The global map refreshes after everyone leaves.'});}
  else if(data.type==='leave'){this.players.delete(p.id);this.attach(ws,null);this.meta.delete(ws);if(!this.players.size)this.emptyAt=now;this.announce();reply(ws,{type:'left'});ws.close(1000,'Left global room');await this.checkpoint();return;}
  else if(data.type==='ping'&&numeric(data.at,0,1e16)){reply(ws,{type:'pong',at:data.at});this.frame();}
  this.attach(ws,p);if(this.nukes.length||this.wetDirty){this.wetDirty=false;await this.checkpoint();}await this.schedule();
 }
 async disconnect(ws){const p=this.playerFor(ws);this.meta.delete(ws);if(!p)return;p.ws=null;p.disconnectedAt=Date.now();park(p.state);this.announce();await this.checkpoint();await this.schedule();}
 async webSocketClose(ws,code){await this.disconnect(ws);try{ws.close(code===1006?1000:code);}catch{}}
 async webSocketError(ws){await this.disconnect(ws);try{ws.close(1011,'Reconnect');}catch{}}
 async alarm(){this.nextAlarm=0;this.detonateNukes(Date.now());this.cleanup();await this.checkpoint();if(this.players.size||this.meta.size||this.nukes.length)await this.schedule();}
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/')){if(!env.COMMUNITY)return Response.json({error:'Complete the V1.6 CommunityHub setup.'},{status:503});return env.COMMUNITY.getByName('isla-community-v16').fetch(request);}
  if(url.pathname==='/healthz')return Response.json({ok:true,release:'1.7',room:'GLOBAL',capacity:rules.capacity,version:rules.protocol,maps:['islands','city','peaks']});
  if(url.pathname==='/ws'){
   if(url.searchParams.get('map')==='obstacle')return new Response('Void Run has been replaced by Islayan Peaks. Refresh your game.',{status:410});
   if(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
   const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return new Response('Origin not allowed',{status:403});
   const headers=new Headers(request.headers);headers.delete('X-Isla-Account');
   const hub=env.COMMUNITY?.getByName('isla-community-v16');if(hub){const account=await hub.internalIdentity(request.headers.get('Cookie'));if(account)headers.set('X-Isla-Account',JSON.stringify(account));}
   const mapId=url.searchParams.get('map');let room;
   if(mapId?.startsWith('custom:')){if(!hub)return new Response('Community maps are unavailable',{status:503});try{const info=await hub.internalMap(mapId.slice(7));if(Number(url.searchParams.get('revision'))!==info.revision)return new Response('A new version of this map is available. Refresh before joining.',{status:409});room=env.GLOBAL.getByName('custom-'+info.id+'-r'+info.revision);await room.prepareCustom(info);}catch{return new Response('This map is not available. Refresh the map page.',{status:404});}}
   else room=env.GLOBAL.getByName(mapId==='peaks'?'isla-global-peaks-v1':mapId==='city'?'isla-global-city-v4':'isla-global-v2');
   return room.fetch(new Request(request,{headers}));
  }
  return env.ASSETS?env.ASSETS.fetch(request):new Response('Not found',{status:404});
 }
};
