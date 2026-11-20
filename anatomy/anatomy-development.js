// Interactive teaching models for infant movement and comparative locomotion.
(() => {
  'use strict';
  const stages = [
    ['Lying on the back', 'Follow a kick on one side as the opposite knee draws toward the belly. The back and head rest on the mat.'],
    ['Rolling over', 'The head turns and one arm reaches across the body. Follow the shoulder and pelvis as the baby rolls through side lying onto the tummy.'],
    ['Pushing up on the hands', 'The hands press against the mat. As the elbows straighten, the chest lifts while the pelvis stays low.'],
    ['Belly crawling', 'One forearm reaches forward as the opposite knee bends. The trunk travels close to the mat.'],
    ['Hands and knees crawling', 'The belly clears the mat. Follow one hand and the opposite knee as they advance together, then change sides.'],
    ['Sitting and reaching', 'The pelvis and legs form a broad base. Watch the trunk turn and the weight shift as one hand reaches to the side.'],
    ['Standing with support', 'Both hands hold the rail while the legs straighten. The feet stay on the mat as the pelvis rises.'],
    ['First independent steps', 'The arms stay raised for balance. Watch the weight shift toward one foot so the other foot can lift and step forward.']
  ];
  const lessons = {
    baby: { title:'Baby Motor Development', source:'The eight examples illustrate changes in balance, support and coordination. Babies develop on overlapping timelines and can use different movement strategies or skip crawling.',
      link:['WHO motor development milestones','https://www.who.int/toolkits/child-growth-standards/standards/motor-development-milestones'] },
    chimp: { title:'Human and Chimpanzee Locomotion', source:'These schematic models compare a human walking on two feet with a chimpanzee walking on its knuckles and feet. Both species also use other movement patterns.',
      link:['Comparative pelvic anatomy','https://pmc.ncbi.nlm.nih.gov/articles/PMC4305164/'] }
  };
  function create(T, adultPelvis, legs, exArms) {
    const scene = new T.Scene();
    const vec = (x,y,z) => new T.Vector3(x,y,z);
    const up = vec(0,1,0);
    const group = parent => {const g=new T.Group();parent.add(g);return g;};
    const mat = color => new T.MeshStandardMaterial({color,roughness:.82});
    const skin=mat(0xd79a79), suit=mat(0x388792), trim=mat(0x286773), face=mat(0x523b37), mouth=mat(0xa46355);
    const ivory=mat(0xd9cebb), blue=mat(0x608caf), rust=mat(0xb07852);
    const pad=mat(0xdce6eb), railMat=mat(0x73949d);
    const sphere=new T.SphereGeometry(1,16,12), cylinder=new T.CylinderGeometry(1,1,1,12);
    const mesh=(parent,geom,m)=>{const o=new T.Mesh(geom,m);parent.add(o);return o;};
    function oval(parent,m,x,y,z,rx,ry,rz) {
      const o=mesh(parent,sphere,m);o.position.set(x,y,z);o.scale.set(rx,ry,rz);return o;
    }
    function span(o,a,b,r,depth=r) {
      const d=b.clone().sub(a);
      o.position.copy(a).lerp(b,.5);o.scale.set(r,d.length()*(o.geometry===sphere?.55:1),depth);
      o.quaternion.setFromUnitVectors(up,d.normalize());
    }
    function rod(parent,m,a,b,r) {const o=mesh(parent,cylinder,m);span(o,a,b,r);return o;}
    function arc(parent,m,points,r) {
      return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points),12,r,6,false),m);
    }
    // Intersect two circles in the limb plane. Keep the segment lengths fixed
    // at every frame, even at full extension or when a target is out of reach.
    function solve(a,goal,l1,l2,bend,minHeight=-Infinity) {
      const axis=goal.clone().sub(a), raw=axis.length();axis.normalize();
      const d=Math.max(Math.abs(l1-l2)+.0001,Math.min(l1+l2-.0001,raw));
      const tangent=bend.clone().addScaledVector(axis,-bend.dot(axis));
      if(tangent.lengthSq()<1e-8)tangent.set(1,0,0);
      const along=(l1*l1-l2*l2+d*d)/(2*d);
      const center=a.clone().addScaledVector(axis,along), radius=Math.sqrt(Math.max(0,l1*l1-along*along));
      const mid=center.clone().addScaledVector(tangent.normalize(),radius);
      if(mid.y<minHeight){
        const vertical=up.clone().addScaledVector(axis,-axis.y).normalize();
        const lateral=axis.clone().cross(vertical);
        const height=T.MathUtils.clamp((minHeight-center.y)/(radius*vertical.y),-1,1);
        mid.copy(center).addScaledVector(vertical,radius*height)
          .addScaledVector(lateral,Math.sign(lateral.dot(tangent)||1)*radius*Math.sqrt(1-height*height));
      }
      return [mid,a.clone().addScaledVector(axis,d)];
    }
    pad.userData.groundSurface=true;
    const disk=new T.CylinderGeometry(1,1,.018,56);
    function floor(parent,rx,rz) {const m=mesh(parent,disk,pad);m.scale.set(rx,1,rz);m.position.y=-.012;return m;}
    const nursery=group(scene), baby=group(nursery), body=group(baby);
    floor(nursery,1.65,2.04);
    oval(body,suit,0,.37,0,.325,.54,.265);
    oval(body,trim,0,.803,0,.171,.077,.151);
    const head=group(baby);
    const headMesh=new T.SphereGeometry(1,36,24), vertices=headMesh.attributes.position;
    for(let i=0;i<vertices.count;i++){
      const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);
      const lower=1-T.MathUtils.smoothstep(y,-.87,.04);
      const cheek=Math.exp(-((Math.abs(x)-.48)**2+(y+.29)**2)*8);
      vertices.setXYZ(i,.323*x*(1-.17*lower),.16+.354*y,.300*z+.038*lower+.018*cheek*Math.max(0,z));
    }
    headMesh.computeVertexNormals();mesh(head,headMesh,skin);
    oval(head,skin,0,.096,.300,.047,.039,.041);
    arc(head,mouth,[vec(-.046,.037,.291),vec(0,.030,.296),vec(.046,.037,.291)],.006);
    for(const s of [-1,1]){
      oval(head,skin,s*.303,.145,-.002,.053,.072,.047);
      oval(head,mouth,s*.345,.145,.005,.011,.034,.022);
      oval(head,face,s*.109,.164,.284,.023,.019,.013);
      arc(head,mouth,[vec(s*.078,.20,.289),vec(s*.108,.210,.280),vec(s*.14,.202,.268)],.006);
    }
    const rail=group(nursery);
    rod(rail,railMat,vec(-.75,1.27,.38),vec(.75,1.27,.38),.042);
    for(const s of [-1,1])rod(rail,railMat,vec(s*.72,0,.38),vec(s*.72,1.27,.38),.039);
    const babyLimbs=[];
    for(const s of [-1,1]) for(const arm of [false,true]){
      const limb={s,arm,upper:mesh(baby,sphere,skin),lower:mesh(baby,sphere,skin),joint:mesh(baby,sphere,skin),end:mesh(baby,sphere,skin)};
      limb.cuff=mesh(baby,sphere,suit);
      limb.tip=group(baby);
      if(arm){
        oval(limb.tip,skin,-s*.062,0,.028,.037,.030,.050);
        for(let i=0;i<4;i++)oval(limb.tip,skin,(i-1.5)*.033,-.003,.073,.018,.026,.044-Math.abs(i-1)*.003);
      }else for(let i=0;i<5;i++)oval(limb.tip,skin,s*(i-2)*.028,.003,.118,.019,.021,.034-i*.002);
      babyLimbs.push(limb);
    }
    const TAU=2*Math.PI;
    function plant(t,step,lift) {
      const f=((t%1)+1)%1;
      return f<.5?[-step*.5,0]:[step*(-.5+(1-Math.cos((f-.5)*TAU))*.5),lift*Math.sin((f-.5)*TAU)];
    }
    function stride(t,step,lift){
      const [z,y]=plant(t,step,lift);
      return [step*(Math.floor(t)-t+.25)+z+step*.5,y];
    }
    function poseBaby(stage,t){
      const phase=TAU*t, wave=Math.sin(phase), ease=(1-Math.cos(Math.PI*t))*.5;
      let y,z,lean,headLean,twist=0,side=0,roll=0;
      switch(stage){
        case 0: case 1:y=.28;z=.30;lean=-Math.PI/2;headLean=lean;roll=stage===1?Math.PI*ease:0;break;
        case 2:y=.245;z=-.38;lean=1.42-.52*ease;headLean=.60-.48*ease;break;
        case 3:y=.25;z=-.48+.46*t;lean=1.43;headLean=.42;twist=.09*wave;break;
        case 4:y=.63;z=-.59+.60*t;lean=1.39;headLean=.40;twist=.055*wave;break;
        case 5:y=.285;z=-.12;lean=.10;headLean=.07;side=.13*ease;twist=.38*ease;break;
        case 6:y=.62+.27*ease;z=-.12;lean=.20-.13*ease;headLean=.02;break;
        default:y=.866+.024*Math.cos(2*phase);z=-.37+.66*t;lean=.14;headLean=.035;side=.07*wave;
      }
      body.position.set(side,y,z);body.rotation.set(lean,twist,stage===5?-.15*ease:0,'YXZ');
      const fromBody=(x,h,d)=>vec(x,h,d).applyQuaternion(body.quaternion).add(body.position);
      head.position.copy(fromBody(0,.84,0));head.rotation.set(headLean,twist,stage===1?-.7*ease:0,'YXZ');
      rail.visible=stage===6;
      for(const l of babyLimbs){
        const {s,arm}=l, w=wave*s, start=fromBody(s*(arm?.27:.202),arm?.64:.03,0);
        let goal, bend=vec(s*.15,.05,arm?-1:1);
        if(stage<2){
          goal=arm?vec(s*(stage===1?.38-.25*ease*s:.39),.42+.20*(1+w)/2-.21*(stage===1?ease:0),z-.52-.19*w-(stage===1?.34*ease:0)):vec(s*.23,.35+.13*w,z+.58+.13*w);
          bend=arm?vec(s*.85,-.6,.1):vec(s*.17,1,0);
        }else if(stage===2){
          goal=arm?vec(s*.34,.062,.32):vec(s*.24,.079,-1.09);
          bend=arm?vec(s*.5,0,-1):vec(s*.3,-1,.2);
        }else if(stage===3){
          const [dz,dy]=stride(t+(s>0?0:.5)+(arm?0:.5),.46,.075);
          goal=arm?vec(s*.37,.062+dy,z+.95+dz):vec(s*(.32+.065*w),.075,z-.61+dz);
          bend=arm?vec(s*.55,-1,-.3):vec(s*1.1,-1,.4);
        }else if(stage===4 && !arm){
          const [dz,dy]=stride(t+(s>0?0:.5)+.5,.60,.10);
          const knee=vec(s*.22,.112+dy,z+.02+dz), ankle=knee.clone().add(vec(s*.017,.005,-.44));
          drawBabyLimb(l,start,knee,ankle,.06,true);continue;
        }else if(stage===4 || stage===7){
          const [dz,dy]=stride(t+(s>0?0:.5)+(arm?0:.5),stage===4?.60:.66,stage===4?.13:.14);
          goal=stage===4?vec(s*.32,.062+dy,z+.65+dz):arm?vec(s*.55,1.54+.04*w,z+.23+.075*w):vec(s*.22,.074+dy,z+dz);
        }else if(stage===5){
          goal=arm?(s===1?vec(.48+.42*ease, .45+.47*ease,z+.22):vec(-.41,.19,z+.13)):vec(s*.49,.084,z+.56);
          if(!arm)bend=vec(s*.65,-.75,.4);
        }else{
          goal=arm?vec(s*.30,1.27,.38):vec(s*.22,.074,-.11);
        }
        const [mid,end]=solve(start,goal,arm?.378:.464,arm?.344:.431,bend,stage>=2?(arm?.097:.132):-Infinity);
        drawBabyLimb(l,start,mid,end,stage<2?-1:0,stage===2||stage===3);
      }
      baby.rotation.z=roll;baby.position.y=0;
      if(stage<=1){
        const bounds=new T.Box3().setFromObject(baby,true);
        baby.position.y=-bounds.min.y+.006;
      }
    }
    function drawBabyLimb(l,start,mid,end,footPitch,prone=false){
      const r=l.arm?.095:.130;
      span(l.upper,start,mid,r);span(l.lower,mid,end,r*.84);
      l.joint.position.copy(mid);l.joint.scale.setScalar(r*.82);
      span(l.cuff,start,start.clone().lerp(mid,l.arm?.37:.48),r*1.07);
      l.end.position.copy(end);
      l.end.rotation.set(l.arm?0:footPitch,!l.arm&&prone?Math.PI:0,0);
      l.end.scale.set(l.arm?.082:.091,l.arm?.060:.072,l.arm?.098:.145);
      l.end.position.z+=l.arm?.025:prone?-.047:.047;
      l.tip.position.copy(l.end.position);l.tip.quaternion.copy(l.end.quaternion);
    }
    const comparison=group(scene);
    function pelvis(parent,ape){
      const node=group(parent), material=(ape?rust:blue).clone();material.vertexColors=true;
      for(const original of adultPelvis.children.filter(o=>o.name.startsWith('BodyParts3D '))){
        const geo=original.geometry.clone();
        if(ape){
          const p=geo.attributes.position;
          for(let i=0;i<p.count;i++){
            const x=p.getX(i),y=p.getY(i),z=p.getZ(i),h=T.MathUtils.smoothstep(y,-.10,.57);
            p.setXYZ(i,x*(.84-.29*h),y*(y>0?1.42:1),z*.89-.16*h);
          }
          geo.computeVertexNormals();
        }
        const bone=mesh(node,geo,material);bone.scale.copy(original.scale);
      }
      return node;
    }
    function skeleton(ape){
      const root=group(comparison),figure=group(root), trunk=group(figure);
      const pelvisNode=pelvis(figure,ape),close=pelvis(root,ape);
      const basePad=floor(root,ape?.69:.65,ape?1.76:1.22);
      if(ape)basePad.position.z=.18;
      const bone=(x,y,z,rx,ry,rz)=>oval(trunk,ivory,x,y,z,rx,ry,rz);
      const chest=ape?1.31:1.25;
      for(let i=0;i<19;i++){
        const h=i*.080,depth=-.075-.056*Math.sin(i/18*Math.PI);
        bone(0,h,depth,.074,.052,.074);
        bone(0,h-.01,depth-.047,.026,.034,.059);
      }
      for(let i=0;i<12;i++){
        const k=i/11,h=1.19-k*.73,w=(ape?.32:.27)+.17*Math.sin(k*Math.PI)-(ape?0:.08*k);
        const depth=.20+.08*Math.sin(k*Math.PI);
        for(const s of [-1,1]){
          const pts=[vec(s*.055,h,-.13),vec(s*w*.73,h+.03,-.17),vec(s*w,h-.035,-.025),vec(s*w*.87,h-.12,depth*.65)];
          if(i<10)pts.push(vec(s*(.048+.10*Math.max(0,i-6)),h-.07-.03*k,depth));
          arc(trunk,ivory,pts,.0155);
        }
      }
      rod(trunk,ivory,vec(0,.66,.24),vec(0,1.19,.202),.034);
      for(const s of [-1,1])rod(trunk,ivory,vec(0,1.19,.19),vec(s*.40,chest,0),.029);
      const neck=group(figure),skullMesh=window.azDevelopmentSkull(T);
      // The neck connects the occiput to the top of the inclined trunk.
      arc(trunk,ivory,[vec(0,1.33,-.085),vec(0,1.42,-.05),vec(0,1.50,ape?.09:.035)],.051);
      const skull=mesh(neck,skullMesh,ivory.clone());skull.material.vertexColors=true;skull.material.side=T.DoubleSide;
      if(ape){
        const points=skull.geometry.attributes.position;
        for(let i=0;i<points.count;i++){
          const x=points.getX(i),y=points.getY(i),z=points.getZ(i);
          const low=1-T.MathUtils.smoothstep(y,-.15,.09),front=T.MathUtils.smoothstep(z,-.02,.13);
          points.setXYZ(i,x*(.92+.13*low),y*.81,z*.91+front*low*.145);
        }
        skull.geometry.computeVertexNormals();
      }
      const limbs=[];
      for(const s of [-1,1]) for(const arm of [false,true]){
        const leftRight=group(figure);
        const members=[];
        const adultArm=exArms.find(item=>item.side===s),adultLeg=legs.find(item=>item.side===s);
        for(const distal of [false,true]){
          const seg=group(leftRight), atlas=arm?(distal?adultArm.fore:adultArm.upper):(distal?adultLeg.shin:adultLeg.femur);
          const refLength=arm?1:distal?1.31:1.63;
          // The source femur has a laterally offset knee. Register its shaft
          // to this model's hip-to-knee line before it is articulated.
          const basis=vec(0,-1,0);
          const restAxis=vec(!arm&&!distal?s*.10:0,-refLength,0).normalize();
          const align=new T.Quaternion().setFromUnitVectors(restAxis,basis);
          const names=arm?(distal?['radius','ulna']:['humerus']):(distal?['tibia','fibula']:['femur','patella']);
          for(const name of names){
            const src=name==='fibula'?adultLeg.fibula:atlas.getObjectByName('BodyParts3D '+name);
            if(!src)continue;
            const bone=mesh(seg,src.geometry,ivory);
            bone.quaternion.copy(align);
            bone.scale.setScalar(1/refLength);
          }
          members.push(seg);
        }
        const end=group(leftRight);
        if(arm){
          oval(end,ivory,0,0,0,.069,.063,.058);
          for(let j=0;j<4;j++){
            const x=(j-1.5)*.031, curled=ape?.063:.005;
            rod(end,ivory,vec(x,0,0),vec(x*1.12,-.105,curled),.013);
            rod(end,ivory,vec(x*1.12,-.105,curled),vec(x*1.10,-(ape?.120:.18),ape?.016:.032),.012);
          }
        }else{
          oval(end,ivory,0,-.013,.040,.080,.066,.131);
          for(let j=0;j<5;j++){
            const x=(j-2)*.038,w=(2-j*s)/4;
            rod(end,ivory,vec(x*.64,-.025,.07),vec(x*1.20+(ape&&w===1?-s*.087:0),-.047,.235+.072*w),.018);
          }
        }
        limbs.push({s,arm,members,end});
      }
      return {ape,root,figure,trunk,neck,pelvisNode,close,basePad,limbs,chest};
    }
    const species=[skeleton(false),skeleton(true)];
    function poseSpecies(r,t,detail){
      const {ape,figure,trunk,neck,pelvisNode,close}=r;
      figure.visible=!detail;r.basePad.visible=!detail;close.visible=detail;
      if(detail){
        close.position.set(0,0,0);close.scale.setScalar(1);close.rotation.set(0,(t-.0)*Math.PI*.58,0);return;
      }
      figure.position.z=(t-.5)*(ape?.89:.88);
      const wave=Math.sin(TAU*t),lean=ape?.94:.065, base=vec(.038*wave,(ape?1.04:1.62)+.027*Math.cos(2*TAU*t),ape?-.38:-.08);
      const rotation=new T.Euler(lean,0,0);
      trunk.position.copy(base);trunk.rotation.copy(rotation);
      const onTrunk=(x,y,z)=>vec(x,y,z).applyEuler(rotation).add(base);
      pelvisNode.position.copy(base);pelvisNode.rotation.set(ape?.66:.01,0,.042*wave);pelvisNode.scale.setScalar(ape?.48:.54);
      neck.position.copy(onTrunk(0,1.58,ape?.095:.004));neck.rotation.set(ape?.34:.02,0,0);
      for(const l of r.limbs){
        const {s,arm}=l;
        const start=arm?onTrunk(s*.40,r.chest,0):vec(s*(ape?.19:.253),base.y-.09,base.z+.02);
        const gait=t+(s>0?0:.5)+(arm?.5:0),[step,lift]=stride(gait,ape?.89:.88,ape?.11:.17);
        let target,l1,l2,bend;
        if(arm&&!ape){
          target=vec(s*.43,start.y-1.25,start.z-.34*Math.cos((t+(s>0?0:.5))*TAU));
          l1=.69;l2=.63;bend=vec(s*.08,0,-1);
        }else if(arm){
          target=vec(s*.42,.12+lift,.91+step);l1=.88;l2=.85;bend=vec(s*.18,.1,-1);
        }else{
          target=vec(s*(ape?.25:.21),.09+lift,(ape?-.41:-.07)+step);
          l1=ape?.59:.78;l2=ape?.54:.73;bend=vec(s*.08,.12,1);
        }
        const [mid,end]=solve(start,target,l1,l2,bend);
        for(const [i,[a,b]] of [[start,mid],[mid,end]].entries()){
          const seg=l.members[i],d=b.clone().sub(a);
          const girth=arm?(ape?.84:.60):(ape?.75:.84);
          seg.position.copy(a);seg.scale.set(girth,d.length(),girth);seg.quaternion.setFromUnitVectors(vec(0,-1,0),d.normalize());
        }
        l.end.position.copy(end);l.end.rotation.x=arm||lift<.001?0:.23*Math.sin(gait*TAU);
      }
    }
    return {scene,
      pose(state,t){
        nursery.visible=state.movement==='baby';comparison.visible=!nursery.visible;
        if(nursery.visible)poseBaby(state.babyStage||0,t);
        else for(const r of species)poseSpecies(r,t,state.mode==='chain');
      },
      layout(yaw,detail){
        const spacing=detail?.94:1.28;
        return species.map((r,i)=>{
          const offset=(i?1:-1)*spacing;
          r.root.position.set(Math.cos(yaw)*offset,0,-Math.sin(yaw)*offset);
          return r.root.position.clone().add(vec(0,detail?-.72:-.16,0));
        });
      }
    };
  }
  window.azDevelopmentLessons={lessons,stages,create};
})();
