/* Layout v2.9: move existing controls without replacing their bound elements. */
(() => {
 const main=document.querySelector('main'), sound=$('v-sound'), advanced=$('v-adv');
 const lights=document.createElement('section'); lights.id='v-lights'; lights.className='view'; lights.dataset.title='Lighting'; main.append(lights);
 const groups=[...advanced.querySelectorAll(':scope > .group')];
 const findGroup=title=>groups.find(g=>g.querySelector('h2')?.textContent===title);
 function category(title, nodes, board){
  const d=document.createElement('details'); d.className='group settings-category';
  if(board)d.dataset.board=board;
  const summary=document.createElement('summary');summary.textContent=title;
  const body=document.createElement('div');body.className='category-body';body.append(...nodes);
  d.append(summary,body);return d;
 }
 function fold(group){
  const title=group.querySelector('h2').textContent;
  const heading=group.querySelector('.group-hd');heading.remove();
  const d=category(title,[...group.childNodes],group.dataset.board);
  group.replaceWith(d);return d;
 }
 const response=findGroup('Light response'), behaviour=findGroup('Light behaviour');
 const tuning=findGroup('Tuning');
 const loadDSP=tuning.querySelector('[data-cmd=tGet]');
 const loadLights=behaviour.querySelector('[data-cmd=ltGet]');
 const saving=$('savedPill').closest('.group');
 // Reset actions are deliberately separate from everyday save controls.
 const reset=$('ctl-reset');
 $('v-power').append(category('Restore defaults',[reset], 's3'));
 const oldSave=$('ctl-save');oldSave.querySelector('button').remove();
 const tuneStatus=$('ctl-tSave');
 const ledStatus=document.createElement('div');ledStatus.className='ctl';ledStatus.id='ctl-ltSave';
 ledStatus.innerHTML='<div class="state"></div><div class="ctl-msg" id="msg-ltSave"></div>';
 const statusStore=document.createElement('div');statusStore.hidden=true;
 statusStore.append(oldSave,tuneStatus,ledStatus,$('savedPill'));main.append(statusStore);
 saving.remove();
 const soundCategories=[...sound.querySelectorAll(':scope > .group')].map(fold);
 for(const title of ['Compressor','Loudness contour','Sustained-level backoff & limiter']){
  const group=findGroup(title);sound.append(group);soundCategories.push(fold(group));
 }
 const battery=findGroup('Battery warnings');$('v-power').append(battery);fold(battery);
 function take(ids){return ids.map(id=>{const el=$('ctl-'+id);if(!el)throw new Error('Missing setting '+id);return el;});}
 // Settings that affect EVERY effect sit in one always-visible group at the
 // top, not folded away. Each part keeps its own board tag, so the music
 // sensitivity controls still grey out when the DSP board is offline.
 function subsection(title, nodes, board){
  const s=document.createElement('div');s.className='global-sub';
  if(board)s.dataset.board=board;
  const h=document.createElement('h3');h.textContent=title;
  s.append(h,...nodes);return s;
 }
 const globalLights=document.createElement('div');globalLights.className='group global-lights';
 globalLights.innerHTML='<div class="group-hd"><h2>All effects</h2></div>';
 globalLights.append(
  subsection('Music sensitivity',take(['tSpecBass','tSpecMid','tSpecTreb','tSpecFloor','tSpecRel','tSpecBassHz']),'s3'),
  subsection('Reaction smoothing',take(['lEnvAtk','lEnvRel'])),
  subsection('Idle behaviour',take(['lIdleMs','lIdleBr'])));
 // Bass Pulse: one group. Its frequency range lives on the DSP board, so
 // that part is wrapped with the s3 tag on its own.
 const pulseRange=document.createElement('div');pulseRange.dataset.board='s3';
 pulseRange.append(...take(['tPulseLo','tPulseHi']));
 const lightCategories=[
  category('Bass Pulse',[pulseRange,...take(['lBassGate','lBassRel','lBassFloor'])]),
  category('Colour Flow',take(['lFlowBr','lFlowTrig','lFlowGlint'])),
  category('Waves',take(['lWaveMs','lWaveWid','lWaveMusic'])),
  category('Strobe',take(['lStrHzLo','lStrHzHi','lStrTrig','lStrPulse','lStrGap'])),
  category('Comet',take(['lCometMs','lCometTail','lCometBass'])),
  category('Sparkle',take(['lSparkle','lFade','lSparkTrig']))
 ];
 lights.append(globalLights,...lightCategories);
 // Preserve any future, unclassified advanced groups under Settings.
 for(const group of [...advanced.querySelectorAll(':scope > .group')]){
  if([tuning,response,behaviour].includes(group))continue;
  $('v-power').append(group);fold(group);
 }
 advanced.remove();
 const saveButtons=[],messages=[];
 let saveResults=null;
 // Order matters. ltSave writes ~25 values to the LED board's flash, and
 // while a flash write runs that board can't service its UART - the S3's
 // replies to save/tSave, arriving in the middle of it, were being lost, so
 // the app reported "incomplete" even when every board had saved. Running
 // the three one at a time, LED-only work first, keeps replies out of that
 // window.
 const saveCommands=['ltSave','save','tSave'];
 const saveNames={ltSave:'lighting tuning',save:'sound & lighting settings',tSave:'sound tuning'};
 function paintSave(){
  const busy=saveResults&&Object.values(saveResults).includes('pending');
  const ready=goldReady('s3');
  saveButtons.forEach(b=>{b.disabled=!ready||!!busy;b.textContent=busy?'Saving…':'Save settings & tuning';});
  let message='Saves sound and lighting, including tuning, for the next startup.';
  if(saveResults){
   if(busy)message='Waiting for the speaker to confirm all settings.';
   else if(Object.values(saveResults).every(s=>s==='ok'))message='Sound and lighting settings and tuning saved.';
   else{
    const failed=saveCommands.filter(k=>saveResults[k]!=='ok').map(k=>saveNames[k]);
    message='Save incomplete - not saved: '+failed.join(', ')+'. Check the board connection and try again.';
   }
  }
  messages.forEach(m=>{m.textContent=message;m.classList.toggle('save-error',!!saveResults&&!busy&&Object.values(saveResults).some(s=>s!=='ok'));});
 }
 // Resolves once this command has an answer (ok, bad, or the app's own
 // timeout marking it failed).
 function waitForSave(k){
  return new Promise(res=>{const poll=()=>{if(!saveResults||saveResults[k]!=='pending')return res();setTimeout(poll,40);};poll();});
 }
 async function saveAll(){
  if(!goldReady('s3')||saveResults&&Object.values(saveResults).includes('pending'))return;
  saveResults=Object.fromEntries(saveCommands.map(k=>[k,'pending']));paintSave();
  for(const k of saveCommands){send(k,'1',k,'1');await waitForSave(k);}
 }
 function toolbar(view,loadButtons){
  const bar=document.createElement('div');bar.className='group save-toolbar';
  const heading=document.createElement('div');heading.className='group-hd';heading.innerHTML='<h2>Save settings & tuning</h2>';
  const actions=document.createElement('div');actions.className='save-actions';
  const button=document.createElement('button');button.className='pair save-all';button.addEventListener('click',saveAll);saveButtons.push(button);
  actions.append(button,...loadButtons);
  const message=document.createElement('p');message.className='hint save-message';message.setAttribute('role','status');messages.push(message);
  bar.append(heading,actions,message);view.prepend(bar);
 }
 loadDSP.textContent='Reload DSP settings';loadDSP.dataset.board='s3';
 loadLights.textContent='Reload lighting settings';
 // Lighting sensitivity is DSP tuning, so reload both sets from Lighting.
 const loadSensitivity=document.createElement('button');loadSensitivity.textContent='Reload music sensitivity';loadSensitivity.dataset.board='s3';
 loadSensitivity.addEventListener('click',()=>send('tGet','1','tGet','1'));
 toolbar(sound,[loadDSP]);toolbar(lights,[loadLights,loadSensitivity]);
 const beforeSetCtl=setCtl;
 setCtl=function(id,status,message){beforeSetCtl(id,status,message);if(saveResults&&saveCommands.includes(id)){saveResults[id]=status;paintSave();}else if(status==='pending'&&saveResults&&!Object.values(saveResults).includes('pending')){saveResults=null;paintSave();}};
 const beforeRender=render;
 render=function(){beforeRender();
  if(!device?.gatt?.connected&&saveResults){for(const k of saveCommands)if(saveResults[k]==='pending')saveResults[k]='gone';}
  paintSave();
  document.querySelector('.island [data-v=lights]').classList.toggle('pending',state.ledsaved===false);
 };
 // Disconnect here refers to the app's BLE control connection, not audio pairing.
 const connection=document.createElement('div');connection.className='group home-connection';
 connection.innerHTML='<div class="group-hd"><h2>Connection</h2></div><button class="pair" id="disconnectControl">Disconnect Bluetooth control</button><p class="hint">Disconnect this app from LarbyBox. Music playback stays connected.</p>';
 home.append(connection);
 $('disconnectControl').addEventListener('click',()=>{if(device?.gatt?.connected)device.gatt.disconnect();});
 // Independent columns remove empty grid rows. On phones, preserve DOM order.
 const desktop=matchMedia('(min-width: 761px)');
 const layouts=[{view:home,items:[audio,effects,bass,connection],columns:[[audio,bass],[effects,connection]]},
  {view:sound,items:soundCategories,columns:[[soundCategories[0],soundCategories[1],soundCategories[4]],[soundCategories[2],soundCategories[3],soundCategories[5],soundCategories[6]]]},
  // The All effects group is in items but in no column, so on desktop it
  // stays full width above the two columns of per-effect groups.
  {view:lights,items:[globalLights,...lightCategories],columns:[lightCategories.filter((_,i)=>i%2===0),lightCategories.filter((_,i)=>i%2===1)]}];
 function arrange(){for(const l of layouts){
  l.items.forEach(item=>l.view.append(item));
  l.view.querySelectorAll(':scope > .layout-columns').forEach(el=>el.remove());
  if(desktop.matches){const row=document.createElement('div');row.className='layout-columns';
   l.columns.forEach(items=>{const column=document.createElement('div');column.className='layout-column';column.append(...items);row.append(column);});l.view.append(row);}
 }}
 desktop.addEventListener('change',arrange);arrange();render();
})();
