/* The Playplace and Map Maker share these original model builders. All dimensions are meters. */
(()=>{'use strict';const W=Isla,T=THREE;let soccerTexture;
 const palettes=['#f5b755','#eb7499','#68bdb8','#8e8ad0','#75badd'];
 const finish=g=>{g.traverse(m=>{if(m.isMesh)m.castShadow=m.receiveShadow=true;});return g;};
 function line(g,points){g.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#eee4ce'})));}
 function ball(kind,r,id=0){const g=new T.Group();if(kind==='soccer'&&!soccerTexture)soccerTexture=W.textureCanvas(512,(c,s)=>{c.fillStyle='#f2f0e7';c.fillRect(0,0,s,s);for(let row=0;row<4;row++)for(let col=0;col<6;col++){const x=(col+(row%2)*.5)*s/6,y=(row+.5)*s/4;c.beginPath();for(let j=0;j<5;j++){const a=j/5*Math.PI*2-Math.PI/2;c.lineTo(x+Math.cos(a)*27,y+Math.sin(a)*27);}c.closePath();c.fillStyle='#26384a';c.fill();c.strokeStyle='#73808b';c.lineWidth=2;for(let j=0;j<5;j++){const a=j/5*Math.PI*2-Math.PI/2;c.beginPath();c.moveTo(x+Math.cos(a)*27,y+Math.sin(a)*27);c.lineTo(x+Math.cos(a)*52,y+Math.sin(a)*52);c.stroke();}}});
  const material=kind==='soccer'?new T.MeshStandardMaterial({map:soccerTexture,roughness:.8}):kind==='bowling'?W.mat('#3567a4',.23,.3):kind==='basketball'?W.mat('#e98a33',.92):W.mat(['#e95c73','#68afd1','#a789ce'][id%3],.65);
  const sphere=new T.Mesh(new T.SphereGeometry(r,24,16),material);sphere.userData.paintable=true;g.add(sphere);
  if(kind==='bowling')for(const [x,z]of [[-.5,0],[.5,0],[0,.9]]){const hole=new T.Mesh(new T.SphereGeometry(.25,10,8),W.mat('#101c2c'));hole.position.set(x,Math.sqrt(r*r-x*x-z*z)-.08,z);g.add(hole);}
  if(!['soccer','bowling'].includes(kind))for(let i=0;i<(kind==='basketball'?3:1);i++){const seam=new T.Mesh(new T.TorusGeometry(r+.006,kind==='basketball'?.035:.055,4,40),W.mat(kind==='basketball'?'#593a25':'#ffe6bf'));if(i===1)seam.rotation.x=Math.PI/2;if(i===2)seam.rotation.y=Math.PI/2;g.add(seam);}return finish(g);
 }
 function hoop(){const g=new T.Group();for(const [x,y,z,w,h,d]of [[0,20,-7,22,14,.7],[0,12,-12,1.4,24,1.4],[0,25,-9.5,1.4,1.4,6]])W.box(g,x,y,z,w,h,d,W.mat(w>20?'#eef0e1':'#465a73'));
  const target=W.mat('#d26740');for(const x of [-5,5])W.box(g,x,19,-6.62,.35,6,.05,target);for(const y of [16,22])W.box(g,0,y,-6.62,10,.35,.05,target);
  const rim=new T.Mesh(new T.TorusGeometry(6,.28,8,48),W.mat('#ef793d',.4));rim.rotation.x=Math.PI/2;rim.position.y=16;rim.userData.paintable=true;g.add(rim);
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;for(const direction of [-1,1])line(g,Array.from({length:9},(_,j)=>{const f=j/8,r=6*(1-f*.36),angle=a+direction*f*.6;return new T.Vector3(r*Math.cos(angle),16-f*6,r*Math.sin(angle));}));}return finish(g);
 }
 function seesawBoard(w=12,h=.8,d=40){const g=new T.Group();W.box(g,0,0,0,w,h,d,W.mat('#edb65c')).userData.paintable=true;for(const end of [-1,1])W.box(g,0,h/2+.02,end*(d/2-4),w,.05,7,W.mat(end<0?'#688bc5':'#e880a6'));return finish(g);}
 function seesawBase(){return finish(new T.Mesh(new T.CylinderGeometry(.3,4,4,3),W.mat('#43546c',.45,.5)));}
 function seesaw(){const g=new T.Group(),plank=seesawBoard(),base=seesawBase();plank.position.y=4.4;plank.rotation.x=-.235;base.position.y=2;g.add(plank,base);g.userData.plank=plank;return g;}
 function cannon(){const g=new T.Group(),orange=W.mat('#edb65c'),metal=W.mat('#43546c',.45,.5);W.box(g,0,.22,-9,12,.44,12,orange);const barrel=new T.Group();barrel.position.y=4;barrel.rotation.x=-Math.atan2(40,60);g.add(barrel);const tube=new T.Mesh(new T.CylinderGeometry(4.5,4.5,12,20,1,true),W.mat('#b96685',.5,.35));tube.material.side=T.DoubleSide;tube.userData.paintable=true;tube.rotation.x=Math.PI/2;barrel.add(tube);for(const z of [-6,6]){const ring=new T.Mesh(new T.TorusGeometry(4.5,.4,8,24),orange);ring.position.z=z;barrel.add(ring);}for(const side of [-1,1])W.box(g,side*5,2,0,1.2,4,6,metal);return finish(g);}
 const foamGeometry=()=>new T.BoxGeometry(4.2,4.2,4.2),foamMaterial=()=>new T.MeshStandardMaterial({roughness:1});
 function foam(){const m=new T.Mesh(foamGeometry(),foamMaterial());m.material.color.set(palettes[0]).convertSRGBToLinear();m.userData.paintable=true;return finish(m);}
 function tunnel(radius=15.75,length=135,color='#71bfc0'){const g=new T.Group(),material=W.mat(color,.6),tube=new T.Mesh(new T.CylinderGeometry(radius,radius,length,28,1,true,Math.PI/2,Math.PI),material);material.side=T.DoubleSide;tube.rotation.x=Math.PI/2;tube.userData.paintable=true;g.add(tube);for(const end of [-1,1]){const hoop=new T.Mesh(new T.TorusGeometry(radius,.6,6,32,Math.PI),W.mat('#e5e2d3'));hoop.position.z=end*length/2;g.add(hoop);}return finish(g);}
 globalThis.IslaPlayModels={palettes,ball,hoop,seesawBoard,seesawBase,seesaw,cannon,foam,foamGeometry,foamMaterial,tunnel};
})();
