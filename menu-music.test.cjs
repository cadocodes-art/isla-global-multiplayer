'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../public/menu-music.js');
const memory=entries=>{const m=new Map(entries);return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const settled=()=>new Promise(resolve=>setImmediate(resolve));
function setup(options={}){
 const events=new Map(),audio={paused:true,readyState:0,currentTime:0,duration:199.47,volume:1,plays:0,pauses:0,
  addEventListener(type,fn){events.set(type,fn);},pause(){this.paused=true;this.pauses++;},play(){this.plays++;if(options.block)return Promise.reject(Object.assign(Error('Tap first'),{name:'NotAllowedError'}));this.paused=false;return Promise.resolve();}};
 const storage=options.storage||memory(),session=options.session||memory();
 const controller=create({audio,storage,session,contextFactory:options.contextFactory});
 return {audio,controller,storage,session,events,options};
}
test('menu music loops on requested screens and stops for driving, pause menus and unrelated screens',async()=>{
 const {audio,controller}=setup();assert(audio.loop);assert.equal(audio.preload,'none');
 for(const screen of ['menu','maker','editor','search','map']){controller.setScreen(screen);await settled();assert(!audio.paused,screen);}
 const count=audio.plays;controller.setScreen('search');await settled();assert.equal(audio.plays,count,'screen updates do not create duplicate playback');
 for(const screen of ['driving','pause','profile','account','']){controller.setScreen(screen);assert(audio.paused,screen);}
 controller.setScreen('menu');await settled();assert(!audio.paused);
});
test('blocked autoplay waits for a gesture and does not retry in a loop',async()=>{
 const x=setup({block:true});x.controller.setScreen('menu');await settled();assert(x.controller.state().blocked);assert.equal(x.audio.plays,1);
 await settled();assert.equal(x.audio.plays,1);x.options.block=false;x.controller.unlock();await settled();assert(!x.audio.paused);assert(!x.controller.state().blocked);
});
test('mute, volume and playback position survive navigation without overwriting an unloaded track',async()=>{
 const x=setup({session:memory([['isla-menu-energy-position-v1','78.5']])});
 x.controller.setVisible(true);assert.equal(x.session.getItem('isla-menu-energy-position-v1'),'78.5');
 x.audio.readyState=1;x.events.get('loadedmetadata')();assert.equal(x.audio.currentTime,78.5);
 x.controller.setScreen('maker');await settled();x.audio.currentTime=91;x.controller.setVisible(false);assert(x.audio.paused);assert.equal(x.session.getItem('isla-menu-energy-position-v1'),'91');
 x.controller.setVisible(true);await settled();assert(!x.audio.paused);assert.equal(x.audio.currentTime,91);
 x.controller.setVolume(.2);assert.equal(x.audio.volume,.2);x.controller.setEnabled(false);assert(x.audio.paused);
 const next=setup({storage:x.storage,session:x.session});next.controller.setScreen('search');await settled();assert(next.audio.paused);assert.equal(next.controller.state().volume,.2);
 next.controller.unlock();await settled();assert(next.audio.paused,'a generic gesture never overrides the off preference');
 next.controller.setEnabled(true);await settled();assert(!next.audio.paused);next.controller.setVolume(0);assert(next.audio.paused);
});
test('mobile volume uses a single Web Audio gain node and resumes a suspended context',async()=>{
 let contexts=0,sources=0,resumes=0;const gain={gain:{value:0},connect(){}};
 const x=setup({contextFactory:()=>{contexts++;return {state:'suspended',destination:{},createMediaElementSource(){sources++;return {connect(){}};},createGain:()=>gain,resume(){resumes++;return Promise.resolve();}};}});
 x.controller.setScreen('editor');x.controller.unlock();await settled();assert.equal(gain.gain.value,.35);assert.equal(x.audio.volume,1);
 x.controller.setVolume(.1);assert.equal(gain.gain.value,.1);x.controller.unlock();assert.equal(contexts,1);assert.equal(sources,1);assert.equal(resumes,2);
});
test('a late play promise cannot restart music after leaving the menu',async()=>{
 let resolve;const x=setup();x.audio.play=function(){return new Promise(r=>{resolve=()=>{this.paused=false;r();};});};
 x.controller.setScreen('menu');x.controller.setScreen('driving');resolve();await settled();assert(x.audio.paused);
});
test('storage failures and malformed preferences never prevent the game from loading',async()=>{
 const bad={getItem(){throw Error('unavailable');},setItem(){throw Error('full');}};
 const x=setup({storage:bad,session:bad});x.controller.setEnabled(false);x.controller.setVolume(.4);x.controller.savePosition();
 const y=setup({storage:memory([['isla-menu-music-v1','{broken']])});y.controller.setScreen('menu');await settled();assert(!y.audio.paused);
});
