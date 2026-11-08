'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=__dirname,source=path.resolve(root,'../public'),read=n=>fs.readFileSync(path.join(source,n),'utf8');
function replace(s,a,b){if(!s.includes(a))throw Error('Missing adaptation: '+a.slice(0,100));return s.replace(a,b);}
const skip=new Set(['community-api.js','community-ui.js','social-rules.js','social-ui.js','notifications.js','v23-leaderboard-ui.js','multiplayer.js']);
let html=read('index.html'),names=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
names=names.flatMap(n=>n==='community-api.js'?['local-data.js']:n==='community-ui.js'?['local-ui.js','local-extras.js']:n==='multiplayer.js'?['solo.js']:skip.has(n)?[]:[n]);
names.splice(names.indexOf('game.js'),0,'local-owner.js');
const aliases='const localStorage=IslaOffline.storage,sessionStorage=IslaOffline.session,requestAnimationFrame=IslaOffline.frame,setTimeout=IslaOffline.later,setInterval=IslaOffline.every,ResizeObserver=IslaOffline.ResizeObserver;\n';
const compiled={};
for(const name of names){let s=fs.existsSync(path.join(root,name))?fs.readFileSync(path.join(root,name),'utf8'):read(name);
 if(name!=='three.min.js'){
  s=s.replaceAll('window.localStorage','IslaOffline.storage').replaceAll('window.sessionStorage','IslaOffline.session').replaceAll('crypto.randomUUID()','IslaOffline.uuid()');
  s=s.replaceAll('window.addEventListener(','IslaOffline.listen(window,').replaceAll('document.addEventListener(','IslaOffline.listen(document,');
  s=s.replaceAll('new T.Scene()','IslaOffline.scene(new T.Scene())');
  s=aliases+s;
 }
 if(name==='maps.js')s=replace(s,"const go=map=>{const url=new URL(location.href);url.searchParams.set('map',map);url.searchParams.set('menu','1');location.assign(url.href);};","const go=map=>IslaOffline.go({map,menu:1});");
 if(name==='garage.js'){
  s=replace(s,"'buildingHistory','coinHistory'","'buildingHistory','coinHistory','offlineVaultClaims','offlineHistory'");
  s=replace(s,'coinHistory:g.coinHistory,','coinHistory:g.coinHistory,offlineVaultClaims:g.offlineVaultClaims,offlineHistory:g.offlineHistory,');
  s=replace(s,"owned:[...new Set(['classic',...(Array.isArray(saved?.owned)?saved.owned.filter(id=>known.has(id)):[])])]","owned:[...new Set(Array.isArray(saved?.owned)&&saved.owned.some(id=>known.has(id))?saved.owned.filter(id=>known.has(id)):['classic'])]");
  s=replace(s,'if(g.owned.includes(saved?.selected))g.selected=saved.selected;g.earned=Math.max(g.earned,g.balance);','g.selected=g.owned.includes(saved?.selected)?saved.selected:g.owned[0];');
  const legacyStart=s.indexOf(' // Explicit online playtest link:'),legacyEnd=s.indexOf(' W.getCarSpec=',legacyStart);
  if(legacyStart<0||legacyEnd<0)throw Error('Legacy online wallet adapter missing');
  s=s.slice(0,legacyStart)+s.slice(legacyEnd);
 }
 if(name==='local-owner.js')s=replace(s,'__OWNER_LOCK__',fs.readFileSync(path.join(root,'owner-lock.json'),'utf8'));
 if(name==='aura.js')s=replace(s,'const award=(label,base,detail,rewardScale=1)=>{','const award=(label,base,detail,rewardScale=1)=>{if(W.auraDisabled)return;');
 if(name==='custom-map.js'){s=replace(s,'W.auraDisabled=!info.approved;','W.auraDisabled=true;');s=s.replace('PRACTICE · NO AURA','PRACTICE · NO AURA OR ISCOINS').replace('Practice · No aura','Practice · No Aura or Iscoins');}
 if(name==='v22-economy-client.js')s=replace(s,"(!C.custom||!!C.custom.info?.approved)","(!C.custom||!!C.custom.info?.approved)");
 if(name==='map-editor.js'){
  s=replace(s,'new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})','IslaOffline.renderer(new T.WebGLRenderer({antialias:!IslaOffline.mobile,preserveDrawingBuffer:true}))');
  s=replace(s,"function historyReplace(){const u=new URL(location.href);u.searchParams.set('id',record.id);u.searchParams.delete('template');u.searchParams.delete('size');u.searchParams.delete('slot');window.history.replaceState({},'',u);C.query=new URLSearchParams(u.search);}","function historyReplace(){C.query=IslaOffline.replaceQuery({view:'editor',id:record.id});}");
 }
 if(name==='v224-vault.js'){
  const begin=s.indexOf('   if(!C.account){'),end=s.indexOf('   await C.flush',begin);if(begin<0||end<0)throw Error('Vault adapter missing');s=s.slice(0,begin)+s.slice(end);
  s=s.replaceAll('once on your account','once in this offline save').replaceAll('added to your account.','added to your offline save.');
 }
 if(name==='game.js'){
  s=replace(s,"new T.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'})","IslaOffline.renderer(new T.WebGLRenderer({canvas:$('world'),antialias:!IslaOffline.mobile,powerPreference:IslaOffline.mobile?'default':'high-performance'}))");
  s=replace(s,'new (window.AudioContext||window.webkitAudioContext)()','IslaOffline.audio(new (window.AudioContext||window.webkitAudioContext)())');
  s=replace(s,"setQuality('balanced');","setQuality(IslaOffline.mobile?'low':'balanced');");
  s=replace(s,'renderer.compile(scene,camera);','if(!IslaOffline.mobile)renderer.compile(scene,camera);');
  s=replace(s,"}catch(err){console.error(err);$('loading').classList.add('hidden');$('errorText').textContent='The 3D engine could not start: '+err.message+'. Try Chrome or Edge with graphics acceleration enabled.';$('fatal').classList.remove('hidden');}",'}catch(err){throw err;}');
 }
 new vm.Script(s,{filename:name});compiled[name]=s;
}
const vaultMusic='data:audio/mp4;base64,'+fs.readFileSync(path.join(source,'isla-project10.m4a')).toString('base64');
html=html.replace('</head>','<script>window.ISLA_VAULT_MUSIC_SRC='+JSON.stringify(vaultMusic)+';</script></head>');
let runtime=fs.readFileSync(path.join(root,'viewer-runtime.js'),'utf8').replace('__MODULE_COUNT__',names.length);
new vm.Script(runtime);
html=html.replace(/<script src="([^"]+)"><\/script>/g,'');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,n)=>'<style data-isla-source="'+n+'">'+read(n)+'</style>');
html=html.replace('V2.38</span>','V2.38 · OFFLINE</span>').replace('Version 2.38"','Version 2.38 offline"');
html=html.replace('ISLA / Drive without limits','ISLA V2.38 / Offline edition');
html=replace(html,'onclick="location.reload()"','onclick="IslaOffline.retry()"');
html=replace(html,'GLOBAL ROOM</button><button id="chatBtn"','OFFLINE INFO</button><button id="chatBtn"');
html=replace(html,'<div class="intro-specs"','<div class="community-menu-buttons offline-menu"><button id="makerBtn">Map Maker <span>✎</span></button><button id="offlineInfoBtn">Offline edition <span>ⓘ</span></button></div><div class="intro-specs"');
html=replace(html,'<div class="intro-specs"','<button id="ownerControlsBtn" class="owner-menu-button">Owner Controls <span>⌑</span></button><div class="intro-specs"');
html=replace(html,'<button id="fullscreenBtn">Fullscreen</button>','<button id="fullscreenBtn">Fullscreen</button><button id="historyBtn">History</button>');
html=html.replace('T opens quick chat in the global room. Choose from 30 messages.','Offline edition: multiplayer, accounts and community features are available in the online game.');
const csp="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; worker-src blob:; base-uri 'none'; form-action 'none';";
html=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+csp+'">');
html=html.replace('</head>','<style>#friendsBtn,#chatBtn{display:none!important}.offline-menu{grid-template-columns:1fr 1fr}.offline-viewer-note{font-size:11px;line-height:1.5;color:#e0e9df}.menu-version{max-width:180px}</style><script data-isla-runtime="viewer-runtime.js">'+runtime+'</script></head>');
html=html.replace('</head>','<style>'+fs.readFileSync(path.join(root,'local-owner.css'),'utf8')+'</style></head>');
const checksum=bytes=>{let h=2166136261;for(const b of bytes)h=Math.imul(h^b,16777619);return (h>>>0).toString(16).padStart(8,'0');};
const scripts=names.map(n=>{const bytes=Buffer.from(compiled[n]);return '<script type="application/x-isla" data-isla-source="'+n+'" data-encoding="base64" data-bytes="'+bytes.length+'" data-checksum="'+checksum(bytes)+'">\n'+bytes.toString('base64').match(/.{1,120}/g).join('\n')+'\n</script>';}).join('\n');
html=html.replace('</body>',scripts+'\n</body>');
html=html.replace('<!doctype html>','<!doctype html>\n<!-- ISLA V2.38 standalone. All game code and assets included.\nThree.js license:\n'+read('THREE-LICENSE.txt').replaceAll('--','—')+'\n-->');
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/index.html'),html);fs.writeFileSync(path.join(root,'ISLA-V2.38-Offline.html'),html);fs.writeFileSync(path.join(root,'compiled.json'),JSON.stringify(compiled));
console.log(JSON.stringify({modules:names.length,bytes:Buffer.byteLength(html),file:path.join(root,'ISLA-V2.38-Offline.html')}));
