'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=n=>fs.readFileSync(path.join(__dirname,'../public',n),'utf8');
function boot(){
 const elements=new Map(),listeners={},audios=[],messages={},store=new Map();
 const document={readyState:'loading',hidden:false,getElementById:id=>elements.get(id),addEventListener:(k,f)=>listeners[k]=f,createElement:tag=>({tag,onclick:null,hidden:false,setAttribute(){},addEventListener(k,f){this[k]=f;},remove(){elements.delete(this.id);}})};
 document.body={classList:{add(){},remove(){}},append(e){elements.set(e.id,e);},prepend(e){elements.set(e.id,e);}};
 class Audio{constructor(){audios.push(this);this.currentTime=0;this.duration=250;this.paused=true;this.assignments=0;this.plays=0;this.pauses=0;this.events={};}set src(s){this.url=s;this.assignments++;this.currentTime=0;}get src(){return this.url;}addEventListener(k,f){(this.events[k]??=[]).push(f);}metadata(){for(const f of this.events.loadedmetadata||[])f();this.events.loadedmetadata=[];}play(){this.plays++;this.paused=false;return this.reject?Promise.reject(Error('gesture required')):Promise.resolve();}pause(){this.pauses++;this.paused=true;}}
 const c=vm.createContext({document,Audio,URL,location:{origin:'https://isla.test',pathname:'/',search:'?view=maker',hash:''},history:{replaceState(){}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});c.window=c;c.addEventListener=(k,f)=>messages[k]=f;
 vm.runInContext(source('soundtrack.js'),c);return {c,S:c.IslaSoundtrack,a:audios[0],audios,elements,document,listeners,messages};
}
test('Start unlocks one looping player; menu transitions preserve its exact playhead',async()=>{
 const b=boot(),{S,a}=b;let ready=false;S.gate.then(()=>ready=true);await Promise.resolve();assert(!ready);assert.equal(a.plays,0);assert(a.loop);S.start();await S.gate;assert(ready);a.metadata();a.currentTime=47.25;const pauses=a.pauses;
 for(const page of ['maker','search','leaderboard','menu']){S.route('menu');assert.equal(a.currentTime,47.25,page);assert.equal(a.assignments,1);assert.equal(a.pauses,pauses);assert(!a.paused);}
 S.mountControl();b.elements.clear();S.mountControl();assert.equal(b.audios.length,1);assert.equal(a.currentTime,47.25);assert(b.elements.has('musicToggle'));
});
test('Vault changes songs, driving pauses, and both songs resume without losing position',async()=>{
 const {S,a,listeners,document}=boot();S.start();a.metadata();a.currentTime=80;S.route('vault');a.metadata();assert.match(a.src,/project10/);a.currentTime=23;S.route('menu');a.metadata();assert.equal(a.currentTime,80);S.route(null);assert(a.paused);S.route('menu');assert.equal(a.currentTime,80);assert(!a.paused);S.route('vault');a.metadata();assert.equal(a.currentTime,23);
 document.hidden=true;listeners.visibilitychange();assert(a.paused);document.hidden=false;listeners.visibilitychange();assert(!a.paused);S.toggle();assert(a.paused);S.route('menu');a.metadata();assert(a.paused);S.toggle();assert(!a.paused);assert.equal(a.currentTime,80);
});
test('Blocked audio offers a working tap-to-enable retry',async()=>{
 const {S,a,elements}=boot();a.reject=true;S.start();await Promise.resolve();await Promise.resolve();assert(S.state.blocked);assert.equal(elements.get('musicToggle').textContent,'Enable music');a.reject=false;elements.get('musicToggle').onclick();await Promise.resolve();assert(!S.state.blocked);assert(!a.paused);
});
test('Online shell keeps its frame and audio across navigation; only its own frame can select music',async()=>{
 const b=boot();vm.runInContext(source('music-shell.js'),b.c);assert(!b.elements.has('islaGame'));b.S.start();await b.S.gate;const frame=b.elements.get('islaGame');assert.equal(frame.src,'drive.html?view=maker');frame.contentWindow={};b.a.metadata();b.a.currentTime=55;
 for(const source of [{},frame.contentWindow])b.messages.message({source,origin:'https://evil.test',data:{type:'isla-music',track:'vault'}});assert.equal(b.S.state.current,'menu');
 for(const page of ['search','leaderboard','maker']){b.messages.message({source:frame.contentWindow,origin:'https://isla.test',data:{type:'isla-music',track:'menu'}});assert.equal(b.elements.get('islaGame'),frame);assert.equal(b.a.currentTime,55);assert.equal(b.audios.length,1);}
 b.messages.message({source:frame.contentWindow,origin:'https://isla.test',data:{type:'isla-music',track:null,driving:true}});assert(b.a.paused);assert(b.elements.get('musicToggle').hidden);
});

test('Offline menu rebuilding restores the music control without replacing audio',()=>{
 const b=boot();let observer; b.document.body.classList.contains=()=>false;b.c.URLSearchParams=URLSearchParams;b.c.MutationObserver=class{constructor(fn){observer=fn;}observe(){}disconnect(){}};b.c.IslaCommunity={query:new URLSearchParams('view=maker')};b.S.start();b.a.metadata();b.a.currentTime=99;vm.runInContext(source('music-route.js'),b.c);b.elements.delete('musicToggle');observer();assert(b.elements.get('musicToggle'));assert.equal(typeof b.elements.get('musicToggle').onclick,'function');assert.equal(b.a.currentTime,99);assert.equal(b.a.assignments,1);assert.equal(b.audios.length,1);
});
