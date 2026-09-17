/* Presentation layer: retains the existing BLE queue, framing and acknowledgements. */
const ICONS={home:'<path d="M3 10 12 3l9 7v10h-6v-6H9v6H3z"/>',sound:'<path d="M4 9v6m5-11v16m6-13v10m5-6v2"/>',lights:'<path d="M8 17c0-4-3-4-3-8a7 7 0 0 1 14 0c0 4-3 4-3 8M8 17h8m-7 4h6"/>',settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',outdoor:'<path d="m12 2 6 8h-3l5 7h-6v5h-4v-5H4l5-7H6z"/>',moon:'<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12z"/>',mute:'<path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6"/>',prev:'<path d="M5 5v14M19 5 7 12l12 7z"/>',next:'<path d="M19 5v14M5 5l12 7-12 7z"/>',play:'<path d="m8 4 12 8-12 8z"/>',pause:'<path d="M8 5v14M16 5v14"/>'};
function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[name]+'</svg>';}
const home=$('v-panel'), originalGroups=[...home.children].filter(e=>e.classList.contains('group'));
const [effects,lighting,volume,playback,bass]=originalGroups;
const audio=document.createElement('div');audio.className='gold-audio gold-card';
volume.classList.add('volume-group');playback.classList.add('transport-group');bass.classList.add('bass-group');lighting.classList.add('gold-light');
audio.append(volume,playback,bass);home.replaceChildren(audio,lighting);
const lightsView=document.createElement('section');lightsView.id='v-lights';lightsView.className='view';
const hero=document.querySelector('.hero');lightsView.append(hero,effects);document.querySelector('main').append(lightsView);
const nav=document.querySelector('.island');nav.setAttribute('aria-label','Main navigation');
nav.innerHTML=[['panel','Home','home'],['sound','Sound','sound'],['lights','Lights','lights'],['power','Settings','settings']].map(([v,t,i])=>'<button data-v="'+v+'"><span class="nav-icon">'+icon(i)+'</span>'+t+'</button>').join('');
const header=document.createElement('header');header.className='gold-header';header.innerHTML='<span class="gold-brand">LarbyBox</span>';
const statusBar=document.createElement('div');statusBar.className='gold-status';statusBar.append($('chipLink'),$('chipBt'),$('battPct'));header.append(nav,statusBar);document.body.prepend(header);
const oldChips=document.querySelector('.chips');oldChips.hidden=true;
const settingsTabs=document.createElement('div');settingsTabs.className='settings-tabs';settingsTabs.innerHTML='<button data-page="power">Power & system</button><button data-page="log">Activity</button><button data-page="adv">Advanced</button>';
document.querySelector('main').prepend(settingsTabs);
function goldNavigate(page){
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='v-'+page));
 const inSettings=['power','log','adv'].includes(page);
 nav.querySelectorAll('button').forEach(b=>{const on=b.dataset.v===(inSettings?'power':page);b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 settingsTabs.classList.toggle('on',inSettings);settingsTabs.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.page===page));
 if(page==='lights')lightsView.append(lighting);else home.insertBefore(lighting,home.querySelector('.scenes-card'));
 window.scrollTo(0,0);
}
nav.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>goldNavigate(b.dataset.v)));
settingsTabs.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>goldNavigate(b.dataset.page)));
// Pairing stays available in settings, leaving the main transport uncluttered.
$('v-power').lastElementChild.append(playback.querySelector('[data-cmd=btpair]'));
playback.querySelectorAll('[data-cmd]').forEach(b=>{const c=b.dataset.cmd;b.innerHTML=icon(c);b.setAttribute('aria-label',c==='play'?'Play or pause':c==='prev'?'Previous track':'Next track');});
const dialShell=document.createElement('div');dialShell.className='dial-shell';
dialShell.innerHTML='<div class="dial" id="volumeDial" role="slider" tabindex="0" aria-label="Speaker volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><svg viewBox="0 0 300 300"><path class="dial-track" d="M 60.20 239.80 A 127 127 0 1 1 239.80 239.80"/><path id="dialFill" class="dial-fill" pathLength="100" d="M 60.20 239.80 A 127 127 0 1 1 239.80 239.80"/><circle id="dialThumb" class="dial-thumb" r="9"/></svg><div class="dial-readout"><small>Volume</small><div class="dial-value"><b id="dialValue" style="font-weight:500">0</b><span>%</span></div></div></div><button id="dialMute" class="dial-mute" aria-label="Mute volume" title="Mute volume">'+icon('mute')+'</button>';
$('ctl-vol').prepend(dialShell);$('vol').tabIndex=-1;$('vol').setAttribute('aria-hidden','true');
const dial=$('volumeDial');let dialDragging=false,restoreVolume=42,selectedScene='';
function drawDial(){const v=+$('vol').value,a=(135+v*2.7)*Math.PI/180;$('dialFill').style.strokeDasharray=v+' 100';$('dialThumb').setAttribute('cx',150+127*Math.cos(a));$('dialThumb').setAttribute('cy',150+127*Math.sin(a));$('dialValue').textContent=v;dial.setAttribute('aria-valuenow',v);dial.setAttribute('aria-valuetext',v+' percent');$('dialMute').classList.toggle('on',v===0);$('dialMute').setAttribute('aria-label',v===0?'Restore volume':'Mute volume');}
function setDial(v,commit){if(dial.getAttribute('aria-disabled')==='true')return;$('vol').value=Math.max(0,Math.min(100,Math.round(v)));$('vol').dispatchEvent(new Event('input'));drawDial();if(commit)$('vol').dispatchEvent(new Event('change'));}
function pointerVolume(e){const r=dial.getBoundingClientRect();let deg=Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)*180/Math.PI;deg=(deg-135+360)%360;if(deg>270)deg=deg>315?0:270;return deg/2.7;}
dial.addEventListener('pointerdown',e=>{if(e.button!==0||dial.getAttribute('aria-disabled')==='true')return;dialDragging=true;dial.focus();dial.setPointerCapture(e.pointerId);setDial(pointerVolume(e),false);});
dial.addEventListener('pointermove',e=>{if(dialDragging)setDial(pointerVolume(e),false);});
dial.addEventListener('pointerup',e=>{if(!dialDragging)return;setDial(pointerVolume(e),true);dialDragging=false;dial.releasePointerCapture(e.pointerId);});
dial.addEventListener('pointercancel',()=>{dialDragging=false;render();});
dial.addEventListener('keydown',e=>{let v=+$('vol').value;if(['ArrowUp','ArrowRight'].includes(e.key))v++;else if(['ArrowDown','ArrowLeft'].includes(e.key))v--;else if(e.key==='Home')v=0;else if(e.key==='End')v=100;else if(e.key==='PageUp')v+=10;else if(e.key==='PageDown')v-=10;else return;e.preventDefault();e.stopPropagation();setDial(v,true);});
$('vol').addEventListener('input',drawDial);$('vol').addEventListener('render',drawDial);
$('dialMute').addEventListener('click',()=>{const v=+$('vol').value;if(v>0){restoreVolume=v;setDial(0,true);}else setDial(restoreVolume,true);});
const effectSelect=document.createElement('select');effectSelect.id='homeEffect';effectSelect.className='effect-select';effectSelect.setAttribute('aria-label','Lighting effect');lighting.querySelector('.group-hd').append(effectSelect);lighting.querySelector('h2').textContent='Lighting';
effectSelect.addEventListener('change',()=>send('ledpreset',effectSelect.value,'ledpreset',effectSelect.value));
// Keep effect acknowledgements visible next to the Home effect selector.
lighting.append($('ctl-ledpreset'));
const sceneCard=document.createElement('div');sceneCard.className='scenes-card gold-card';sceneCard.innerHTML='<div class="group-hd"><h2>Favourite scenes</h2></div><div class="scene-grid" id="sceneGrid"></div><div class="scene-manage"><span>Sound & lights · volume stays yours</span><button class="text-button" id="saveScene">Save current</button></div><p class="scene-note" id="sceneNote" role="status"></p>';home.append(sceneCard);
const sceneDefaults=[{name:'Everyday',icon:'sun',bass:0,effect:'basspulse',colour:'gold',brightness:178},{name:'Outdoor',icon:'outdoor',bass:1,effect:'huedrift',colour:'gold',brightness:210},{name:'Evening',icon:'moon',bass:0,effect:'breathe',colour:'gold',brightness:55}];
let scenes=sceneDefaults.map(x=>({...x}));
try{const saved=JSON.parse(localStorage.getItem('larbybox.gold.scenes'));if(Array.isArray(saved)&&saved.length===3&&saved.every(s=>s&&typeof s.name==='string'&&s.name.length<=24&&[0,1,2].includes(s.bass)&&typeof s.effect==='string'&&typeof s.colour==='string'&&Number.isFinite(s.brightness)&&s.brightness>=0&&s.brightness<=255))scenes=saved;}catch{}
function drawScenes(){const grid=$('sceneGrid');grid.replaceChildren();scenes.forEach((s,i)=>{const b=document.createElement('button');b.className='scene-button';b.dataset.index=i;b.innerHTML=icon(['sun','outdoor','moon'][i]);const text=document.createElement('span');text.textContent=s.name;b.append(text);b.addEventListener('click',()=>applyScene(i));grid.append(b);});}
function applyScene(i){if(!goldReady('s3')||!goldReady('led'))return;const s=scenes[i],fx=state.ledlist?.indexOf(s.effect),col=state.ledcolors?.indexOf(s.colour);if(!(fx>=0&&col>=0)){$('sceneNote').textContent='Waiting for the speaker’s effects and colours.';return;}
 selectedScene=s.name;send('stbass',s.bass,'stbass',s.bass);send('ledpreset',fx,'ledpreset',fx);send('ledcolor',col,'ledcolor',col);send('ledbright',s.brightness,'ledbright',s.brightness);$('sceneNote').textContent='Applying '+s.name+'…';}
const dialog=document.createElement('dialog');dialog.id='sceneDialog';dialog.innerHTML='<form method="dialog" id="sceneForm"><h2>Save a scene</h2><p class="hint">Save the current bass profile, lighting effect, colour and brightness on this device. Volume is not included.</p><label for="sceneSlot">Replace scene</label><select id="sceneSlot"></select><label for="sceneName">Scene name</label><input id="sceneName" required maxlength="24" autocomplete="off"><div class="dialog-actions"><button type="button" id="cancelScene">Cancel</button><button type="submit">Save scene</button></div></form>';document.body.append(dialog);
$('saveScene').addEventListener('click',()=>{$('sceneSlot').replaceChildren(...scenes.map((s,i)=>new Option(s.name,i)));$('sceneName').value=scenes[0].name;dialog.showModal();});$('sceneSlot').addEventListener('change',()=>{$('sceneName').value=scenes[+$('sceneSlot').value].name;});$('cancelScene').addEventListener('click',()=>dialog.close());
$('sceneForm').addEventListener('submit',e=>{e.preventDefault();const name=$('sceneName').value.trim();if(!name)return;const s={name,bass:state.stbass,effect:state.ledpname,colour:state.ledcolors?.[state.ledcolor],brightness:state.ledbright};if(!goldReady('s3')||!goldReady('led')||!Number.isFinite(s.bass)||!s.effect||!s.colour||!Number.isFinite(s.brightness)){dialog.close();$('sceneNote').textContent='Connect and wait for the current settings first.';return;}const updated=scenes.map((x,i)=>i===+$('sceneSlot').value?s:x);try{localStorage.setItem('larbybox.gold.scenes',JSON.stringify(updated));scenes=updated;drawScenes();dialog.close();$('sceneNote').textContent='Saved on this device.';render();}catch{dialog.close();$('sceneNote').textContent='Could not save: browser storage is unavailable.';}});
function goldReady(board){return (demo||!!device?.gatt?.connected)&&(board==='s3'?!!state.linkS3:board==='bt'?!!state.linkBt:true);}
const legacyRender=render;
render=function(){legacyRender();const conn=demo||!!device?.gatt?.connected,ready=goldReady('s3');
 // No disconnected or absent-board actions; native disabled state also covers keyboard users.
 document.querySelectorAll('main button,main input,main select').forEach(el=>{const g=el.closest('[data-board]');el.disabled=!conn||(g&&!goldReady(g.dataset.board))||!!el.closest('.missing');});
 document.querySelectorAll('.settings-tabs button').forEach(b=>b.disabled=false);
 dial.setAttribute('aria-disabled',!ready);dial.tabIndex=ready?0:-1;$('dialMute').disabled=!ready;
 const volPending=[...pending.values()].some(p=>p.key==='vol');
 if(!dialDragging&&!volPending&&Number.isFinite(state.vol)){$('vol').value=state.vol;drawDial();}
 else if(!conn){$('vol').value=0;drawDial();}
 if(Number.isFinite(state.stbass)&&![...pending.values()].some(p=>p.key==='stbass'))document.querySelectorAll('#bassSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.v===state.stbass));
 const names=state.ledlist||[];if(effectSelect.dataset.names!==JSON.stringify(names)){effectSelect.replaceChildren(...(names.length?names.map((n,i)=>new Option(label(n),i)):[new Option('Connect for effects','')]));effectSelect.dataset.names=JSON.stringify(names);}
 if(state.ledpreset!==undefined)effectSelect.value=state.ledpreset;
 $('brightVal').textContent=Math.round(+$('bright').value/255*100)+'%';
 document.querySelectorAll('input[type=range]').forEach(el=>el.style.setProperty('--fill',((+el.value-+el.min)/(+el.max-+el.min)*100)+'%'));
 $('saveScene').disabled=!ready||!conn;document.querySelectorAll('.scene-button').forEach((b,i)=>{const s=scenes[i];b.disabled=!ready||!conn;const match=ready&&state.stbass===s.bass&&state.ledpname===s.effect&&state.ledcolors?.[state.ledcolor]===s.colour&&state.ledbright===s.brightness;b.classList.toggle('on',match);b.setAttribute('aria-pressed',match);if(match&&selectedScene===s.name){$('sceneNote').textContent=s.name+' applied.';selectedScene='';}});
 const failed=['stbass','ledpreset','ledcolor','ledbright'].some(id=>['bad','gone'].includes($('ctl-'+id)?.dataset.s));if(selectedScene&&failed){$('sceneNote').textContent='Some scene settings were not confirmed. Check the connection and try again.';selectedScene='';}
 $('demoBtn').disabled=!!device?.gatt?.connected;
 playback.querySelector('.play').innerHTML=state.playing!==undefined?icon(state.playing?'pause':'play'):icon('play');
};
document.querySelectorAll('input[type=range]').forEach(el=>el.addEventListener('input',()=>{el.style.setProperty('--fill',((+el.value-+el.min)/(+el.max-+el.min)*100)+'%');if(el.id==='bright')$('brightVal').textContent=Math.round(+el.value/255*100)+'%';}));
drawScenes();goldNavigate('panel');render();
// Confirmed command values should be shown immediately, before the next heartbeat.
const legacyResolveAck=resolveAck;
resolveAck=function(a){const p=pending.get(a.seq);if(p&&['ok','clamp'].includes(a.r)){const n=Number(a.v),k=p.key;if(Number.isFinite(n)&&['vol','stbass','ledbright','ledcolor','ledpreset'].includes(k)){state[k]=n;if(k==='ledpreset'){state.ledpname=state.ledlist?.[n];state.ledusescolor=!NO_COLOR.includes(state.ledpname);}}}legacyResolveAck(a);};
// A microphone section is unavailable until the speaker reports installed hardware.
const goldRender=render;
render=function(){document.querySelectorAll('[data-requires=mics]').forEach(g=>g.classList.toggle('missing',!state.mics));goldRender();};
render();
const legacySetCtl=setCtl;
setCtl=function(id,status,message){legacySetCtl(id,status,message);if(selectedScene&&['stbass','ledpreset','ledcolor','ledbright'].includes(id)&&['bad','gone'].includes(status)){$('sceneNote').textContent='Some scene settings were not confirmed. Check the connection and try again.';selectedScene='';}};
