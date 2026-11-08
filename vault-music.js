/* Project 10 starts from the vault-entry click; the main game needs no audio gate. */
(()=>{'use strict';
 window.IslaVaultMusic=button=>{
  const song=new Audio(window.ISLA_VAULT_MUSIC_SRC||'isla-project10.m4a');song.loop=true;song.preload='none';song.volume=.45;
  let active=false,muted=false,blocked=false,revision=0,destroyed=false;
  try{muted=localStorage.getItem('isla-music-muted')==='1';}catch{}
  function label(){button.textContent=blocked?'Enable music':muted?'Music: off':'Music: on';button.setAttribute('aria-pressed',String(!muted));}
  function play(){if(destroyed)return;if(!active||muted||document.hidden){song.pause();label();return;}const turn=++revision;const attempt=song.play();attempt?.then(()=>{if(destroyed||!active||muted||document.hidden)song.pause();if(turn===revision){blocked=false;label();}}).catch(()=>{if(turn===revision&&active){blocked=true;label();}});}
  function close(){active=false;revision++;song.pause();}
  function toggle(){if(blocked){blocked=false;muted=false;}else muted=!muted;try{localStorage.setItem('isla-music-muted',muted?'1':'0');}catch{}play();label();}
  function visibility(){if(document.hidden){revision++;song.pause();}else play();}
  function destroy(){close();destroyed=true;document.removeEventListener('visibilitychange',visibility);song.removeAttribute('src');song.load();}
  button.onclick=toggle;document.addEventListener('visibilitychange',visibility);label();
  return {open(){active=true;play();},close,destroy};
 };
})();
