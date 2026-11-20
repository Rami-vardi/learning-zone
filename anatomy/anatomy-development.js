// Interactive teaching models for infant movement and comparative locomotion.
(() => {
  'use strict';
  const stages = [
    ['Lying on the back', 'Watch the gold dot during a kick. The legs move the center of mass a little while the head and back give the baby a broad base on the mat.'],
    ['Rolling over', 'As the baby rolls onto one side, the shaded contact area narrows. Follow the floor marker across the mat as the chest turns down.'],
    ['Pushing up on the hands', 'The palms meet the mat and the chest rises. Watch the gap grow between the center of mass and its floor marker.'],
    ['Belly crawling', 'As one arm reaches, the body travels forward with its center of mass low. Watch which parts of the body still contact the mat.'],
    ['Hands and knees crawling', 'With the belly clear, the hands and knees form a new base. Watch how it changes as a hand and the opposite knee advance.'],
    ['Sitting and reaching', 'Compare the outward reach with the return. The gold dot shifts toward the reaching hand while the seat and legs stay on the mat.'],
    ['Standing with support', 'The center of mass rises as the legs straighten. The shaded area shows floor contact. Rings at the hands show the extra support supplied by the rail.'],
    ['First independent steps', 'Follow the floor marker as the baby shifts toward the stance foot. When the other foot lifts, the base narrows until the next foot lands.']
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
      link:['Posture and balance in motor development','https://pmc.ncbi.nlm.nih.gov/articles/PMC5182199/'] },
    chimp: { title:'Human and Chimpanzee Locomotion', source:'These schematic models compare a human walking on two feet with a chimpanzee walking on its knuckles and feet. Both species also use other movement patterns.',
      link:['Comparative pelvic anatomy','https://pmc.ncbi.nlm.nih.gov/articles/PMC4305164/'] }
  };
  function create(T, adultPelvis, legs, exArms) {
    const scene = new T.Scene();
    const vec = (x,y,z) => new T.Vector3(x,y,z);
    const up = vec(0,1,0);
    const group = parent => {const g=new T.Group();parent.add(g);return g;};
    const mat = color => new T.MeshStandardMaterial({color,roughness:.82});
    const skin=mat(0xffcbae), suit=mat(0x252931), lapel=mat(0x383d46);
    const white=mat(0xfffaf1), tie=mat(0x15171e), shoe=mat(0x29252a);
    const brow=mat(0xbd9474);
    const ear=mat(0xe9a68f);
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
    const coatProfile=[
      [-.018,.302,.240],[.006,.321,.253],[.070,.324,.260],[.20,.320,.263],
      [.37,.312,.266],[.54,.311,.248],[.665,.317,.205],[.730,.296,.176],
      [.780,.214,.133],[.793,.135,.101]
    ];
    function tailoredForm(profile){
      const rings=28,positions=[],indices=[];
      for(let i=0;i<profile.length;i++){
        const [y,w,d]=profile[i];
        for(let j=0;j<rings;j++){
          const a=2*Math.PI*j/rings;
          positions.push(w*Math.sin(a),y,d*Math.cos(a));
          if(i+1<profile.length){
            const k=i*rings+j,n=i*rings+(j+1)%rings;
            indices.push(k,n,k+rings,n,n+rings,k+rings);
          }
        }
      }
      const last=(profile.length-1)*rings;
      for(let j=1;j<rings-1;j++)indices.push(0,j+1,j,last,last+j,last+j+1);
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
      return g;
    }
    const jacket=mesh(body,tailoredForm(coatProfile),suit);
    for(const side of [-1,1]){
      arc(body,lapel,[vec(side*.19,.23,.210),vec(side*.23,.247,.178),vec(side*.262,.257,.141)],.006);
    }
    arc(body,lapel,[vec(0,.020,-.244),vec(0,.095,-.253),vec(0,.165,-.258)],.0035);
    // The sleeves and trouser hems overlap their joints even as the limbs bend.
    const sleeve=tailoredForm([[-.53,.62,.66],[-.49,.95,.96],[-.27,1.05,1.07],[.22,1.12,1.16],[.44,1.02,1.04],[.54,.60,.63]]);
    const sleeveFore=tailoredForm([[-.53,.48,.50],[-.48,.96,.96],[.12,1.08,1.08],[.43,1.03,1.03],[.55,.65,.65]]);
    const trouserThigh=tailoredForm([[-.56,.65,.72],[-.49,1.03,1.02],[-.25,1.21,1.14],[.17,1.23,1.22],[.44,1.01,1.05],[.56,.65,.68]]);
    const trouserHem=tailoredForm([[-.54,.79,.85],[-.49,1.08,1.05],[-.32,1.00,1.02],[.17,1.12,1.12],[.33,1.00,1.01],[.42,.91,.91],[.445,.85,.86]]);
    const seat=oval(body,suit,0,-.007,-.022,.282,.313,.249);
    function coatFront(x,y){
      const j=coatProfile.findIndex(section=>section[0]>=y);
      const a=coatProfile[Math.max(0,j===-1?coatProfile.length-1:j-1)],b=coatProfile[j===-1?coatProfile.length-1:j];
      const t=a===b?0:T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);
      const w=T.MathUtils.lerp(a[1],b[1],t),d=T.MathUtils.lerp(a[2],b[2],t);
      return d*Math.sqrt(Math.max(0,1-(x/w)**2));
    }
    function clothPanel(points,material){
      const positions=[],subdivisions=5;
      function vertex(a,b,c,u,v){
        const w=1-u-v,x=w*a[0]+u*b[0]+v*c[0],y=w*a[1]+u*b[1]+v*c[1];
        const z=w*a[2]+u*b[2]+v*c[2],offset=material===tie?.014:material===lapel?.009:.004;
        positions.push(x,y,Math.max(z,coatFront(x,y))+offset);
      }
      for(let i=1;i<points.length-1;i++){
        const triangle=[points[0],points[i],points[i+1]];
        for(let j=0;j<subdivisions;j++)for(let k=0;k<subdivisions-j;k++){
          const u=j/subdivisions,v=k/subdivisions,h=1/subdivisions;
          vertex(...triangle,u,v);vertex(...triangle,u+h,v);vertex(...triangle,u,v+h);
          if(j+k<subdivisions-1){
            vertex(...triangle,u+h,v);vertex(...triangle,u+h,v+h);vertex(...triangle,u,v+h);
          }
        }
      }
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
      material.side=T.DoubleSide;
      return mesh(body,geometry,material);
    }
    // Tailor the panels to the curved jacket, including the shirt opening.
    oval(body,white,0,.78,0,.174,.090,.152);
    clothPanel([[-.141,.78,.151],[.14,.78,.151],[.079,.60,.244],[0,.47,.267],[-.076,.60,.244]],white);
    for(const side of [-1,1]){
      clothPanel([[side*.14,.802,.132],[side*.25,.706,.147],[side*.199,.663,.181],
        [side*.224,.626,.170],[side*.048,.449,.271],[side*.123,.668,.219]],lapel);
      clothPanel([[side*.123,.806,.143],[side*.016,.747,.200],[side*.070,.674,.225],[side*.133,.752,.166]],white);
    }
    clothPanel([[-.037,.744,.203],[.038,.744,.203],[.024,.686,.231],[-.016,.686,.231]],tie);
    clothPanel([[-.015,.692,.234],[.023,.692,.234],[.048,.552,.263],[.006,.494,.278],[-.035,.546,.264]],tie);
    for(const y of [.397,.292])oval(body,lapel,.012,y,.264,.017,.017,.008);
    const TAU=2*Math.PI;
    const head=group(baby);
    head.scale.setScalar(1.27);
    const chinY=-.22, crownY=.70, faceMid=(chinY+crownY)/2, faceHeight=crownY-faceMid;
    const bell=(v,width)=>Math.exp(-((v/width)**2));
    function headSection(y){
      const t=(y-faceMid)/faceHeight, circle=Math.sqrt(Math.max(0,1-Math.abs(t)**(t<0?3.15:2.23)));
      const lower=1-T.MathUtils.smoothstep(t,-.89,.19);
      return {width:circle*(.450+.012*lower+.009*bell(t+.45,.32)),
        depth:circle*(.368-.022*lower),center:-.014+.040*lower};
    }
    function facialRelief(x,y){
      const a=Math.abs(x);
      return .027*bell(a-.217,.122)*bell(y-.012,.086)
        -.024*bell(a-.170,.120)*bell(y-.130,.062)
        +.025*bell(x,.057)*bell(y-.103,.092)
        +.050*Math.exp(-((x/.071)**4+((y-.037)/.042)**2))
        +.013*bell(a-.055,.024)*bell(y-.032,.026)
        +.020*bell(x,.133)*bell(y+.043,.054)
        +.012*bell(x,.105)*bell(y+.145,.058);
    }
    function frontAt(x,y){
      const {width,depth,center}=headSection(y);
      const cosine=Math.sqrt(Math.max(0,1-(x/Math.max(.0001,width))**2));
      return center+depth*cosine+facialRelief(x,y)*cosine;
    }
    const headMesh=new T.SphereGeometry(1,72,54);
    const vertices=headMesh.attributes.position,colors=[];
    const baseSkin=new T.Color(0xffcbae),flush=new T.Color(0xe89c82);
    for(let i=0;i<vertices.count;i++){
      const nx=vertices.getX(i),ny=vertices.getY(i),nz=vertices.getZ(i);
      const radial=Math.hypot(nx,nz),y=faceMid+ny*faceHeight;
      const {width,depth,center}=headSection(y);
      // Concentrate angular samples around the nose, eyelids and philtrum.
      const phi=Math.atan2(nx,nz),angle=phi-.55*Math.sin(phi);
      const x=radial>1e-5?width*Math.sin(angle):0,cosine=radial>1e-5?Math.cos(angle):0;
      const z=center+depth*cosine+facialRelief(x,y)*Math.max(0,cosine);
      vertices.setXYZ(i,x,y,z);
      const blush=.55*bell(Math.abs(x)-.231,.100)*bell(y-.007,.071)+.34*bell(x,.066)*bell(y-.055,.045);
      colors.push(...baseSkin.clone().lerp(flush,blush*Math.max(0,cosine)).toArray());
    }
    headMesh.setAttribute('color',new T.Float32BufferAttribute(colors,3));headMesh.computeVertexNormals();
    // Average duplicated normals where the spherical parameterization closes.
    const normals=headMesh.attributes.normal;
    for(let row=0;row<=54;row++){
      const a=row*73,b=a+72;
      const n=vec(0,0,0).fromBufferAttribute(normals,a).add(vec(0,0,0).fromBufferAttribute(normals,b)).normalize();
      for(const i of [a,b])normals.setXYZ(i,n.x,n.y,n.z);
    }
    const complexion=mat(0xffffff);complexion.vertexColors=true;
    const faceMesh=mesh(head,headMesh,complexion);
    // A surface patch follows the curvature of the skull, eye or lips.
    function patch(parent,material,columns,rows,point){
      const positions=[],indices=[];
      for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
        positions.push(...point(i/columns,j/rows));
        if(i<columns&&j<rows){
          const a=j*(columns+1)+i,b=a+columns+1;
          indices.push(a,a+1,b,a+1,b+1,b);
        }
      }
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
      material.side=T.DoubleSide;return mesh(parent,g,material);
    }
    function faceStrip(parent,material,path,width,relief){
      return patch(parent,material,28,4,(t,v)=>{
        const [x,y]=path(t),s=Math.sin(Math.PI*t),q=v*2-1;
        const h=y+q*width*(.02+.98*s**.58);
        return [x,h,frontAt(x,h)+.0015+relief*s*(1-q*q)];
      });
    }
    const lash=mat(0x805646),rim=mat(0x405950),iris=mat(0x608576),pupil=mat(0x172421);
    const crease=mat(0x9e6252),lip=mat(0xe6a085);
    const eyes=[];
    for(const side of [-1,1]){
      const raised=side===1, cx=side*.170,cy=raised?.128:.123;
      const eye=group(head);eye.position.y=cy;eyes.push(eye);
      const halfWidth=.128;
      function eyeLimits(x){
        const u=T.MathUtils.clamp((x-cx)/halfWidth,-1,1);
        const arc=Math.sqrt(Math.max(0,1-u*u));
        const tilt=side*u*(raised?.010:.021);
        return [cy+tilt-.061*arc,cy+tilt+(raised?.029:.015)*arc];
      }
      function eyeSurface(x,y){
        const [lo,hi]=eyeLimits(x),u=(x-cx)/halfWidth;
        const v=(2*y-lo-hi)/Math.max(.0001,hi-lo);
        return frontAt(x,y)+.006+.015*Math.max(0,(1-u*u)*(1-v*v));
      }
      patch(eye,white,22,8,(t,v)=>{
        const x=cx+halfWidth*(2*t-1),[lo,hi]=eyeLimits(x),y=lo+(hi-lo)*v;
        return [x,y-cy,eyeSurface(x,y)];
      });
      // Clip the iris and pupil at the almond-shaped opening so the lids cover them.
      function eyeDisc(material,centerX,centerY,rx,ry,lift){
        patch(eye,material,22,7,(t,v)=>{
          const u=2*t-1,x=centerX+rx*u,dy=ry*Math.sqrt(Math.max(0,1-u*u));
          const [lo,hi]=eyeLimits(x);
          const y=T.MathUtils.lerp(T.MathUtils.clamp(centerY-dy,lo,hi),T.MathUtils.clamp(centerY+dy,lo,hi),v);
          return [x,y-cy,eyeSurface(x,y)+lift];
        });
      }
      const gaze=cx-side*.012;
      eyeDisc(rim,gaze,cy+.003,.059,.065,.0015);
      eyeDisc(iris,gaze,cy+.003,.052,.060,.0030);
      eyeDisc(pupil,gaze,cy+.003,.031,.040,.0045);
      eyeDisc(white,gaze-.014,cy+.014,.011,.012,.006);
      // The fleshy upper lid carries the brow down toward the inner corner.
      patch(head,skin,26,6,(t,v)=>{
        const x=cx+halfWidth*(2*t-1),hi=eyeLimits(x)[1],arch=Math.sin(Math.PI*t);
        const h=hi+v*(.028+.034*arch);
        return [x,h,frontAt(x,h)+(.007+.014*Math.sin(Math.PI*v))*arch*(1-v)];
      });
      for(const upper of [false,true]){
        patch(eye,upper?lash:lip,24,3,(t,v)=>{
          const x=cx+halfWidth*(2*t-1),[lo,hi]=eyeLimits(x);
          const edge=upper?hi:lo,band=(upper?.011:.006)*Math.sin(Math.PI*t);
          const y=edge+(upper?1:-1)*v*band;
          return [x,y-cy,frontAt(x,y)+.008+.003*Math.sin(Math.PI*v)];
        });
      }
      faceStrip(head,brow,t=>{
        const x=side*T.MathUtils.lerp(.062,.282,t);
        const y=(raised?.197:.170)+(raised?.020:.034)*t+(raised?.036:.016)*Math.sin(Math.PI*t);
        return [x,y];
      },raised?.009:.011,.006);
      const nostrilX=side*.042,nostrilY=.016;
      const nostril=oval(head,crease,nostrilX,nostrilY,frontAt(nostrilX,nostrilY)+.001,.012,.0035,.002);
      nostril.rotation.z=side*.20;
      const shell=oval(head,skin,side*.404,.115,-.006,.072,.094,.053);
      shell.rotation.z=-side*.20;
      const inner=oval(head,ear,side*.453,.117,.014,.023,.055,.034);
      inner.rotation.z=-side*.20;
      oval(head,skin,side*.467,.106,.026,.012,.025,.018);
    }
    const smile=t=>[-.079+.172*t,-.061-.014*Math.sin(Math.PI*t)+.022*t**3];
    faceStrip(head,lip,t=>{const [x,y]=smile(t);return [x,y-.009*Math.sin(Math.PI*t)];},.012,.010);
    faceStrip(head,crease,smile,.0058,.004);
    faceStrip(head,lip,t=>[.089+.018*t,-.042+.012*t],.003,.002);
    // Very fine blond hair covers the occiput and crown. Its low part and
    // widow's peak continue around the temple, so no viewing angle has a seam.
    const gold=new T.Color(0xd7a877),rootBlond=new T.Color(0xc09972);
    function hairline(angle){
      const a=Math.atan2(Math.sin(angle),Math.cos(angle));
      return .32+.282*Math.cos(a)+.038*Math.sin(a)
        -.092*bell(a+.11,.245)-.190*bell(Math.abs(a)-1.42,.145);
    }
    function scalpPoint(angle,fraction,lift=0){
      const edge=Math.asin((hairline(angle)-faceMid)/faceHeight);
      const y=faceMid+faceHeight*Math.sin(T.MathUtils.lerp(edge,Math.PI/2,fraction));
      const s=headSection(y);
      return [(s.width+lift)*Math.sin(angle),y+lift*.62,s.center+(s.depth+lift)*Math.cos(angle)];
    }
    const scalpMaterial=mat(0xffffff);scalpMaterial.vertexColors=true;
    const scalp=patch(head,scalpMaterial,100,20,(u,v)=>scalpPoint(TAU*u,v,.0028));
    const scalpColors=[];
    for(let j=0;j<=20;j++)for(let i=0;i<=100;i++){
      const v=j/20,a=TAU*i/100,grain=.5+.5*Math.cos(36*a+9*v);
      const tint=gold.clone().lerp(rootBlond,.19+.24*grain+.14*v);
      scalpColors.push(...baseSkin.clone().lerp(tint,Math.min(1,.18+v*5)).toArray());
    }
    scalp.geometry.setAttribute('color',new T.Float32BufferAttribute(scalpColors,3));
    const strand=mat(0xd9b28a);
    for(let i=0;i<37;i++){
      const angle=TAU*i/37,phase=.5+.5*Math.sin(17*angle),end=.68+.21*phase;
      patch(head,strand,12,1,(t,v)=>{
        const sweep=.36*t*(1-.50*Math.cos(angle)),f=.025+end*t;
        const a=angle+sweep+(v-.5)*.010*Math.sin(Math.PI*t);
        return scalpPoint(a,f,.0034);
      });
    }
    const rail=group(nursery);
    railMat.transparent=true;
    rod(rail,railMat,vec(.64,1.09,.09),vec(.64,1.09,1.29),.042);
    for(const z of [.09,1.29])rod(rail,railMat,vec(.64,0,z),vec(.64,1.09,z),.039);
    const babyLimbs=[];
    for(const s of [-1,1]) for(const arm of [false,true]){
      const limb={s,arm,upper:mesh(baby,arm?sleeve:trouserThigh,suit),lower:mesh(baby,arm?sleeveFore:trouserHem,suit),joint:mesh(baby,sphere,suit),end:mesh(baby,sphere,arm?skin:shoe)};
      limb.cuff=mesh(baby,sphere,arm?white:lapel);
      limb.tip=group(baby);
      if(arm){
        oval(limb.tip,skin,-s*.062,0,.028,.037,.030,.050);
        for(let i=0;i<4;i++)oval(limb.tip,skin,(i-1.5)*.033,-.003,.073,.018,.026,.044-Math.abs(i-1)*.003);
      }
      if(!arm){
        oval(limb.tip,shoe,0,-.032,.026,.104,.026,.166);
        oval(limb.tip,lapel,0,.035,.053,.080,.026,.067);
      }
      babyLimbs.push(limb);
    }

    function plant(t,step,lift) {
      const f=((t%1)+1)%1;
      return f<.5?[-step*.5,0]:[step*(-.5+(1-Math.cos((f-.5)*TAU))*.5),lift*Math.sin((f-.5)*TAU)];
    }
    function stride(t,step,lift){
      const [z,y]=plant(t,step,lift);
      return [step*(Math.floor(t)-t+.25)+z+step*.5,y];
    }
    // Sample each stage in the same world frame. Blend segment directions
    // across transitions so limb lengths stay fixed while scrubbing or playing.
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
          headLean=stage===0?1.54:1.54-.87*t;
          side=.19*Math.sin(roll);break;
        case 2:y=.262;z=-.49;lean=1.43-.53*t;headLean=.59-.45*t;break;
        case 3:y=.265;z=-.49+.44*t;lean=1.42;headLean=.42;yaw=.055*wave;break;
        case 4:{
          z=-.05+.56*t;lean=1.30;headLean=.36;
          side=.055*Math.sin(phase);
          const stance=t%1<.5?t:t+.5;
          const [dz]=stride(stance,.56,.095);
          const kneeOffset=dz;
          y=.112+Math.sqrt(.464**2-.018**2-kneeOffset**2)-.03*Math.cos(lean);
          break;
        }
        case 5:{
          const reach=Math.sin(Math.PI*t);
          y=.28;z=.48+.055*reach;lean=.12+.11*reach;headLean=.05;
          side=.12*reach;yaw=.44+.32*reach;tilt=-.14*reach;break;
        }
        case 6:
          y=.41+.45*t;z=.51;side=.19;lean=.32-.22*t;
          headLean=.09;yaw=Math.PI/2;break;
        default:
          y=.85+.018*Math.cos(phase*4);z=.58+.85*t;
          lean=.11;headLean=.03;side=.12+.145*Math.sin(phase*2+.18);tilt=-.045*Math.sin(phase*2);
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
          const reach=Math.sin(Math.PI*t);
          goal=arm?(s===1?vec(.34+.34*reach,.40+.35*reach,.33):vec(-.33,.085,.15)):vec(s*.50,.076,.58);
          goal.applyQuaternion(qy(arm?yaw:.44)).add(vec(arm?side:0,0,arm?z:.48));
          if(!arm)pole.set(s*.85,-.63,.20).applyQuaternion(qy(yaw));
        }else if(stage===6){
          goal=arm?vec(.64,1.09,z-s*.27):vec(.21,.074,z-s*.21);
          pole=vec(arm?-.7:1,.04,s*.14);
        }else{
          const [dz,dy]=stride(2*t+(s>0?0:.5),.425,.118);
          if(arm){
            const swing=s*Math.sin(phase*2);
            goal=vec(side+s*.41,1.61+.045*swing,z+.21-.075*swing);
            pole=vec(s*.76,-.62,-.44);
          }else goal=vec(.12+s*.215,.074+dy,z+dz);
        }
        limbs.push({goal,pole,foot:qy(footYaw).multiply(qx(foot))});
      }
      return {hip,orientation,headOrientation,limbs,stage,turn:t};
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
    // Representative points on the visible load-bearing surfaces. The shaded
    // area encloses the patches near the mat; elevated rail contact is separate.
    const probes=[],scanPoint=vec(0,0,0),estimatedCOM=vec(0,0,0);
    function sampleSurface(part,steps){
      const attr=part.geometry.attributes.position;
      const points=[];
      for(let i=0;i<attr.count;i+=steps)points.push(vec(attr.getX(i),attr.getY(i),attr.getZ(i)));
      probes.push({part,points});
    }
    sampleSurface(faceMesh,5);
    for(const part of head.children)if(part.geometry===sphere)sampleSurface(part,5);
    sampleSurface(jacket,2);sampleSurface(seat,2);
    for(const limb of babyLimbs){
      for(const part of [limb.upper,limb.lower,limb.joint,limb.end])sampleSurface(part,3);
      for(const digit of limb.tip.children)sampleSurface(digit,13);
    }
    function floorHull(points){
      points.sort((a,b)=>a.x-b.x||a.z-b.z);
      const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
      function append(chain,point){
        while(chain.length>1&&cross(chain[chain.length-2],chain[chain.length-1],point)<=0)chain.pop();
        chain.push(point);
      }
      const upper=[],lower=[];
      for(const point of points)append(lower,point);
      for(let i=points.length-1;i>=0;i--)append(upper,points[i]);
      lower.pop();upper.pop();return lower.concat(upper);
    }
    const balance={center:estimatedCOM,ground:vec(0,.004,0),hull:[],rail:[]};
    function updateBalance(){
      // Fixed illustrative mass shares sum to one, with each bilateral share
      // applied once per side. Segment centroids follow the current pose.
      estimatedCOM.copy(head.localToWorld(vec(0,faceMid,0))).multiplyScalar(.22)
        .addScaledVector(body.localToWorld(vec(0,.36,0)),.42);
      for(const l of babyLimbs){
        estimatedCOM.addScaledVector(l.upper.getWorldPosition(scanPoint),l.arm?.031:.070)
          .addScaledVector(l.lower.getWorldPosition(scanPoint),l.arm?.019:.039)
          .addScaledVector(l.end.getWorldPosition(scanPoint),l.arm?.008:.013);
      }
      balance.ground.set(estimatedCOM.x,.004,estimatedCOM.z);
      const contacts=[];
      for(const {part,points} of probes){
        for(const local of points){
          scanPoint.copy(local).applyMatrix4(part.matrixWorld);
          if(scanPoint.y<.029)contacts.push({x:scanPoint.x,z:scanPoint.z});
        }
      }
      balance.hull=floorHull(contacts);
      balance.rail.length=0;
      if(rail.visible)for(const l of babyLimbs)if(l.arm){
        const hand=l.end.getWorldPosition(vec(0,0,0));
        const barPoint=vec(.64,1.09,T.MathUtils.clamp(hand.z,.09,1.29));
        if(railMat.opacity>.5&&hand.distanceTo(barPoint)<.13)balance.rail.push(barPoint);
      }
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
      // The occiput and the back share the mat in supine. The head leads the
      // roll and lifts clear of the face before the baby settles prone.
      const headSupport=p=>{
        if(p.stage===0)return .210;
        if(p.stage===1)return .103+.107*(1-T.MathUtils.smoothstep(p.turn,.40,.78));
        return p.stage===2?.103*(1-p.turn):0;
      };
      head.position.y+=T.MathUtils.lerp(headSupport(first),headSupport(next),k);
      const seconds=amount*duration;
      const blink=[2.2,10.7,19.5,27.1,34.5].reduce((v,time)=>Math.max(v,Math.max(0,1-Math.abs(seconds-time)/.10)),0);
      for(const eye of eyes)eye.scale.y=1-.90*ease(blink);
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
      baby.updateMatrixWorld(true);updateBalance();
    }
    function drawBabyLimb(l,start,mid,end,orientation){
      const r=l.arm?.103:.139;
      span(l.upper,start,mid,r);span(l.lower,mid,end,r*.84);
      l.joint.position.copy(mid);l.joint.scale.setScalar(r*.82);
      span(l.cuff,mid.clone().lerp(end,.80),end,r*.66);
      l.end.position.copy(end);
      l.end.quaternion.copy(orientation);
      l.end.scale.set(l.arm?.082:.107,l.arm?.060:.072,l.arm?.098:.172);
      l.end.position.add(vec(0,0,l.arm?.025:.072).applyQuaternion(orientation));
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
    return {scene,balance,
      babyCenter(){
        const centre=head.position.clone().lerp(body.position,.57);
        centre.y=(babyBounds.min.y+babyBounds.max.y)/2+.04;
        centre.x=0;
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
