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
 const rules=Object.freeze({validateName,validColor,protocol:2,capacity:32,quickChat,validChat,chatDuration:6000,chatCooldown:3000});
 globalThis.IslaRules=rules;
 if(typeof module!=='undefined'&&module.exports)module.exports=rules;
})();
