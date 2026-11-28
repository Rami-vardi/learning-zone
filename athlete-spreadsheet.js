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
      id:'e'+exercise.id,source:exercise,
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
    const area=this.shadowRoot?.querySelector('[data-week-id="e'+id+'-'+key+'"]');
    if(area)area.focus({preventScroll:true});
  }
  mount(athlete,api){
    const shadow=this.attachShadow({mode:'open'});
    shadow.innerHTML="<link rel=\"stylesheet\" href=\"athlete-sheet.css?v=mirror-compact3\"><div id=\"workout-sheet\">\n  <div data-placement hidden></div>\n  <div data-workouts></div>\n  <span class=\"wp-sr\" role=\"status\" aria-live=\"polite\" data-status></span>\n</div>\n";
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
  let columns=0,openMenu=null,drag=null;
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
  function editor(e,key,parent){
    const box=el('div','wp-box'),area=el('textarea'),hasWeeks=weeklyField(key);area.rows=1;
    if(key==='name')area.dataset.nameId=e.id;
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
    if(key==='name')area.addEventListener('change',()=>{api.bindExerciseName(e.source,area.value);api.automaticRoles();area.value=e.name;box.dataset.copy=e.name;area.closest('tr').toggleAttribute('data-goal',e.goal);api.schedule();api.refreshProgramNames();});
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
  function alternativeCell(td,e){
    td.classList.add('wp-alternative');
    const chooser=el('select','wp-alt-select');
    chooser.setAttribute('aria-label',e.name+' alternative track');
    td.append(chooser);
    const area=editor(e,'alternative',td);
    function options(){
      const tracks=e.alternatives;
      chooser.hidden=!tracks.length;
      if(chooser.hidden)return;
      chooser.replaceChildren();
      for(const track of tracks)chooser.add(new Option(window.LZProgression.trackName(tracks,track.id),String(track.id)));
      chooser.add(new Option('Add '+window.LZProgression.trackName(tracks,'new'),'new'));
      chooser.value=String(e.alternativeId);
    }
    function focusText(){
      area.focus({preventScroll:true});
      const end=area.value.length;
      area.setSelectionRange(end,end);
    }
    options();
    area.addEventListener('input',()=>{if(chooser.hidden&&e.alternatives.length)options();});
    chooser.addEventListener('change',()=>{
      dismiss();
      e.selectAlternative(chooser.value==='new'?'new':Number(chooser.value));
      area.value=e.alternative;
      area.parentElement.dataset.copy=area.value||area.placeholder;
      const issue=e.issue('alternative');
      td.querySelector('.wp-warning').textContent=issue;
      area.setAttribute('aria-invalid',String(!!issue));
      options();
      focusText();
    });
    td.addEventListener('click',event=>{
      if(!event.target.closest('select,textarea,button'))focusText();
    });
  }
  function grip(id){
    const g=button('',()=>openPlacement(id));g.classList.add('wp-grip');g.dataset.grip=id;
    const label='Actions for '+(itemName(id)||'Unnamed exercise');
    g.setAttribute('aria-label',label);g.setAttribute('data-tooltip',label);return g;
  }
  function unit(d){
    const part=el('section','wp-unit'),tools=el('div','wp-tools');part.dataset.workout=d;tools.dataset.destination=d;
    const h=el('h3','',workoutName(d)+' ');if(workoutName(d)!==dayName(d))h.append(el('span','',dayName(d)));
    tools.dataset.context=workouts[d].some(e=>api.pinState(days[d],e.source)==='match')?'match':api.pinState(days[d]);tools.append(grip('w'+d),h);
    const trash=button('',()=>api.removeWorkout(days[d]));
    trash.classList.add('wp-delete-day');
    trash.title='Delete '+workoutName(d);
    trash.setAttribute('aria-label',trash.title);
    trash.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg>';
    tools.append(trash);part.append(tools);
    const addExercise=button('+ Exercise',()=>api.addExercise(days[d]));
    addExercise.classList.add('wp-add-exercise');addExercise.setAttribute('aria-label','Add exercise to '+workoutName(d));
    if(!workouts[d].length){part.append(addExercise);return part;}
    const table=el('table');table.setAttribute('aria-label',workoutName(d)+' weekly progression');
    const cg=el('colgroup');[21,54,25].forEach(w=>{const c=el('col');c.style.width=w+'%';cg.append(c);});table.append(cg);
    const head=table.createTHead().insertRow();heads.forEach((txt,i)=>{
      const th=el('th');th.scope='col';th.setAttribute('aria-label',txt);
      th.append(el('span','wp-wide-label',txt),el('span','wp-small-label',['Exercise','Weekly plan','Alternatives'][i]));
      head.append(th);
    });
    const body=table.createTBody();workouts[d].forEach(e=>{const tr=body.insertRow();tr.dataset.row=e.id;tr.dataset.context=api.pinState(days[d],e.source);if(e.goal)tr.dataset.goal='';
      fields.forEach(key=>{const td=tr.insertCell();if(key==='name'){td.className='wp-name';const wrap=el('div','wp-name-wrap');wrap.append(grip(e.id));td.append(wrap);editor(e,key,wrap);}else if(key==='alternative'){
        alternativeCell(td,e);
      }else editor(e,key,td);});});
    part.append(table,addExercise);return part;
  }
  function pin(id){
    const {d,whole}=details(id);
    api.pinExercise(whole?'w'+days[d].id:id);
  }
  function render(reflow=false){
    const units=reflow?new Map([...stage.querySelectorAll('.wp-unit')].map(node=>[Number(node.dataset.workout),node])):null;
    const focused=reflow?shadow.activeElement:null;
    dismiss();placement.hidden=true;
    const shown=schedule.filter(d=>visible.has(d)),n=api.paired?2:Math.max(1,Math.min(columns,shown.length));
    stage.classList.toggle('pair-spreadsheet',api.paired);
    stage.style.gridTemplateColumns='repeat('+n+','+(api.paired?'minmax(min(245px,82vw),1fr)':'minmax(0,1fr)')+')';
    if(!shown.length){stage.replaceChildren(el('p','wp-empty',schedule.length?'Choose a workout above.':'Add a day to start your program.'));return;}
    const stacks=Array.from({length:n},()=>el('div','wp-stack'));stage.replaceChildren(...stacks);
    shown.forEach((d,i)=>stacks[i%n].append(units?.get(d)||unit(d)));
    if(focused?.isConnected&&stage.contains(focused)&&shadow.activeElement!==focused)focused.focus({preventScroll:true});
  }
  function relocate(id,d,anchor=null,after=false){
    const source=details(id);if(source.whole){
      if(source.d===d)return;const a=schedule.indexOf(source.d),b=schedule.indexOf(d);
      [schedule[a],schedule[b]]=[schedule[b],schedule[a]];
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
    schedule.forEach(dest=>{if(whole&&dest===d)return;const opt=el('option','',dayName(dest)+' · '+workoutName(dest));opt.value=dest;select.append(opt);});
    if(!whole)select.value=d;label.append(select);placement.append(label);
    const pos=el('select'),posLabel=el('label','','Position');posLabel.append(pos);
    function positions(){pos.replaceChildren();const end=el('option','','At end');end.value='';pos.append(end);
      for(const e of workouts[Number(select.value)])if(e.id!==id){const opt=el('option','','Before '+e.name);opt.value=e.id;pos.append(opt);}}
    if(!whole){positions();select.addEventListener('change',positions);placement.append(posLabel);}
    const done=()=>{placement.hidden=true;root.querySelector('[data-grip="'+id+'"]')?.focus({preventScroll:true});};
    const move=button(whole?'Swap days':'Move',()=>{relocate(id,Number(select.value),pos.value);done();});move.disabled=whole&&schedule.length<2;placement.append(move,button('Add to comparison',()=>{pin(id);done();}));
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
    const filter=document.elementFromPoint(x,y)?.closest('.workout-filter');
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
    const y=drag.clientY,h=window.innerHeight,edge=54,dy=y<edge?y-edge:y>h-edge?y-h+edge:0;
    if(!dy)return;
    const old=window.scrollY;window.scrollBy(0,Math.sign(dy)*Math.min(15,Math.ceil(Math.abs(dy)/3)));
    if(window.scrollY!==old){markDrop();drag.frame=requestAnimationFrame(scrollEdge);}
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
    requestAnimationFrame(()=>{if(!root.isConnected)return;if(dest.type==='compare')pin(id);else relocate(id,dest.d,dest.anchor,dest.after);});
  });
  root.addEventListener('pointercancel',clearDrag);
  root.addEventListener('lostpointercapture',ev=>{if(drag&&ev.pointerId===drag.pointer)clearDrag();});
  root.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&drag)clearDrag();});
  root.addEventListener('click',ev=>{if(suppressClick&&ev.detail){suppressClick=false;ev.stopImmediatePropagation();ev.preventDefault();}},true);
  function resize(){const w=root.clientWidth,n=w>=1000&&schedule.length===4?4:w>=1560?4:w>=1000?3:w>=650?2:1;if(n!==columns){columns=n;render(true);}}
  resize();this.observer=new ResizeObserver(resize);this.observer.observe(root);

  }
}
customElements.define('athlete-spreadsheet',AthleteSpreadsheet);
})();
