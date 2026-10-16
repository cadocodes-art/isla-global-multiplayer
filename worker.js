import {DurableObject} from 'cloudflare:workers';
import '../public/player-rules.js';
import world from './world-data.json';
import {freshTraffic,place,stepTraffic} from './traffic.js';
const rules=globalThis.IslaRules,models=new Map(world.cars.map(m=>[m.id,m]));
const RECONNECT=90000,EMPTY_RESET=600000,MAX_SOCKETS=48;
const numeric=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const park=s=>Object.assign(s,{parked:true,nitro:false,vx:0,vy:0,vz:0,speed:0});
const spawn=slot=>({...world.spawns[slot],vx:0,vy:0,vz:0,pitch:0,roll:0,steer:0,speed:0,car:'classic',color:models.get('classic').color,nitro:false,grounded:true,water:'dry',brake:false,parked:false});
function validState(s){return s&&models.has(s.car)&&rules.validColor(s.color)&&[['x',-3000,4000],['y',-100,1500],['z',-3000,3000],['yaw',-100000,100000],['vx',-120,120],['vy',-150,150],['vz',-120,120],['pitch',-4,4],['roll',-4,4],['steer',-2,2],['speed',-120,120]].every(([k,a,b])=>numeric(s[k],a,b))&&['dry','skimming','sinking'].includes(s.water);}
function reply(ws,data){try{ws.send(JSON.stringify(data));return true;}catch{return false;}}
function serial(p){const {ws,previous,...saved}=p;return saved;}
export class GlobalRoom extends DurableObject {
 constructor(ctx,env){
  super(ctx,env);this.ctx=ctx;this.players=new Map();this.meta=new Map();this.attempts=new Map();this.hp=world.buildings.map(()=>100);this.hits=[];this.traffic=freshTraffic();this.lastTick=Date.now();this.lastFrame=0;this.emptyAt=Date.now();this.nextAlarm=0;
  ctx.blockConcurrencyWhile(async()=>{
   const saved=await ctx.storage.get('world-v2');
   if(saved){if(Array.isArray(saved.hp)&&saved.hp.length===this.hp.length)this.hp=saved.hp;this.hits=saved.hits||[];this.emptyAt=saved.emptyAt||0;
    if(saved.traffic?.length===world.traffic.length)this.traffic=saved.traffic.map(t=>place(t));
    for(const p of saved.reservations||[])if(Date.now()-p.disconnectedAt<RECONNECT&&!rules.validateName(p.name))this.players.set(p.id,{...p,ws:null,previous:null});
   }
   for(const ws of ctx.getWebSockets()){const a=ws.deserializeAttachment();if(!a)continue;this.meta.set(ws,a.meta);
    if(a.player&&!rules.validateName(a.player.name)&&validState(a.player.state)){const p={...a.player,ws,previous:null,disconnectedAt:0};this.players.set(p.id,p);}else if(a.player){ws.close(1008,'Choose a valid car name');}
   }
   this.nextAlarm=await ctx.storage.getAlarm()||0;this.cleanup();
  });
 }
 attach(ws,p){const meta=this.meta.get(ws);if(meta)ws.serializeAttachment({meta,player:p?serial(p):null});}
 roster(){return [...this.players.values()].map(p=>({id:p.id,name:p.name,score:p.score,connected:!!p.ws,car:p.state.car,color:p.state.color}));}
 broadcast(data){const text=JSON.stringify(data);for(const p of this.players.values())if(p.ws)try{p.ws.send(text);}catch{}}
 announce(){this.broadcast({type:'roster',players:this.roster(),host:null});}
 async schedule(){if(this.nextAlarm>Date.now())return;this.nextAlarm=Date.now()+30000;await this.ctx.storage.setAlarm(this.nextAlarm);}
 async checkpoint(){await this.ctx.storage.put('world-v2',{hp:this.hp,hits:this.hits,traffic:this.traffic,emptyAt:this.emptyAt,reservations:[...this.players.values()].filter(p=>!p.ws).map(serial)});}
 cleanup(){
  const now=Date.now();let changed=false;
  for(const [id,p]of this.players)if(!p.ws&&now-p.disconnectedAt>=RECONNECT){this.players.delete(id);changed=true;}
  if(!this.players.size&&!this.emptyAt)this.emptyAt=now;
  if(!this.players.size&&this.emptyAt&&now-this.emptyAt>=EMPTY_RESET){this.hp.fill(100);this.hits=[];this.traffic=freshTraffic();this.emptyAt=now;}
  for(const [ip,b]of this.attempts)if(now-b.at>60000)this.attempts.delete(ip);
  for(const [ws,m]of this.meta)if(!this.playerFor(ws)&&now-m.createdAt>15000){try{ws.close(1008,'Join the global room');}catch{}this.meta.delete(ws);}
  if(changed)this.announce();
 }
 playerFor(ws){return [...this.players.values()].find(p=>p.ws===ws);}
 async fetch(request){
  this.cleanup();const now=Date.now(),ip=request.headers.get('CF-Connecting-IP')||'local';
  let bucket=this.attempts.get(ip);if(!bucket||now-bucket.at>60000)this.attempts.set(ip,bucket={at:now,count:0});
  if(++bucket.count>60)return new Response('Too many connections. Try again shortly.',{status:429});
  if(this.ctx.getWebSockets().length>=MAX_SOCKETS)return new Response('The global room is busy. Try again shortly.',{status:503});
  const pair=new WebSocketPair(),[client,server]=Object.values(pair);
  this.ctx.acceptWebSocket(server);this.meta.set(server,{createdAt:now,rateAt:now,count:0,lastJoin:0});this.attach(server,null);await this.schedule();
  return new Response(null,{status:101,webSocket:client});
 }
 async join(ws,data){
  if(this.playerFor(ws))return reply(ws,{type:'error',message:'You are already in the global room.'});
  if(data.v!==rules.protocol)return reply(ws,{type:'error',message:'Refresh the game to join this version.'});
  const error=rules.validateName(data.name);if(error)return reply(ws,{type:'error',message:error});
  this.cleanup();let p,resumed=false;
  if(data.type==='resume'){
   p=[...this.players.values()].find(q=>q.token===data.token&&(!q.disconnectedAt||Date.now()-q.disconnectedAt<RECONNECT));
   if(!p||p.name!==data.name)return reply(ws,{type:'error',message:'Your reserved spot expired. Join the global room again.',expired:true});resumed=true;
  }else{
   if(this.players.size>=rules.capacity)return reply(ws,{type:'error',message:'The global room is full (32 drivers). Try again shortly.'});
   const used=new Set([...this.players.values()].map(q=>q.slot));let slot=0;while(used.has(slot))slot++;
   p={id:crypto.randomUUID(),token:crypto.randomUUID()+crypto.randomUUID(),name:data.name,slot,score:0,scoreSeq:0,lastScoreAt:0,lastTrafficHit:0,lastStateAt:0,state:spawn(slot),previous:null,disconnectedAt:0,ws:null};this.players.set(p.id,p);
  }
  const old=p.ws;if(old&&old!==ws){this.meta.delete(old);try{old.serializeAttachment({meta:{createdAt:Date.now()},player:null});old.close(4001,'Connection replaced');}catch{}}
  p.ws=ws;p.disconnectedAt=0;this.emptyAt=0;this.attach(ws,p);await this.checkpoint();
  reply(ws,{type:'welcome',v:rules.protocol,code:'GLOBAL',id:p.id,token:p.token,resumed,state:p.state,scoreSeq:p.scoreSeq,hp:this.hp,buildings:world.buildings.map(b=>[b.id,Math.round(b.x*100),Math.round(b.z*100)]),players:this.roster(),host:null});
  this.announce();await this.schedule();
 }
 frame(){
  const now=Date.now();if(now-this.lastFrame<95)return;
  let remaining=Math.min(.3,(now-this.lastTick)/1000);const obstacles=[...this.players.values()].map(p=>p.state);
  while(remaining>0){const dt=Math.min(1/30,remaining);stepTraffic(this.traffic,obstacles,dt);remaining-=dt;}
  this.lastTick=now;this.lastFrame=now;
  this.broadcast({type:'frame',time:now,players:[...this.players.values()].map(p=>({id:p.id,name:p.name,connected:!!p.ws,state:p.state})),traffic:this.traffic.map(t=>[t.x,t.y,t.z,t.yaw,t.vx,t.vz,t.speed,t.distance])});
 }
 async webSocketMessage(ws,raw){
  const meta=this.meta.get(ws);if(!meta)return;
  if(typeof raw!=='string'||raw.length>8192){ws.close(1009,'Invalid message size');return;}
  const now=Date.now();if(now-meta.rateAt>=1000){meta.count=0;meta.rateAt=now;}if(++meta.count>40){ws.close(1008,'Too many messages');return;}
  let data;try{data=JSON.parse(raw);}catch{ws.close(1008,'Invalid message');return;}
  if(!data||typeof data!=='object'||Array.isArray(data))return;
  if(['join','resume'].includes(data.type)){if(now-meta.lastJoin<700)return;meta.lastJoin=now;await this.join(ws,data);return;}
  const p=this.playerFor(ws);if(!p)return;
  if(data.type==='state'&&validState(data.state)){
   if(now-p.lastStateAt<40)return;const s=data.state,appearance=p.state.car!==s.car||p.state.color!==s.color.toLowerCase();p.previous=p.state;p.lastStateAt=now;
   p.state=Object.fromEntries(['x','y','z','yaw','vx','vy','vz','pitch','roll','steer','speed','car','water'].map(k=>[k,s[k]]));p.state.color=s.color.toLowerCase();
   for(const k of ['nitro','grounded','brake','parked'])p.state[k]=s[k]===true;if(p.state.parked)park(p.state);
   if(appearance)this.announce();this.frame();
  }else if(data.type==='chat'){
   if(!rules.validChat(data.message))return reply(ws,{type:'chatError',message:'Choose one of the preset messages.'});
   const remaining=rules.chatCooldown-(now-(p.lastChatAt||0));
   if(remaining>0)return reply(ws,{type:'chatError',message:'Give it a moment before your next message.',retryAfter:remaining});
   // Only the preset index is accepted. Identity and bubble lifetime come from the server.
   p.lastChatAt=now;this.broadcast({type:'chat',id:p.id,message:data.message,duration:rules.chatDuration});
  }else if(data.type==='hit'){
   const b=world.buildings[data.id],s=p.state;
   if(!Number.isInteger(data.id)||!b||this.hp[b.id]<=0||now-(this.hits[b.id]||0)<700||!numeric(data.speed,15,95))return;
   if(Math.hypot(s.x-b.x,s.z-b.z)>Math.hypot(b.w,b.d)/2+10||s.y>b.y+b.h+2||s.y<b.y-3)return;
   const recent=Math.max(Math.hypot(s.vx,s.vz),p.previous?Math.hypot(p.previous.vx,p.previous.vz):0);if(data.speed>recent+12)return;
   this.hits[b.id]=now;this.hp[b.id]=Math.max(0,this.hp[b.id]-Math.min(44,(data.speed**2-225)*.043*models.get(s.car).mass));this.broadcast({type:'building',id:b.id,hp:this.hp[b.id],speed:data.speed});await this.checkpoint();
  }else if(data.type==='trafficHit'){
   const t=this.traffic[data.id],s=p.state;if(!Number.isInteger(data.id)||!t||now-p.lastTrafficHit<220||Math.hypot(s.x-t.x,s.z-t.z)>12||Math.abs(s.y-t.y)>3||!numeric(data.nx,-1,1)||!numeric(data.nz,-1,1)||!numeric(data.speed,0,95))return;
   const mass=models.get(s.car).mass,power=Math.min(data.speed,Math.hypot(s.vx-t.vx,s.vz-t.vz)+8)*.6*mass/(mass+1);p.lastTrafficHit=now;t.driftX-=data.nx*power;t.driftZ-=data.nz*power;t.speed*=.45;t.stun=1.6;
  }else if(data.type==='aura'){
   if(!Number.isSafeInteger(data.seq)||data.seq!==p.scoreSeq+1||!Number.isSafeInteger(data.points)||data.points<=0||data.points>25000||now-p.lastScoreAt<100)return;
   p.scoreSeq=data.seq;p.lastScoreAt=now;p.score=Math.min(1e9,p.score+data.points);this.announce();
  }else if(data.type==='reset'){reply(ws,{type:'error',message:'The global islands refresh after everyone leaves.'});}
  else if(data.type==='leave'){this.players.delete(p.id);this.attach(ws,null);this.meta.delete(ws);if(!this.players.size)this.emptyAt=now;this.announce();reply(ws,{type:'left'});ws.close(1000,'Left global room');await this.checkpoint();return;}
  else if(data.type==='ping'&&numeric(data.at,0,1e16)){reply(ws,{type:'pong',at:data.at});this.frame();}
  this.attach(ws,p);await this.schedule();
 }
 async disconnect(ws){const p=this.playerFor(ws);this.meta.delete(ws);if(!p)return;p.ws=null;p.disconnectedAt=Date.now();park(p.state);this.announce();await this.checkpoint();await this.schedule();}
 async webSocketClose(ws,code){await this.disconnect(ws);try{ws.close(code===1006?1000:code);}catch{}}
 async webSocketError(ws){await this.disconnect(ws);try{ws.close(1011,'Reconnect');}catch{}}
 async alarm(){this.nextAlarm=0;this.cleanup();await this.checkpoint();if(this.players.size||this.meta.size)await this.schedule();}
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/healthz')return Response.json({ok:true,room:'GLOBAL',capacity:rules.capacity,version:rules.protocol});
  if(url.pathname==='/ws'){
   if(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
   const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return new Response('Origin not allowed',{status:403});
   return env.GLOBAL.getByName('isla-global-v2').fetch(request);
  }
  return env.ASSETS?env.ASSETS.fetch(request):new Response('Not found',{status:404});
 }
};
