'use strict';
(() => {
 const W=Isla,T=THREE,$=id=>document.getElementById(id);
 const safeRead=(storage,key)=>{try{return storage.getItem(key)}catch{return null}};
 const safeWrite=(storage,key,value)=>{try{if(value===null)storage.removeItem(key);else storage.setItem(key,value)}catch{}};
 let local,session;try{local=localStorage;session=sessionStorage}catch{}
 let sessionKey=W.mapId==='peaks'?'isla-global-peaks-v1':W.mapId==='city'?'isla-global-city-v4':'isla-global-v2';
 const net=W.net={collisionSeq:0,active:false,connected:false,code:'GLOBAL',id:'',host:'',players:[],remotes:new Map(),latency:0};
 let socket=null,identity=null,intent=null,connecting=false,leaving=false,retry=null,connectTimeout=null,attempt=0,lastSend=0,lastPing=0,lastAura=0,pendingAura=0,scoreSeq=0,trafficTargets=null,ui=null,open=false;
 let chatOpen=false,chatResume=false,chatCategory='Vibes',chatReadyAt=0,chatPendingUntil=0,lastChatHint='';
 const bubbles=new Map(),chatPoint=new T.Vector3(),chatView=new T.Vector3();
 const send=data=>{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(data));};
 function clearBubbles(){for(const bubble of bubbles.values())bubble.element.remove();bubbles.clear();}
 function refreshChat(){
  const wait=Math.max(0,chatReadyAt-performance.now(),chatPendingUntil-performance.now());
  const hint=!net.connected?'Join the global room to chat.':wait>0?'Next message in '+Math.ceil(wait/1000)+'s':'30 preset messages · Everyone nearby can see your bubble.';
  if(hint===lastChatHint)return;lastChatHint=hint;$('chatHint').textContent=hint;
  for(const button of $('chatOptions').querySelectorAll('button'))button.disabled=!net.connected||wait>0;
 }
 function drawChat(){
  const tabs=$('chatTabs'),options=$('chatOptions');tabs.replaceChildren();options.replaceChildren();
  for(const category of new Set(IslaRules.quickChat.map(m=>m.category))){const button=document.createElement('button');button.type='button';button.textContent=category;button.setAttribute('aria-pressed',String(category===chatCategory));button.onclick=()=>{chatCategory=category;drawChat();$('chatTabs').querySelector('[aria-pressed="true"]').focus();};tabs.append(button);}
  IslaRules.quickChat.forEach((message,index)=>{if(message.category!==chatCategory)return;const button=document.createElement('button');button.type='button';button.dataset.message=String(index);button.textContent=message.text;button.onclick=()=>sendChat(index);options.append(button);});
  lastChatHint='';refreshChat();
 }
 function closeChat(resume=true){if(!chatOpen)return;chatOpen=false;$('quickChat').classList.add('hidden');$('chatBtn').setAttribute('aria-expanded','false');if(resume)ui.pause(!chatResume);}
 net.dismissChat=()=>closeChat(false);
 net.chatOpen=()=>chatOpen;
 net.toggleChat=()=>{
  if(chatOpen){closeChat();return;}
  if(!net.connected){ui.toast('Join the global room to use quick chat.',2.5);return;}
  if(open||!$('garage').classList.contains('hidden'))return;
  chatResume=!ui.paused();chatOpen=true;ui.pause(true);$('pause').classList.add('hidden');drawChat();$('quickChat').classList.remove('hidden');$('chatBtn').setAttribute('aria-expanded','true');$('chatClose').focus({preventScroll:true});
 };
 function sendChat(message){
  if(!net.connected||!IslaRules.validChat(message)||performance.now()<Math.max(chatReadyAt,chatPendingUntil)){refreshChat();return;}
  chatPendingUntil=performance.now()+3000;send({type:'chat',message});closeChat();
 }
 function showChat(data){
  if(!net.active||!IslaRules.validChat(data.message)||!net.players.some(p=>p.id===data.id))return;
  const existing=bubbles.get(data.id);if(existing)existing.element.remove();
  const element=document.createElement('div'),card=document.createElement('div'),name=document.createElement('small'),text=document.createElement('span');
  element.className='car-bubble'+(data.id===net.id?' own':'');element.hidden=true;element.dataset.player=data.id;element.dataset.message=String(data.message);card.className='car-bubble-card';
  name.textContent=data.id===net.id?'YOU':net.players.find(p=>p.id===data.id).name;text.textContent=IslaRules.quickChat[data.message].text;card.append(name,text);element.append(card);$('carBubbles').append(element);
  bubbles.set(data.id,{element,until:performance.now()+IslaRules.chatDuration});
  if(data.id===net.id){chatPendingUntil=0;chatReadyAt=performance.now()+IslaRules.chatCooldown;refreshChat();}
 }
 net.renderChat=camera=>{
  const now=performance.now();if(chatOpen)refreshChat();for(const remote of net.remotes.values())if(remote.tag)remote.tag.visible=true;
  for(const [id,bubble]of bubbles){
   const player=net.players.find(p=>p.id===id);
   if(now>=bubble.until||!player?.connected||!net.active){bubble.element.remove();bubbles.delete(id);continue;}
   const own=id===net.id,remote=net.remotes.get(id),foot=own?(W.walk?.active?W.walk.state:null):(remote?.target.walk?remote.footState||remote.target.walk:null),car=foot||(own?W.vehicle:remote?.current),size=foot?.75:own?(W.carMesh?.size||1):(remote?.mesh.size||1),focus=W.walk?.active?W.walk.state:W.vehicle;
   if(!car||(!own&&Math.hypot(car.x-focus.x,car.z-focus.z)>220)){bubble.element.hidden=true;continue;}
   chatPoint.set(car.x,car.y+2.8*size,car.z);chatView.copy(chatPoint).applyMatrix4(camera.matrixWorldInverse);
   if(chatView.z>=0){bubble.element.hidden=true;continue;}chatPoint.project(camera);
   if(chatPoint.z<-1||chatPoint.z>1||Math.abs(chatPoint.x)>1.1||Math.abs(chatPoint.y)>1.1){bubble.element.hidden=true;continue;}
   if(remote?.tag)remote.tag.visible=false;bubble.element.hidden=false;bubble.element.style.transform='translate('+((chatPoint.x+1)*innerWidth/2)+'px,'+((1-chatPoint.y)*innerHeight/2)+'px) translate(-50%,-100%)';bubble.element.style.opacity=String(Math.min(1,(bubble.until-now)/700));
  }
 };
 function status(message,error=false){$('roomStatus').textContent=message;$('roomStatus').classList.toggle('error',error);}
 function saveIdentity(){safeWrite(session,sessionKey,identity?JSON.stringify(identity):null);}
 function pose(){const c=W.vehicle,parked=ui.paused()||document.hidden||!!W.walk?.active;return {walk:W.walk?.snapshot(),collisionAck:net.collisionSeq,x:c.x,y:c.y,z:c.z,yaw:c.yaw,vx:parked?0:c.vx,vy:parked?0:c.vy,vz:parked?0:c.vz,pitch:c.pitch,roll:c.roll,steer:c.steer,speed:parked?0:c.speed,car:W.garage.selected,color:W.garage.getColor(),nitro:!parked&&c.nitroTime>0,wallMode:c.wallMode||'',roadMode:!!c.roadMode,grounded:c.grounded,water:c.waterMode,brake:!!c.brake,parked};}
 function applySpawn(state){W.resetVehicle(true);Object.assign(W.vehicle,{x:state.x,y:state.y,z:state.z,yaw:state.yaw,lastSafe:{x:state.x,z:state.z,yaw:state.yaw}});W.walk?.restore(state.walk);}
 function drawRoster(){
  $('chatBtn').disabled=!net.connected;if(!net.connected)closeChat(false);lastChatHint='';
  $('roomLobby').classList.toggle('hidden',!net.active);$('roomEntry').classList.toggle('hidden',net.active);
  $('roomJoin').disabled=connecting;
  $('roomCode').textContent='GLOBAL';$('roomCount').textContent=net.players.filter(p=>p.connected).length+' / '+IslaRules.capacity+' DRIVERS';
  $('roomBtn').textContent=net.active?(net.connected?'● GLOBAL ROOM':'↻ RECONNECTING'):'GLOBAL ROOM';
  $('roomBtn').classList.toggle('in-room',net.active);
  $('roomHostHint').textContent='The map refreshes after the room has been empty for ten minutes.';
  const list=$('roomPlayers');list.replaceChildren();
  const sorted=[...net.players].sort((a,b)=>b.score-a.score);
  for(let i=0;i<sorted.length;i++){const p=sorted[i],row=document.createElement('div');row.className='room-player'+(!p?' empty':'');
   const rank=document.createElement('span');rank.className='room-rank';rank.textContent=String(i+1).padStart(2,'0');
   const name=document.createElement('span');name.className='room-driver';name.textContent=p?p.name+(p.guest?' · Guest':'')+(p.id===net.id?' (you)':''):'Waiting for a friend';
   if(p){const sub=document.createElement('small');sub.textContent=!p.connected?'RECONNECTING · SPOT RESERVED':'EXPLORING '+W.mapInfo.short+'';name.append(sub);}
   const score=document.createElement('strong');score.textContent=p?p.score.toLocaleString('en-US'):'—';const swatch=document.createElement('i');swatch.className='driver-paint';swatch.style.backgroundColor=IslaRules.validColor(p?.color)?p.color:'#9a3227';row.append(rank,swatch,name,score);list.append(row);
  }
 }
 function openRoom(){closeChat(false);open=true;$('garage').classList.add('hidden');if(ui.started())ui.pause(true);$('pause').classList.add('hidden');$('rooms').classList.remove('hidden');drawRoster();
  if(location.protocol==='file:')status('The global room needs the Cloudflare edition. This downloaded game still works solo.');
  else if(!net.active&&!connecting)status('Name your car to join everyone on this map.');
  $('rooms').scrollTop=0;document.querySelector('.room-panel').scrollTop=0;(net.active?$('roomClose'):$('driverName')).focus({preventScroll:true});
 }
 function closeRoom(){open=false;$('rooms').classList.add('hidden');if(ui.started())ui.pause(false);else $('startBtn').focus();}
 net.closePanel=()=>{if(chatOpen){closeChat();return true;}if(!open)return false;closeRoom();return true;};
 net.panelOpen=()=>open||chatOpen;
 function disposeRemote(remote){if(remote.person){if(remote.tag)remote.mesh.root.add(remote.tag);W.scene.remove(remote.person.root);}W.scene.remove(remote.mesh.root);const geometries=new Set(),materials=new Set(),textures=new Set();remote.mesh.root.traverse(o=>{if(o.geometry&&o.geometry!==W.unitBox&&!o.isSprite)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(m.map)textures.add(m.map);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}
 function clearRemotes(){for(const r of net.remotes.values())disposeRemote(r);net.remotes.clear();}
 function nameTag(name){const texture=W.textureCanvas(512,(c,s)=>{c.fillStyle='#10272be8';c.fillRect(0,160,s,110);c.strokeStyle='#b8edcb';c.lineWidth=4;c.strokeRect(2,162,s-4,106);c.fillStyle='#effff2';c.font='600 34px Arial';c.textAlign='center';c.fillText(name,256,228,480);});const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));sprite.position.set(0,2.4,0);sprite.scale.set(2.6,2.6,1);return sprite;}
 function remoteFor(p){let remote=net.remotes.get(p.id);if(remote&&remote.car!==p.state.car){disposeRemote(remote);net.remotes.delete(p.id);remote=null;}
  if(!remote){const model=W.carModels.find(m=>m.id===p.state.car)||W.carModels[0],mesh=W.makeCar({...model,color:IslaRules.validColor(p.state.color)?p.state.color:model.color},true);const tag=nameTag(p.name+(p.guest?' · Guest':''));mesh.root.add(tag);remote={mesh,tag,car:p.state.car,current:{...p.state},target:{...p.state},at:performance.now(),connected:p.connected};net.remotes.set(p.id,remote);}
  if(IslaRules.validColor(p.state.color))remote.mesh.paint.color.set(p.state.color).convertSRGBToLinear();remote.target={...p.state};remote.at=performance.now();remote.connected=p.connected;return remote;
 }
 function disconnectToSolo(message){W.walk?.stop();closeChat(false);clearBubbles();chatReadyAt=chatPendingUntil=0;clearTimeout(retry);clearTimeout(connectTimeout);leaving=true;const old=socket;socket=null;old?.close();identity=null;saveIdentity();intent=null;connecting=false;net.active=net.connected=false;W.playSync?.clear();net.code='';net.id='';net.players=[];pendingAura=0;trafficTargets=null;clearRemotes();ui.restore();W.initTraffic();W.resetVehicle(true);drawRoster();status(message);}
 net.footRecover=()=>{if(net.connected)send({type:'footRecover'});};
 net.sendPlayContact=()=>{if(net.connected)send({type:'playContact',state:pose()});};
 net.leave=()=>{send({type:'leave'});disconnectToSolo('You left the global room. Your aura, cars, and paint are still saved.');closeRoom();ui.toast('Back to solo driving.');};
 function connect(){
  clearTimeout(retry);clearTimeout(connectTimeout);
  if(location.protocol==='file:'){status('Open your Cloudflare game link to join the global room.',true);return;}
  if(!['http:','https:'].includes(location.protocol))return;
  leaving=false;connecting=true;drawRoster();
  const ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws?map='+encodeURIComponent(W.mapId)+(W.customMap?'&revision='+IslaCommunity.custom.info.revision:''));socket=ws;
  status(identity?'Reconnecting to the global room…':'Connecting to the global room…');
  connectTimeout=setTimeout(()=>{if(socket===ws&&!net.connected){status('The server is taking a while. Retrying…');ws.close();}},70000);
  ws.onopen=()=>{if(socket!==ws)return;send({...identity?{type:'resume',v:IslaRules.protocol,name:identity.name,token:identity.token}:intent,...W.mapId==='playplace'?{playplaceRevision:6}:{}});};
  ws.onmessage=e=>{if(socket!==ws)return;let data;try{data=JSON.parse(e.data)}catch{return;}
   if(data.type==='welcome'){
    const expected=W.buildings.map(b=>[b.id,Math.round(b.x*100),Math.round(b.z*100)]);
    if((data.mapId&&data.mapId!==W.mapId)||JSON.stringify(expected)!==JSON.stringify(data.buildings)){disconnectToSolo('This game version differs from the server. Refresh before joining.');openRoom();status('This game version differs from the server. Refresh before joining.',true);return;}
    clearTimeout(connectTimeout);attempt=0;connecting=false;net.active=net.connected=true;net.code=data.code;net.id=data.id;net.collisionSeq=data.collisionSeq||0;if(data.props)W.receiveThrownProps?.(data.props);if(data.rocket)W.acceptRocket?.(data.rocket);net.host=data.host;net.players=data.players;scoreSeq=data.scoreSeq;pendingAura=0;
    identity={code:data.code,token:data.token,name:intent?.name||identity?.name||$('driverName').value};saveIdentity();
    ui.restore();ui.buildings(data.hp);for(const [id,dx,dz]of data.trees||[])W.fellTree?.(W.trees[id],dx,dz,true);applySpawn(data.state);if(data.playground)W.playSync?.receive(data.playground,true);drawRoster();ui.start();closeRoom();status('Connected to the global room.');ui.toast(data.resumed?'Back in the global room.':'GLOBAL ROOM · '+identity.name,5);
   }else if(data.type==='error'){
    const message=data.message;
    if(data.expired){disconnectToSolo(message);openRoom();status(message,true);}
    else{connecting=false;drawRoster();status(message,true);if(!net.active){leaving=true;clearTimeout(connectTimeout);ws.close();}}
   }else if(data.type==='roster'){
    net.players=data.players;net.host=data.host;drawRoster();
    const ids=new Set(data.players.map(p=>p.id));for(const [id,r] of net.remotes)if(!ids.has(id)){disposeRemote(r);net.remotes.delete(id);}
   }else if(data.type==='footHit'&&net.active){if(W.walk?.active){W.walk.immune=0;W.walk.tumble(data.reason||'Ouch! Back beside your car.');}}else if(data.type==='collision'&&net.active){
    if(Number.isSafeInteger(data.seq)&&data.seq>net.collisionSeq&&['dx','dz','dvx','dvz'].every(k=>Number.isFinite(data[k]))){net.collisionSeq=data.seq;const c=W.vehicle;if(Number.isFinite(data.dvy)&&data.dvy>0){c.vy=Math.max(c.vy,0)+data.dvy;c.y+=.4;c.grounded=false;c.ramp=null;c.playSupport=null;c.playAir=true;c.roadMode=false;}c.x+=data.dx;c.z+=data.dz;c.vx+=data.dvx;c.vz+=data.dvz;c.speed=c.vx*Math.sin(c.yaw)+c.vz*Math.cos(c.yaw);c.roadFrame=null;W.onImpact?.(c.x,c.y+.7,c.z,Math.min(35,data.speed||0));lastSend=0;send({type:'state',state:pose()});}
   }else if(data.type==='frame'&&net.active){
    for(const p of data.players){if(p.id!==net.id)remoteFor(p);else{if(Number.isFinite(p.nukeRemaining))W.syncNukeTimer(p.nukeRemaining);if(p.rocket)W.acceptRocket?.(p.rocket);}}
    trafficTargets=data.traffic;if(data.props)W.receiveThrownProps?.(data.props);if(data.playground)W.playSync?.receive(data.playground);
   }else if(data.type==='rocket'){W.acceptRocket?.(data.rocket);}
   else if(data.type==='propLaunch'){W.receiveThrownProps?.([data.prop]);}
   else if(data.type==='nukeLaunch'&&net.active){W.showNuke(data.shot);if(data.id===net.id)W.syncNukeTimer(15);}
   else if(data.type==='nukeBlast'&&net.active){for(const [id,hp]of data.buildings)ui.building(id,hp,0);W.showNukeBlast(data.blast);}
   else if(data.type==='treeDown'&&net.active){W.fellTree?.(W.trees[data.id],data.dx,data.dz,true);}
   else if(data.type==='chat'){showChat(data);}
   else if(data.type==='chatError'){chatPendingUntil=0;if(Number.isFinite(data.retryAfter))chatReadyAt=performance.now()+Math.min(IslaRules.chatCooldown,Math.max(0,data.retryAfter));lastChatHint='';refreshChat();ui.toast(data.message,2.5);}
   else if(data.type==='building'&&net.active){ui.building(data.id,data.hp,data.speed);}
   else if(data.type==='reset'&&net.active){ui.restore();const me=data.players.find(p=>p.id===net.id);if(me)applySpawn(me.state);trafficTargets=null;ui.toast('The global map has refreshed.');}
   else if(data.type==='pong'){net.latency=Math.max(0,Date.now()-data.at);$('roomLatency').textContent=net.latency+' ms';}
  };
  ws.onerror=()=>{};
  ws.onclose=()=>{if(socket!==ws||leaving)return;clearTimeout(connectTimeout);net.connected=false;connecting=false;
   if(net.active){closeChat(false);ui.pause(true);status('Connection lost. Your spot is reserved for 90 seconds. Reconnecting…',true);drawRoster();retry=setTimeout(connect,Math.min(8000,1000*2**Math.min(attempt++,3)));}
   else{drawRoster();status('Could not connect. Try again shortly. The server may be unavailable or its daily free limit may have been reached.',true);}
  };
 }
 function requestRoom(){const name=$('driverName').value,error=IslaRules.validateName(name);if(error){status(error,true);$('driverName').setAttribute('aria-invalid','true');$('driverName').focus();return;}
  $('driverName').removeAttribute('aria-invalid');safeWrite(local,'isla-car-name-v2',name);identity=null;intent={type:'join',v:IslaRules.protocol,name};connect();
 }
 net.hit=(b,speed)=>{if(!net.connected)return;send({type:'state',state:pose()});send({type:'hit',id:b.id,speed});};
 net.rocketAction=action=>{if(net.connected){send({type:'state',state:pose()});send({type:'rocket',action});}};net.propLaunch=(kind,id)=>{if(net.connected){send({type:'state',state:pose()});send({type:'propLaunch',kind,id});}};
 net.treeHit=(t,dx,dz)=>{if(!net.connected)return;send({type:'state',state:pose()});send({type:'treeHit',id:t.treeId,dx,dz});};
 let lastTrafficHit=0;
 net.trafficHit=(t,nx,nz,speed)=>{if(net.connected&&performance.now()-lastTrafficHit>220){lastTrafficHit=performance.now();send({type:'state',state:pose()});send({type:'trafficHit',id:t.id,nx,nz,speed});}};
 net.rebuild=()=>ui.toast('Global maps refresh after everyone leaves.');
 net.tick=(dt,time)=>{
  if(!net.active)return;
  const now=performance.now(),alpha=1-Math.exp(-dt*13);
  if(net.connected&&now-lastSend>=(W.mapId==='playplace'?100:ui.paused()||document.hidden?5000:100)){lastSend=now;send({type:'state',state:pose()});}
  if(net.connected&&now-lastPing>=15000){lastPing=now;send({type:'ping',at:Date.now()});}
  if(net.connected&&pendingAura>0&&now-lastAura>=200){lastAura=now;const points=Math.min(25000,pendingAura);pendingAura-=points;send({type:'aura',seq:++scoreSeq,points});}
  for(const r of net.remotes.values()){
   const c=r.current,s=r.target,car=r.mesh,lag=Math.min(.1,(now-r.at)/1000);
   const snap=Math.hypot(s.x-c.x,s.y-c.y,s.z-c.z)>40;
   for(const k of ['x','y','z'])c[k]=snap?s[k]:W.mix(c[k],s[k]+(s.parked?0:(s[k==='x'?'vx':k==='y'?'vy':'vz']||0)*lag),alpha);
   c.yaw+=Math.atan2(Math.sin(s.yaw-c.yaw),Math.cos(s.yaw-c.yaw))*(snap?1:alpha);
   car.root.position.set(c.x,c.y,c.z);car.root.rotation.set(s.wallMode||s.roadMode?-s.pitch:0,c.yaw,s.roadMode?s.roll:0,'YXZ');car.body.rotation.set(s.wallMode||s.roadMode?0:-s.pitch,0,s.roadMode?0:s.roll);car.contact.visible=s.grounded&&!s.wallMode;
   car.nitro.group.visible=!!s.nitro&&r.connected&&s.water!=='sinking';car.nitro.light.intensity=car.nitro.group.visible?1.8:0;
   for(const jet of car.nitro.jets){jet.jet.scale.z=1.8+Math.sin(time*43)*.2;jet.material.uniforms.time.value=time;jet.material.uniforms.strength.value=1;jet.glow.material.opacity=.8;}
   for(const wheel of car.wheels){wheel.pivot.rotation.y=wheel.z>0?s.steer:0;wheel.spin.rotation.x+=s.speed*dt/(.36*car.size);}
   W.walk?.remote(r,dt,time);car.tail.emissiveIntensity=s.brake?3:.35;W.updateCarSpecialVisual?.(car,{...s,...c,waterMode:s.water},dt,time);
   if(s.water==='skimming'&&r.connected&&now-(r.sprayAt||0)>80){r.sprayAt=now;ui.spray({...s,...c});}
  }
  if(trafficTargets)W.traffic.forEach((t,i)=>{const a=trafficTargets[i];if(!a)return;const snap=Math.hypot(t.x-a[0],t.z-a[2])>30;for(const [j,k]of ['x','y','z'].entries())t[k]=snap?a[j]:W.mix(t[k],a[j],alpha);t.yaw+=Math.atan2(Math.sin(a[3]-t.yaw),Math.cos(a[3]-t.yaw))*alpha;[t.vx,t.vz,t.speed,t.distance]=a.slice(4,8);t.flightPitch=a[11]||0;t.wrecked=!!a[8];t.burning=!!a[9];t.wetTime=Math.max(t.wetTime||0,a[10]||0);});
 };
 W.initMultiplayer=hooks=>{
  ui=hooks;sessionKey='isla-global-v16-'+W.mapId+(W.mapId==='playplace'?'-r6':'')+'-'+(window.IslaCommunity?.account?.id||'guest');
  $('chatBtn').onclick=net.toggleChat;$('chatClose').onclick=()=>closeChat();drawChat();
  const previousEarn=W.onAuraEarn;W.onAuraEarn=(points,best)=>{previousEarn?.(points,best);if(net.connected&&!W.auraDisabled)pendingAura+=points;};
  $('driverName').value=window.IslaCommunity?.account?.username||safeRead(local,'isla-car-name-v2')||'';$('driverName').readOnly=!!window.IslaCommunity?.account;if(window.IslaCommunity?.account)$('nameRules').textContent='Playing as your signed-in account. Guests are labeled Guest.';
  $('roomBtn').onclick=$('friendsBtn').onclick=openRoom;$('roomClose').onclick=closeRoom;
  $('roomJoin').onclick=requestRoom;$('roomLeave').onclick=net.leave;
  $('roomCopy').onclick=async()=>{const url=new URL(location.href);url.pathname='/';url.search=W.customMap?'?map=custom&level='+encodeURIComponent(IslaCommunity.custom.info.id):W.mapId==='islands'?'':'?map='+W.mapId;url.hash='';try{await navigator.clipboard.writeText(url.href);status('Game link copied. Everyone joins the same global room.');}catch{status('Share the game address shown in your browser.');}};
  $('driverName').addEventListener('input',()=>{const error=IslaRules.validateName($('driverName').value);$('driverName').setAttribute('aria-invalid',error?'true':'false');status(error||'Name looks good. Ready to join.',!!error);});
  $('rooms').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target===$('driverName'))requestRoom();});
  try{const saved=JSON.parse(safeRead(session,sessionKey));if(saved?.token&&!IslaRules.validateName(saved?.name)&&location.protocol!=='file:'&&!new URLSearchParams(location.search).has('menu')){identity=saved;connect();}}catch{}
  // A low-rate parked update retains a quiet tab without 20 updates per second.
  setInterval(()=>{if(net.connected&&performance.now()-lastSend>5000){lastSend=performance.now();send({type:'state',state:pose()});}},5000);
  window.addEventListener('pagehide',()=>{leaving=true;socket?.close();});
  drawRoster();
 };
})();
