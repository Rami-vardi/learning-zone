/* Personal appearance preferences. No program or student records are changed. */
(function(){'use strict';
const PREFIX='learning-zone:appearance:v1:',root=document.documentElement;
const modes=['light','dark','system'],accents=['blue','teal','purple','copper'];
const narrowViewport=window.matchMedia('(max-width: 700px)');
const mediaDark=window.matchMedia?.('(prefers-color-scheme: dark)'),mediaMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const defaults=()=>({mode:'light',accent:'blue',contrast:'standard',text:'default',motion:mediaMotion?.matches?'reduced':'full'});
function sanitize(value){const d=defaults();if(!value||typeof value!=='object'||Array.isArray(value))return d;return {mode:modes.includes(value.mode)?value.mode:d.mode,accent:accents.includes(value.accent)?value.accent:d.accent,contrast:value.contrast==='high'?'high':'standard',text:value.text==='large'?'large':'default',motion:['reduced','full'].includes(value.motion)?value.motion:d.motion};}
function account(){try{return window.LZCloud?.currentMember?.()?.id||'device';}catch{return 'device';}}
let actor=account(),settings=defaults(),dialog,button,status,returnFocus;
function key(){return PREFIX+actor;}
function read(){try{return sanitize(JSON.parse(localStorage.getItem(key())||'null'));}catch{return defaults();}}
function effectiveMode(){return settings.mode==='system'?(mediaDark?.matches?'dark':'light'):settings.mode;}
const accentPalette={blue:{light:['#3157ad','#e3efff','#ffffff'],dark:['#9fbbff','#223d66','#111f38']},teal:{light:['#086f69','#e3f3ef','#ffffff'],dark:['#72d5c7','#193f3b','#082e29']},purple:{light:['#6a48ab','#f1ebfb','#ffffff'],dark:['#c7aeff','#3b2d58','#25163e']},copper:{light:['#964d23','#fbefe4','#ffffff'],dark:['#f1ba91','#4c3327','#321b0d']}};
function apply(){
 const dark=effectiveMode()==='dark',high=settings.contrast==='high',a=accentPalette[settings.accent][dark?'dark':'light'];
 const colors=dark?{bg:'#172235',paper:'#172235',ink:'#e9f0fe',sub:high?'#e1eaf8':'#a7b8d3',line:high?'#b8c9de':'#374764',nav:'#0c1522',shadow:'#00000025',neutral:'#1e2b42'}:{bg:'#f3f6fb',paper:'#ffffff',ink:high?'#101c2c':'#162944',sub:high?'#2e4057':'#536782',line:high?'#697d98':'#ccd7e7',nav:'#13243c',shadow:'#172e4c0d',neutral:'#f3f6fb'};
 root.dataset.lzAppearance=dark?'dark':'light';root.dataset.lzContrast=settings.contrast;root.dataset.lzText=settings.text;root.dataset.lzMotion=settings.motion;root.dataset.lzAccent=settings.accent;root.dataset.lzThemeReady='true';root.style.colorScheme=dark?'dark':'light';
 const vars={'--lz-bg':colors.bg,'--lz-paper':colors.paper,'--lz-surface':colors.paper,'--lz-ink':colors.ink,'--lz-text':colors.ink,'--lz-sub':colors.sub,'--lz-muted':colors.sub,'--lz-line':colors.line,'--lz-border':colors.line,'--lz-nav':colors.nav,'--lz-shadow':colors.shadow,'--lz-neutral':colors.neutral,'--lz-blue':a[0],'--lz-accent':a[0],'--lz-soft':a[1],'--lz-accent-soft':a[1],'--lz-on-accent':a[2],'--lz-danger':dark?'#ffaaa5':'#a33939','--lz-focus':dark?'#f4d56d':'#1a4b9a'};
 for(const [k,v]of Object.entries(vars))root.style.setProperty(k,v);
 try{window.dispatchEvent(new CustomEvent('lz-appearance-change',{detail:{...settings,effectiveMode:dark?'dark':'light'}}));}catch{}
 syncForm();
}
function persist(){try{localStorage.setItem(key(),JSON.stringify(settings));if(status)status.textContent='Saved for this browser.';}catch{if(status)status.textContent='Applied for this visit. This browser could not remember your settings.';}apply();}
function syncForm(){if(!dialog)return;for(const name of ['mode','accent','contrast','text']){const el=dialog.querySelector('[name="'+name+'"]');if(el)el.value=settings[name];}dialog.querySelector('[name="motion"]').checked=settings.motion==='reduced';}
function refresh(){const next=account();if(next!==actor){actor=next;settings=read();if(dialog?.open)dialog.close();apply();}}
function close(){dialog?.close();}
function open(invoker=document.activeElement){refresh();if(!dialog||dialog.open)return;syncForm();status.textContent='';returnFocus=invoker;dialog.showModal();}
function attachMobileMenu(footer){
 const sidebar=footer.closest('.app-sidebar');
 const nav=sidebar?.querySelector('.app-nav'),brand=sidebar?.querySelector('.app-brand');
 if(!nav||!brand)return;
 footer.id='lz-account-controls';
 const toggle=document.createElement('button');
 toggle.type='button';toggle.id='lz-nav-toggle';
 toggle.innerHTML='<i data-lucide="menu" aria-hidden="true"></i><span>Menu</span>';
 toggle.setAttribute('aria-label','Workspace menu');
 toggle.setAttribute('aria-controls','workspace-navigation lz-account-controls');
 brand.after(toggle);
 function setOpen(open){
  sidebar.dataset.mobileMenu=open?'open':'closed';
  toggle.setAttribute('aria-expanded',String(open));
 }
 setOpen(false);
 toggle.addEventListener('click',()=>setOpen(sidebar.dataset.mobileMenu!=='open'));
 nav.addEventListener('click',event=>{
  if(!narrowViewport.matches||!event.target.closest('[data-nav]'))return;
  setOpen(false);
  if(event.detail>0)toggle.focus({preventScroll:true});
 });
 sidebar.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&narrowViewport.matches&&sidebar.dataset.mobileMenu==='open'){
   event.preventDefault();setOpen(false);toggle.focus({preventScroll:true});
  }
 });
 narrowViewport.addEventListener?.('change',()=>setOpen(false));
}
function boot(){
 if(document.querySelector('#lz-appearance-dialog'))return;
 const footer=document.querySelector('.app-sidebar-footer');if(!footer)return;
 attachMobileMenu(footer);
 button=document.createElement('button');button.type='button';button.id='appearance-settings-button';button.textContent='Settings';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','lz-appearance-dialog');footer.insertBefore(button,document.querySelector('#help-button'));
 dialog=document.createElement('dialog');dialog.id='lz-appearance-dialog';dialog.className='lz-appearance-dialog';dialog.setAttribute('aria-labelledby','lz-appearance-title');
 dialog.innerHTML='<form method="dialog"><header><div><h2 id="lz-appearance-title">Settings</h2><p>Make your workspace comfortable to use.</p></div><button type="button" data-appearance-close aria-label="Close Settings">Close</button></header><div class="lz-appearance-fields"><label for="lz-appearance-mode">Appearance<select id="lz-appearance-mode" name="mode"><option value="light">Light</option><option value="dark">Dark</option><option value="system">Follow System</option></select></label><label for="lz-appearance-accent">App Color<select id="lz-appearance-accent" name="accent"><option value="blue">Blue</option><option value="teal">Teal</option><option value="purple">Purple</option><option value="copper">Copper</option></select></label><label for="lz-appearance-contrast">Contrast<select id="lz-appearance-contrast" name="contrast"><option value="standard">Standard</option><option value="high">High Contrast</option></select></label><label for="lz-appearance-text">Text Size<select id="lz-appearance-text" name="text"><option value="default">Default</option><option value="large">Large</option></select></label><label class="lz-appearance-check"><input type="checkbox" name="motion">Reduce Motion</label></div><p class="lz-appearance-note">Appearance settings are personal and saved in this browser for your account. Exercise roles, goal colors and whiteboard content keep their meaning.</p><p class="lz-appearance-status" role="status" aria-live="polite"></p><footer><button type="button" data-appearance-reset>Reset Appearance</button><button type="button" data-appearance-close class="lz-appearance-done">Done</button></footer></form>';
 document.body.appendChild(dialog);status=dialog.querySelector('.lz-appearance-status');
 button.addEventListener('click',()=>open(button));dialog.querySelectorAll('[data-appearance-close]').forEach(b=>b.addEventListener('click',close));
 dialog.addEventListener('change',e=>{const name=e.target.name;if(['mode','accent','contrast','text'].includes(name))settings=sanitize({...settings,[name]:e.target.value});else if(name==='motion')settings.motion=e.target.checked?'reduced':'full';else return;persist();});
 dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
 dialog.querySelector('[data-appearance-reset]').addEventListener('click',()=>{settings=defaults();persist();});syncForm();
 if(window.lucide?.createIcons)window.lucide.createIcons({attrs:{width:19,height:19}});
}
settings=read();apply();
window.LZAppearance={open,refresh,get:()=>({...settings,effectiveMode:effectiveMode()}),motionReduced:()=>settings.motion==='reduced'};
for(const name of ['lz-account-change','lz-cloud-session-change'])window.addEventListener(name,refresh);
window.addEventListener('storage',e=>{if(e.key===key()){settings=read();apply();}});
mediaDark?.addEventListener?.('change',()=>{if(settings.mode==='system')apply();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
