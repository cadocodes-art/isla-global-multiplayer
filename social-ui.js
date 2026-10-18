(()=>{'use strict';
 const C=IslaCommunity,E=C.escape,R=IslaSocialRules;
 const date=t=>new Date(t).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
 function bind(root,selector,fn){root.querySelectorAll(selector).forEach(b=>b.onclick=async()=>{b.disabled=true;try{await fn(b);}catch(e){C.toast(e.message,true);}finally{b.disabled=false;}});}
 function profileLinks(root){bind(root,'[data-person]',b=>C.go({view:'profile',id:b.dataset.person}));}
 function timer(root,fn){let busy=false;const t=setInterval(async()=>{if(!root.isConnected){clearInterval(t);return;}if(document.hidden||busy)return;busy=true;try{await fn();}catch{}finally{busy=false;}},5000);window.addEventListener('pagehide',()=>clearInterval(t),{once:true});}
 function count(input,el,max){const update=()=>{el.textContent=input.value.length+' / '+max;};input.addEventListener('input',update);update();}
 function report(kind,id){return C.modal('What best describes the reason of you reporting this '+(kind==='message'?'message':'post')+'?',`<label>Reason<select id="sReason">${R.messageReasons.map(x=>`<option>${E(x)}</option>`).join('')}</select></label><label>Tell us more<textarea id="sDetail" maxlength="300" rows="3" placeholder="Required for Other."></textarea></label><p class="c-note">The owner will receive this ${kind} and your report for review.</p>`,[{label:'Send report',primary:true,read:async el=>{await C.api('social/report',{kind,id,reason:el.querySelector('#sReason').value,detail:el.querySelector('#sDetail').value});C.toast('Report sent to the game owner.');return true;}},{label:'Cancel',value:false}]);}
 async function act(id,action){await C.api('social/friend',{id,action});}
 function connectionHTML(status,id){
  const b=(action,label)=>`<button data-friend="${action}" data-id="${E(id)}">${label}</button>`;
  if(status==='blocked')return `<span>You blocked this driver.</span><button data-block="false" data-id="${E(id)}">Unblock</button>`;
  if(status==='unavailable')return '<span>This connection is unavailable.</span>';
  return (status==='friends'?`<button class="c-primary" data-chat="${E(id)}">Message ↗</button>${b('unfriend','Unfriend')}`:status==='outgoing'?`<span>Friend request sent</span>${b('cancel','Cancel request')}`:status==='incoming'?`<span>Wants to be your friend</span>${b('accept','Accept request')}${b('decline','Decline')}`:b('request','Add friend +'))+`<button data-block="true" data-id="${E(id)}">Block</button>`;
 }
 function bindConnections(root,refresh){
  bind(root,'[data-friend]',async b=>{if(b.dataset.friend==='unfriend'&&!await C.confirm('Unfriend this driver? New messages will stop until you become friends again.'))return;await act(b.dataset.id,b.dataset.friend);await refresh();});
  bind(root,'[data-block]',async b=>{const block=b.dataset.block==='true';if(block&&!await C.confirm('Block this driver? Their friend requests and new messages will stop. You can still report old messages.'))return;await C.api('social/block',{id:b.dataset.id,block});await refresh();});
  bind(root,'[data-chat]',b=>C.go({view:'messages',id:b.dataset.chat}));profileLinks(root);
 }
 C.updateSocialBadge=async button=>{if(!C.online||!C.account)return;try{const d=await C.api('social/inbox'),n=d.incoming.length+d.conversations.reduce((n,c)=>n+c.unread,0);if(button.isConnected)button.textContent='Friends & messages'+(n?' · '+n:'');}catch{}};
 C.mountProfileSocial=async(main,a,own)=>{
  const box=document.createElement('section');box.className='s-profile';main.querySelector('.c-profile-hero').after(box);let page=0;
  async function load(){
   const d=await C.api('social/posts?'+new URLSearchParams({id:a.id,page}));if(!box.isConnected)return;
   box.innerHTML=`<div class="s-profile-heading"><div><span class="c-kicker">FROM THE DRIVER’S SEAT</span><h2>Updates.</h2></div>${own?'<button id="sMyFriends">Friends &amp; messages ↗</button>':''}</div>${!own&&C.account?`<div class="s-connections">${connectionHTML(d.relationship.status,a.id)}</div>`:''}${own?`<form class="s-post-form"><label for="sPost">What’s new?</label><textarea id="sPost" maxlength="150" rows="3" required placeholder="Just reached 800k aura!"></textarea><div class="s-compose-footer"><span id="sPostCount"></span><button class="c-primary">Post update ↗</button></div><p class="c-note">Public on your profile · Profanity is censored · One post every 20 seconds</p><p class="s-error" role="alert"></p></form>`:''}<div class="s-posts">${d.posts.map(p=>`<article class="s-post"><div class="s-post-top"><strong>${E(a.username)}</strong><time>${date(p.at)}</time></div><p>${E(p.text)}</p><div class="s-post-actions">${own?`<span>♡ ${p.likes} ${p.likes===1?'like':'likes'}</span><button data-delete-post="${E(p.id)}">Delete</button>`:`<button data-like-post="${E(p.id)}" data-liked="${p.liked}" aria-pressed="${p.liked}">${p.liked?'♥ Liked':'♡ Like'} · ${p.likes}</button>${C.account?`<button data-report-post="${E(p.id)}">Report</button>`:''}`}</div></article>`).join('')||'<div class="s-empty">'+(d.relationship.status==='blocked'||d.relationship.status==='unavailable'?'Posts are unavailable for this connection.':'No updates yet. The next milestone is yours.')+'</div>'}</div><div class="c-pages"><button id="sNewer" ${!page?'disabled':''}>← Newer</button><span>Page ${page+1}</span><button id="sOlder" ${!d.more?'disabled':''}>Older →</button></div>`;
   bindConnections(box,load);
   bind(box,'#sMyFriends',()=>C.go({view:'friends'}));
   bind(box,'#sNewer',()=>{page--;return load();});bind(box,'#sOlder',()=>{page++;return load();});
   bind(box,'[data-like-post]',async b=>{if(!C.account){C.go({view:'account'});return;}await C.api('social/post/like',{id:b.dataset.likePost,like:b.dataset.liked!=='true'});await load();});
   bind(box,'[data-report-post]',b=>report('post',b.dataset.reportPost));
   bind(box,'[data-delete-post]',async b=>{if(await C.confirm('Delete this update from your profile?')){await C.api('social/post/delete',{id:b.dataset.deletePost});await load();}});
   const form=box.querySelector('form');if(form){const input=box.querySelector('#sPost');count(input,box.querySelector('#sPostCount'),150);form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;try{await C.api('social/post',{text:input.value});page=0;await load();C.toast('Update posted.');}catch(err){form.querySelector('.s-error').textContent=err.message;}finally{button.disabled=false;}};}
  }
  await load();
 };
 C.openSocialView=async(main,view)=>{
  main.classList.add('s-main');if(view==='messages'&&C.query.get('id'))return conversation(main,C.query.get('id'));
  main.innerHTML=`<section class="c-hero"><span class="c-kicker">V1.8 / YOUR PEOPLE</span><h1>Good company.<br>Better drives.</h1><p>Find a creator, send a request, and keep the conversation going.</p></section><div class="s-top-actions"><button class="c-primary" id="sFind">Find drivers ↗</button><button id="sMyProfile">Post an update</button><span id="sInboxStatus" role="status">Checking messages…</span></div><div id="sInbox"></div>`;
  bind(main,'#sFind',()=>C.go({view:'search'}));bind(main,'#sMyProfile',()=>C.go({view:'profile',id:C.account.id}));
  const box=main.querySelector('#sInbox');let signature='';
  async function refresh(){const d=await C.api('social/inbox');if(!box.isConnected)return;main.querySelector('#sInboxStatus').textContent='Updates automatically';const json=JSON.stringify(d);if(signature===json)return;signature=json;
   const user=(u,actions)=>`<article class="s-person"><button class="s-person-name" data-person="${E(u.id)}"><span class="s-avatar">${E(u.username[0].toUpperCase())}</span><strong>${E(u.username)}</strong></button><div class="s-person-actions">${actions}</div></article>`;
   box.innerHTML=`<div class="s-inbox-layout"><div><section class="s-section"><h2>Conversations <small>${d.conversations.length}</small></h2>${d.conversations.map(c=>`<button class="s-conversation" data-chat="${E(c.id)}"><span class="s-avatar">${E(c.username[0].toUpperCase())}</span><span><strong>${E(c.username)}</strong><span class="s-snippet">${c.last.sender===C.account.id?'You: ':''}${E(c.last.text)}</span></span><span class="s-conversation-meta"><time>${date(c.last.at)}</time>${c.unread?`<b class="s-badge">${c.unread}</b>`:''}</span></button>`).join('')||'<p class="s-empty">Once a friend accepts, you can message each other here.</p>'}</section><section class="s-section"><h2>Friends <small>${d.friends.length}</small></h2>${d.friends.map(u=>user(u,`<button data-chat="${E(u.id)}">Message ↗</button>`)).join('')||'<p class="s-empty">Your next driving buddy is one request away.</p>'}</section></div><aside><section class="s-section"><h2>Requests <small>${d.incoming.length}</small></h2>${d.incoming.map(u=>user(u,`<button class="c-primary" data-friend="accept" data-id="${E(u.id)}">Accept</button><button data-friend="decline" data-id="${E(u.id)}">Decline</button>`)).join('')||'<p class="s-empty">You’re all caught up.</p>'}</section><section class="s-section"><h3>Sent requests</h3>${d.outgoing.map(u=>user(u,`<button data-friend="cancel" data-id="${E(u.id)}">Cancel</button>`)).join('')||'<p class="s-empty">No pending requests.</p>'}</section><details class="s-section"><summary>Blocked drivers · ${d.blocks.length}</summary>${d.blocks.map(u=>user(u,`<button data-block="false" data-id="${E(u.id)}">Unblock</button>`)).join('')||'<p class="s-empty">Nobody blocked.</p>'}</details></aside></div>`;
   bindConnections(box,refresh);
  }
  await refresh();timer(box,async()=>{try{await refresh();}catch(e){main.querySelector('#sInboxStatus').textContent='Connection lost. Retrying…';}});
 };
 async function conversation(main,id){
  main.classList.add('s-chat-main');main.innerHTML=`<section class="s-chat"><header class="s-chat-header"><button id="sBack" aria-label="Back to friends">←</button><div><button id="sChatProfile">Conversation</button><span id="sChatState" role="status">Connecting…</span></div><button id="sOptions">Options</button></header><div class="s-chat-scroll" id="sChatScroll" tabindex="0" aria-label="Conversation messages"><button id="sHistory" hidden>Load older messages</button><div class="s-thread" role="log" aria-live="polite" aria-relevant="additions" id="sThread"></div></div><form class="s-message-form"><label for="sMessage">Your message</label><div class="s-message-input"><textarea id="sMessage" maxlength="500" rows="2" required placeholder="Plan your next drive…"></textarea><button class="c-primary" id="sSend">Send ↑</button></div><div class="s-compose-footer"><span>Friends only · No links or addresses · Profanity censored</span><span id="sMessageCount"></span></div><p class="s-error" id="sMessageError" role="alert"></p></form></section>`;
  const thread=main.querySelector('#sThread'),scroll=main.querySelector('#sChatScroll'),input=main.querySelector('#sMessage'),send=main.querySelector('#sSend'),error=main.querySelector('#sMessageError'),state=main.querySelector('#sChatState'),history=main.querySelector('#sHistory');
  const chat=main.querySelector('.s-chat'),header=document.querySelector('.c-header');
  const fit=()=>{chat.style.height=Math.max(180,(window.visualViewport?.height||innerHeight)-header.getBoundingClientRect().height-24)+'px';};
  const resize=new ResizeObserver(fit);resize.observe(header);window.visualViewport?.addEventListener('resize',fit);fit();
  window.addEventListener('pagehide',()=>{resize.disconnect();window.visualViewport?.removeEventListener('resize',fit);},{once:true});
  let messages=new Map(),rel={status:'none'},username='',last=0,read=0,reading=false,more=false,busy=false,nonce=null,nonceText='',sending=false;
  count(input,main.querySelector('#sMessageCount'),500);
  bind(main,'#sBack',()=>C.go({view:'friends'}));bind(main,'#sChatProfile',()=>C.go({view:'profile',id}));
  bind(main,'#sOptions',async()=>{await C.modal(username,`<div id="sConnectionOptions" class="s-connections">${connectionHTML(rel.status,id)}</div><p class="c-note">Use Report beside a received message to send it to the owner for review.</p>`,[{label:'Done',value:true}],el=>{el.querySelector('[data-chat]')?.remove();bindConnections(el,async()=>{await refresh();el.querySelector('#sConnectionOptions').innerHTML=connectionHTML(rel.status,id);el.querySelector('[data-chat]')?.remove();bindConnections(el,()=>{C.go({view:'messages',id});});});});});
  function updateAccess(){const can=rel.status==='friends';input.disabled=!can;send.disabled=!can||sending;state.textContent=can?'Friends · Updates automatically':rel.status==='blocked'?'Blocked · Previous messages only':'Previous messages only · Become friends to send';input.placeholder=can?'Plan your next drive…':'New messages are unavailable for this connection.';}
  async function markRead(){if(reading||document.hidden||!last||read>=last||scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight>90)return;reading=true;const seq=last;try{await C.api('social/read',{id,seq});read=Math.max(read,seq);}catch{}finally{reading=false;}}
  function render(forceBottom=false,prepend=false){const nearBottom=scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight<90,oldHeight=scroll.scrollHeight,oldTop=scroll.scrollTop;
   const sorted=[...messages.values()].sort((a,b)=>a.seq-b.seq);const markup=sorted.map(m=>`<article class="s-bubble ${m.sender===C.account.id?'mine':'theirs'} ${m.removed?'removed':''}" data-seq="${m.seq}"><p>${E(m.text)}</p><div><time>${date(m.at)}</time>${m.sender!==C.account.id&&!m.removed?`<button data-report-message="${E(m.id)}" aria-label="Report message from ${E(username)}">Report</button>`:''}</div></article>`).join('');
   if(thread.innerHTML!==markup){thread.innerHTML=markup;bind(thread,'[data-report-message]',b=>report('message',b.dataset.reportMessage));}
   if(prepend)scroll.scrollTop=oldTop+scroll.scrollHeight-oldHeight;else if(forceBottom||nearBottom)scroll.scrollTop=scroll.scrollHeight;
   markRead();
  }
  function merge(d){for(const m of d.messages){messages.set(m.seq,m);last=Math.max(last,m.seq);}rel=d.relationship;username=d.account.username;main.querySelector('#sChatProfile').textContent=username;updateAccess();}
  async function refresh(initial=false){if(busy)return;busy=true;try{
   if(initial){const d=await C.api('social/messages?'+new URLSearchParams({id}));merge(d);more=d.more;history.hidden=!more;}
   else{let pending=true;for(let i=0;i<10&&pending;i++){const d=await C.api('social/messages?'+new URLSearchParams({id,after:last}));merge(d);pending=d.more;}const recent=await C.api('social/messages?'+new URLSearchParams({id}));merge(recent);}
   if(main.isConnected)render(initial);
  }finally{busy=false;}}
  history.onclick=async()=>{history.disabled=true;try{const first=Math.min(...messages.keys()),d=await C.api('social/messages?'+new URLSearchParams({id,before:first}));merge(d);more=d.more;history.hidden=!more;render(false,true);}catch(e){C.toast(e.message,true);}finally{history.disabled=false;}};
  scroll.addEventListener('scroll',()=>{markRead();},{passive:true});
  main.querySelector('form').onsubmit=async e=>{e.preventDefault();if(sending||rel.status!=='friends')return;error.textContent='';const problem=R.messageError(input.value);if(problem){error.textContent=problem;return;}sending=true;send.disabled=true;const text=input.value;
   if(!nonce||text!==nonceText){nonce=crypto.randomUUID();nonceText=text;}
   try{const d=await C.api('social/send',{id,text,nonce});messages.set(d.message.seq,d.message);last=Math.max(last,d.message.seq);if(input.value===text)input.value='';input.dispatchEvent(new Event('input'));nonce=null;render(true);input.focus();}
   catch(err){error.textContent=err.message;}finally{sending=false;updateAccess();}
  };
  await refresh(true);timer(main,async()=>{try{await refresh();}catch{state.textContent='Connection lost. Your draft is still here. Retrying…';}});
 }
 C.mountSocialModeration=async main=>{
  if(!C.account?.owner)return;const section=document.createElement('section');section.className='s-section';main.append(section);
  async function load(){const d=await C.api('admin/social-reports');section.innerHTML=`<h2>Post &amp; message reports</h2><p class="c-note">Only reported messages appear here. Conversations are private to their participants.</p><div class="c-reports">${d.reports.map(r=>`<article><span>${E(r.kind)} · ${E(r.reason)}</span><h3>${E(r.username)}</h3><blockquote>${E(r.text)}</blockquote><p>${E(r.detail)}</p><small>Reported by ${E(r.reporter_name)} · ${date(r.at)}</small><div class="s-person-actions"><button data-remove-social="${E(r.id)}">Remove content &amp; resolve</button><button data-review-social="${E(r.id)}">Mark reviewed</button></div></article>`).join('')||'<p class="s-empty">No open social reports.</p>'}</div>`;
   bind(section,'[data-review-social]',async b=>{await C.api('admin/social-moderate',{id:b.dataset.reviewSocial});await load();});bind(section,'[data-remove-social]',async b=>{if(await C.confirm('Remove this reported content and mark the report reviewed?')){await C.api('admin/social-moderate',{id:b.dataset.removeSocial,remove:true});await load();}});
  }await load();
 };
})();
