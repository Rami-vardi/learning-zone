/* Exercise-specific teaching illustrations. Coordinates describe joint landmarks in the depicted plane. */
(() => {
  'use strict';
  const slug = location.hash.slice(1);
  const svg = document.querySelector('svg'), step = document.querySelector('#step');
  const ink = '#173c50', far = '#849da8', accent = '#078881', prop = '#a26736';
  const scene = {};
  const set = (name, draw, cues) => { scene[name] = {draw, cues}; };
  const line = (points, color = ink, width = 5) => '<polyline fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linejoin="round" stroke-linecap="round" points="'+points.map(p=>p.join(',')).join(' ')+'"/>';
  const dot = (p,r,color) => '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+r+'" fill="'+color+'"/>';
  const chair = (x=60,y=97) => line([[x-22,y-27],[x-22,y],[x+8,y],[x+8,145]],prop,3)+line([[x-20,y],[x-20,145]],prop,3);
  const wall = () => line([[142,18],[142,145]],prop,3);
  const rail = () => line([[141,75],[141,145]],prop,3)+line([[119,75],[153,75]],prop,3);
  const floor = line([[15,146],[173,146]],'#a9bcbc',1.3);
  // head, shoulder, hip, far elbow/hand, near elbow/hand, far knee/ankle, near knee/ankle
  const stand = [[86,30],[86,48],[85,91],[76,67],[74,85],[97,67],[99,85],[76,114],[73,141],[94,115],[96,141]];
  const sit = [[74,43],[75,59],[72,96],[77,77],[90,85],[85,74],[98,83],[94,99],[94,141],[104,99],[105,141]];
  const pose = (base,values) => base.map((p,i)=>values[i]||p);
  const shift = (base,dx,dy) => base.map(([x,y])=>[x+dx,y+dy]);
  const mix = (a,b,t) => a.map((p,i)=>p.map((v,j)=>v+(b[i][j]-v)*t));
  function body(p){
    const chain=(ids,col,w)=>line(ids.map(i=>p[i]),col,w);
    return chain([1,3,4],far,4)+chain([2,7,8],far,5)+line([p[8],[p[8][0]+6,p[8][1]+2]],far,3)+chain([0,1,2],ink,7)+dot(p[0],7,ink)+chain([2,9,10],ink,6)+line([p[10],[p[10][0]+7,p[10][1]+2]],ink,4)+chain([1,5,6],accent,4.8)+dot(p[6],2.8,accent);
  }
  function sequence(id,frames,labels,props=''){
    set(id,(t)=>{const u=t*(frames.length-1),i=Math.min(frames.length-2,Math.floor(u));return props+body(mix(frames[i],frames[i+1],u-i));},labels);
  }
  set('straight-back-roman-chair-hip-extension',t=>{
    const hinge=Math.sin(Math.PI*t)**2;
    const angle=(-45+80*hinge)*Math.PI/180;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    // The torso and folded arms rotate together around the hip. The legs stay on the bench.
    const hip=[91,75];
    const upper=(along,across=0)=>[hip[0]+along*cos-across*sin,hip[1]+along*sin+across*cos];
    const points=[upper(63),upper(46),hip,upper(26,7),upper(40,3),upper(28,10),upper(43,3),
      [56,106],[29,133],[61,105],[31,135]];
    const bench=line([[19,143],[100,143]],prop,3)+line([[42,142],[77,91],[88,142]],prop,3)
      +line([[62,110],[85,87]],prop,8)+line([[22,137],[35,143]],prop,4)
      +line([[28,142],[25,128]],prop,3)+dot([26,126],5,prop);
    return bench+body(points);
  },['Start with the trunk in line with the legs and the pad below the hip crease.',
     'Hinge at the hips while the back keeps its shape.',
     'Extend the hips until the trunk and legs line up again.']);
  const reach = {5:[107,56],6:[127,60]};
  const ready = pose(stand,reach);
  const squat = pose(stand,{0:[82,45],1:[81,62],2:[69,106],7:[91,118],9:[99,117],3:[97,64],4:[120,67],5:[102,63],6:[127,65]});
  const lateral=pose(stand,{0:[100,32],1:[99,50],2:[98,92],9:[116,117],10:[128,141],5:[119,49],6:[139,45]});
  const left=stand.map((p,i)=>lateral[i]).map(([x,y])=>[172-x,y]);
  sequence('side-step-and-reach',[stand,lateral,stand],['Start with the feet under the hips.','Step out and reach toward that side.','Return to the starting position.']);
  sequence('side-step-with-alternating-reach',[stand,lateral,stand,left,stand],['Stand tall.','Step and reach to one side.','Return.','Change sides and reaching arms.','Return to center.']);
  sequence('supported-squat-and-reach',[pose(stand,{3:[105,63],4:[121,75]}),pose(squat,{3:[102,69],4:[121,75],5:[82,80],6:[89,98]}),pose(stand,{3:[105,63],4:[121,75],5:[101,41],6:[115,26]})],['Rest one hand on the support.','Lower into a partial squat.','Stand and reach with the free arm.'],rail());
  sequence('partial-squat-with-forward-reach',[stand,squat,stand],['Stand with the heels planted.','Bend the knees and reach both arms forward.','Stand and lower the arms.']);
  const crossing=pose(stand,{3:[94,67],4:[106,74],5:[74,52],6:[54,57]});
  sequence('standing-cross-body-reach',[stand,crossing,stand],['Stand with feet planted.','Reach the arm across the body.','Return to center.']);
  sequence('standing-cross-body-thoracic-reach',[stand,pose(crossing,{0:[81,32],1:[80,48],6:[49,54]}),stand],['Face forward with a stable base.','Turn the chest as the arm travels across.','Unwind to the starting position.']);
  sequence('seated-reach-and-rotate',[sit,pose(sit,{0:[67,42],1:[68,59],5:[53,58],6:[35,55]}),sit],['Sit with both hips supported.','Turn the chest and reach to the side.','Return to center.'],chair(75));
  const march=pose(stand,{7:[99,91],8:[101,117],5:[106,55],6:[119,48],3:[73,66],4:[59,76]});
  const marchOther=pose(stand,{9:[108,91],10:[107,118],3:[99,55],4:[117,48],5:[78,68],6:[63,77]});
  sequence('march-and-opposite-shoulder-reach',[stand,march,stand,marchOther,stand],['Stand tall.','Lift one knee and reach with the opposite arm.','Lower.','Change sides.','Return.']);
  sequence('walking-march-with-arm-swing',[shift(stand,-25,0),shift(march,-20,0),stand,shift(marchOther,12,0),shift(stand,24,0)],['Stand tall.','Lift one knee, swing the opposite arm.','Step forward.','Alternate the knee and arm.','Place the foot beneath you.']);
  sequence('step-back-and-return-with-reach',[stand,pose(ready,{7:[66,113],8:[47,140]}),stand,pose(stand,{9:[63,118],10:[48,139],3:[107,55],4:[125,54]}),stand],['Start with feet together.','Step one foot back and reach forward.','Return.','Switch sides.','Stand tall.']);
  sequence('high-chair-sit-to-stand',[sit,pose(sit,{0:[93,48],1:[87,62],2:[73,92],5:[106,69],6:[120,76]}),shift(stand,12,0),sit],['Sit on the raised seat with feet planted.','Lean forward over the feet.','Stand tall.','Lower to the seat.'],chair(76));
  const quadruped=[[112,84],[105,95],[69,95],[107,119],[109,143],[97,118],[96,142],[66,124],[47,140],[74,126],[60,141]];
  sequence('short-reach-bird-dog',[quadruped,pose(quadruped,{5:[111,108],6:[123,116],7:[55,107],8:[36,119]}),quadruped],['Start on hands and knees.','Briefly lift the opposite hand and leg into a short reach.','Replace both contacts.']);
  const bear=pose(quadruped,{7:[54,118],8:[46,142],9:[87,124],10:[66,142]});
  sequence('crawl-to-stand',[shift(bear,-14,0),pose(bear,{3:[118,119],4:[127,143],9:[92,119],10:[79,142]}),pose(bear,{2:[86,91],7:[92,119],8:[91,142],9:[105,117],10:[102,142]}),shift(stand,10,0)],['Begin with knees hovering.','Advance opposite hand and foot.','Walk the feet toward the hands.','Lift the hands and stand.']);
  const grounded=shift(stand,24,0),hop=shift(grounded,0,-11);
  sequence('drop-to-pogo',[shift(stand,-22,-19),grounded,hop,grounded,hop,grounded],['Start on a low platform.','Step off and contact the floor.','Rebound through the ankles.','Land.','Rebound again.','Finish balanced.'],line([[32,143],[32,125],[74,125],[74,144]],prop,3));
  const inverted=[[109,108],[111,91],[123,58],[102,116],[109,143],[119,114],[126,143],[131,37],[137,12],[128,35],[137,11]];
  sequence('wall-hspu-partial-rom',[inverted,pose(inverted,{0:[109,125],1:[112,107],2:[124,72],3:[95,119],5:[132,122],7:[133,48],8:[138,28],9:[131,48],10:[137,25]}),inverted],['Support the feet against the wall.','Bend the elbows to reach the raised target.','Press back to straight arms.'],wall()+line([[99,144],[99,133],[116,133],[116,144]],prop,3));
  const press=pose(sit,{0:[47,73],1:[54,85],2:[72,111],7:[90,89],8:[117,88],9:[95,87],10:[120,86],5:[68,95],6:[73,108]});
  set('cyclist-leg-press',t=>{const u=Math.sin(Math.PI*t)**2,p=mix(press,pose(press,{7:[95,91],8:[128,68],9:[99,89],10:[132,66]}),u),a=p[10];return line([[37,78],[59,116],[80,117]],prop,4)+line([[94,121],[153,57]],far,2)+line([[a[0]-7,a[1]-11],[a[0]+8,a[1]+11]],prop,5)+body(p);},['Narrow stance with both heels supported.','Extend the knees and hips to move the sled.','Bend the knees and return under control.']);
  sequence('standing-reach-to-wall',[stand,pose(stand,{0:[110,62],1:[99,73],2:[70,97],3:[119,74],4:[140,74],5:[119,78],6:[140,78],9:[89,115]}),stand],['Face the wall.','Send the hips back and reach both hands to the wall.','Stand back up.'],wall());
  const wallBase=pose(stand,{0:[96,40],1:[93,55],2:[84,96],3:[115,53],4:[141,52],5:[116,60],6:[141,56]});
  sequence('wall-wrist-weight-shifts',[wallBase,pose(wallBase,{0:[107,43],1:[104,56],2:[91,95],3:[119,48],5:[122,58]}),wallBase],['Place the palms on the wall.','Shift a little weight toward the hands.','Shift back.'],wall());
  const wristTable=pose(stand,{0:[105,44],1:[99,58],2:[76,94],3:[110,76],4:[120,91],5:[115,75],6:[126,91]});
  sequence('tabletop-wrist-weight-shift',[wristTable,pose(wristTable,{0:[116,47],1:[110,61],2:[84,96],3:[116,77],5:[120,78]}),wristTable],['Place both palms flat on the table.','Shift the body over the hands.','Ease back.'],line([[108,93],[155,93],[155,145]],prop,4));
  const hinge=pose(stand,{0:[112,65],1:[100,73],2:[74,94],7:[52,97],8:[32,101],5:[111,74],6:[125,75]});
  set('supported-hip-airplane-preparation',t=>{const u=Math.sin(t*Math.PI)**2,p=pose(hinge,{7:[52,97-9*u],8:[32,101-10*u]});return rail()+body(p)+line([[66,95-5*u],[81,95+5*u]],accent,5);},['Hinge over one leg and hold the support.','Gently open the pelvis around the stance hip.','Rotate back with the support foot planted.']);
  const supine=[[44,133],[57,134],[97,134],[69,132],[81,136],[71,137],[87,138],[111,105],[132,141],[102,104],[112,111]];
  sequence('supine-figure-four-hip-motion',[supine,pose(supine,{9:[91,111],10:[112,111]}),supine],['Lie back with one ankle crossed over the opposite thigh.','Allow a small motion at the crossed hip.','Return while keeping the pelvis supported.']);
  const ankle=pose(ready,{5:[109,65],6:[124,75]});
  sequence('standing-supported-ankle-rock',[ankle,pose(ankle,{0:[98,34],1:[98,53],2:[94,95],7:[87,118],9:[105,119],5:[112,64]}),ankle],['Hold the support with heels planted.','Rock forward through the ankles.','Return over the heels.'],rail());
  // Close views make small changes of elbow, gaze, forearm and toe position legible.
  function elbow(t,mode){
    const u=Math.sin(t*Math.PI)**2,slide=mode==='slide',hold=mode==='hold';
    const e=[78,100],angle=hold?-.76:slide?-u*.85:.1-u*1.6;
    const hand=[e[0]+47*Math.cos(angle),e[1]+47*Math.sin(angle)];
    return line([[38,109],[142,109]],prop,4)+line([[40,94],e],ink,9)+(slide?line([[hand[0]-8,hand[1]+6],[hand[0]+9,hand[1]+6]],prop,5):'')+line([e,hand],accent,7)+dot(e,4,far)+dot(hand,5,accent);
  }
  set('supported-elbow-bend-and-straighten',t=>elbow(t,'bend'),['Support the upper arm.','Bend the elbow.','Straighten it again.']);
  set('supported-midrange-elbow-hold',t=>elbow(t,'hold'),['Support the arm with the elbow partly bent.','Hold the angle steady.','Maintain the angle until the hold ends.']);
  set('elbow-flexion-towel-slide',t=>{const u=Math.sin(Math.PI*t)**2,el=[74,92],h=[119-11*u,90-29*u];return '<rect x="36" y="41" width="115" height="83" fill="#e4d5c3"/>'+line([[57,114],el],ink,7)+line([[h[0]-4,h[1]+5],[h[0]+9,h[1]-3]],prop,10)+line([el,h],accent,6)+dot(h,4,accent);},['Overhead view. Rest the forearm on the towel.','Slide the hand inward while bending the elbow.','Slide back to the starting position.']);
  set('supported-wrist-figure-eight',t=>{const w=[91,85],hand=[112+14*Math.sin(2*Math.PI*t),84+12*Math.sin(4*Math.PI*t)];const trail=Array.from({length:65},(_,i)=>[112+14*Math.sin(i*Math.PI/32),84+12*Math.sin(i*Math.PI/16)]);return line([[24,93],[94,93]],prop,3)+line(trail,far,1)+line([[34,85],w],ink,10)+line([w,hand],accent,6)+dot(hand,4,accent);},['Support the forearm.','Trace both loops with the hand.','Finish the figure eight.']);
  set('supported-supination-pause',t=>{const u=Math.min(1,Math.sin(Math.PI*t)*1.6),w=[90,86];return line([[26,97],[93,97]],prop,3)+line([[31,86],w],ink,11)+'<ellipse cx="107" cy="86" rx="20" ry="'+(3+7*u)+'" fill="'+accent+'"/>'+line([[98,82],[109,78-10*u]],accent,5)+(u>.6?line([[103,86],[114,86]],'#e5f4ee',1.5):'');},['Support the forearm with the thumb up.','Turn the palm up and pause.','Return to the starting position.']);
  function neck(t,down){
    const u=Math.sin(t*Math.PI)**2,eye=[95+10*u,59+(down?7*u:0)];
    return line([[54,120],[65,96],[82,91],[88,82],[99,82],[105,92],[123,96],[135,120]],ink,6)+dot([94,65],19,far)+dot(eye,3,ink)+line([eye,[eye[0]+13,eye[1]+(down?6*u:0)]],accent,2)+dot([141,down?86:59],4,prop)+chair(95,134);
  }
  set('supported-neck-turn-with-visual-target',t=>neck(t,false),['Sit upright and look ahead.','Turn toward the target with quiet shoulders.','Return to center.']);
  set('small-neck-diagonal-look',t=>neck(t,true),['Start looking straight ahead.','Turn slightly toward the lower diagonal target.','Return to center.']);
  function toes(t,spread){
    const phase=spread?Math.min(1,t*3,(1-t)*4):0,press=spread?Math.max(0,1-Math.abs(t-.68)*6):Math.sin(Math.PI*t)**2;
    let out='<ellipse cx="94" cy="95" rx="22" ry="35" fill="'+far+'"/>';
    for(let i=0;i<5;i++){const x=77+i*8,y=68+Math.abs(i-1)*2,xx=x+(i-2)*3.2*phase;out+=line([[x,y+9],[xx,y-6+press*2]],accent,7-i*.52);if(press>.15)out+=dot([xx,y-8],1.1+press*1.7,prop);}
    return out;
  }
  set('toe-splay-and-gentle-press',t=>toes(t,true),['Rest the foot on the floor.','Spread the toes.','Press gently through the pads, then relax.']);
  set('toe-press-and-relax',t=>toes(t,false),['Keep the heel supported.','Press the toe pads into the surface.','Release the pressure.']);
  const demo=scene[slug];
  if(!demo){document.querySelector('main').textContent='Choose a movement from its exercise guide.';return;}
  document.querySelector('#title').textContent=slug.split('-').map((s,i)=>s==='hspu'?'HSPU':i?s:s[0].toUpperCase()+s.slice(1)).join(' ');
  const range=document.querySelector('#position'),play=document.querySelector('#play');
  let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,last=0;
  function render(){const t=time/1000;svg.innerHTML=floor+demo.draw(t);step.textContent=demo.cues[Math.min(demo.cues.length-1,Math.round(t*(demo.cues.length-1)))];range.value=Math.round(time);play.textContent=playing?'Pause':'Play';}
  function tick(now){if(last&&playing&&!document.hidden){time=(time+Math.min(80,now-last)/6)%1000;render();}last=now;requestAnimationFrame(tick);}
  range.oninput=()=>{playing=false;time=Number(range.value);render();};play.onclick=()=>{playing=!playing;render();};render();requestAnimationFrame(tick);
})();
