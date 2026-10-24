/* V1.9 vehicle details, shared by local and remote cars. */
(()=>{'use strict';const W=Isla,T=THREE,base=W.makeCar;
 W.makeCar=(model=W.getCarSpec(),remote=false)=>{const car=base(model,remote);car.model=model;car.rotors=[];
  if(model.hover){for(const w of car.wheels)w.pivot.visible=false;
   const metal=W.mat('#303e50',.38,.75),rim=W.mat('#85ece6',.25,.6);
   for(const side of [-1,1])for(const z of [-1.42,1.42]){const pod=new T.Group();pod.position.set(side*1.04,.38,z);pod.rotation.x=-.32;car.root.add(pod);
    const hub=new T.Mesh(new T.CylinderGeometry(.10,.13,.15,10),metal);pod.add(hub);
    const rotor=new T.Group();pod.add(rotor);for(let i=0;i<3;i++){const angle=i*Math.PI*2/3,blade=W.box(rotor,Math.cos(angle)*.25,0,-Math.sin(angle)*.25,.5,.035,.10,rim);blade.rotation.y=angle;}car.rotors.push(rotor);
    W.box(car.body,side*1.0,.59,z,.44,.10,.16,metal);
   }
  }
  if(model.id==='cruiser'){W.box(car.body,0,1.635,-.08,1.35,.025,1.08,W.mat('#dde8d2',.55));}
  return car;
 };
 W.hoverHeight=(spec,c,time=0)=>spec.hover&&c.grounded&&(c.waterMode||c.water||'dry')==='dry'&&!c.wallMode?Math.min(1,Math.hypot(c.vx,c.vz)/4)*(.5+Math.sin(time*3)*.025):0;
 W.updateCarSpecialVisual=(car,c,dt,time)=>{const spec=car.model||{};
  if(spec.amphibious){const target=(c.waterMode||c.water)==='skimming'?1:0;car.retracted=W.mix(car.retracted||0,target,1-Math.exp(-dt*7));for(const w of car.wheels){w.pivot.position.x=w.side*.94*(1-car.retracted*.66);w.pivot.position.y=.39+car.retracted*.34;w.pivot.scale.setScalar(1-car.retracted*.75);w.pivot.visible=car.retracted<.98;}}
  if(spec.hover){car.lift=W.mix(car.lift||0,W.hoverHeight(spec,c,time),1-Math.exp(-dt*7));car.root.translateY(car.lift);if(car.contact)car.contact.position.y=-car.lift/(car.size||1)+.03;for(const rotor of car.rotors)rotor.rotation.y+=dt*(25+Math.min(100,Math.hypot(c.vx,c.vz)*4));}
 };
 const preview=W.carPreview;
 W.carPreview=m=>{if(!m.amphibious&&!m.hover&&m.id!=='vespera')return preview(m);const boat=m.amphibious;return `<svg viewBox="0 0 320 110" role="img" aria-label="${m.name}"><ellipse cx="160" cy="99" rx="140" ry="6" fill="#000" opacity=".18"/><path d="${boat?'M18 51 L111 48 L140 29 H181 L207 49 L303 36 L274 86 H50Z':'M16 78 L63 62 L118 52 L151 31 H204 L241 57 L293 71 L307 84 L280 92 H32Z'}" fill="${m.color}"/><path d="M121 51 L148 34 H190 L222 56Z" fill="#192f44"/><path d="M23 76 L285 78" stroke="#f1eee0" stroke-width="4"/>${boat?'<path d="M58 51 L79 66 H216 L251 48" fill="none" stroke="#544b35" stroke-width="4"/>':''}${m.hover?'<g stroke="#81efed" stroke-width="5"><path d="M47 89 L101 89 M60 82 L88 96 M225 89 L279 89 M238 82 L266 96"/></g><g fill="#23364a"><circle cx="74" cy="89" r="5"/><circle cx="252" cy="89" r="5"/></g>':'<g fill="#172027" stroke="#aebbc6" stroke-width="6"><circle cx="78" cy="84" r="16"/><circle cx="250" cy="84" r="16"/></g>'}<path d="M277 70 H297" stroke="#d8ffff" stroke-width="4"/></svg>`;};
})();
