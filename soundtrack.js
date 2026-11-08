/* A single persistent audio element: page changes never recreate the player. */
(()=>{'use strict';if(window.IslaSoundtrack)return;
 const sources=window.ISLA_MUSIC_SOURCES||{menu:'isla-project13.m4a',vault:'isla-project10.m4a'},player=new Audio(),positions={menu:0,vault:0};
 let current=null,wanted='menu',started=false,muted=false,blocked=false,revision=0,resolveGate;
 const gate=new Promise(resolve=>resolveGate=resolve);player.loop=true;player.preload='auto';player.volume=.45;
 try{muted=localStorage.getItem('isla-music-muted')==='1';}catch{}
 function syncControl(){const b=document.getElementById('musicToggle');if(b){b.textContent=blocked?'Enable music':muted?'Music: off':'Music: on';b.setAttribute('aria-pressed',String(!muted));}}
 function savePosition(){if(current&&Number.isFinite(player.currentTime))positions[current]=player.currentTime;}
 function play(){if(!started||!wanted||muted||document.hidden){player.pause();syncControl();return;}const turn=revision;const attempt=player.play();attempt?.then(()=>{if(turn===revision){blocked=false;syncControl();}}).catch(()=>{if(turn===revision){blocked=true;syncControl();}});}
 function route(track){track=['menu','vault'].includes(track)?track:null;wanted=track;if(!started)return;if(!track){savePosition();player.pause();return;}if(current!==track){savePosition();current=track;revision++;player.src=sources[track];const turn=revision;player.addEventListener('loadedmetadata',()=>{if(turn!==revision)return;try{player.currentTime=Math.min(positions[track],Math.max(0,player.duration-.1));}catch{}},{once:true});}play();}
 function start(){if(started)return gate;started=true;route(wanted);resolveGate();document.getElementById('islaStartGate')?.remove();document.body.classList.remove('awaiting-start');mountControl();return gate;}
 function toggle(){if(blocked){blocked=false;muted=false;}else muted=!muted;try{localStorage.setItem('isla-music-muted',muted?'1':'0');}catch{}play();syncControl();}
 function mountControl(){const existing=document.getElementById('musicToggle');if(existing){existing.onclick=toggle;syncControl();return;}const b=document.createElement('button');b.id='musicToggle';b.type='button';b.onclick=toggle;b.className='isla-music-toggle';document.body.append(b);syncControl();}
 function showStart(){if(started){mountControl();return;}document.body.classList.add('awaiting-start');const gateEl=document.createElement('section');gateEl.id='islaStartGate';gateEl.innerHTML='<div><p class="start-kicker">CADO CODES PRESENTS</p><h1>ISLA<span>V2.4</span></h1><p>Drive without limits.</p><button type="button" id="islaBegin">Start</button><small>Original music by Cado Codes</small></div>';document.body.append(gateEl);document.getElementById('islaBegin').onclick=start;}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){savePosition();player.pause();}else play();});
 window.IslaSoundtrack={gate,start,route,mountControl,showStart,toggle,get state(){return {started,current,wanted,muted,blocked,time:player.currentTime,loop:player.loop};}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',showStart,{once:true});else showStart();
})();
