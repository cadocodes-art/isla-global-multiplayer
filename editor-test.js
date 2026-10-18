/* V1.72: tab-local test positions never change a map's starting diamond. */
(()=>{'use strict';const C=IslaCommunity,M=IslaMaker,T=THREE;
 const key=id=>'isla-workshop-v172:'+ (C.account?.id||'guest')+':'+id;
 const signature=map=>{const text=JSON.stringify(M.validate(map));let n=2166136261;for(let i=0;i<text.length;i++)n=Math.imul(n^text.charCodeAt(i),16777619);return (n>>>0).toString(16);};
 C.rememberWorkshop=(id,map,state,start=null)=>{
  const data={version:1,signature:signature(map),state:structuredClone(state),start:structuredClone(start)};
  // Keep the complete view and recent undo history even in a storage-limited tab.
  for(;;){try{sessionStorage.setItem(key(id),JSON.stringify(data));return;}catch{
   if(data.state.undo?.length){data.state.undo.shift();continue;}if(data.state.redo?.length){data.state.redo.shift();continue;}
   throw Error('Allow browser storage to return to this editor view after testing. Your map is saved.');
  }}
 };
 C.readWorkshop=(id,map)=>{try{const d=JSON.parse(sessionStorage.getItem(key(id))||'null');if(d?.version!==1||d.signature!==signature(map))return null;return d;}catch{return null;}};
 C.makeTestStart=(map,point,normal,heading)=>{
  if(!point||![point.x,point.y,point.z,heading].every(Number.isFinite)||Math.abs(point.x)>map.size/2-2||Math.abs(point.z)>map.size/2-2)throw Error('Choose a spot inside the map.');
  const up=new T.Vector3(normal.x,normal.y,normal.z).normalize();if(![up.x,up.y,up.z].every(Number.isFinite)||up.y<.15)throw Error('Choose an upright road section or solid ground to start.');
  if(point.y<.15)throw Error('Choose dry ground or a road above the water.');
  const forward=new T.Vector3(Math.sin(heading),0,Math.cos(heading));forward.addScaledVector(up,-forward.dot(up)).normalize();
  return {x:point.x+up.x*.12,y:point.y+up.y*.12,z:point.z+up.z*.12,up:{x:up.x,y:up.y,z:up.z},forward:{x:forward.x,y:forward.y,z:forward.z}};
 };
 C.applyTestStart=(W,start)=>{
  if(!start)return false;const up=new T.Vector3(start.up?.x,start.up?.y,start.up?.z),forward=new T.Vector3(start.forward?.x,start.forward?.y,start.forward?.z);
  if(![start.x,start.y,start.z,...up.toArray(),...forward.toArray()].every(Number.isFinite)||Math.abs(up.length()-1)>.01||Math.abs(forward.length()-1)>.01||Math.abs(up.dot(forward))>.01||up.y<.15)return false;
  const right=new T.Vector3().crossVectors(up,forward).normalize(),euler=new T.Euler().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,forward),'YXZ'),hit=W.makerRoadContact?.(start,.35);
  Object.assign(W.vehicle,{x:start.x,y:start.y,z:start.z,vx:0,vy:0,vz:0,speed:0,yaw:euler.y,pitch:-euler.x,roll:euler.z,yawRate:0,steer:0,grounded:!!hit,roadMode:!!hit,roadFrame:hit?{up,forward}:null,ramp:null,airtime:0,waterMode:'dry',waterTime:0,skimTime:0});return true;
 };
})();
