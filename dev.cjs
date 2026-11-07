'use strict';
// Map the host/port convention used by local previews to Wrangler's options.
const {spawn}=require('node:child_process');
const args=process.argv.slice(2).filter(arg=>arg!=='--strictPort'&&arg!=='--').map(arg=>arg==='--host'?'--ip':arg.startsWith('--host=')?'--ip='+arg.slice(7):arg);
const child=spawn('wrangler',['dev',...args],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>{process.exitCode=code||0;});
