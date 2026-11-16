(function(){
  'use strict';
  function createCanvasViewer(container){
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    const canvasEvents=[];function onCanvas(type,fn,options){canvas.addEventListener(type,fn,options);canvasEvents.push(()=>canvas.removeEventListener(type,fn,options));}
    let state={movement:'hike',amount:.55,mode:'local',side:'right',labels:false,ghost:false},yaw=0,pitch=.04,zoom=1,w=640,h=490,disposed=false;
    canvas.setAttribute('aria-label','Interactive schematic anatomy. Drag to rotate.');canvas.setAttribute('role','img');Object.assign(canvas.style,{width:'100%',height:'100%',display:'block',touchAction:'none'});container.appendChild(canvas);
    let focusY=2.75,scale=65;
    function rotate(p,rx=0,ry=0,rz=0){let[x,y,z]=p;let yy=y*Math.cos(rx)-z*Math.sin(rx),zz=y*Math.sin(rx)+z*Math.cos(rx);y=yy;z=zz;let xx=x*Math.cos(ry)+z*Math.sin(ry);zz=-x*Math.sin(ry)+z*Math.cos(ry);x=xx;z=zz;return[x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz),z];}
    function project(p){let v=rotate([p[0],p[1]-focusY,p[2]],pitch,yaw,0);return[w/2+v[0]*scale,h*.53-v[1]*scale,v[2]];}
    function path(points,color,width=1,fill=null,close=false){ctx.beginPath();for(let i=0;i<points.length;i++){const p=project(points[i]);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}if(close)ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=color;ctx.lineWidth=width*scale;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
    function orb(p,rx,ry,color){const q=project(p);ctx.beginPath();ctx.ellipse(q[0],q[1],Math.max(1,rx*scale),Math.max(1,ry*scale),0,0,Math.PI*2);const grad=ctx.createRadialGradient(q[0]-rx*scale*.3,q[1]-ry*scale*.3,1,q[0],q[1],Math.max(rx,ry)*scale);grad.addColorStop(0,color);grad.addColorStop(1,color==='#d8e1e9'?'#b8c6d4':color);ctx.fillStyle=grad;ctx.fill();}
    function bone(a,b,r,color){path([a,b],'#becbd8',r*2+.015);path([a,b],color,r*2);orb(a,r*1.3,r*1.25,color);orb(b,r*1.35,r*1.2,color);}
    function drawExerciseFallback(t){
      const m=state.movement,b=state.scenario==='b',p=Math.max(0,Math.min(1,t)),add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),norm=a=>mul(a,1/Math.max(.0001,Math.hypot(...a)));
      let hy=3.3,hz=0,angle=0,feetY=.19,feetZ=.045,lift=0;
      if(m==='rdl'){hy-=.55*p;hz=-1.18*p;angle=(b?1.38:1.20)*p;}
      if(m==='squat'){hy-=(b?1.19:1.52)*p;hz=-.1-.46*p;angle=.1+.4*p;}
      if(m==='press'||m==='row'){hy=2.24;hz=-.08;angle=b?-.025:.07;feetY=b?.63:.19;feetZ=1.40;path([[-.85,1.65,-.6],[.85,1.65,-.6],[.85,1.65,.4],[-.85,1.65,.4]],'#abc0d3',.10,null,true);if(b)path([[-.85,.52,1],[.85,.52,1],[.85,.52,1.85],[-.85,.52,1.85]],'#abc0d3',.08,null,true);}
      if(m==='dips'){hy=3.85-.9*p;angle=b?-.055+.235*p:0;for(const side of [-1,1])path([[side*1.1,3.9,-.85],[side*1.1,3.9,.9]],'#58728b',.08);}
      if(m==='pullup'){lift=1.67*p;hy+=lift;hz=b?-.08-.16*p:0;angle=b?-.095*(.65+.35*p):0;path([[-1.62,7.7,.12],[1.62,7.7,.12]],'#58728b',.07);}
      const H=[0,hy,hz],tr=a=>add(rotate(a,angle,0,0),H);
      function elbow(A,B,L1,L2,dir){const D=sub(B,A),len=Math.min(L1+L2-.001,Math.hypot(...D)),axis=norm(D),x=(L1*L1-L2*L2+len*len)/(2*len),r=Math.sqrt(Math.max(0,L1*L1-x*x)),bend=norm(sub(dir,mul(axis,dot(dir,axis))));return add(add(A,mul(axis,x)),mul(bend,r));}
      path([tr([-.85,.45,0]),tr([-.3,.65,0]),tr([.3,.65,0]),tr([.85,.45,0]),tr([.60,-.35,.05]),tr([0,-.45,.15]),tr([-.60,-.35,.05])],'#b0c4d3',.10,'#dcd9ce',true);
      for(let i=0;i<12;i++){const y=2.35-i*.12,w=.50+Math.sin(i/13*Math.PI)*.33,pts=[];for(let j=0;j<=24;j++){const a=j/24*Math.PI*2;pts.push(tr([w*Math.sin(a),y-.13*Math.sin(a),.14+.38*Math.cos(a)]));}path(pts,'#dcd9ce',.055);}
      bone(tr([0,.40,-.15]),tr([0,2.52,-.20]),.075,'#c5c7c3');const skull=tr([0,3.10,-.08]);orb(skull,.28,.35,'#dcd9ce');path([tr([-.23,3.10,.20]),tr([.23,3.10,.20])],'#344354',.065);
      let centre=m==='rdl'?[0,3.52-1.74*p+.11*Math.sin(Math.PI*p),.30+(b?.39*p:0)]:m==='squat'?tr([0,2.23,-.28]):m==='row'?tr([0,2.07,1.8-1.07*p]):null;
      if(centre&&m!=='row'){path([add(centre,[-1.6,0,0]),add(centre,[1.6,0,0])],'#58728b',.06);for(const side of[-1,1])orb(add(centre,[side*1.35,0,0]),.12,.25,'#58728b');}
      for(const side of [-1,1]){
        const hip=tr([side*.51,-.17,.005]),A=m==='pullup'?[side*.61,.19+lift,hz+.045]:m==='dips'?[side*.61,.75-.25*p,-.28]:[side*.61,feetY,feetZ],K=elbow(hip,A,1.633,1.311,[0,0,1]);bone(hip,K,.065,'#dcd9ce');bone(K,A,.05,'#c5c7c3');bone(add(A,[0,-.08,-.1]),add(A,[0,-.08,.55]),.075,'#dcd9ce');
        const S=tr([side*1.04,2.25,.02]);let G=m==='pullup'?[side*1.04,7.7,.12]:m==='dips'?[side*1.1,3.9,.10]:m==='press'?tr([side*1.1,2.35+1.68*p,.3]):add(centre,[side*(m==='squat'?1.25:.66),0,0]),W=add(G,mul(norm(sub(S,G)),.17)),E=elbow(S,W,1.08,.98,[side*.5,0,m==='row'?-.8:.25]);bone(S,E,.055,'#dcd9ce');bone(E,W,.043,'#dcd9ce');bone(W,G,.055,'#dcd9ce');if(m==='press')path([add(G,[-.25,0,0]),add(G,[.25,0,0])],'#58728b',.12);
      }
    }
    function drawModel(a,alpha=1){
      ctx.globalAlpha=alpha;const m=state.movement,s=state.side==='right'?-1:1,chain=state.mode==='chain';if(['rdl','squat','press','row','pullup','dips'].includes(m)){drawExerciseFallback(a);return;}
      const upper=['ribs','ribshift','scapula'].includes(m),whole=m==='chain'&&chain,showPelvis=chain||(!upper&&m!=='foot'),showTorso=upper||chain;
      const pelvisC=['hike','tilt','hip','chain'].includes(m)?'#709dbf':'#dce2e7',ribC=['ribs','ribshift','chain'].includes(m)?'#709dbf':'#aebdc8',scapC=['scapula','chain','ribshift'].includes(m)?'#709dbf':'#aebdc8';
      const hike=m==='hike'?s*a*.12:0,tilt=m==='tilt'?a*.18:m==='chain'?-a*.17:0;
      function pelvisPoint(p){let q=rotate(p,tilt,chain&&m==='hike'?-s*a*.08:0,hike);return[q[0]-(m==='hike'?s*a*.035:0),q[1]+3.3-(m==='hike'?Math.abs(a)*.078:0),q[2]];}
      let shift=(m==='ribshift'||(m==='chain'&&chain)||(m==='scapula'&&chain))?-a*.19:0;
      function trunk(p){return[p[0],p[1]+4.72,p[2]+shift];}
      if(showTorso)path([[0,3.55,-.16],[0,4.05,-.035],[0,4.70,-.06],[0,5.30,-.22],[0,5.80,-.28]],'#aebdc8',.12);
      for(const side of [-1,1]){
        if((upper&&!chain)||(m==='foot'&&!chain&&side!==s))continue;
        let hip=pelvisPoint([side*.51,-.17,.005]);const ir=(m==='hip'||(chain&&['hike','foot','tilt'].includes(m)))?-side*a*.26:0;
        let knee=[hip[0]+side*.1+(m==='foot'&&chain&&side===s?-side*a*.24:(ir?-side*a*.07:0)),1.63,.16+Math.max(0,3.13-hip[1])*.7],ankle=[side*.61,.22,.03];
        const femC='#dce2e7';if(m!=='foot'||chain){bone(hip,[hip[0]+side*.18,hip[1]-.18,.02],.085,femC);bone([hip[0]+side*.18,hip[1]-.18,.02],knee,.061,femC);orb(knee,.14,.095,femC);orb([knee[0],knee[1],.11],.075,.10,'#aebdc8');}if(m==='foot'||chain){bone([knee[0]-.025,knee[1]-.12,0],ankle,.052,'#aebdc8');bone([knee[0]+side*.1,knee[1]-.13,-.02],[ankle[0]+side*.1,.20,0],.023,'#aebdc8');}
        const isFoot=(m==='foot'||(chain&&['hip','hike'].includes(m)))&&side===s,footC=isFoot?'#91bcb0':'#d6dcd6',ev=isFoot?side*a*.14:0;
        function fp(p){let q=rotate(p,0,ir,ev);return[q[0]+ankle[0],q[1]+.13,q[2]+.08];}
        if(m==='foot'||chain){orb(fp([0,.02,-.09]),.10,.07,footC);orb(fp([0,.025,.12]),.11,.055,footC);
        for(let j=0;j<5;j++){const xx=-side*(.10-j*.049);bone(fp([xx,.01,.17]),fp([xx*1.25,-.02,.38-j*.009]),j===0?.028:.020,footC);for(let k=0;k<3;k++)orb(fp([xx*1.25,-.024,.43+k*.055-j*.01]),.022,.019,footC);}}
      }
      if(showPelvis)for(const side of [-1,1]){
        const outline=[[side*.23,-.21,-.10],[side*.29,.09,-.14],[side*.22,.39,-.15],[side*.40,.59,-.13],[side*.67,.65,-.08],[side*.87,.52,.0],[side*.90,.23,.05],[side*.76,-.10,.06],[side*.52,-.25,.02]].map(pelvisPoint);path(outline,'#7599c6',.018,pelvisC,true);
        path([[side*.24,.42,-.13],[side*.48,.61,-.12],[side*.73,.59,-.06],[side*.89,.43,.04]].map(pelvisPoint),'#b7cdea',.057);
        path([[side*.71,.04,0],[side*.58,-.25,.08],[side*.42,-.47,.22],[side*.15,-.47,.36],[0,-.32,.39]].map(pelvisPoint),pelvisC,.095);
        path([[side*.59,-.14,.04],[side*.40,-.03,.22],[side*.15,-.12,.34],[0,-.32,.39]].map(pelvisPoint),pelvisC,.075);
        if(state.labels&&alpha===1)orb(pelvisPoint([side*.86,.30,.10]),.035,.035,'#4167b5');
      }
      if(showPelvis)path([[-.23,.35,-.22],[.23,.35,-.22],[.16,-.15,-.22],[0,-.35,-.22],[-.16,-.15,-.22]].map(pelvisPoint),'#779ac5',.015,pelvisC,true);
      if(showTorso)for(let i=11;i>=0;i--)for(const side of [-1,1]){
        const yy=.93-i*.132,wide=.46+Math.sin((i+1)/14*Math.PI)*.38,deep=.30+Math.sin(i/14*Math.PI)*.18,inhale=m==='ribs'?a:0,pts=[];
        for(let j=0;j<=32;j++){let t=j/32*Math.PI*(i<7?.96:.95-(i-6)*.075);pts.push(trunk([side*(.08+wide*Math.sin(t))*(1+inhale*.055),yy-.16*Math.sin(t)+inhale*.06*Math.sin(t),-.30+deep*(1-Math.cos(t))*(1+inhale*.04)]));}
        path(pts,'#789da8',.064);path(pts,ribC,.046);
      }
      if(showTorso)bone(trunk([0,.99,.39]),trunk([0,-.02,.59]),.052,ribC);
      let pro=m==='scapula'||(m==='chain'&&chain)||(m==='ribshift'&&chain)?a:0;
      if(m==='scapula'||chain)for(const side of [-1,1]){
        let sx=side*(.64+.14*pro),sz=-.36+.23*pro;
        function sp(p){let q=rotate(p,0,-side*(.20+.58*pro),0);return trunk([q[0]+sx,q[1]+.53,q[2]+sz]);}
        path([[-.17,.25,0],[.20,.14,0],[.04,-.43,0],[-.17,-.12,0]].map(sp),'#8d82b0',.018,scapC,true);path([[-.19,.13,.03],[.03,.11,.06],[.23,.22,.08]].map(sp),'#beb4dd',.05);
      }
      if(chain){
        orb([0,6.40,-.07],.29,.35,'#dcd9ce');orb([0,6.20,.16],.22,.16,'#dcd9ce');
        for(const side of [-1,1]){orb([side*.115,6.28,.255],.066,.052,'#626961');
          path([[side*.21,6.17,.08],[side*.20,6.01,.17],[0,5.98,.28]],'#c5c7c3',.06);
          path([trunk([0,1,.33]),trunk([side*.46,1.05,.24]),trunk([side*.98,.91,.10])],'#c5c7c3',.065);
          const shoulder=trunk([side*1.04,.83,.02]),elbow=trunk([side*1.20,-.23,.06]),wrist=trunk([side*1.15,-1.10,.21]);bone(shoulder,elbow,.054,'#dcd9ce');bone(elbow,wrist,.033,'#dcd9ce');
          for(let j=0;j<5;j++){const x=side*(1.05+j*.045);bone(trunk([x,-1.13,.20]),trunk([x+side*(j-2)*.018,-1.49+(j===0?.1:0),.23]),.016,'#dcd9ce');}
        }
      }
      if(state.labels&&alpha===1){
        function text(name,p,dx=0,dy=0){let q=project(p);ctx.font='500 11px system-ui,sans-serif';let tw=ctx.measureText(name).width,x=Math.min(w-tw-12,Math.max(12,q[0]+dx)),y=Math.min(h-16,Math.max(75,q[1]+dy));ctx.fillStyle='rgba(248,251,255,.94)';ctx.fillRect(x-5,y-13,tw+10,20);ctx.fillStyle='#58718e';ctx.fillText(name,x,y);}
        if(['hike','hip','tilt','chain'].includes(m)){text('Pelvis',pelvisPoint([1.13,.32,.03]));text('Femur',[-1.03,2.35,0],-20,0);}
        if(['ribs','ribshift','scapula','chain'].includes(m))text('Ribcage',[1.15,5.12,.10+shift]);
        if(['scapula','chain','ribshift'].includes(m))text('Scapula',[-1.12,5.50,-.3+shift],-20,0);
        if(m==='foot'){text('Heel',[s*.61,.22,-.2],-50,0);text('Medial arch',[s*.61,.19,.35],28,20);}
      }
      ctx.globalAlpha=1;
    }
    function draw(){if(disposed)return;ctx.clearRect(0,0,w,h);const m=state.movement;focusY=['ribs','ribshift','scapula'].includes(m)?5.0:m==='foot'?(state.mode==='chain'?3.34:.32):m==='chain'&&state.mode==='chain'?3.34:state.mode==='chain'?3.34:2.73;const span=['ribs','ribshift','scapula'].includes(m)?2.5:m==='foot'?(state.mode==='chain'?7.4:1.35):m==='chain'&&state.mode==='chain'?7.4:state.mode==='chain'?7.4:3.1;scale=(h-72)/span*zoom;if(['rdl','squat','press','row','pullup','dips'].includes(m)){focusY=m==='pullup'?4.0:3.1;scale=(h-72)/(m==='pullup'?9.0:7.6)*zoom;}const old=state.labels;if(state.ghost&&Math.abs(state.amount)>.1){state.labels=false;drawModel(0,.12);state.labels=old;}drawModel(state.amount);}
    function resize(){if(disposed)return;w=Math.max(150,container.clientWidth);h=Math.max(200,container.clientHeight||490);let r=Math.min(window.devicePixelRatio||1,2);canvas.width=w*r;canvas.height=h*r;ctx.setTransform(r,0,0,r,0,0);draw();}
    let drag=null;onCanvas('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});onCanvas('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.008;pitch=Math.max(-.45,Math.min(.65,pitch+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];draw();});onCanvas('pointerup',()=>drag=null);onCanvas('pointercancel',()=>drag=null);onCanvas('wheel',e=>{e.preventDefault();zoom=Math.max(.6,Math.min(1.7,zoom*(e.deltaY>0?.94:1.06)));draw();},{passive:false});const ro=new ResizeObserver(resize);ro.observe(container);resize();
    return{update(next){if(next.movement&&next.movement!==state.movement)zoom=1;state=Object.assign({},state,next);draw();},setView(name){yaw=name==='front'?0:name==='back'?Math.PI:name==='side'?Math.PI/2:.45;pitch=.06;draw();},resetCamera(){yaw=0;pitch=.04;zoom=1;draw();},resize,dispose(){if(disposed)return;disposed=true;ro.disconnect();for(const off of canvasEvents.splice(0))off();canvas.remove();},isFallback:true};
  }
  window.createAnatomyViewer=function(container,initial={}){
    const T=window.THREE;
    if(!T)return createCanvasViewer(container);
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
    const landmarks=[];for(const s of [-1,1])landmarks.push(sphere(pelvis,s*.86,.30,.10,.042,.042,.042,landmarkM));
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
    const scapulae=[];
    for(const s of [-1,1]){
      const g=new T.Group();torso.add(g);scapulae.push({node:g,side:s});
      const p=plate(g,[[-.17,.25],[.20,.14],[.04,-.43],[-.17,-.12]],.045,mat('scapula'));p.rotation.y=-s*.25;
      tube(g,[[-.19,.13,.025],[.03,.11,.06],[.23,.22,.08]],.040,mat('scapula'));
    }
    // Clavicles and arms provide spatial context for scapular travel.
    const arms=[];
    for(const s of [-1,1]){
      tube(torso,[[0,1.00,.33],[s*.46,1.05,.24],[s*.98,.91,.10]],.04,ctxM);
      const a=new T.Group();a.position.set(s*1.04,.83,.02);torso.add(a);arms.push({node:a,side:s});
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
      between(shin,[s*.12,-.08,-.015],[s*.105,-1.27,.00],.025,.03,ctxM);
      sphere(shin,0,-1.24,.02,.075,.085,.075,ctxM);
      const foot=new T.Group();foot.position.set(0,-1.31,.04);shin.add(foot);
      const heel=sphere(foot,0,-.006,-.075,.108,.087,.16,footM);heel.rotation.x=.12;
      sphere(foot,0,.045,.045,.093,.075,.098,footM);
      sphere(foot,-s*.042,.014,.145,.074,.058,.07,footM);
      sphere(foot,s*.063,-.03,.155,.058,.05,.081,footM);
      const mid=new T.Group();foot.add(mid);
      for(let j=0;j<3;j++)sphere(mid,-s*(.078-j*.047),.004-j*.012,.217-j*.006,.033,.046,.054,footM);
      const rays=[];
      for(let j=0;j<5;j++){
        const x=-s*(.10-j*.05);const z=.435-(j/4)*.075;const ray=new T.Group();mid.add(ray);rays.push(ray);
        between(ray,[x,-.015,.22],[x*1.2,-.038,z],j===0?.027:.021,j===0?.030:.023,footM);
        for(let k=0;k<(j===0?2:3);k++)sphere(ray,x*1.17,-.045,z+.052+k*(j===0?.064:.052),j===0?.030:.020,.025,j===0?.039:.030,footM);
      }
      const femurMat=femM.clone(),shinMat=ctxM.clone(),footMat=footM.clone();
      femur.traverse(o=>{if(o.isMesh)o.material=femurMat;});shin.traverse(o=>{if(o.isMesh)o.material=shinMat;});foot.traverse(o=>{if(o.isMesh)o.material=footMat;});
      legs.push({side:s,root,femur,shin,foot,mid,rays,baseX:s*.51,femurMat,shinMat,footMat});
    }
    // Optional original-source anatomical meshes can replace schematic forms
    // while retaining the existing articulation groups and contact solution.
    if(typeof window.azAttachAnatomyMeshes==='function'){
      try{window.azAttachAnatomyMeshes({THREE:T,pelvis,head,legs,materials:{bone:boneM,context:ctxM,pelvis:pelvicM},cervicalMeshes,mesh});}catch(e){console.warn('Anatomical mesh attachment unavailable; using schematic forms.',e);}
    }
    const exerciseIds=new Set(['rdl','squat','press','row','pullup','dips','pushup','bench','lunge']);
    const exerciseArms=new T.Group();model.add(exerciseArms);
    const equipment=new T.Group();scene.add(equipment);
    const steel=new T.MeshStandardMaterial({color:0x58728b,roughness:.58,metalness:.16});
    const seatMat=new T.MeshStandardMaterial({color:0xabc0d3,roughness:.9});
    const studyPadMat=new T.MeshStandardMaterial({color:0x9db5ca,roughness:.86,transparent:true,opacity:.45,depthWrite:false,side:T.DoubleSide});studyPadMat.userData.azStudyAlpha=true;
    const studyRibMat=new T.MeshStandardMaterial({color:0xdcd9ce,roughness:.8,transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide});studyRibMat.userData.azStudyAlpha=true;
    const studyScapMat=new T.MeshStandardMaterial({color:0x7195b0,roughness:.76});
    const studyBenchScapMat=new T.MeshStandardMaterial({color:0x416f96,roughness:.76,transparent:true,opacity:1,depthTest:false,depthWrite:false,side:T.DoubleSide});studyBenchScapMat.userData.azStudyAlpha=true;studyBenchScapMat.userData.azStudyOverlay=true;
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
    function box(parent,size,pos,material){const m=mesh(new T.BoxGeometry(...size),material,parent);m.position.set(...pos);return m;}
    const barbell=new T.Group();equipment.add(barbell);between(barbell,[-1.6,0,0],[1.6,0,0],.035,.035,steel);
    for(const side of [-1,1]){const p=mesh(new T.CylinderGeometry(.26,.26,.12,24),steel,barbell);p.rotation.z=Math.PI/2;p.position.x=side*1.35;}
    const dumbbellHeads=new T.MeshStandardMaterial({color:0x304b65,roughness:.62,metalness:.12});
    const dumbbells=[];for(const side of [-1,1]){const g=new T.Group();equipment.add(g);between(g,[-.35,0,0],[.35,0,0],.043,.043,steel);for(const x of [-.29,.29]){const w=mesh(new T.CylinderGeometry(.205,.205,.18,6),dumbbellHeads,g);w.rotation.z=Math.PI/2;w.position.x=x;}dumbbells.push({side,node:g});}
    const seat=new T.Group();equipment.add(seat);box(seat,[1.72,.15,1.0],[0,1.65,-.08],seatMat);for(const side of [-1,1])between(seat,[side*.65,1.57,-.15],[side*.65,.05,-.15],.045,.045,steel);
    const pressChair=new T.Group();equipment.add(pressChair);box(pressChair,[1.72,.15,1.30],[0,1.65,-.23],studyPadMat);for(const side of [-1,1])between(pressChair,[side*.65,1.57,-.15],[side*.65,.05,-.15],.045,.045,steel);
    const pressBackrest=new T.Group();pressChair.add(pressBackrest);box(pressBackrest,[1.60,3.10,.16],[0,0,0],studyPadMat);for(const side of [-1,1])between(pressBackrest,[side*.57,-1.45,-.13],[side*.57,1.35,-.13],.034,.034,steel);pressBackrest.rotation.x=-12*Math.PI/180;pressBackrest.position.set(0,3.25,-.90);
    const footrest=box(equipment,[1.7,.12,.9],[0,.52,1.42],seatMat);
    const rowHandle=new T.Group();equipment.add(rowHandle);between(rowHandle,[-1.15,0,0],[1.15,0,0],.035,.035,steel);
    const cable=mesh(new T.CylinderGeometry(.011,.011,1,8),steel,equipment);
    const pullBar=new T.Group();equipment.add(pullBar);between(pullBar,[-1.62,0,0],[1.62,0,0],.038,.038,steel);pullBar.position.set(0,7.7,.12);
    const dipBars=new T.Group();equipment.add(dipBars);for(const side of [-1,1]){between(dipBars,[side*1.1,3.9,-.85],[side*1.1,3.9,.90],.045,.045,steel);between(dipBars,[side*1.1,.08,-.75],[side*1.1,3.9,-.75],.045,.045,steel);between(dipBars,[side*1.1,.08,-1.10],[side*1.1,.08,.75],.045,.045,steel);}
    const flatBench=new T.Group();equipment.add(flatBench);box(flatBench,[1.68,.18,4.85],[0,.98,-1.03],studyPadMat);for(const z of [-2.70,.65]){between(flatBench,[0,.89,z],[0,.12,z],.065,.065,steel);between(flatBench,[-.85,.10,z],[.85,.10,z],.055,.055,steel);}
    const benchBar=new T.Group();equipment.add(benchBar);between(benchBar,[-2.45,0,0],[2.45,0,0],.042,.042,steel);for(const side of [-1,1]){const p=mesh(new T.CylinderGeometry(.30,.30,.16,24),steel,benchBar);p.rotation.z=Math.PI/2;p.position.x=side*2.12;}
    let exerciseDebug=null;
    function twoJoint(A,B,L1,L2,bend){const delta=B.clone().sub(A),realD=delta.length(),d=Math.max(.001,Math.min(L1+L2-.0001,realD)),axis=delta.normalize();const x=(L1*L1-L2*L2+d*d)/(2*d),r=Math.sqrt(Math.max(0,L1*L1-x*x)),v=bend.clone().addScaledVector(axis,-bend.dot(axis)).normalize();return A.clone().addScaledVector(axis,x).addScaledVector(v,r);}
    function poseSegment(group,A,B){const v=B.clone().sub(A);group.position.copy(A);group.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),v.clone().normalize());group.scale.set(1,v.length(),1);}
    function poseHorizontalExercise(phase){
      const m=state.movement,b=state.scenario==='b',push=m==='pushup',smooth=(lo,hi,x)=>{const v=T.MathUtils.clamp((x-lo)/(hi-lo),0,1);return v*v*(3-2*v);};
      exerciseArms.visible=true;equipment.visible=true;equipment.children.forEach(o=>o.visible=false);flatBench.visible=!push;benchBar.visible=!push;floor.visible=true;floor.scale.set(2.1,3.5,1);
      const pro=push?(b?.18+.64*Math.pow(1-phase,2):.08):b?-.64+.025*Math.sin(Math.PI*phase):-.12;
      const bow=(r,lo,hi)=>r<=lo||r>=hi?0:Math.pow(Math.sin(Math.PI*(r-lo)/(hi-lo)),2);
      let delta=.33,origin,U,F,baseAngle,benchLift=0;
      const anchor=new T.Vector3(0,.44,-2.65);
      function setFrame(d){delta=d;U=new T.Vector3(0,Math.sin(d),Math.cos(d));F=new T.Vector3(0,-Math.cos(d),Math.sin(d));origin=anchor.clone().addScaledVector(U,3.08);baseAngle=Math.PI/2-d;}
      const spineOffset=r=>-.14+.035*Math.sin(r/2.5*Math.PI*2)+(push?-(b?.055*Math.pow(1-phase,2):0)*bow(r,.9,2.60)-(b?.035:0)*bow(r,.12,1.25):(b?.31:.025)*bow(r,.12,1.65)-((b?.18:.13)+benchLift)*smooth(.10,1.80,r));
      const centreAt=r=>origin.clone().addScaledVector(U,r).addScaledVector(F,spineOffset(r));
      const angleAt=r=>{const d=centreAt(r+.008).sub(centreAt(Math.max(0,r-.008)));return Math.atan2(d.z,d.y);};
      const turn=p=>centreAt(p[1]).add(new T.Vector3(p[0],0,p[2]+.14).applyAxisAngle(new T.Vector3(1,0,0),angleAt(p[1])));
      if(push){
        const targetElbow=(172-82*phase)*Math.PI/180,targetDistance=Math.sqrt(1.08*1.08+.98*.98-2*1.08*.98*Math.cos(targetElbow));let lo=.10,hi=.45;
        for(let i=0;i<24;i++){setFrame((lo+hi)/2);const S=turn([1.04,2.25,.02]),W=new T.Vector3(1.06,.12,1.73);const d=S.distanceTo(W);if(d>targetDistance)hi=delta;else lo=delta;}
        setFrame((lo+hi)/2);
      }else{origin=new T.Vector3(0,b?1.61:1.56,0);U=new T.Vector3(0,0,-1);F=new T.Vector3(0,1,0);baseAngle=-Math.PI/2;}
      const pelvisPitch=baseAngle+(push?(b?-.28:0):(b?.30:0));pelvis.position.copy(origin);pelvis.rotation.set(pelvisPitch,0,0);pelvis.updateMatrixWorld(true);
      if(!push&&b){benchLift=1.07-new T.Box3().setFromObject(pelvis).min.y;origin.y+=benchLift;pelvis.position.copy(origin);pelvis.updateMatrixWorld(true);}
      const torsoAngle=angleAt(1.85);torso.position.copy(turn([0,1.42,0]));torso.rotation.set(torsoAngle,0,0);torso.updateMatrixWorld(true);head.position.copy(turn([0,2.95,-.08]));if(!push)head.position.y+=.12;head.rotation.set(angleAt(2.95),0,0);
      spineGroups.forEach(v=>{const r=v.y-3.3;v.node.position.copy(centreAt(r));v.node.rotation.set(angleAt(r),0,0);v.node.visible=true;});spineGuide.visible=false;torso.visible=true;head.visible=true;pelvis.visible=true;arms.forEach(a=>a.node.visible=false);torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=false;});
      for(let i=0;i<ribs.length;i++){const r=ribs[i],level=2.35-Math.floor(i/2)*.132;r.position.copy(torso.worldToLocal(centreAt(level)));r.rotation.set(angleAt(level)-torsoAngle,0,0);r.scale.set(1,1,1);}
      sternum.position.copy(sternumRest);
      for(const s of scapulae){const level=1.95,theta=angleAt(level),offset=new T.Vector3(s.side*(.64+.16*pro),0,-.20+.25*pro).applyAxisAngle(new T.Vector3(1,0,0),theta);s.node.position.copy(torso.worldToLocal(centreAt(level).add(offset)));s.node.rotation.set(theta-torsoAngle,-s.side*(.20+.63*pro),0);s.node.visible=true;}
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),legChecks=[];
      for(const l of legs){
        const H=pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005)),A=push?new T.Vector3(l.side*.61,.44,-2.65):new T.Vector3(l.side*.72,.19,b?1.60:2.00),K=twoJoint(H,A,L1,L2,push?new T.Vector3(0,1,0):new T.Vector3(0,1,.10)),fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(new T.Vector3(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,fd.length()/L1,1);l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(new T.Vector3(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,sd.length()/L2,1);l.foot.position.copy(l.shin.worldToLocal(A.clone()));const fq=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),push?.62:0);l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(fq);l.foot.scale.y=L2/sd.length();l.root.visible=true;l.femur.visible=true;l.shin.visible=true;l.foot.visible=true;l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(!push&&b?(state.ascending?0x709dbf:0x9bb5c9):palettes.ivory);legChecks.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),footContact:push?new T.Vector3(l.side*.61,.10,-2.20).toArray():new T.Vector3(l.side*.72,.10,b?1.60:2.00).toArray()});
      }
      model.updateMatrixWorld(true);const armChecks=[];
      for(const arm of exArms){
        const side=arm.side,S=turn([side*1.04,2.25,.02]);let E,W,G,handDirection;
        poseSegment(arm.clavicle,turn([0,2.40,.30]),S);
        if(push){G=new T.Vector3(side*1.06,.12,1.90);W=G.clone().add(new T.Vector3(0,0,-.17));E=twoJoint(S,W,1.08,.98,new T.Vector3(side*.25,0,-1));handDirection=new T.Vector3(0,0,1);}
        else{G=new T.Vector3(side*1.65,S.y+2.13-1.45*phase,S.z+.52*phase);W=G.clone().add(new T.Vector3(0,-.17,0));E=twoJoint(S,W,1.08,.98,new T.Vector3(side,-.50,.60));handDirection=new T.Vector3(0,1,0);}
        poseSegment(arm.upper,S,E);poseSegment(arm.fore,E,W);arm.hand.position.copy(W);arm.hand.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),handDirection);
        const u=E.clone().sub(S).normalize(),v=W.clone().sub(E).normalize(),elbowAngle=T.MathUtils.radToDeg(Math.acos(T.MathUtils.clamp(-u.dot(v),-1,1)));armChecks.push({side,shoulder:S.toArray(),elbow:E.toArray(),wrist:W.toArray(),grip:G.toArray(),upperLength:S.distanceTo(E),foreLength:E.distanceTo(W),elbowAngle});
      }
      let bar=null;if(!push){bar=new T.Vector3().fromArray(armChecks[0].grip).add(new T.Vector3().fromArray(armChecks[1].grip)).multiplyScalar(.5);benchBar.position.copy(bar);}
      for(const key in regionMaterials)regionMaterials[key].color.setHex(key==='context'?palettes.context:palettes.ivory);if(!push&&b){for(const s of scapulae)studyMaterial(s.node,studyBenchScapMat,50);for(const r of ribs)studyMaterial(r,studyRibMat);if(!sternum.userData.azOriginalMaterial)sternum.userData.azOriginalMaterial=sternum.material;sternum.material=studyRibMat;}landmarks.forEach(x=>x.visible=false);ghost.visible=false;model.updateMatrixWorld(true);
      const contacts=push?{hands:armChecks.map(a=>a.grip),toes:legs.map(l=>l.foot.localToWorld(new T.Vector3(0,-.045,.55)).toArray()),floorHeight:.08}:{head:[0,new T.Box3().setFromObject(head).min.y,head.position.z],upperBack:turn([0,2.10,-.36]).toArray(),butt:[0,new T.Box3().setFromObject(pelvis).min.y,pelvis.position.z],feet:legs.map(l=>l.foot.localToWorld(new T.Vector3(0,-.085,-.05)).toArray()),padHeight:1.07,floorHeight:.08};
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
      function footPoints(l){
        if(l.lungeFootPoints)return l.lungeFootPoints;
        model.updateMatrixWorld(true);const inverse=l.foot.matrixWorld.clone().invert(),points=[];
        l.foot.traverse(o=>{if(!o.isMesh)return;const matrix=inverse.clone().multiply(o.matrixWorld),a=o.geometry.attributes.position;for(let i=0;i<a.count;i++)points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(matrix));});
        l.lungeFootPoints=points;return points;
      }
      for(const l of legs){
        const front=l.side===-1,theta=front?0:rear?.20*(1-phase):.48+.04*phase;
        const footQ=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),theta),points=footPoints(l).map(p=>p.clone().applyQuaternion(footQ));
        let minY=Infinity,maxZ=-Infinity;for(const p of points){minY=Math.min(minY,p.y);maxZ=Math.max(maxZ,p.z);}
        const A=new T.Vector3(l.side*.60,floorY-minY,front?1.18:-.94-maxZ),H=pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005));
        const bend=new T.Vector3(l.side===loadedSide?-l.side*.04:0,0,1),K=twoJoint(H,A,L1,L2,bend),fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(new T.Vector3(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,fd.length()/L1,1);
        l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(new T.Vector3(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,sd.length()/L2,1);
        l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(footQ);l.foot.scale.y=L2/sd.length();
        l.root.visible=true;l.femur.visible=true;l.shin.visible=true;l.foot.visible=true;l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(l.side===loadedSide?0x7ea8c4:palettes.ivory);
        let heel=Infinity,toe=Infinity;const rest=footPoints(l);for(let i=0;i<points.length;i++){if(rest[i].z<.08)heel=Math.min(heel,points[i].y+A.y);if(rest[i].z>.40)toe=Math.min(toe,points[i].y+A.y);}
        legChecks.push({side:l.side,reference:front?'Right Front':'Left Rear',loaded:l.side===loadedSide,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),heelHeight:heel,toeHeight:toe,footMinHeight:minY+A.y,footPitch:theta,frontToeZ:front?maxZ+A.z:null,rearToeZ:front?null:maxZ+A.z});
      }
      model.updateMatrixWorld(true);const armChecks=[];
      for(const arm of exArms){
        const side=arm.side,S=turn([side*1.04,2.25,.02]),u=new T.Vector3(side*.065,-1,.055).normalize().applyQuaternion(frameQ),v=new T.Vector3(side*.020,-1,.11).normalize().applyQuaternion(frameQ);
        const E=S.clone().addScaledVector(u,1.08),W=E.clone().addScaledVector(v,.98),G=W.clone().addScaledVector(v,.17);
        poseSegment(arm.clavicle,turn([0,2.40,.30]),S);poseSegment(arm.upper,S,E);poseSegment(arm.fore,E,W);arm.hand.position.copy(W);arm.hand.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),v);
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
      }
      if(m==='squat'){
        hipY=3.25-(b?2.20:2.25)*phase;hipZ=-.10-(b?.55:.46)*phase;basePitch=b?.24+.18*phase:.12+.35*phase;
        pelvisPitch=b?.30-.61*late:.045-.11*phase;
        lumbar=b?-.30+.64*smooth(.60,1,phase):-.025;
        thoracic=b?-.02+.15*smooth(.71,1,phase):0;
        floor.visible=true;floor.scale.set(1.65,1.20,1);floorRing.visible=false;
      }
      if(m==='press'||m==='row'){
        hipY=2.24;hipZ=-.08;pelvisPitch=b?-.28:.095;basePitch=b?0:.04;lumbar=b?.10:-.025;thoracic=b?.08:.015;rearShift=b?-.18:0;expansion=b?.16:.015;
        pro=m==='row'?(b?.86:.45)*(1-phase)+(b?.16:-.08*phase):b?.36+.10*phase:.035;
        feetY=b?.67:.19;feetZ=1.40;seat.visible=true;footrest.visible=b;
      }
      if(m==='press'){basePitch=b?-.29:-.18;seat.visible=false;pressChair.visible=true;}
      if(m==='dips'){
        hipY=3.83-1.02*phase+(b?.036:.063)*Math.pow(1-phase,2);hipZ=0;pelvisPitch=.015;basePitch=.025+.045*phase;
        lumbar=b?.015+.035*phase:0;thoracic=b?-.12+.43*phase:0;pro=b?.03+.16*phase:.03;
        dipBars.visible=true;floor.visible=true;floor.scale.set(2.05,1.75,1);
      }
      if(m==='pullup'){
        bodyLift=1.67*phase;hipY=3.27+bodyLift;hipZ=b?-.06-.10*phase:0;pelvisPitch=0;basePitch=0;
        thoracic=b?-.25*(.90+.10*phase):0;cervical=b?.08*(1-.40*phase):0;rearShift=b?-.05-.05*phase:0;pro=-.10*phase;pullBar.visible=true;
      }
      pelvis.position.set(0,hipY,hipZ);pelvis.rotation.set(pelvisPitch,0,0);pelvis.updateMatrixWorld(true);
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
      const explicitPullVectors=side=>{
        const frame=armFrame(2.25),elevation=(170-140*phase)*Math.PI/180,lateral=side*(.06+.06*phase),front=Math.sqrt(Math.max(0,Math.pow(Math.sin(elevation),2)-lateral*lateral));
        const upper=frame.up.clone().multiplyScalar(-Math.cos(elevation)).addScaledVector(frame.forward,front);upper.x=lateral;
        const fx=(side*1.20-side*1.04-1.08*lateral)/1.15,fz=(b?.25:.03)*(1-phase)+.40*phase,fy=Math.sqrt(Math.max(.01,1-fx*fx-fz*fz));
        const fore=frame.up.clone().multiplyScalar(fy).addScaledVector(frame.forward,fz);fore.x=fx;
        return {upper:upper.normalize(),fore:fore.normalize()};
      };
      if(m==='press'){
        // One fixed support plane is shared by both foot conditions. The pelvis
        // and ribcage settle in front of it; the bench never follows the rep.
        const normal=new T.Vector3(0,Math.sin(12*Math.PI/180),Math.cos(12*Math.PI/180)),theta=angleAt(1.95),setupPro=b?.36:.035;
        const offset=new T.Vector3(0,0,-.20+.23*setupPro-expansion*.55).applyAxisAngle(new T.Vector3(1,0,0),theta),reference=centreAt(1.95).add(offset);
        const frontPlane=normal.y*3.25+normal.z*(-.90)+.08;
        hipZ+=(frontPlane+.06-(normal.dot(reference)-.08))/normal.z;pelvis.position.z=hipZ;pelvis.updateMatrixWorld(true);
      }
      if(m==='pullup'){
        // Fixed hands and a prescribed humeral descent determine body travel.
        // This prevents an overhead upper arm merely folding at the elbow.
        const vectors=explicitPullVectors(1),G=new T.Vector3(1.20,7.7,.12),desired=G.clone().addScaledVector(vectors.upper,-1.08).addScaledVector(vectors.fore,-1.15),current=turn([1.04,2.25,.02]);
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
        if(m==='pullup'){s.node.rotation.z=s.side*.38*(1-phase);s.node.position.y+=.10*(1-phase);}
      }
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),legChecks=[];
      const squatToeAngle=10*Math.PI/180;
      function squatFoot(l){
        const quaternion=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),l.side*squatToeAngle);
        if(!l.deepSquatFootPoints){model.updateMatrixWorld(true);const inverse=l.foot.matrixWorld.clone().invert(),points=[];l.foot.traverse(o=>{if(!o.isMesh)return;const matrix=inverse.clone().multiply(o.matrixWorld),attr=o.geometry.attributes.position;for(let j=0;j<attr.count;j++)points.push(new T.Vector3().fromBufferAttribute(attr,j).applyMatrix4(matrix));});l.deepSquatFootPoints=points;}
        let minY=Infinity;for(const p of l.deepSquatFootPoints)minY=Math.min(minY,p.clone().applyQuaternion(quaternion).y);
        return {quaternion,ankle:new T.Vector3(l.side*.78,.08-minY,.045),minY};
      }
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
        const planted=m==='squat'?squatFoot(l):null;
        const A=planted?planted.ankle:m==='pullup'?new T.Vector3(l.side*.61,.19+bodyLift,hipZ+.045):m==='dips'?new T.Vector3(l.side*.61,1.75-.40*phase,-.72):new T.Vector3(l.side*.61,feetY,feetZ);
        const K=m==='squat'?squatKnee(H,A,l.side):twoJoint(H,A,L1,L2,new T.Vector3(0,0,1)),fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(new T.Vector3(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,fd.length()/L1,1);
        l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(new T.Vector3(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,sd.length()/L2,1);
        l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert();if(planted)l.foot.quaternion.multiply(planted.quaternion);l.foot.scale.y=L2/sd.length();
        l.root.visible=true;l.femur.visible=true;l.shin.visible=true;l.foot.visible=true;l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(palettes.ivory);
        legChecks.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),...(planted?{footYaw:l.side*squatToeAngle,footMinHeight:planted.minY+A.y,kneeAboveHip:K.y-H.y,kneeToePlaneError:new T.Vector3(Math.cos(l.side*squatToeAngle),0,-Math.sin(l.side*squatToeAngle)).dot(K.clone().sub(A))}:{})});
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
        const side=arm.side,S=turn([side*1.04,2.25,.02]),frame=armFrame(2.25);let G,bend,E,W,handDirection;
        poseSegment(arm.clavicle,turn([0,2.40,.30]),S);
        if(m==='press'){
          const elevation=(60+105*phase)*Math.PI/180,plane=40*Math.PI/180;
          const upper=frame.up.clone().multiplyScalar(-Math.cos(elevation)).addScaledVector(frame.forward,Math.sin(elevation)*Math.sin(plane));upper.x=side*Math.sin(elevation)*Math.cos(plane);upper.normalize();
          const perpendicular=frame.up.clone().addScaledVector(upper,-frame.up.dot(upper)).normalize(),elbow=(90+85*phase)*Math.PI/180;
          const fore=upper.clone().multiplyScalar(-Math.cos(elbow)).addScaledVector(perpendicular,Math.sin(elbow)).normalize();
          E=S.clone().addScaledVector(upper,1.08);W=E.clone().addScaledVector(fore,.98);G=W.clone().addScaledVector(fore,.17);handDirection=fore;
          const db=dumbbells.find(x=>x.side===side);db.node.position.copy(G);db.node.visible=true;
        }else if(m==='row'){
          const elevation=(85-100*phase)*Math.PI/180,upper=frame.up.clone().multiplyScalar(-Math.cos(elevation)).addScaledVector(frame.forward,Math.sin(elevation)).normalize(),fore=frame.forward.clone();
          E=S.clone().addScaledVector(upper,1.08);W=E.clone().addScaledVector(fore,.98);G=W.clone().addScaledVector(fore,.17);handDirection=fore;
        }else if(m==='pullup'){
          const v=explicitPullVectors(side);E=S.clone().addScaledVector(v.upper,1.08);W=E.clone().addScaledVector(v.fore,.98);G=new T.Vector3(side*1.20,7.7,.12);handDirection=v.fore;
        }else{
          if(m==='rdl'){G=gripCentre.clone();G.x=side*.65;bend=new T.Vector3(side*.15,0,.20);}
          else if(m==='squat'){G=gripCentre.clone();G.x=side*1.25;bend=new T.Vector3(side,0,-.8);}
          else if(m==='dips'){G=new T.Vector3(side*1.1,3.9,.10);bend=new T.Vector3(side*.40,0,-.90);}
          handDirection=G.clone().sub(S).normalize();W=G.clone().addScaledVector(handDirection,-.17);E=twoJoint(S,W,1.08,.98,bend);
        }
        poseSegment(arm.upper,S,E);poseSegment(arm.fore,E,W);arm.hand.position.copy(W);arm.hand.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),handDirection);
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
    for(const l of legs){const g=new T.Group();g.position.set(l.baseX,0.09,.11);scene.add(g);const m=mesh(new T.CircleGeometry(.16,32),new T.MeshBasicMaterial({color:0x3b9d97,transparent:true,opacity:.35,side:T.DoubleSide}),g);m.rotation.x=-Math.PI/2;m.scale.set(.65,1,1);pressureMarks.push({node:g,side:l.side});}
    // The reference pose is an outline, not a second opaque skeleton.
    const ghost=new T.Group();scene.add(ghost);const ghostMaterial=new T.LineBasicMaterial({color:0x6f92bd,transparent:true,opacity:.15});
    function rebuildGhost(){
      ghost.children.slice().forEach(o=>{ghost.remove(o);if(o.geometry)o.geometry.dispose();});
      model.updateMatrixWorld(true);model.traverseVisible(o=>{if(!o.isMesh||o.material===ctxM||o.parent===head)return;const line=new T.LineSegments(new T.EdgesGeometry(o.geometry,28),ghostMaterial);line.matrixAutoUpdate=false;line.matrix.copy(o.matrixWorld);ghost.add(line);});
    }
    const labelLayer=document.createElement('div');Object.assign(labelLayer.style,{position:'absolute',inset:'0',pointerEvents:'none',overflow:'hidden'});container.style.position='relative';container.appendChild(labelLayer);
    const labelNodes={};
    function label(name,position){let el=labelNodes[name];if(!el){el=document.createElement('span');el.textContent=name;Object.assign(el.style,{position:'absolute',font:'500 11px system-ui,sans-serif',color:'#516a89',background:'rgba(248,251,255,.88)',border:'1px solid rgba(172,191,217,.36)',padding:'4px 7px',borderRadius:'6px',whiteSpace:'nowrap',transform:'translate(-50%,-50%)'});labelLayer.appendChild(el);labelNodes[name]=el;}const p=position.clone().project(camera);el.style.display=p.z>1?'none':'block';el.style.left=Math.min(width-el.offsetWidth/2-8,Math.max(el.offsetWidth/2+8,(p.x*.5+.5)*width))+'px';el.style.top=Math.min(height-18,Math.max(65,(-p.y*.5+.5)*height))+'px';}
    let renderer,canvas,fallback=false,ctx;
    const canvasEvents=[];function onCanvas(type,fn,options){canvas.addEventListener(type,fn,options);canvasEvents.push(()=>canvas.removeEventListener(type,fn,options));}
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;canvas=renderer.domElement;}
    catch(e){fallback=true;canvas=document.createElement('canvas');ctx=canvas.getContext('2d');}
    canvas.setAttribute('aria-label','Interactive schematic skeleton. Drag to rotate and scroll to zoom.');canvas.setAttribute('role','img');Object.assign(canvas.style,{display:'block',width:'100%',height:'100%',touchAction:'none'});container.insertBefore(canvas,labelLayer);
    function fallbackDraw(){
      ctx.clearRect(0,0,width,height);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const tris=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),n=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3();
      scene.traverseVisible(o=>{if(!o.isMesh)return;const geom=o.geometry,p=geom.attributes.position,index=geom.index,m=o.matrixWorld,col=o.material.color;let len=index?index.count:p.count;
        for(let i=0;i<len;i+=3){const indices=[index?index.getX(i):i,index?index.getX(i+1):i+1,index?index.getX(i+2):i+2];a.fromBufferAttribute(p,indices[0]).applyMatrix4(m);b.fromBufferAttribute(p,indices[1]).applyMatrix4(m);c.fromBufferAttribute(p,indices[2]).applyMatrix4(m);ab.copy(b).sub(a);ac.copy(c).sub(a);n.crossVectors(ab,ac).normalize();const shade=.70+Math.max(0,n.dot(new T.Vector3(-.4,.6,.7).normalize()))*.28;const srgb=col.clone().convertLinearToSRGB();const color=`rgb(${Math.round(srgb.r*255*shade)},${Math.round(srgb.g*255*shade)},${Math.round(srgb.b*255*shade)})`;a.project(camera);b.project(camera);c.project(camera);if(Math.max(a.z,b.z,c.z)>1)continue;tris.push({points:[[a.x,a.y],[b.x,b.y],[c.x,c.y]],z:(a.z+b.z+c.z)/3,color,opacity:o.material.userData.azStudyAlpha?o.material.opacity:1,order:o.material.userData.azStudyOverlay?o.renderOrder:0});}
      });tris.sort((a,b)=>a.order-b.order||b.z-a.z);for(const t of tris){ctx.beginPath();t.points.forEach((p,i)=>{const x=(p[0]*.5+.5)*width,y=(-p[1]*.5+.5)*height;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.globalAlpha=t.opacity;ctx.fillStyle=t.color;ctx.fill();}ctx.globalAlpha=1;
    }
    function cameraUpdate(){camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(target);camera.updateProjectionMatrix();}
    function render(){if(disposed)return;cameraUpdate();if(renderer)renderer.render(scene,camera);else fallbackDraw();Object.values(labelNodes).forEach(el=>el.style.display='none');if(!state.labels)return;
      const movement=state.movement;
      if(movement==='lunge'&&exerciseDebug){label('Pelvis',pelvis.localToWorld(new T.Vector3(1.06,.30,.08)));const f=exerciseDebug.legs.find(l=>l.side===-1),b=exerciseDebug.legs.find(l=>l.side===1);label('Right front',new T.Vector3(...f.ankle).add(new T.Vector3(-.35,.12,.18)));label('Left rear',new T.Vector3(...b.ankle).add(new T.Vector3(.35,.12,-.15)));return;}
      if(exerciseIds.has(movement)){label('Pelvis',pelvis.localToWorld(new T.Vector3(1.06,.15,.08)));label('Shoulder',torso.localToWorld(new T.Vector3(-1.28,.83,.02)));if(['pullup','dips'].includes(movement)&&exerciseDebug){const grip=exerciseDebug.arms[0].grip;label('Fixed grip',new T.Vector3(grip[0]-.44,grip[1]+.08,grip[2]));}else label('Ribcage',torso.localToWorld(new T.Vector3(1.22,.30,.06)));return;}
      if(['hike','tilt','hip','chain'].includes(movement)){
        label('Pelvis',pelvis.localToWorld(new T.Vector3(1.20,.35,.03)));label('Femur',legs[state.side==='right'?0:1].femur.localToWorld(new T.Vector3(-.48,-.8,.03)));
        if(movement==='hike')label(state.side==='right'?'Right reference leg':'Left reference leg',new T.Vector3(state.side==='right'?-1.1:1.1,1.0,.05));
      }
      if(['ribs','ribshift','scapula'].includes(movement)||(movement==='chain'&&state.mode==='chain')){label('Ribcage',torso.localToWorld(new T.Vector3(1.28,.3,0)));if(movement!=='ribs')label('Scapula',scapulae[0].node.localToWorld(new T.Vector3(-.45,.0,-.1)));}
      if(movement==='foot'){label('Heel',legs[state.side==='right'?0:1].foot.localToWorld(new T.Vector3(-.38,.0,-.1)));label('Medial arch',legs[state.side==='right'?0:1].mid.localToWorld(new T.Vector3(.37,.0,.23)));}
    }
    const previewIds=new Set(['cgoblet','cheels','csafety']);
    let previewDebug=null;
    const previewEquipment=new T.Group();scene.add(previewEquipment);
    const previewSteel=new T.MeshStandardMaterial({color:0x365677,roughness:.66});
    const previewMetal=new T.MeshStandardMaterial({color:0x8ca3b9,roughness:.45,metalness:.45});
    const previewFoam=new T.MeshStandardMaterial({color:0x1d3046,roughness:.92});
    const goblet=new T.Group();previewEquipment.add(goblet);between(goblet,[0,-.28,0],[0,.28,0],.065,.065,previewSteel);for(const y of[-.28,.28]){const g=mesh(new T.CylinderGeometry(.23,.23,.16,6),previewSteel,goblet);g.position.y=y;}
    const straight=new T.Group();previewEquipment.add(straight);between(straight,[-1.6,0,0],[1.6,0,0],.04,.04,previewSteel);for(const x of[-1.40,1.40]){const p=mesh(new T.CylinderGeometry(.27,.27,.12,20),previewSteel,straight);p.rotation.z=Math.PI/2;p.position.x=x;}
    const safety=new T.Group();previewEquipment.add(safety);between(safety,[-1.10,0,-.12],[1.10,0,-.12],.055,.055,previewMetal);
    for(const x of[-.62,0,.62]){const pad=mesh(new T.CylinderGeometry(.13,.13,x===0?.37:.53,18),previewFoam,safety);pad.rotation.z=Math.PI/2;pad.position.set(x,0,-.12);}
    for(const side of[-1,1]){
      between(safety,[side*1.10,0,-.12],[side*1.30,-.12,-.12],.055,.055,previewMetal);
      between(safety,[side*1.30,-.12,-.12],[side*1.49,-.42,.38],.055,.055,previewMetal);
      between(safety,[side*1.30,-.42,.38],[side*1.75,-.42,.38],.055,.055,previewMetal);
      const plate=mesh(new T.CylinderGeometry(.30,.30,.15,24),previewSteel,safety);plate.rotation.z=Math.PI/2;plate.position.set(side*1.49,-.42,.38);
      between(safety,[side*.56,0,-.12],[side*.56,-.40,.84],.042,.042,previewMetal);
      between(safety,[side*.56,-.30,.59],[side*.56,-.40,.84],.068,.068,previewFoam);
    }
    const wedges=[];{const shape=new T.Shape();shape.moveTo(-.26,0);shape.lineTo(-.26,.20);shape.lineTo(.72,0);shape.closePath();const geometry=new T.ExtrudeGeometry(shape,{depth:2.24,bevelEnabled:false});const wedge=mesh(geometry,previewSteel,previewEquipment);wedge.rotation.y=-Math.PI/2;wedge.position.set(1.12,.08,0);wedges.push(wedge);}
    const balanceLine=mesh(new T.CylinderGeometry(.008,.008,1,6),new T.MeshBasicMaterial({color:0x7195b0,transparent:true,opacity:.55}),previewEquipment);
    const comDot=mesh(new T.SphereGeometry(.075,16,12),new T.MeshBasicMaterial({color:0x315bc1,depthTest:false}),previewEquipment);comDot.renderOrder=60;
    function posePreview(a){
      const m=state.movement,p=T.MathUtils.clamp(a,0,1),signed=T.MathUtils.clamp(a,-1,1),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=(lo,hi,x)=>{const t=T.MathUtils.clamp((x-lo)/(hi-lo),0,1);return t*t*(3-2*t);};
      previewEquipment.visible=true;for(const o of previewEquipment.children)o.visible=false;
      pelvis.visible=torso.visible=head.visible=true;for(const l of legs){l.root.visible=l.femur.visible=l.shin.visible=l.foot.visible=true;l.root.rotation.set(0,0,0);l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(palettes.ivory);}arms.forEach(x=>x.node.visible=true);scapulae.forEach(x=>x.node.visible=true);spineGroups.forEach(v=>v.node.visible=true);spineGuide.visible=false;ghost.visible=false;landmarks.forEach(x=>x.visible=false);torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=true;});
      for(const key in regionMaterials)regionMaterials[key].color.setHex(key==='context'?palettes.context:palettes.ivory);
      floor.visible=true;floor.scale.set(1.5,1.2,1);floorRing.visible=false;
      pelvis.updateMatrixWorld(true);for(const l of legs)l.root.position.copy(pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005)));
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),joints=[];
      const toeAngle=Math.PI/18;
      function footCalibration(l,heel){
        const key=heel?'wedge':'flat';l.deepFootFrames||={};if(l.deepFootFrames[key])return l.deepFootFrames[key];
        if(!l.deepFootPoints){model.updateMatrixWorld(true);const inverse=l.foot.matrixWorld.clone().invert(),points=[];l.foot.traverse(o=>{if(!o.isMesh)return;const matrix=inverse.clone().multiply(o.matrixWorld),attr=o.geometry.attributes.position;for(let i=0;i<attr.count;i++)points.push(new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(matrix));});l.deepFootPoints=points;}
        const slope=heel?.20/.98:0,intercept=.08+slope*.72,yaw=new T.Quaternion().setFromAxisAngle(V(0,1,0),l.side*toeAngle);
        function frame(pitch){const q=new T.Quaternion().setFromAxisAngle(V(1,0,0),pitch).multiply(yaw),pts=l.deepFootPoints.map(p=>p.clone().applyQuaternion(q));let min=Infinity,h=Infinity,t=Infinity;for(let i=0;i<pts.length;i++){const g=pts[i].y+slope*pts[i].z;min=Math.min(min,g);if(l.deepFootPoints[i].z<.08)h=Math.min(h,g);if(l.deepFootPoints[i].z>.40)t=Math.min(t,g);}return {q,pts,min,error:t-h,pitch};}
        let f=frame(0);if(heel){let lo=0,hi=.6;for(let i=0;i<30;i++){f=frame((lo+hi)/2);if(f.error>0)lo=f.pitch;else hi=f.pitch;}f=frame((lo+hi)/2);}
        const result={...f,ankleY:intercept-slope*.04-f.min,slope,intercept};l.deepFootFrames[key]=result;return result;
      }
      function deepKnee(H,A,side){
        const delta=A.clone().sub(H),distance=delta.length(),axis=delta.normalize(),along=(L1*L1-L2*L2+distance*distance)/(2*distance),radius=Math.sqrt(Math.max(0,L1*L1-along*along)),centre=H.clone().addScaledVector(axis,along),normal=V(Math.cos(side*toeAngle),0,-Math.sin(side*toeAngle)),across=normal.clone().addScaledVector(axis,-normal.dot(axis)),n=across.length();
        if(radius<.00001||n<.00001)return twoJoint(H,A,L1,L2,V(side*.20,0,1));across.divideScalar(n);const component=normal.dot(A.clone().sub(centre))/(radius*n);if(Math.abs(component)>1)return twoJoint(H,A,L1,L2,V(side*.20,0,1));
        const forward=V().crossVectors(axis,across).normalize();if(forward.z<0)forward.negate();return centre.addScaledVector(across,radius*component).addScaledVector(forward,radius*Math.sqrt(Math.max(0,1-component*component)));
      }
      function leg(l,H,A,frame,bend){
        const K=deepKnee(H,A,l.side),fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(V(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,1,1);
        l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(V(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,1,1);l.root.updateMatrixWorld(true);
        l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(frame.q);l.foot.scale.set(1,1,1);
        const footPoints=frame.pts.map(p=>p.clone().add(A));let footMin=Infinity,supportGap=Infinity;for(const p of footPoints){footMin=Math.min(footMin,p.y);supportGap=Math.min(supportGap,p.y-(frame.intercept-frame.slope*p.z));}
        joints.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),footPitch:frame.pitch,toeOutDegrees:10,footMinHeight:footMin,supportGap,footBounds:{minX:Math.min(...footPoints.map(p=>p.x)),maxX:Math.max(...footPoints.map(p=>p.x)),minZ:Math.min(...footPoints.map(p=>p.z)),maxZ:Math.max(...footPoints.map(p=>p.z))},hipBelowKnee:H.y<K.y});
      }
      let modelCom=null,bodyCom=null,loadPoint=null;
      if(m[0]==='c'){
        const kind=m,heel=kind==='cheels',angle=(kind==='cgoblet'?.30:kind==='cheels'?.38:kind==='csafety'?.40:.60)*p,hy=3.25-2.35*p+(heel?.10:0),Q=new T.Quaternion().setFromAxisAngle(V(1,0,0),angle);
        let z=-.15;let computed;
        function compute(hz){const O=V(0,hy,hz),turn=(x,y,z)=>V(x,y,z).applyQuaternion(Q).add(O),points=[],checks=[];const add=(v,mass)=>points.push({v,mass});
          add(turn(0,1.05,-.03),40);add(turn(0,2.95,-.08),6);
          const load=kind==='cgoblet'?turn(0,1.95,.65):kind==='csafety'?turn(0,1.93,.38):turn(0,2.35,-.30);
          for(const l of legs){const frame=footCalibration(l,heel),bend=V(l.side*Math.sin(toeAngle)*1.5,0,Math.cos(toeAngle)),H=V(l.side*.51,hy-.17,hz+.005),A=V(l.side*.78,frame.ankleY,.04),K=deepKnee(H,A,l.side);add(H.clone().lerp(K,.5),8);add(K.clone().lerp(A,.5),4);add(V(0,-.02,.22).applyQuaternion(frame.q).add(A),1);checks.push({l,H,A,K,frame,bend});}
          const armJoints=[];for(const arm of exArms){const s=arm.side,S=turn(s*1.04,2.25,.02),G=kind==='cgoblet'?load.clone().add(V(s*.23,0,0)):kind==='csafety'?turn(s*.56,1.95,.80):turn(s*1.25,2.25,-.27),W=G.clone().add(V(0,-.13,0)),E=twoJoint(S,W,1.08,.98,V(s*.25,-1,-.25));add(S.clone().lerp(E,.5),2);add(E.clone().lerp(W,.5),1.5);add(W.clone().lerp(G,.5),.5);armJoints.push({arm,S,E,W,G});}
          const sum=V();for(const x of points)sum.addScaledVector(x.v,x.mass);const body=sum.clone().divideScalar(80),combined=sum.clone().addScaledVector(load,20).divideScalar(100);return {O,turn,load,body,combined,checks,armJoints};}
        for(let i=0;i<9;i++){computed=compute(z);z+=(.18-computed.combined.z)*1.10;}computed=compute(z);
        pelvis.position.copy(computed.O);pelvis.rotation.set(0,0,0);pelvis.updateMatrixWorld(true);torso.position.copy(computed.turn(0,1.42,0));torso.quaternion.copy(Q);head.position.copy(computed.turn(0,2.95,-.08));head.quaternion.copy(Q);for(const v of spineGroups){v.node.position.copy(computed.turn(0,v.y-3.3,v.z));v.node.quaternion.copy(Q);}arms.forEach(x=>x.node.visible=false);exerciseArms.visible=true;
        for(const v of computed.checks)leg(v.l,v.H,v.A,v.frame,v.bend);
        for(const a of computed.armJoints){poseSegment(a.arm.clavicle,computed.turn(0,2.4,.3),a.S);poseSegment(a.arm.upper,a.S,a.E);poseSegment(a.arm.fore,a.E,a.W);a.arm.hand.position.copy(a.W);a.arm.hand.quaternion.setFromUnitVectors(V(0,-1,0),a.G.clone().sub(a.W).normalize());}
        if(kind==='cgoblet'){goblet.visible=true;goblet.position.copy(computed.load);goblet.quaternion.copy(Q);}else if(kind==='csafety'){safety.visible=true;safety.position.copy(computed.turn(0,2.35,0));safety.quaternion.copy(Q);}else{straight.visible=true;straight.position.copy(computed.load);straight.quaternion.copy(Q);}
        for(const w of wedges)w.visible=heel;
        modelCom=computed.combined;bodyCom=computed.body;loadPoint=computed.load;comDot.visible=balanceLine.visible=true;comDot.position.copy(modelCom);balanceLine.position.set(modelCom.x,(modelCom.y+.10)/2,modelCom.z);balanceLine.scale.y=modelCom.y-.10;
      }
      model.updateMatrixWorld(true);previewDebug={movement:m,amount:a,joints,com:modelCom?.toArray(),bodyCom:bodyCom?.toArray(),load:loadPoint?.toArray()};
    }

    function applyPose(amount=state.amount){
      const a=Math.max(-1,Math.min(1,amount)),chain=state.mode==='chain',selectedSide=state.side==='right'?-1:1,m=state.movement;
      restoreStudyMaterials();previewEquipment.visible=false;previewDebug=null;
      exerciseArms.visible=false;equipment.visible=false;exerciseDebug=null;
      pelvis.rotation.set(0,0,0);pelvis.position.set(0,3.3,0);torso.rotation.set(0,0,0);torso.position.set(0,4.72,0);head.rotation.set(0,0,0);head.position.set(0,6.25,-.08);
      for(const l of legs){l.root.position.set(l.baseX,3.13,.01);l.root.rotation.set(0,0,0);l.femur.rotation.set(0,0,0);l.shin.position.set(l.side*.10,-1.63,0);l.shin.rotation.set(0,0,0);l.shin.scale.set(1,1,1);l.femur.scale.set(1,1,1);l.foot.position.set(0,-1.31,.04);l.foot.rotation.set(0,0,0);l.foot.scale.set(1,1,1);l.mid.rotation.set(0,0,0);l.mid.position.y=0;l.mid.scale.y=1;}
      for(let i=0;i<ribs.length;i++){const r=ribs[i];r.position.set(0,.93-Math.floor(i/2)*.132,-.30);r.rotation.x=0;r.scale.set(1,1,1);for(const c of r.children){if(c.isMesh&&c.userData.azRestPositions){c.geometry.attributes.position.array.set(c.userData.azRestPositions);c.geometry.attributes.position.needsUpdate=true;if(c.userData.azRestNormals){c.geometry.attributes.normal.array.set(c.userData.azRestNormals);c.geometry.attributes.normal.needsUpdate=true;}else c.geometry.computeVertexNormals();}}}
      for(const s of scapulae){s.node.position.set(s.side*.64,.53,-.36);s.node.rotation.set(0,-s.side*.20,0);}
      spineGuide.rotation.x=0;spineGuide.position.z=0;
      for(const s of spineGroups){s.node.position.set(0,s.y,s.z);s.node.rotation.set(0,0,0);}
      pressureMarks.forEach(p=>p.node.visible=false);floor.visible=false;floorRing.visible=false;
      if(previewIds.has(m)){posePreview(a);return;}
      if(exerciseIds.has(m)){poseExercise(Math.max(0,a));return;}
      function scap(pro){for(const s of scapulae){s.node.position.x=s.side*(.64+.14*pro);s.node.position.z=-.36+.23*pro;s.node.rotation.y=-s.side*(.20+.58*pro);s.node.rotation.z=s.side*pro*.045;}}
      function spine(flex){spineGuide.rotation.x=flex*.035;spineGuide.position.z=-flex*.05;for(let i=0;i<spineGroups.length;i++){const s=spineGroups[i],f=(i+1)/spineGroups.length;s.node.position.z=s.z-flex*Math.sin(f*Math.PI)*.16;s.node.rotation.x=flex*.12;}}
      if(m==='hike'){
        const angle=selectedSide*a*.12;pelvis.rotation.z=angle;pelvis.position.y-=Math.abs(a)*.078;pelvis.position.x=-selectedSide*a*.035;
        if(chain){const l=legs.find(l=>l.side===selectedSide);l.femur.rotation.y=-l.side*a*.22;l.shin.rotation.y=-l.side*a*.10;l.foot.rotation.z=l.side*a*.055;l.mid.position.y=-Math.max(0,a)*.018;pelvis.rotation.y=-selectedSide*a*.08;torso.rotation.z=-angle*.25;}
      }
      if(m==='tilt'){pelvis.rotation.x=a*.18;pelvis.position.z=a*.04;spine(-a*.55);if(chain){torso.rotation.x=a*.08;torso.position.z=a*.10;for(const l of legs){l.femur.rotation.y=-l.side*a*.20;l.shin.rotation.y=-l.side*a*.14;l.foot.rotation.y=-l.side*a*.14;}}}
      if(m==='hip'){const l=legs.find(l=>l.side===selectedSide);l.femur.rotation.y=-l.side*a*.32;l.shin.rotation.y=-l.side*a*.24;l.foot.rotation.y=-l.side*a*.24;if(chain){pelvis.rotation.y=-selectedSide*a*.13;pelvis.rotation.z=-selectedSide*a*.055;l.foot.rotation.z=l.side*a*.12;l.mid.position.y=-a*.020;l.mid.scale.y=1-a*.15;}}
      sternum.position.copy(sternumRest);
      if(m==='ribs'){for(const r of ribs){r.rotation.x=-a*.105;r.scale.x=1+a*.055;r.scale.z=1+a*.035;}sternum.position.y+=a*.035;sternum.position.z+=a*.025;if(chain)spine(-a*.25);}
      if(m==='ribshift'){torso.position.z=-a*.19;if(chain){scap(a);spine(a*.7);pelvis.rotation.x=-a*.10;}}
      if(m==='scapula'){scap(a);if(chain){torso.position.z=-a*.15;spine(a*.5);}}
      if(m==='foot'){const l=legs.find(l=>l.side===selectedSide);l.foot.rotation.z=l.side*a*.16;l.mid.position.y=-a*.024;l.mid.scale.y=1-a*.18;const p=pressureMarks.find(p=>p.side===selectedSide);p.node.position.x=l.baseX-l.side*a*.07;p.node.position.z=.13+a*.11;if(chain){l.shin.rotation.y=-l.side*a*.16;l.femur.rotation.y=-l.side*a*.11;pelvis.rotation.y=-selectedSide*a*.045;}}
      if(m==='chain'){pelvis.rotation.x=-a*.17;pelvis.position.z=-a*.07;if(chain){torso.position.z=-a*.19;torso.rotation.x=a*.055;scap(a);spine(a*.85);head.position.z=-.08-a*.10;head.rotation.x=a*.045;}}
      // Seat both femoral heads in the moving acetabula. For a frontal
      // pelvic shift, knee flexion accommodates height while feet stay down.
      pelvis.updateMatrixWorld(true);
      if(['hike','tilt','chain'].includes(m))for(const l of legs){
        const p=pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005));l.root.position.copy(p);
        if(m==='hike'){
          const L1=1.63,L2=1.31,d=Math.min(L1+L2,Math.max(2.5,p.y-.19));
          const alpha=Math.acos(Math.min(1,Math.max(-1,(L1*L1+d*d-L2*L2)/(2*L1*d))));
          const beta=Math.asin(Math.min(1,L1*Math.sin(alpha)/L2));
          l.femur.rotation.x=-alpha;l.shin.position.set(l.side*.10,-L1*Math.cos(alpha),L1*Math.sin(alpha));l.shin.rotation.x=beta;l.foot.rotation.x=-beta;
        }else{l.shin.position.set(l.side*.10,-1.63,0);}
      }
      if(m==='foot'&&chain){
        // A mildly flexed loaded-leg example. Axial rotation and adduction are
        // independent joint motions, rather than one rigid leg rotation.
        pelvis.position.y=3.3-.055-.012*Math.abs(a);pelvis.position.x=-selectedSide*a*.025;pelvis.rotation.y=-selectedSide*a*.045;pelvis.rotation.z=selectedSide*a*.015;pelvis.updateMatrixWorld(true);
        const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04);
        for(const l of legs){
          const selected=l.side===selectedSide,H=pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005)),A=new T.Vector3(l.side*.61,.19,.045),D=A.clone().sub(H),d=Math.min(L1+L2-.001,D.length()),axis=D.clone().normalize();
          const along=(L1*L1-L2*L2+d*d)/(2*d),radius=Math.sqrt(Math.max(0,L1*L1-along*along));
          const bend=new T.Vector3(selected?-l.side*a*.95:0,0,1);bend.addScaledVector(axis,-bend.dot(axis)).normalize();
          const K=H.clone().addScaledVector(axis,along).addScaledVector(bend,radius),femDir=K.clone().sub(H),shinDir=A.clone().sub(K);
          l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(new T.Vector3(l.side*.10,-1.63,0).normalize(),femDir.clone().normalize());
          const femTwist=new T.Quaternion().setFromAxisAngle(femDir.clone().normalize(),selected?l.side*a*.26:0);l.femur.quaternion.premultiply(femTwist);
          l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(new T.Vector3(0,-1.31,.04).normalize(),shinDir.clone().normalize());
          const tibTwist=new T.Quaternion().setFromAxisAngle(shinDir.clone().normalize(),selected?l.side*a*.20:0);l.shin.quaternion.premultiply(tibTwist);
          const desiredFoot=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),selected?l.side*a*.14:0);
          l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(desiredFoot);
          l.mid.rotation.z=selected?-l.side*a*.10:0;l.mid.position.y=selected?-a*.024:0;l.mid.scale.y=selected?1-a*.17:1;
        }
      }
      const active=m==='hike'||m==='tilt'||m==='hip'?'pelvis':m==='ribs'||m==='ribshift'?'thorax':m==='scapula'?'scapula':m==='foot'?'foot':'all';
      for(const key in regionMaterials){const material=regionMaterials[key];let color=palettes[key]||palettes.ivory;if(key==='ivory'||key==='context')color=key==='context'?palettes.context:palettes.ivory;else if(active!=='all'&&key!==active&&!(key==='femur'&&['hike','hip'].includes(m)))color=palettes.ivory;material.color.setHex(color);}
      for(const l of legs){const selected=l.side===selectedSide,linked=m==='foot'&&chain;
        l.femurMat.color.setHex(linked&&selected?0x7ea8c4:palettes.ivory);l.shinMat.color.setHex(linked&&selected?0x7ea8c4:palettes.context);l.footMat.color.setHex(m==='foot'&&selected?palettes.foot:palettes.ivory);
      }
      if(m==='foot'&&chain)pelvicM.color.setHex(0x9bb5c9);
      // Keep the selected region visually isolated. Context is added only in Chain mode.
      const upper=['ribs','ribshift','scapula'].includes(m),whole=m==='chain'&&chain;
      pelvis.visible=chain||(!upper&&m!=='foot');
      torso.visible=upper||chain;head.visible=chain;arms.forEach(x=>x.node.visible=chain);
      torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=chain;});
      scapulae.forEach(x=>x.node.visible=chain||m==='scapula');
      spineGroups.forEach(x=>x.node.visible=chain||upper);spineGuide.visible=false;
      for(const l of legs){
        l.root.visible=chain||(!upper&&(m!=='foot'||l.side===selectedSide));
        l.femur.visible=m!=='foot'||chain;l.shin.visible=chain||m==='foot';l.foot.visible=chain||m==='foot';
      }
      landmarks.forEach(x=>x.visible=state.labels&&['hike','tilt','hip'].includes(m));
      ghost.visible=state.ghost&&Math.abs(a)>.08;model.updateMatrixWorld(true);
    }
    applyPose(0);rebuildGhost();
    function focus(){
      const m=state.movement,chain=state.mode==='chain';
      if(previewIds.has(m)){target.set(0,3.15,.10);distance=13.8;return;}
      if(m==='lunge'){target.set(0,3.05,.05);distance=12.7;return;}
      if(m==='pushup'||m==='bench'){target.set(0,m==='pushup'?1.4:1.8,m==='pushup'?.2:-.25);distance=Math.max(m==='bench'?9.0:8.4,6.6/(2*Math.tan(17*Math.PI/180)*(width/height))*1.08);return;}
      if(exerciseIds.has(m)){target.set(0,m==='pullup'?4.45:m==='dips'?3.7:m==='press'?3.3:3.1,m==='row'?1.1:.1);distance=m==='pullup'?15.5:m==='dips'?13.4:m==='press'?13.2:m==='row'?13.7:12.4;return;}
      if(['ribs','ribshift','scapula'].includes(m)){target.set(0,5.0,.10);distance=4.2;}
      else if(m==='foot'){if(chain){target.set(0,3.34,.08);distance=12.4;}else{target.set(state.side==='right'?-.61:.61,.29,.24);distance=2.25;}}
      else if(m==='chain'&&chain){target.set(0,3.34,.05);distance=12.4;}
      else if(chain){target.set(0,3.34,.05);distance=12.4;}
      else{target.set(0,2.73,.05);distance=5.0;}
    }
    function resize(){if(disposed)return;width=Math.max(150,container.clientWidth);height=Math.max(200,container.clientHeight||500);camera.aspect=width/height;if(renderer)renderer.setSize(width,height,false);else{const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);}render();}
    let drag=null;onCanvas('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});onCanvas('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.008;pitch=Math.min(.7,Math.max(-.45,pitch+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY};render();});function end(){drag=null;canvas.style.cursor='grab';}onCanvas('pointerup',end);onCanvas('pointercancel',end);canvas.style.cursor='grab';
    onCanvas('wheel',e=>{e.preventDefault();distance=Math.max(2.0,Math.min(16,distance*(e.deltaY>0?1.06:.94)));render();},{passive:false});
    const ro=new ResizeObserver(resize);ro.observe(container);
    focus();applyPose();resize();
    return {
      update(next){const previous=state.movement,side=state.side,mode=state.mode;state=Object.assign({},state,next);if(previous!==state.movement||mode!==state.mode||(side!==state.side&&state.movement==='foot')){focus();applyPose(0);rebuildGhost();}applyPose();render();},
      setView(name){if(name==='front'){yaw=0;pitch=.04;}else if(name==='back'){yaw=Math.PI;pitch=.04;}else if(name==='side'){yaw=Math.PI/2;pitch=.04;}else{yaw=previewIds.has(state.movement)&&state.movement[0]==='c'?1.05:state.movement==='squat'?.75:state.movement==='bench'?1.10:state.movement==='lunge'?.90:.45;pitch=state.movement==='bench'?.42:state.movement==='lunge'?.12:.10;}render();},
      resetCamera(){yaw=0;pitch=.04;focus();render();},resize,
      dispose(){
        if(disposed)return;disposed=true;drag=null;ro.disconnect();
        for(const off of canvasEvents.splice(0))off();
        const geometries=new Set(),materials=new Set([...Object.values(regionMaterials),studyPadMat,studyRibMat,studyScapMat,studyBenchScapMat,steel,seatMat,dumbbellHeads,landmarkM,cavityM,floorMat,ghostMaterial]);
        scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const material of Array.isArray(o.material)?o.material:[o.material])materials.add(material);if(o.userData.azOriginalMaterial)materials.add(o.userData.azOriginalMaterial);});
        for(const geometry of geometries)geometry.dispose();
        for(const material of materials)material.dispose();
        if(renderer){renderer.setAnimationLoop?.(null);renderer.renderLists?.dispose?.();renderer.dispose();renderer.forceContextLoss?.();}
        container.replaceChildren();
      },
      debugPreview(){return previewDebug;},
      debugExercise(){return exerciseDebug;},
      debugPose(){model.updateMatrixWorld(true);return legs.map(l=>({side:l.side,hip:l.root.getWorldPosition(new T.Vector3()).toArray(),acetabulum:pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005)).toArray(),kneeFromFemur:l.femur.localToWorld(new T.Vector3(l.side*.10,-1.63,0)).toArray(),kneeFromShin:l.shin.getWorldPosition(new T.Vector3()).toArray(),ankle:l.foot.getWorldPosition(new T.Vector3()).toArray()}));},
      isFallback:fallback
    };
  };
})();
