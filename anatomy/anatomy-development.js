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
  const durations=[2.8,3.1,2.6,3.3,3.6,2.8,3.1,4.2];
  const transitions=[.55,1.25,1.1,1.5,2.0,2.4,2.1,0];
  const duration=durations.reduce((sum,value,i)=>sum+value+transitions[i],0);
  function babyTime(amount){
    let seconds=Math.max(0,Math.min(1,amount))*duration;
    for(let i=0;i<durations.length-1;i++){
      if(seconds<durations[i])return {stage:i,phase:seconds/durations[i],blend:0};
      seconds-=durations[i];
      if(seconds<transitions[i])return {stage:i,phase:1,blend:seconds/transitions[i]};
      seconds-=transitions[i];
    }
    return {stage:7,phase:Math.min(1,seconds/durations[7]),blend:0};
  }
  const lessons = {
    baby: { title:'Baby Motor Development', source:'This continuous illustration follows changes in balance, support and coordination. Babies develop on overlapping timelines and can use different movement strategies or skip crawling.',
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
    function solve(a,goal,l1,l2,bend) {
      const axis=goal.clone().sub(a), raw=axis.length();axis.normalize();
      const d=Math.max(Math.abs(l1-l2)+.0001,Math.min(l1+l2-.0001,raw));
      const tangent=bend.clone().addScaledVector(axis,-bend.dot(axis));
      if(tangent.lengthSq()<1e-8)tangent.set(1,0,0);
      const along=(l1*l1-l2*l2+d*d)/(2*d);
      const center=a.clone().addScaledVector(axis,along), radius=Math.sqrt(Math.max(0,l1*l1-along*along));
      const mid=center.clone().addScaledVector(tangent.normalize(),radius);
      return [mid,a.clone().addScaledVector(axis,d)];
    }
    pad.userData.groundSurface=true;
    const disk=new T.CylinderGeometry(1,1,.018,56);
    function floor(parent,rx,rz) {const m=mesh(parent,disk,pad);m.scale.set(rx,1,rz);m.position.y=-.012;return m;}
    const nursery=group(scene), baby=group(nursery), body=group(baby);
    floor(nursery,1.63,2.80);
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
    railMat.transparent=true;
    rod(rail,railMat,vec(.64,1.09,.09),vec(.64,1.09,1.29),.042);
    for(const z of [.09,1.29])rod(rail,railMat,vec(.64,0,z),vec(.64,1.09,z),.039);
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
    // Each sample supplies joint targets in the same world frame. Interpolate
    // the targets first, then solve the fixed length limbs once for the display.
    const qx=a=>new T.Quaternion().setFromAxisAngle(vec(1,0,0),a);
    const qy=a=>new T.Quaternion().setFromAxisAngle(up,a);
    const qz=a=>new T.Quaternion().setFromAxisAngle(vec(0,0,1),a);
    const ease=t=>t*t*(3-2*t);
    function babySample(stage,u){
      const t=ease(u),phase=TAU*t,wave=Math.sin(phase);
      let y,z,lean,headLean,yaw=0,side=0,tilt=0,roll=0,headRoll=0;
      switch(stage){
        case 0:case 1:
          roll=stage===0?Math.PI:Math.PI*(1-t);
          headRoll=stage===0?roll:Math.PI*(1-ease(Math.min(1,t*1.23)));
          y=.287+.040*Math.sin(roll);z=-.49;lean=Math.PI/2;
          headLean=stage===0?1.54:1.54-.47*t;
          side=.19*Math.sin(roll);break;
        case 2:y=.262;z=-.49;lean=1.43-.53*t;headLean=.59-.45*t;break;
        case 3:y=.265;z=-.49+.44*t;lean=1.42;headLean=.42;yaw=.055*wave;break;
        case 4:{
          z=-.05+.56*t;lean=1.30;headLean=.36;
          const stance=t%1<.5?t:t+.5;
          const [dz]=stride(stance,.56,.095);
          const kneeOffset=dz;
          y=.112+Math.sqrt(.464**2-.018**2-kneeOffset**2)-.03*Math.cos(lean);
          break;
        }
        case 5:y=.28;z=.48;lean=.12;headLean=.05;side=.08*t;yaw=.44+.32*t;tilt=-.07*t;break;
        case 6:
          y=.41+.45*t;z=.51;side=.19;lean=.32-.22*t;
          headLean=.09;yaw=Math.PI/2;break;
        default:
          y=.85+.018*Math.cos(phase*4);z=.58+.85*t;
          lean=.11;headLean=.03;side=.12+.055*Math.sin(phase*2);
      }
      const orientation=qy(yaw).multiply(qx(lean)).multiply(qy(roll)).multiply(qz(tilt));
      const headOrientation=qy(yaw).multiply(qx(headLean)).multiply(qy(headRoll));
      const hip=vec(side,y,z), limbs=[];
      for(const {s,arm} of babyLimbs){
        let goal,pole=vec(s*.20,.04,arm?-1:1),foot=0,footYaw=yaw;
        if(stage<2){
          // Carry the folded limbs round the long axis, letting the leading
          // hand reach for the mat ahead of the shoulder as the trunk turns.
          const k=stage===0?wave*s:0;
          const supine=arm?vec(-s*.37,.42+.10*k,z+.44+.13*k):vec(-s*.24,.42+.09*k,z-.56-.12*k);
          const angle=roll-Math.PI, axis=qz(angle);
          goal=supine.clone().sub(vec(0,.287,z)).applyQuaternion(axis).add(hip);
          pole=(arm?vec(-s*.85,-.3,-.35):vec(-s*.22,1,.1)).applyQuaternion(axis);
          if(stage===1){
            const settle=ease(t);
            const prone=arm?vec(s*.34,.065,z+.68):vec(s*.25,.079,z-.67);
            goal.lerp(prone,settle);
            pole.lerp(arm?vec(s*.65,-.22,-.5):vec(s*.7,-.5,.3),settle);
          }
          footYaw=Math.PI;foot=stage===0?-.8:-.8*(1-t);
        }else if(stage===2||stage===3){
          const [dz,dy]=stage===3?stride(t+(s>0?0:.5)+(arm?0:.5),.44,.08):[0,0];
          goal=arm?vec(s*.34,.063+dy,z+(stage===2?.69:.90)+dz):vec(s*(.26+.045*s*wave),.077,z-.65+dz);
          pole=arm?vec(s*.62,-.15,-.8):vec(s*.82,-.65,.25);footYaw=Math.PI;
        }else if(stage===4){
          const [dz,dy]=stride(t+(s>0?0:.5)+(arm?0:.5),.56,arm?.12:.095);
          // On hands and knees the knee is the stance contact. Supply it
          // independently of the ankle and construct the calf from that joint.
          goal=arm?vec(s*.32,.063+dy,z+.64+dz):vec(s*.22,.112+dy,z+.03*Math.sin(lean)+dz);
          pole=arm?vec(s*.32,.02,-1):vec(s*.10,-.10,-1);
          footYaw=Math.PI;
        }else if(stage===5){
          goal=arm?(s===1?vec(.38*t+.36,.40+.39*t,.33):vec(-.33,.12,.15)):vec(s*.50,.076,.58);
          goal.applyQuaternion(qy(yaw)).add(vec(side,0,z));
          if(!arm)pole.set(s*.85,-.63,.20).applyQuaternion(qy(yaw));
        }else if(stage===6){
          goal=arm?vec(.64,1.09,z-s*.27):vec(.21,.074,z-s*.21);
          pole=vec(arm?-.7:1,.04,s*.14);
        }else{
          const [dz,dy]=stride(2*t+(s>0?0:.5),.425,.118);
          goal=arm?vec(side+s*.50,1.56+.035*s*wave,z+.17):vec(.12+s*.215,.074+dy,z+dz);
        }
        limbs.push({goal,pole,foot:qy(footYaw).multiply(qx(foot))});
      }
      return {hip,orientation,headOrientation,limbs,stage};
    }
    function blendDirection(a,b,t){
      const turn=new T.Quaternion().setFromUnitVectors(a.clone().normalize(),b.clone().normalize());
      return a.clone().normalize().applyQuaternion(new T.Quaternion().slerp(turn,t));
    }
    function restAboveFloor(root,end,length,height,side){
      if(end.y>=height)return;
      const horizontal=end.clone().sub(root);horizontal.y=0;
      if(horizontal.lengthSq()<1e-8)horizontal.set(side,0,.12);
      const dy=T.MathUtils.clamp(height-root.y,-length,length);
      end.copy(root).add(horizontal.setLength(Math.sqrt(Math.max(0,length*length-dy*dy))));end.y+=dy;
    }
    const babyBounds=new T.Box3();
    function poseBaby(amount){
      const time=babyTime(amount),first=babySample(time.stage,time.phase);
      const k=ease(time.blend),next=k?babySample(time.stage+1,0):first;
      // Show the rail as the baby reaches for it and fade it after release.
      railMat.opacity=time.stage===5?k:time.stage===6?1-k:0;
      rail.visible=railMat.opacity>0;
      railMat.depthWrite=railMat.opacity===1;
      body.position.copy(first.hip).lerp(next.hip,k);
      body.quaternion.copy(first.orientation).slerp(next.orientation,k);
      head.position.copy(vec(0,.84,0).applyQuaternion(body.quaternion)).add(body.position);
      head.quaternion.copy(first.headOrientation).slerp(next.headOrientation,k);
      for(let i=0;i<babyLimbs.length;i++){
        const l=babyLimbs[i],a=first.limbs[i],b=next.limbs[i],arm=l.arm;
        const start=vec(l.s*(arm?.27:.202),arm?.64:.03,0).applyQuaternion(body.quaternion).add(body.position);
        const lengths=arm?[.378,.344]:[.464,.431];
        function joints(pose,target){
          const root=vec(l.s*(arm?.27:.202),arm?.64:.03,0).applyQuaternion(pose.orientation).add(pose.hip);
          if(!arm&&pose.stage===4){
            const knee=target.goal.clone().sub(root).setLength(lengths[0]).add(root);
            return [root,knee,knee.clone().add(vec(0,.026,-.431).setLength(lengths[1]))];
          }
          const goal=target.goal.clone();goal.y=Math.max(arm?.063:.076,goal.y);
          const pole=target.pole.clone();
          if(pose.stage===1&&!arm)pole.set(pole.x,.48,pole.z+.10);
          const [mid,end]=solve(root,goal,...lengths,pole);
          restAboveFloor(root,mid,lengths[0],arm?.10:.145,l.s);
          const delta=end.clone().sub(mid);
          end.copy(mid).add(delta.setLength(lengths[1]));
          restAboveFloor(mid,end,lengths[1],arm?.065:.078,l.s);
          return [root,mid,end];
        }
        const [rootA,midA,endA]=joints(first,a);
        let mid=midA,end=endA;
        if(k){
          const [rootB,midB,endB]=joints(next,b);
          const upper=blendDirection(midA.clone().sub(rootA),midB.clone().sub(rootB),k);
          const lower=blendDirection(endA.clone().sub(midA),endB.clone().sub(midB),k);
          mid=start.clone().addScaledVector(upper,lengths[0]);
          restAboveFloor(start,mid,lengths[0],arm?.10:.145,l.s);
          end=mid.clone().addScaledVector(lower,lengths[1]);
          restAboveFloor(mid,end,lengths[1],arm?.065:.078,l.s);
        }
        drawBabyLimb(l,start,mid,end,a.foot.clone().slerp(b.foot,k));
      }
      // The contact can migrate from head to side, pelvis, knees or feet.
      // Seat the actual skin surface on the mat throughout the roll and transfers.
      baby.position.y=0;
      baby.position.y=.001-babyBounds.setFromObject(baby,true).min.y;
    }
    function drawBabyLimb(l,start,mid,end,orientation){
      const r=l.arm?.095:.130;
      span(l.upper,start,mid,r);span(l.lower,mid,end,r*.84);
      l.joint.position.copy(mid);l.joint.scale.setScalar(r*.82);
      span(l.cuff,start,start.clone().lerp(mid,l.arm?.37:.48),r*1.07);
      l.end.position.copy(end);
      l.end.quaternion.copy(orientation);
      l.end.scale.set(l.arm?.082:.091,l.arm?.060:.072,l.arm?.098:.145);
      l.end.position.add(vec(0,0,l.arm?.025:.047).applyQuaternion(orientation));
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
          rod(end,ivory,vec(-s*.046,-.012,.017),vec(-s*.092,-.071,.070),.016);
          rod(end,ivory,vec(-s*.092,-.071,.070),vec(-s*.084,-.105,.088),.011);
          for(let j=0;j<4;j++){
            const x=(j-1.5)*.031, curled=ape?.063:.005;
            rod(end,ivory,vec(x,0,0),vec(x*1.12,-.105,curled),.013);
            rod(end,ivory,vec(x*1.12,-.105,curled),vec(x*1.10,-(ape?.120:.18),ape?.016:.032),.012);
          }
        }else{
          oval(end,ivory,0,-.013,.040,.080,.066,.131);
          for(let j=0;j<5;j++){
            const x=(j-2)*.038,w=(2-(j-2)*s)/4;
            rod(end,ivory,vec(x*.64,-.025,.07),vec(x*1.20+(ape&&w===1?-s*.087:0),-.047,.235+.072*w),.018);
          }
        }
        limbs.push({s,arm,members,end});
      }
      return {ape,root,figure,trunk,neck,pelvisNode,close,basePad,limbs,chest};
    }
    const species=[];
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
      babyCenter(){
        const centre=head.position.clone().lerp(body.position,.57);
        centre.y=(babyBounds.min.y+babyBounds.max.y)/2+.08;
        return centre.add(baby.position);
      },
      pose(state,t){
        nursery.visible=state.movement==='baby';comparison.visible=!nursery.visible;
        if(nursery.visible)poseBaby(t);
        else{
          if(!species.length)species.push(skeleton(false),skeleton(true));
          for(const r of species)poseSpecies(r,t,state.mode==='chain');
        }
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
  window.azDevelopmentLessons={lessons,stages,babyTime,duration,create};
})();
