/* Connection gate and installed-app updates. */
const gate=document.getElementById('connectionGate');
let everConnected=false, updatePending=false, refreshing=false;
gate.addEventListener('cancel',e=>e.preventDefault());
function updateConnectionGate(message){
 const ready=connectionReady && !!device?.gatt?.connected;
 if(ready){
  everConnected=true;
  if(gate.open){gate.close();document.getElementById('volumeDial')?.focus();}
 }else{
  if(!gate.open)gate.showModal();
  const supported=!!navigator.bluetooth && isSecureContext;
  document.getElementById('connectionTitle').textContent=everConnected?'Reconnect your speaker':'Connect your speaker';
  document.getElementById('connectBtn').disabled=connecting||!supported;
  document.getElementById('connectBtn').textContent=connecting?'Connecting…':everConnected?'Reconnect':'Connect to LarbyBox';
  document.getElementById('connectionMessage').textContent=!supported
   ? 'Open this app over HTTPS in a browser with Web Bluetooth, such as Chrome on Android or a supported desktop. This browser cannot connect.'
   : message || (connecting?'Connecting to your speaker…':everConnected?'The speaker disconnected. Turn it on and reconnect.':'Turn on LarbyBox, then connect to its controls.');
 }
 document.getElementById('disconnectControl').disabled=!ready;
 document.getElementById('controlConnectionStatus').textContent=ready?'Speaker controls connected':'Speaker controls disconnected';
 applyPendingUpdate();
}
const connectionSettings=document.createElement('div');
connectionSettings.className='group';
connectionSettings.innerHTML='<h2>App connection</h2><p id="controlConnectionStatus"></p><button id="disconnectControl">Disconnect controls</button><p id="appUpdateStatus" role="status"></p><small>App build: connection-20260922-1</small>';
document.getElementById('v-power').prepend(connectionSettings);
document.getElementById('disconnectControl').addEventListener('click',()=>device?.gatt?.disconnect());
const renderBeforeGate=render;
render=function(){renderBeforeGate();updateConnectionGate();};
function applyPendingUpdate(){
 if(!updatePending||refreshing)return;
 if(connecting||connectionReady){
  document.getElementById('appUpdateStatus').textContent='App update ready. It will apply after you disconnect controls.';
  return;
 }
 refreshing=true;location.reload();
}
if('serviceWorker' in navigator){
 let controlled=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(controlled){updatePending=true;applyPendingUpdate();}
  controlled=true;
 });
 window.addEventListener('load',async()=>{
  try{
   const registration=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});
   const check=()=>registration.update().catch(()=>{});
   check();
   document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
   window.addEventListener('online',check);
   setInterval(check, 5*60*1000);
  }catch(e){console.info('Offline caching unavailable:',e.message);}
 });
}
render();
