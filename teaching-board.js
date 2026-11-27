(() => {
  'use strict';
  const panel = document.createElement('dialog');
  panel.className = 'teaching-dialog';
  panel.setAttribute('aria-labelledby','teaching-title');
  panel.innerHTML = '<header><h2 id="teaching-title">Teaching whiteboard</h2><button data-expand>Maximize</button><button data-return>Back to Builder</button></header><div class="teaching-host"></div>';
  document.body.append(panel);
  const host = panel.querySelector('.teaching-host');
  const expand = panel.querySelector('[data-expand]');
  let editor, actor, pending, returnField, selection, focusBeforeButton, sequence = 0;
  const context = () => window.LZStudent?.context();
  const inBuilder = () => context()?.member?.role === 'teacher' && !document.querySelector('#student-learning-board')?.hidden && document.querySelector('[data-nav="programs"]')?.getAttribute('aria-current') === 'page';
  const prefKey = () => 'learning-zone:teaching-display:' + actor;
  function saveSize() {
    if (!panel.open || !actor) return;
    const full = panel.dataset.expanded === 'true';
    try {
      const old = JSON.parse(localStorage.getItem(prefKey()) || '{}');
      const box = panel.getBoundingClientRect();
      localStorage.setItem(prefKey(),JSON.stringify(full ? {...old, full} : {width: Math.round(box.width),height:Math.round(box.height),full}));
    } catch {}
  }
  function maximize(full) {
    panel.dataset.expanded = String(full);
    expand.textContent = full ? 'Restore size' : 'Maximize';
    expand.setAttribute('aria-pressed',String(full));
  }
  expand.onclick = () => { saveSize();maximize(panel.dataset.expanded !== 'true');saveSize(); };
  new ResizeObserver(saveSize).observe(panel);
  async function boardId(id) {
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('learning-zone/teaching/'+id)));
    bytes[6] = (bytes[6]&15)|80; bytes[8] = (bytes[8]&63)|128;
    const hex=Array.from(bytes.slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');
    return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
  }
  function resetOwner() {
    sequence++; panel.close(); const old=editor;editor=null;pending=null;actor=null;
    old?.destroy({discard:true}).catch(()=>{});host.replaceChildren();
  }
  async function open(button) {
    if (!inBuilder() || panel.open) return;
    const id=context().member.id;
    if (actor && actor!==id) resetOwner();
    actor=id;returnField=focusBeforeButton?.isConnected?focusBeforeButton:button;focusBeforeButton=null;
    try {selection=[returnField.selectionStart,returnField.selectionEnd,returnField.selectionDirection];} catch {selection=null;}
    try {
      const size=JSON.parse(localStorage.getItem(prefKey()) || '{}');
      panel.style.width=size.width ? Math.min(innerWidth,size.width)+'px' : '';
      panel.style.height=size.height ? Math.min(innerHeight,size.height)+'px' : '';
      maximize(!!size.full);
    } catch {maximize(false);}
    panel.showModal();panel.querySelector('[data-return]').focus({preventScroll:true});
    if(editor || pending)return;
    const ticket=++sequence;
    const mount=document.createElement('div');mount.className='teaching-host';host.replaceChildren(mount);
    pending=(async()=>{
      try {
        const boardKey=await boardId(id);
        if(ticket!==sequence)return;
        const instance=await LZWhiteboard.mount(mount,{username:id,admin:true,teaching:{id:boardKey}});
        if(ticket!==sequence){await instance.destroy({discard:true});return;}editor=instance;
      } catch(e) {
        if(ticket!==sequence)return;
        mount.replaceChildren();const message=document.createElement('p');message.setAttribute('role','alert');
        message.textContent=e.message;const retry=document.createElement('button');retry.textContent='Retry opening whiteboard';
        retry.onclick=()=>{panel.close();open(button);};mount.append(message,retry);
      } finally {if(ticket===sequence)pending=null;}
    })();
  }
  async function close() {
    try {await editor?.finishTeaching();} catch(e) {
      const p=host.querySelector('[data-wb-message]');if(p){p.hidden=false;p.textContent=e.message+' ';const b=document.createElement('button');b.textContent='Export recovery copy';b.onclick=()=>editor.exportTeaching();p.append(b);}return;
    }
    saveSize();panel.close();if(returnField?.isConnected){
      returnField.focus({preventScroll:true});if(selection && typeof selection[0]==='number')try{returnField.setSelectionRange(...selection);}catch{}
    }
  }
  panel.querySelector('[data-return]').onclick=close;
  panel.addEventListener('cancel',e=>{e.preventDefault();close();});
  const symbol='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17H3V4h18v5M8 21l2-4m7 4-2-4m-1-2 5.7-5.7 2 2L16 17l-3 1z"/></svg>';
  function install(parent,first=false) {
    if(!parent||parent.querySelector(':scope > [data-teaching-launch]'))return;
    const button=document.createElement('button');button.type='button';button.dataset.teachingLaunch='';
    button.title='Teaching whiteboard';button.setAttribute('aria-label',button.title);button.setAttribute('aria-haspopup','dialog');button.innerHTML=symbol;
    button.onpointerdown=e=>{if(e.button===0){focusBeforeButton=document.activeElement;e.preventDefault();}};
    button.onclick=()=>open(button);if(first)parent.prepend(button);else parent.append(button);
  }
  function refresh() {
    if(actor && context()?.member?.id!==actor)resetOwner();
    if(!inBuilder()){
      document.querySelectorAll('[data-teaching-launch]').forEach(b=>b.remove());
      if(actor && !panel.open && !pending)resetOwner();return;
    }
    install(document.querySelector('.app-topbar'));
    document.querySelectorAll('dialog[open]').forEach(d=>{
      if(d===panel||panel.contains(d)||d.id==='lz-appearance-dialog'||d.id==='help-dialog')return;
      if(!d.closest('#student-learning-board'))d.dataset.builderFloating='';
      install(d,true);
    });
  }
  new MutationObserver(refresh).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','aria-current','hidden']});
  for(const name of ['lz-account-change','lz-cloud-session-change'])window.addEventListener(name,refresh);
  refresh();
})();
