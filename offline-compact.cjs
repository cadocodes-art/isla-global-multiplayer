'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const root=__dirname;
const original=fs.readFileSync(path.join(root,'ISLA-V2.38-Offline.html'),'utf8');
const modules=[];
const shell=original.replace(/(<script type="application\/x-isla"[^>]*>)\n([A-Za-z0-9+/=\n]+)\n(<\/script>)/g,(_,start,data,end)=>{
  const index=modules.push(Buffer.from(data,'base64').toString('utf8'))-1;
  return start+'__ISLA_COMPACT_MODULE_'+index+'__'+end;
});
assert.equal(modules.length,50,'Every game module must be packed');
const payload=Buffer.from(JSON.stringify({shell,modules}));
const packed=zlib.gzipSync(payload,{level:9}).toString('base64').match(/.{1,120}/g).join('\n');
const loader=`(async()=>{
try{
 if(typeof DecompressionStream==='undefined')throw Error('This browser cannot unpack the game. Please use an up-to-date Safari, Chrome, Firefox or Edge.');
 const raw=atob(document.getElementById('isla-packed').textContent.replace(/\\s+/g,''));
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 const bundle=JSON.parse(await new Response(stream).text());
 if(bundle.modules.length!==50)throw Error('Incomplete game data. Please copy the entire file again.');
 const encoder=new TextEncoder();
 const html=bundle.shell.replace(/__ISLA_COMPACT_MODULE_(\\d+)__/g,(_,index)=>{
  const data=encoder.encode(bundle.modules[Number(index)]);
  let binary='';
  for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));
  return '\\n'+btoa(binary).match(/.{1,120}/g).join('\\n')+'\\n';
 });
 document.open();document.write(html);document.close();
}catch(error){
 document.getElementById('isla-status').textContent='ISLA could not unpack: '+error.message;
 console.error(error);
}
})();`;
const compact=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>ISLA V2.38 Offline</title>
<style>html,body{margin:0;min-height:100%;background:#101917;color:#eaf4ee;font:16px Arial,sans-serif}#isla-status{padding:32px;line-height:1.5}</style></head><body>
<p id="isla-status">Opening ISLA V2.38…</p><noscript>Enable JavaScript to play ISLA.</noscript>
<!-- Complete offline game. Vault music edition: import this text file directly into your HTML viewer. No external downloads. -->
<script id="isla-packed" type="application/octet-stream">
${packed}
</script>
<script>
${loader}
</script></body></html>
`;
const decoded=JSON.parse(zlib.gunzipSync(Buffer.from(packed.replace(/\s+/g,''),'base64')));
const recovered=decoded.shell.replace(/__ISLA_COMPACT_MODULE_(\d+)__/g,(_,index)=>'\n'+Buffer.from(decoded.modules[Number(index)]).toString('base64').match(/.{1,120}/g).join('\n')+'\n');
assert.equal(recovered,original,'Packing must preserve the entire original HTML byte-for-byte');
assert.ok(compact.length<16*1024*1024,'Vault music edition remains within viewer import size budget');
fs.writeFileSync(path.join(root,'ISLA-V2.38-Offline.txt'),compact);
fs.mkdirSync(path.join(root,'compact-preview'),{recursive:true});
fs.writeFileSync(path.join(root,'compact-preview/index.html'),compact);
console.log(JSON.stringify({originalCharacters:original.length,compactCharacters:compact.length,bytes:Buffer.byteLength(compact),reductionPercent:((1-compact.length/original.length)*100).toFixed(1),modules:modules.length,exactRecovery:true}));
