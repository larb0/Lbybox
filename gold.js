/* Presentation layer: retains the existing BLE queue, framing and acknowledgements. */
const ICONS={home:'<path d="M3 10 12 3l9 7v10h-6v-6H9v6H3z"/>',sound:'<path d="M4 9v6m5-11v16m6-13v10m5-6v2"/>',lights:'<path d="M8 17c0-4-3-4-3-8a7 7 0 0 1 14 0c0 4-3 4-3 8M8 17h8m-7 4h6"/>',settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',outdoor:'<path d="m12 2 6 8h-3l5 7h-6v5h-4v-5H4l5-7H6z"/>',moon:'<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12z"/>',mute:'<path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6"/>',prev:'<path d="M5 5v14M19 5 7 12l12 7z"/>',next:'<path d="M19 5v14M5 5l12 7-12 7z"/>',play:'<path d="m8 4 12 8-12 8z"/>',pause:'<path d="M8 5v14M16 5v14"/>'};
function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[name]+'</svg>';}
const home=$('v-panel'), originalGroups=[...home.children].filter(e=>e.classList.contains('group'));
const [effects,lighting,volume,playback,bass]=originalGroups;
const audio=document.createElement('div');audio.className='gold-audio gold-card';
volume.classList.add('volume-group');playback.classList.add('transport-group');bass.classList.add('bass-group');
audio.append(volume,playback);
effects.classList.add('gold-effects');
effects.querySelector('h2').textContent='Lighting';
// The colour-state label originally lives in the separate Lights group header.
// Move it before removing that group so the main render loop still has its target.
const colorState = lighting.querySelector('#colorState');
if (colorState) effects.querySelector('.group-hd').append(colorState);
effects.append(lighting.querySelector('.card'));
lighting.remove();
bass.classList.add('gold-eq');bass.querySelector('h2').textContent='EQ profile';
home.replaceChildren(audio,effects,bass);
const nav=document.querySelector('.island');nav.setAttribute('aria-label','Main navigation');
nav.innerHTML=[['panel','Home','home'],['sound','Sound','sound'],['power','Settings','settings']].map(([v,t,i])=>'<button data-v="'+v+'"><span class="nav-icon">'+icon(i)+'</span>'+t+'</button>').join('');
const header=document.createElement('header');header.className='gold-header';header.innerHTML='<span class="gold-brand">LarbyBox</span>';
const statusBar=document.createElement('div');statusBar.className='gold-status';const battery=document.createElement('span');battery.className='battery-status';battery.append($('battPct'),document.createTextNode(' · '),$('chipV'));statusBar.append($('chipLink'),$('chipBt'),battery);header.append(nav,statusBar);document.body.prepend(header);
const oldChips=document.querySelector('.chips');oldChips.hidden=true;
const settingsTabs=document.createElement('div');settingsTabs.className='settings-tabs';settingsTabs.innerHTML='<button data-page="power">Power & system</button><button data-page="log">Activity</button><button data-page="adv">Advanced</button>';
document.querySelector('main').prepend(settingsTabs);
function goldNavigate(page){
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='v-'+page));
 const inSettings=['power','log','adv'].includes(page);
 nav.querySelectorAll('button').forEach(b=>{const on=b.dataset.v===(inSettings?'power':page);b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 settingsTabs.classList.toggle('on',inSettings);settingsTabs.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.page===page));
 window.scrollTo(0,0);
}
nav.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>goldNavigate(b.dataset.v)));
settingsTabs.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>goldNavigate(b.dataset.page)));
// Pairing stays available in settings, leaving the main transport uncluttered.
$('v-power').lastElementChild.append(playback.querySelector('[data-cmd=btpair]'));
playback.querySelectorAll('[data-cmd]').forEach(b=>{const c=b.dataset.cmd;b.innerHTML=icon(c);b.setAttribute('aria-label',c==='play'?'Play or pause':c==='prev'?'Previous track':'Next track');});
const dialShell=document.createElement('div');dialShell.className='dial-shell';
dialShell.innerHTML='<div class="dial" id="volumeDial" role="slider" tabindex="0" aria-label="Speaker volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><svg viewBox="0 0 300 300"><path class="dial-track" d="M 60.20 239.80 A 127 127 0 1 1 239.80 239.80"/><path id="dialFill" class="dial-fill" pathLength="100" d="M 60.20 239.80 A 127 127 0 1 1 239.80 239.80"/><circle id="dialThumb" class="dial-thumb" r="9"/></svg><div class="dial-readout"><small>Volume</small><div class="dial-value"><b id="dialValue" style="font-weight:500">0</b><span>%</span></div></div></div>';
$('ctl-vol').prepend(dialShell);$('vol').tabIndex=-1;$('vol').setAttribute('aria-hidden','true');
const dial=$('volumeDial');let dialDragging=false;
function drawDial(){const v=+$('vol').value,a=(135+v*2.7)*Math.PI/180;$('dialFill').style.strokeDasharray=v+' 100';$('dialThumb').setAttribute('cx',150+127*Math.cos(a));$('dialThumb').setAttribute('cy',150+127*Math.sin(a));$('dialValue').textContent=v;dial.setAttribute('aria-valuenow',v);dial.setAttribute('aria-valuetext',v+' percent');}
function setDial(v,commit){if(dial.getAttribute('aria-disabled')==='true')return;$('vol').value=Math.max(0,Math.min(100,Math.round(v)));$('vol').dispatchEvent(new Event('input'));drawDial();if(commit)$('vol').dispatchEvent(new Event('change'));}
function pointerVolume(e){const r=dial.getBoundingClientRect();let deg=Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)*180/Math.PI;deg=(deg-135+360)%360;if(deg>270)deg=deg>315?0:270;return deg/2.7;}
dial.addEventListener('pointerdown',e=>{if(e.button!==0||dial.getAttribute('aria-disabled')==='true')return;dialDragging=true;dial.focus();dial.setPointerCapture(e.pointerId);setDial(pointerVolume(e),false);});
dial.addEventListener('pointermove',e=>{if(dialDragging)setDial(pointerVolume(e),false);});
dial.addEventListener('pointerup',e=>{if(!dialDragging)return;setDial(pointerVolume(e),true);dialDragging=false;dial.releasePointerCapture(e.pointerId);});
dial.addEventListener('pointercancel',()=>{dialDragging=false;render();});
dial.addEventListener('keydown',e=>{let v=+$('vol').value;if(['ArrowUp','ArrowRight'].includes(e.key))v++;else if(['ArrowDown','ArrowLeft'].includes(e.key))v--;else if(e.key==='Home')v=0;else if(e.key==='End')v=100;else if(e.key==='PageUp')v+=10;else if(e.key==='PageDown')v-=10;else return;e.preventDefault();e.stopPropagation();setDial(v,true);});
$('vol').addEventListener('input',drawDial);$('vol').addEventListener('render',drawDial);

function goldReady(board){return (!!device?.gatt?.connected)&&(board==='s3'?!!state.linkS3:board==='bt'?!!state.linkBt:true);}
const legacyRender=render;
render=function(){legacyRender();const conn=!!device?.gatt?.connected,ready=goldReady('s3'); $('connectOverlay').classList.toggle('hidden',conn);
 // No disconnected or absent-board actions; native disabled state also covers keyboard users.
 document.querySelectorAll('main button,main input,main select').forEach(el=>{const g=el.closest('[data-board]');el.disabled=!conn||(g&&!goldReady(g.dataset.board))||!!el.closest('.missing');});
 document.querySelectorAll('.settings-tabs button').forEach(b=>b.disabled=false);
 dial.setAttribute('aria-disabled',!ready);dial.tabIndex=ready?0:-1;
 const volPending=[...pending.values()].some(p=>p.key==='vol');
 if(!dialDragging&&!volPending&&Number.isFinite(state.vol)){$('vol').value=state.vol;drawDial();}
 else if(!conn){$('vol').value=0;drawDial();}
 if(Number.isFinite(state.stbass)&&![...pending.values()].some(p=>p.key==='stbass'))document.querySelectorAll('#bassSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.v===state.stbass));
 $('brightVal').textContent=Math.round(+$('bright').value/255*100)+'%';
 document.querySelectorAll('input[type=range]').forEach(el=>el.style.setProperty('--fill',((+el.value-+el.min)/(+el.max-+el.min)*100)+'%'));
 const playButton=playback.querySelector('.play');playButton.innerHTML=icon(state.playing?'pause':'play');playButton.setAttribute('aria-label',state.playing?'Pause':'Play');const transportPending=[...pending.values()].some(p=>['play','next','prev'].includes(p.key));playback.querySelectorAll('[data-cmd]').forEach(b=>b.disabled=!goldReady('bt')||state.bt===false||state.avrc===false||transportPending);
};
document.querySelectorAll('input[type=range]').forEach(el=>el.addEventListener('input',()=>{el.style.setProperty('--fill',((+el.value-+el.min)/(+el.max-+el.min)*100)+'%');if(el.id==='bright')$('brightVal').textContent=Math.round(+el.value/255*100)+'%';}));
goldNavigate('panel');render();
// Confirmed command values should be shown immediately, before the next heartbeat.
const legacyResolveAck=resolveAck;
resolveAck=function(a){const p=pending.get(a.seq);if(p&&['ok','clamp'].includes(a.r)){const n=Number(a.v),k=p.key;if(Number.isFinite(n)){if(['vol','stbass','ledbright','ledcolor','ledpreset','sfxvol'].includes(k))state[k]=n;else if(/^b[0-2][bt]$/.test(k))state[k]=n;if(k==='ledpreset'){state.ledpname=state.ledlist?.[n];state.ledusescolor=!NO_COLOR.includes(state.ledpname);}}}legacyResolveAck(a);};
render();

// One command per click. Await the board reply instead of pretending the phone changed state.
function sendTransport(command){
 if(!goldReady('bt')){setCtl('transport','gone','The Bluetooth board is offline.');return;}
 if(state.bt===false){setCtl('transport','gone','Connect your music device to LarbyBox first.');return;}
 if(state.avrc===false){setCtl('transport','gone','Media controls are not connected yet. Reconnect your music device.');return;}
 if([...pending.values()].some(p=>['play','next','prev'].includes(p.key)))return;
 send(command,'1','transport','1');render();
}
const transportSetCtl=setCtl;
setCtl=function(id,status,message){
 if(id==='transport'&&status==='gone')message='Media controls unavailable. Check the music device and Bluetooth-board connection.';
 transportSetCtl(id,status,message);
 if(id==='transport')setTimeout(()=>render(),0);
};
const transportResolveAck=resolveAck;
resolveAck=function(a){const p=pending.get(a.seq);transportResolveAck(a);if(p&&['play','next','prev'].includes(p.key)&&a.r==='ok'){
 $('msg-transport').textContent=p.key==='next'?'Next track requested.':p.key==='prev'?'Previous track requested.':'Playback command sent.';
}};
