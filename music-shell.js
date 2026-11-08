/* The game navigates inside this frame; the music remains in the same document. */
(()=>{'use strict';let frame;const S=window.IslaSoundtrack;
 S.gate.then(()=>{frame=document.createElement('iframe');frame.id='islaGame';frame.title='ISLA driving game';frame.allow='autoplay; fullscreen; clipboard-write';frame.allowFullscreen=true;frame.src='drive.html'+location.search+location.hash;frame.addEventListener('load',()=>{try{const u=new URL(frame.contentWindow.location.href);if(u.origin===location.origin)history.replaceState(null,'',location.pathname+u.search+u.hash);}catch{}});document.body.prepend(frame);});
 window.addEventListener('message',event=>{if(!frame||event.source!==frame.contentWindow||event.origin!==location.origin)return;const m=event.data;if(m?.type!=='isla-music')return;S.route(m.track);const b=document.getElementById('musicToggle');if(b)b.hidden=!!m.driving&&!m.track;});
})();
