/* Direct adapters for the same model factories used by the Playplace. */
(()=>{'use strict';const A=IslaMakerAssets,T=THREE,V=IslaV24,P=IslaPlayModels,old=A.object;A.object=(o,height,editor=false)=>{if(!V.kinds[o.type])return old(o,height,editor);const g=new T.Group();g.userData.objectId=o.id;g.userData.dynamic=true;g.position.set(o.x,height(o.x,o.z)+o.y,o.z);g.rotation.set(o.pitch||0,o.rotation,o.roll||0,'YXZ');g.scale.setScalar(o.scale);let model;
 if(['basketball','soccerball','bowlingball'].includes(o.type)){model=P.ball({basketball:'basketball',soccerball:'soccer',bowlingball:'bowling'}[o.type],V.kinds[o.type].w/2);model.position.y=V.kinds[o.type].h/2;}
 else if(o.type==='foam'){model=P.foam();model.position.y=2.1;}
 else model=P[o.type]();g.add(model);if(o.type==='seesaw')g.userData.plank=model.userData.plank;if(o.type==='cannon')g.userData.aimGroup=model;
 if(o.customColor)model.traverse(m=>{if(m.userData.paintable&&m.material){m.material=m.material.clone();m.material.color.set(o.color).convertSRGBToLinear();}});return g;};})();
