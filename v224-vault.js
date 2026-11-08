/* V2.24: one hidden vault. Account eligibility and every reward are checked by the server. */
(()=>{'use strict';
 const W=Isla,C=IslaCommunity,pause=document.querySelector('#pause .menu-card');if(!pause)return;
 const entry=document.createElement('button');entry.id='vaultEntry';entry.type='button';entry.setAttribute('aria-label','Open the vault');pause.append(entry);
 const dialog=document.createElement('dialog');dialog.id='vaultDialog';dialog.setAttribute('aria-labelledby','vaultTitle');
 dialog.innerHTML='<button type="button" class="vault-close" aria-label="Back to pause menu">×</button><div class="vault-content"><span class="vault-eyebrow">ISLA / THE VAULT</span><div class="vault-seal" aria-hidden="true">◉</div><h2 id="vaultTitle">Checking access…</h2><p id="vaultMessage" role="status" aria-live="polite"></p><form id="vaultForm" hidden><label for="vaultCode">Passcode</label><div class="vault-input-row"><input id="vaultCode" name="code" type="text" maxlength="100" autocomplete="off" autocapitalize="none" spellcheck="false" required><button type="submit">UNLOCK ↗</button></div><p class="vault-hint">Each passcode can be claimed once on your account.</p></form><a id="vaultSignIn" href="?view=account" hidden>Sign in to your account ↗</a><p id="vaultWallet"></p><button type="button" class="vault-music" aria-label="Vault music">Music: on</button><button type="button" class="vault-back">BACK TO PAUSE</button></div>';
 document.body.append(dialog);
 const title=dialog.querySelector('#vaultTitle'),message=dialog.querySelector('#vaultMessage'),form=dialog.querySelector('#vaultForm'),input=dialog.querySelector('#vaultCode'),submit=form.querySelector('button'),signIn=dialog.querySelector('#vaultSignIn'),wallet=dialog.querySelector('#vaultWallet');
 const musicButton=dialog.querySelector('.vault-music'),music=window.IslaVaultMusic(musicButton);window.IslaOffline?.onCleanup(()=>music.destroy());
 let request=0,timer;
 const missing=n=>'System Error. Error code: needs '+n.toLocaleString('en-US')+' amount of aura.';
 function showWallet(){wallet.textContent=W.garage.balance.toLocaleString('en-US')+' AURA'+(W.garage.showIscoins?' · '+W.garage.iscoins.toLocaleString('en-US')+' ISCOINS':'');}
 function reflect(g){C.reflectGarage(g);W.refreshIscoinDisplay?.();showWallet();}
 function error(text){music.close();musicButton.hidden=true;dialog.classList.remove('vault-granted');title.textContent='System Error.';message.textContent=text;}
 async function open(){
  const pauseRoot=document.getElementById('pause');if(pauseRoot.classList.contains('hidden'))return;
  const seq=++request;clearTimeout(timer);form.hidden=signIn.hidden=true;submit.disabled=false;input.value='';wallet.textContent='';dialog.classList.remove('vault-granted','vault-ready');title.textContent='Checking access…';message.textContent='';dialog.showModal();musicButton.hidden=false;music.open();
  try{
   if(!C.account){const remaining=Math.max(0,1000000-W.garage.earned);if(remaining)error(missing(remaining));else{music.close();musicButton.hidden=true;title.textContent='Save your discovery.';message.textContent='Sign in to enter the vault and keep rewards on your account.';signIn.hidden=false;}return;}
   await C.flush?.();const out=await C.api('v224/vault',{action:'status'});if(seq!==request||!dialog.open)return;reflect(out.garage);
   if(!out.access){error(missing(out.remaining));return;}
   title.textContent='Access granted.';dialog.classList.add('vault-granted');message.textContent='';
   timer=setTimeout(()=>{if(seq!==request||!dialog.open)return;title.textContent='The vault.';form.hidden=false;dialog.classList.add('vault-ready');input.focus();},650);
  }catch(e){if(seq===request&&dialog.open)error(e.message||'Could not connect. Please try again.');}
 }
 entry.addEventListener('click',open);
 for(const b of dialog.querySelectorAll('.vault-close,.vault-back'))b.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{music.close();request++;clearTimeout(timer);entry.focus();});
 // Typing G, R, T or Escape must not reach the driving/garage shortcuts.
 for(const type of ['keydown','keyup'])dialog.addEventListener(type,e=>e.stopPropagation());
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(submit.disabled)return;const code=input.value.trim();if(!code){input.focus();return;}
  const seq=request;submit.disabled=true;message.textContent='Checking passcode…';
  try{const out=await C.api('v224/vault',{action:'redeem',code});if(seq!==request||!dialog.open)return;reflect(out.garage);title.textContent='Access granted.';dialog.classList.add('vault-granted');message.textContent='+'+out.reward.amount.toLocaleString('en-US')+' '+(out.reward.currency==='aura'?'Aura':out.reward.amount===1?'Iscoin':'Iscoins')+' added to your account.';input.value='';}
  catch(e){if(seq===request&&dialog.open){dialog.classList.remove('vault-granted');title.textContent=e.status===409?'Already claimed.':'Access denied.';message.textContent=e.message;}}
  finally{if(seq===request&&dialog.open){submit.disabled=false;input.focus();}}
 });
})();
