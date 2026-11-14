'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'offline/v24-source.json'),'utf8')),dir=path.join(root,'offline/v24');
fs.mkdirSync(path.join(dir,'modules'),{recursive:true});
for(const name of source.order){if(!/^[a-z0-9.-]+\.js$/i.test(name)||typeof source.modules[name]!=='string')throw Error('Invalid offline module');fs.writeFileSync(path.join(dir,'modules',name),source.modules[name]);}
fs.writeFileSync(path.join(dir,'module-order.json'),JSON.stringify(source.order));fs.writeFileSync(path.join(dir,'template.html'),source.template);fs.writeFileSync(path.join(dir,'build.cjs'),source.builder);require(path.join(dir,'build.cjs'));console.log('Standalone V2.4 HTML and compact text are in dist/.');
