/* Signal curves: explicit Apply with ack; Save persists confirmed board values. */
(()=>{
 const sound=$('v-sound');
 const retired=['Compressor','Loudness contour','Sustained-level backoff & limiter'];
 sound.querySelectorAll('details').forEach(d=>{if(retired.includes(d.querySelector('summary')?.textContent))d.hidden=true;});
 // Existing bound controls stay alive for old telemetry, but leave the tuning UI.
 const protection=document.createElement('details');protection.className='group';
 protection.innerHTML='<summary>Output protection</summary><p class="hint">Optional compression reduces the whole sound. Peak limit remains active independently.</p>';
 const peak=$('ctl-lim');peak.querySelector('label').textContent='Peak output limit';protection.append(peak);
 const adaptive=document.createElement('div');adaptive.className='group';adaptive.dataset.board='s3';
 adaptive.innerHTML='<div class="group-hd"><h2>Adaptive bass</h2></div><p class="hint">Your EQ sets the desired bass. This curve removes positive bass boost as the signal rises. 0% retained means no extra boost, not no bass.</p><label>Editing power mode <select id="curveMode"><option value="0">Battery · 12 V</option><option value="1">Mains · 24 V</option></select></label><p class="hint" id="curveLive">Connect to read curves.</p>';
 const toolbar=sound.querySelector('.save-toolbar');toolbar.after(adaptive,protection);
 const styles=document.createElement('style');styles.textContent=`
 [hidden]{display:none!important}.curve-chart{width:100%;height:auto;display:block;background:var(--card2);border-radius:12px;touch-action:none;margin:12px 0}.curve-chart text{fill:var(--dim);font-size:11px}.curve-table{width:100%;font-size:13px}.curve-table input{width:75px;max-width:100%;padding:8px;background:var(--card2);color:var(--ink);border:1px solid var(--hair);border-radius:7px}.curve-table th{text-align:left}.curve-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.curve-status{min-height:1.5em;font-size:13px}#curveMode{padding:8px;background:var(--card2);color:var(--ink);border:1px solid var(--hair);border-radius:6px}details.group>summary{cursor:pointer;font-weight:600} .ota-actions{display:flex;gap:10px;flex-wrap:wrap}`;document.head.append(styles);
 let mode=0,asked=false,loaded=false,lastTelemetry=0,lastAsk=0;
 const confirmed={},drafts={},dirty=new Set(),panels={};
 const defaults={b:[0,100,30,100,60,70,80,30,100,0],o:[0,0,30,30,60,60,80,80,100,100]};
 window.larbyCurveUnapplied=()=>dirty.size>0||[...pending.values()].some(p=>/^c[boe][01]$/.test(p.key));
 const key=t=>'c'+t+mode;
 const active=k=>[...pending.values()].some(p=>p.key===k);
 const ready=()=>goldReady('s3')&&state.curveVersion===1&&loaded;
 const value=t=>drafts[key(t)]||confirmed[key(t)]||defaults[t];
 function at(a,x){for(let i=2;i<10;i+=2)if(x<=a[i])return a[i-1]+(a[i+1]-a[i-1])*(x-a[i-2])/(a[i]-a[i-2]);return a[9];}
 function valid(a,t){return a.length===10&&a.every(Number.isFinite)&&a[0]===0&&a[8]===100&&a.every(v=>v>=0&&v<=100)&&[0,1,2,3,4].every(i=>(!i||a[2*i]>a[2*i-2])&&(t==='b'?(!i||a[2*i+1]<=a[2*i-1]):a[2*i+1]<=a[2*i]&&(!i||a[2*i+1]>=a[2*i-1])));}
 function edit(t,i,axis,n){
  const a=[...value(t)];n=Math.round(n);if(!Number.isFinite(n))return;
  if(axis===0){if(i===0||i===4)return;n=Math.max(a[2*i-2]+1,Math.min(a[2*i+2]-1,n));if(t==='o')n=Math.max(n,a[2*i+1]);}
  else {let low=0,high=100;if(t==='b'){low=i<4?a[2*i+3]:0;high=i?a[2*i-1]:100;}else{low=i?a[2*i-1]:0;high=Math.min(a[2*i],i<4?a[2*i+3]:100);}n=Math.max(low,Math.min(high,n));}
  a[2*i+axis]=n;drafts[key(t)]=a;dirty.add(key(t));paint(t);
 }
 function paint(t){
  const p=panels[t],a=value(t),live=Number(state.cm)===mode&&Date.now()-lastTelemetry<3500;
  const level=t==='b'?state.cbLevel:state.coLevel;
  const peak=live?p.peak:0;
  const points=Array.from({length:5},(_,i)=>`${40+a[i*2]*3},${220-a[i*2+1]*1.8}`).join(' ');
  p.svg.innerHTML=`<path d="M40 40V220H340" fill="none" stroke="currentColor" opacity=".35"/><path d="M40 130H340M190 40V220" stroke="currentColor" opacity=".12"/><text x="3" y="45">100%</text><text x="12" y="224">0%</text><text x="40" y="240">0</text><text x="177" y="240">50</text><text x="315" y="240">100%</text><text x="80" y="262">${t==='b'?'Bass':'Overall'} signal level →</text><polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="3"/>${live?`<line x1="${40+peak*3}" x2="${40+peak*3}" y1="40" y2="220" stroke="var(--accent)" opacity=".35" stroke-dasharray="4 4"/><circle cx="${40+(level||0)*3}" cy="${220-at(a,level||0)*1.8}" r="5" fill="var(--ink)"/>`:''}${Array.from({length:5},(_,i)=>`<circle data-point="${i}" cx="${40+a[i*2]*3}" cy="${220-a[i*2+1]*1.8}" r="10" fill="var(--accent)" stroke="var(--ink)" stroke-width="1"/>`).join('')}`;
  p.inputs.forEach((el,i)=>{if(document.activeElement!==el)el.value=a[i];el.disabled=!ready()||(i===0||i===8);});
  p.apply.disabled=!ready()||!dirty.has(key(t))||active(key(t));
  p.reset.disabled=!ready();
 }
 for(const t of ['b','o']){
  const root=t==='b'?adaptive:protection;
  const box=document.createElement('div');
  box.innerHTML=`${t==='o'?'<label><input id="compressionOn" type="checkbox"> Enable output compression for this power mode</label>':''}<p class="hint">Vertical axis: ${t==='b'?'bass boost retained':'allowed output level'}. Horizontal 0–100 maps −60 to 0 dBFS, not watts or acoustic loudness. Dashed line: recent peak.</p><svg class="curve-chart" viewBox="0 0 380 275" role="img" aria-label="${t==='b'?'Bass taper':'Compression'} curve"></svg><table class="curve-table"><thead><tr><th>Point</th><th>Signal %</th><th>${t==='b'?'Retained %':'Output %'}</th></tr></thead><tbody>${Array.from({length:5},(_,i)=>`<tr><td>${i+1}</td><td><input aria-label="Point ${i+1} signal" type="number" min="0" max="100" step="1"></td><td><input aria-label="Point ${i+1} ${t==='b'?'boost retained':'output'}" type="number" min="0" max="100" step="1"></td></tr>`).join('')}</tbody></table><div class="curve-actions"><button class="pair apply">Apply curve</button><button class="reset">Reset curve draft</button></div>`;
  root.append(box);
  const p=panels[t]={svg:box.querySelector('svg'),inputs:[...box.querySelectorAll('input[type=number]')],apply:box.querySelector('.apply'),reset:box.querySelector('.reset'),peak:0,peakAt:0};
  p.inputs.forEach((el,j)=>el.addEventListener('change',()=>edit(t,Math.floor(j/2),j%2,+el.value)));
  p.apply.onclick=()=>{const a=value(t);if(valid(a,t))send(key(t),a.join(','),'curveEdit',a.join(','));};
  p.reset.onclick=()=>{drafts[key(t)]=[...defaults[t]];dirty.add(key(t));paint(t);};
  let drag=null;
  p.svg.onpointerdown=e=>{if(!ready())return;const c=e.target.closest('[data-point]');if(!c)return;drag=+c.dataset.point;p.svg.setPointerCapture(e.pointerId);};
  p.svg.onpointermove=e=>{if(drag===null)return;const r=p.svg.getBoundingClientRect();edit(t,drag,0,((e.clientX-r.left)*380/r.width-40)/3);edit(t,drag,1,(220-(e.clientY-r.top)*275/r.height)/1.8);};
  p.svg.onpointerup=p.svg.onpointercancel=()=>{drag=null;};
 }
 const footer=document.createElement('div');footer.className='group';footer.innerHTML='<p class="hint">Apply curve edits, then use Save settings & tuning at the top to save both curves, sound settings and lighting.</p><div class="ctl" id="ctl-curveEdit"><div class="state"></div><div class="ctl-msg" id="msg-curveEdit"></div></div><div class="ctl" id="ctl-cSave"><div class="state"></div><div class="ctl-msg" id="msg-cSave"></div></div><p class="hint" id="curveSaved"></p>';protection.after(footer);

 $('compressionOn').onchange=e=>send('ce'+mode,e.target.checked?1:0,'curveEdit',e.target.checked?1:0);
 $('curveMode').onchange=e=>{mode=+e.target.value;for(const t of ['b','o']){panels[t].peak=0;paint(t);}refresh();};
 const beforeTuning=applyTuning;applyTuning=function(s){beforeTuning(s);
  for(const k of ['cb0','cb1','co0','co1'])if(Array.isArray(s[k])&&valid(s[k],k[1])){confirmed[k]=[...s[k]];if(!dirty.has(k))drafts[k]=[...s[k]];}
  if(s.cbLevel!==undefined)lastTelemetry=Date.now();
  loaded=['cb0','cb1','co0','co1'].every(k=>confirmed[k]);
 };
 const beforeAck=resolveAck;resolveAck=function(a){const p=pending.get(a.seq);beforeAck(a);
  if(p&&/^c[bo][01]$/.test(p.key)&&a.r==='ok'){
   const sent=String(p.requested??'').split(',').map(Number);
   if(valid(sent,p.key[1])){confirmed[p.key]=sent;if(JSON.stringify(drafts[p.key])===JSON.stringify(sent))dirty.delete(p.key);}
   state.curveSaved=false;
  }
  if(p&&/^ce[01]$/.test(p.key)&&a.r==='ok'){state[p.key]=Number(p.requested);state.curveSaved=false;}
  if(p&&p.key==='cSave'&&a.r==='ok')state.curveSaved=true;
 };
 function refresh(){
  if(!goldReady('s3')){asked=false;loaded=false;lastTelemetry=0;for(const k of Object.keys(confirmed))delete confirmed[k];}
  if(goldReady('s3')&&state.curveVersion===1&&(!asked||(!loaded&&Date.now()-lastAsk>3000))){asked=true;lastAsk=Date.now();send('cGet','1');}
  $('curveLive').textContent=!ready()?'Waiting for curve-capable S3 firmware and settings…':`Live mode: ${state.cm?'mains':'battery'} · boost retained ${Math.round(state.cbKeep??100)}% · output reduction ${(state.coReduction||0).toFixed(1)} dB${Number(state.cm)!==mode?' · editing inactive mode':''}`;
  for(const t of ['b','o']){const p=panels[t],v=Number(t==='b'?state.cbLevel:state.coLevel)||0;if(v>=p.peak||Date.now()-p.peakAt>3000){p.peak=v;p.peakAt=Date.now();}paint(t);}
  $('compressionOn').disabled=!ready()||active('ce'+mode);$('compressionOn').checked=!!state['ce'+mode];

  $('curveSaved').textContent=dirty.size?'Curve edits not applied.':state.curveSaved===false?'Applied curves have not been saved for startup.':state.curveSaved===true?'Curves saved.':'';
 }
 const beforeRender=render;render=function(){beforeRender();refresh();};
 // Existing Arduino OTA entry points. No claim that a browser uploads a binary.
 const ota=document.createElement('details');ota.className='group';ota.innerHTML='<summary>Firmware update · OTA</summary><p class="hint">Enter Wi-Fi update mode, then upload from Arduino IDE on the configured Wi-Fi network. Update one board at a time. LED update mode disconnects this app; BT update mode stops Bluetooth music. S3 updates still use USB.</p><div class="ota-actions"><button id="otaBt">Enter BT update mode</button><button id="otaLed">Enter LED update mode</button></div><p class="hint">Arduino network ports: larbybox-bt / larbybox-led. No upload: the board returns to normal after its timeout. Save settings first.</p><div class="ctl" id="ctl-ota"><div class="state"></div><div class="ctl-msg" id="msg-ota"></div></div>';
 $('v-power').append(ota);
 for(const [id,cmd,name] of [['otaBt','otabt','Bluetooth'],['otaLed','otaled','LED']])$(id).onclick=()=>{if(confirm(`Restart ${name} board into OTA mode? Save your settings first. Upload firmware using Arduino IDE; this button only starts update mode.`))send(cmd,'1','ota','1');};
 const renderCurves=render;render=function(){renderCurves();$('otaBt').disabled=!goldReady('bt');$('otaLed').disabled=!device?.gatt?.connected;};
 render();
})();
