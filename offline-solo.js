/* Local adapter: the standalone file never connects to the multiplayer server. */
(()=>{'use strict';const W=Isla,noop=()=>{},no=()=>false;
 W.net={active:false,connected:false,id:'local',code:'SOLO',host:'',players:[],remotes:new Map(),tick:noop,renderChat:noop,dismissChat:noop,toggleChat:noop,chatOpen:no,panelOpen:no,closePanel:no,leave:noop};
 W.initMultiplayer=()=>{document.getElementById('roomBtn').onclick=()=>IslaCommunity.offlineInfo();};
})();
