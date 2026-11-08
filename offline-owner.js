/* Owner controls and a local, chronological activity history. No network requests. */
(()=>{'use strict';
 const W=Isla,V=IslaV22,C=IslaCommunity,R=IslaOffline,g=W.garage,E=C.escape;
 const lock=Object.freeze(__OWNER_LOCK__),MAX=1e12;
 let opened=false,authenticated=false,authenticating=false,generation=0,suppress=0,panel=null,historyPanel=null,returnFocus=null,historyFocus=null;
 const model=id=>W.carModels.find(m=>m.id===id),money=n=>Number(n).toLocaleString('en-US');
 const short=n=>{for(const [size,label]of [[1e12,'t'],[1e9,'b'],[1e6,'m'],[1e3,'k']])if(n>=size&&n%size===0)return (n/size)+label;return money(n);};
 g.offlineHistory=Array.isArray(g.offlineHistory)?g.offlineHistory.filter(e=>e&&typeof e.message==='string'&&Number.isFinite(e.time)&&e.time>=0).map((e,i)=>({id:i+1,time:e.time,message:e.message.slice(0,600),category:String(e.category||'game').slice(0,30)})):[];
 const state=()=>({owned:[...g.owned],selected:g.selected,upgrades:{...g.upgrades},levels:{...g.levels}});
 let previous=state();
 function append(message,category='game'){g.offlineHistory.push({id:g.offlineHistory.length+1,time:Date.now(),message:String(message).slice(0,600),category});}
 const originalSave=g.save;
 g.save=()=>{
  if(!suppress){
   for(const id of g.owned)if(!previous.owned.includes(id))append('Bought '+(model(id)?.name||id)+'.','purchase');
   for(const id of g.owned){const before=previous.upgrades[id]||1,after=g.upgrades?.[id]||1;if(after>before)append('Bought '+(model(id)?.name||id)+' Upgrade Level '+after+'.','purchase');else if(previous.owned.includes(id)&&g.levels?.[id]!==previous.levels[id])append('Switched '+(model(id)?.name||id)+' to Upgrade Level '+g.levels[id]+'.','game');}
   if(g.selected!==previous.selected&&previous.owned.includes(g.selected))append('Selected '+(model(g.selected)?.name||g.selected)+'.','game');
  }
  originalSave();previous=state();
 };
 function record(message,category='game'){append(message,category);g.save();}
 function requireOwner(){if(!opened||!authenticated)throw Error('Enter the owner password first.');}
 function amount(value){const s=String(value).trim().replace(/[ ,]/g,'').toLowerCase();if(!/^\d+(?:\.\d+)?[kmbt]?$/.test(s))throw Error('Enter a positive whole amount, such as 800000 or 800k.');const suffix=s.slice(-1),n=Number(/[kmbt]/.test(suffix)?s.slice(0,-1):s)*({k:1e3,m:1e6,b:1e9,t:1e12}[suffix]||1);if(!Number.isSafeInteger(n)||n<1||n>MAX)throw Error('Use a whole amount between 1 and 1 trillion.');return n;}
 function refresh(){if(W.aura)W.aura.total=g.earned;W.refreshIscoinDisplay?.();const balance=document.getElementById('garageBalance');if(balance)balance.textContent=money(g.balance);const aura=document.getElementById('auraScore');if(aura)aura.textContent=money(g.balance);const lifetime=document.getElementById('auraWallet');if(lifetime)lifetime.textContent=money(g.earned)+' LIFETIME AURA';}
 function adjust(currency,direction,value){
  requireOwner();const fields={aura:['balance','available aura'],lifetime:['earned','lifetime aura'],iscoins:['iscoins','Iscoins']},entry=fields[currency];if(!entry||!['give','take'].includes(direction))throw Error('Choose a valid currency and action.');
  const requested=amount(value),[key,label]=entry,before=g[key],after=direction==='give'?Math.min(MAX,before+requested):Math.max(0,before-requested),changed=Math.abs(after-before);
  if(!changed)throw Error(direction==='give'?'This balance is already at its maximum.':'There is nothing to take away.');
  g[key]=after;record((direction==='give'?'Gave myself ':'Took away ')+short(changed)+' '+label+'. Balance: '+money(before)+' → '+money(after)+'.','owner');refresh();return {changed,before,after};
 }
 function setCar(id,unlock){
  requireOwner();const car=model(id);if(!car)throw Error('Choose a valid car.');const owned=g.owned.includes(id);
  if(unlock&&owned)throw Error('You already own this car.');if(!unlock&&!owned)throw Error('You do not own this car.');if(!unlock&&g.owned.length<=1)throw Error('Keep at least one car so you can still drive.');
  const selected=g.selected; suppress++;
  try{
   if(unlock){g.owned.push(id);g.upgrades[id]=1;g.levels[id]=1;}else{g.owned=g.owned.filter(x=>x!==id);delete g.upgrades[id];delete g.levels[id];if(g.selected===id)g.selected=g.owned[0];}
   append((unlock?'Unlocked ':'Took away ')+car.name+'.'+(!unlock?' Its upgrades were reset.':''),'owner');
   if(selected!==g.selected)append('Switched to '+model(g.selected).name+' because the selected car was removed.','owner');
   g.save();
  }finally{suppress--;}
  if(selected!==g.selected&&W.scene&&W.carMesh)W.changeCar(g.selected);
  refresh();return car;
 }
 function selectedCars(ids){requireOwner();if(!Array.isArray(ids)||!ids.length)throw Error('Select at least one car.');const cars=[...new Set(ids)].map(id=>model(id));if(cars.some(c=>!c))throw Error('Choose valid cars.');return cars;}
 function unlockCars(ids){const cars=selectedCars(ids),fresh=cars.filter(c=>!g.owned.includes(c.id));if(!fresh.length)throw Error('All selected cars are already unlocked.');suppress++;try{for(const c of fresh){g.owned.push(c.id);g.upgrades[c.id]=1;g.levels[c.id]=1;append('Unlocked '+c.name+'.','owner');}g.save();}finally{suppress--;}refresh();return fresh.map(c=>c.id);}
 function unlockLevels(ids,level){const cars=selectedCars(ids);if(![2,3].includes(level))throw Error('Choose Upgrade Level 2 or 3.');if(cars.some(c=>!g.owned.includes(c.id)))throw Error('Unlock the selected cars before granting upgrades.');const changed=cars.filter(c=>(g.upgrades[c.id]||1)<level);if(!changed.length)throw Error('These upgrade levels are already unlocked.');suppress++;try{for(const c of changed){g.upgrades[c.id]=level;append('Unlocked '+c.name+' through Upgrade Level '+level+'.','owner');}g.save();}finally{suppress--;}refresh();return changed.map(c=>c.id);}
 async function authenticate(password){
  if(!opened)throw Error('Open Owner Controls first.');if(authenticating)throw Error('A password check is already running.');
  if(typeof password!=='string'||password.length>512)throw Error('Enter the owner password.');
  if(!globalThis.crypto?.subtle)throw Error('Password checking needs a secure browser context. Open this file directly in a current browser, or use an HTTPS HTML viewer.');
  const turn=generation;authenticating=true;
  try{
   const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
   const salt=Uint8Array.from(lock.salt.match(/../g),s=>parseInt(s,16));
   const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:lock.iterations},key,256);
   const candidate=Array.from(new Uint8Array(bits),v=>v.toString(16).padStart(2,'0')).join('');let different=0;
   for(let i=0;i<lock.hash.length;i++)different|=candidate.charCodeAt(i)^lock.hash.charCodeAt(i);
   if(!opened||turn!==generation)return false;
   authenticated=different===0;record(authenticated?'Entered correct password.':'Entered incorrect password.','owner');return authenticated;
  }finally{password='';authenticating=false;}
 }
 function begin(){if(opened)return;opened=true;authenticated=false;generation++;record('Opened Owner Controls.','owner');}
 function close(reason=''){if(!opened)return;opened=false;authenticated=false;generation++;record('Exited Owner Controls.'+(reason?' '+reason:''),'owner');panel?.remove();panel=null;returnFocus?.focus();}
 function notice(){return R.temporary||!g.persistent?'This viewer cannot save permanently. Progress and history will be lost when it closes or refreshes.':'Changes and history save in this browser.';}
 function mount(title,kind){const root=document.createElement('div');root.className='owner-overlay';root.innerHTML='<section class="owner-panel" role="dialog" aria-modal="true" aria-labelledby="'+kind+'Title"><header><div><span class="owner-eyebrow">ISLA · OFFLINE</span><h2 id="'+kind+'Title">'+E(title)+'</h2></div><button type="button" class="owner-close" aria-label="Close '+E(title)+'">✕</button></header><div class="owner-content"></div></section>';document.body.append(root);return root;}
 function login(){
  const content=panel.querySelector('.owner-content');content.innerHTML='<p class="owner-lead">Enter your password to change this offline save.</p><form id="ownerLogin"><label for="ownerPassword">Owner password</label><input id="ownerPassword" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="512" required><p class="owner-error" role="alert"></p><button class="owner-primary" type="submit">Unlock controls</button></form><p class="owner-note">'+E(notice())+'</p>';
  const form=content.querySelector('form');form.onsubmit=async event=>{event.preventDefault();const input=form.querySelector('input'),button=form.querySelector('button'),error=form.querySelector('.owner-error');button.disabled=true;error.textContent='Checking…';let password=input.value;input.value='';try{const ok=await authenticate(password);password='';if(!panel)return;if(ok)controls();else{error.textContent='Incorrect password. This attempt was recorded.';input.focus();}}catch(err){error.textContent=err.message;}finally{password='';button.disabled=false;}};
  content.querySelector('input').focus();
 }
 function controls(status=''){
  if(!panel||!authenticated)return;
  const previousCurrency=panel.querySelector('#ownerCurrency select')?.value||'aura',previousCar=panel.querySelector('#ownerCar select')?.value||g.selected;
  const values=[['aura','Available Aura',g.balance],['iscoins','Iscoins',g.iscoins],['lifetime','Lifetime Aura',g.earned]];
  panel.querySelector('.owner-content').innerHTML='<p class="owner-lead">Your save. Your controls.</p><div class="owner-wallets">'+values.map(([,title,value])=>'<div><span>'+title+'</span><strong>'+money(value)+'</strong></div>').join('')+'</div><form id="ownerCurrency"><div class="owner-fields"><label>Balance<select name="currency">'+values.map(([id,title])=>'<option value="'+id+'">'+title+'</option>').join('')+'</select></label><label>Amount<input name="amount" type="text" inputmode="decimal" placeholder="800000 or 800k" required autocomplete="off"></label></div><div class="owner-buttons"><button type="submit" value="give" class="owner-primary">Give</button><button type="submit" value="take">Take away</button></div></form><p class="owner-note">Available Aura and lifetime Aura change independently.</p><hr><form id="ownerCar"><label>Car<select name="car">'+W.carModels.map(m=>'<option value="'+m.id+'">'+E(m.name)+' · '+(g.owned.includes(m.id)?'Owned':'Locked')+'</option>').join('')+'</select></label><div class="owner-buttons"><button type="submit" value="unlock" class="owner-primary">Unlock car</button><button type="submit" value="remove">Take away car</button></div></form><p class="owner-note">Removing a car resets its upgrades. You must keep at least one car.</p><p class="owner-error" role="alert"></p><p class="owner-success" role="status">'+E(status)+'</p><p class="owner-note">'+E(notice())+'</p><button type="button" class="owner-exit">Lock &amp; exit</button>';
  const content=panel.querySelector('.owner-content'),error=content.querySelector('.owner-error');
  content.querySelector('#ownerCurrency select').value=previousCurrency;content.querySelector('#ownerCar select').value=previousCar;
  content.querySelector('#ownerCurrency').onsubmit=e=>{e.preventDefault();try{const f=e.currentTarget,what=f.elements.currency.value,direction=e.submitter?.value||'give',result=adjust(what,direction,f.elements.amount.value);controls((direction==='give'?'Added ':'Removed ')+money(result.changed)+' '+(what==='iscoins'?'Iscoins':what==='aura'?'available Aura':'lifetime Aura')+'.');}catch(err){error.textContent=err.message;}};
  content.querySelector('#ownerCar').onsubmit=e=>{e.preventDefault();try{const unlock=(e.submitter?.value||'unlock')==='unlock',car=setCar(e.currentTarget.elements.car.value,unlock);controls((unlock?'Unlocked ':'Removed ')+car.name+'.');}catch(err){error.textContent=err.message;}};
  const bulk=document.createElement('form');bulk.id='ownerBulk';bulk.innerHTML='<hr><h3>Multiple cars &amp; upgrades</h3><div class="owner-buttons"><button type="button" data-select="all">Select all</button><button type="button" data-select="none">Clear selection</button></div><div class="owner-car-grid">'+W.carModels.map(m=>'<label><input type="checkbox" name="cars" value="'+m.id+'"><span>'+E(m.name)+'<small>'+(g.owned.includes(m.id)?'Owned · Level '+(g.upgrades[m.id]||1)+' unlocked':'Locked')+'</small></span></label>').join('')+'</div><label>Upgrade access<select name="level"><option value="2">Through Level 2</option><option value="3">Through Level 3</option></select></label><div class="owner-buttons"><button type="submit" value="cars" class="owner-primary">Unlock selected cars</button><button type="submit" value="levels">Unlock selected upgrades</button></div><p class="owner-note">No currency is spent. Choose your unlocked level in the garage. Each change appears in History.</p>';content.insertBefore(bulk,error);bulk.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>bulk.querySelectorAll('input[name="cars"]').forEach(c=>c.checked=b.dataset.select==='all'));bulk.onsubmit=e=>{e.preventDefault();try{const ids=[...bulk.querySelectorAll('input[name="cars"]:checked')].map(c=>c.value),upgrades=e.submitter?.value==='levels',changed=upgrades?unlockLevels(ids,Number(bulk.elements.level.value)):unlockCars(ids);controls('Unlocked '+(upgrades?'upgrade levels for ':'')+changed.length+' car'+(changed.length===1?'':'s')+'.');}catch(err){error.textContent=err.message;}};
  content.querySelector('.owner-exit').onclick=()=>close();content.querySelector('select').focus();
 }
 function open(){if(panel)return;returnFocus=document.activeElement;begin();panel=mount('Owner Controls','owner');panel.querySelector('.owner-close').onclick=()=>close();login();}
 function closeHistory(){historyPanel?.remove();historyPanel=null;historyFocus?.focus();}
 const date=value=>new Date(value).toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'});
 function relative(time){const s=Math.max(0,Math.floor((Date.now()-time)/1000)),[n,unit]=s<60?[s,'second']:s<3600?[Math.floor(s/60),'minute']:s<86400?[Math.floor(s/3600),'hour']:[Math.floor(s/86400),'day'];return n+' '+unit+(n===1?'':'s')+' ago';}
 function drawHistory(page=0,filter='all'){
  const entries=g.offlineHistory.filter(e=>filter==='all'||e.category===filter).slice().reverse(),pages=Math.max(1,Math.ceil(entries.length/50));page=Math.min(pages-1,Math.max(0,page));
  const content=historyPanel.querySelector('.owner-content');content.innerHTML='<p class="owner-lead">Major actions in this offline save. Newest first.</p><div class="history-toolbar"><label>Show<select id="historyFilter"><option value="all">All actions</option><option value="owner">Owner Controls</option><option value="purchase">Purchases</option></select></label><span>'+money(entries.length)+' actions</span></div><p class="owner-note">Times use this device’s clock and time zone. History starts with this update.</p><ol class="owner-history">'+entries.slice(page*50,page*50+50).map(e=>'<li><p>'+E(e.message)+'</p><time datetime="'+new Date(e.time).toISOString()+'">'+E(date(e.time))+'</time><small>'+E(relative(e.time))+'</small></li>').join('')+'</ol>'+(!entries.length?'<p>No recorded actions yet.</p>':'')+'<div class="history-pages"><button id="historyPrev" '+(page===0?'disabled':'')+'>Newer</button><span>Page '+(page+1)+' of '+pages+'</span><button id="historyNext" '+(page===pages-1?'disabled':'')+'>Older</button></div><p class="owner-note">'+E(notice())+'</p>';
  const select=content.querySelector('#historyFilter');select.value=filter;select.onchange=()=>drawHistory(0,select.value);content.querySelector('#historyPrev').onclick=()=>drawHistory(page-1,filter);content.querySelector('#historyNext').onclick=()=>drawHistory(page+1,filter);
 }
 function openHistory(){if(historyPanel)return;historyFocus=document.activeElement;historyPanel=mount('History','history');historyPanel.querySelector('.owner-close').onclick=closeHistory;drawHistory();historyPanel.querySelector('.owner-close').focus();}
 const menu=C.menu;C.menu=()=>{menu();const button=document.getElementById('ownerControlsBtn');if(button)button.onclick=open;};
 const historyButton=document.getElementById('historyBtn');if(historyButton)historyButton.onclick=openHistory;
 R.listen(document,'keydown',e=>{const top=historyPanel||panel;if(!top)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();historyPanel?closeHistory():close();return;}if(e.key==='Tab'){const items=[...top.querySelectorAll('button:not(:disabled),input,select')];if(!items.length)return;const current=items.indexOf(document.activeElement),next=e.shiftKey?(current<=0?items.length-1:current-1):(current+1)%items.length;e.preventDefault();e.stopImmediatePropagation();items[next].focus();return;}e.stopPropagation();},true);
 R.listen(document,'visibilitychange',()=>{if(document.hidden)close('Locked when the game was hidden.');});
 R.listen(window,'pagehide',()=>close('Game closed or reloaded.'));
 R.onCleanup(()=>{close('Changed screen.');closeHistory();});
 const api=C.api;C.api=async(...args)=>{const result=await api(...args);if(args[0]==='v224/vault'&&result.claimed)record('Claimed a vault reward: '+money(result.reward.amount)+' '+(result.reward.currency==='aura'?'Aura':'Iscoins')+'.','game');return result;};
 W.owner=Object.freeze({open,begin,close,authenticate,adjust,setCar,unlockCars,unlockLevels,openHistory,record,entries:()=>g.offlineHistory.map(e=>({...e}))});
})();
