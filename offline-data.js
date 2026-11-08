/* ISLA standalone: map saves stay in this browser; no server or account code. */
(()=>{'use strict';
 const C=window.IslaCommunity={online:false,ready:true},M=IslaMaker;
 C.query=window.IslaOffline?.query||new URLSearchParams(location.search);
 C.go=params=>window.IslaOffline.go(params);
 C.escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 C.init=async()=>{};C.installGarage=()=>{const earn=Isla.onAuraEarn;Isla.onAuraEarn=(points,best)=>{if(!Isla.customMap&&!C.custom&&!Isla.auraDisabled)earn?.(points,best);};};
 let database;
 C.db=()=>database||(database=new Promise((resolve,reject)=>{
  const r=indexedDB.open('isla-offline-map-maker-v233',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('maps',{keyPath:'id'});
  r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();window.IslaOffline?.onCleanup(()=>r.result.close());resolve(r.result);};
  r.onerror=()=>{database=null;reject(r.error||Error('Map storage is unavailable. Open this HTML in a browser that allows local storage.'));};
  r.onblocked=()=>{database=null;reject(Error('Close other copies of this game, then reopen Map Maker.'));};
 }));
 C.local=async(action,value)=>{let db;const runtime=window.IslaOffline;
  if(!runtime?.temporaryMaps)try{db=await C.db();}catch(error){if(!runtime||!['SecurityError','InvalidStateError','NotSupportedError'].includes(error.name))throw error;runtime.temporaryMaps=true;}
  if(runtime?.temporaryMaps){const store=runtime.maps,copy=runtime.clone;if(action==='getAll')return copy([...store.values()]);if(action==='get')return store.has(value)?copy(store.get(value)):undefined;if(action==='put'){store.set(value.id,copy(value));return value.id;}if(action==='delete')return store.delete(value);throw Error('Unknown map operation.');}
  return new Promise((resolve,reject)=>{
  const t=db.transaction('maps',['get','getAll'].includes(action)?'readonly':'readwrite'),s=t.objectStore('maps'),r=action==='getAll'?s.getAll():s[action](value);
  t.oncomplete=()=>resolve(r.result);t.onerror=t.onabort=()=>reject(Error('Could not save this map. Check the browser’s available storage.'));
 });};
 C.drafts=async()=>{const maps=await C.local('getAll'),kept=[];for(const m of maps){if(m.deleted&&Date.now()-m.deleted>5*86400000)await C.local('delete',m.id);else kept.push(m);}return kept;};
 C.draft=async id=>(await C.drafts()).find(m=>m.id===id);
 C.saveDraft=async m=>{
  const document=M.validate(m.document),maps=await C.drafts();
  if(!Number.isInteger(m.slot)||m.slot<0||m.slot>=50)throw Error('Choose one of the 50 map slots.');
  if(maps.some(v=>!v.deleted&&v.slot===m.slot&&v.id!==m.id))throw Error('That slot was filled in another tab. Open your maps again.');
  const record={id:m.id||'local-'+(window.IslaOffline?.uuid()||crypto.randomUUID()),name:String(m.name||'').slice(0,30),description:String(m.description||'').slice(0,150),preview:m.preview||'',slot:m.slot,kind:'original',document,updated:Date.now(),deleted:0};
  await C.local('put',record);return record;
 };
 C.removeDraft=async id=>{const m=await C.draft(id);if(!m)throw Error('Map not found.');m.deleted=Date.now();await C.local('put',m);};
 C.restoreDraft=async id=>{const maps=await C.drafts(),m=maps.find(v=>v.id===id);if(!m)throw Error('This map has expired.');const used=new Set(maps.filter(v=>!v.deleted).map(v=>v.slot));if(used.has(m.slot)){m.slot=Array.from({length:50},(_,i)=>i).find(i=>!used.has(i));if(m.slot===undefined)throw Error('Free a slot before restoring this map.');}m.deleted=0;await C.local('put',m);};
 C.renameDraft=async(m,name,description)=>{name=String(name||'').trim();description=String(description||'').trim();if(!name||name.length>30||description.length>150)throw Error('Use a name of 1–30 characters and a description of up to 150.');const current=await C.draft(m.id);if(!current||current.deleted)throw Error('Map not found.');await C.local('put',{...current,name,description,updated:Date.now()});};
})();
