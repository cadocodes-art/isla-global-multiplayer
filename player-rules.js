'use strict';
// Shared by the browser and Worker. Strict substring matching is intentional.
// English profanity/slurs are also checked without separators and with common digit substitutions.
(()=>{
 const words=['fuck','shit','bitch','cunt','ass','bastard','damn','dick','cock','pussy','prick','wank','twat','bollock','bugger','arse','piss','crap','slut','whore','fag','nigger','nigga','kike','chink','spic','tranny','retard','motherfucker','douche','jackoff','jerkoff','blowjob','handjob','rimjob','cum','jizz','semen','penis','vagina','tits','titties','boob','porn','hentai','dildo','buttplug','anal','anus','sex','screwyou','stfu','wtf','fml','b1tch','fuk','fuq','fck','fuc','shyt','sht','suckmy','negro','puto','puta','mierda','cabron','coño','pendejo','chingar','joder','culo','merde','putain','salope','scheiss','scheiß','kurwa'];
 const patterns=words.filter(w=>/^[a-z]+$/.test(w)).map(w=>new RegExp([...w].map(c=>c+'+').join('')));
 function validateName(value){
  if(typeof value!=='string'||value.length<3||value.length>20)return 'Use a car name between 3 and 20 characters.';
  if(!/^[A-Za-z0-9_.]+$/.test(value))return 'Use only letters A–Z, numbers, underscores, and periods.';
  const plain=value.toLowerCase().replace(/[_.]/g,''),variants=[plain,plain.replace(/[01345789]/g,c=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','9':'g'}[c])),plain.replace(/[01]/g,c=>c==='0'?'o':'l')];
  if(variants.some(v=>patterns.some(re=>re.test(v))))return 'Choose a different name. Profanity is not allowed.';
  return '';
 }
 const validColor=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
 const quickChat=Object.freeze([
  ['Vibes','Hey, drivers!'],['Vibes',"Let's cruise!"],['Vibes','Nice ride!'],['Vibes','Love your color!'],['Vibes','Thanks!'],['Vibes','See you around!'],
  ['Meet up','Follow me!'],['Meet up',"I'll follow you!"],['Meet up','Meet at the bridge!'],['Meet up',"Let's head to Ruiz!"],['Meet up','To the mountains!'],['Meet up','Wait for me!'],
  ['Stunts','Watch this!'],['Stunts','Ramp run!'],['Stunts','Send it!'],['Stunts','Water skim time!'],['Stunts','That jump was unreal!'],['Stunts','You almost have as much aura as this game.'],
  ['Reactions','That was legendary!'],['Reactions','Maximum aura! 💀'],['Reactions','How did you land that?!'],['Reactions','Clean landing!'],['Reactions','We are so back!'],['Reactions','Worth it.'],
  ['Teamwork','Need a hand?'],['Teamwork',"I'm stuck!"],['Teamwork','On my way!'],['Teamwork','Sorry about that!'],['Teamwork','Careful, traffic!'],['Teamwork','One more run!']
 ].map(([category,text])=>Object.freeze({category,text})));
 const validChat=value=>Number.isInteger(value)&&value>=0&&value<quickChat.length;

 const nuke=Object.freeze({cooldown:15,flight:.75,range:42,radius:32});
 function nukeShot(s,size=1){const sx=Math.sin(s.yaw),sz=Math.cos(s.yaw);return {x:s.x-sx*2.7*size,y:s.y+1.46*size,z:s.z-sz*2.7*size,yaw:s.yaw,target:{x:s.x-sx*nuke.range,y:s.y+1,z:s.z-sz*nuke.range}};}
 function blastHits(p,b){const co=Math.cos(b.yaw||0),si=Math.sin(b.yaw||0),dx=p.x-b.x,dz=p.z-b.z,lx=dx*co-dz*si,lz=dx*si+dz*co,ex=Math.max(0,Math.abs(lx)-(b.w||2)/2),ez=Math.max(0,Math.abs(lz)-(b.d||4)/2),ey=Math.max(0,b.y-p.y,p.y-b.y-(b.h||2));return Math.hypot(ex,ey,ez)<=nuke.radius;}
 function blastTraffic(p,t){if(!blastHits(p,t))return;const dx=t.x-p.x,dz=t.z-p.z,d=Math.hypot(dx,dz)||1;t.driftX=(t.driftX||0)+dx/d*22;t.driftZ=(t.driftZ||0)+dz/d*22;t.speed*=.15;t.stun=3;}

 function hoseJets(s,buildings=[],ground){
  const sx=Math.sin(s.yaw),sz=Math.cos(s.yaw),near=buildings.filter(b=>!b.collapsed&&Math.hypot(b.x-s.x,b.z-s.z)<Math.hypot(b.w,b.d)/2+22),jets=[];
  for(const side of [-1,1]){const dx=sz*side,dz=-sx*side,start={x:s.x+dx*1.71-sx*.49,y:s.y+2.03,z:s.z+dz*1.71-sz*.49};let end={...start},distance=18,normal={x:0,y:1,z:0},building;
   search:for(let d=.5;d<=18;d+=.5){const p={x:start.x+dx*d,y:start.y+.10*d-.014*d*d,z:start.z+dz*d};
    for(const b of near){const co=Math.cos(b.yaw),si=Math.sin(b.yaw),xx=p.x-b.x,zz=p.z-b.z,lx=xx*co-zz*si,lz=xx*si+zz*co;
     if(Math.abs(lx)<b.w/2&&Math.abs(lz)<b.d/2&&p.y>b.y&&p.y<b.y+b.h){const nx=b.w/2-Math.abs(lx)<b.d/2-Math.abs(lz)?Math.sign(lx):0,nz=nx?0:Math.sign(lz);normal={x:nx*co+nz*si,y:0,z:-nx*si+nz*co};building=b.id;let lo=d-.5,hi=d;for(let n=0;n<8;n++){const mid=(lo+hi)/2,xx=start.x+dx*mid-b.x,zz=start.z+dz*mid-b.z;if(Math.abs(xx*co-zz*si)<b.w/2&&Math.abs(xx*si+zz*co)<b.d/2)hi=mid;else lo=mid;}distance=lo;end={x:start.x+dx*lo,y:start.y+.10*lo-.014*lo*lo,z:start.z+dz*lo};break search;}
    }
    end=p;if(ground&&p.y<=ground(p.x,p.z)+.035){end.y=ground(p.x,p.z)+.035;distance=d;break;}
   }
   jets.push({start,end,dx,dz,distance,normal,building});
  }return jets;
 }
 function inHose(jet,t){const dx=t.x-jet.start.x,dz=t.z-jet.start.z,d=dx*jet.dx+dz*jet.dz,cross=dx*jet.dz-dz*jet.dx,y=jet.start.y+.10*d-.014*d*d;return d>=-1&&d<=jet.distance+1&&Math.abs(cross)<2.6&&Math.abs(t.y+.8-y)<2.5;}
 const rules=Object.freeze({hoseJets,inHose,nuke,nukeShot,blastHits,blastTraffic,validateName,validColor,protocol:2,capacity:32,quickChat,validChat,chatDuration:6000,chatCooldown:3000});
 globalThis.IslaRules=rules;
 if(typeof module!=='undefined'&&module.exports)module.exports=rules;
})();
