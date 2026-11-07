/* Menu soundtrack and local listening preferences. */
(()=>{'use strict';
 const SETTINGS='isla-menu-music-v1',POSITION='isla-menu-energy-position-v1';
 const screens=new Set(['menu','maker','editor','search','map']);
 const read=(store,key,fallback)=>{try{return JSON.parse(store?.getItem(key))??fallback;}catch{return fallback;}};
 const write=(store,key,value)=>{try{store?.setItem(key,JSON.stringify(value));}catch{}};
 function create({audio,storage,session,contextFactory,onChange=()=>{}}){
  const saved=read(storage,SETTINGS,{}),resumeAt=read(session,POSITION,0);
  let enabled=saved.enabled!==false,volume=Number.isFinite(saved.volume)?Math.max(0,Math.min(1,saved.volume)):.35;
  let screen='',visible=true,pending=null,blocked=false,failed=false,context=null,gain=null,source=null;
  audio.loop=true;audio.preload='none';
  const wants=()=>enabled&&volume>0&&visible&&screens.has(screen);
  const state=()=>({enabled,volume,screen,visible,playing:!audio.paused,pending:!!pending,blocked,failed});
  const report=()=>onChange(state());
  const savePosition=()=>{if(audio.readyState>0&&Number.isFinite(audio.currentTime))write(session,POSITION,audio.currentTime);};
  function applyVolume(){if(gain)gain.gain.value=volume;else audio.volume=volume;}
  function sync(){
   if(!wants()){audio.pause();savePosition();report();return;}
   if(pending||!audio.paused){report();return;}
   failed=false;let play;
   try{play=audio.play();}catch(e){play=Promise.reject(e);}
   pending=Promise.resolve(play).then(()=>{blocked=false;if(!wants())audio.pause();},e=>{blocked=e?.name==='NotAllowedError';failed=!blocked;}).finally(()=>{pending=null;report();});
   report();
  }
  function unlock(){
   if(!wants())return;
   // A gain node makes the volume slider work on iOS, where media.volume may be ignored.
   if(!context&&contextFactory){try{context=contextFactory();source=context.createMediaElementSource(audio);gain=context.createGain();source.connect(gain);gain.connect(context.destination);audio.volume=1;applyVolume();}catch{context=null;gain=null;applyVolume();}}
   if(context?.state==='suspended')Promise.resolve(context.resume()).catch(()=>{});
   sync();
  }
  audio.addEventListener('loadedmetadata',()=>{const at=resumeAt;if(Number.isFinite(at)&&at>0&&Number.isFinite(audio.duration)&&audio.duration>0){try{audio.currentTime=at%audio.duration;}catch{}};});
  audio.addEventListener('error',()=>{failed=true;report();});
  audio.addEventListener('play',report);audio.addEventListener('pause',report);
  applyVolume();
  return {state,sync,unlock,savePosition,setScreen(value){screen=value;sync();},setVisible(value){visible=!!value;sync();},setEnabled(value){enabled=!!value;write(storage,SETTINGS,{enabled,volume});sync();},setVolume(value){if(!Number.isFinite(value))return;volume=Math.max(0,Math.min(1,value));applyVolume();write(storage,SETTINGS,{enabled,volume});sync();}};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={create};
 if(typeof document==='undefined')return;
 const audio=new Audio('elektronomia-energy.mp3');audio.id='menuSoundtrack';audio.hidden=true;document.body.append(audio);
 let storage,session;try{storage=localStorage;session=sessionStorage;}catch{}
 const button=document.createElement('button');button.type='button';button.className='menu-music-button';button.setAttribute('aria-label','Music settings and credits');button.setAttribute('aria-haspopup','dialog');button.title='Music settings and credits';
 const dialog=document.createElement('dialog');dialog.id='menuMusicDialog';dialog.className='menu-music-dialog';dialog.setAttribute('aria-labelledby','menuMusicTitle');
 dialog.innerHTML='<form method="dialog"><button class="music-close" aria-label="Close music settings">×</button></form><span class="music-eyebrow">ISLA SOUNDTRACK</span><h2 id="menuMusicTitle">Energy</h2><p class="music-artist">Elektronomia</p><button type="button" id="menuMusicToggle">Play music</button><label class="music-volume" for="menuMusicVolume">Music volume <output id="menuMusicLevel">35%</output><input id="menuMusicVolume" type="range" min="0" max="100" value="35"></label><p id="menuMusicStatus" role="status"></p><div class="music-credits"><p>Song: Elektronomia - Energy [NCS Release]<br>Music provided by NoCopyrightSounds</p><a href="https://ncs.io/energy" target="_blank" rel="noopener noreferrer">Free Download / Stream ↗</a><a href="https://youtu.be/fzNMd3Tu1Zw" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></div><p class="music-note">Plays in the main menu, Map Maker and Search. Pauses while driving or when this tab is hidden.</p>';
 document.body.append(dialog);
 const toggle=dialog.querySelector('#menuMusicToggle'),slider=dialog.querySelector('#menuMusicVolume'),level=dialog.querySelector('#menuMusicLevel'),status=dialog.querySelector('#menuMusicStatus');
 const controller=create({audio,storage,session,contextFactory:window.AudioContext||window.webkitAudioContext?()=>new (window.AudioContext||window.webkitAudioContext)():null,onChange:s=>{
  toggle.textContent=s.playing?'Pause music':s.pending?'Starting…':'Play music';toggle.setAttribute('aria-pressed',String(s.playing));slider.value=String(Math.round(s.volume*100));level.textContent=slider.value+'%';
  status.textContent=s.failed?'Music could not load. Tap Play music to retry.':s.blocked?'Tap Play music to start.':!s.enabled?'Music is off.':s.volume===0?'Music volume is muted.':s.playing?'Now playing · Energy':'Music resumes on supported screens.';
 }});
 button.addEventListener('click',()=>{dialog.showModal();controller.unlock();});
 toggle.addEventListener('click',()=>{const s=controller.state();const turnOn=!(s.playing||s.pending);if(turnOn&&s.volume===0)controller.setVolume(.35);controller.setEnabled(turnOn);controller.unlock();});
 slider.addEventListener('input',()=>{controller.setVolume(Number(slider.value)/100);controller.unlock();});
 dialog.addEventListener('keydown',e=>e.stopPropagation());
 const view=new URLSearchParams(location.search).get('view');
 let activeScreen='';
 function refresh(){
  const intro=document.getElementById('intro');
  const screen=view||(!document.body.classList.contains('playing')&&intro&&!intro.classList.contains('hidden')?'menu':'');
  const host=screen==='menu'?document.querySelector('.intro-card'):screen==='editor'?document.querySelector('.editor-tabs'):screens.has(screen)?document.querySelector('#cMain'):null;
  if(host&&button.parentElement!==host){if(screen==='editor')host.insertBefore(button,document.getElementById('edTest'));else if(screen==='menu')host.append(button);else host.prepend(button);}
  if(button.hidden!==!host)button.hidden=!host;
  const text=screen==='editor'?'♫':'♫ Music · Energy';if(button.textContent!==text)button.textContent=text;
  const nextScreen=host?screen:'';if(nextScreen!==activeScreen){activeScreen=nextScreen;controller.setScreen(nextScreen);if(!screens.has(nextScreen)&&dialog.open)dialog.close();}
 }
 new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
 document.addEventListener('pointerdown',()=>controller.unlock(),{passive:true});
 document.addEventListener('keydown',()=>controller.unlock());
 document.addEventListener('visibilitychange',()=>controller.setVisible(!document.hidden));
 window.addEventListener('pagehide',()=>{controller.savePosition();controller.setVisible(false);});
 window.addEventListener('pageshow',()=>controller.setVisible(!document.hidden));
 setInterval(()=>{if(controller.state().playing)controller.savePosition();},5000);
 refresh();controller.setVisible(!document.hidden);
})();
