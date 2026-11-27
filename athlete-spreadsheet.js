(() => {
  'use strict';

  const sheetSessions=new WeakMap();

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
    shadow.innerHTML="<link rel=\"stylesheet\" href=\"athlete-sheet.css?v=alternatives4\"><div id=\"workout-sheet\">\n  <div class=\"wp-nav\"><div class=\"wp-switch\" role=\"group\" aria-label=\"Board layout\"><button type=\"button\" data-mode=\"cards\" aria-pressed=\"false\">Cards</button><button type=\"button\" data-mode=\"sheet\" aria-pressed=\"true\">Spreadsheet</button></div>\n  </div>\n  <div class=\"wp-filters\"><b><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M3 6h18M6 12h12M9 18h6\"/></svg>Show workouts</b><div data-filters role=\"group\" aria-label=\"Visible workouts\"></div><span class=\"wp-legend\">Goal exercise</span></div>\n  <div class=\"wp-comparebar\" data-tray><b><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"4\" width=\"7\" height=\"16\" rx=\"2\"/><rect x=\"14\" y=\"4\" width=\"7\" height=\"16\" rx=\"2\"/></svg>Compare</b><span data-hint>Drop exercises or workouts here</span><div data-pins></div><button type=\"button\" data-open-compare hidden>View comparison</button></div>\n  <div data-placement hidden></div>\n  <div data-workouts></div>\n  <span class=\"wp-sr\" role=\"status\" aria-live=\"polite\" data-status></span>\n</div>\n";
    const root=shadow.querySelector('#workout-sheet'),stage=root.querySelector('[data-workouts]');
  const fields=['name','weeks','alternative'],heads=['Exercise','Sets × reps × load / RIR','Alternative progressions'];
  const days=athlete.days.slice();
  const schedule=days.map((_,index)=>index);
  const workouts=days.map(day=>day.exercises.map(exercise=>sheetExercise(exercise,api)));
  const saved=sheetSessions.get(athlete);
  const visible=new Set(schedule.filter(d=>api.includesWorkout(days[d])));
  function saveSelection(){api.setWorkoutSelection(visible.size===schedule.length?null:[...visible].map(d=>days[d].id));}
  const pins=new Set();
  for(const item of saved?.pins||[]){
    if(item.day!=null){const d=days.findIndex(day=>day.id===item.day);if(d>=0)pins.add('w'+d);}
    else if(workouts.some(list=>list.some(e=>e.id===item.exercise)))pins.add(item.exercise);
  }
  const selected=workouts.map(list=>({id:list[0]?.id||'',key:'weeks',line:0}));
  const weeklyField=k=>k==='weeks'||k==='alternative';
  const workoutName=d=>days[d].name||'Workout '+(d+1);
  const dayName=d=>'Day '+(schedule.indexOf(d)+1);
  const locate=id=>workouts.findIndex(list=>list.some(e=>e.id===id));
  const details=id=>id.startsWith('w')?{d:Number(id.slice(1)),whole:true}:{d:locate(id),whole:false};
  function itemName(id){const {d,whole}=details(id);return whole?workoutName(d):workouts[d].find(e=>e.id===id).name;}
  let columns=0,mode=saved?.mode||'sheet',comparing=!!(saved?.comparing&&pins.size),openMenu=null,drag=null;
  const placement=root.querySelector('[data-placement]');
  function status(msg){root.querySelector('[data-status]').textContent=msg;}
  function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;}
  function button(label,fn){const b=el('button','cursor-interaction',label);b.type='button';b.addEventListener('click',fn);return b;}
  const linesOf=str=>str.split('\n');
  const numberOf=line=>Number(/^\s*week\s+(\d+)\b/i.exec(line)?.[1])||0;
  const nextWeek=(lines,i)=>{const used=new Set(lines.map((s,j)=>j===i?0:numberOf(s)));let n=1+Math.max(0,...lines.slice(0,i).map(numberOf));while(used.has(n))n++;return n;};
  const lineAt=area=>area.value.slice(0,area.selectionStart).split('\n').length-1;
  const startAt=(lines,i)=>lines.slice(0,i).reduce((n,s)=>n+s.length+1,0);
  const fieldFor=(id,key)=>stage.querySelector('[data-week-id="'+id+'-'+key+'"]');
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
  function mark(d,id,key,line){
    const part=stage.querySelector('[data-workout="'+d+'"]'),area=fieldFor(id,key);
    if(!part||!area)return;
    const lines=linesOf(area.value);line=Math.max(0,Math.min(line,lines.length-1));
    selected[d]={id,key,line};
    part.querySelector('td[data-picked]')?.removeAttribute('data-picked');
    area.closest('td').dataset.picked='';
    const num=numberOf(lines[line]),track=key==='alternative'?(area.closest('td').querySelector('select')?.selectedOptions[0]?.textContent||'Alternative'):'Prescription';
    const text=itemName(id)+' · '+track+(num?' · Week '+num:'');
    part.querySelector('.wp-target').textContent=text;
    const remove=part.querySelector('[data-remove]');remove.disabled=!area.value.length;
    remove.setAttribute('aria-label','Remove week from '+text);
    part.querySelector('[data-add]').setAttribute('aria-label','Add week to '+text);
  }
  function weekAction(d,add){
    const {id,key,line}=selected[d],area=fieldFor(id,key);if(!area)return;
    dismiss();const lines=linesOf(area.value);let pos;
    if(add){
      while(lines.length&&!lines.at(-1).trim())lines.pop();
      const next=nextWeek(lines,lines.length);if(next>52){status('Maximum 52 weeks.');return;}
      lines.push('Week '+next+': ');pos=lines.join('\n').length;
    }else{
      let first=line;
      while(first>0&&!numberOf(lines[first]))first--;
      let end=first+1;
      while(end<lines.length&&!numberOf(lines[end]))end++;
      lines.splice(first,end-first);pos=startAt(lines,Math.max(0,Math.min(line,lines.length-1)));
    }
    area.value=lines.join('\n');area.focus();area.setSelectionRange(pos,pos);sync(area);
    status((add?'Week added to ':'Week removed from ')+itemName(id));
  }
  function editor(d,e,key,parent){
    const box=el('div','wp-box'),area=el('textarea'),hasWeeks=weeklyField(key);area.rows=1;
    if(key==='name')area.dataset.nameId=e.id;
    if(key==='alternative')area.placeholder='Week 1';
    area.value=e[key];
    area.setAttribute('aria-label',e.name+', '+heads[fields.indexOf(key)]+(e.goal&&key==='name'?', goal exercise':''));
    box.dataset.copy=area.value||area.placeholder;box.append(area);parent.append(box);
    function select(){const old=selected[d];mark(d,e.id,hasWeeks?key:old.id===e.id?old.key:'weeks',hasWeeks?lineAt(area):old.id===e.id?old.line:0);}
    let initialWeek;
    area.addEventListener('focus',()=>{
      if(key==='weeks')initialWeek=window.LZProgression.forExercise(e.source).rows[0].planned;
      select();
    });
    area.addEventListener('input',event=>{
      if(key==='alternative'&&!event.isComposing&&event.inputType?.startsWith('insert')&&
         area.value.trim()&&!/\n|^\s*(?:w|we|wee|week\b.*)$/i.test(area.value)&&
         /^(?:w|we|wee)?$/i.test(e.alternative)){
        area.setRangeText('Week 1: ',0,0,'preserve');
      }
      e[key]=area.value;
      box.dataset.copy=area.value||area.placeholder;
      select();
      if(hasWeeks){
        suggest(area);
        const issue=e.issue(key);
        area.setAttribute('aria-invalid',String(!!issue));
        warning.textContent=issue;
      }else updateTray();
    });
    if(key==='weeks')area.addEventListener('change',()=>{
      if(window.LZProgression.forExercise(e.source).rows[0].planned!==initialWeek){
        api.applyWeekToSets(e.source);api.schedule();
      }
    });
    if(key==='name')area.addEventListener('change',()=>{api.bindExerciseName(e.source,area.value);api.automaticRoles();area.value=e.name;box.dataset.copy=e.name;area.closest('tr').toggleAttribute('data-goal',e.goal);api.schedule();updateTray();});
    if(!hasWeeks)return area;
    const warning=el('small','wp-warning',e.issue(key));warning.setAttribute('role','status');parent.append(warning);area.setAttribute('aria-invalid',String(!!e.issue(key)));
    area.dataset.weekId=e.id+'-'+key;area.setAttribute('role','combobox');area.setAttribute('aria-autocomplete','list');area.setAttribute('aria-expanded','false');area.spellcheck=false;
    area.addEventListener('click',()=>{select();suggest(area);});
    area.addEventListener('keyup',ev=>{if(['ArrowUp','ArrowDown','Home','End','ArrowLeft','ArrowRight'].includes(ev.key)){select();suggest(area);}});
    area.addEventListener('blur',dismiss);
    area.addEventListener('keydown',ev=>{
      if(openMenu?.area!==area||ev.isComposing)return;
      if((ev.key==='Enter'||ev.key==='Tab')&&!ev.shiftKey){ev.preventDefault();openMenu.accept();}
      else if(ev.key==='Escape'){ev.preventDefault();dismiss();}
    });
    return area;
  }
  function alternativeCell(td,d,e){
    td.classList.add('wp-alternative');
    const chooser=el('select','wp-alt-select');
    chooser.setAttribute('aria-label',e.name+' alternative track');
    td.append(chooser);
    const area=editor(d,e,'alternative',td);
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
      mark(d,e.id,'alternative',lineAt(area));
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
    const label='Move or compare '+itemName(id);
    g.setAttribute('aria-label',label);g.setAttribute('data-tooltip',label);return g;
  }
  function unit(d){
    const part=el('section','wp-unit'),tools=el('div','wp-tools');part.dataset.workout=d;tools.dataset.destination=d;
    const h=el('h3','',workoutName(d)+' ');if(workoutName(d)!==dayName(d))h.append(el('span','',dayName(d)));
    tools.append(grip('w'+d),h);part.append(tools);
    const addExercise=button('+ Exercise',()=>api.addExercise(days[d]));
    addExercise.classList.add('wp-add-exercise');addExercise.setAttribute('aria-label','Add exercise to '+workoutName(d));
    if(!workouts[d].length){part.append(addExercise);return part;}
    if(mode==='cards'){
      workouts[d].forEach(e=>{const card=el('div','wp-card'),name=el('div','wp-card-name');card.dataset.row=e.id;
        if(e.goal)card.dataset.goal='';name.append(grip(e.id),document.createTextNode(e.name));card.append(name,el('p','',e.weeks),el('p','',e.alternativeId?window.LZProgression.trackName(e.alternatives,e.alternativeId)+'\n'+e.alternative:''));part.append(card);});part.append(addExercise);return part;
    }
    const plus=button('+ Week',()=>weekAction(d,true)),minus=button('Remove week',()=>weekAction(d,false));
    plus.dataset.add='';minus.dataset.remove='';tools.append(el('span','wp-target'),plus,minus);
    const table=el('table');table.setAttribute('aria-label',workoutName(d)+' weekly progression');
    const cg=el('colgroup');[21,54,25].forEach(w=>{const c=el('col');c.style.width=w+'%';cg.append(c);});table.append(cg);
    const head=table.createTHead().insertRow();heads.forEach(txt=>{const th=el('th','',txt);th.scope='col';head.append(th);});
    const body=table.createTBody();workouts[d].forEach(e=>{const tr=body.insertRow();tr.dataset.row=e.id;if(e.goal)tr.dataset.goal='';
      fields.forEach(key=>{const td=tr.insertCell();if(key==='name'){td.className='wp-name';const wrap=el('div','wp-name-wrap');wrap.append(grip(e.id));td.append(wrap);editor(d,e,key,wrap);}else if(key==='alternative'){
        alternativeCell(td,d,e);
      }else editor(d,e,key,td);});});
    part.append(table,addExercise);return part;
  }
  function filterBar(){
    const box=root.querySelector('[data-filters]');box.replaceChildren();
    const preset=el('select');preset.setAttribute('aria-label','Show one or all workouts');preset.dataset.preset='';
    const custom=el('option','','Custom selection');custom.value='custom';custom.disabled=true;preset.append(custom);
    const all=el('option','','All workouts');all.value='all';preset.append(all);
    for(const d of schedule){const only=el('option','',workoutName(d)+' only');only.value=String(d);preset.append(only);}
    preset.value=visible.size===schedule.length?'all':visible.size===1?String([...visible][0]):'custom';
    preset.addEventListener('change',()=>{visible.clear();if(preset.value==='all')schedule.forEach(d=>visible.add(d));else visible.add(Number(preset.value));
      saveSelection();comparing=false;render();root.querySelector('[data-preset]').focus({preventScroll:true});});
    box.append(preset);
    schedule.forEach(d=>{const b=button(workoutName(d),()=>{if(visible.has(d))visible.delete(d);else visible.add(d);saveSelection();comparing=false;render();root.querySelector('[data-filter="'+d+'"]').focus({preventScroll:true});});b.dataset.filter=d;
      b.dataset.destination=d;b.setAttribute('aria-pressed',String(visible.has(d)));b.setAttribute('aria-label',workoutName(d)+', '+dayName(d));
      box.append(b);});
  }
  function updateTray(){
    const chipbox=root.querySelector('[data-pins]'),toggle=root.querySelector('[data-open-compare]');
    root.querySelector('[data-hint]').hidden=!!pins.size;
    chipbox.replaceChildren();for(const id of pins){const chip=button(itemName(id)+' ×',()=>{pins.delete(id);if(!pins.size)comparing=false;render();});
      chip.setAttribute('aria-label','Remove '+itemName(id)+' from comparison');chipbox.append(chip);}
    toggle.hidden=!pins.size;toggle.textContent=comparing?'Back to board':'View comparison';
  }
  function pin(id){pins.add(id);comparing=false;render();status(itemName(id)+' added to comparison');}
  function comparison(){
    const comp=el('div','wp-comparison');comp.setAttribute('aria-label','Comparison');
    for(const id of pins){const {d,whole}=details(id),wrap=el('section','wp-compare-item');
      wrap.append(el('h3','',whole?workoutName(d)+' · '+dayName(d):dayName(d)+' · '+workoutName(d)));
      const items=whole?workouts[d]:workouts[d].filter(e=>e.id===id);
      for(const e of items){const c=el('div','wp-comp-ex');if(e.goal)c.dataset.goal='';c.append(el('strong','',e.name));
        c.append(el('small','',heads[1]),el('p','',e.weeks));
        const progress=window.LZProgression.forExercise(e.source);
        for(const track of progress.alternatives){
          const text=Array.from({length:track.weeks},(_,i)=>'Week '+(i+1)+': '+track.rows[i].planned).join('\n');
          c.append(el('small','',window.LZProgression.trackName(progress.alternatives,track.id)),el('p','',text));
        }
        wrap.append(c);}
      if(!items.length)wrap.append(el('p','wp-empty','No exercises'));comp.append(wrap);
    }return comp;
  }
  function render(){
    sheetSessions.set(athlete,{
      mode,comparing,
      pins:[...pins].map(id=>id.startsWith('w')?{day:days[Number(id.slice(1))].id}:{exercise:id})
    });
    dismiss();placement.hidden=true;filterBar();updateTray();
    const shown=schedule.filter(d=>visible.has(d)),n=Math.max(1,Math.min(columns,shown.length));
    stage.style.gridTemplateColumns='repeat('+(comparing?1:n)+',minmax(0,1fr))';
    root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(!comparing&&mode===b.dataset.mode)));
    if(comparing){stage.replaceChildren(comparison());return;}
    if(!shown.length){stage.replaceChildren(el('p','wp-empty',schedule.length?'Choose a workout above.':'Add a day to start your program.'));return;}
    const stacks=Array.from({length:n},()=>el('div','wp-stack'));stage.replaceChildren(...stacks);
    shown.forEach((d,i)=>{stacks[i%n].append(unit(d));
      if(workouts[d].length&&mode==='sheet'){let s=selected[d];if(!workouts[d].some(e=>e.id===s.id))s={id:workouts[d][0].id,key:'weeks',line:0};mark(d,s.id,s.key,s.line);}
    });
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
      placement.append(button('Edit progression',()=>{done();api.openProgression(exercise.id);}),
        button('Add alternative progression',()=>{done();api.openProgression(exercise.id,true);}));
    }
    if(whole)placement.append(button('Show only this workout',()=>{visible.clear();visible.add(d);saveSelection();render();done();}));
    placement.append(button('Cancel',done));placement.onkeydown=ev=>{if(ev.key==='Escape'){ev.preventDefault();done();}};
    select.focus();
  }
  function destination(x,y,id){
    const target=shadow.elementFromPoint(x,y);if(!target||!root.contains(target))return null;
    if(target.closest('[data-tray]'))return {node:root.querySelector('[data-tray]'),type:'compare'};
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
    if(drag){const last=drag;drag=null;cancelAnimationFrame(last.frame);delete last.handle.dataset.dragActive;if(last.handle.hasPointerCapture(last.pointer))last.handle.releasePointerCapture(last.pointer);}
  }
  function markDrop(){
    root.querySelector('[data-drop]')?.removeAttribute('data-drop');
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
  root.querySelector('[data-open-compare]').addEventListener('click',()=>{comparing=!comparing;render();});
  root.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;comparing=false;render();}));
  function resize(){const w=root.clientWidth,n=w>=1560?4:w>=1220?3:w>=700?2:1;if(n!==columns){columns=n;render();}}
  resize();this.observer=new ResizeObserver(resize);this.observer.observe(root);

  }
}
customElements.define('athlete-spreadsheet',AthleteSpreadsheet);
})();
