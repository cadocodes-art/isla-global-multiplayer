
/* Standalone lifecycle: no requests, no parent-frame access, no sandbox changes. */
(()=>{'use strict';
 const R=window.IslaOffline={query:new URLSearchParams(location.search),maps:new Map(),temporaryMaps:false};
 R.mobile=!!(navigator.maxTouchPoints>0||matchMedia('(pointer: coarse)').matches);
 R.clone=value=>JSON.parse(JSON.stringify(value));
 if(!window.structuredClone)window.structuredClone=R.clone;
 if(!Array.prototype.at)Object.defineProperty(Array.prototype,'at',{value:function(index){index=Math.trunc(index)||0;return this[index<0?this.length+index:index];},configurable:true,writable:true});
 R.uuid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
 function storage(name){const memory=new Map();let disk;try{disk=window[name];const key='isla-offline-check';disk.setItem(key,'1');disk.removeItem(key);}catch{disk=null;}
  if(name==='localStorage')R.temporary=!disk;
  return {getItem(key){try{const value=disk?.getItem('isla-offline-v233:'+key);if(value!=null){memory.set(key,value);return value;}}catch{}return memory.get(key)??null;},setItem(key,value){memory.set(key,String(value));try{disk?.setItem('isla-offline-v233:'+key,String(value));}catch{if(name==='localStorage')R.temporary=true;}},removeItem(key){memory.delete(key);try{disk?.removeItem('isla-offline-v233:'+key);}catch{}}};
 }
 R.storage=storage('localStorage');R.session=storage('sessionStorage');
 R.readSource=node=>{const damaged=()=>{const error=Error('The copied code for '+node.dataset.islaSource+' changed or is incomplete. Use Import from file with the updated HTML');error.code='ISLA_COPY_DAMAGED';return error;};
  const encoded=node.textContent.replace(/\s/g,'');if(node.dataset.encoding!=='base64'||encoded.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw damaged();
  let bytes;try{const binary=atob(encoded);bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));}catch{throw damaged();}
  let checksum=2166136261;for(const byte of bytes)checksum=Math.imul(checksum^byte,16777619);
  if(bytes.length!==Number(node.dataset.bytes)||(checksum>>>0).toString(16).padStart(8,'0')!==node.dataset.checksum)throw damaged();
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 };
 let frames=new Set(),timers=new Set(),intervals=new Set(),cleanups=[],scenes=[],renderers=[],generation=0,template,modules,loading=false;
 R.frame=fn=>{const g=generation,id=requestAnimationFrame(t=>{frames.delete(id);if(g===generation)fn(t);});frames.add(id);return id;};
 R.later=(fn,ms)=>{const g=generation,id=setTimeout(()=>{timers.delete(id);if(g===generation)fn();},ms);timers.add(id);return id;};
 R.every=(fn,ms)=>{const id=setInterval(fn,ms);intervals.add(id);return id;};
 R.yield=()=>new Promise(resolve=>R.later(resolve,20));
 R.onCleanup=fn=>cleanups.push(fn);
 R.listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);R.onCleanup(()=>target.removeEventListener(type,fn,options));};
 R.ResizeObserver=class{constructor(fn){this.observer=new ResizeObserver(fn);R.onCleanup(()=>this.observer.disconnect());}observe(node){this.observer.observe(node);}};
 R.scene=scene=>(scenes.push(scene),scene);
 R.audio=ctx=>(R.onCleanup(()=>ctx.close().catch(()=>{})),ctx);
 R.renderer=renderer=>{renderers.push(renderer);R.listen(renderer.domElement,'webglcontextlost',event=>{event.preventDefault();R.fail(Error('The browser ran out of graphics resources. Close other game tabs, then try again.'));});return renderer;};
 R.cleanup=()=>{generation++;frames.forEach(cancelAnimationFrame);timers.forEach(clearTimeout);intervals.forEach(clearInterval);frames.clear();timers.clear();intervals.clear();cleanups.splice(0).forEach(fn=>{try{fn();}catch{}});
  const disposed=new Set(),dispose=value=>{if(value?.dispose&&!disposed.has(value)){disposed.add(value);value.dispose();}};
  for(const scene of scenes){scene.traverse(object=>{dispose(object.geometry);for(const material of [].concat(object.material||[])){for(const value of Object.values(material))if(value?.isTexture)dispose(value);for(const uniform of Object.values(material.uniforms||{}))if(uniform?.value?.isTexture)dispose(uniform.value);dispose(material);}dispose(object.shadow?.map);});scene.clear();}
  scenes=[];renderers.splice(0).forEach(renderer=>{renderer.dispose();renderer.forceContextLoss();});
 };
 R.fail=error=>{const fatal=document.getElementById('fatal'),label=document.getElementById('errorText');if(!fatal||!label)return;loading=false;R.cleanup();document.body.classList.remove('community-mode');document.getElementById('loading')?.classList.add('hidden');let advice=error?.code==='ISLA_COPY_DAMAGED'?'':error?.name==='SyntaxError'?' The embedded code passed its integrity check. Please report this message and your iPadOS version.':' Try again. If this is a graphics error, close other game tabs first.';label.textContent='ISLA could not finish '+(R.stage||'starting')+': '+(error?.message||String(error))+'.'+advice+' [V2.38 offline]';const retry=fatal.querySelector('button');if(retry&&!template){retry.disabled=true;retry.textContent='IMPORT THE UPDATED HTML FILE';}fatal.classList.remove('hidden');};
 window.addEventListener('error',event=>{if(loading)R.fail(event.error||Error(event.message));});
 window.addEventListener('unhandledrejection',event=>{if(loading)R.fail(event.reason);});
 R.replaceQuery=params=>{R.query=new URLSearchParams(params);if(['file:','http:','https:'].includes(location.protocol))try{const url=new URL(location.href);url.search=R.query.toString();history.replaceState(null,'',url.href);}catch{}return R.query;};
 R.go=async params=>{R.replaceQuery(params);await boot();};
 R.retry=()=>{if(modules&&template)return R.go(R.query);};
 async function boot(){R.cleanup();const run=generation;loading=true;window.islaDiagnostics=null;window.IslaMapId=R.query.get('map')||'islands';document.body.className='';document.body.innerHTML=template;
  try{for(const item of modules){if(run!==generation)return;R.stage='loading '+item.name;document.getElementById('loadText').textContent=item.name==='game.js'?'Starting the engine…':'Preparing the game…';if(item.name!=='three.min.js'||!window.THREE)await item.run();await R.yield();}if(run===generation)loading=false;}catch(error){if(run===generation)R.fail(error);}
 }
 async function start(){try{const sources=[...document.querySelectorAll('script[type="application/x-isla"]')];if(sources.length!==__MODULE_COUNT__)throw Error('The pasted code is incomplete. Use Import from file to load ISLA-V2.38-Offline.html');
   modules=sources.map(node=>{const name=node.dataset.islaSource;R.stage='reading '+name;const source=R.readSource(node),code=name==='game.js'?source.replace('(async()=>{','return (async()=>{'):source;return {name,run:new Function(code+'\n//# sourceURL=isla-offline/'+name)};});sources.forEach(node=>node.remove());template=document.body.innerHTML;boot();
  }catch(error){R.fail(error);}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

