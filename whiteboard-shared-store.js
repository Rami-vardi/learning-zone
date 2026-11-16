/* Board-granular shared editing. The server decides access on every request. */
(()=>{'use strict';
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const wrapped=b=>({version:1,boards:[clone(b)],trash:[]});
function validDocument(v,id){if(!v||v.version!==1||!Array.isArray(v.boards)||v.boards.length!==1||v.boards[0]?.id!==id||!Array.isArray(v.trash)||v.trash.length)throw Error('This shared editor can save only the selected whiteboard.');return clone(v);}
async function open(owner,boardId){
 const cloud=window.LZCloud,actor=cloud?.currentMember?.()?.id;if(!actor)throw Error('Sign in to open shared whiteboards.');
 const key='learning-zone-cloud:shared-whiteboard:'+actor+':'+owner+':'+boardId,merge=window.LZWhiteboardStore.merge,listeners=new Set();
 let value,base,revision='',record=null,readonly=true,dirty=false,conflict=false,recoveryDraft=null,closed=false,active=null,timer=null,error=null,state='saved',message='Saved Online',draftPreserved=false;
 const assertActor=()=>{if(closed||cloud.currentMember()?.id!==actor)throw Object.assign(Error('Sign in to the original account to save this whiteboard.'),{status:401});};
 const conflictError=()=>Object.assign(Error('This shared whiteboard changed elsewhere. Your pending changes are preserved.'),{status:409,code:'WHITEBOARD_CONFLICT'});
 const accessError=()=>Object.assign(Error('Your access to this shared whiteboard changed. Your pending draft is preserved on this computer.'),{status:403,code:'WHITEBOARD_ACCESS_CHANGED'});
 const describe=()=>({state,message,error,dirty,conflict,readonly,hasRecovery:!!recoveryDraft||dirty&&readonly,draftPreserved});
 const notify=()=>{for(const fn of listeners)fn(describe());};
 function cache(){try{localStorage.setItem(key,JSON.stringify({value,base,revision,dirty,conflict,recoveryDraft}));draftPreserved=true;}catch{draftPreserved=false;}}
 function setState(next,text,e=null){state=next;message=text;error=e;notify();}
 async function read(){assertActor();const r=await cloud.api('whiteboard-get',{owner,board_id:boardId});assertActor();if(!r?.board||r.board.id!==boardId||typeof r.revision!=='string')throw Error('The shared whiteboard response was incomplete.');record={owner_id:r.owner_id,owner_username:r.owner_username,permission:r.permission,can_manage:!!r.can_manage};readonly=r.permission!=='edit';return {value:wrapped(r.board),revision:r.revision};}
 let pending=null;try{pending=JSON.parse(localStorage.getItem(key)||'null');}catch{}
 const initial=await read();value=initial.value;base=clone(value);revision=initial.revision;
 if(pending){recoveryDraft=pending.recoveryDraft||null;if(pending.dirty||pending.conflict){try{value=merge(pending.base,pending.value,value);dirty=!same(value,base);}catch(e){value=validDocument(pending.value,boardId);dirty=true;conflict=true;error=e;}}}
 if(conflict){state='conflict';message=conflictError().message;}else if(dirty&&readonly){state='error';message=accessError().message;error=accessError();}else if(dirty){state='pending';message='Saving…';}cache();
 async function flush(){
  clearTimeout(timer);timer=null;if(!dirty)return;if(readonly)throw accessError();assertActor();if(conflict)throw conflictError();if(active){await active;if(dirty)return flush();return;}
  active=(async()=>{let reconciled=false;while(dirty){assertActor();const sent=clone(value);setState('saving','Saving…');try{const r=await cloud.api('whiteboard-set',{owner,board_id:boardId,value:sent.boards[0],revision});assertActor();if(typeof r?.revision!=='string')throw Error('The shared save response was incomplete.');revision=r.revision;base=sent;dirty=!same(value,sent);cache();}catch(e){if(e.status===409&&!reconciled){try{const latest=await read();if(readonly)throw accessError();value=merge(base,value,latest.value);base=latest.value;revision=latest.revision;dirty=!same(value,base);reconciled=true;cache();notify();continue;}catch(x){e=x;}}if(e.status===403){readonly=true;recoveryDraft={value:clone(value),base:clone(base),revision,savedAt:new Date().toISOString()};cache();setState('error',accessError().message,accessError());throw accessError();}if(e.status===409){conflict=true;cache();setState('conflict',conflictError().message,e);}else{cache();setState(!e.status||e.status>=500?'offline':'error',!e.status||e.status>=500?'Offline, Changes Pending':'Changes Not Saved. Your pending draft is preserved.',e);}throw e;}}setState('saved','Saved Online');})();
  try{await active;}finally{active=null;}
 }
 function set(next){assertActor();if(readonly)throw Error('This shared board is view only. Duplicate it to My Boards to edit a private copy.');const validated=validDocument(next,boardId);if(JSON.stringify(validated).length>8e6)throw Error('This whiteboard is too large. Export or simplify it before continuing.');value=validated;dirty=!same(value,base);cache();setState(conflict?'conflict':dirty?'pending':'saved',conflict?conflictError().message:dirty?'Saving…':'Saved Online');clearTimeout(timer);if(dirty&&!conflict)timer=setTimeout(()=>flush().catch(()=>{}),350);}
 async function reloadOnline(){clearTimeout(timer);timer=null;if(active)try{await active;}catch{}const latest=await read();if(dirty||conflict)recoveryDraft={value:clone(value),base:clone(base),revision,savedAt:new Date().toISOString()};value=latest.value;base=clone(value);revision=latest.revision;dirty=false;conflict=false;cache();setState('saved',readonly?'View Only':'Saved Online');return clone(value);}
 const online=()=>{if(!closed&&cloud.currentMember()?.id===actor&&dirty&&!conflict&&!readonly)flush().catch(()=>{});};
 const pagehide=()=>{cache();if(!readonly&&!conflict)flush().catch(()=>{});};window.addEventListener('online',online);window.addEventListener('pagehide',pagehide);
 const store={get value(){return clone(value);},get state(){return describe();},get readonly(){return readonly;},get record(){return clone(record);},set,flush,reloadOnline,discardDraft(){assertActor();value=clone(base);dirty=false;conflict=false;recoveryDraft=null;cache();setState('saved',readonly?'View Only':'Saved Online');},retry:async()=>{if(conflict)throw conflictError();if(dirty)return flush();return reloadOnline();},subscribe(fn){listeners.add(fn);fn(describe());return ()=>listeners.delete(fn);},snapshot(){return clone({value,base,revision,dirty,conflict,recoveryDraft,readonly});},async close(options={}){clearTimeout(timer);if(!options.discard)await flush();cache();closed=true;listeners.clear();window.removeEventListener('online',online);window.removeEventListener('pagehide',pagehide);}};
 if(dirty&&!conflict&&!readonly)timer=setTimeout(()=>flush().catch(()=>{}),350);return store;
}
window.LZWhiteboardSharedStore={open};
})();
