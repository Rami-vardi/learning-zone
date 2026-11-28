(() => {
  'use strict';


  // Sheet cells and the progression dialog use the same planned and actual rows.
  function sheetExercise(exercise,api){
    const model=window.LZProgression;
    function alternatives(){
      return exercise.progression?.alternatives?.length?model.forExercise(exercise).alternatives:[];
    }
    const initial=alternatives();
    let altId=(initial.find(track=>track.id===Number(exercise.selectedAlternativeId))||initial[0])?.id;
    function track(key,write=false){
      const main=model.forExercise(exercise);
      if(write)exercise.progression=main;
      if(key==='weeks')return main;
      let alt=main.alternatives.find(t=>t.id===altId)||main.alternatives[0];
      if(!alt&&write){alt=model.addAlternative(main);model.setWeeks(alt,1);}
      if(alt){altId=alt.id;if(write)exercise.selectedAlternativeId=alt.id;}
      return alt;
    }
    const tag=key=>key==='weeks'?'main':'alt'+(altId||exercise.progression?.nextAlternative||1);
    const signature=t=>t?JSON.stringify([t.weeks,...t.rows.slice(0,t.weeks).map(r=>r.planned)]):'';
    function display(t,key){
      if(!t||(key==='alternative'&&t.weeks===1&&!t.rows[0].planned))return '';
      return Array.from({length:t.weeks},(_,i)=>'Week '+(i+1)+': '+(t.rows[i]?.planned||'')).join('\n');
    }
    function read(key){
      const t=track(key),draft=exercise.sheetDrafts?.[tag(key)];
      if(draft){
        if(draft.signature===signature(t))return draft.text;
        // Retain incomplete text typed in the previous spreadsheet while its original rows still match.
        if(key==='weeks'&&!exercise.weeklyPrescription&&exercise.progression&&
          draft.signature===signature(model.create(exercise.progression,exercise.mode))&&
          (parse(draft.text).pending||parse(draft.text).issue))return draft.text;
      }
      return display(t,key);
    }
    function parse(value){
      const weeks=new Map();let index=null,pending=false;
      for(const line of value.split('\n')){
        const match=/^\s*week\s+(\d+)\s*:\s?(.*)$/i.exec(line);
        if(match){
          index=Number(match[1]);
          if(index<1||index>52||weeks.has(index))return {issue:'Use each week number once, from 1 to 52.'};
          weeks.set(index,match[2]);
        }else if(/^\s*w(?:e(?:e(?:k(?:\s+\d*)?)?)?)?\s*$/i.test(line)){pending=true;index=null;}
        else if(index!==null)weeks.set(index,weeks.get(index)+'\n'+line);
        else if(line.trim()){index=1;weeks.set(1,line);}
      }
      return {weeks,pending};
    }
    function write(key,value){
      const parsed=parse(value),prior=track(key);
      let t=prior;
      if(parsed.weeks&&(prior||value.trim())&&(!parsed.pending||parsed.weeks.size)){
        t=track(key,true);
        const count=Math.max(parsed.pending?t.weeks:1,...parsed.weeks.keys());
        model.setWeeks(t,count);
        for(let i=0;i<count;i++){
          if(!parsed.pending||parsed.weeks.has(i+1))t.rows[i].planned=parsed.weeks.get(i+1)||'';
        }
        if(key==='weeks')exercise.weeklyPrescription=true;
      }
      const id=tag(key);
      if(value===display(t,key)){
        if(exercise.sheetDrafts)delete exercise.sheetDrafts[id];
      }else{
        (exercise.sheetDrafts||={})[id]={signature:signature(t),text:value};
      }
      api.schedule();
    }
    return {
      id:'e'+exercise.id,source:exercise,track,tag,
      hasDraft(key){const t=track(key),draft=exercise.sheetDrafts?.[tag(key)];return !!draft&&read(key)!==display(t,key);},
      get goal(){return api.isGoalExercise(exercise);},
      get name(){return exercise.name;},set name(value){exercise.name=value;delete exercise.exerciseId;api.schedule();},

      get weeks(){return read('weeks');},set weeks(value){write('weeks',value);},
      get alternative(){return read('alternative');},set alternative(value){write('alternative',value);},
      get alternatives(){return alternatives();},
      get alternativeId(){return altId;},
      selectAlternative(id){
        if(id==='new'){
          const main=model.forExercise(exercise);
          const alt=model.addAlternative(main);
          model.setWeeks(alt,1);
          exercise.progression=main;
          id=alt.id;
        }
        altId=id;
        exercise.selectedAlternativeId=id;
        api.schedule();
      },
      issue(key){return parse(read(key)).issue||'';}
    };
  }

class AthleteSpreadsheet extends HTMLElement {
  disconnectedCallback(){this.observer?.disconnect();}
  focusPrescription(id,key){
    const area=this.shadowRoot?.querySelector('[data-week-id="e'+id+'-'+key+'"],[data-track-ex="e'+id+'"][data-track-key="'+key+'"] textarea');
    if(area)area.focus({preventScroll:true});
  }
  mount(athlete,api){
    const shadow=this.attachShadow({mode:'open'});
    shadow.innerHTML="<link rel=\"stylesheet\" href=\"athlete-sheet.css?v=unified-sheet1\"><div id=\"workout-sheet\">\n  <div data-placement hidden></div>\n  <div data-workouts></div>\n  <span class=\"wp-sr\" role=\"status\" aria-live=\"polite\" data-status></span>\n</div>\n";
    const root=shadow.querySelector('#workout-sheet'),stage=root.querySelector('[data-workouts]');
    const style=shadow.querySelector('link');if(!style.sheet){root.style.visibility='hidden';style.onload=style.onerror=()=>root.style.removeProperty('visibility');}
  const fields=['name','weeks','alternative'],heads=['Exercise','Sets × reps × load / RIR','Alternative progressions'];
  const days=athlete.days.slice();
  const schedule=days.map((_,index)=>index);
  const workouts=days.map(day=>day.exercises.map(exercise=>sheetExercise(exercise,api)));
  const visible=new Set(schedule.filter(d=>api.includesWorkout(days[d])));
  const weeklyField=k=>k==='weeks'||k==='alternative';
  const workoutName=d=>days[d].name||'Workout '+(d+1);
  const dayName=d=>'Day '+(schedule.indexOf(d)+1);
  const locate=id=>workouts.findIndex(list=>list.some(e=>e.id===id));
  const details=id=>id.startsWith('w')?{d:Number(id.slice(1)),whole:true}:{d:locate(id),whole:false};
  function itemName(id){const {d,whole}=details(id);return whole?workoutName(d):workouts[d].find(e=>e.id===id).name;}
  let openMenu=null,drag=null;
  const placement=root.querySelector('[data-placement]');
  function status(msg){root.querySelector('[data-status]').textContent=msg;}
  function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;}
  function button(label,fn){const b=el('button','cursor-interaction',label);b.type='button';b.addEventListener('click',fn);return b;}
  const linesOf=str=>str.split('\n');
  const numberOf=line=>Number(/^\s*week\s+(\d+)\b/i.exec(line)?.[1])||0;
  const nextWeek=(lines,i)=>{const used=new Set(lines.map((s,j)=>j===i?0:numberOf(s)));let n=1+Math.max(0,...lines.slice(0,i).map(numberOf));while(used.has(n))n++;return n;};
  const lineAt=area=>area.value.slice(0,area.selectionStart).split('\n').length-1;
  const startAt=(lines,i)=>lines.slice(0,i).reduce((n,s)=>n+s.length+1,0);
  function dismiss(){
    if(!openMenu)return;
    const {area,list}=openMenu;openMenu=null;list.remove();area.setAttribute('aria-expanded','false');area.removeAttribute('aria-controls');area.removeAttribute('aria-activedescendant');
  }
  stage.addEventListener('scroll',dismiss,{passive:true});
  function sync(area){area.parentElement.dataset.copy=area.value||area.placeholder;area.dispatchEvent(new Event('input',{bubbles:true}));}
  function suggest(area){
    dismiss();if(shadow.activeElement!==area || area.selectionEnd!==area.selectionStart)return;
    const lines=linesOf(area.value),index=lineAt(area),prefix=lines[index];
    if(!/^\s*we(?:e(?:k)?)?\s*$/i.test(prefix)||area.selectionStart!==startAt(lines,index)+prefix.length)return;
    if(nextWeek(lines,index)>52)return;
    const text='Week '+nextWeek(lines,index),id='wp-option-'+area.dataset.weekId;
    const list=el('div','wp-picks'),pick=button(text,accept);list.id=id+'-list';list.setAttribute('role','listbox');pick.id=id;pick.setAttribute('role','option');pick.setAttribute('aria-selected','true');pick.append(el('kbd','', 'Enter'));list.append(pick);area.parentElement.append(list);
    pick.addEventListener('pointerdown',e=>e.preventDefault());
    area.setAttribute('aria-controls',list.id);area.setAttribute('aria-expanded','true');area.setAttribute('aria-activedescendant',id);
    openMenu={area,list,accept};
    function accept(){
      dismiss();const from=startAt(lines,index);
      area.focus();area.setRangeText(text+': ',from,from+prefix.length,'end');sync(area);
    }
  }
  function nameSuggestions(area,e){
    area.setAttribute('role','combobox');area.setAttribute('aria-autocomplete','list');area.setAttribute('aria-expanded','false');
    let selected=0;
    function show(){
      dismiss();
      area.parentElement.dataset.copy=area.value||area.placeholder;
      const records=window.LZIdentity.search(area.value,30);
      if(!records.length)return;
      const list=el('div','wp-picks wp-name-picks');list.id='wp-names-'+e.id;list.setAttribute('role','listbox');
      selected=0;
      const accept=()=>{
        const record=records[selected];area.value=record.name;e.name=record.name;
        area.parentElement.dataset.copy=area.value;area.dispatchEvent(new Event('change'));dismiss();
      };
      records.forEach((record,i)=>{
        const option=button(record.name,()=>{selected=i;accept();});
        option.id=list.id+'-'+i;option.setAttribute('role','option');option.setAttribute('aria-selected',String(i===0));list.append(option);
      });
      list.onpointerdown=ev=>ev.preventDefault();root.append(list);
      const b=area.getBoundingClientRect(),width=Math.min(300,innerWidth-12);list.style.width=width+'px';
      list.style.left=Math.max(4,Math.min(b.left,innerWidth-width-6))+'px';
      if(innerHeight-b.bottom<140&&b.top>145){list.style.top='auto';list.style.bottom=(innerHeight-b.top)+'px';}else list.style.top=b.bottom+'px';
      area.setAttribute('aria-controls',list.id);area.setAttribute('aria-expanded','true');area.setAttribute('aria-activedescendant',list.firstChild.id);
      openMenu={area,list,accept};
    }
    area.addEventListener('input',show);area.addEventListener('focus',show);area.addEventListener('blur',dismiss);
    area.addEventListener('keydown',ev=>{
      if(ev.isComposing)return;
      if(openMenu?.area!==area){
        if(ev.key==='Enter'){ev.preventDefault();area.blur();}
        return;
      }
      if(['ArrowUp','ArrowDown'].includes(ev.key)){
        ev.preventDefault();const list=openMenu.list;selected=Math.min(list.children.length-1,Math.max(0,selected+(ev.key==='ArrowUp'?-1:1)));
        [...list.children].forEach((item,i)=>item.setAttribute('aria-selected',String(i===selected)));
        const item=list.children[selected];item.scrollIntoView({block:'nearest'});area.setAttribute('aria-activedescendant',item.id);
      }else if(ev.key==='Enter'){ev.preventDefault();openMenu.accept();}else if(ev.key==='Escape'){ev.preventDefault();dismiss();}
    });
  }
  function applyWidths(part,widths){
    part.style.flex='0 0 '+(widths.reduce((a,b)=>a+b,0)+2)+'px';
    part.querySelectorAll('col').forEach((col,i)=>col.style.width=widths[i]+'px');
  }
  function resizer(d,column){
    const handle=el('button','wp-resize');handle.type='button';handle.dataset.resize=column;
    handle.title=column<0?'Resize workout table':'Resize '+heads[column];handle.setAttribute('aria-label',handle.title);
    const part=()=>handle.closest('.wp-unit');
    function widths(){
      const th=[...part().querySelectorAll('th')];return th.length?th.map(h=>h.getBoundingClientRect().width):[.28,.44,.28].map(f=>part().clientWidth*f);
    }
    function adjust(initial,dx){
      const total=initial.reduce((a,b)=>a+b);
      const next=initial.map((w,i)=>Math.max(65,Math.min(1800,Math.round(column<0?w*(total+dx)/total:w+(i===column?dx:0)))));
      days[d].sheetWidths=next;applyWidths(part(),next);
    }
    let start;
    handle.onpointerdown=ev=>{if(ev.button!==0)return;ev.preventDefault();dismiss();start={x:ev.clientX,widths:widths()};handle.setPointerCapture(ev.pointerId);};
    handle.onpointermove=ev=>{if(start)adjust(start.widths,ev.clientX-start.x);};
    handle.onlostpointercapture=()=>{if(start){start=null;api.schedule();}};
    handle.onkeydown=ev=>{if(['ArrowRight','ArrowLeft'].includes(ev.key)){ev.preventDefault();adjust(widths(),ev.key==='ArrowRight'?20:-20);api.schedule();}};
    return handle;
  }
  const model=window.LZProgression;
  const exerciseById=id=>workouts.flat().find(e=>e.id===id);
  function focusTrack(e,key,i=0){
    const cell=stage.querySelector('[data-track-ex="'+e.id+'"][data-track-key="'+key+'"]');
    (cell?.querySelector('[data-index="'+i+'"] textarea')||cell?.querySelector('textarea'))?.focus({preventScroll:true});
  }
  function saveTrack(e,key){
    if(e.source.sheetDrafts)delete e.source.sheetDrafts[e.tag(key)];
    if(key==='weeks')e.source.weeklyPrescription=true;
    api.schedule();
  }
  function weekChange(e,key,task,syncSets=true){
    const t=e.track(key,true);task(t);saveTrack(e,key);
    if(key==='weeks'&&syncSets)api.applyWeekToSets(e.source);
  }
  function trackHandle(e,key,i){
    const node=el('button',i===null?'wp-grip wp-track-grip':'wp-week-word',i===null?'':'Week');
    node.type='button';node.dataset.trackGrip=i===null?'alternative':'week';node.dataset.ex=e.id;node.dataset.key=key;
    if(i!==null)node.dataset.index=i;
    node.title=i===null?'Move alternative to another exercise':'Move Week '+(i+1);
    node.setAttribute('aria-label',node.title);return node;
  }
  function drawWeeks(e,key,td){
    const cell=el('div','wp-track');cell.dataset.trackEx=e.id;cell.dataset.trackKey=key;td.append(cell);
    if(e.hasDraft(key)){
      editor(e,key,cell);
      return;
    }
    const track=e.track(key);
    const count=track?.weeks||1;
    for(let i=0;i<count;i++){
      const row=el('div','wp-week-line'),chip=el('span','wp-week-chip'),num=el('input'),box=el('div','wp-box'),area=el('textarea');
      row.dataset.index=i;
      num.inputMode='numeric';num.value=String(i+1);num.setAttribute('aria-label','Week number');num.dataset.weekNumber='';
      let labelRemoved=!!track?.rows[i]?.sheetHideWeek;
      chip.append(trackHandle(e,key,i),num);chip.hidden=!track||labelRemoved;
      area.rows=1;area.value=track?.rows[i]?.planned||'';area.dataset.weekId=e.id+'-'+key;
      area.setAttribute('aria-label',(e.name||'Exercise')+' '+(key==='weeks'?'Main progression':'Alternative')+' Week '+(i+1));
      area.placeholder=track?'':'Week 1';box.dataset.copy=area.value||area.placeholder;box.append(area);row.append(chip,box);cell.append(row);
      let expanded=false,startedEmpty=!area.value;
      function input(){
        if(!area.value)startedEmpty=true;
        if(expanded){
          // Accept typing out the rest of the week label after its automatic completion.
          if(/^ek\s*\d{0,2}\s*:\s?/i.test(area.value)){area.value=area.value.replace(/^ek\s*\d{0,2}\s*:\s?/i,'');expanded=false;}
          else if(area.value&&!/^e(?:k(?:\s*\d{0,2})?\s*)?$/i.test(area.value)){
            if(/^[a-z]/i.test(area.value))area.value='we'+area.value;
            expanded=false;
          }
        }
        if(/^week\s+\d+\s*:\s?/i.test(area.value)){area.value=area.value.replace(/^week\s+\d+\s*:\s?/i,'');labelRemoved=false;chip.hidden=false;num.value=String(i+1);}
        if((startedEmpty||chip.hidden)&&area.value.toLowerCase()==='we'){
          expanded=true;labelRemoved=false;chip.hidden=false;num.value=String(i+1);area.value='';
        }else if(!chip.hidden||!/^w(?:e(?:e(?:k)?)?)?$/i.test(area.value)){
          if(chip.hidden&&!labelRemoved&&area.value.trim()){chip.hidden=false;num.value=String(i+1);}
        }else if(/^we(?:e|k)?$/i.test(area.value)){
          expanded=area.value.toLowerCase()==='we';
          labelRemoved=false;chip.hidden=false;num.value=String(i+1);area.value='';
        }else{
          if(e.track(key))weekChange(e,key,t=>{t.rows[i].planned=area.value;},false);
          else e[key]=area.value;
          box.dataset.copy=area.value;return;
        }
        weekChange(e,key,t=>{t.rows[i].planned=area.value;if(!labelRemoved)delete t.rows[i].sheetHideWeek;},false);
        if(area.value&&area.value.toLowerCase()!=='w')startedEmpty=false;
        box.dataset.copy=area.value||area.placeholder;
      }
      area.oninput=input;
      area.onchange=()=>{
        if(key==='weeks'&&i===0){api.applyWeekToSets(e.source);api.schedule();}
        if(!track&&e.alternatives.length&&!td.querySelector('.wp-alt-select')){
          // The first typed alternative creates its track immediately.
          td.querySelector('.wp-add-alt')?.remove();
          td.prepend(alternativeToolbar(e));
        }
      };
      function erase(){
        const t=e.track(key);
        if(t&&t.weeks>1&&!area.value&&!t.rows[i].actual){
          weekChange(e,key,t=>{t.rows.splice(i,1);model.setWeeks(t,t.weeks-1);});
          render();focusTrack(e,key,Math.max(0,i-1));
        }else{
          labelRemoved=true;chip.hidden=true;
          if(t)weekChange(e,key,t=>{t.rows[i].sheetHideWeek=true;},false);
          area.focus();area.setSelectionRange(0,0);
        }
      }
      function backspace(ev){
        const target=ev.target;
        if(chip.hidden||target.selectionStart!==target.selectionEnd||target.selectionStart!==0)return;
        if(target===num&&num.value)return;
        ev.preventDefault();
        if(target===area&&num.value){num.value=num.value.slice(0,-1);num.focus();num.setSelectionRange(num.value.length,num.value.length);}
        else erase();
      }
      row.addEventListener('beforeinput',ev=>{if(ev.inputType==='deleteContentBackward'&&(ev.target===num||ev.target===area))backspace(ev);});
      row.addEventListener('keydown',ev=>{
        if(ev.isComposing)return;
        if(ev.key==='Backspace'&&(ev.target===num||ev.target===area)){backspace(ev);return;}
        if(ev.target!==area||ev.key!=='Enter'||ev.shiftKey)return;
        ev.preventDefault();if((e.track(key)?.weeks||1)>=52){status('Maximum 52 weeks.');return;}
        const prefix=area.value.slice(0,area.selectionStart),suffix=area.value.slice(area.selectionEnd);
        weekChange(e,key,t=>{t.rows[i].planned=prefix;t.rows.splice(i+1,0,model.row({planned:suffix},t.format));model.setWeeks(t,t.weeks+1);});
        render();const next=stage.querySelector('[data-track-ex="'+e.id+'"][data-track-key="'+key+'"] .wp-week-line[data-index="'+(i+1)+'"]');
        next.querySelector('.wp-week-chip').hidden=!suffix;focusTrack(e,key,i+1);
      });
      num.onchange=()=>{
        if(!num.value)return;
        const t=e.track(key),j=Number(num.value)-1;
        if(!t||!Number.isInteger(j)||j<0||j>=t.weeks){num.value=String(i+1);return;}
        if(j===i)return;
        weekChange(e,key,t=>{t.rows.splice(j,0,t.rows.splice(i,1)[0]);});render();focusTrack(e,key,j);
      };
      area.addEventListener('paste',ev=>{
        const text=ev.clipboardData.getData('text/plain').replace(/\r\n?/g,'\n');
        if(!/^\s*Week\s+\d+: /im.test(text)||!text.includes('\n'))return;
        ev.preventDefault();
        const lines=text.split(/\n(?=\s*Week\s+\d+:)/i).map(s=>s.replace(/^\s*Week\s+\d+:\s?/i,''));
        if(i+lines.length>52){status('Maximum 52 weeks.');return;}
        weekChange(e,key,t=>{model.setWeeks(t,Math.max(t.weeks,i+lines.length));lines.forEach((s,j)=>t.rows[i+j].planned=s);});
        render();focusTrack(e,key,i);
      });
    }
  }
  function trackDestination(x,y,source){
    const hit=shadow.elementFromPoint(x,y);if(!hit)return null;
    if(source.dataset.trackGrip==='alternative')return hit.closest('[data-alt-destination]');
    if(source.dataset.trackGrip==='set')return hit.closest('[data-set-line]');
    return hit.closest('.wp-week-line');
  }
  function moveTrack(source,dest,after){
    const data=source.dataset;
    if(data.trackGrip==='set'){
      const a=+data.index,b=+dest.dataset.setLine;if(a===b||!targetDraft)return;
      targetDraft.splice(b,0,targetDraft.splice(a,1)[0]);drawTargets();return;
    }
    const a=exerciseById(data.ex),cell=dest.closest('.wp-track'),whole=data.trackGrip==='alternative';
    const b=exerciseById(whole?dest.dataset.altDestination:cell.dataset.trackEx);
    if(whole&&a===b)return;
    const mainA=model.forExercise(a.source),mainB=a===b?mainA:model.forExercise(b.source);
    const alt=(e,p)=>p.alternatives.find(t=>t.id===e.alternativeId);
    if(whole){
      const old=alt(a,mainA);if(!old)return;
      const fresh=model.addAlternative(mainB),id=fresh.id;Object.assign(fresh,old,{id});
      mainA.alternatives.splice(mainA.alternatives.indexOf(old),1);
      const draft=a.source.sheetDrafts?.['alt'+old.id];
      if(draft){(b.source.sheetDrafts||={})['alt'+id]=draft;delete a.source.sheetDrafts['alt'+old.id];}
      a.source.selectedAlternativeId=mainA.alternatives[0]?.id;b.source.selectedAlternativeId=id;
    }else{
      const from=data.key==='weeks'?mainA:alt(a,mainA),toKey=cell.dataset.trackKey;
      let to=toKey==='weeks'?mainB:alt(b,mainB);
      if(!from)return;
      if(!to){to=model.addAlternative(mainB);to.rows=[];to.weeks=0;b.source.selectedAlternativeId=to.id;}
      const i=+data.index,j=+dest.dataset.index;
      if(from===to&&i===j)return;
      if(from!==to&&to.weeks>=52){status('Maximum 52 weeks.');return;}
      const pos=Math.min(to.weeks,j+(after?1:0));
      const moved=from.rows.splice(i,1)[0];to.rows.splice(pos-(from===to&&i<pos?1:0),0,moved);
      if(from!==to){
        if(from.weeks===1)from.rows.unshift(model.row({},from.format));
        model.setWeeks(from,Math.max(1,from.weeks-1));model.setWeeks(to,to.weeks+1);
      }
      if(data.key==='weeks')a.source.weeklyPrescription=true;if(toKey==='weeks')b.source.weeklyPrescription=true;
    }
    a.source.progression=mainA;b.source.progression=mainB;
    if(!whole){if(data.key==='weeks')api.applyWeekToSets(a.source);if(cell.dataset.trackKey==='weeks')api.applyWeekToSets(b.source);}
    // Remount wrappers so selected alternative IDs follow the transferred tracks.
    api.refreshSheet();api.schedule();
  }
  let trackDrag=null,clickSource=null;
  function markTrack(){
    root.querySelector('[data-track-drop]')?.removeAttribute('data-track-drop');
    trackDestination(trackDrag.clientX,trackDrag.clientY,trackDrag.handle)?.setAttribute('data-track-drop','');
  }
  function scrollTrack(){
    if(!trackDrag?.active||!root.isConnected)return;
    trackDrag.frame=0;
    if(scrollAtEdge(trackDrag.clientX,trackDrag.clientY)){markTrack();trackDrag.frame=requestAnimationFrame(scrollTrack);}
  }
  root.addEventListener('pointerdown',ev=>{
    const handle=ev.target.closest('[data-track-grip]');if(!handle||!ev.isPrimary||ev.button!==0)return;
    trackDrag={handle,x:ev.clientX,y:ev.clientY,pointer:ev.pointerId};handle.setPointerCapture(ev.pointerId);
  });
  root.addEventListener('pointermove',ev=>{
    if(!trackDrag||trackDrag.pointer!==ev.pointerId)return;
    if(!trackDrag.active&&Math.hypot(ev.clientX-trackDrag.x,ev.clientY-trackDrag.y)<5)return;
    trackDrag.active=true;trackDrag.clientX=ev.clientX;trackDrag.clientY=ev.clientY;
    markTrack();if(!trackDrag.frame)trackDrag.frame=requestAnimationFrame(scrollTrack);
  });
  root.addEventListener('pointerup',ev=>{
    if(!trackDrag||trackDrag.pointer!==ev.pointerId)return;
    const gesture=trackDrag;trackDrag=null;if(!gesture.active)return;
    cancelAnimationFrame(gesture.frame);
    const dest=trackDestination(ev.clientX,ev.clientY,gesture.handle);root.querySelector('[data-track-drop]')?.removeAttribute('data-track-drop');
    suppressClick=true;clickSource=null;
    if(dest){const box=dest.getBoundingClientRect();requestAnimationFrame(()=>{if(root.isConnected)moveTrack(gesture.handle,dest,ev.clientY>box.top+box.height/2);});}
  });
  root.addEventListener('pointercancel',()=>{trackDrag=null;root.querySelector('[data-track-drop]')?.removeAttribute('data-track-drop');});
  root.addEventListener('keydown',ev=>{if(ev.key==='Escape'){clickSource=null;status('');}});
  root.addEventListener('click',ev=>{
    const source=ev.target.closest('[data-track-grip]');
    if(clickSource?.isConnected){
      const dest=clickSource.dataset.trackGrip==='set'?ev.target.closest('[data-set-line]'):clickSource.dataset.trackGrip==='week'?ev.target.closest('.wp-week-line'):ev.target.closest('[data-alt-destination]');
      if(dest){const previous=clickSource;clickSource=null;status('');if(previous!==source)moveTrack(previous,dest,false);return;}
    }
    clickSource=source;if(source)status(source.title+' · select a destination, or press Escape');
  });
  let targetExercise=null,targetWeek=0,targetDraft=null,targetOriginal='',targetBaseline='';
  function setTargets(e,index=0){
    targetExercise=e;targetWeek=index;targetOriginal=e.track('weeks').rows[index].planned;
    const blank={kind:'Working',reps:'',load:'',rir:''};targetDraft=[];
    for(const line of targetOriginal.split('\n')){
      const m=/^\s*(?:(Top|Back[ -]off|Set\s+\d+)\s*:\s*)?(\d+)\s*[×x]\s*(\d+(?:\s*(?:–|-|to)\s*\d+)?)\s*(?:[×x·]\s*(?![\d.]+\s*RIR\s*$)([^·@]+?))?\s*(?:[·@]\s*([\d.]+(?:[–-][\d.]+)?)\s*RIR)?\s*$/i.exec(line);
      if(!m||Number(m[2])<1||Number(m[2])+targetDraft.length>20){targetDraft=[];break;}
      for(let i=0;i<Number(m[2]);i++)targetDraft.push({kind:/^top$/i.test(m[1])?'Top':/^back/i.test(m[1])?'Back off':'Working',reps:m[3],load:m[4]?.trim()||'',rir:m[5]||''});
    }
    if(!targetDraft.length)targetDraft.push(blank);
    targetBaseline=JSON.stringify(targetDraft);
    drawTargets();placement.querySelector('select').focus();
  }
  function drawTargets(){
    dismiss();placement.replaceChildren();placement.hidden=false;
    const e=targetExercise,close=()=>{placement.hidden=true;targetDraft=null;stage.querySelector('[data-row="'+e.id+'"] .wp-sets')?.focus({preventScroll:true});};
    const title=el('strong','',e.name+' · Set targets'),week=el('select');
    week.setAttribute('aria-label','Target week');for(let i=0;i<e.track('weeks').weeks;i++)week.add(new Option('Week '+(i+1),i));
    week.value=targetWeek;week.onchange=()=>setTargets(e,Number(week.value));
    placement.append(title,week,button('Close',close));
    if(targetOriginal)placement.append(el('div','wp-current-plan','Current plan · '+targetOriginal));
    const grid=el('div','wp-target-rows');
    targetDraft.forEach((set,i)=>{
      const line=el('div','wp-target-row');line.dataset.setLine=i;
      const move=el('button','wp-grip');move.type='button';move.dataset.trackGrip='set';move.dataset.index=i;move.title='Move set '+(i+1);move.setAttribute('aria-label',move.title);
      const kind=el('select');kind.setAttribute('aria-label','Set '+(i+1)+' type');
      for(const k of ['Working','Top','Back off'])kind.add(new Option(k,k));kind.value=set.kind;kind.onchange=()=>set.kind=kind.value;
      line.append(move,kind);
      for(const [key,name] of [['reps','Reps'],['load','Load'],['rir','RIR']]){
        const label=el('label','',name),field=el('input');field.value=set[key];field.setAttribute('aria-label','Set '+(i+1)+' '+name);field.oninput=()=>set[key]=field.value;label.append(field);line.append(label);
      }
      const cut=button('×',()=>{targetDraft.splice(i,1);drawTargets();});cut.disabled=targetDraft.length===1;cut.setAttribute('aria-label','Remove set '+(i+1));line.append(cut);grid.append(line);
    });
    const more=button('+ Set',()=>{targetDraft.push({...targetDraft.at(-1)});drawTargets();});more.disabled=targetDraft.length>=20;
    placement.append(grid,more,button('Apply to week',()=>{
      if(JSON.stringify(targetDraft)===targetBaseline){close();return;}
      const setText=(s,count)=>count+' × '+(s.reps.trim()||'?')+(s.load.trim()?' × '+s.load.trim():'')+(s.rir.trim()?' · '+s.rir.trim()+' RIR':'');
      const shared=targetDraft.every(s=>s.kind==='Working'&&JSON.stringify(s)===JSON.stringify(targetDraft[0]));
      const plan=shared?setText(targetDraft[0],targetDraft.length):targetDraft.map((s,i)=>(s.kind==='Working'?'Set '+(i+1):s.kind)+': '+setText(s,1)).join('\n');
      weekChange(e,'weeks',t=>{t.rows[targetWeek].planned=plan;});const i=targetWeek;targetDraft=null;render();focusTrack(e,'weeks',i);
    }));
    placement.onkeydown=ev=>{if(ev.key==='Escape'){ev.preventDefault();close();}};
  }
  function editor(e,key,parent){
    const box=el('div','wp-box'),area=el('textarea'),hasWeeks=weeklyField(key);area.rows=1;
    if(key==='name'){area.dataset.nameId=e.id;nameSuggestions(area,e);}
    if(key==='alternative')area.placeholder='Week 1';
    area.value=e[key];
    area.setAttribute('aria-label',e.name+', '+heads[fields.indexOf(key)]+(e.goal&&key==='name'?', goal exercise':''));
    box.dataset.copy=area.value||area.placeholder;box.append(area);parent.append(box);
    let initialWeek;
    area.addEventListener('focus',()=>{
      if(key==='weeks')initialWeek=window.LZProgression.forExercise(e.source).rows[0].planned;
    });
    area.addEventListener('input',event=>{
      if(key==='alternative'&&!event.isComposing&&event.inputType?.startsWith('insert')&&
         area.value.trim()&&!/\n|^\s*(?:w|we|wee|week\b.*)$/i.test(area.value)&&
         /^(?:w|we|wee)?$/i.test(e.alternative)){
        area.setRangeText('Week 1: ',0,0,'preserve');
      }
      e[key]=area.value;
      box.dataset.copy=area.value||area.placeholder;
      if(hasWeeks){
        suggest(area);
        const issue=e.issue(key);
        area.setAttribute('aria-invalid',String(!!issue));
        warning.textContent=issue;
      }
    });
    if(key==='weeks')area.addEventListener('change',()=>{
      if(window.LZProgression.forExercise(e.source).rows[0].planned!==initialWeek){
        api.applyWeekToSets(e.source);api.schedule();
      }
    });
    if(key==='name')area.addEventListener('change',()=>{api.bindExerciseName(e.source,area.value);api.automaticRoles();area.value=e.name;box.dataset.copy=e.name;area.closest('tr').toggleAttribute('data-goal',e.goal);const role=area.closest('tr').querySelector('.wp-role');if(role)role.value=e.source.role;api.schedule();api.refreshProgramNames();});
    if(!hasWeeks)return area;
    const warning=el('small','wp-warning',e.issue(key));warning.setAttribute('role','status');parent.append(warning);area.setAttribute('aria-invalid',String(!!e.issue(key)));
    area.dataset.weekId=e.id+'-'+key;area.setAttribute('role','combobox');area.setAttribute('aria-autocomplete','list');area.setAttribute('aria-expanded','false');area.spellcheck=false;
    area.addEventListener('click',()=>{suggest(area);});
    area.addEventListener('keyup',ev=>{if(['ArrowUp','ArrowDown','Home','End','ArrowLeft','ArrowRight'].includes(ev.key)){suggest(area);}});
    area.addEventListener('blur',dismiss);
    area.addEventListener('keydown',ev=>{
      if(openMenu?.area!==area||ev.isComposing)return;
      if((ev.key==='Enter'||ev.key==='Tab')&&!ev.shiftKey){ev.preventDefault();openMenu.accept();}
      else if(ev.key==='Escape'){ev.preventDefault();dismiss();}
    });
    return area;
  }
  function alternativeToolbar(e){
    const toolbar=el('div','wp-track-toolbar'),chooser=el('select','wp-alt-select'),alternatives=e.alternatives;
    chooser.setAttribute('aria-label',e.name+' alternative track');
    for(const t of alternatives)chooser.add(new Option(model.trackName(alternatives,t.id),String(t.id)));
    chooser.add(new Option('Add alternative','new'));chooser.value=String(e.alternativeId);
    chooser.onchange=()=>{e.selectAlternative(chooser.value==='new'?'new':Number(chooser.value));render();focusTrack(e,'alternative');};
    const label=el('span','wp-alt-label','Alt '+(chooser.selectedIndex+2));label.setAttribute('aria-hidden','true');
    const wrap=el('div','wp-alt-control');wrap.append(chooser,label);toolbar.append(trackHandle(e,'alternative',null),wrap);
    return toolbar;
  }
  function alternativeCell(td,e){
    td.classList.add('wp-alternative');td.dataset.altDestination=e.id;
    if(e.alternatives.length){td.append(alternativeToolbar(e));
    }else{
      const add=button('+ Alternative',()=>{e.selectAlternative('new');render();focusTrack(e,'alternative');});
      add.classList.add('wp-add-alt');td.append(add);
    }
    drawWeeks(e,'alternative',td);
  }
  function grip(id){
    const g=button('',()=>openPlacement(id));g.classList.add('wp-grip');g.dataset.grip=id;
    const label='Actions for '+(itemName(id)||'Unnamed exercise');
    g.setAttribute('aria-label',label);g.setAttribute('data-tooltip',label);return g;
  }
  function unit(d){
    const part=el('section','wp-unit'),tools=el('div','wp-tools');part.dataset.workout=d;tools.dataset.destination=d;
    const h=el('h3','',workoutName(d)+' ');if(workoutName(d)!==dayName(d))h.append(el('span','',dayName(d)));
    tools.dataset.context=workouts[d].some(e=>api.pinState(days[d],e.source)==='match')?'match':api.pinState(days[d]);h.append(el('span','', ' '+days[d].type));tools.append(grip('w'+d),h);
    const trash=button('',()=>api.removeWorkout(days[d]));
    trash.classList.add('wp-delete-day');
    trash.title='Delete '+workoutName(d);
    trash.setAttribute('aria-label',trash.title);
    trash.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg>';
    tools.append(trash,resizer(d,-1));part.append(tools);
    const addExercise=button('+ Exercise',()=>api.addExercise(days[d]));
    addExercise.classList.add('wp-add-exercise');addExercise.setAttribute('aria-label','Add exercise to '+workoutName(d));
    if(!workouts[d].length){part.append(addExercise);return part;}
    const table=el('table');table.setAttribute('aria-label',workoutName(d)+' weekly progression');
    const cg=el('colgroup');[29,42,29].forEach(w=>{const c=el('col');c.style.width=w+'%';cg.append(c);});table.append(cg);
    const head=table.createTHead().insertRow();heads.forEach((txt,i)=>{
      const th=el('th');th.scope='col';th.setAttribute('aria-label',txt);
      th.append(el('span','wp-wide-label',txt),el('span','wp-small-label',['Exercise','Weekly plan','Alternatives'][i]));
      th.append(resizer(d,i));head.append(th);
    });
    const body=table.createTBody();workouts[d].forEach(e=>{const tr=body.insertRow();tr.dataset.row=e.id;tr.dataset.context=api.pinState(days[d],e.source);if(e.goal)tr.dataset.goal='';
      fields.forEach(key=>{const td=tr.insertCell();if(key==='name'){td.className='wp-name';const wrap=el('div','wp-name-wrap');wrap.append(grip(e.id));td.append(wrap);editor(e,key,wrap);
        const role=el('select','wp-role');role.setAttribute('aria-label','Exercise role for '+(e.name||'new exercise'));
        for(const value of ['Choose','Goal','Primary','Secondary','Tertiary'])role.add(new Option(value==='Choose'?'Unassigned':value,value));
        role.value=e.source.role||'Choose';role.onchange=()=>{api.setExerciseRole(e.source,role.value);tr.toggleAttribute('data-goal',e.goal);api.schedule();};
        td.append(role);}else if(key==='alternative'){
        alternativeCell(td,e);
      }else{
        drawWeeks(e,key,td);
        const sets=button('Set targets',()=>setTargets(e));sets.classList.add('wp-sets');td.append(sets);
      }});});
    part.append(table,addExercise);return part;
  }
  function pin(id){
    const {d,whole}=details(id);
    api.pinExercise(whole?'w'+days[d].id:id);
  }
  function render(){
    const left=stage.scrollLeft;
    dismiss();placement.hidden=true;
    const shown=schedule.filter(d=>visible.has(d));
    if(api.grouped)shown.sort((a,b)=>Number(days[b].type==='Upper')-Number(days[a].type==='Upper'));
    if(!shown.length){stage.replaceChildren(el('p','wp-empty',schedule.length?'Choose a workout above.':'Add a day to start your program.'));return;}
    stage.replaceChildren(...shown.map(d=>{
      const part=unit(d);
      if(days[d].sheetWidths)applyWidths(part,days[d].sheetWidths);
      return part;
    }));
    stage.scrollLeft=left;
  }
  function relocate(id,d,anchor=null,after=false,swap=false){
    const source=details(id);if(source.whole){
      if(source.d===d)return;const a=schedule.indexOf(source.d),b=schedule.indexOf(d);
      if(api.grouped&&days[source.d].type!==days[d].type){api.notify('Choose Program order to move a day between upper and lower pairs.');return;}
      if(swap||api.grouped||visible.size<schedule.length)[schedule[a],schedule[b]]=[schedule[b],schedule[a]];
      else schedule.splice(b,0,schedule.splice(a,1)[0]);
    }else{
      if(anchor===id)return;const list=workouts[source.d],idx=list.findIndex(e=>e.id===id);
      const [e]=list.splice(idx,1),target=workouts[d],place=target.findIndex(x=>x.id===anchor);
      target.splice(place<0?target.length:place+(after?1:0),0,e);
    }
    athlete.days.splice(0,athlete.days.length,...schedule.map(index=>days[index]));
    workouts.forEach((list,index)=>{days[index].exercises=list.map(entry=>entry.source);});
    api.schedule();
    if(!source.whole&&api.revealMovedExercise(days[d],id))return;
    api.refreshWorkoutFilter();
    render();status(itemName(id)+' moved to '+dayName(source.whole?source.d:d));
  }
  function openPlacement(id){
    dismiss();const {d,whole}=details(id);placement.replaceChildren();placement.hidden=false;
    placement.append(el('strong','',itemName(id)));
    const select=el('select'),label=el('label','',whole?'Swap with':'Move to');
    schedule.forEach(dest=>{if(whole&&(dest===d||(api.grouped&&days[dest].type!==days[d].type)))return;const opt=el('option','',dayName(dest)+' · '+workoutName(dest));opt.value=dest;select.append(opt);});
    if(!whole)select.value=d;label.append(select);placement.append(label);
    const pos=el('select'),posLabel=el('label','','Position');posLabel.append(pos);
    function positions(){pos.replaceChildren();const end=el('option','','At end');end.value='';pos.append(end);
      for(const e of workouts[Number(select.value)])if(e.id!==id){const opt=el('option','','Before '+e.name);opt.value=e.id;pos.append(opt);}}
    if(!whole){positions();select.addEventListener('change',positions);placement.append(posLabel);}
    const done=()=>{placement.hidden=true;root.querySelector('[data-grip="'+id+'"]')?.focus({preventScroll:true});};
    const move=button(whole?'Swap days':'Move',()=>{relocate(id,Number(select.value),pos.value,false,whole);done();});move.disabled=whole&&!select.options.length;placement.append(move,button('Add to comparison',()=>{pin(id);done();}));
    if(!whole){
      const exercise=workouts[d].find(entry=>entry.id===id).source;
      const role=el('select'),label=el('label','','Exercise role');
      for(const value of ['Choose','Goal','Primary','Secondary','Tertiary']){
        role.add(new Option(value==='Choose'?'Unassigned':value,value));
      }
      role.value=exercise.role||'Choose';label.append(role);placement.append(label);
      role.onchange=()=>{
        api.setExerciseRole(exercise,role.value);api.schedule();render();done();
      };
      placement.append(button('Edit set targets',()=>{done();api.editSetTargets(exercise);}),button('Edit progression',()=>{done();api.openProgression(exercise.id);}),
        button('Add alternative progression',()=>{done();api.openProgression(exercise.id,true);}),
        button('Delete exercise',()=>{done();api.removeExercise(days[d],exercise);}));
    }
    if(whole){
      const name=el('input'),type=el('select');
      name.value=days[d].name;name.setAttribute('aria-label','Workout name');
      type.setAttribute('aria-label','Workout type');
      for(const value of ['Full body','Upper','Lower','Other'])type.add(new Option(value,value));
      type.value=days[d].type;
      placement.append(name,type,button('Save workout',()=>{done();api.updateDay(days[d],name.value.trim(),type.value);}),
        button('Show only this workout',()=>api.isolateWorkout(days[d])));
    }
    placement.append(button('Cancel',done));placement.onkeydown=ev=>{if(ev.key==='Escape'){ev.preventDefault();done();}};
    select.focus();
  }
  function destination(x,y,id){
    const hit=document.elementFromPoint(x,y);
    const bin=hit?.closest('[data-sheet-bin]');
    if(bin&&id.startsWith('e'))return {type:'delete',node:bin};
    const filter=hit?.closest('.workout-filter');
    if(filter?.matches('.compare-picker'))return {node:filter,type:'compare'};
    if(filter){
      filter.open=true;
      const label=document.elementFromPoint(x,y)?.closest('[data-workout-destination]');
      const d=label?days.findIndex(day=>day.id===Number(label.dataset.workoutDestination)):-1;
      return d<0||(details(id).whole&&details(id).d===d)?null:{node:label,type:'move',d};
    }
    const target=shadow.elementFromPoint(x,y);if(!target||!root.contains(target))return null;
    const dest=target.closest('[data-destination],[data-workout]');if(!dest)return null;
    const d=Number(dest.dataset.destination??dest.dataset.workout),source=details(id);
    if(source.whole&&source.d===d)return null;
    const row=target.closest('[data-row]');
    if(row&&!source.whole){
      if(row.dataset.row===id)return null;const bounds=row.getBoundingClientRect(),after=y>bounds.top+bounds.height/2;
      return {node:row,type:'move',d,anchor:row.dataset.row,after};
    }
    return {node:dest,type:'move',d};
  }
  function clearDrag(){
    root.querySelector('[data-drop]')?.removeAttribute('data-drop');
    document.querySelector('.athlete-nav [data-drop]')?.removeAttribute('data-drop');
    if(drag){const last=drag;drag=null;cancelAnimationFrame(last.frame);delete last.handle.dataset.dragActive;if(last.handle.hasPointerCapture(last.pointer))last.handle.releasePointerCapture(last.pointer);}
  }
  function markDrop(){
    root.querySelector('[data-drop]')?.removeAttribute('data-drop');
    document.querySelector('.athlete-nav [data-drop]')?.removeAttribute('data-drop');
    const dest=destination(drag.clientX,drag.clientY,drag.id);
    if(dest)dest.node.dataset.drop=dest.anchor?(dest.after?'after':'before'):'target';
  }
  function scrollEdge(){
    if(!drag?.active)return;drag.frame=0;
    if(scrollAtEdge(drag.clientX,drag.clientY)){markDrop();drag.frame=requestAnimationFrame(scrollEdge);}
  }
  function scrollAtEdge(x,y){
    const h=window.innerHeight,edge=54,dy=y<edge?y-edge:y>h-edge?y-h+edge:0;
    const box=stage.getBoundingClientRect();
    const dx=x<box.left+edge?-12:x>box.right-edge?12:0,left=stage.scrollLeft;
    if(dx)stage.scrollLeft+=dx;
    const old=window.scrollY;if(dy)window.scrollBy(0,Math.sign(dy)*Math.min(15,Math.ceil(Math.abs(dy)/3)));
    return window.scrollY!==old||stage.scrollLeft!==left;
  }
  let suppressClick=false;
  root.addEventListener('pointerdown',ev=>{
    suppressClick=false;const handle=ev.target.closest('[data-grip]');if(!handle||!ev.isPrimary||ev.button!==0)return;
    clearDrag();drag={handle,id:handle.dataset.grip,x:ev.clientX,y:ev.clientY,pointer:ev.pointerId,active:false};handle.setPointerCapture(ev.pointerId);
  });
  root.addEventListener('pointermove',ev=>{
    if(!drag||drag.pointer!==ev.pointerId)return;
    if(!drag.active&&Math.hypot(ev.clientX-drag.x,ev.clientY-drag.y)<5)return;
    drag.active=true;drag.clientX=ev.clientX;drag.clientY=ev.clientY;drag.handle.dataset.dragActive='';ev.preventDefault();placement.hidden=true;
    markDrop();if(!drag.frame)drag.frame=requestAnimationFrame(scrollEdge);
  });
  root.addEventListener('pointerup',ev=>{
    if(!drag||drag.pointer!==ev.pointerId)return;
    const {active,id}=drag,dest=active&&destination(ev.clientX,ev.clientY,id);clearDrag();suppressClick=active;
    if(!dest)return;
    // Keep the touch target mounted through the browser's final touch event.
    requestAnimationFrame(()=>{if(!root.isConnected)return;if(dest.type==='delete'){const d=locate(id);api.removeExercise(days[d],workouts[d].find(e=>e.id===id).source);}else if(dest.type==='compare')pin(id);else relocate(id,dest.d,dest.anchor,dest.after);});
  });
  root.addEventListener('pointercancel',clearDrag);
  root.addEventListener('lostpointercapture',ev=>{if(drag&&ev.pointerId===drag.pointer)clearDrag();});
  root.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&drag)clearDrag();});
  root.addEventListener('click',ev=>{if(suppressClick&&ev.detail){suppressClick=false;ev.stopImmediatePropagation();ev.preventDefault();}},true);
  render();

  }
}
customElements.define('athlete-spreadsheet',AthleteSpreadsheet);
})();
