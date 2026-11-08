/* Compact deterministic geometry used by rendering, driving, coins and the server. */
(()=>{'use strict';const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t,smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t);},TAU=Math.PI*2;
 const surface={width:3200,depth:2400,cx:700,cz:-120,radius:580,crater:100},vent={width:2240,depth:1680,radius:150,pillar:42,lava:20,floor:30};
 const xy=(u,v)=>({x:(u-.5)*surface.width,z:(v-.5)*surface.depth});
 const river=[[0,.12],[.10,.23],[.19,.24],[.27,.17],[.34,.06],[.42,.025],[.51,.05],[.55,-.04]].map(p=>xy(...p));
 function segment(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1),0,1),px=a.x+dx*t,pz=a.z+dz*t;return {d:Math.hypot(x-px,z-pz),t,x:px,z:pz,dx,dz};}
 const lakes=[{x:780,z:790,rx:155,rz:120,y:26},{x:-845,z:1120,rx:50,rz:37,y:26}];
 function lavaSurface(x,z){return lakes.find(p=>((x-p.x)/p.rx)**2+((z-p.z)/p.rz)**2<1);}
 function surfaceHeight(x,z){const r=Math.hypot(x-surface.cx,(z-surface.cz)*1.05);let h=34+3*Math.sin(x*.004)*Math.cos(z*.003)+470*Math.exp(-((r/360)**2))+105*Math.exp(-(((x-1210)/130)**2+((z+850)/150)**2));let d=Infinity;for(let i=1;i<river.length;i++)d=Math.min(d,segment(x,z,river[i-1],river[i]).d);h-=19*(1-smooth(8,34,d));if(r<140)h=mix(-45,h,smooth(72,140,r));for(const p of lakes){const t=Math.hypot((x-p.x)/p.rx,(z-p.z)/p.rz);if(t<1.3)h=mix(14,h,smooth(.72,1.3,t));}return h;}
 const nodes=[],edges=[],entrances=[];const point=(r,a,y=30)=>({x:Math.cos(a)*r,z:Math.sin(a)*r*.72,y});
 function edge(a,b,w=24,bridge=false){const e={a,b,w,bridge,id:edges.length};edges.push(e);return e;}
 for(let i=0;i<6;i++){const a=-Math.PI/2+i*TAU/6,entry=point(190,a),mid=point(460,a+.16,28-i%3*3),outer=point(890,a,24-i%2*6);entrances.push(entry);nodes.push([entry,mid,outer]);edge({x:0,z:0,y:30},entry,12,true);edge(entry,mid,24+i%3*5);const kink=point(670,a-.15,22);edge(mid,kink,26,i%2===0);edge(kink,outer,22+i%2*10);const end=point(1030,a+.12,outer.y);edge(outer,end,20);}
 for(let i=0;i<6;i++){edge(nodes[i][1],nodes[(i+1)%6][1],22,i%2===1);edge(nodes[i][2],nodes[(i+1)%6][2],26,i===2||i===5);}
 const pools=edges.filter(e=>e.bridge&&e.id>=6).map(e=>({x:(e.a.x+e.b.x)/2,z:(e.a.z+e.b.z)/2,rx:42,rz:38,y:8}));
 function corridor(x,z,margin=0){let best=null;for(const e of edges){const s=segment(x,z,e.a,e.b);const width=e.id<30&&e.bridge&&Math.hypot(e.a.x,e.a.z)===0?24:e.w;if(s.d<=width/2-margin&&(!best||s.d<best.d))best={...s,e,y:mix(e.a.y,e.b.y,s.t),width};}return best;}
 function ventLava(x,z){if(Math.hypot(x,z/.72)<190)return 20;const p=pools.find(p=>((x-p.x)/p.rx)**2+((z-p.z)/p.rz)**2<1);return p?.y??null;}
 const platforms=edges.filter(e=>e.bridge&&e.a.x!==0&&e.a.z!==0).map(e=>({x:(e.a.x+e.b.x)/2,z:(e.a.z+e.b.z)/2,y:(e.a.y+e.b.y)/2,w:24,d:24}));
 function ventFloor(x,z){const platform=platforms.find(p=>Math.abs(x-p.x)<p.w/2&&Math.abs(z-p.z)<p.d/2);if(platform)return platform.y;if(Math.hypot(x,z)<vent.pillar)return 30;const c=corridor(x,z);if(!c)return 2;const lava=ventLava(x,z);if(lava!==null&&(c.d>6||!c.e.bridge&&Math.hypot(x,z/.72)<190))return 2;return c.y;}
 function interior(x,z,margin=0){return Math.hypot(x,z/.72)<190-margin||platforms.some(p=>Math.abs(x-p.x)<p.w/2-margin&&Math.abs(z-p.z)<p.d/2-margin)||!!corridor(x,z,margin);}
 function ceiling(x,z){const r=Math.hypot(x,z/.72);return r<190?Math.min(180,65+(190-r)*115/98):((corridor(x,z)?.y??30)+30);}
 function height(map,x,z){return map==='inferno-vent'?ventFloor(x,z):surfaceHeight(x,z);}
 function safe(map,x,z){if(map==='inferno-vent')return interior(x,z,3)&&ventFloor(x,z)>((ventLava(x,z)??0)+3);return !lavaSurface(x,z)&&Math.hypot(x-surface.cx,z-surface.cz)>145&&Math.abs(x)<1575&&Math.abs(z)<1175;}
 function coins(map,random,buildings=[]){const result=[];for(let k=0;k<120000&&result.length<240;k++){let x,z;if(map==='inferno-vent'){const e=edges[Math.floor(random()*edges.length)],t=random(),s=segment(0,0,e.a,e.b),len=Math.hypot(s.dx,s.dz)||1,off=(random()-.5)*(e.bridge?7:e.w-8);x=mix(e.a.x,e.b.x,t)+s.dz/len*off;z=mix(e.a.z,e.b.z,t)-s.dx/len*off;}else{x=(random()-.5)*surface.width;z=(random()-.5)*surface.depth;}x=Math.round(x*100)/100;z=Math.round(z*100)/100;if(!safe(map,x,z))continue;const y=height(map,x,z);if(Math.abs(height(map,x+2,z)-y)>3||Math.abs(height(map,x,z+2)-y)>3||result.some(c=>Math.hypot(c.x-x,c.z-z)<8)||buildings.some(b=>Math.hypot(b.x-x,b.z-z)<Math.hypot(b.w,b.d)/2+4))continue;result.push({id:result.length,x,z,y:Math.round((y+.8)*100)/100,value:result.length<5?10:random()<.2?5:1,placement:'ground'});}return result;}
 const I={surface,vent,xy,river,lakes,edges,nodes,entrances,pools,platforms,segment,lavaSurface,surfaceHeight,ventFloor,ventLava,corridor,interior,ceiling,height,safe,coins};globalThis.IslaInferno=I;if(typeof module!=='undefined'&&module.exports)module.exports=I;
})();
