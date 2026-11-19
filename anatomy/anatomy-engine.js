(function(){
  'use strict';
  window.createAnatomyViewer=function(container,initial={}){
    const T=window.THREE;
    if(!T)throw Error('The 3D anatomy library could not load. Open Anatomy Zone again to retry.');
    let state=Object.assign({movement:'hike',amount:0.35,mode:'local',side:'right',labels:false,ghost:false},initial);
    let width=600,height=500,disposed=false,yaw=initial.view==='side'?Math.PI/2:initial.view==='back'?Math.PI:initial.view==='oblique'?(initial.movement?.[0]==='c'?1.05:.75):0,pitch=initial.view==='oblique'?.10:.04,distance=7.3,target=new T.Vector3(0,2.7,0),lastMove='';
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,60);
    const model=new T.Group();scene.add(model);
    const palettes={ivory:0xdcd9ce,context:0xc5c7c3,pelvis:0x709dbf,femur:0xdcd9ce,thorax:0x709dbf,scapula:0x709dbf,foot:0x709dbf};
    const regionMaterials={};
    function mat(region){if(!regionMaterials[region])regionMaterials[region]=new T.MeshStandardMaterial({color:palettes[region]||palettes.ivory,roughness:.76,metalness:.01});return regionMaterials[region];}
    const boneM=mat('ivory'),ctxM=mat('context');
    scene.add(new T.HemisphereLight(0xffffff,0x8198b2,1.6));
    let light=new T.DirectionalLight(0xfffaf2,2.2);light.position.set(-3,8,6);scene.add(light);
    light=new T.DirectionalLight(0xc8e2ff,1.1);light.position.set(4,4,-4);scene.add(light);
    function mesh(geo,material,parent=model){const m=new T.Mesh(geo,material);parent.add(m);return m;}
    function sphere(parent,x,y,z,rx,ry,rz,material=boneM){const m=mesh(new T.SphereGeometry(1,28,18),material,parent);m.position.set(x,y,z);m.scale.set(rx,ry,rz);return m;}
    function tube(parent,points,radius,material=boneM,segments=32){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(new T.TubeGeometry(curve,segments,radius,10,false),material,parent);}
    function between(parent,a,b,r1,r2,material=boneM){const A=new T.Vector3(...a),B=new T.Vector3(...b),delta=B.clone().sub(A);const m=mesh(new T.CylinderGeometry(r2,r1,delta.length(),20,1),material,parent);m.position.copy(A).add(B).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
    function plate(parent,outline,depth,material){const shape=new T.Shape();outline.forEach((p,i)=>i?shape.lineTo(p[0],p[1]):shape.moveTo(p[0],p[1]));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.025,curveSegments:10});return mesh(g,material,parent);}
    function sculptedShaft(parent,centres,radii,material){
      const points=centres.map(p=>new T.Vector3(...p)),curve=new T.CatmullRomCurve3(points),segments=32,radial=16,frames=curve.computeFrenetFrames(segments,false),positions=[],indices=[];
      for(let i=0;i<=segments;i++){const t=i/segments,c=curve.getPointAt(t),f=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(f)),r=T.MathUtils.lerp(radii[j],radii[j+1],f-j);
        for(let k=0;k<radial;k++){const a=k/radial*Math.PI*2,v=c.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r*.88);positions.push(v.x,v.y,v.z);}}
      for(let i=0;i<segments;i++)for(let k=0;k<radial;k++){const n=(k+1)%radial,a=i*radial+k,b=i*radial+n,c=(i+1)*radial+k,d=(i+1)*radial+n;indices.push(a,c,b,b,c,d);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return mesh(g,material,parent);
    }
    const pelvis=new T.Group();pelvis.position.y=3.3;model.add(pelvis);
    const pelvicM=mat('pelvis');
    for(const s of [-1,1]){
      const wing=plate(pelvis,[[s*.23,-.21],[s*.29,.09],[s*.22,.39],[s*.40,.59],[s*.67,.65],[s*.87,.52],[s*.90,.23],[s*.76,-.10],[s*.52,-.25]],.09,pelvicM);
      // Cup the iliac blade instead of leaving a flat extruded plate.
      const wp=wing.geometry.attributes.position;
      for(let k=0;k<wp.count;k++){const x=Math.abs(wp.getX(k)),y=wp.getY(k);wp.setZ(k,wp.getZ(k)+.16*Math.pow(Math.max(0,(x-.22)/.70),1.5)-.065*Math.sin((y+.25)*Math.PI));}
      wp.needsUpdate=true;wing.geometry.computeVertexNormals();wing.position.z=-.15;wing.rotation.y=s*.17;
      tube(pelvis,[[s*.25,.40,-.13],[s*.48,.61,-.13],[s*.73,.59,-.08],[s*.89,.43,.03]],.047,pelvicM);
      tube(pelvis,[[s*.71,.04,-.02],[s*.58,-.25,.08],[s*.42,-.47,.22],[s*.15,-.47,.36],[0,-.32,.39]],.065,pelvicM);
      tube(pelvis,[[s*.59,-.14,.04],[s*.40,-.03,.22],[s*.15,-.12,.34],[0,-.32,.39]],.05,pelvicM);
      sphere(pelvis,s*.51,-.17,.005,.18,.18,.12,pelvicM);
    }
    const sacrum=plate(pelvis,[[-.23,.35],[.23,.35],[.16,-.15],[0,-.35],[-.16,-.15]],.12,pelvicM);sacrum.position.z=-.22;
    const landmarkM=new T.MeshStandardMaterial({color:0x3762ba,roughness:.6});
    const landmarks=[];
    const torso=new T.Group();torso.position.y=4.72;model.add(torso);
    const spineGroups=[];
    for(let i=0;i<17;i++){
      const v=new T.Group();const y=3.55+i*.137;v.position.set(0,y,-.16+Math.sin(i/16*Math.PI*1.4)*.13);model.add(v);spineGroups.push({node:v,y,z:v.position.z});
      const vr=i<5?.125:.108;
      const body=mesh(new T.CylinderGeometry(vr*.96,vr*1.06,.095,20),ctxM,v);body.scale.z=.82;
      tube(v,[[-vr*.70,0,-.035],[-vr*.82,0,-.11],[0,0,-.16],[vr*.82,0,-.11],[vr*.70,0,-.035]],.023,ctxM,18);
      between(v,[0,0,-.13],[0,-.025,-.245],.029,.016,ctxM);
      for(const side of [-1,1])between(v,[side*.07,0,-.065],[side*.18,-.01,-.08],.024,.014,ctxM);
    }
    const spineGuide=tube(model,[[0,3.55,-.16],[0,4.05,-.035],[0,4.70,-.06],[0,5.30,-.22],[0,5.80,-.28]],.066,ctxM,36);
    const ribs=[];const thorM=mat('thorax');
    for(let i=0;i<12;i++){
      const y=.93-i*.132,w=.46+Math.sin((i+1)/14*Math.PI)*.38,d=.30+Math.sin(i/14*Math.PI)*.18;
      for(const s of [-1,1]){
        const g=new T.Group();g.position.set(0,y,-.30);torso.add(g);ribs.push(g);
        const pts=[];const max=i<7?Math.PI*.96:i<10?Math.PI*(.95-(i-6)*.07):Math.PI*(i===10?.62:.48);
        for(let j=0;j<=20;j++){let a=j/20*max;pts.push([s*(.08+w*Math.sin(a)), -.16*Math.sin(a)+.05*(a/Math.PI),d*(1-Math.cos(a))]);}
        tube(g,pts,.034,thorM,28);
      }
    }
    const sternum=between(torso,[0,.99,.39],[0,-.02,.59],.058,.045,thorM),sternumRest=sternum.position.clone();
    const fitCostalCartilage=window.azAttachThorax?.(T,ribs,sternum);
    const scapulae=[];
    for(const s of [-1,1]){
      const g=new T.Group();torso.add(g);scapulae.push({node:g,side:s});
      const p=plate(g,[[-.17,.25],[.20,.14],[.04,-.43],[-.17,-.12]],.045,mat('scapula'));p.rotation.y=-s*.25;
      tube(g,[[-.19,.13,.025],[.03,.11,.06],[.23,.22,.08]],.040,mat('scapula'));
    }
    // Clavicles and arms provide spatial context for scapular travel.
    const arms=[];
    for(const s of [-1,1]){
      const clavicle=tube(torso,[[0,1.00,.33],[s*.46,1.05,.24],[s*.98,.91,.10]],.04,ctxM);
      const a=new T.Group();a.position.set(s*1.04,.83,.02);torso.add(a);arms.push({node:a,side:s,clavicle});
      sphere(a,0,0,0,.14,.14,.14,ctxM);between(a,[0,-.06,0],[s*.16,-1.02,.04],.055,.065,ctxM);sphere(a,s*.16,-1.06,.04,.075,.075,.075,ctxM);
      between(a,[s*.15,-1.08,.04],[s*.08,-1.91,.18],.036,.046,ctxM);between(a,[s*.23,-1.08,.04],[s*.16,-1.9,.21],.028,.035,ctxM);
      for(let row=0;row<2;row++)for(let j=0;j<4;j++)sphere(a,s*(.025+j*.045),-1.94-row*.055,.20,.025,.026,.025,ctxM);
      for(let j=0;j<5;j++){
        const thumb=j===0,x=s*(.018+j*.047),spread=thumb?-s*.12:s*(j-2)*.009,yy=-2.025;
        const palmEnd=[x+spread,yy-(thumb?.13:.22),.22];between(a,[x,-2.00,.20],palmEnd,thumb?.025:.021,thumb?.027:.024,ctxM);
        let prior=palmEnd;const lengths=thumb?[.075,.07]:[.09-(j===4?.025:0),.067,.052];
        for(let k=0;k<lengths.length;k++){const end=[prior[0]+(thumb?-s*.03:s*(j-2)*.004),prior[1]-lengths[k],prior[2]+.01];between(a,prior,end,.017-k*.002,.020-k*.002,ctxM);sphere(a,...prior,.022-k*.002,.025-k*.002,.021-k*.002,ctxM);prior=end;}
      }
    }
    const head=new T.Group();head.position.set(0,6.25,-.08);model.add(head);
    for(let i=0;i<7;i++){
      const v=mesh(new T.CylinderGeometry(.074,.080,.046,18),ctxM,head);v.position.set(0,-.40+i*.058,-.005);v.scale.z=.82;
      between(head,[0,-.40+i*.058,-.045],[0,-.42+i*.058,-.12],.02,.012,ctxM);
    }
    const cervicalMeshes=head.children.slice();
    sphere(head,0,.16,-.025,.295,.355,.272,ctxM);
    sphere(head,0,.16,.125,.25,.22,.17,ctxM);
    const cavityM=new T.MeshStandardMaterial({color:0x626961,roughness:1});
    for(const side of [-1,1]){
      sphere(head,side*.118,.025,.263,.073,.059,.025,cavityM);
      const rim=mesh(new T.TorusGeometry(.075,.017,10,32),ctxM,head);rim.position.set(side*.118,.025,.269);rim.scale.set(1,.82,.75);
      tube(head,[[side*.05,.096,.27],[side*.12,.113,.27],[side*.21,.072,.23]],.021,ctxM,18);
      tube(head,[[side*.18,-.019,.254],[side*.24,-.045,.21],[side*.23,-.105,.14]],.025,ctxM,18);
      sphere(head,side*.08,-.104,.23,.07,.071,.065,ctxM);
    }
    const nose=plate(head,[[-.033,-.035],[.033,-.035],[.045,-.116],[0,-.14],[-.045,-.116]],.012,cavityM);nose.position.z=.286;
    tube(head,[[-.22,-.093,.07],[-.225,-.22,.13],[-.13,-.28,.235],[0,-.29,.27],[.13,-.28,.235],[.225,-.22,.13],[.22,-.093,.07]],.035,ctxM,36);
    tube(head,[[-.13,-.17,.25],[0,-.183,.286],[.13,-.17,.25]],.022,ctxM,20);
    for(let i=0;i<8;i++){
      const x=(i-3.5)*.029,z=.281-Math.abs(x)*.13;
      const upper=mesh(new T.BoxGeometry(.023,.032,.025),ctxM,head);upper.position.set(x,-.154,z);
      const lower=mesh(new T.BoxGeometry(.023,.026,.025),ctxM,head);lower.position.set(x,-.204,z+.002);
    }
    const legs=[];const femM=mat('femur'),footM=mat('foot');
    for(const s of [-1,1]){
      const root=new T.Group();root.position.set(s*.51,3.13,.01);model.add(root);
      const femur=new T.Group();root.add(femur);
      sphere(femur,0,0,0,.135,.135,.135,femM);
      between(femur,[s*.02,-.025,0],[s*.18,-.18,.015],.085,.10,femM);
      sphere(femur,s*.20,-.14,.018,.115,.17,.105,femM);sphere(femur,s*.12,-.30,-.035,.075,.085,.07,femM);
      sculptedShaft(femur,[[s*.18,-.20,.02],[s*.16,-.55,.085],[s*.13,-1.07,.06],[s*.10,-1.48,.005]],[.095,.064,.065,.105],femM);
      for(const a of [-1,1])sphere(femur,s*.10+a*.075,-1.51,.018,.078,.115,.095,femM);
      sphere(femur,s*.10,-1.48,.115,.080,.11,.035,ctxM);
      const shin=new T.Group();shin.position.set(s*.10,-1.63,0);root.add(shin);
      sphere(shin,0,0,0,.12,.075,.09,ctxM);sculptedShaft(shin,[[0,-.04,.02],[0,-.28,.055],[s*.012,-.76,.03],[0,-1.22,.015]],[.085,.065,.044,.058],ctxM);
      tube(shin,[[0,-.15,.08],[0,-.43,.065],[0,-.95,.055]],.018,ctxM,24);
      const fibula=between(shin,[s*.12,-.08,-.015],[s*.105,-1.27,.00],.025,.03,ctxM);
      sphere(shin,0,-1.24,.02,.075,.085,.075,ctxM);
      const foot=new T.Group();foot.position.set(0,-1.31,.04);shin.add(foot);
      // Seven individual tarsals, five metatarsals and fourteen phalanges.
      // The lofted tarsals have distinct tuberosities, necks and wedge profiles;
      // bone lengths stay fixed while the medial column articulates under load.
      const footBones=[];
      function tarsal(name,sections,x=0){
        const radial=16,positions=[],indices=[];
        for(const [z,y,rx,ry] of sections)for(let k=0;k<radial;k++){
          const a=k/radial*Math.PI*2,c=Math.cos(a),v=Math.sin(a);
          positions.push(x+Math.sign(c)*Math.pow(Math.abs(c),.76)*rx,y+Math.sign(v)*Math.pow(Math.abs(v),.85)*ry,z);
        }
        for(let i=0;i<sections.length-1;i++)for(let k=0;k<radial;k++){const j=(k+1)%radial,a=i*radial+k,b=i*radial+j,c=(i+1)*radial+k,d=(i+1)*radial+j;indices.push(a,b,c,b,d,c);}
        for(let k=1;k<radial-1;k++){indices.push(0,k+1,k);const b=(sections.length-1)*radial;indices.push(b,b+k,b+k+1);}
        const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
        const node=new T.Group();node.name=name;foot.add(node);mesh(g,footM,node);footBones.push(node);return node;
      }
      const calcaneus=tarsal('Calcaneus',[[-.235,-.018,.050,.052],[-.205,-.015,.079,.072],[-.13,-.009,.090,.079],[-.035,.013,.079,.068],[.030,.015,.066,.051],[.070,.002,.053,.038]]);
      const talus=tarsal('Talus',[[-.093,.071,.059,.046],[-.055,.080,.077,.052],[.005,.075,.073,.056],[.070,.044,.044,.037],[.112,.039,.053,.041]],-s*.012);
      const navicular=tarsal('Navicular',[[.108,.026,.059,.035],[.130,.035,.074,.042],[.158,.028,.066,.039],[.178,.022,.051,.031]],-s*.053);
      const cuboid=tarsal('Cuboid',[[.067,-.031,.034,.037],[.095,-.025,.043,.043],[.157,-.032,.045,.037],[.202,-.040,.035,.030]],s*.077);
      const mid=new T.Group();foot.add(mid);const cuneiforms=[];
      for(let j=0;j<3;j++){
        const x=-s*(.100-j*.052),y=.011-j*.012,z=.174-j*.005;
        const n=tarsal(['Medial cuneiform','Intermediate cuneiform','Lateral cuneiform'][j],[[z,y,.024,.030],[z+.025,y+.003,.029,.039],[z+.063,y-.007,.028,.031],[z+.079,y-.014,.025,.025]],x);
        mid.add(n);cuneiforms.push(n);
      }
      const rays=[],rayData=[];
      function longBone(parent,name,length,radius){
        const g=new T.Group();g.name=name;parent.add(g);
        sculptedShaft(g,[[0,0,0],[0,-length*.19,.004],[0,-length*.60,.009],[0,-length,0]],[radius*1.25,radius*.78,radius*.70,radius*1.10],footM);
        sphere(g,0,-length*.025,0,radius*1.33,radius*1.05,radius*1.15,footM);
        sphere(g,0,-length,0,radius*1.35,radius*1.10,radius*1.22,footM);
        footBones.push(g);return g;
      }
      for(let j=0;j<5;j++){
        const x=-s*(.103-j*.052),baseY=j<3?.004-j*.012:-.038,baseZ=.232-(j>2?(j-2)*.008:0),headY=-.046,headZ=.432-j*.014;
        const ray=new T.Group();mid.add(ray);rays.push(ray);
        const base=new T.Vector3(x,baseY,baseZ),head=new T.Vector3(x*1.25,headY,headZ),length=base.distanceTo(head),met=longBone(ray,'Metatarsal '+(j+1),length,j===0?.025:.018);
        const phalanges=[],lengths=j===0?[.066,.049]:[.047-j*.002,.032-j*.001,.028-j*.001];
        lengths.forEach((length,k)=>phalanges.push({node:longBone(ray,['Proximal','Middle','Distal'][j===0&&k===1?2:k]+' phalanx '+(j+1),length,j===0?.022-k*.003:.015-k*.002),length}));
        rayData.push({base,head,length,met,phalanges,index:j});
      }
      function poseFootArch(amount){
        // A positive amount models a lowering medial arch, mild abduction and
        // forefoot splay. A negative amount raises the arch. These are selected
        // loading examples, not a universal pressure or joint-angle prediction.
        navicular.position.set(s*amount*.006,-amount*.036,amount*.008);navicular.rotation.z=s*amount*.035;
        talus.position.set(s*amount*.004,-amount*.010,amount*.006);talus.rotation.y=-s*amount*.045;
        calcaneus.rotation.z=s*amount*.045;
        cuboid.position.y=-amount*.004;
        for(let j=0;j<3;j++){const n=cuneiforms[j];n.position.set(s*amount*.004,-amount*(.035-j*.009),amount*.011);n.rotation.x=-amount*(.035-j*.008);}
        for(const r of rayData){
          const j=r.index,medial=1-j/5,b=r.base.clone(),h=r.head.clone();
          b.y-=amount*.034*medial;b.z+=amount*.010;b.x+=s*amount*.004;
          h.x+=s*amount*(j-1.5)*.004;
          // Fixed-length metatarsal; flattening extends the arch forward.
          h.z=b.z+Math.sqrt(Math.max(.001,r.length*r.length-(h.x-b.x)**2-(h.y-b.y)**2));
          r.met.position.copy(b);r.met.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),h.clone().sub(b).normalize());
          const direction=new T.Vector3(j===0?-s*.018:s*(j-2)*.012,-.012,1).normalize(),at=h.clone().addScaledVector(direction,.013);
          for(const ph of r.phalanges){ph.node.position.copy(at);ph.node.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),direction);at.addScaledVector(direction,ph.length+.009);}
        }
      }
      poseFootArch(0);
      const femurMat=femM.clone(),shinMat=ctxM.clone(),footMat=footM.clone();
      femur.traverse(o=>{if(o.isMesh)o.material=femurMat;});shin.traverse(o=>{if(o.isMesh)o.material=shinMat;});foot.traverse(o=>{if(o.isMesh)o.material=footMat;});
      legs.push({side:s,root,femur,shin,fibula,foot,mid,rays,footBones,poseFootArch,navicular,baseX:s*.51,femurMat,shinMat,footMat});
    }
    function footWorldMinimum(l,updated=false){
      if(!updated)model.updateMatrixWorld(true);let min=Infinity;const v=new T.Vector3();
      l.foot.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)min=Math.min(min,v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).y);});return min;
    }
    window.azAttachAnatomyMeshes?.({THREE:T,pelvis,head,legs,materials:{bone:boneM,context:ctxM,pelvis:pelvicM},cervicalMeshes,mesh});
    // Place the front and back reference dots on the fitted iliac surfaces.
    for(const side of [-1,1]){
      const ilium=pelvis.getObjectByName('BodyParts3D '+(side<0?'rightHip':'leftHip'));
      for(const target of [new T.Vector3(side*.66,.27,.25),new T.Vector3(side*.21,.33,-.43)]){
        const points=ilium?.geometry.attributes.position;
        let best=Infinity;
        const position=target.clone(),sample=new T.Vector3();
        for(let i=0;i<(points?.count||0);i++){
          sample.fromBufferAttribute(points,i);
          const distance=sample.distanceToSquared(target);
          if(distance<best){best=distance;position.copy(sample);}
        }
        landmarks.push(sphere(pelvis,position.x,position.y,position.z,.032,.032,.032,landmarkM));
      }
    }
    const exerciseIds=new Set(['rdl','squat','press','row','pullup','dips','pushup','bench','lunge']);
    const exerciseArms=new T.Group();model.add(exerciseArms);
    const equipment=new T.Group();scene.add(equipment);
    const steel=new T.MeshStandardMaterial({color:0x58728b,roughness:.58,metalness:.16});
    const seatMat=new T.MeshStandardMaterial({color:0xabc0d3,roughness:.9});
    const studyPadMat=new T.MeshStandardMaterial({color:0x9db5ca,roughness:.86,transparent:true,opacity:.45,depthWrite:false,side:T.DoubleSide});studyPadMat.userData.azStudyAlpha=true;
    const studyRibMat=new T.MeshStandardMaterial({color:0xdcd9ce,roughness:.8,transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide});studyRibMat.userData.azStudyAlpha=true;
    const studyScapMat=new T.MeshStandardMaterial({color:0x7195b0,roughness:.76});
    const studyBenchScapMat=new T.MeshStandardMaterial({color:0x416f96,roughness:.76,transparent:true,opacity:1,depthWrite:false,side:T.DoubleSide});studyBenchScapMat.userData.azStudyAlpha=true;
    function studyMaterial(node,material,order=null){node.traverse(o=>{if(!o.isMesh)return;if(!o.userData.azOriginalMaterial)o.userData.azOriginalMaterial=o.material;if(o.userData.azOriginalRenderOrder===undefined)o.userData.azOriginalRenderOrder=o.renderOrder;o.material=material;if(order!==null)o.renderOrder=order;});}
    function restoreStudyMaterials(){for(const s of scapulae)s.node.traverse(o=>{if(o.isMesh&&o.userData.azOriginalMaterial){o.material=o.userData.azOriginalMaterial;o.renderOrder=o.userData.azOriginalRenderOrder;}});for(const r of ribs)r.traverse(o=>{if(o.isMesh&&o.userData.azOriginalMaterial){o.material=o.userData.azOriginalMaterial;o.renderOrder=o.userData.azOriginalRenderOrder;}});if(sternum.userData.azOriginalMaterial)sternum.material=sternum.userData.azOriginalMaterial;}
    function segment(material,radius,dual=false){
      const g=new T.Group();
      if(dual){between(g,[-.025,0,0],[-.02,-1,.015],radius*.65,radius*.7,material);between(g,[.025,0,0],[.025,-1,.025],radius*.54,radius*.6,material);}
      else{sculptedShaft(g,[[0,0,0],[.012,-.25,.025],[-.008,-.72,.01],[0,-1,0]],[radius*1.25,radius,radius*.86,radius*1.25],material);}
      sphere(g,0,0,0,radius*1.45,radius*1.25,radius*1.4,material);sphere(g,0,-1,0,radius*1.35,radius*1.2,radius*1.35,material);exerciseArms.add(g);return g;
    }
    const exArms=[];
    for(const side of [-1,1]){
      const upper=segment(boneM,.057),fore=segment(boneM,.045,true),clavicle=segment(ctxM,.038),hand=new T.Group();exerciseArms.add(hand);
      for(let j=0;j<5;j++){let x=(j-2)*.035;between(hand,[x,0,0],[x*1.1,-.15,.015],.014,.018,boneM);between(hand,[x*1.1,-.15,.015],[x*1.05,-.22,.045],.012,.014,boneM);between(hand,[x*1.05,-.22,.045],[x*.95,-.245,.08],.011,.012,boneM);}
      exArms.push({side,upper,fore,hand,clavicle});
    }
    const fitShoulderGirdle=window.azAttachUpperSkeleton?.({
      T, torso, head, sternum, ribs, scapulae, arms, exArms, exerciseArms, legs, spineGroups, cervicalMeshes,
      boneMaterial:boneM, contextMaterial:ctxM, scapulaMaterial:mat('scapula')
    });
    function box(parent,size,pos,material){const m=mesh(new T.BoxGeometry(...size),material,parent);m.position.set(...pos);return m;}
    const barbell=new T.Group();equipment.add(barbell);between(barbell,[-1.6,0,0],[1.6,0,0],.035,.035,steel);
    for(const side of [-1,1]){const p=mesh(new T.CylinderGeometry(.26,.26,.12,24),steel,barbell);p.rotation.z=Math.PI/2;p.position.x=side*1.55;}
    const dumbbellHeads=new T.MeshStandardMaterial({color:0x304b65,roughness:.62,metalness:.12});
    const dumbbells=[];for(const side of [-1,1]){const g=new T.Group();equipment.add(g);between(g,[-.38,0,0],[.38,0,0],.043,.043,steel);for(const x of [-.32,.32]){const w=mesh(new T.CylinderGeometry(.205,.205,.18,6),dumbbellHeads,g);w.rotation.z=Math.PI/2;w.position.x=x;}dumbbells.push({side,node:g});}
    const seat=new T.Group();equipment.add(seat);box(seat,[1.72,.15,1.0],[0,1.65,-.08],seatMat);for(const side of [-1,1])between(seat,[side*.65,1.57,-.15],[side*.65,.05,-.15],.045,.045,steel);
    const pressChair=new T.Group();equipment.add(pressChair);box(pressChair,[1.72,.15,1.30],[0,1.65,-.23],studyPadMat);for(const side of [-1,1])between(pressChair,[side*.65,1.57,-.15],[side*.65,.05,-.15],.045,.045,steel);
    const pressBackrest=new T.Group();pressChair.add(pressBackrest);box(pressBackrest,[1.60,3.10,.16],[0,0,0],studyPadMat);for(const side of [-1,1])between(pressBackrest,[side*.57,-1.45,-.13],[side*.57,1.35,-.13],.034,.034,steel);pressBackrest.rotation.x=-12*Math.PI/180;pressBackrest.position.set(0,3.25,-.90);
    const footrest=box(equipment,[1.7,.12,.9],[0,.52,1.42],seatMat);
    const rowHandle=new T.Group();equipment.add(rowHandle);between(rowHandle,[-1.15,0,0],[1.15,0,0],.035,.035,steel);
    const cable=mesh(new T.CylinderGeometry(.011,.011,1,8),steel,equipment);
    const pullBar=new T.Group();equipment.add(pullBar);between(pullBar,[-1.62,0,0],[1.62,0,0],.038,.038,steel);pullBar.position.set(0,8.16,.12);
    const pullGrip=side=>pullBar.position.clone().add(new T.Vector3(side*1.20,0,0));
    const dipBars=new T.Group();equipment.add(dipBars);for(const side of [-1,1]){between(dipBars,[side*1.1,3.9,-.85],[side*1.1,3.9,.90],.045,.045,steel);between(dipBars,[side*1.1,.08,-.75],[side*1.1,3.9,-.75],.045,.045,steel);between(dipBars,[side*1.1,.08,-1.10],[side*1.1,.08,.75],.045,.045,steel);}
    const flatBench=new T.Group();equipment.add(flatBench);box(flatBench,[1.68,.18,4.85],[0,.98,-1.03],studyPadMat);for(const z of [-2.70,.65]){between(flatBench,[0,.89,z],[0,.12,z],.065,.065,steel);between(flatBench,[-.85,.10,z],[.85,.10,z],.055,.055,steel);}
    const benchBar=new T.Group();equipment.add(benchBar);between(benchBar,[-2.45,0,0],[2.45,0,0],.042,.042,steel);for(const side of [-1,1]){const p=mesh(new T.CylinderGeometry(.30,.30,.16,24),steel,benchBar);p.rotation.z=Math.PI/2;p.position.x=side*2.12;}
    let exerciseDebug=null;
    function twoJoint(A,B,L1,L2,bend){const delta=B.clone().sub(A),realD=delta.length(),d=Math.max(.001,Math.min(L1+L2-.0001,realD)),axis=delta.normalize();const x=(L1*L1-L2*L2+d*d)/(2*d),r=Math.sqrt(Math.max(0,L1*L1-x*x)),v=bend.clone().addScaledVector(axis,-bend.dot(axis)).normalize();return A.clone().addScaledVector(axis,x).addScaledVector(v,r);}
    function poseSegment(group,A,B){const v=B.clone().sub(A);group.position.copy(A);group.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),v.clone().normalize());group.scale.set(1,v.length(),1);}
    function poseHand(arm,wrist,direction,contact=null){
      arm.hand.position.copy(wrist);
      arm.hand.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),direction);
      arm.contact=contact;
    }
    function supportedFoot(l,x,z,pitch=0,yaw=0,surface=.08,toeExtension=0){
      const quaternion=new T.Quaternion().setFromEuler(new T.Euler(pitch,yaw,0,'XYZ'));
      if(toeExtension)l.poseToes?.(toeExtension);
      const vertices=tensionFootPoints(l,Boolean(toeExtension)),projected=new T.Vector3();
      let minY=Infinity,minPoint;
      for(const vertex of vertices){
        projected.copy(vertex).applyQuaternion(quaternion);
        if(projected.y<minY){minY=projected.y;minPoint=projected.clone();}
      }
      const ankle=new T.Vector3(x,surface-minY,z);
      return {quaternion,ankle,contact:minPoint.add(ankle)};
    }
    // Move the shoulder center with the clavicular arc before solving the arm.
    // Elevation and reaching are measured in the local thoracic frame.
    function shoulderPoint(turn,side,elevation=0,reach=0){
      const span=.96,across=span*Math.cos(elevation),forward=across*Math.sin(reach);
      const shoulder=turn([side*(.08+across*Math.cos(reach)),2.25,.02]);
      if(elevation||reach){
        const origin=turn([0,2.25,.02]);
        const up=turn([0,2.26,.02]).sub(origin).normalize();
        const front=turn([0,2.25,1.02]).sub(origin).normalize();
        shoulder.addScaledVector(up,span*Math.sin(elevation)).addScaledVector(front,forward);
      }
      return shoulder;
    }
    const pushBottomAngles=new Map();
    function poseHorizontalExercise(phase){
      const m=state.movement,b=state.scenario==='b',push=m==='pushup',smooth=(lo,hi,x)=>{const v=T.MathUtils.clamp((x-lo)/(hi-lo),0,1);return v*v*(3-2*v);};
      exerciseArms.visible=true;equipment.visible=true;equipment.children.forEach(o=>o.visible=false);flatBench.visible=!push;benchBar.visible=!push;floor.visible=true;floor.scale.set(2.1,3.5,1);
      const pro=push?(b?.18+.64*Math.pow(1-phase,2):.08):b?-.64+.025*Math.sin(Math.PI*phase):-.12;
      const bow=(r,lo,hi)=>r<=lo||r>=hi?0:Math.pow(Math.sin(Math.PI*(r-lo)/(hi-lo)),2);
      let delta=.33,origin,U,F,baseAngle,benchLift=0,shapePhase=phase;
      const anchor=push?supportedFoot(legs[0],0,-2.65,.92,0,.08,.85).ankle:new T.Vector3();
      function setFrame(d){delta=d;U=new T.Vector3(0,Math.sin(d),Math.cos(d));F=new T.Vector3(0,-Math.cos(d),Math.sin(d));origin=anchor.clone().addScaledVector(U,3.08);baseAngle=Math.PI/2-d;}
      // The atlas shoulder blades are deeper than the original schematic
      // surfaces. Raise the upper back to the pad, tapering into the neck.
      const bladeSupport=fitShoulderGirdle ? (b?.182:.168) : 0;
      const spineOffset=r=>-.14+.035*Math.sin(r/2.5*Math.PI*2)+(push?-(b?.055*Math.pow(1-shapePhase,2):0)*bow(r,.9,2.60)-(b?.035:0)*bow(r,.12,1.25):(b?.31:.025)*bow(r,.12,1.65)-((b?.18:.13)+benchLift)*smooth(.10,1.80,r)+bladeSupport*smooth(.20,1.80,r)*(1-smooth(2.45,3.00,r)));
      const centreAt=r=>origin.clone().addScaledVector(U,r).addScaledVector(F,spineOffset(r));
      const angleAt=r=>{const d=centreAt(r+.008).sub(centreAt(Math.max(0,r-.008)));return Math.atan2(d.z,d.y);};
      const turn=p=>centreAt(p[1]).add(new T.Vector3(p[0],0,p[2]+.14).applyAxisAngle(new T.Vector3(1,0,0),angleAt(p[1])));
      const pushWristZ=1.94, pushHandX=1.20;
      function placeChest(){
        const torsoAngle=angleAt(1.85);
        torso.position.copy(turn([0,1.42,0]));torso.rotation.set(torsoAngle,0,0);
        torso.updateMatrixWorld(true);
        for(let i=0;i<ribs.length;i++){
          const rib=ribs[i],level=2.35-Math.floor(i/2)*.132;
          rib.position.copy(torso.worldToLocal(centreAt(level)));
          rib.rotation.set(angleAt(level)-torsoAngle,0,0);rib.scale.set(1,1,1);
        }
        sternum.position.copy(sternumRest);
      }
      if(push){
        if(!pushBottomAngles.has(b)){
          // A level reference pose gives the pitch at which each point on the
          // actual rib cage would touch the floor when pivoting about the toes.
          shapePhase=1;setFrame(0);placeChest();fitCostalCartilage?.();torso.updateMatrixWorld(true);
          const point=new T.Vector3();let bottom=-Math.PI/2;
          for(const group of [...ribs,sternum])group.traverse(mesh=>{
            if(!mesh.isMesh)return;
            const positions=mesh.geometry.attributes.position;
            for(let i=0;i<positions.count;i++){
              point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).sub(anchor);
              const radius=Math.hypot(point.y,point.z);
              const angle=Math.asin((floor.position.y-anchor.y)/radius)-Math.atan2(point.y,point.z);
              bottom=Math.max(bottom,angle);
            }
            const rest=mesh.userData.azRestPositions;
            if(rest)positions.array.set(rest);
          });
          pushBottomAngles.set(b,bottom);
        }
        // Derive lockout from the fixed palm position and both arm lengths.
        // Interpolate toward chest contact through the full descent.
        shapePhase=0;
        const palmContact=new T.Vector3(pushHandX,.08,pushWristZ+.17);
        const pivot=fitShoulderGirdle?.floorPivot(1,palmContact)||new T.Vector3(pushHandX,.12,pushWristZ);
        const foreReach=.98+(fitShoulderGirdle?.capitateDepth||0);
        const topReach=Math.sqrt(1.08**2+foreReach**2-2*1.08*foreReach*Math.cos(175*Math.PI/180));
        let lo=0,hi=.55;
        for(let i=0;i<23;i++){
          setFrame((lo+hi)/2);
          const S=shoulderPoint(turn,1,0,(b?.82:.08)*.30);
          if(S.distanceTo(pivot)>topReach)hi=delta;else lo=delta;
        }
        shapePhase=phase;
        const descent=phase*phase*(3-2*phase);
        setFrame(T.MathUtils.lerp((lo+hi)/2,pushBottomAngles.get(b),descent));
      }else{origin=new T.Vector3(0,b?1.61:1.56,0);U=new T.Vector3(0,0,-1);F=new T.Vector3(0,1,0);baseAngle=-Math.PI/2;}
      const pelvisPitch=baseAngle+(push?(b?-.28:0):(b?.30:0));pelvis.position.copy(origin);pelvis.rotation.set(pelvisPitch,0,0);pelvis.updateMatrixWorld(true);
      if(!push){benchLift=1.07-new T.Box3().setFromObject(pelvis,true).min.y;origin.y+=benchLift;pelvis.position.copy(origin);pelvis.updateMatrixWorld(true);}
      placeChest();const torsoAngle=angleAt(1.85);head.position.copy(turn([0,2.95,-.08]));if(!push)head.position.y+=.12+(fitShoulderGirdle ? .008 : 0);head.rotation.set(angleAt(2.95),0,0);
      spineGroups.forEach(v=>{const r=v.y-3.3;v.node.position.copy(centreAt(r));v.node.rotation.set(angleAt(r),0,0);v.node.visible=true;});spineGuide.visible=false;torso.visible=true;head.visible=true;pelvis.visible=true;arms.forEach(a=>a.node.visible=false);torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=false;});
      for(const s of scapulae){const level=1.95,theta=angleAt(level),offset=new T.Vector3(s.side*(.64+.16*pro),0,-.20+.25*pro).applyAxisAngle(new T.Vector3(1,0,0),theta);s.node.position.copy(torso.worldToLocal(centreAt(level).add(offset)));s.node.rotation.set(theta-torsoAngle,-s.side*(.20+.63*pro),0);s.node.visible=true;}
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),legChecks=[];
      for(const l of legs){
        const foot=supportedFoot(l,l.side*(push?.61:.72),push?-2.65:b?1.60:2.00,push?.92:0,0,.08,push?.85:0);
        const H=pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005)),A=foot.ankle;
        const K=twoJoint(H,A,L1,L2,push?new T.Vector3(0,-1,0):new T.Vector3(0,1,.10)),fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(new T.Vector3(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,fd.length()/L1,1);l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(new T.Vector3(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,sd.length()/L2,1);l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(foot.quaternion);l.foot.scale.y=L2/sd.length();l.root.visible=true;l.femur.visible=true;l.shin.visible=true;l.foot.visible=true;l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(!push&&b?(state.ascending?0x709dbf:0x9bb5c9):palettes.ivory);legChecks.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),footContact:foot.contact.toArray()});
      }
      model.updateMatrixWorld(true);const armChecks=[];
      for(const arm of exArms){
        const side=arm.side,desired=shoulderPoint(turn,side,0,pro*.30);
        const S=push||!fitShoulderGirdle?desired:torso.localToWorld(fitShoulderGirdle.socketOnCage(side,desired));
        let E,W,G,handDirection;
        poseSegment(arm.clavicle,turn([0,2.40,.30]),S);
        if(push){G=new T.Vector3(side*pushHandX,.12,pushWristZ+.17);W=G.clone().add(new T.Vector3(0,0,-.17));E=twoJoint(S,W,1.08,.98,new T.Vector3(side*.60,0,-1));handDirection=new T.Vector3(0,0,1);}
        else{const descent=phase*(.82+.18*phase);G=new T.Vector3(side*1.65,S.y+2.107-1.427*descent,S.z+.52*descent);W=G.clone().add(new T.Vector3(0,-.17,0));E=twoJoint(S,W,1.08,.98,new T.Vector3(side,-.50,.60));handDirection=new T.Vector3(0,1,0);}
        poseSegment(arm.upper,S,E);poseSegment(arm.fore,E,W);poseHand(arm,W,handDirection,G);
        const u=E.clone().sub(S).normalize(),v=W.clone().sub(E).normalize(),elbowAngle=T.MathUtils.radToDeg(Math.acos(T.MathUtils.clamp(-u.dot(v),-1,1)));armChecks.push({side,shoulder:S.toArray(),elbow:E.toArray(),wrist:W.toArray(),grip:G.toArray(),upperLength:S.distanceTo(E),foreLength:E.distanceTo(W),elbowAngle});
      }
      let bar=null;if(!push){bar=new T.Vector3().fromArray(armChecks[0].grip).add(new T.Vector3().fromArray(armChecks[1].grip)).multiplyScalar(.5);benchBar.position.copy(bar);}
      for(const key in regionMaterials)regionMaterials[key].color.setHex(key==='context'?palettes.context:palettes.ivory);if(!push&&b){for(const s of scapulae)studyMaterial(s.node,studyBenchScapMat,50);for(const r of ribs)studyMaterial(r,studyRibMat);if(!sternum.userData.azOriginalMaterial)sternum.userData.azOriginalMaterial=sternum.material;sternum.material=studyRibMat;}landmarks.forEach(x=>x.visible=false);ghost.visible=false;model.updateMatrixWorld(true);
      const contacts=push?{hands:armChecks.map(a=>a.grip),toes:legChecks.map(l=>l.footContact),floorHeight:.08}:{head:[0,new T.Box3().setFromObject(head,true).min.y,head.position.z],upperBack:turn([0,2.10,-.36-bladeSupport]).toArray(),butt:[0,new T.Box3().setFromObject(pelvis,true).min.y,pelvis.position.z],feet:legChecks.map(l=>l.footContact),padHeight:1.07,floorHeight:.08};
      exerciseDebug={movement:m,scenario:state.scenario||'a',phase,pelvisPitch,relativePelvisTilt:push?(b?-.28:0):(b?.30:0),protraction:pro,headPitch:angleAt(2.95),spine:[.25,.70,1.20,1.75,2.25,2.60].map(r=>centreAt(r).toArray()),legs:legChecks,arms:armChecks,bar:bar?bar.toArray():null,contacts,legDriveCue:!push&&b&&Boolean(state.ascending),support:{padOpacity:studyPadMat.opacity,ribOpacity:!push&&b?studyRibMat.opacity:1,scapulaeHighlighted:!push&&b}};
    }
    function poseLunge(phase){
      const rear=state.scenario==='b',loadedSide=rear?1:-1,floorY=.08,frontHipHike=!rear&&Boolean(state.frontHipHike);
      const hipY=2.72-.75*phase,hipZ=(rear?-.30-.45*phase:.28+.42*phase)+(frontHipHike?.18+.04*phase:0),hipX=(rear?.045:-.045)+(frontHipHike?-.08-.02*phase:0);
      const pelvicRoll=frontHipHike?-.16-.04*phase:(rear?.080:-.100)*(.70+.30*phase),pelvicYaw=(rear?.10:-.10)*(.75+.25*phase),pelvicPitch=.025;
      const trunkPitch=(rear?-.025-.025*phase:.055+.115*phase)+(frontHipHike?.018+.018*phase:0);
      const frameQ=new T.Quaternion().setFromEuler(new T.Euler(trunkPitch,pelvicYaw*.5,pelvicRoll*.25,'XYZ'));
      const origin=new T.Vector3(hipX,hipY,hipZ);
      const centreAt=r=>new T.Vector3(0,r,-.14+.035*Math.sin(r/2.5*Math.PI*2)).applyQuaternion(frameQ).add(origin);
      const turn=p=>centreAt(p[1]).add(new T.Vector3(p[0],0,p[2]+.14).applyQuaternion(frameQ));
      exerciseArms.visible=true;equipment.visible=false;floor.visible=true;floor.scale.set(1.8,2.0,1);
      pelvis.position.copy(origin);pelvis.rotation.set(pelvicPitch,pelvicYaw,pelvicRoll);pelvis.updateMatrixWorld(true);
      torso.position.copy(turn([0,1.42,0]));torso.quaternion.copy(frameQ);torso.updateMatrixWorld(true);
      head.position.copy(turn([0,2.95,-.08]));head.quaternion.copy(frameQ);
      for(const v of spineGroups){v.node.position.copy(centreAt(v.y-3.3));v.node.quaternion.copy(frameQ);v.node.visible=true;}
      spineGuide.visible=false;torso.visible=true;head.visible=true;pelvis.visible=true;arms.forEach(a=>a.node.visible=false);torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=false;});
      for(let i=0;i<ribs.length;i++){const r=ribs[i],level=2.35-Math.floor(i/2)*.132;r.position.copy(torso.worldToLocal(centreAt(level)));r.rotation.set(0,0,0);r.scale.set(1,1,1);}
      sternum.position.copy(sternumRest);
      for(const s of scapulae){s.node.position.set(s.side*.65,.53,-.34);s.node.rotation.set(0,-s.side*.24,0);s.node.visible=true;}
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),legChecks=[];
      for(const l of legs){
        const front=l.side===-1,theta=front?0:rear?1.13-.10*phase:.90+.14*phase;
        if(!front)l.poseToes?.(theta*.88);
        const footQ=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),theta);
        const rest=tensionFootPoints(l,!front),points=rest.map(p=>p.clone().applyQuaternion(footQ));
        let minY=Infinity,maxZ=-Infinity;for(const p of points){minY=Math.min(minY,p.y);maxZ=Math.max(maxZ,p.z);}
        const A=new T.Vector3(l.side*.60,floorY-minY,front?1.18:-.94-maxZ),H=pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005));
        const bend=new T.Vector3(l.side===loadedSide?-l.side*.04:0,0,1),K=twoJoint(H,A,L1,L2,bend),fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(new T.Vector3(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,fd.length()/L1,1);
        l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(new T.Vector3(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,sd.length()/L2,1);
        l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(footQ);l.foot.scale.y=L2/sd.length();
        l.root.visible=true;l.femur.visible=true;l.shin.visible=true;l.foot.visible=true;l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(l.side===loadedSide?0x7ea8c4:palettes.ivory);
        let heel=Infinity,toe=Infinity;for(let i=0;i<points.length;i++){if(rest[i].z<.08)heel=Math.min(heel,points[i].y+A.y);if(rest[i].z>.40)toe=Math.min(toe,points[i].y+A.y);}
        legChecks.push({side:l.side,reference:front?'Right Front':'Left Rear',loaded:l.side===loadedSide,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),heelHeight:heel,toeHeight:toe,footMinHeight:minY+A.y,footPitch:theta,frontToeZ:front?maxZ+A.z:null,rearToeZ:front?null:maxZ+A.z});
      }
      model.updateMatrixWorld(true);const armChecks=[];
      for(const arm of exArms){
        const side=arm.side,S=turn([side*1.04,2.25,.02]),u=new T.Vector3(side*.065,-1,.055).normalize().applyQuaternion(frameQ),v=new T.Vector3(side*.020,-1,.11).normalize().applyQuaternion(frameQ);
        const E=S.clone().addScaledVector(u,1.08),W=E.clone().addScaledVector(v,.98),G=W.clone().addScaledVector(v,.17);
        poseSegment(arm.clavicle,turn([0,2.40,.30]),S);poseSegment(arm.upper,S,E);poseSegment(arm.fore,E,W);poseHand(arm,W,v);
        armChecks.push({side,shoulder:S.toArray(),elbow:E.toArray(),wrist:W.toArray(),grip:G.toArray(),upperLength:S.distanceTo(E),foreLength:E.distanceTo(W)});
      }
      for(const key in regionMaterials)regionMaterials[key].color.setHex(key==='context'?palettes.context:palettes.ivory);pelvicM.color.setHex(0x91adc6);
      landmarks.forEach(x=>x.visible=false);ghost.visible=false;model.updateMatrixWorld(true);
      exerciseDebug={movement:'lunge',scenario:state.scenario||'a',phase,frontHipHike,frontSide:'right',rearSide:'left',loadedSide:rear?'left rear':'right front',pelvisPitch:pelvicPitch,pelvicRoll,pelvicYaw,pelvisPosition:origin.toArray(),headPitch:trunkPitch,legs:legChecks,arms:armChecks,bar:null,contacts:{floorHeight:floorY,rightFront:legChecks.find(l=>l.side===-1),leftRear:legChecks.find(l=>l.side===1)},support:{rearHeelChosen:rear?'Heel lowers within this selected stance':'Rear heel raised',pressureCue:'Selected support foot; no force values calculated'}};
    }

    function poseExercise(t){
      const m=state.movement,b=state.scenario==='b',phase=Math.max(0,Math.min(1,t));
      if(m==='lunge'){poseLunge(phase);return;}
      if(m==='pushup'||m==='bench'){poseHorizontalExercise(phase);return;}
      const smooth=(lo,hi,x)=>{const v=Math.max(0,Math.min(1,(x-lo)/(hi-lo)));return v*v*(3-2*v);};
      exerciseArms.visible=true;equipment.visible=true;equipment.children.forEach(o=>o.visible=false);
      let hipY=3.27,hipZ=0,basePitch=0,pelvisPitch=0,lumbar=0,thoracic=0,cervical=0,rearShift=0,expansion=0,pro=0,bodyLift=0,feetY=.19,feetZ=.045;
      const late=smooth(.64,1,phase);
      if(m==='rdl'){
        hipY=3.27-(b?.70:.55)*phase;hipZ=-(b?1.27:1.18)*phase;basePitch=(b?.90:1.12)*phase;pelvisPitch=basePitch*(b?.65:.78);
        lumbar=b?.26*smooth(.24,1,phase):0;thoracic=b?.28*smooth(.42,1,phase):0;cervical=b?.20*smooth(.62,1,phase):0;
        pro=b?.68*smooth(.25,1,phase):.025;
        floor.visible=true;floor.scale.set(1.6,1.35,1);
      }
      if(m==='squat'){
        hipY=3.25-(b?2.20:2.25)*phase;hipZ=-.10-(b?.55:.46)*phase;basePitch=b?.24+.18*phase:.12+.35*phase;
        pelvisPitch=b?.30-.61*late:.045-.11*phase;
        lumbar=b?-.30+.64*smooth(.60,1,phase):-.025;
        thoracic=b?-.02+.15*smooth(.71,1,phase):0;
        floor.visible=true;floor.scale.set(1.65,1.20,1);floorRing.visible=false;
      }
      if(m==='press'||m==='row'){
        hipY=2.24;hipZ=m==='press'?(b?.343:.052):-.08;pelvisPitch=b?-.28:.095;basePitch=b?0:.04;lumbar=b?.10:-.025;thoracic=b?.08:.015;rearShift=b?-.18:0;expansion=b?.16:.015;
        pro=m==='row'?(b?.86:.45)*(1-phase)+(b?.16:-.08*phase):b?.36+.10*phase:.035;
        feetY=b?.67:.19;feetZ=1.40;seat.visible=true;footrest.visible=b;
      }
      if(m==='press'){basePitch=b?-.29:-.18;seat.visible=false;pressChair.visible=true;}
      if(m==='dips'){
        hipY=3.83-1.02*phase+(b?.036:.063)*Math.pow(1-phase,2);hipZ=.42*phase;pelvisPitch=.015;basePitch=.025+.045*phase;
        lumbar=b?.015+.035*phase:0;thoracic=b?-.12+.43*phase:0;pro=b?.03+.16*phase:.03;
        dipBars.visible=true;floor.visible=true;floor.scale.set(2.05,1.75,1);
      }
      if(m==='pullup'){
        bodyLift=1.67*phase;hipY=3.27+bodyLift;hipZ=b?-.06-.10*phase:0;pelvisPitch=0;basePitch=0;
        thoracic=b?-.25*(.90+.10*phase):0;cervical=b?.08*(1-.40*phase):0;rearShift=b?-.05-.05*phase:0;pro=-.10*phase;pullBar.visible=true;
      }
      pelvis.position.set(0,hipY,hipZ);pelvis.rotation.set(pelvisPitch,0,0);pelvis.updateMatrixWorld(true);
      if(m==='press'||m==='row'){
        // Seat the ischial surfaces above the pad at each starting tilt.
        // Both press setups use a fixed fore/aft position fitted to the backrest.
        hipY+=1.725+.008-new T.Box3().setFromObject(pelvis,true).min.y;
        pelvis.position.y=hipY;pelvis.updateMatrixWorld(true);
      }
      // Regional sagittal articulation. The trunk follows a continuous centreline,
      // while lumbar, thoracic and cervical contributions remain distinguishable.
      const nominalAngle=r=>basePitch+lumbar*smooth(.12,1.25,r)+thoracic*smooth(1.0,2.30,r)+cervical*smooth(2.40,2.95,r);
      const bow=(r,lo,hi)=>r<=lo||r>=hi?0:Math.pow(Math.sin(Math.PI*(r-lo)/(hi-lo)),2);
      const centreAt=r=>{
        const steps=28,step=r/steps,v=new T.Vector3(0,hipY,hipZ-.14);
        for(let i=0;i<steps;i++){const a=nominalAngle((i+.5)*step);v.y+=Math.cos(a)*step;v.z+=Math.sin(a)*step;}
        v.z+=.045*Math.sin(r/2.5*Math.PI*2)-lumbar*.28*bow(r,.10,1.45)-thoracic*.30*bow(r,.95,2.55)+rearShift*smooth(.8,1.9,r);
        return v;
      };
      const angleAt=r=>{const d=centreAt(r+.008).sub(centreAt(Math.max(0,r-.008)));return Math.atan2(d.z,d.y);};
      const turn=p=>centreAt(p[1]).add(new T.Vector3(p[0],0,p[2]+.14).applyAxisAngle(new T.Vector3(1,0,0),angleAt(p[1])));
      const armFrame=r=>{const theta=angleAt(r);return {up:new T.Vector3(0,Math.cos(theta),Math.sin(theta)),forward:new T.Vector3(0,-Math.sin(theta),Math.cos(theta))};};
      const elevationArc=m==='press'?.20*phase:m==='pullup'?.18*(1-phase):0;
      const reachArc=m==='row'?.29*(1-phase)-.075*phase:m==='press'?.07*phase:0;
      const sockets=new Map();
      const shoulderAt=side=>sockets.has(side)?torso.localToWorld(sockets.get(side).clone()):shoulderPoint(turn,side,elevationArc,reachArc);
      const explicitPullVectors=side=>{
        const frame=armFrame(2.25),elevation=(170-140*phase)*Math.PI/180,lateral=side*(.06+.06*phase),front=Math.sqrt(Math.max(0,Math.pow(Math.sin(elevation),2)-lateral*lateral));
        const upper=frame.up.clone().multiplyScalar(-Math.cos(elevation)).addScaledVector(frame.forward,front);upper.x=lateral;
        const fx=(side*1.20-shoulderAt(side).x-1.08*lateral)/1.15,fz=(b?.25:.03)*(1-phase)+.40*phase,fy=Math.sqrt(Math.max(.01,1-fx*fx-fz*fz));
        const fore=frame.up.clone().multiplyScalar(fy).addScaledVector(frame.forward,fz);fore.x=fx;
        return {upper:upper.normalize(),fore:fore.normalize()};
      };
      if(m==='pullup'){
        // Fixed hands and a prescribed humeral descent determine body travel.
        // This prevents an overhead upper arm merely folding at the elbow.
        const vectors=explicitPullVectors(1),G=pullGrip(1),desired=G.clone().addScaledVector(vectors.upper,-1.08).addScaledVector(vectors.fore,-1.11),current=shoulderAt(1);
        hipY+=desired.y-current.y;hipZ+=desired.z-current.z;bodyLift=hipY-3.27;pelvis.position.set(0,hipY,hipZ);pelvis.updateMatrixWorld(true);
      }
      const torsoAngle=angleAt(1.85);
      torso.position.copy(turn([0,1.42,0]));torso.rotation.set(torsoAngle,0,0);torso.updateMatrixWorld(true);
      head.position.copy(turn([0,2.95,-.08]));head.rotation.set(angleAt(2.95),0,0);
      for(const v of spineGroups){const r=v.y-3.3;v.node.position.copy(centreAt(r));v.node.rotation.set(angleAt(r),0,0);v.node.visible=true;}
      spineGuide.visible=false;torso.visible=true;head.visible=true;pelvis.visible=true;
      arms.forEach(a=>a.node.visible=false);torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=false;});
      // Rib attachments follow the vertebral curve rather than one rigid chest tilt.
      for(let i=0;i<ribs.length;i++){
        const r=ribs[i],level=2.35-Math.floor(i/2)*.132;
        r.position.copy(torso.worldToLocal(centreAt(level)));r.rotation.x=angleAt(level)-torsoAngle;r.scale.set(1,1,1);
        for(const child of r.children){if(!child.isMesh)continue;const attr=child.geometry.attributes.position,rest=child.userData.azRestPositions||(child.userData.azRestPositions=Array.from(attr.array));if(!child.userData.azRestNormals)child.userData.azRestNormals=Array.from(child.geometry.attributes.normal.array);
          for(let j=0;j<attr.count;j++){const x=rest[j*3],y=rest[j*3+1],z=rest[j*3+2],back=(1-smooth(.08,.38,z))*smooth(.10,.35,Math.abs(x));attr.setXYZ(j,x*(1+expansion*.24*back),y,z-expansion*back);}
          attr.needsUpdate=true;child.geometry.computeVertexNormals();
        }
      }
      sternum.position.copy(sternumRest);sternum.position.z+=expansion*.08;
      if(m==='pullup'&&b){sternum.position.y+=.05*(1-.20*phase);sternum.position.z+=.035;}
      for(const s of scapulae){
        const level=1.95,theta=angleAt(level),offset=new T.Vector3(s.side*(.64+.14*pro),0,-.20+.23*pro-expansion*.55).applyAxisAngle(new T.Vector3(1,0,0),theta);
        s.node.position.copy(torso.worldToLocal(centreAt(level).add(offset)));s.node.visible=true;
        s.node.rotation.set(theta-torsoAngle,-s.side*(.20+.58*pro),0);
        if(m==='press'){s.node.rotation.z=s.side*(.08+.55*phase);s.node.rotation.x-=.075*phase;}
        if(m==='pullup'){s.node.rotation.z=s.side*(.08+.48*(1-phase));s.node.position.y+=.10*(1-phase);}
      }
      if((m==='press'||m==='pullup')&&fitShoulderGirdle?.socketOnCage){
        for(const arm of exArms)sockets.set(arm.side,fitShoulderGirdle.socketOnCage(arm.side,shoulderAt(arm.side)));
        if(m==='pullup'){
          const vectors=explicitPullVectors(1),offset=pullGrip(1)
            .addScaledVector(vectors.upper,-1.08).addScaledVector(vectors.fore,-1.11).sub(shoulderAt(1));
          offset.x=0;hipY+=offset.y;hipZ+=offset.z;bodyLift+=offset.y;
          for(const node of [pelvis,torso,head,...spineGroups.map(v=>v.node)])node.position.add(offset);
          model.updateMatrixWorld(true);
        }
      }
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),legChecks=[];
      const squatToeAngle=10*Math.PI/180;
      function squatKnee(H,A,side){
        const delta=A.clone().sub(H),distance=delta.length(),axis=delta.normalize(),along=(L1*L1-L2*L2+distance*distance)/(2*distance),radius=Math.sqrt(Math.max(0,L1*L1-along*along)),centre=H.clone().addScaledVector(axis,along);
        // Intersect the limb-length circle with the vertical plane of the toes.
        const normal=new T.Vector3(Math.cos(side*squatToeAngle),0,-Math.sin(side*squatToeAngle)),across=normal.clone().addScaledVector(axis,-normal.dot(axis)),n=across.length();
        if(radius<.00001||n<.00001)return twoJoint(H,A,L1,L2,new T.Vector3(side*.20,0,1));
        across.divideScalar(n);const component=normal.dot(A.clone().sub(centre))/(radius*n);
        if(Math.abs(component)>1)return twoJoint(H,A,L1,L2,new T.Vector3(side*.20,0,1));
        const forward=new T.Vector3().crossVectors(axis,across).normalize();if(forward.z<0)forward.negate();
        return centre.addScaledVector(across,radius*component).addScaledVector(forward,radius*Math.sqrt(Math.max(0,1-component*component)));
      }
      for(const l of legs){
        const H=pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005));
        const planted=m==='squat'?supportedFoot(l,l.side*.78,.045,0,l.side*squatToeAngle):['rdl','press','row'].includes(m)?supportedFoot(l,l.side*.61,feetZ,0,0,(m==='press'||m==='row')&&b?.58:.08):null;
        const A=planted?planted.ankle:m==='pullup'?new T.Vector3(l.side*.61,.19+bodyLift,hipZ+.045):m==='dips'?new T.Vector3(l.side*.61,1.75-.40*phase,-.72):new T.Vector3(l.side*.61,feetY,feetZ);
        const K=m==='squat'?squatKnee(H,A,l.side):twoJoint(H,A,L1,L2,new T.Vector3(0,0,1)),fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(new T.Vector3(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,fd.length()/L1,1);
        l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(new T.Vector3(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,sd.length()/L2,1);
        l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert();if(planted)l.foot.quaternion.multiply(planted.quaternion);
        else if(m==='dips'||m==='pullup')l.foot.rotation.set(.22,0,0);
        l.foot.scale.y=L2/sd.length();
        l.root.visible=true;l.femur.visible=true;l.shin.visible=true;l.foot.visible=true;l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(palettes.ivory);
        legChecks.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),...(m==='squat'?{footYaw:l.side*squatToeAngle,footMinHeight:planted.contact.y,kneeAboveHip:K.y-H.y,kneeToePlaneError:new T.Vector3(Math.cos(l.side*squatToeAngle),0,-Math.sin(l.side*squatToeAngle)).dot(K.clone().sub(A))}:planted?{footMinHeight:planted.contact.y,footContact:planted.contact.toArray()}:{})});
      }
      model.updateMatrixWorld(true);
      let gripCentre;
      if(m==='rdl'){
        const S=turn([1.04,2.25,.02]),z=.30+(b?.52*smooth(.35,1,phase):0),dy=Math.sqrt(Math.max(.01,2.23*2.23-Math.pow(S.x-.65,2)-Math.pow(S.z-z,2)));
        gripCentre=new T.Vector3(0,S.y-dy,z);barbell.position.copy(gripCentre);barbell.visible=true;
      }
      if(m==='squat'){gripCentre=turn([0,2.23,-.28]);barbell.position.copy(gripCentre);barbell.visible=true;}

      const armChecks=[];
      for(const arm of exArms){
        const side=arm.side,S=shoulderAt(side),frame=armFrame(2.25);let G,bend,E,W,handDirection;
        poseSegment(arm.clavicle,turn([0,2.40,.30]),S);
        if(m==='press'){
          const elevation=(60+105*phase)*Math.PI/180,plane=40*Math.PI/180;
          const upper=frame.up.clone().multiplyScalar(-Math.cos(elevation)).addScaledVector(frame.forward,Math.sin(elevation)*Math.sin(plane));upper.x=side*Math.sin(elevation)*Math.cos(plane);upper.normalize();
          const perpendicular=frame.up.clone().addScaledVector(upper,-frame.up.dot(upper)).normalize(),elbow=(90+85*phase)*Math.PI/180;
          const fore=upper.clone().multiplyScalar(-Math.cos(elbow)).addScaledVector(perpendicular,Math.sin(elbow)).normalize();
          E=S.clone().addScaledVector(upper,1.08);W=E.clone().addScaledVector(fore,.98);G=W.clone().addScaledVector(fore,.13);handDirection=fore;
          const db=dumbbells.find(x=>x.side===side);db.node.position.copy(G);db.node.visible=true;
        }else if(m==='row'){
          const elevation=(85-100*phase)*Math.PI/180,upper=frame.up.clone().multiplyScalar(-Math.cos(elevation)).addScaledVector(frame.forward,Math.sin(elevation)).normalize(),fore=frame.forward.clone();
          E=S.clone().addScaledVector(upper,1.08);W=E.clone().addScaledVector(fore,.98);G=W.clone().addScaledVector(fore,.17);handDirection=fore;
        }else if(m==='pullup'){
          const v=explicitPullVectors(side);E=S.clone().addScaledVector(v.upper,1.08);W=E.clone().addScaledVector(v.fore,.98);G=pullGrip(side);handDirection=v.fore;
        }else{
          if(m==='rdl'){G=gripCentre.clone();G.x=side*.65;bend=new T.Vector3(side*.15,0,.20);}
          else if(m==='squat'){G=gripCentre.clone();G.x=side*1.25;bend=new T.Vector3(side,0,-.8);}
          else if(m==='dips'){G=new T.Vector3(side*1.1,3.9,.10);bend=new T.Vector3(side*.40,0,-.90);}
          handDirection=G.clone().sub(S).normalize();W=G.clone().addScaledVector(handDirection,-.17);E=twoJoint(S,W,1.08,.98,bend);
        }
        poseSegment(arm.upper,S,E);poseSegment(arm.fore,E,W);poseHand(arm,W,handDirection,G);
        const u=E.clone().sub(S).normalize(),v=W.clone().sub(E).normalize(),elbowAngle=T.MathUtils.radToDeg(Math.acos(T.MathUtils.clamp(-u.dot(v),-1,1))),humeralElevation=T.MathUtils.radToDeg(Math.acos(T.MathUtils.clamp(-u.dot(frame.up),-1,1))),humeralSagittal=T.MathUtils.radToDeg(Math.atan2(u.dot(frame.forward),-u.dot(frame.up)));
        armChecks.push({side,shoulder:S.toArray(),elbow:E.toArray(),wrist:W.toArray(),grip:G.toArray(),upperLength:S.distanceTo(E),foreLength:E.distanceTo(W),elbowAngle,humeralElevation,humeralSagittal});
      }
      if(m==='row'){
        gripCentre=new T.Vector3().fromArray(armChecks[0].grip).add(new T.Vector3().fromArray(armChecks[1].grip)).multiplyScalar(.5);rowHandle.position.copy(gripCentre);rowHandle.visible=true;
        const anchor=new T.Vector3(0,3.87,3.6),d=anchor.clone().sub(gripCentre);cable.position.copy(anchor).add(gripCentre).multiplyScalar(.5);cable.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());cable.scale.y=d.length();cable.visible=true;
      }
      for(const key in regionMaterials)regionMaterials[key].color.setHex(key==='context'?palettes.context:palettes.ivory);
      if(m==='press')for(const s of scapulae)studyMaterial(s.node,studyScapMat);
      landmarks.forEach(x=>x.visible=false);ghost.visible=false;model.updateMatrixWorld(true);
      exerciseDebug={movement:m,scenario:state.scenario||'a',phase,pelvisPitch,basePitch,lumbar,thoracic,cervical,rearShift,posteriorExpansion:expansion,protraction:pro,headPitch:angleAt(2.95),spine:[.25,.70,1.20,1.75,2.25,2.60].map(r=>centreAt(r).toArray()),legs:legChecks,arms:armChecks,bar:gripCentre?gripCentre.toArray():null,support:m==='press'?{backrestAngle:78,padOpacity:studyPadMat.opacity,backrestCentre:pressBackrest.position.toArray(),scapulaeHighlighted:true}:null};
    }

    // A quiet floor and support contact remain useful when the model rotates.
    const floorMat=new T.MeshBasicMaterial({color:0xdfe6f1,transparent:true,opacity:.24,side:T.DoubleSide});
    const floor=mesh(new T.CircleGeometry(1.28,64),floorMat,scene);floor.rotation.x=-Math.PI/2;floor.position.y=.08;floor.scale.set(1,.65,1);
    const ringGeo=new T.RingGeometry(1.28,1.285,64);const floorRing=mesh(ringGeo,new T.MeshBasicMaterial({color:0xd1dced,transparent:true,opacity:.8,side:T.DoubleSide}),scene);floorRing.rotation.x=-Math.PI/2;floorRing.position.y=.081;floorRing.scale.set(1,.65,1);
    const pressureMarks=[];
    for(const l of legs){
      const g=new T.Group();g.position.set(l.baseX+l.side*.10,.084,.045);g.name='Illustrative sole contact';scene.add(g);
      const patches={};for(const name of ['heel','forefoot','lateral','medial']){
        const material=new T.MeshBasicMaterial({color:0x378f9e,transparent:true,opacity:.34,depthWrite:false,side:T.DoubleSide});material.userData.azStudyAlpha=true;
        const n=mesh(new T.CircleGeometry(1,40),material,g);n.rotation.x=-Math.PI/2;patches[name]=n;
      }
      patches.heel.position.set(0,0,-.13);patches.heel.scale.set(.074,.105,1);
      patches.forefoot.position.set(-l.side*.005,0,.414);patches.forefoot.scale.set(.146,.062,1);
      patches.lateral.position.set(l.side*.091,0,.170);patches.lateral.scale.set(.032,.190,1);
      patches.medial.position.set(-l.side*.052,.001,.180);patches.medial.scale.set(.033,.133,1);
      pressureMarks.push({node:g,side:l.side,patches});
    }
    // The reference pose is an outline, not a second opaque skeleton.
    const ghost=new T.Group();scene.add(ghost);const ghostMaterial=new T.LineBasicMaterial({color:0x6f92bd,transparent:true,opacity:.15});
    function rebuildGhost(){
      ghost.children.slice().forEach(o=>{ghost.remove(o);if(o.geometry)o.geometry.dispose();});
      model.updateMatrixWorld(true);model.traverseVisible(o=>{if(!o.isMesh||o.material===ctxM||o.parent===head||o.parent.parent===head)return;const line=new T.LineSegments(new T.EdgesGeometry(o.geometry,28),ghostMaterial);line.matrixAutoUpdate=false;line.matrix.copy(o.matrixWorld);ghost.add(line);});
    }
    const labelLayer=document.createElement('div');Object.assign(labelLayer.style,{position:'absolute',inset:'0',pointerEvents:'none',overflow:'hidden'});container.style.position='relative';container.appendChild(labelLayer);
    const labelNodes={};
    function label(name,position){let el=labelNodes[name];if(!el){el=document.createElement('span');el.textContent=name;Object.assign(el.style,{position:'absolute',font:'500 11px system-ui,sans-serif',color:'#516a89',background:'rgba(248,251,255,.88)',border:'1px solid rgba(172,191,217,.36)',padding:'4px 7px',borderRadius:'6px',whiteSpace:'nowrap',transform:'translate(-50%,-50%)'});labelLayer.appendChild(el);labelNodes[name]=el;}const p=position.clone().project(camera);if(p.z< -1||p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1){el.style.display='none';return;}el.style.display='block';el.style.left=Math.min(width-el.offsetWidth/2-8,Math.max(el.offsetWidth/2+8,(p.x*.5+.5)*width))+'px';el.style.top=Math.min(height-18,Math.max(65,(-p.y*.5+.5)*height))+'px';}
    let renderer,canvas,ctx;
    const canvasEvents=[];
    const pixelRatio=Math.min(window.devicePixelRatio||1,2);
    const canvasLabel='Interactive schematic skeleton. Drag to rotate and scroll to zoom.';
    function onCanvas(type,fn,options){
      const element=canvas;
      element.addEventListener(type,fn,options);
      canvasEvents.push(()=>element.removeEventListener(type,fn,options));
    }
    function clearCanvasEvents(){
      for(const remove of canvasEvents.splice(0))remove();
    }
    function releaseRenderer(instance){
      instance.setAnimationLoop?.(null);
      instance.renderLists?.dispose?.();
      instance.dispose();
      instance.forceContextLoss?.();
    }
    let drag=null;
    function configureCanvas(){
      clearCanvasEvents();
      drag=null;
      canvas.setAttribute('aria-label',canvasLabel);
      canvas.setAttribute('role','img');
      canvas.setAttribute('data-renderer',ctx?'canvas':'webgl');
      Object.assign(canvas.style,{display:'block',width:'100%',height:'100%',touchAction:'none',cursor:'grab'});
      container.insertBefore(canvas,labelLayer);
      if(!ctx){
        onCanvas('webglcontextlost',contextLost);
        onCanvas('webglcontextrestored',render);
      }
      onCanvas('pointerdown',e=>{
        drag={x:e.clientX,y:e.clientY};
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor='grabbing';
      });
      onCanvas('pointermove',e=>{
        if(!drag)return;
        yaw-=(e.clientX-drag.x)*.008;
        pitch=Math.min(.7,Math.max(-.45,pitch+(e.clientY-drag.y)*.006));
        drag={x:e.clientX,y:e.clientY};
        render();
      });
      const end=()=>{drag=null;canvas.style.cursor='grab';};
      onCanvas('pointerup',end);
      onCanvas('pointercancel',end);
      onCanvas('wheel',e=>{
        e.preventDefault();
        zoomCamera(e.deltaY>0?1.06:1/1.06);
      },{passive:false});
    }
    function zoomCamera(factor){distance=Math.max(1.3,Math.min(50,distance*factor));render();}
    function softwareCanvas(){
      const element=document.createElement('canvas');
      const context=element.getContext('2d');
      if(!context)return false;
      if(canvas)canvas.remove();
      canvas=element;
      ctx=context;
      configureCanvas();
      canvas.width=width*pixelRatio;
      canvas.height=height*pixelRatio;
      ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
      return true;
    }
    function contextLost(event){
      if(disposed||!renderer||event.target!==canvas)return;
      event.preventDefault();
      const previous=renderer;
      if(!softwareCanvas())return;
      renderer=null;
      releaseRenderer(previous);
      render();
    }
    try{
      renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
      renderer.setPixelRatio(pixelRatio);
      renderer.setClearColor(0xffffff,0);
      renderer.outputColorSpace=T.SRGBColorSpace;
      renderer.toneMapping=T.ACESFilmicToneMapping;
      renderer.toneMappingExposure=.95;
      canvas=renderer.domElement;
    }catch(error){
      if(renderer){releaseRenderer(renderer);renderer=null;}
      if(!softwareCanvas())throw Error('Anatomy Zone needs a browser with canvas support.');
    }
    if(renderer)configureCanvas();

    const lightDirection=new T.Vector3(-.4,.6,.7).normalize();
    const cameraModel=new T.Matrix4();
    const projectedBuffers=new WeakMap();
    const ma=new T.Vector3(),mb=new T.Vector3(),mc=new T.Vector3(),normal=new T.Vector3();
    const ab=new T.Vector3(),ac=new T.Vector3(),point=new T.Vector3(),displayColor=new T.Color();
    function fallbackDraw(){
      ctx.clearRect(0,0,width,height);
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const triangles=[];
      const projection=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
      scene.traverseVisible(mesh=>{
        if(mesh===balanceLine||mesh===comDot)return;
        if(!mesh.isMesh||!mesh.material.visible||mesh.material.opacity<=0)return;
        const geometry=mesh.geometry,{position,color}=geometry.attributes,index=geometry.index;
        const material=mesh.material,vertexColors=material.vertexColors&&color;
        const normalization=vertexColors?.normalized&&vertexColors.array.BYTES_PER_ELEMENT===1?1/255:1;
        let projected=projectedBuffers.get(geometry);
        if(!projected){projected=new Float32Array(position.count*3);projectedBuffers.set(geometry,projected);}
        cameraModel.multiplyMatrices(projection,mesh.matrixWorld);
        for(let i=0;i<position.count;i++){
          point.fromBufferAttribute(position,i).applyMatrix4(cameraModel);
          projected[i*3]=(point.x*.5+.5)*width;
          projected[i*3+1]=(-point.y*.5+.5)*height;
          projected[i*3+2]=point.z;
        }
        const len=index?index.count:position.count;
        for(let i=0;i<len;i+=3){
          const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2;
          const a=ia*3,b=ib*3,c=ic*3;
          let ax=projected[a],ay=projected[a+1],bx=projected[b],by=projected[b+1],cx=projected[c],cy=projected[c+1];
          const winding=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
          if(Math.abs(winding)<.08||
              material.side===T.FrontSide&&winding>0||material.side===T.BackSide&&winding<0)continue;
          if(Math.min(ax,bx,cx)>width||Math.max(ax,bx,cx)<0||Math.min(ay,by,cy)>height||Math.max(ay,by,cy)<0)continue;
          const az=projected[a+2],bz=projected[b+2],cz=projected[c+2];
          if(Math.min(az,bz,cz)>1||Math.max(az,bz,cz)<-1)continue;
          displayColor.copy(material.color);
          if(vertexColors){
            const rgb=vertexColors.array;
            displayColor.r*=(rgb[a]+rgb[b]+rgb[c])*normalization/3;
            displayColor.g*=(rgb[a+1]+rgb[b+1]+rgb[c+1])*normalization/3;
            displayColor.b*=(rgb[a+2]+rgb[b+2]+rgb[c+2])*normalization/3;
          }
          if(!material.isMeshBasicMaterial){
            ma.fromBufferAttribute(position,ia).applyMatrix4(mesh.matrixWorld);
            mb.fromBufferAttribute(position,ib).applyMatrix4(mesh.matrixWorld);
            mc.fromBufferAttribute(position,ic).applyMatrix4(mesh.matrixWorld);
            normal.crossVectors(ab.subVectors(mb,ma),ac.subVectors(mc,ma)).normalize();
            const facing=winding<0?1:-1;
            const diffuse=Math.max(0,normal.dot(lightDirection)*facing);
            if(material.userData.helmetFinish){
              // Match the lacquer and brushed metal under a wide studio light.
              ab.subVectors(camera.position,ma).normalize().add(lightDirection).normalize();
              const shine=Math.pow(Math.max(0,normal.dot(ab)*facing),10/material.roughness);
              displayColor.multiplyScalar(.42+.64*diffuse).addScalar(.44*shine);
            }else displayColor.multiplyScalar(.64+.36*diffuse);
          }
          displayColor.convertLinearToSRGB();
          // Canvas antialiases individual paths against their background.
          // Overlap opaque facets by a fraction of a pixel to close hairline seams.
          if(material.opacity===1){
            const la=Math.hypot(bx-cx,by-cy),lb=Math.hypot(ax-cx,ay-cy),lc=Math.hypot(ax-bx,ay-by);
            const perimeter=la+lb+lc;
            const ix=(la*ax+lb*bx+lc*cx)/perimeter,iy=(la*ay+lb*by+lc*cy)/perimeter;
            const grow=.43*perimeter/Math.abs(winding);
            const ga=Math.min(grow,.85/Math.max(.001,Math.hypot(ax-ix,ay-iy)));
            const gb=Math.min(grow,.85/Math.max(.001,Math.hypot(bx-ix,by-iy)));
            const gc=Math.min(grow,.85/Math.max(.001,Math.hypot(cx-ix,cy-iy)));
            ax+=(ax-ix)*ga;ay+=(ay-iy)*ga;bx+=(bx-ix)*gb;by+=(by-iy)*gb;cx+=(cx-ix)*gc;cy+=(cy-iy)*gc;
          }
          triangles.push({ax,ay,bx,by,cx,cy,z:(az+bz+cz)/3,
            fill:`rgb(${Math.round(displayColor.r*255)},${Math.round(displayColor.g*255)},${Math.round(displayColor.b*255)})`,
            opacity:material.opacity,order:material.depthTest===false?mesh.renderOrder:0});
        }
      });
      triangles.sort((a,b)=>a.order-b.order||b.z-a.z);
      for(const t of triangles){
        ctx.beginPath();
        ctx.moveTo(t.ax,t.ay);
        ctx.lineTo(t.bx,t.by);
        ctx.lineTo(t.cx,t.cy);
        ctx.closePath();
        ctx.fillStyle=t.fill;
        ctx.globalAlpha=t.opacity;
        ctx.fill();
      }
      if(ghost.visible)drawGhostOutline(projection);
      ctx.globalAlpha=1;
      if(previewEquipment.visible&&comDot.visible)drawBalanceGuide(projection);
    }
    function drawBalanceGuide(projection){
      // Project the same guide as WebGL. A single canvas fill keeps the dot
      // solid at the small sizes used in the three comparison panels.
      const center=ma.set(0,0,0).applyMatrix4(comDot.matrixWorld).applyMatrix4(projection);
      const base=mb.set(0,-.5,0).applyMatrix4(balanceLine.matrixWorld).applyMatrix4(projection);
      const toX=x=>(x*.5+.5)*width, toY=y=>(.5-y*.5)*height;
      const x=toX(center.x), y=toY(center.y);
      const depth=-mc.setFromMatrixPosition(comDot.matrixWorld).applyMatrix4(camera.matrixWorldInverse).z;
      if(depth<=0)return;
      const pixelsPerUnit=camera.projectionMatrix.elements[5]*height/(2*depth);
      ctx.strokeStyle=balanceLine.material.color.getStyle();
      ctx.lineWidth=Math.max(1,2*balanceLine.geometry.parameters.radiusTop*pixelsPerUnit);
      ctx.globalAlpha=balanceLine.material.opacity;
      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(toX(base.x),toY(base.y));
      ctx.stroke();
      ctx.globalAlpha=1;
      ctx.fillStyle=comDot.material.color.getStyle();
      ctx.beginPath();
      ctx.arc(x,y,Math.max(2,comDot.geometry.parameters.radius*pixelsPerUnit),0,Math.PI*2);
      ctx.fill();
    }
    function drawGhostOutline(projection){
      ctx.globalAlpha=ghostMaterial.opacity;
      ctx.strokeStyle='#6f92bd';
      ctx.lineWidth=1;
      ctx.beginPath();
      for(const line of ghost.children){
        const vertices=line.geometry.attributes.position;
        cameraModel.multiplyMatrices(projection,line.matrixWorld);
        for(let i=0;i<vertices.count;i+=2){
          ma.fromBufferAttribute(vertices,i).applyMatrix4(cameraModel);
          mb.fromBufferAttribute(vertices,i+1).applyMatrix4(cameraModel);
          if(Math.max(ma.z,mb.z)>1||Math.min(ma.z,mb.z)<-1)continue;
          ctx.moveTo((ma.x*.5+.5)*width,(-ma.y*.5+.5)*height);
          ctx.lineTo((mb.x*.5+.5)*width,(-mb.y*.5+.5)*height);
        }
      }
      ctx.stroke();
    }
    function cameraUpdate(){camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(target);camera.updateProjectionMatrix();}
    // Use tracked points on the displayed surfaces, including deforming cartilage.
    const sideRib=ribs[9].children[0],ribPoints=sideRib.geometry.attributes.position;
    let lateralVertex=0;
    for(let i=1;i<ribPoints.count;i++)if(ribPoints.getX(i)>ribPoints.getX(lateralVertex))lateralVertex=i;
    const ribPoint=()=>sideRib.localToWorld(new T.Vector3().fromBufferAttribute(ribPoints,lateralVertex));
    const costalMargin=ribs[16].getObjectByName('Costal cartilage 9 (right)');
    const rightBlade=scapulae[0].node.children[0];
    rightBlade.geometry.computeBoundingSphere();
    function render(){if(disposed)return;cameraUpdate();
      if(renderer)renderer.render(scene,camera);else fallbackDraw();Object.values(labelNodes).forEach(el=>el.style.display='none');if(!state.labels)return;
      const movement=state.movement;
      if(movement==='lunge'&&exerciseDebug){label('Pelvis',landmarks[2].getWorldPosition(new T.Vector3()));const f=exerciseDebug.legs.find(l=>l.side===-1),b=exerciseDebug.legs.find(l=>l.side===1);label('Right front',new T.Vector3(...f.ankle));label('Left rear',new T.Vector3(...b.ankle));return;}
      if(exerciseIds.has(movement)){label('Pelvis',landmarks[2].getWorldPosition(new T.Vector3()));label('Shoulder',exArms[0].upper.getWorldPosition(new T.Vector3()));if(['pullup','dips'].includes(movement)&&exerciseDebug){const grip=exerciseDebug.arms[0].grip;label('Fixed grip',new T.Vector3(...grip));}else label('Ribcage',ribPoint());return;}
      if(['hike','tilt','hip','chain','ribshift'].includes(movement)){
        label('Pelvis',landmarks[2].getWorldPosition(new T.Vector3()));if(movement==='hip')label(state.side==='right'?'Right femur':'Left femur',legs[state.side==='right'?0:1].femur.localToWorld(new T.Vector3(0,-.90,.03)));
        if(movement==='hike')label(state.side==='right'?'Left stance leg':'Right stance leg',legs[state.side==='right'?1:0].femur.localToWorld(new T.Vector3(0,-1.25,0)));
      }
      if(['ribs','ribshift','scapula'].includes(movement)||(movement==='chain'&&state.mode==='chain')){label('Ribcage',ribPoint());if(movement!=='ribs'&&scapulae[0].node.visible)label('Scapula',rightBlade.localToWorld(rightBlade.geometry.boundingSphere.center.clone()));}
      if(movement==='ribs'&&state.mode==='local'){
        label('Sternum',sternum.localToWorld(new T.Vector3(.12,.08,.14)));
        if(costalMargin){const points=costalMargin.geometry.attributes.position;label('Costal margin',costalMargin.localToWorld(new T.Vector3().fromBufferAttribute(points,Math.floor(points.count/2))));}
      }
      if(movement==='foot'){
        const leg=legs[state.side==='right'?0:1], landmarks=leg.footLandmarks;
        const at=(node,x,y,z)=>node.localToWorld(new T.Vector3(leg.side*x,y,z));
        if(landmarks){
          label('Calcaneus',landmarks.calcaneus.getWorldPosition(new T.Vector3()));
          label('Medial arch',landmarks.navicular.getWorldPosition(new T.Vector3()));
        }else{
          label('Calcaneus',at(leg.foot,.22,0,-.16));
          label('Medial arch',at(leg.navicular,-.11,.05,.16));
        }
      }
    }
    const previewIds=new Set(['cgoblet','cheels','csafety']);
    let previewDebug=null;
    const previewEquipment=new T.Group();scene.add(previewEquipment);
    const previewSteel=new T.MeshStandardMaterial({color:0x365677,roughness:.66});
    const previewMetal=new T.MeshStandardMaterial({color:0x8ca3b9,roughness:.45,metalness:.45});
    const previewFoam=new T.MeshStandardMaterial({color:0x1d3046,roughness:.92});
    const goblet=new T.Group();previewEquipment.add(goblet);between(goblet,[0,-.28,0],[0,.28,0],.065,.065,previewSteel);for(const y of[-.28,.28]){const g=mesh(new T.CylinderGeometry(.23,.23,.16,6),previewSteel,goblet);g.position.y=y;}
    const straight=new T.Group();previewEquipment.add(straight);between(straight,[-1.6,0,0],[1.6,0,0],.04,.04,previewSteel);for(const x of[-1.55,1.55]){const p=mesh(new T.CylinderGeometry(.27,.27,.12,20),previewSteel,straight);p.rotation.z=Math.PI/2;p.position.x=x;}
    const safety=new T.Group(), safetyPlateCenter=new T.Vector3();previewEquipment.add(safety);between(safety,[-1.10,0,-.12],[1.10,0,-.12],.055,.055,previewMetal);
    for(const x of[-.62,0,.62]){const pad=mesh(new T.CylinderGeometry(.13,.13,x===0?.37:.53,18),previewFoam,safety);pad.rotation.z=Math.PI/2;pad.position.set(x,0,-.12);}
    for(const side of[-1,1]){
      between(safety,[side*1.10,0,-.12],[side*1.30,-.12,-.12],.055,.055,previewMetal);
      between(safety,[side*1.30,-.12,-.12],[side*1.49,-.42,.38],.055,.055,previewMetal);
      between(safety,[side*1.30,-.42,.38],[side*1.75,-.42,.38],.055,.055,previewMetal);
      const plate=mesh(new T.CylinderGeometry(.30,.30,.15,24),previewSteel,safety);plate.rotation.z=Math.PI/2;plate.position.set(side*1.49,-.42,.38);
      safetyPlateCenter.addScaledVector(plate.position,.5);
      between(safety,[side*.56,0,-.12],[side*.56,-.40,.84],.042,.042,previewMetal);
      between(safety,[side*.56,-.30,.59],[side*.56,-.40,.84],.050,.050,previewFoam);
    }
    const wedges=[];{const shape=new T.Shape();shape.moveTo(-.26,0);shape.lineTo(-.26,.20);shape.lineTo(.72,0);shape.closePath();const geometry=new T.ExtrudeGeometry(shape,{depth:2.24,bevelEnabled:false});const wedge=mesh(geometry,previewSteel,previewEquipment);wedge.rotation.y=-Math.PI/2;wedge.position.set(1.12,.08,0);wedges.push(wedge);}
    const balanceLine=mesh(new T.CylinderGeometry(.019,.019,1,8),new T.MeshBasicMaterial({color:0x466c99,toneMapped:false,transparent:true,opacity:.9,depthTest:false,depthWrite:false}),previewEquipment);
    const comDot=mesh(new T.SphereGeometry(.075,16,12),new T.MeshBasicMaterial({color:0x315bc1,toneMapped:false,transparent:true,depthTest:false,depthWrite:false}),previewEquipment);
    balanceLine.renderOrder=59;comDot.renderOrder=60;
    function posePreview(a){
      const m=state.movement,p=T.MathUtils.clamp(a,0,1),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
      previewEquipment.visible=true;for(const o of previewEquipment.children)o.visible=false;
      pelvis.visible=torso.visible=head.visible=true;for(const l of legs){l.root.visible=l.femur.visible=l.shin.visible=l.foot.visible=true;l.root.rotation.set(0,0,0);l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(palettes.ivory);}arms.forEach(x=>x.node.visible=true);scapulae.forEach(x=>x.node.visible=true);spineGroups.forEach(v=>v.node.visible=true);spineGuide.visible=false;ghost.visible=false;landmarks.forEach(x=>x.visible=false);torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=true;});
      for(const key in regionMaterials)regionMaterials[key].color.setHex(key==='context'?palettes.context:palettes.ivory);
      floor.visible=true;floor.scale.set(1.5,1.2,1);floorRing.visible=false;
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),joints=[];
      const toeAngle=Math.PI/18;
      function footCalibration(l,heel){
        const key=heel?'wedge':'flat';l.deepFootFrames||={};if(l.deepFootFrames[key])return l.deepFootFrames[key];
        if(!l.deepFootPoints){model.updateMatrixWorld(true);const inverse=l.foot.matrixWorld.clone().invert(),points=[];l.foot.traverse(o=>{if(!o.isMesh)return;const matrix=inverse.clone().multiply(o.matrixWorld),attr=o.geometry.attributes.position;for(let i=0;i<attr.count;i++)points.push(new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(matrix));});l.deepFootPoints=points;}
        const slope=heel?.20/.98:0,intercept=.08+slope*.72,yaw=new T.Quaternion().setFromAxisAngle(V(0,1,0),l.side*toeAngle);
        function frame(pitch){const q=new T.Quaternion().setFromAxisAngle(V(1,0,0),pitch).multiply(yaw),pts=l.deepFootPoints.map(p=>p.clone().applyQuaternion(q));let min=Infinity,h=Infinity,t=Infinity;for(let i=0;i<pts.length;i++){const g=pts[i].y+slope*pts[i].z;min=Math.min(min,g);if(l.deepFootPoints[i].z<.08)h=Math.min(h,g);if(l.deepFootPoints[i].z>.40)t=Math.min(t,g);}return {q,pts,min,error:t-h,pitch};}
        let f=frame(0);if(heel){let lo=0,hi=.6;for(let i=0;i<30;i++){f=frame((lo+hi)/2);if(f.error>0)lo=f.pitch;else hi=f.pitch;}f=frame((lo+hi)/2);}
        const ankleOffset=(l.footRegistration||V()).clone().applyQuaternion(f.q).negate();
        const ankleY=intercept-slope*(.04+ankleOffset.z)-f.min;
        const result={...f,ankleY,ankleOffset,slope,intercept};l.deepFootFrames[key]=result;return result;
      }
      function deepKnee(H,A,side){
        const delta=A.clone().sub(H),distance=delta.length(),axis=delta.normalize(),along=(L1*L1-L2*L2+distance*distance)/(2*distance),radius=Math.sqrt(Math.max(0,L1*L1-along*along)),centre=H.clone().addScaledVector(axis,along),normal=V(Math.cos(side*toeAngle),0,-Math.sin(side*toeAngle)),across=normal.clone().addScaledVector(axis,-normal.dot(axis)),n=across.length();
        if(radius<.00001||n<.00001)return twoJoint(H,A,L1,L2,V(side*.20,0,1));across.divideScalar(n);const component=normal.dot(A.clone().sub(centre))/(radius*n);if(Math.abs(component)>1)return twoJoint(H,A,L1,L2,V(side*.20,0,1));
        const forward=V().crossVectors(axis,across).normalize();if(forward.z<0)forward.negate();return centre.addScaledVector(across,radius*component).addScaledVector(forward,radius*Math.sqrt(Math.max(0,1-component*component)));
      }
      function placeLeg({l,H,K,A,frame}){
        const fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(V(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,1,1);
        l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(V(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,1,1);l.root.updateMatrixWorld(true);
        l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(frame.q);l.foot.scale.set(1,1,1);
        const footPoints=frame.pts.map(p=>p.clone().add(A));let footMin=Infinity,supportGap=Infinity;for(const p of footPoints){footMin=Math.min(footMin,p.y);supportGap=Math.min(supportGap,p.y-(frame.intercept-frame.slope*p.z));}
        joints.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),footPitch:frame.pitch,toeOutDegrees:10,footMinHeight:footMin,supportGap,footBounds:{minX:Math.min(...footPoints.map(p=>p.x)),maxX:Math.max(...footPoints.map(p=>p.x)),minZ:Math.min(...footPoints.map(p=>p.z)),maxZ:Math.max(...footPoints.map(p=>p.z))},hipBelowKnee:H.y<K.y});
      }
      const heel=m==='cheels', safetyBar=m==='csafety';
      const pitch=(heel?.38:safetyBar?.40:.30)*p;
      const height=3.25-2.35*p+(heel?.10:0);
      const rotation=new T.Quaternion().setFromAxisAngle(V(1,0,0),pitch);
      const offset=(x,y,z)=>V(x,y,z).applyQuaternion(rotation);
      const apparatus=heel?straight:safetyBar?safety:goblet;
      const apparatusOffset=heel?offset(0,2.35,-.30):safetyBar?offset(0,2.35,0):offset(0,1.95,.65);
      const loadOffset=apparatusOffset.clone();
      if(safetyBar)loadOffset.add(safetyPlateCenter.clone().applyQuaternion(rotation));

      const loadMass=20, trunkMass=40, headMass=6;
      const upperArmMass=2, forearmMass=1.5, handMass=.5;
      const thighMass=8, shinMass=4, footMass=1;
      const upperMass=trunkMass+headMass+exArms.length*(upperArmMass+forearmMass+handMass);
      const bodyMass=upperMass+legs.length*(thighMass+shinMass+footMass);

      // With a fixed torso angle the fitted upper body and its load translate together.
      // Fit the grip once in pelvis-relative coordinates before solving for balance.
      torso.quaternion.copy(rotation);
      arms.forEach(arm=>arm.node.visible=false);
      exerciseArms.visible=true;
      for(const arm of exArms){
        const s=arm.side, shoulder=offset(s*1.04,2.25,.02);
        const grip=heel?offset(s*1.25,2.35,-.30):safetyBar?offset(s*.56,2.00,.715):offset(s*.185,2.15,.65);
        const wrist=grip.clone().add(V(0,-.13,0));
        const elbow=twoJoint(shoulder,wrist,1.08,.98,V(s*.25,-1,-.25));
        poseSegment(arm.clavicle,offset(0,2.4,.3),shoulder);
        poseSegment(arm.upper,shoulder,elbow);
        poseSegment(arm.fore,elbow,wrist);
        poseHand(arm,wrist,grip.clone().sub(wrist).normalize(),grip);
      }
      fitShoulderGirdle?.fitHands(m);
      const upperMoment=offset(0,1.05,-.03).multiplyScalar(trunkMass).addScaledVector(offset(0,2.95,-.08),headMass);
      const addSegment=(sum,start,end,mass)=>sum.addScaledVector(start,mass/2).addScaledVector(end,mass/2);
      for(const arm of exArms){
        addSegment(upperMoment,arm.upper.position,arm.fore.position,upperArmMass);
        addSegment(upperMoment,arm.fore.position,arm.hand.position,forearmMass);
        addSegment(upperMoment,arm.hand.position,arm.contact,handMass);
      }

      const frames=legs.map(l=>{
        const frame=footCalibration(l,heel);
        const A=V(l.side*.78+frame.ankleOffset.x,frame.ankleY,.04+frame.ankleOffset.z);
        const footCenter=V(0,-.02,.22).add(l.footRegistration||V()).applyQuaternion(frame.q).add(A);
        return {l,frame,A,footCenter};
      });
      function balanceAt(z){
        const origin=V(0,height+frames[0].frame.ankleOffset.y,z),load=loadOffset.clone().add(origin);
        const moment=upperMoment.clone().addScaledVector(origin,upperMass);
        const solvedLegs=frames.map(({l,frame,A,footCenter})=>{
          const H=V(l.side*.51,-.17,.005).add(origin),K=deepKnee(H,A,l.side);
          addSegment(moment,H,K,thighMass);
          addSegment(moment,K,A,shinMass);
          moment.addScaledVector(footCenter,footMass);
          return {l,frame,H,K,A};
        });
        const body=moment.clone().divideScalar(bodyMass);
        const combined=moment.addScaledVector(load,loadMass).divideScalar(bodyMass+loadMass);
        return {origin,body,combined,load,solvedLegs};
      }
      const supportZ=.18;
      let solved=balanceAt(-.15);
      for(let i=0;i<24;i++){
        const error=supportZ-solved.combined.z;
        if(Math.abs(error)<1e-9)break;
        solved=balanceAt(solved.origin.z+1.10*error);
      }
      const {origin,body,combined,load,solvedLegs}=solved;
      pelvis.position.copy(origin);
      torso.position.copy(offset(0,1.42,0)).add(origin);
      head.position.copy(offset(0,2.95,-.08)).add(origin);
      head.quaternion.copy(rotation);
      for(const v of spineGroups){
        v.node.position.copy(offset(0,v.y-3.3,v.z)).add(origin);
        v.node.quaternion.copy(rotation);
      }
      for(const arm of exArms){
        for(const node of [arm.clavicle,arm.upper,arm.fore,arm.hand])node.position.add(origin);
        arm.contact.add(origin);
      }
      for(const item of solvedLegs)placeLeg(item);
      apparatus.visible=true;
      apparatus.position.copy(apparatusOffset).add(origin);
      apparatus.quaternion.copy(rotation);
      for(const w of wedges)w.visible=heel;

      const support=frames[0].frame;
      const surfaceY=support.intercept-support.slope*combined.z;
      comDot.visible=balanceLine.visible=true;
      comDot.position.copy(combined);
      balanceLine.position.set(combined.x,(combined.y+surfaceY)/2,combined.z);
      balanceLine.scale.y=combined.y-surfaceY;
      model.updateMatrixWorld(true);
      previewDebug={movement:m,amount:a,joints,com:combined.toArray(),bodyCom:body.toArray(),load:load.toArray()};
    }

    // Conventional pull: the knees withdraw as the bar rises, then hips finish the lift.
    // Positions are illustrative, solved with fixed bones, planted feet and straight arms.
    function tensionDeadliftFrame(lift){
      const q=T.MathUtils.clamp(lift,0,1),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),femurSag=Math.sqrt(L1*L1-.05*.05),tibiaSag=Math.sqrt(L2*L2-.05*.05);
      const points=tensionFootPoints(legs[0]),ankleY=.08-Math.min(...points.map(v=>v.y)),ankleZ=.045;
      const shinAngle=.20*Math.pow(1-q,2),thighAngle=1.20*(1-q);
      const kneeY=ankleY+tibiaSag*Math.cos(shinAngle),kneeZ=ankleZ+tibiaSag*Math.sin(shinAngle);
      const hipY=kneeY+femurSag*Math.cos(thighAngle),hipZ=kneeZ-femurSag*Math.sin(thighAngle);
      const armReach=2.225,barZ=.35;
      function solve(pitch){
        const Q=new T.Quaternion().setFromAxisAngle(V(1,0,0),pitch),origin=V(0,hipY,hipZ).sub(V(0,-.17,.005).applyQuaternion(Q));
        const S=V(1.04,2.25,.02).applyQuaternion(Q).add(origin),deltaZ=S.z-barZ,vertical=Math.sqrt(Math.max(.001,armReach*armReach-.39*.39-deltaZ*deltaZ));
        return {origin,Q,bar:V(0,S.y-vertical,barZ)};
      }
      // Match a real plate on the ground exactly at lift-off despite rig proportions.
      let low=1.05,high=1.30;
      const baseShin=.20,baseThigh=1.20,baseKY=ankleY+tibiaSag*Math.cos(baseShin),baseKZ=ankleZ+tibiaSag*Math.sin(baseShin),baseHY=baseKY+femurSag*Math.cos(baseThigh),baseHZ=baseKZ-femurSag*Math.sin(baseThigh);
      for(let i=0;i<36;i++){
        const t=(low+high)/2,oy=baseHY+.17*Math.cos(t)+.005*Math.sin(t),oz=baseHZ+.17*Math.sin(t)-.005*Math.cos(t),sy=oy+2.25*Math.cos(t)-.02*Math.sin(t),sz=oz+2.25*Math.sin(t)+.02*Math.cos(t),by=sy-Math.sqrt(armReach*armReach-.39*.39-(sz-barZ)*(sz-barZ));
        if(by>.90)low=t;else high=t;
      }
      const pitch=(low+high)/2*Math.pow(1-q,.65),frame=solve(pitch);
      if(q<1e-10)frame.bar.y=.90;
      frame.kneeTargets=new Map(legs.map(l=>[l.side,V(l.side*.56,kneeY,kneeZ)]));
      frame.shinAngle=shinAngle;frame.kneeFlexion=shinAngle+thighAngle;frame.hipPosition=V(0,hipY,hipZ);return frame;
    }

    // Slight yielding through the chain, with most visible recoil at the ankle.
    function poseTensionPogo(phase){
      const p=T.MathUtils.clamp(phase,0,1),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),contactEnd=.30,contact=p<contactEnd,u=contact?p/contactEnd:(p-contactEnd)/(1-contactEnd);
      const pulse=contact?Math.sin(Math.PI*u):0,compression=.09*pulse,footLift=contact?0:.34*Math.sin(Math.PI*u),footPitch=.44-.35*pulse;
      const footQ=new T.Quaternion().setFromAxisAngle(V(1,0,0),footPitch),L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),f=legs[0];
      const landingToe=l=>{
        l.poseToes?.(footPitch*.82);
        const points=tensionFootPoints(l,true).map(v=>v.clone().applyQuaternion(footQ));
        let minY=Infinity,maxZ=-Infinity;
        for(const v of points){minY=Math.min(minY,v.y);maxZ=Math.max(maxZ,v.z);}
        return {y:minY,z:maxZ};
      };
      const low=landingToe(f);
      const ankleY=.08-low.y+footLift,ankleZ=.55-low.z,pelvisPitch=-.028*pulse;
      const origin=V(0,ankleY+L1+L2+.17-.012-compression,ankleZ-.018-.045*pulse),pelvisQ=new T.Quaternion().setFromAxisAngle(V(1,0,0),pelvisPitch);
      const angleAt=r=>.012+.040*pulse*Math.min(1,r/2.3),centreAt=r=>V(0,r-.007*pulse*r*r,.014*pulse*r*r).add(origin),turn=(x,y,z)=>centreAt(y).add(V(x,0,z).applyAxisAngle(V(1,0,0),angleAt(y)));
      pelvis.position.copy(origin);pelvis.quaternion.copy(pelvisQ);pelvis.updateMatrixWorld(true);
      torso.position.copy(turn(0,1.42,0));torso.rotation.set(angleAt(1.85),0,0);torso.updateMatrixWorld(true);head.position.copy(turn(0,2.95,-.08));head.rotation.set(angleAt(2.95)+.025*pulse,0,0);
      for(const v of spineGroups){const r=v.y-3.3;v.node.position.copy(turn(0,r,v.z));v.node.rotation.set(angleAt(r),0,0);}
      sternum.position.copy(sternumRest);const jointChecks=[],armChecks=[];
      for(const l of legs){
        const bottom=l===f?low:landingToe(l);
        const A=V(l.side*.61,.08-bottom.y+footLift,.55-bottom.z),H=pelvis.localToWorld(V(l.side*.51,-.17,.005)),K=twoJoint(H,A,L1,L2,V(0,0,1)),fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.root.rotation.set(0,0,0);l.femur.quaternion.setFromUnitVectors(V(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,1,1);l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(V(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,1,1);l.root.updateMatrixWorld(true);l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(footQ);l.foot.scale.set(1,1,1);
        jointChecks.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),footMinHeight:bottom.y+A.y,footPitch,forefoot:[A.x,.08+footLift,.55],kneeFlexion:T.MathUtils.radToDeg(Math.PI-Math.acos(T.MathUtils.clamp(H.clone().sub(K).normalize().dot(A.clone().sub(K).normalize()),-1,1)))});
      }
      for(const a of exArms){
        const side=a.side,S=turn(side*1.04,2.25,.02),armAngle=.04+.08*Math.sin(2*Math.PI*p-.25),upper=V(side*.10,-Math.cos(armAngle),Math.sin(armAngle)).normalize(),fore=V(side*.02,-Math.cos(armAngle+.16+.06*pulse),Math.sin(armAngle+.16+.06*pulse)).normalize(),E=S.clone().addScaledVector(upper,1.08),W=E.clone().addScaledVector(fore,.98),G=W.clone().addScaledVector(fore,.17);
        poseSegment(a.clavicle,turn(0,2.40,.30),S);poseSegment(a.upper,S,E);poseSegment(a.fore,E,W);poseHand(a,W,fore);
        armChecks.push({side,shoulder:S.toArray(),elbow:E.toArray(),wrist:W.toArray(),grip:G.toArray(),upperLength:S.distanceTo(E),foreLength:E.distanceTo(W)});
      }
      model.updateMatrixWorld(true);tensionDebug={movement:'tension_pogo',phase:p,phaseLabel:contact?(u<.5?'Landing and compression':'Rebound'):'Flight',compression,bodyYield:pulse,contact,legs:jointChecks,joints:jointChecks,arms:armChecks,contacts:{floorHeight:.08,footLift,forefootContact:contact},trunkPitch:angleAt(1.85),pelvis:origin.toArray()};tensionHighlight('tension_pogo',p);
    }

    const tensionIds=new Set(['tension_deadlift','tension_pushup','tension_swing','tension_pogo','tension_cat']);
    let tensionDebug=null;
    const tensionEquipment=new T.Group();scene.add(tensionEquipment);
    const tensionLoad=new T.MeshStandardMaterial({color:0x304b65,roughness:.68,metalness:.14,transparent:true,opacity:.18,depthWrite:false});
    tensionLoad.userData.azStudyAlpha=true;
    const tensionBar=new T.Group();tensionEquipment.add(tensionBar);between(tensionBar,[-1.92,0,0],[1.92,0,0],.038,.038,steel);
    for(const s of[-1,1])for(const x of[1.36,1.57]){const plate=mesh(new T.CylinderGeometry(.82,.82,.15,24),tensionLoad,tensionBar);plate.rotation.z=Math.PI/2;plate.position.x=s*x;}
    const tensionSpineMaterials=new Map(),tensionSpineMeshes=[];
    for(const v of spineGroups)v.node.traverse(o=>{if(!o.isMesh)return;const original=o.material;if(!tensionSpineMaterials.has(original))tensionSpineMaterials.set(original,original.clone());tensionSpineMeshes.push({mesh:o,original,highlight:tensionSpineMaterials.get(original)});});
    function tensionHighlight(m,p){
      let level=m==='tension_deadlift'?.95:m==='tension_pushup'?.54:m==='tension_cat'?.12:m==='tension_swing'?.30+.60*Math.pow(Math.sin(Math.PI*p),2):.30;
      for(const mat of tensionSpineMaterials.values())mat.color.copy(new T.Color(palettes.ivory)).lerp(new T.Color(0x4d83b4),level);
      thorM.color.copy(new T.Color(palettes.ivory)).lerp(new T.Color(0x709dbf),level*.80);pelvicM.color.copy(new T.Color(palettes.ivory)).lerp(new T.Color(0x709dbf),level*.70);
      if(m==='tension_pogo'){const contact=tensionDebug?.contact??p<.30;for(const l of legs){l.footMat.color.setHex(contact?0x4d83b4:0xa6bccb);l.shinMat.color.setHex(contact?0x7ea8c4:palettes.context);}}
      if(tensionDebug)tensionDebug.tensionEmphasis=level;
    }
    function tensionFootPoints(l,live=false){
      if(!live&&l.tensionFootPoints)return l.tensionFootPoints;
      l.foot.updateWorldMatrix(true,true);
      const inverse=l.foot.matrixWorld.clone().invert(),points=[];
      l.foot.traverse(o=>{
        if(!o.isMesh)return;
        const matrix=inverse.clone().multiply(o.matrixWorld),attr=o.geometry.attributes.position;
        for(let i=0;i<attr.count;i++)points.push(new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(matrix));
      });
      if(!live)l.tensionFootPoints=points;
      return points;
    }
    function poseTension(m,phase){
      const p=T.MathUtils.clamp(phase,0,1),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),lift=.5-.5*Math.cos(p*Math.PI*2);
      for(const item of tensionSpineMeshes)item.mesh.material=item.highlight;
      tensionEquipment.visible=true;tensionBar.visible=false;previewEquipment.visible=false;equipment.visible=false;exerciseArms.visible=true;
      pelvis.visible=torso.visible=head.visible=true;arms.forEach(x=>x.node.visible=false);scapulae.forEach(x=>x.node.visible=true);spineGroups.forEach(x=>x.node.visible=true);spineGuide.visible=false;ghost.visible=false;landmarks.forEach(x=>x.visible=false);torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=false;});
      for(const key in regionMaterials)regionMaterials[key].color.setHex(key==='context'?palettes.context:palettes.ivory);
      for(const l of legs){l.root.visible=l.femur.visible=l.shin.visible=l.foot.visible=true;l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(palettes.ivory);}
      floor.visible=true;floor.scale.set(1.8,1.8,1);floorRing.visible=false;
      if(m==='tension_pogo'){poseTensionPogo(p);return;}
      if(m==='tension_pushup'){
        const oldMovement=state.movement,oldScenario=state.scenario;state.movement='pushup';state.scenario='b';poseHorizontalExercise(lift);state.movement=oldMovement;state.scenario=oldScenario;
        tensionDebug={...exerciseDebug,movement:m,phase:p,contacts:exerciseDebug.contacts};tensionHighlight(m,p);return;
      }
      if(m==='tension_swing'||m==='tension_cat'){poseTensionSwingCat(m,lift);tensionHighlight(m,lift);tensionDebug.cyclePhase=p;return;}
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),jointChecks=[],armChecks=[];
      let origin,Q,bar=null,footPitch=0,footLift=0,kneeTargets=null;
      if(m==='tension_deadlift'){
        const frame=tensionDeadliftFrame(lift);origin=frame.origin;Q=frame.Q;bar=frame.bar;kneeTargets=frame.kneeTargets;tensionBar.visible=true;tensionBar.position.copy(bar);
      }else{
        const contact=p<.24,u=contact?p/.24:(p-.24)/.76;footLift=contact?0:.38*Math.sin(Math.PI*u);footPitch=contact?.38-.20*Math.sin(Math.PI*u):.43;
        Q=new T.Quaternion();const f=legs[0],qFoot=new T.Quaternion().setFromAxisAngle(V(1,0,0),footPitch);let minY=Infinity;for(const x of tensionFootPoints(f))minY=Math.min(minY,x.clone().applyQuaternion(qFoot).y);
        const ankleY=.08-minY+footLift,compression=contact?.10*Math.sin(Math.PI*u):0;origin=V(0,ankleY+L1+L2+.17-.04-compression,.02);
      }
      const turn=(x,y,z)=>V(x,y,z).applyQuaternion(Q).add(origin);
      pelvis.position.copy(origin);pelvis.quaternion.copy(Q);pelvis.updateMatrixWorld(true);torso.position.copy(turn(0,1.42,0));torso.quaternion.copy(Q);head.position.copy(turn(0,2.95,-.08));head.quaternion.copy(Q);
      for(const v of spineGroups){v.node.position.copy(turn(0,v.y-3.3,v.z));v.node.quaternion.copy(Q);}sternum.position.copy(sternumRest);
      for(const l of legs){
        const fQ=new T.Quaternion().setFromAxisAngle(V(1,0,0),footPitch);let minY=Infinity;for(const x of tensionFootPoints(l))minY=Math.min(minY,x.clone().applyQuaternion(fQ).y);
        const A=V(l.side*.61,.08-minY+footLift,.045),H=pelvis.localToWorld(V(l.side*.51,-.17,.005)),K=kneeTargets?.get(l.side)||twoJoint(H,A,L1,L2,V(0,0,1)),fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(V(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,1,1);l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(V(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,1,1);l.root.updateMatrixWorld(true);l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(fQ);l.foot.scale.set(1,1,1);
        jointChecks.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),footMinHeight:minY+A.y,footPitch});
      }
      for(const arm of exArms){const s=arm.side,S=turn(s*1.04,2.25,.02);let E,W,G;
        if(m==='tension_deadlift'){G=bar.clone().add(V(s*.65,0,0));const dir=G.clone().sub(S).normalize();W=G.clone().addScaledVector(dir,-.17);E=twoJoint(S,W,1.08,.98,V(s*.25,0,.20));}
        else{const upper=V(s*.06,-1,.03).normalize(),fore=V(s*.02,-1,.08).normalize();E=S.clone().addScaledVector(upper,1.08);W=E.clone().addScaledVector(fore,.98);G=W.clone().addScaledVector(fore,.17);}
        poseSegment(arm.clavicle,turn(0,2.40,.30),S);poseSegment(arm.upper,S,E);poseSegment(arm.fore,E,W);poseHand(arm,W,G.clone().sub(W).normalize(),m==='tension_deadlift'?G:null);armChecks.push({side:s,shoulder:S.toArray(),elbow:E.toArray(),wrist:W.toArray(),grip:G.toArray(),upperLength:S.distanceTo(E),foreLength:E.distanceTo(W)});
      }
      model.updateMatrixWorld(true);tensionDebug={movement:m,phase:p,lift,joints:jointChecks,legs:jointChecks,arms:armChecks,bar:bar?.toArray(),contacts:{floorHeight:.08,footLift},trunkPitch:new T.Euler().setFromQuaternion(Q).x};tensionHighlight(m,p);
    }

    // New teaching examples only. Parent controller owns the playback phase.
    const tensionBellGroup=new T.Group();scene.add(tensionBellGroup);tensionBellGroup.visible=false;
    const tensionBellMaterial=new T.MeshStandardMaterial({color:0x344f6b,roughness:.65,metalness:.12});
    const tensionBellBody=mesh(new T.SphereGeometry(1,24,16),tensionBellMaterial,tensionBellGroup);tensionBellBody.position.y=-.43;tensionBellBody.scale.set(.34,.36,.29);
    const tensionBellBase=mesh(new T.CylinderGeometry(.23,.25,.065,20),tensionBellMaterial,tensionBellGroup);tensionBellBase.position.y=-.72;
    // A straight two-hand grip sits between the curved sides of the handle.
    const bellHandle=new T.CurvePath();
    const handlePoint=(x,y)=>new T.Vector3(x,y,0);
    bellHandle.add(new T.CubicBezierCurve3(handlePoint(-.22,-.18),handlePoint(-.43,-.10),handlePoint(-.54,.19),handlePoint(-.38,.19)));
    bellHandle.add(new T.LineCurve3(handlePoint(-.38,.19),handlePoint(.38,.19)));
    bellHandle.add(new T.CubicBezierCurve3(handlePoint(.38,.19),handlePoint(.54,.19),handlePoint(.43,-.10),handlePoint(.22,-.18)));
    mesh(new T.TubeGeometry(bellHandle,64,.045,12,false),tensionBellMaterial,tensionBellGroup);
    const bellGrip=handlePoint(.18,.19);
    function poseTensionSwingCat(m,phase){
      const p=T.MathUtils.clamp(phase,0,1),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=(lo,hi,v)=>{const t=T.MathUtils.clamp((v-lo)/(hi-lo),0,1);return t*t*(3-2*t);},cat=m==='tension_cat';
      // The model's knee center sits above the load-bearing patellar surface.
      const kneelingKneeY=.277;
      tensionBellGroup.visible=!cat;previewEquipment.visible=false;equipment.visible=false;exerciseArms.visible=true;
      torso.visible=head.visible=pelvis.visible=true;spineGuide.visible=false;ghost.visible=false;landmarks.forEach(o=>o.visible=false);arms.forEach(o=>o.node.visible=false);scapulae.forEach(o=>o.node.visible=true);
      torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=false;});
      floor.visible=true;floorRing.visible=false;floor.scale.set(cat?2.0:1.8,cat?3.5:2.5,1);
      for(const k in regionMaterials)regionMaterials[k].color.setHex(k==='context'?palettes.context:palettes.ivory);
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),legChecks=[],armChecks=[];

      function fixLeg(l,H,K,A,footQ){
        const fd=K.clone().sub(H),sd=A.clone().sub(K);l.root.position.copy(H);l.root.rotation.set(0,0,0);l.femur.quaternion.setFromUnitVectors(V(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,1,1);l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(V(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,1,1);l.root.updateMatrixWorld(true);l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(footQ);l.foot.scale.set(1,1,1);l.root.visible=l.femur.visible=l.shin.visible=l.foot.visible=true;l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(palettes.ivory);
        const minFoot=Math.min(...tensionFootPoints(l,cat).map(v=>v.clone().applyQuaternion(footQ).add(A).y));legChecks.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),femurLength:H.distanceTo(K),tibiaLength:K.distanceTo(A),footMinHeight:minFoot});
      }
      let origin,centreAt,angleAt,turn,pelvisPitch,gripCentre=null,bellOrigin=null,bellRotation=null,swingAngle=0,flex=0;
      if(!cat){
        const extension=smooth(.02,.76,p),pitch=1.25*(1-extension);origin=V(0,2.75+.52*extension,-1.0*(1-extension));pelvisPitch=pitch*.78;
        centreAt=r=>V(0,r,-.14+.025*Math.sin(r/2.5*Math.PI*2)).applyAxisAngle(V(1,0,0),pitch).add(origin);angleAt=()=>pitch;turn=v=>centreAt(v[1]).add(V(v[0],0,v[2]+.14).applyAxisAngle(V(1,0,0),pitch));
        const S=turn([0,2.25,.02]),lat=1.04-bellGrip.x,sag=Math.sqrt(2.22*2.22-lat*lat);
        swingAngle=-.68+2.14*smooth(.08,1,p);
        gripCentre=S.clone().add(V(0,-Math.cos(swingAngle)*sag,Math.sin(swingAngle)*sag));
        bellRotation=new T.Quaternion().setFromAxisAngle(V(1,0,0),-swingAngle);
        bellOrigin=gripCentre.clone().sub(V(0,bellGrip.y,bellGrip.z).applyQuaternion(bellRotation));
      }else{
        flex=-Math.cos(Math.PI*p);pelvisPitch=Math.PI/2-.18*flex;
        const hipY=1.50+kneelingKneeY+.08*flex,kneeY=kneelingKneeY,kneeZ=-1.0,dx=.64-.51,hipZ=kneeZ-Math.sqrt(Math.max(.001,L1*L1-dx*dx-Math.pow(hipY-kneeY,2))),offset=V(0,-.17,.005).applyAxisAngle(V(1,0,0),pelvisPitch);origin=V(0,hipY-offset.y,hipZ-offset.z);
        const startY=origin.y+.14,L=2.25,endY=2.30;
        centreAt=r=>{const rr=Math.min(r,L),t=rr/L;let y=startY+(endY-startY)*t+.30*flex*Math.sin(Math.PI*t);if(r>L)y+=(r-L)*((endY-startY)/L-.30*flex*Math.PI/L);return V(0,y,origin.z+r);};
        angleAt=r=>{const h=.004,d=centreAt(r+h).sub(centreAt(Math.max(0,r-h)));return Math.atan2(d.z,d.y);};turn=v=>centreAt(v[1]).add(V(v[0],0,v[2]+.14).applyAxisAngle(V(1,0,0),angleAt(v[1])));
      }
      pelvis.position.copy(origin);pelvis.rotation.set(pelvisPitch,0,0);pelvis.updateMatrixWorld(true);torso.position.copy(turn([0,1.42,0]));const torsoAngle=angleAt(1.85);torso.rotation.set(torsoAngle,0,0);torso.updateMatrixWorld(true);head.position.copy(turn([0,2.95,-.08]));head.rotation.set(angleAt(2.95),0,0);
      for(const v of spineGroups){v.node.visible=true;v.node.position.copy(centreAt(v.y-3.3));v.node.rotation.set(angleAt(v.y-3.3),0,0);}
      for(let i=0;i<ribs.length;i++){const r=ribs[i],level=2.35-Math.floor(i/2)*.132;r.position.copy(torso.worldToLocal(centreAt(level)));r.rotation.set(angleAt(level)-torsoAngle,0,0);r.scale.set(1,1,1);}sternum.position.copy(sternumRest);
      const swingRaise=cat?0:smooth(.12,1,p);
      for(const s of scapulae){const level=1.95,theta=angleAt(level),pro=cat?.22+.32*(flex+1)/2:.04+.21*swingRaise,off=V(s.side*(.64+.14*pro),0,-.20+.23*pro).applyAxisAngle(V(1,0,0),theta);s.node.position.copy(torso.worldToLocal(centreAt(level).add(off)));s.node.rotation.set(theta-torsoAngle,-s.side*(.20+.58*pro),s.side*.26*swingRaise);}
      for(const l of legs){
        const H=pelvis.localToWorld(V(l.side*.51,-.17,.005));let K,A,footQ;
        if(cat){
          K=V(l.side*.64,kneelingKneeY,-1.0);
          const support=supportedFoot(l,K.x,0,1.45,0,.08,1.14);
          footQ=support.quaternion;A=support.ankle;
          A.z=K.z-Math.sqrt(L2*L2-(A.y-K.y)**2);
        }
        else{footQ=new T.Quaternion();const minY=Math.min(...tensionFootPoints(l).map(v=>v.y));A=V(l.side*.68,.08-minY,.04);K=twoJoint(H,A,L1,L2,V(0,0,1));}
        fixLeg(l,H,K,A,footQ);
      }
      for(const a of exArms){
        const side=a.side,S=turn([side*1.04,2.25,.02]);let G,W,E,handDirection;
        if(cat){G=V(side*1.04,.12,.87);W=G.clone().add(V(0,0,-.17));E=twoJoint(S,W,1.08,.98,V(side*.15,0,-1));handDirection=V(0,0,1);}
        else{
          G=V(side*bellGrip.x,bellGrip.y,bellGrip.z).applyQuaternion(bellRotation).add(bellOrigin);
          a.contactAxis=V(1,0,0).applyQuaternion(bellRotation);
          handDirection=G.clone().sub(S).normalize();W=G.clone().addScaledVector(handDirection,-.17);E=twoJoint(S,W,1.08,.98,V(side*.2,-1,.1));
        }
        poseSegment(a.clavicle,turn([0,2.40,.30]),S);poseSegment(a.upper,S,E);poseSegment(a.fore,E,W);poseHand(a,W,handDirection,G);
        armChecks.push({side,shoulder:S.toArray(),elbow:E.toArray(),wrist:W.toArray(),grip:G.toArray(),upperLength:S.distanceTo(E),foreLength:E.distanceTo(W),wristReach:S.distanceTo(W)});
      }
      if(!cat){tensionBellGroup.position.copy(bellOrigin);tensionBellGroup.quaternion.copy(bellRotation);}
      model.updateMatrixWorld(true);tensionDebug={movement:m,phase:p,pelvisPitch,spine:[0,.5,1,1.5,2,2.5,2.95].map(r=>centreAt(r).toArray()),legs:legChecks,arms:armChecks,contacts:cat?{knees:legChecks.map(l=>l.knee),palms:armChecks.map(a=>a.grip),floor:.08}:{feet:legChecks.map(l=>l.ankle),floor:.08},bell:gripCentre?.toArray(),phaseLabel:cat?(flex>0?'Round':'Extend'):p<.30?'Backswing':p<.70?'Hip Drive':'Float',segmentalMotion:cat};
    }

    function applyPose(amount=state.amount){
      setJointPose(amount);
      fitCostalCartilage?.();
      if(exerciseArms.visible&&!previewDebug)fitShoulderGirdle?.fitHands(state.movement);
      fitShoulderGirdle?.(state.movement);
      const armChecks=(tensionDebug||exerciseDebug)?.arms;
      if(armChecks&&fitShoulderGirdle&&exerciseArms.visible){
        for(const sample of armChecks){
          const arm=exArms.find(item=>item.side===sample.side);
          const upper=arm.fore.position.clone().sub(arm.upper.position);
          const fore=new T.Vector3(0,-arm.fore.scale.y,0).applyQuaternion(arm.fore.quaternion);
          sample.elbow=arm.fore.position.toArray();sample.wrist=arm.hand.position.toArray();
          sample.upperLength=upper.length();sample.foreLength=fore.length();
          if('elbowAngle' in sample)sample.elbowAngle=180-T.MathUtils.radToDeg(upper.angleTo(fore));
          if('humeralElevation' in sample){
            const up=new T.Vector3(0,1,0).applyQuaternion(torso.quaternion);
            const forward=new T.Vector3(0,0,1).applyQuaternion(torso.quaternion);
            sample.humeralElevation=180-T.MathUtils.radToDeg(upper.angleTo(up));
            sample.humeralSagittal=T.MathUtils.radToDeg(Math.atan2(upper.dot(forward),-upper.dot(up)));
          }
          if('wristReach' in sample)sample.wristReach=arm.upper.position.distanceTo(arm.hand.position);
          if(arm.fittedContact)sample.grip=arm.fittedContact.toArray();
        }
        const details=tensionDebug||exerciseDebug;
        if(details.contacts?.hands)details.contacts.hands=armChecks.map(sample=>sample.grip);
        if(details.contacts?.palms)details.contacts.palms=armChecks.map(sample=>sample.grip);
      }
      for(const leg of legs) leg.fitPatella?.();
    }
    function setJointPose(amount){
      const a=Math.max(-1,Math.min(1,amount)),chain=state.mode==='chain',selectedSide=state.side==='right'?-1:1,m=state.movement;
      restoreStudyMaterials();for(const item of tensionSpineMeshes)item.mesh.material=item.original;previewEquipment.visible=false;previewDebug=null;tensionEquipment.visible=false;tensionBellGroup.visible=false;tensionDebug=null;
      exerciseArms.visible=false;equipment.visible=false;exerciseDebug=null;
      pelvis.rotation.set(0,0,0);pelvis.position.set(0,3.3,0);torso.rotation.set(0,0,0);torso.position.set(0,4.72,0);head.rotation.set(0,0,0);head.position.set(0,6.25,-.08);
      for(const l of legs){l.root.position.set(l.baseX,3.13,.01);l.root.rotation.set(0,0,0);l.femur.rotation.set(0,0,0);l.shin.position.set(l.side*.10,-1.63,0);l.shin.rotation.set(0,0,0);l.shin.scale.set(1,1,1);l.femur.scale.set(1,1,1);l.foot.position.set(0,-1.31,.04);l.foot.rotation.set(0,0,0);l.foot.scale.set(1,1,1);l.mid.rotation.set(0,0,0);l.mid.position.y=0;l.mid.scale.y=1;l.poseFootArch(0);l.poseToes?.(0);}
      for(let i=0;i<ribs.length;i++){const r=ribs[i];r.position.set(0,.93-Math.floor(i/2)*.132,-.30);r.rotation.set(0,0,0);r.scale.set(1,1,1);for(const c of r.children){if(c.isMesh&&c.userData.azRestPositions){c.geometry.attributes.position.array.set(c.userData.azRestPositions);c.geometry.attributes.position.needsUpdate=true;if(c.userData.azRestNormals){c.geometry.attributes.normal.array.set(c.userData.azRestNormals);c.geometry.attributes.normal.needsUpdate=true;}else c.geometry.computeVertexNormals();}}}
      for(const s of scapulae){s.node.position.set(s.side*.64,.53,-.36);s.node.rotation.set(0,-s.side*.20,0);}
      spineGuide.rotation.x=0;spineGuide.position.z=0;
      for(const s of spineGroups){s.node.position.set(0,s.y,s.z);s.node.rotation.set(0,0,0);}
      pressureMarks.forEach(p=>p.node.visible=false);floor.visible=false;floorRing.visible=false;floor.position.set(0,.08,0);
      sternum.position.copy(sternumRest);
      if(tensionIds.has(m)){poseTension(m,Math.max(0,a));return;}
      if(previewIds.has(m)){posePreview(a);return;}
      if(exerciseIds.has(m)){poseExercise(Math.max(0,a));return;}
      function scap(pro){for(const s of scapulae){s.node.position.x=s.side*(.64+.098*pro);s.node.position.z=-.36+.12*pro;s.node.rotation.y=-s.side*(.20+.30*pro);s.node.rotation.z=s.side*pro*.025;}}
      function spine(flex){spineGuide.rotation.x=flex*.035;spineGuide.position.z=-flex*.05;for(let i=0;i<spineGroups.length;i++){const s=spineGroups[i],f=(i+1)/spineGroups.length;s.node.position.z=s.z-flex*Math.sin(f*Math.PI)*.16;s.node.rotation.x=flex*.12;}}
      // Express pelvic motions about their anatomical reference. Both hip
      // centers lie on the tilt axis. The opposite hip is the stance pivot for a hike.
      function pivotPelvis(localPivot){
        const rotated=localPivot.clone().applyQuaternion(pelvis.quaternion);
        pelvis.position.add(localPivot).sub(rotated);
      }
      if(m==='hike'){
        const angle=selectedSide*a*.12;
        pelvis.rotation.set(0,chain?-selectedSide*a*.08:0,angle);
        pivotPelvis(new T.Vector3(-selectedSide*.51,-.17,.005));
        if(chain){
          // A small amount of starting knee flexion allows a planted-foot
          // comparison in either direction without lengthening either leg.
          pelvis.position.y-=.16;torso.position.y-=.16;head.position.y-=.16;
          for(const v of spineGroups)v.node.position.y-=.16;
          torso.rotation.z=-angle*.25;
        }
      }
      if(m==='tilt'||(m==='chain'&&!chain)){
        pelvis.rotation.x=(m==='tilt'?a*.18:-a*.17);
        pivotPelvis(new T.Vector3(0,-.17,.005));
      }
      if(m==='hip'){
        const leg=legs.find(l=>l.side===selectedSide);
        const shaft=new T.Vector3(leg.side*.10,-1.63,0).normalize();
        leg.femur.quaternion.setFromAxisAngle(shaft,leg.side*a*.32);
        // The shank follows the femur with no extra twist at the knee or ankle.
        leg.shin.quaternion.copy(leg.femur.quaternion);
      }
      if(m==='ribs'){
        if(fitCostalCartilage?.moveRibs)fitCostalCartilage.moveRibs(a);
        else for(const r of ribs){r.rotation.x=-a*.105;r.scale.x=1+a*.055;r.scale.z=1+a*.035;}
        sternum.position.y+=a*.043;sternum.position.z+=a*.025;
        if(chain)spine(-a*.25);
      }
      if(m==='ribshift'){torso.position.z=-a*.19;if(chain){scap(a);spine(a*.7);pelvis.rotation.x=-a*.10;}}
      if(m==='scapula'){scap(a);if(chain){torso.position.z=-a*.15;spine(a*.5);}}
      if(m==='foot'){const l=legs.find(l=>l.side===selectedSide);l.foot.rotation.z=l.side*a*.055;l.poseFootArch(a);if(chain){l.shin.rotation.y=-l.side*a*.16;l.femur.rotation.y=-l.side*a*.11;pelvis.rotation.y=-selectedSide*a*.045;}}
      if(m==='chain'&&chain){pelvis.rotation.x=-a*.17;pelvis.position.z=-a*.07;torso.position.z=-a*.19;torso.rotation.x=a*.055;scap(a);spine(a*.85);}
      if(['ribs','ribshift','scapula','chain'].includes(m)||m==='hike'&&chain){
        // The rib heads and thoracic vertebrae belong to the same moving cage.
        // Lumbar motion still transitions separately into the pelvis.
        torso.updateMatrix();
        for(const vertebra of spineGroups.slice(5)){
          vertebra.node.position.set(0,vertebra.y-4.72,vertebra.z).applyMatrix4(torso.matrix);
          vertebra.node.quaternion.copy(torso.quaternion);
        }
        head.position.set(0,1.53,-.08).applyMatrix4(torso.matrix);
        head.quaternion.copy(torso.quaternion);
        if(m==='ribshift'||m==='scapula'&&chain||m==='chain'&&chain||m==='hike'&&chain){
          // Blend the five lumbar vertebrae between their two moving references.
          pelvis.updateMatrix();
          for(let i=0;i<5;i++){
            const v=spineGroups[i],fraction=(i+1)/6;
            const lower=new T.Vector3(0,v.y-3.3,v.z).applyMatrix4(pelvis.matrix);
            const upper=new T.Vector3(0,v.y-4.72,v.z).applyMatrix4(torso.matrix);
            v.node.position.copy(lower).lerp(upper,fraction);
            v.node.quaternion.copy(pelvis.quaternion).slerp(torso.quaternion,fraction);
          }
        }
      }
      pelvis.updateMatrixWorld(true);
      if(m==='hike'&&chain)for(const leg of legs){
        const H=pelvis.localToWorld(new T.Vector3(leg.side*.51,-.17,.005));
        const A=supportedFoot(leg,leg.side*.61,.045).ankle;
        const F=new T.Vector3(leg.side*.10,-1.63,0),S=new T.Vector3(0,-1.31,.04);
        const K=twoJoint(H,A,F.length(),S.length(),new T.Vector3(0,0,1));
        const thigh=K.clone().sub(H).normalize(),shank=A.clone().sub(K).normalize();
        leg.femur.quaternion.setFromUnitVectors(F.normalize(),thigh);
        leg.shin.quaternion.setFromUnitVectors(S.normalize(),shank);
        if(leg.side===selectedSide){
          leg.femur.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(thigh,leg.side*a*.22));
          leg.shin.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(shank,leg.side*a*.10));
        }
        leg.foot.quaternion.copy(leg.shin.quaternion).invert();
      }
      if(m!=='foot'){
        // Each segment can have its own axial rotation, but its proximal
        // joint still belongs at the end of the preceding segment.
        for(const leg of legs){
          leg.root.position.copy(pelvis.localToWorld(new T.Vector3(leg.side*.51,-.17,.005)));
          const knee=leg.femur.localToWorld(new T.Vector3(leg.side*.10,-1.63,0));
          leg.shin.position.copy(leg.root.worldToLocal(knee));
        }
      }
      if(m==='foot'&&chain){
        // A mildly flexed loaded-leg example. Axial rotation and adduction are
        // independent joint motions, rather than one rigid leg rotation.
        pelvis.position.y=3.3-.055-.012*Math.abs(a);pelvis.position.x=-selectedSide*a*.025;pelvis.rotation.y=-selectedSide*a*.045;pelvis.rotation.z=selectedSide*a*.015;pelvis.updateMatrixWorld(true);
        const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04);
        for(const l of legs){
          const selected=l.side===selectedSide,desiredFoot=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),selected?l.side*a*.055:0);
          l.poseFootArch(selected?a:0);model.updateMatrixWorld(true);
          const inverse=l.foot.matrixWorld.clone().invert();let minY=Infinity;
          l.foot.traverse(o=>{if(!o.isMesh)return;const transform=inverse.clone().multiply(o.matrixWorld),v=new T.Vector3(),p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)minY=Math.min(minY,v.fromBufferAttribute(p,i).applyMatrix4(transform).applyQuaternion(desiredFoot).y);});
          const H=pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005)),A=new T.Vector3(l.side*.61,.092-minY,.045),D=A.clone().sub(H),d=Math.min(L1+L2-.001,D.length()),axis=D.clone().normalize();
          const along=(L1*L1-L2*L2+d*d)/(2*d),radius=Math.sqrt(Math.max(0,L1*L1-along*along));
          const bend=new T.Vector3(selected?-l.side*a*.95:0,0,1);bend.addScaledVector(axis,-bend.dot(axis)).normalize();
          const K=H.clone().addScaledVector(axis,along).addScaledVector(bend,radius),femDir=K.clone().sub(H),shinDir=A.clone().sub(K);
          l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(new T.Vector3(l.side*.10,-1.63,0).normalize(),femDir.clone().normalize());
          const femTwist=new T.Quaternion().setFromAxisAngle(femDir.clone().normalize(),selected?l.side*a*.26:0);l.femur.quaternion.premultiply(femTwist);
          l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(new T.Vector3(0,-1.31,.04).normalize(),shinDir.clone().normalize());
          const tibTwist=new T.Quaternion().setFromAxisAngle(shinDir.clone().normalize(),selected?l.side*a*.20:0);l.shin.quaternion.premultiply(tibTwist);
          l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(desiredFoot);
          l.poseFootArch(selected?a:0);
        }
      }
      if(m==='foot'){
        floor.visible=true;floor.scale.set(chain?1.15:.42,chain?.65:.55,1);floor.position.x=chain?0:selectedSide*.61;floor.position.z=.23;
        model.updateMatrixWorld(true);
        for(const l of legs){
          if(!chain&&l.side!==selectedSide)continue;
          const clearance=.012,dy=.08+clearance-footWorldMinimum(l);
          // Translate the isolated shank as a unit. Chain mode already solves
          // the ankle height before positioning the knee and the connected shin.
          if(!chain)l.root.position.y+=dy;
          const p=pressureMarks.find(p=>p.side===l.side),selected=l.side===selectedSide,t=selected?a:0;
          p.node.visible=true;
          const sole=l.foot.localToWorld((l.footRegistration||new T.Vector3()).clone());
          p.node.position.set(sole.x,.084,sole.z);
          p.patches.medial.scale.x=.033+.031*t;p.patches.medial.material.opacity=.25+.22*t;
          p.patches.forefoot.scale.x=.146+.012*t;p.patches.lateral.scale.x=.032-.004*t;
        }
      }else{floor.position.x=0;floor.position.z=0;}
      const active=m==='hike'||m==='tilt'?'pelvis':m==='hip'?'femur':m==='ribs'||m==='ribshift'?'thorax':m==='scapula'?'scapula':m==='foot'?'foot':'all';
      for(const key in regionMaterials){const material=regionMaterials[key];let color=palettes[key]||palettes.ivory;if(key==='ivory'||key==='context')color=key==='context'?palettes.context:palettes.ivory;else if(active!=='all'&&key!==active&&!(key==='femur'&&['hike','hip'].includes(m)))color=palettes.ivory;material.color.setHex(color);}
      for(const l of legs){const selected=l.side===selectedSide,linked=m==='foot'&&chain;
        l.femurMat.color.setHex(m==='hip'&&selected?palettes.pelvis:linked&&selected?0x7ea8c4:palettes.ivory);l.shinMat.color.setHex(linked&&selected?0x7ea8c4:palettes.context);l.footMat.color.setHex(m==='foot'&&selected?palettes.foot:palettes.ivory);
      }
      if(m==='foot'&&chain)pelvicM.color.setHex(0x9bb5c9);
      // Keep the selected region visually isolated. Context is added only in Chain mode.
      const upper=['ribs','ribshift','scapula'].includes(m),whole=m==='chain'&&chain;
      pelvis.visible=chain||m==='ribshift'||(!upper&&m!=='foot');
      torso.visible=upper||chain;head.visible=chain;arms.forEach(x=>x.node.visible=chain);
      torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=chain;});
      scapulae.forEach(x=>x.node.visible=chain||m==='scapula');
      spineGroups.forEach(x=>x.node.visible=chain||upper);spineGuide.visible=false;
      for(const l of legs){
        l.root.visible=chain||(!upper&&(m!=='foot'||l.side===selectedSide));
        l.femur.visible=m!=='foot'||chain;l.shin.visible=chain||m==='foot';l.foot.visible=chain||m==='foot';
      }
      landmarks.forEach(x=>x.visible=state.labels&&['hike','tilt'].includes(m));
      ghost.visible=state.ghost&&Math.abs(a)>.08;model.updateMatrixWorld(true);
    }
    function capturePose(){
      model.updateMatrixWorld(true);
      const nodes={},point=(n,p=new T.Vector3())=>n.localToWorld(p).toArray();
      const add=(key,node)=>{nodes[key]={matrix:node.matrixWorld.toArray(),visible:node.visible};};
      add('pelvis',pelvis);add('torso',torso);add('head',head);
      spineGroups.forEach((v,i)=>add('spine_'+i,v.node));
      ribs.forEach((v,i)=>add('rib_'+i,v));scapulae.forEach(v=>add('scap_'+(v.side===1?'l':'r'),v.node));
      const limb={};
      for(const l of legs){
        const key=l.side===1?'l':'r',a=arms.find(a=>a.side===l.side),e=exArms.find(a=>a.side===l.side),ex=exerciseArms.visible;
        add('foot_'+key,l.foot);add('femur_'+key,l.femur);add('shin_'+key,l.shin);
        l.footBones.forEach((node,i)=>add('foot_'+key+'_'+i,node));
        limb[key]={hip:point(l.root),knee:point(l.shin),ankle:point(l.foot),
          shoulder:ex?point(e.upper):point(a.node),elbow:ex?point(e.fore):point(a.node,new T.Vector3(l.side*.16,-1.06,.04)),
          wrist:ex?point(e.hand):point(a.node,new T.Vector3(l.side*.08,-1.91,.18)),handFrame:(ex?e.hand:a.node).matrixWorld.toArray(),grip:ex?(e.fittedContact?.toArray()||point(e.hand,new T.Vector3(0,-.17,0))):null,
          handEnd:ex?point(e.hand,new T.Vector3(0,-.245,.08)):point(a.node,new T.Vector3(l.side*.08,-2.31,.25)),
          footEnd:point(l.foot,new T.Vector3(0,-.045,.44)),footMinimum:footWorldMinimum(l,true),handMinimum:ex?new T.Box3().setFromObject(e.hand,true).min.y:null,
          visible:{thigh:l.root.visible&&l.femur.visible,calf:l.root.visible&&l.shin.visible,foot:l.root.visible&&l.foot.visible,arm:ex||a.node.visible}};
      }
      return {movement:state.movement,amount:state.amount,mode:state.mode,side:state.side,nodes,limb,tensionEmphasis:tensionDebug?.tensionEmphasis||0};
    }
    applyPose(0);rebuildGhost();
    function focus(){
      const m=state.movement,chain=state.mode==='chain';
      // Reserve the full horizontal motion envelope when the viewport narrows.
      function frame(x,y,z,verticalDistance,horizontalSpan){
        target.set(x,y,z);
        const widthDistance=horizontalSpan/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.aspect);
        distance=Math.max(verticalDistance,widthDistance);
      }
      if(tensionIds.has(m)){
        const horizontal=m==='tension_pushup'||m==='tension_cat';
        frame(0,horizontal?1.4:m==='tension_pogo'?3.5:3.15,m==='tension_swing'?.4:m==='tension_cat'?-.2:.2,
          horizontal?9.2:m==='tension_swing'?13.8:13.7,m==='tension_pushup'?8.05:horizontal?7.35:m==='tension_swing'?5.5:4.4);
      }else if(previewIds.has(m))frame(0,3.15,.10,13.8,4.0);
      else if(m==='lunge')frame(0,3.05,.05,12.7,4.3);
      else if(m==='pushup'||m==='bench')frame(0,m==='pushup'?1.4:1.8,m==='pushup'?.2:-.25,m==='bench'?9.0:8.4,m==='pushup'?8.05:7.35);
      else if(exerciseIds.has(m)){
        const y=m==='pullup'?4.68:m==='dips'?3.7:m==='press'?3.3:3.1;
        const depth=m==='pullup'?15.5:m==='dips'?13.4:m==='press'?13.2:m==='row'?13.7:12.4;
        frame(0,y,m==='row'?1.1:.1,depth,m==='press'?5.4:4.7);
      }else if(m==='ribshift')frame(0,4.55,.06,5.6,2.15);
      else if(m==='ribs'||m==='scapula')frame(0,5.0,.10,4.2,m==='scapula'?2.85:2.1);
      else if(chain)frame(0,3.34,.05,12.4,3.0);
      else if(m==='foot')frame(state.side==='right'?-.61:.61,.29,.24,2.25,1.02);
      else frame(0,2.73,.05,5.0,2.05);
    }
    function resize(){
      if(disposed)return;
      const currentDistance=distance;
      focus();
      const userZoom=currentDistance/distance;
      width=Math.max(150,container.clientWidth);
      height=Math.max(200,container.clientHeight||500);
      camera.aspect=width/height;
      focus();
      distance=T.MathUtils.clamp(distance*userZoom,1.3,50);
      if(renderer)renderer.setSize(width,height,false);
      else{
        canvas.width=width*pixelRatio;
        canvas.height=height*pixelRatio;
        ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
      }
      render();
    }
    const ro=new ResizeObserver(resize);ro.observe(container);
    focus();applyPose();resize();
    return {
      debugPoseSnapshot:capturePose,
      zoomCamera,
      debugCamera:()=>({yaw,pitch,distance,target:target.toArray()}),
      update(next){const previous=state.movement,side=state.side,mode=state.mode;state=Object.assign({},state,next);if(previous!==state.movement||mode!==state.mode||(side!==state.side&&state.movement==='foot')){focus();applyPose(0);rebuildGhost();}applyPose();render();},
      setView(name){if(name==='front'){yaw=0;pitch=.04;}else if(name==='back'){yaw=Math.PI;pitch=.04;}else if(name==='side'){yaw=Math.PI/2;pitch=.04;}else{yaw=tensionIds.has(state.movement)?1.00:previewIds.has(state.movement)&&state.movement[0]==='c'?1.05:state.movement==='squat'?.75:state.movement==='bench'?1.10:state.movement==='lunge'?.90:state.movement==='foot'?(state.side==='right'?.95:-.95):state.movement==='hip'?(state.side==='right'?-.45:.45):.45;pitch=state.movement==='bench'?.42:state.movement==='lunge'?.12:.10;}render();},
      resetCamera(){yaw=0;pitch=.04;focus();render();},resize,
      dispose(){
        if(disposed)return;disposed=true;fitShoulderGirdle?.dispose();drag=null;ro.disconnect();
        clearCanvasEvents();
        const geometries=new Set(),materials=new Set([...Object.values(regionMaterials),studyPadMat,studyRibMat,studyScapMat,studyBenchScapMat,...tensionSpineMaterials.values(),steel,seatMat,dumbbellHeads,landmarkM,cavityM,floorMat,ghostMaterial]);
        scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const material of Array.isArray(o.material)?o.material:[o.material])materials.add(material);if(o.userData.azOriginalMaterial)materials.add(o.userData.azOriginalMaterial);});
        for(const geometry of geometries)geometry.dispose();
        for(const material of materials)material.dispose();
        if(renderer)releaseRenderer(renderer);
        container.replaceChildren();
      },
      debugFoot(){
        if(state.movement!=='foot')return null;model.updateMatrixWorld(true);
        const l=legs.find(l=>l.side===(state.side==='right'?-1:1)),p=pressureMarks.find(p=>p.side===l.side);
        const archPoint=l.footLandmarks?new T.Vector3():new T.Vector3(-l.side*.053,.035,.13);
        return {side:state.side,amount:state.amount,boneCount:l.footBones.length,boneNames:l.footBones.map(n=>n.name),archHeight:l.navicular.localToWorld(archPoint).y-.08,minBoneHeight:footWorldMinimum(l),floorHeight:.08,contactVisible:p.node.visible,medialContactWidth:p.patches.medial.scale.x*2,contactCue:'Illustrative contact area, not measured pressure'};
      },
      debugTension(){return tensionDebug;},
      debugPreview(){return previewDebug;},
      debugExercise(){return exerciseDebug;},
      debugPose(){model.updateMatrixWorld(true);return legs.map(l=>({side:l.side,hip:l.root.getWorldPosition(new T.Vector3()).toArray(),acetabulum:pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005)).toArray(),kneeFromFemur:l.femur.localToWorld(new T.Vector3(l.side*.10,-1.63,0)).toArray(),kneeFromShin:l.shin.getWorldPosition(new T.Vector3()).toArray(),ankle:l.foot.getWorldPosition(new T.Vector3()).toArray()}));},
      get isFallback(){return !renderer;}
    };
  };
})();
