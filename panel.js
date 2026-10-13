// Devices page: panel lock + music-device blocking, with its own tab.
//   Panel lock is owned by the LED board (plock bitmask, saved there).
//   Kick / block / unblock go through the LED board to the BT board.
(()=>{
 const LOCKS=[
  {bit:0x01,name:'Volume knob'},
  {bit:0x02,name:'Bass button'},
  {bit:0x04,name:'Play button'},
  {bit:0x08,name:'Bluetooth button'},
  {bit:0x10,name:'Lights knob'}];
 const ALL=0x1F;
 // Own page and bottom-bar tab, between Lighting and Settings.
 const view=document.createElement('section');
 view.className='view';view.id='v-devices';view.dataset.title='Devices';
 $('v-power').before(view);
 ICONS.devices='<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>';
 const nav=document.querySelector('.island');
 const tab=document.createElement('button');
 tab.dataset.v='devices';
 tab.innerHTML='<span class="nav-icon">'+icon('devices')+'</span>Devices';
 nav.insertBefore(tab,nav.querySelector('[data-v=power]'));
 tab.addEventListener('click',()=>goldNavigate('devices'));

 const css=document.createElement('style');
 css.textContent=`
 .lock-list{display:flex;flex-direction:column;gap:2px}
 .lock-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--hair);font-size:14px;cursor:pointer}
 .lock-row:last-child{border-bottom:0}
 .lock-row input{appearance:none;-webkit-appearance:none;width:44px;height:26px;border-radius:13px;background:var(--card2);border:1px solid var(--hair);position:relative;cursor:pointer;flex:none;margin:0;transition:background .15s}
 .lock-row input::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:var(--dim);transition:transform .15s}
 .lock-row input:checked{background:var(--accent);border-color:var(--accent)}
 .lock-row input:checked::after{transform:translateX(18px);background:var(--onaccent)}
 .lock-row input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
 .lock-row small{display:block;color:var(--faint);font-size:11.5px}
 .lock-btns,.dev-btns{display:flex;gap:10px;margin-top:14px}
 .lock-btns .pair,.dev-btns .pair{flex:1}
 .dev-now{font-size:14px;line-height:1.4}
 .dev-now small{display:block;color:var(--faint);font-size:11.5px;font-variant-numeric:tabular-nums}
 .blk-list{margin-top:6px}
 .blk-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--hair);font-size:13.5px}
 .blk-row:last-child{border-bottom:0}
 .blk-row small{display:block;color:var(--faint);font-size:11.5px;font-variant-numeric:tabular-nums}
 .blk-row button{padding:8px 14px;border-radius:100px;background:var(--card2);font-size:12px;font-weight:600;color:var(--ink);flex:none}
 #v-devices.on{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;align-items:start}
 #v-devices>.group{margin:0}
 @media(max-width:760px){#v-devices.on{display:block!important}#v-devices>.group{margin-bottom:18px}.island button{min-width:0;flex:1}}
 .sub-hd{font-size:12px;color:var(--faint);margin:18px 0 4px;text-transform:uppercase;letter-spacing:.06em}`;
 document.head.append(css);

 // --- panel lock group (LED board) ---
 const lock=document.createElement('div');
 lock.className='group';
 lock.innerHTML=`<div class="group-hd"><h2>Panel lock</h2></div>
  <div class="lock-list">${LOCKS.map(l=>`<label class="lock-row"><span>${l.name}</span><input type="checkbox" id="lock${l.bit}" data-bit="${l.bit}" aria-label="Lock ${l.name}"></label>`).join('')}</div>
  <div class="lock-btns"><button class="pair" id="lockAll">Lock all</button><button class="pair" id="unlockAll">Unlock all</button></div>
  <div class="ctl" id="ctl-plock"><div class="state"></div><div class="ctl-msg" id="msg-plock"></div></div>
  <p class="hint" style="margin:12px 0 0">A locked control does nothing, and the button lights blink red when someone tries it. Locks stay on after a restart. To unlock everything without the app, hold Play and Bluetooth together for 5 seconds.</p>`;

 // --- music devices group (BT board) ---
 const devs=document.createElement('div');
 devs.className='group';devs.dataset.board='bt';
 devs.innerHTML=`<div class="group-hd"><h2>Music devices</h2><span class="offline-note">Bluetooth offline</span></div>
  <div class="dev-now" id="devNow">&mdash;</div>
  <div class="dev-btns"><button class="pair" id="devKick">Kick off</button><button class="pair" id="devBlock">Kick and block</button></div>
  <div class="ctl" id="ctl-btdev"><div class="state"></div><div class="ctl-msg" id="msg-btdev"></div></div>
  <div class="sub-hd">Blocked</div>
  <div class="blk-list" id="blkList"></div>
  <p class="hint" style="margin:12px 0 0">Kick off disconnects the phone; it can connect again. Kick and block also stops it reconnecting until you unblock it here.</p>`;

 view.append(lock,devs);

 const pendingKey=k=>[...pending.values()].some(p=>p.key===k);
 let shownMask=null;

 function sendMask(m){
  m&=ALL;
  shownMask=m; paintLocks(m);
  send('plock',m,'plock',m);
 }
 lock.querySelectorAll('input[data-bit]').forEach(cb=>cb.addEventListener('change',()=>{
  let m=Number.isFinite(state.plock)?state.plock:0;
  const b=+cb.dataset.bit;
  m=cb.checked?(m|b):(m&~b);
  sendMask(m);
 }));
 $('lockAll').addEventListener('click',()=>sendMask(ALL));
 $('unlockAll').addEventListener('click',()=>sendMask(0));

 function paintLocks(m){
  lock.querySelectorAll('input[data-bit]').forEach(cb=>{cb.checked=!!(m&+cb.dataset.bit);});
 }

 $('devKick').addEventListener('click',()=>send('btkick','1','btdev','kick'));
 $('devBlock').addEventListener('click',()=>send('btblock','1','btdev','block'));
 $('blkList').addEventListener('click',e=>{
  const b=e.target.closest('button[data-i]');if(!b)return;
  send('btunblock',b.dataset.i,'btdev','unblock');
 });

 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

 // Ask for the block list once the BT board is reachable, and again after
 // every reconnect. The BT board also pushes it after each change.
 let listAsked=false;

 const beforeRender=render;
 render=function(){
  beforeRender();
  const conn=!!device?.gatt?.connected;

  // Locks: follow the speaker unless a change is still in flight.
  if(conn&&Number.isFinite(state.plock)&&!pendingKey('plock')){
   if(shownMask!==state.plock){shownMask=state.plock;paintLocks(state.plock);}
  }
  const m=Number.isFinite(state.plock)?state.plock:0;
  $('lockAll').disabled=!conn||m===ALL;
  $('unlockAll').disabled=!conn||m===0;

  // Current phone.
  const btUp=conn&&!!state.linkBt;
  const has=btUp&&state.bt&&state.devAddr;
  $('devNow').innerHTML=!btUp?'&mdash;':has
   ?`${esc(state.dev||'Unnamed phone')}<small>${esc(state.devAddr)}</small>`
   :'Nothing connected';
  $('devKick').disabled=!has; $('devBlock').disabled=!has;

  // Block list.
  const list=Array.isArray(state.btBlocked)?state.btBlocked:null;
  $('blkList').innerHTML=!list?'<p class="hint" style="margin:6px 0 0">&mdash;</p>'
   :!list.length?'<p class="hint" style="margin:6px 0 0">No blocked devices.</p>'
   :list.map((d,i)=>`<div class="blk-row"><span>${esc(d.n||'Unknown')}<small>${esc(d.a)}</small></span><button data-i="${i}"${btUp?'':' disabled'}>Unblock</button></div>`).join('');

  if(btUp&&!listAsked){listAsked=true;send('btlist','1');}
  if(!btUp)listAsked=false;
 };

 // Show the confirmed mask immediately rather than waiting for the next
 // state message.
 const beforeAck=resolveAck;
 resolveAck=function(a){
  const p=pending.get(a.seq);
  if(p&&p.key==='plock'&&['ok','clamp'].includes(a.r)&&Number.isFinite(Number(a.v)))state.plock=Number(a.v);
  if(p&&p.key==='plock'&&!['ok','clamp'].includes(a.r))shownMask=null;
  beforeAck(a);
  if(p&&['btkick','btblock'].includes(p.key)&&a.v==='none')setCtl('btdev','bad','No phone is connected.');
  else if(p&&p.key==='btblock'&&a.r==='ok')setCtl('btdev','ok','Blocked.');
  else if(p&&p.key==='btunblock'&&a.r==='ok')setCtl('btdev','ok','Unblocked.');
 };

 render();
})();
