/* Learning Zone Anatomy, lazy local asset entry. */
(function(){
  'use strict';
  const VERSION='20261123-split-stance';
  if(window.LZAnatomy?.version===VERSION)return;
  const source=document.currentScript?.src||new URL('anatomy-zone.js',document.baseURI).href;
  const base=new URL('./anatomy/',source);
  const scripts=new Map(),instances=new WeakMap();
  let dependencies=null,style=null;
  function asset(name){const url=new URL(name,base);url.searchParams.set('v',VERSION);return url.href;}
  function loadScript(name){
    const url=asset(name);if(scripts.has(url))return scripts.get(url);
    const promise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=url;script.async=true;
      script.onload=()=>{script.onload=script.onerror=null;resolve();};
      script.onerror=()=>{script.remove();scripts.delete(url);reject(Error('Anatomy Zone could not load. Check your connection and open the zone again.'));};
      document.head.appendChild(script);
    });scripts.set(url,promise);return promise;
  }
  function loadStyle(){
    if(style)return style;
    style=new Promise((resolve,reject)=>{
      const link=document.createElement('link');link.rel='stylesheet';link.href=asset('anatomy-zone.css');
      link.onload=()=>{link.onload=link.onerror=null;resolve();};
      link.onerror=()=>{link.remove();style=null;reject(Error('Anatomy Zone styles could not load. Open the zone again to retry.'));};
      document.head.appendChild(link);
    });return style;
  }
  function loadDependencies(){
    if(dependencies)return dependencies;
    dependencies=Promise.all([loadStyle(),loadScript('vendor/three-r160.min.js').then(()=>Promise.all([
      loadScript('anatomy-meshes.js'),loadScript('anatomy-mesh-attach.js'),
      loadScript('anatomy-thorax.js'),
      loadScript('anatomy-upper-limb.js'),
      loadScript('anatomy-development.js'),loadScript('anatomy-engine.js'),loadScript('anatomy-tension.js'),loadScript('anatomy-runtime.js')
    ]))]).catch(error=>{dependencies=null;throw error;});
    return dependencies;
  }
  async function mount(host,opts={}){
    if(!host||typeof host.replaceChildren!=='function')throw Error('Anatomy Zone needs a workspace container.');
    instances.get(host)?.destroy();
    const actor=window.LZCloud?.currentMember?.()?.id||null;
    let inner=null,destroyed=false;
    const handle={
      flush:async()=>{},
      destroy(){
        if(destroyed)return;destroyed=true;
        opts.signal?.removeEventListener('abort',handle.destroy);
        try{inner?.destroy();}finally{
          inner=null;
          if(instances.get(host)===handle){instances.delete(host);host.replaceChildren();}
        }
      }
    };
    instances.set(host,handle);
    if(opts.signal?.aborted){handle.destroy();return handle;}
    opts.signal?.addEventListener('abort',handle.destroy,{once:true});
    host.innerHTML='<p role="status">Loading Anatomy Zone…</p>';
    try{
      await loadDependencies();
      if(destroyed||instances.get(host)!==handle)return handle;
      if(host.isConnected===false){handle.destroy();return handle;}
      if(actor&&window.LZCloud?.currentMember?.()?.id!==actor){handle.destroy();throw Error('Your account changed. Open Anatomy Zone again.');}
      if(!window.LZAnatomyRuntime?.mount)throw Error('Anatomy Zone could not start. Open the zone again to retry.');
      inner=window.LZAnatomyRuntime.mount(host,opts);
      if(destroyed)inner.destroy();
      return handle;
    }catch(error){
      if(!destroyed&&instances.get(host)===handle){
        const notice=document.createElement('p');notice.setAttribute('role','alert');notice.textContent=error.message;
        host.replaceChildren(notice);instances.delete(host);opts.signal?.removeEventListener('abort',handle.destroy);
      }
      throw error;
    }
  }
  window.LZAnatomy={version:VERSION,mount,asset};
})();
