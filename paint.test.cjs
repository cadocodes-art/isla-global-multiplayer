const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('paint preserves an existing garage save, is free, persists per model and rejects invalid CSS',()=>{
 const context={Isla:{},window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/garage.js'),'utf8'),context);const W=context.Isla;
 const memory=new Map([['isla-drive-garage-v2',JSON.stringify({balance:120000,earned:400000,bestChain:4321,owned:['classic','truck','rally'],selected:'truck'})]]),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 let g=W.createGarage(storage);assert.equal(g.getColor(),'#617864');assert(g.setColor('#A1B2C3'));assert.equal(g.balance,120000);assert.equal(g.earned,400000);assert.equal(g.bestChain,4321);assert(!g.setColor('url(javascript:evil)'));assert(!g.setColor('#00ff00','solstice'));
 g.choose('rally');assert(g.setColor('#000000'));g=W.createGarage(storage);assert.equal(g.getColor('truck'),'#a1b2c3');assert.equal(g.getColor('rally'),'#000000');assert.equal(g.balance,120000);assert.equal(g.owned.length,3);assert(g.setColor('#ffffff'));assert(g.setColor('#ff00ff'));
});
