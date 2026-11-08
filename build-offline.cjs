'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
require(path.join(root,'offline/build.cjs'));
require(path.join(root,'offline/build-compact.cjs'));
fs.mkdirSync(out,{recursive:true});
for(const file of ['ISLA-V2.4-Offline.html','ISLA-V2.4-MOUNT-INFERNO-Offline.txt'])fs.copyFileSync(path.join(root,'offline',file),path.join(out,file));
console.log('Full offline V2.4 with both original songs is ready in dist.');
