'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,file=path.join(root,'isla-v16-upload.json'),manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const additions={
 'V2.21-Notes.md':'V2.21-Notes.md',
 'V2.2-Release-Notes.md':'V2.2-Release-Notes.md','V2.2-Validation.md':'V2.2-Validation.md',
 'v22-shared.js':'public/v22-shared.js','v22-garage.js':'public/v22-garage.js',
 'v22-gameplay.js':'public/v22-gameplay.js','v22-economy-client.js':'public/v22-economy-client.js',
 'v22-car-assets.js':'public/v22-car-assets.js','v22-people-buildings.js':'public/v22-people-buildings.js',
 'v22.css':'public/v22.css','v22-economy.js':'src/v22-economy.js',
 'v22.test.cjs':'test/v22.test.cjs','v22-network.test.cjs':'test/v22-network.test.cjs',
 'refresh-manifest.cjs':'refresh-manifest.cjs','dev.cjs':'dev.cjs'
};
for(const [name,destination] of Object.entries(additions))if(fs.existsSync(path.join(root,name))&&!manifest.files.some(f=>f.name===name))manifest.files.push({name,destination});
manifest.version='2.21';
for(const entry of manifest.files){const bytes=fs.readFileSync(path.join(root,entry.name));entry.sha256=crypto.createHash('sha256').update(bytes).digest('hex');if('size' in entry)entry.size=bytes.length;}
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
console.log('V2.21 manifest: '+manifest.files.length+' verified source files.');
