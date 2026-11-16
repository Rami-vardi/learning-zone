(function(){'use strict';
const clone=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const empty=()=>({version:1,boards:[],trash:[]});
function documentValue(v){if(v==null)return empty();if(v.version!==1||!Array.isArray(v.boards)||!Array.isArray(v.trash))throw Error('The saved whiteboard collection needs review.');return clone(v);}
function merge(base,local,remote){
 if(same(local,base))return cloneOptional(remote);if(same(remote,base)||same(local,remote))return cloneOptional(local);
 if(plain(local)&&plain(remote))return Object.fromEntries([...new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])].map(k=>[k,merge(base?.[k],local[k],remote[k])]).filter(([,v])=>v!==undefined));
 if(Array.isArray(local)&&Array.isArray(remote)&&[...local,...remote,...(Array.isArray(base)?base:[])].every(x=>plain(x)&&typeof x.id==='string')){
  const toMap=a=>Object.fromEntries((a||[]).map(x=>[x.id,x])),baseIds=(base||[]).map(x=>x.id),localIds=local.map(x=>x.id),remoteIds=remote.map(x=>x.id),common=new Set(baseIds.filter(id=>localIds.includes(id)&&remoteIds.includes(id))),order=a=>a.filter(id=>common.has(id)),before=order(baseIds),localOrder=order(localIds),remoteOrder=order(remoteIds),localMoved=!same(localOrder,before),remoteMoved=!same(remoteOrder,before);if(localMoved&&remoteMoved&&!same(localOrder,remoteOrder))throw Object.assign(Error('The sheet order changed on another device. Your pending work is preserved.'),{code:'WHITEBOARD_CONFLICT',status:409});const merged=merge(toMap(base),toMap(local),toMap(remote)),preferred=localMoved?localIds:remoteMoved?remoteIds:localIds;return [...new Set([...preferred,...localIds,...remoteIds])].filter(id=>Object.prototype.hasOwnProperty.call(merged,id)).map(id=>merged[id]);
 }
 throw Object.assign(Error('This whiteboard was changed in another tab or on another device. Your pending work is preserved. Open the latest version or recover your work as a separate copy.'),{code:'WHITEBOARD_CONFLICT',status:409});
}
function cloneOptional(v){return v===undefined?undefined:clone(v);}
async function open(owner,options={}){
 const cloud=window.LZCloud;if(!cloud?.api)throw Error('Sign in to open Whiteboard Zone.');
 const member=cloud.currentMember(),actor=member?.id;if(!actor)throw Error('Sign in to open Whiteboard Zone.');
 const shared=!!options.shared,readonly=shared&&member.role!=='teacher',kind=shared?'shared-whiteboards':'whiteboards',cacheKey='learning-zone-cloud:whiteboards:'+actor+':'+owner+':'+kind;
 let value=empty(),base=empty(),revision=0,dirty=false,conflict=false,remote=null,recoveryDraft=null,closed=false,active=null,timer=null,offline=false,error=null,message='',state='saved',cacheWarning='',draftPreserved=false;const listeners=new Set();
 const assertActor=()=>{if(closed||cloud.currentMember()?.id!==actor)throw Object.assign(Error('Sign in to the original account to save these whiteboards.'),{status:401});};
 const api=(op,data={})=>{assertActor();return cloud.api(op,{owner,kind,...data});};
 const conflictError=()=>Object.assign(Error('Newer whiteboard changes are online. Your pending work is preserved. Open the latest version or recover your work as a separate copy.'),{status:409,code:'WHITEBOARD_CONFLICT'});
 function snapshot(){return clone({owner,kind,revision,value,base,dirty,conflict,remote,recoveryDraft,readonly});}
 function cache(){try{localStorage.setItem(cacheKey,JSON.stringify(snapshot()));cacheWarning='';draftPreserved=true;}catch{draftPreserved=false;cacheWarning='This browser could not preserve a recovery copy. Keep this page open until the online save succeeds.';}}
 function describe(){return {state,message:cacheWarning&&(dirty||recoveryDraft)?message+' '+cacheWarning:message,error,dirty,conflict,readonly,hasRecovery:!!recoveryDraft,draftPreserved};}
 function notify(){for(const listener of listeners)listener(describe());}
 function setState(next,text,e=null){state=next;message=text;error=e;notify();}
 let pending=null;try{pending=JSON.parse(localStorage.getItem(cacheKey)||'null');}catch{cacheWarning='A browser recovery copy could not be read. The online version is available.';}
 let read;
 try{read=await api('content-get');assertActor();value=documentValue(read.value);revision=Number(read.revision)||0;base=clone(value);}
 catch(e){if(e.status&&e.status<500||e.message?.includes('original account')||!pending)throw e;value=documentValue(pending.value);base=documentValue(pending.base);revision=Number(pending.revision)||0;offline=true;}
 if(!readonly&&pending){
  recoveryDraft=pending.recoveryDraft||null;
  if(pending.dirty||pending.conflict){
   const local=documentValue(pending.value),previous=documentValue(pending.base);
   if(offline){value=local;base=previous;dirty=true;conflict=!!pending.conflict;remote=pending.remote||null;}
   else try{value=merge(previous,local,value);dirty=!same(value,base);}
   catch(e){remote={value:clone(value),revision};value=local;base=previous;dirty=true;conflict=true;error=e;}
  }
 }
 if(conflict){state='conflict';message=conflictError().message;}
 else if(offline){state='offline';message=dirty?'Offline, Changes Pending':'Offline, Showing This Computer’s Copy';}
 else if(dirty){state='pending';message='Saving…';}else message='Saved Online';
 cache();
 async function flush(){
  clearTimeout(timer);timer=null;if(readonly)return;if(dirty)assertActor();if(conflict)throw conflictError();
  if(active){await active;assertActor();if(dirty)return flush();return;}if(!dirty)return;
  active=(async()=>{let reconciled=false;while(dirty){
   assertActor();if(conflict)throw conflictError();const sent=clone(value);setState('saving','Saving…');
   try{assertActor();const result=await api('content-set',{value:sent,revision});assertActor();revision=Number(result.revision);base=sent;dirty=!same(value,sent);offline=false;cache();}
   catch(e){
    if(e.status===409&&!reconciled){
     try{assertActor();const latest=await api('content-get');assertActor();const latestValue=documentValue(latest.value);const merged=merge(base,value,latestValue);base=latestValue;value=merged;revision=Number(latest.revision)||0;dirty=!same(value,base);reconciled=true;cache();notify();continue;}
     catch(mergeError){e=mergeError;if(e.code==='WHITEBOARD_CONFLICT'){conflict=true;remote=null;}}
    }
    if(e.status===409){conflict=true;cache();setState('conflict',conflictError().message,e);}
    else{offline=!e.status||e.status>=500;cache();setState(offline?'offline':'error',offline?'Offline, Changes Pending':'Changes Not Saved. Your pending work is preserved.',e);}
    throw e;
   }
  }setState('saved','Saved Online');})();
  try{await active;}finally{active=null;}
 }
 function set(next){assertActor();if(readonly)throw Error('Shared reference boards are read-only. Duplicate a board into your private boards to edit it.');const validated=documentValue(next);if(JSON.stringify(validated).length>8e6)throw Error('Your whiteboard collection is too large. Export or simplify a board before continuing.');value=validated;dirty=!same(value,base);cache();setState(conflict?'conflict':dirty?'pending':'saved',conflict?conflictError().message:dirty?'Saving…':'Saved Online');clearTimeout(timer);if(dirty&&!conflict)timer=setTimeout(()=>flush().catch(()=>{}),350);return true;}
 async function reloadOnline(){clearTimeout(timer);timer=null;assertActor();if(active)try{await active;}catch{}assertActor();const latest=await api('content-get');assertActor();if(dirty||conflict)recoveryDraft={value:clone(value),base:clone(base),revision,savedAt:new Date().toISOString()};value=documentValue(latest.value);base=clone(value);revision=Number(latest.revision)||0;dirty=false;conflict=false;remote=null;offline=false;cache();setState('saved','Saved Online');return clone(value);}
 function newid(){return globalThis.crypto?.randomUUID?.()||'recovered-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
 function copyBoard(original){const b=clone(original),ids=new Map();b.id=newid();b.name=(String(b.name||'Whiteboard').slice(0,175)+' (Recovered Copy)');delete b.deletedAt;b.updatedAt=new Date().toISOString();for(const s of [...b.sheets,...(b.sheetTrash||b.trashSheets||[])]){const old=s.id;s.id=newid();ids.set(old,s.id);}b.activeSheetId=ids.get(b.activeSheetId)||b.sheets[0]?.id;return b;}
 async function recoverAsCopy(){clearTimeout(timer);timer=null;assertActor();if(readonly)throw Error('Only the teacher can edit shared reference boards.');if(active)try{await active;}catch{}assertActor();const draft=recoveryDraft||{value:clone(value),base:clone(base),revision},latest=await api('content-get');assertActor();const online=documentValue(latest.value),baseline=new Map([...draft.base.boards,...draft.base.trash].map(b=>[b.id,b]));const changed=[...draft.value.boards,...draft.value.trash].filter(b=>!same(b,baseline.get(b.id))).map(copyBoard);if(!changed.length)throw Error('There are no changed boards to recover as a separate copy.');if(online.boards.length+online.trash.length+changed.length>100)throw Error('There are too many boards to recover automatically. Export your pending work first.');recoveryDraft=clone(draft);base=clone(online);value={...online,boards:[...online.boards,...changed]};revision=Number(latest.revision)||0;dirty=true;conflict=false;remote=null;offline=false;cache();setState('pending','Saving Recovered Copies…');await flush();return clone(value);}
 const online=()=>{if(closed||cloud.currentMember()?.id!==actor||conflict)return;if(dirty)flush().catch(()=>{});else if(offline)reloadOnline().catch(()=>{});};
 const pagehide=()=>{cache();if(!readonly&&!conflict)flush().catch(()=>{});};
 window.addEventListener?.('online',online);window.addEventListener?.('pagehide',pagehide);
 const store={get value(){return clone(value);},get state(){return describe();},readonly,set,flush,retry:async()=>{assertActor();if(conflict)throw conflictError();if(dirty)return flush();return reloadOnline();},subscribe(fn){listeners.add(fn);fn(describe());return ()=>listeners.delete(fn);},snapshot,reloadOnline,recoverAsCopy,async close(options={}){clearTimeout(timer);if(!options.discard)await flush();cache();closed=true;listeners.clear();window.removeEventListener?.('online',online);window.removeEventListener?.('pagehide',pagehide);}};
 if(dirty&&!conflict&&!offline)timer=setTimeout(()=>flush().catch(()=>{}),350);return store;
}
window.LZWhiteboardStore={open,merge};
})();
