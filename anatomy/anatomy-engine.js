(function(){
  'use strict';
  const deadliftBuilds=window.azDeadliftBuilds={
    longLong:{label:'Long Torso, Long Arms',torso:0.8250,arm:1.2317,setupShin:.164,shoulderLead:.35,kneePassThigh:.585},
    longShort:{label:'Long Torso, Short Arms',torso:0.8250,arm:1.0283,setupShin:.176,shoulderLead:.42,kneePassThigh:.68},
    shortLong:{label:'Short Torso, Long Arms',torso:0.6750,arm:1.2317,setupShin:.14,shoulderLead:.32,kneePassThigh:.408},
    shortShort:{label:'Short Torso, Short Arms',torso:0.6750,arm:1.0283,setupShin:.183,shoulderLead:.16,kneePassThigh:.55}
  };
  const standardDeadliftBuild={torso:.75,arm:1.13,setupShin:.166,shoulderLead:.34,kneePassThigh:.565};
  const isConventionalPull=m=>m==='deadlift_types'||m==='tension_deadlift';
  const isDeadlift=m=>isConventionalPull(m)||m==='rdl';
  // Bounds of each complete tension movement, with room for the hands,
  // feet and apparatus at the ends of the cycle.
  const tensionFrames={
    tension_pushup:{y:1.58,z:.51,half:[1.83,1.65,3.63]},
    tension_swing:{y:3.44,z:.74,half:[1.30,3.62,2.44]},
    tension_pogo:{y:3.74,z:.05,half:[1.56,3.92,.94]},
    tension_cat:{y:1.69,z:-.04,half:[1.43,1.82,2.73]}
  };
  const squatBuilds=window.azSquatBuilds={
    shortLong:{label:'Short Femur, Long Torso',femur:1.45,torso:1.00},
    longLong:{label:'Long Femur, Long Torso',femur:1.78,torso:1.00},
    shortShort:{label:'Short Femur, Short Torso',femur:1.45,torso:.82},
    longShort:{label:'Long Femur, Short Torso',femur:1.78,torso:.82}
  };
  // Relative sagittal turns from L5 upward, fitted to the two ends of each
  // lesson's spine. Seventeen evenly spaced poses share the same atlas disc
  // paths. Constant poses store one frame. Each signed byte is .002 radians.
  const axialPoseKeys=Object.fromEntries(Object.entries({
    bench_a:'PgDn5wwXBvklLujnx8fH',
    bench_b:'OfSkl5nN0Dg5NzI3DcfH',
    pushup_a:'GuDg8gMNFx8jJSAR+9/E',
    pushup_b:'be8DJiT++B88PDUT2MTEbO0CJiYC+yE8PDQP1MTEaun/JikH/yQ8PDEKzsTEauj+JioLAiU8PC4GysTEauf+JiwOBCY8OyoDyMTEauX9Ji0SByc7OicAxsTEaeP8Ji8VCig7OCT8xMTEaOH6JjEaDSo7NiH3xMTEZ9/5JzQdECw7NR3yxMTEZtz3JzYhEy48MxrtxMTEZtv2JzgkFjA8MhfpxMTEZdn1KDknGDE8MRXmxMTEZdf0KDspGjI8MBPjxMTEZNXzKD0sHTQ8LxHfxMTEY9TyKT4uHjU8Lw/dxMTEY9PxKT8vIDY8Lg7axMTEY9PxKUAwIDc8Lg3ZxMTE',
    lunge_a:'AdzkAhslKywoIRL62sTEA9rjAhwnLS4pIRH418TEBtnhAh0oLzArIhH208TECdjhAx8qMTEsIhD0z8TEDdfgAyAsMjMtIxDyzMTEENbfAyEtNDQuIw/xycTEE9XfBCIuNTUvIw/vx8TEF9XeBCMvNjYvIw7uxcTEGtTeBCQwNzcwIw3sxMTEHtPdBSUyOTkxIwvoxMTEH8nYDDI2Ozs0JwjfxMTEGajJLlg6PDw5NP3NxMTEEpTBUW48PDw8OebGxMTEDZPBaW48PDw7OdbHxMTEDJLFbm48PDw7OdHFxMTEDJLNbm48PDw7OMvFxMTEDJLTbm48PDw7NsbExMTE',
    lunge_b:'2+fsABAXHB0cGRED8NnE2+fsABAXHB0cGREE8NrE2ufsABAXGx0cGREE8drE2efsABAXGx0cGREE8drE2OfsABAXGx0cGREE8drE1+fsABAXGx0cGREE8drE1ubrABAXHB0cGREE8drE1ebrABAXHB4dGhIE8drE1OXrABEYHB4dGhIE8dnE0+Xq/xEYHB4dGhIE8dnE0uXq/xEYHR8dGhIE8dnE0eXq/xEYHR8dGhIE8dnE0OTq/xEYHR8eGhME8NnEz+Tq/xEYHR8eGxME8NjEzuTp/xEYHR8eGxME8NjEzePp/xEYHSAeGxME8NjEzOPp/xEZHiAeGxME8NfE',
    tension_pushup:'bfADJiT99x88PDUT2cTEbO0CJiYB+iA8PDQQ1cTEaun/JikJACQ8PC8JzcTEaeX8Ji4SByc7Oif/x8TEZ9/5JzMdECw7NR7yxMTEZdn1KDkmGDE8MRXmxMTEZNXzKT0tHTU8LxDexMTEY9PxKT8wIDY8Lg7axMTEY9PxKUAwIDc8Lg3ZxMTEY9PxKT8wIDY8Lg7axMTEZNXzKT0tHTU8LxDexMTEZdn1KDkmGDE8MRXmxMTEZ9/5JzMdECw7NR7yxMTEaeX8Ji4SByc7Oif/x8TEaun/JikJACQ8PC8JzcTEbO0CJiYB+iA8PDQQ1cTEbfADJiT99x88PDUT2cTE',
    tension_swing:'SqjJbW48PDw3K8TExMTES6TSbG48PDw5LMXExMTEQ5jgbW48PDw8LsfExMTELJ7ZV2I6Ozs5MdbLxcTEFMbbHDQuMzMvJv7nzsTE/eDnAhghJyglHhH84MfE9ePpAhYeIyQiHRL/58rE9ePpAhYeIyQhHBIA58rE9ePpAhYeIyQhHBIA58rE9ePpAhYeIyQhHBIA58rE9ePpAhYeIyQiHRL/58rE/eDnAhghJyglHhH84MfEFMbbHDQuMzMvJv7nzsTELJ7ZV2I6Ozs5MdbLxcTEQ5jgbW48PDw8LsfExMTES6TSbG48PDw5LMXExMTESqjJbW48PDw3K8TExMTE',
    tension_pogo:'/e3w/AcLDhAREA0G/PDl/N7l/A8YHiEhHhYI9NzN/NXe/BUhKSwrJxsH7MvE/Nbe/BQgKCsqJhsI7c3F/OHn/A0VGx4dGxUI9uDR/e/y/QUKDQ4ODgsG/fPo/vP1/QMGCQoKCggF//fw/vP1/QMGCAoKCggF//fw/vP1/QMGCAoKCggF//fw/vP1/QMGCAoKCggF//fw/vP1/QMGCAoKCggF//fw/vP1/QMGCAoKCggF//fw/vP1/QMGCAoKCggF//fw/vP1/QMGCAoKCggF//fw/vP1/QMGCAoKCggF//fw/vP1/QMGCAoKCggF//fw/vP1/QMGCAoKCggF//fw',
    row_a:'FOni5/H5BRIbHR0XCffi',
    row_b:'bRj+HPb4CBw5PDcqGcTE',
    press_a:'kxAR9uTi4+bq6/YMLDky',
    press_b:'ISUpG9vQzs/b9Tc4OyMq',
    dips_a:'KNnY7AANGSMqLCYV+9nEKdjX7AAOGiQrLSYV+dfEKtfW7AEPGyYsLicV+NTEK9bV6wEQHScuLycU9tHELdXV6wIQHigvMCgU9c/ELtTU6wIRHykwMSgU9M3EL9TT6wMSICoxMikT88rEMNLS6wMTISwyMykT8cjEMdHR6wQUIi0zNCoT8MXEMtDQ6wUVJC81NSoS7cTEM87O6gYXJjE3NioQ6cTENc3N6gYYJzM4NyoO5sTENszM6gcZKTQ6OCoN48TEN8vL6ggaKjU6OCoM4cTEOcrL6ggaKjY7OSoL38TEOsnK6ggbLDc8OSoK3cTEO8jJ6QkcLTg8OioK3MTE',
    dips_b:'3pOWXGw8PDw8OuvGxMTEAaSoIEk5PDw6NAjax8TEGb7E9RsvNzc0Lhn30sTEH8vR8g8jLC8vLR8G48XEI9TY9AwaIygrLyUQ8MrEJdjd9QsTHCQrMSoX99DEJ9zg9woOFyErNTAc/NTEKuDk+AoJEh4rODQiAtnELeTo+gkDDBoqOjkoCODEMOjs/An+CBcqOzstDuXEMuvv/gr6BBYsPDw0E+nENO3xAAv3AhYvPDw5GezENu7yAQz0ARcyPDw7JevEOe7yAg7zABk3PDs4MevEPevvBBP0Ah47PDs0K/rEQefrBRf0BSM8PDw0JAfEROfrBhnzBCM8PDw6Mv7E',
    pullup_a:'JeDe7v0IExwiJSIVAOXJ',
    pullup_b:'vJKSU248PDw6LMTExMTEwZKSTG48PDw6LsTExMTE0JKSQ248PDw6MMbExMTE2pKSPm48PDw8Os7GxMTE3ZKTMm48PDw8OdHGxMTE5pKSF248PDw8NczExMTE6ZKSBm48PDw8NMvExMTE65KS/248PDw8Nc3ExMTE75KS+G48PDw8Nc7ExMTE9JKS9m48PDw8NtHFxMTE+ZKS9m48PDw8N9TGxMTE+ZKS7m48PDw8NdDExMTE+JKS5248PDw8NdDFxMTEAJKS4G48PDw8ONvIxMTECJKS2G48PDw8O+XJxMTEDJKSzW48PDw8OuXHxMTEDJKSw248PDw8N9/FxMTE',
    cheels:'+fP1/gYJCwwMDAkE/PPp+fP1AAgKDA0NDQoE+/Hm+vL2AQoMDhAPDgsE+u7i+/L2Aw0NEBEREAwE+eve+/L3BRAPEhMSEQwE+Ona/PP3BhIQExUUEg0E9+bX/fP4CBUSFRYVEw4E9eTT/fT5ChgTFhcWFA4D9OLQ/vT6DBoVGBkXFQ4D89/N//X7Dh0WGRoYFQ8C8t7K//b9EB8XGhsZFg8C8dzIAPf+EiEYGxwaFg4B79rGAfgAFCQZHB0aFg4B7tjEA/oCFyYaHR0bFg4A7dbEBPsEGSkbHh4bFg3/69TEBf0FGyscHh4bFg3+6tLEB/4HHS0cHx4bFgz96dHE',
    cgoblet:'+fP1/gYJCwwMDAkE/PPq+fP1/wcJDA0NDAoE/PLn+vL1AAkLDQ8ODgoE++/k+vL2AgsMDxAQDwsE+u3g+/L2Aw4NEBIREAwE+evd+/L2BRAPEhMSEQwE+Ona/PP3BhIQExQTEg0E9+fX/PP4BxQRFBUUEg0E9uXV/fP4CRYSFRYVEw4E9ePS/fT5ChgTFhgWFA4D9OHP/vT6DBoVGBkXFQ4D8+DN/vX7DhwWGRoYFQ8D8t7L//X8Dx4WGhoZFg8C8d3JAPb9ESAXGhsZFg8C8NvHAPf/EiIYGxwaFg4B79rGAfgAFCMZHBwaFg4B79nEAvkBFSUZHB0aFg4B7tjE',
    csafety:'+fP1/gYJCwwMDAkE/PPp+vP1AAgKDA4NDQoE+/Hm+vL2AQsMDhAPDgsE+u7i+/L2Aw4NEBIREAwE+evd+/L3BRAPEhMTEQ0E+OjZ/PP3BxMRFBUUEg0E9ubW/fP4CRYSFRYVEw4E9ePS/fT5CxkUFxgXFA4D9OHP/vT7DRsVGBkYFQ4D8t/L//X8Dx4WGhoZFg8C8d3JAPf+ESAYGxsZFg8C8NvHAfj/FCMZHBwaFg4B79nFAvkBFiUaHR0aFg4A7dfEA/sDGCgbHh4bFg7/7NXEBfwFGiocHh4bFg3+6tPEBv4HHS0cHx4bFgz96dHECP8IHi8dHx8bFgz86NDE',
    tilt:'CwUKGSMVFxcVEw0E9+jZzQkDCBYgFBYWFRMOBfjq288HAAUSHBIUFRQSDgX67N7SBP0CDhgQExQTEQ4G++7h1gH7/wsUDxESEhENBv3w5Nr/+fwHEA0PERAQDQf+8+fe/ff6BAwLDQ8PDgwH//Xr4/r1+AEICQsNDQ0LBgD47+j49Pb+BAcJCgsLCQYB+/Tv9vP1+/8EBgcICAgGAv359fTy9Pj7AgMEBQYGBQMB/vzy8vP19/8AAQIDAwQEBAQD8PPz8/P8/f3+/wACBQcKDO709fHv+fn5+vv9AAULERbs9vfw6vb09PT19/0FDxki6fj57+fz8O/v8PP6BBIhLeX5++7k8e3r6+zv9wQVJjY=',
    foot_local:'+uXo/hAVGBgUDQLv1g==',
    foot_chain:'/jEvBOXg3d3j6fsePAUtKgTn39vc4+v9HTwLKiYE6N7a2+Ps/hw8EiYhA+re2dvj7gEcOhwhGQPs3djb5PEFHDUmHBIC7tzW2uX0CRwyLBgNAu/c1trl9gscMCsWDALx3tjc5vYJGDEnFgwD8uDa3ub1BxUzKxYMAvHe2Nzm9gkYMSwYDQLv3Nba5fYLHDAmHBIC7tzW2uX0CRwyHCEZA+zd2Nvk8QUcNRImIQPq3tnb4+4BHDoLKiYE6N7a3OPs/hw8BC4qBOff3Nzj6/wdPP0yMATl4N3d4+n6Hjw=',
    chain_local:'yfcOA+rl2tjh8RI6PNL+D//n5Nzb5PIONTzfAwz55OXg4ej0Cyw86AUI9ubp5uju9gYeOusEBvfq7+7v8/kDFS/x/wD48ff29/r9Aw0b9vf4+fr/AAECAwQFBvnu8PsECgwMCwgD+u754+f/ERYZGBQNAO7W88LKITgpKyomCefayOKasV1lOTo6Ne7Jx8TNks5ubjw8PDbZxMTEspIGbm48PDw54sTExJ+SN25uPDw7Od7ExMSVklhubjw8OjPRxMTEkpZlbm48PDovz8TExJKdZG5uPDw0IMnExMQ=',
    chain_chain:'BpKSlG48PDw8LsTExPaSkrxuPDw8PDDExMTSkpIAbjw8PDsmxcTEvJKSLG48PDw6D8XExLqSkkpuPDw8N//FxMTOpaY8UzM0NC0E1c7F783PBx0gJCQeEPfjyfjd4PoPGR0cFxAC68765Oj+EBUYGBQNAu/V/OvvAhESFBQQCwHy3P/x9QUSDxERDgoB9OIC9voIEw0PDwwIAfbmBPv+CxUMDQ0LBwH36Qf/Aw4XCwwLCQcC+e0JAwYRGQoLCggGAvrvDAcKFBsJCgkIBgL78Q4KDRYcCAkIBwUC/PM=',
  }).map(([key,packed])=>[key,Int8Array.from(atob(packed),c=>c.charCodeAt(0))]));
  window.createAnatomyViewer=function(container,initial={},controls={}){
    const T=window.THREE;
    if(!T)throw Error('The 3D anatomy library could not load. Open Anatomy Zone again to retry.');
    let state=Object.assign({movement:'hike',amount:0.35,mode:'local',side:'right',labels:false,ghost:false},initial);
    let width=600,height=500,disposed=false,yaw=initial.view==='side'?Math.PI/2:initial.view==='back'?Math.PI:initial.view==='oblique'?(initial.movement?.[0]==='c'?1.05:.75):0,pitch=initial.view==='top'?Math.PI/2:initial.view==='bottom'?-Math.PI/2:initial.view==='oblique'?.10:.04,distance=7.3,target=new T.Vector3(0,2.7,0),lastMove='';
    const scene=new T.Scene(),perspective=new T.PerspectiveCamera(34,1,.1,60);
    const deadliftCamera=new T.OrthographicCamera(-1,1,1,-1,.1,80);
    const halfFovTan=Math.tan(T.MathUtils.degToRad(perspective.fov/2));
    let camera=perspective;
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
    const rearLandmarkM=new T.MeshStandardMaterial({color:0x97602f,roughness:.6});
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
    const sternum=between(torso,[0,.99,.39],[0,-.02,.59],.058,.045,thorM),sternumRest=sternum.position.clone(),sternumRestRotation=sternum.quaternion.clone();
    const fitCostalCartilage=window.azAttachThorax?.(T,ribs,sternum);
    // Store each atlas rib in the frame of its own thoracic vertebra.
    const ribParents=ribs.map((rib,i)=>{
      const vertebra=spineGroups[spineGroups.length-1-Math.floor(i/2)].node;
      const offset=rib.position.clone().add(torso.position).sub(vertebra.position);
      return {rib,vertebra,offset};
    });
    function seatRibsOnSpine(){
      const toChest=torso.quaternion.clone().invert();
      for(const {rib,vertebra,offset} of ribParents){
        rib.position.copy(offset).applyQuaternion(vertebra.quaternion)
          .add(vertebra.position).sub(torso.position).applyQuaternion(toChest);
        rib.quaternion.copy(toChest).multiply(vertebra.quaternion);
      }
    }
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
        landmarks.push(sphere(pelvis,position.x,position.y,position.z,.032,.032,.032,target.z<0?rearLandmarkM:landmarkM));
      }
    }
    const exerciseIds=new Set(['rdl','squat','squat_types','press','row','pullup','dips','pushup','bench','lunge']);
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
    // The upper thoracic spinous process is a bony landmark beneath the
    // modeled upper-back support. Both straight squat bars use the same seat.
    const squatSupportLevel=spineGroups[spineGroups.length-2]; // T2
    const squatSupport=new T.Vector3();
    {
      const point=new T.Vector3();
      let posterior=Infinity;
      squatSupportLevel.node.traverse(mesh=>{
        if(!mesh.isMesh)return;
        mesh.updateMatrix();
        const vertices=mesh.geometry.attributes.position;
        for(let i=0;i<vertices.count;i++){
          point.fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrix);
          if(point.z<posterior){
            posterior=point.z;
            squatSupport.set(0,point.y,point.z);
          }
        }
      });
    }
    function squatBarSeat(radius){
      const seat=squatSupport.clone();
      seat.z-=radius+.065; // Illustrative tissue cover, in model units.
      return seat;
    }
    const squatBarRadius=.035, comparisonBarRadius=.04;
    const barbell=new T.Group();equipment.add(barbell);between(barbell,[-1.6,0,0],[1.6,0,0],squatBarRadius,squatBarRadius,steel);
    for(const side of [-1,1]){const p=mesh(new T.CylinderGeometry(.26,.26,.12,24),steel,barbell);p.rotation.z=Math.PI/2;p.position.x=side*1.55;}
    const dumbbellHeads=new T.MeshStandardMaterial({color:0x304b65,roughness:.62,metalness:.12});
    const dumbbells=[];for(const side of [-1,1]){const g=new T.Group();equipment.add(g);between(g,[-.38,0,0],[.38,0,0],.043,.043,steel);for(const x of [-.32,.32]){const w=mesh(new T.CylinderGeometry(.205,.205,.18,6),dumbbellHeads,g);w.rotation.z=Math.PI/2;w.position.x=x;}dumbbells.push({side,node:g});}
    const seat=new T.Group();equipment.add(seat);box(seat,[1.72,.15,1.0],[0,1.65,-.08],seatMat);for(const side of [-1,1])between(seat,[side*.65,1.57,-.15],[side*.65,.05,-.15],.045,.045,steel);
    const pressChair=new T.Group();equipment.add(pressChair);box(pressChair,[1.72,.15,1.30],[0,1.65,-.23],studyPadMat);for(const side of [-1,1])between(pressChair,[side*.65,1.57,-.15],[side*.65,.05,-.15],.045,.045,steel);
    const pressBackrest=new T.Group();pressChair.add(pressBackrest);box(pressBackrest,[1.60,3.10,.16],[0,0,0],studyPadMat);for(const side of [-1,1])between(pressBackrest,[side*.57,-1.45,-.13],[side*.57,1.35,-.13],.034,.034,steel);pressBackrest.rotation.x=-12*Math.PI/180;pressBackrest.position.set(0,3.25,-.90);
    const seatedFloor=box(equipment,[2.25,.08,2.05],[0,.04,1.38],new T.MeshStandardMaterial({color:0xc0cddc,roughness:.9}));
    const footrest=box(equipment,[1.90,.50,1.05],[0,.33,1.61],seatMat);
    const rowHandle=new T.Group();equipment.add(rowHandle);between(rowHandle,[-1.15,0,0],[1.15,0,0],.035,.035,steel);
    const cable=mesh(new T.CylinderGeometry(.011,.011,1,8),steel,equipment);
    const rowAnchor=new T.Vector3(0,3.87,3.6);
    const rowUpright=new T.Group();equipment.add(rowUpright);
    box(rowUpright,[.28,3.99,.14],[0,2.045,3.75],steel);
    box(rowUpright,[.80,.08,.66],[0,.08,3.75],seatMat);
    const cableGuide=mesh(new T.CylinderGeometry(.105,.105,.12,20),seatMat,rowUpright);
    cableGuide.rotation.x=Math.PI/2;
    cableGuide.position.copy(rowAnchor);cableGuide.position.z+=.055;
    const rdlPressureCue=new T.Group();equipment.add(rdlPressureCue);
    const cueMaterial=new T.MeshBasicMaterial({color:0x168b87});
    for(const side of [-1,1]){
      // Beside each sole so the arrow remains visible from the side.
      const x=side*.94;
      between(rdlPressureCue,[x,.19,0],[x,.46,0],.018,.018,cueMaterial);
      const tip=mesh(new T.ConeGeometry(.068,.13,12),cueMaterial,rdlPressureCue);
      tip.rotation.z=Math.PI;tip.position.set(x,.15,0);
    }
    const pullBar=new T.Group();equipment.add(pullBar);between(pullBar,[-1.62,0,0],[1.62,0,0],.038,.038,steel);pullBar.position.set(0,8.16,.12);
    const pullGrip=side=>pullBar.position.clone().add(new T.Vector3(side*1.20,0,0));
    const dipBars=new T.Group();equipment.add(dipBars);for(const side of [-1,1]){between(dipBars,[side*1.1,3.9,-.85],[side*1.1,3.9,.90],.045,.045,steel);between(dipBars,[side*1.1,.08,-.75],[side*1.1,3.9,-.75],.045,.045,steel);between(dipBars,[side*1.1,.08,-1.10],[side*1.1,.08,.75],.045,.045,steel);}
    const flatBench=new T.Group();equipment.add(flatBench);
    const benchPad=box(flatBench,[1.68,.18,4.85],[0,.98,-1.03],studyPadMat);
    const benchPadTop=benchPad.position.y+benchPad.geometry.parameters.height/2;
    const benchTissueCover=.012;
    for(const z of [-2.70,.65]){between(flatBench,[0,.89,z],[0,.12,z],.065,.065,steel);between(flatBench,[-.85,.10,z],[.85,.10,z],.055,.055,steel);}
    const benchBarRadius=.042;
    const benchBar=new T.Group();equipment.add(benchBar);between(benchBar,[-2.45,0,0],[2.45,0,0],benchBarRadius,benchBarRadius,steel);for(const side of [-1,1]){const p=mesh(new T.CylinderGeometry(.30,.30,.16,24),steel,benchBar);p.rotation.z=Math.PI/2;p.position.x=side*2.12;}
    let exerciseDebug=null;
    function twoJoint(A,B,L1,L2,bend,reachSlack=.0001){const delta=B.clone().sub(A),realD=delta.length(),d=Math.max(.001,Math.min(L1+L2-reachSlack,realD)),axis=delta.normalize();const x=(L1*L1-L2*L2+d*d)/(2*d),r=Math.sqrt(Math.max(0,L1*L1-x*x)),v=bend.clone().addScaledVector(axis,-bend.dot(axis)).normalize();return A.clone().addScaledVector(axis,x).addScaledVector(v,r);}
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
    const pushBottomAngles=new Map(), benchTouchPoints=new Map(), benchBackLifts=new Map();
    const thoracicNodes=spineGroups.slice(5).map(level=>level.node);
    const backSurfaces=[...thoracicNodes,...ribs,...scapulae.map(blade=>blade.node)];
    function lowestSurfacePoint(groups){
      const lowest=new T.Vector3(0,Infinity,0),point=new T.Vector3();
      for(const group of groups){
        group.updateWorldMatrix(true,true);
        group.traverse(node=>{
          if(!node.isMesh)return;
          const vertices=node.geometry.attributes.position;
          for(let i=0;i<vertices.count;i++){
            point.fromBufferAttribute(vertices,i).applyMatrix4(node.matrixWorld);
            if(point.y<lowest.y)lowest.copy(point);
          }
        });
      }
      return lowest;
    }
    function benchTouchPoint(setup){
      // The chest pose is fixed within each bench setup. Fit the whole shaft
      // to the anterior rib, cartilage and sternum surfaces at the lower chest.
      if(benchTouchPoints.has(setup))return benchTouchPoints.get(setup);
      const sternumBounds=new T.Box3().setFromObject(sternum,true);
      const z=T.MathUtils.lerp(sternumBounds.min.z,sternumBounds.max.z,.66);
      const near=z-benchBarRadius,far=z+benchBarRadius;
      let surfaceY=-Infinity;
      function measureEdge(a,b){
        if(a.z>b.z){const swap=a;a=b;b=swap;}
        if(b.z<near||a.z>far)return;
        if(a.z>=near)surfaceY=Math.max(surfaceY,a.y);
        if(b.z<=far)surfaceY=Math.max(surfaceY,b.y);
        for(const plane of [near,far]){
          if(a.z<plane&&b.z>plane){
            const y=T.MathUtils.lerp(a.y,b.y,(plane-a.z)/(b.z-a.z));
            surfaceY=Math.max(surfaceY,y);
          }
        }
      }
      for(const group of [...ribs,sternum])group.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const vertices=mesh.geometry.attributes.position,index=mesh.geometry.index;
        const points=Array.from({length:vertices.count},(_,i)=>
          new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrixWorld));
        const count=index?index.count:points.length;
        for(let i=0;i<count;i+=3){
          const a=points[index?index.getX(i):i],b=points[index?index.getX(i+1):i+1],c=points[index?index.getX(i+2):i+2];
          measureEdge(a,b);measureEdge(b,c);measureEdge(c,a);
        }
      });
      const touch=new T.Vector3(0,surfaceY+benchBarRadius+.055,z); // Modeled chest tissue cover.
      benchTouchPoints.set(setup,touch);
      return touch;
    }
    function poseHorizontalExercise(phase){
      const m=state.movement,b=state.scenario==='b',push=m==='pushup',smooth=(lo,hi,x)=>{const v=T.MathUtils.clamp((x-lo)/(hi-lo),0,1);return v*v*(3-2*v);};
      exerciseArms.visible=true;equipment.visible=true;equipment.children.forEach(o=>o.visible=false);flatBench.visible=!push;benchBar.visible=!push;floor.visible=true;floor.scale.set(2.1,3.5,1);
      // Limit bench retraction to the range where the medial blades clear T5.
      const pro=push?(b?.18+.64*Math.pow(1-phase,2):.08):b?-.38+.025*Math.sin(Math.PI*phase):-.12;
      const bow=(r,lo,hi)=>r<=lo||r>=hi?0:Math.pow(Math.sin(Math.PI*(r-lo)/(hi-lo)),2);
      let delta=.33,origin,U,F,baseAngle,benchLift=0,backLift=0,shapePhase=phase;
      const anchor=push?supportedFoot(legs[0],0,-2.65,.92,0,.08,.85).ankle:new T.Vector3();
      function setFrame(d){delta=d;U=new T.Vector3(0,Math.sin(d),Math.cos(d));F=new T.Vector3(0,-Math.cos(d),Math.sin(d));origin=anchor.clone().addScaledVector(U,3.08);baseAngle=Math.PI/2-d;}
      // The atlas shoulder blades are deeper than the original schematic
      // surfaces. Raise the upper back to the pad, tapering into the neck.
      const bladeSupport=fitShoulderGirdle ? (b?.182:.168) : 0;
      const spineOffset=r=>-.14+.035*Math.sin(r/2.5*Math.PI*2)+(push?-(b?.055*Math.pow(1-shapePhase,2):0)*bow(r,.9,2.60)-(b?.035:0)*bow(r,.12,1.25):(b?.31:.025)*bow(r,.12,1.65)-((b?.18:.13)+benchLift)*smooth(.10,1.80,r)+bladeSupport*smooth(.20,1.80,r)*(1-smooth(2.45,3.00,r)));
      const centreAt=r=>{
        const point=origin.clone().addScaledVector(U,r).addScaledVector(F,spineOffset(r));
        if(backLift)point.y+=backLift*smooth(0,.65,r)*(1-smooth(2.05,3.4,r));
        return point;
      };
      const angleAt=r=>{const d=centreAt(r+.008).sub(centreAt(Math.max(0,r-.008)));return Math.atan2(d.z,d.y);};
      const turn=p=>centreAt(p[1]).add(new T.Vector3(p[0],0,p[2]+.14).applyAxisAngle(new T.Vector3(1,0,0),angleAt(p[1])));
      const pushWristZ=1.94, pushHandX=1.20;
      function placeChest(){
        const torsoAngle=angleAt(1.85);
        torso.position.copy(turn([0,1.42,0]));torso.rotation.set(torsoAngle,0,0);
        torso.updateMatrixWorld(true);
        if(push){placeSpine();seatRibsOnSpine();}
        else for(let i=0;i<ribs.length;i++){
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
          shapePhase=1;setFrame(0);placeChest();
          pelvis.position.copy(origin);pelvis.rotation.set(baseAngle+(b?-.28:0),0,0);
          head.position.copy(turn([0,2.95,-.08]));head.rotation.set(angleAt(2.95),0,0);
          fitAxialPose(1);fitCostalCartilage?.();torso.updateMatrixWorld(true);
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
      function placeSpine(){
        for(const level of spineGroups){
          const r=level.y-3.3;
          level.node.position.copy(centreAt(r));
          level.node.rotation.set(angleAt(r),0,0);
          level.node.visible=true;
        }
      }
      let buttContact;
      if(!push){
        buttContact=lowestSurfacePoint([pelvis]);
        benchLift=benchPadTop+benchTissueCover-buttContact.y;
        origin.y+=benchLift;pelvis.position.copy(origin);pelvis.updateMatrixWorld(true);
        buttContact.y=benchPadTop;
        // The trunk pose is fixed within each setup. Fit the posterior bone
        // surfaces once, blending the lift into the lumbar spine and neck.
        if(!benchBackLifts.has(b)){
          placeSpine();
          backLift=Math.max(0,benchPadTop+benchTissueCover-lowestSurfacePoint(thoracicNodes).y);
          benchBackLifts.set(b,backLift);
        }
        backLift=benchBackLifts.get(b);
      }
      placeChest();const torsoAngle=angleAt(1.85);head.position.copy(turn([0,2.95,-.08]));head.rotation.set(angleAt(2.95),0,0);
      if(!push){
        head.position.y+=benchPadTop+.001-lowestSurfacePoint([head]).y;
      }
      placeSpine();spineGuide.visible=false;torso.visible=true;head.visible=true;pelvis.visible=true;arms.forEach(a=>a.node.visible=false);torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=false;});
      for(const s of scapulae){const level=1.95,theta=angleAt(level),offset=new T.Vector3(s.side*(.64+.16*pro),0,-.20+.25*pro).applyAxisAngle(new T.Vector3(1,0,0),theta);s.node.position.copy(torso.worldToLocal(centreAt(level).add(offset)));s.node.rotation.set(theta-torsoAngle,-s.side*(.20+.63*pro),0);s.node.visible=true;}
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),legChecks=[];
      for(const l of legs){
        const foot=supportedFoot(l,l.side*(push?.61:.72),push?-2.65:b?1.60:2.00,push?.92:0,0,.08,push?.85:0);
        const H=pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005)),A=foot.ankle;
        const K=twoJoint(H,A,L1,L2,push?new T.Vector3(0,-1,0):new T.Vector3(0,1,.10)),fd=K.clone().sub(H),sd=A.clone().sub(K);
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(new T.Vector3(l.side*.10,-1.63,0).normalize(),fd.clone().normalize());l.femur.scale.set(1,fd.length()/L1,1);l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(new T.Vector3(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,sd.length()/L2,1);l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(foot.quaternion);l.foot.scale.y=L2/sd.length();l.root.visible=true;l.femur.visible=true;l.shin.visible=true;l.foot.visible=true;l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(!push&&b?(state.ascending?0x709dbf:0x9bb5c9):palettes.ivory);legChecks.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),footContact:foot.contact.toArray()});
      }
      if(!push){fitAxialPose(phase);fitCostalCartilage?.();}
      model.updateMatrixWorld(true);const armChecks=[];
      const shoulders=exArms.map(({side})=>{
        const desired=shoulderPoint(turn,side,0,pro*.30);
        if(push||!fitShoulderGirdle)return desired;
        // The tucked blades tip against the pad as the bar descends.
        const clearance=T.MathUtils.lerp(.081,.054,smooth(0,.18,phase));
        return torso.localToWorld(fitShoulderGirdle.socketOnCage(side,desired,m,clearance));
      });
      let bar=null;
      if(!push){
        bar=shoulders[0].clone().lerp(shoulders[1],.5);
        bar.x=0;bar.y+=2.107;
        bar.lerp(benchTouchPoint(b),phase*(.82+.18*phase));
        benchBar.position.copy(bar);
      }
      for(const [i,arm] of exArms.entries()){
        const side=arm.side,S=shoulders[i];
        let E,W,G,handDirection;
        poseSegment(arm.clavicle,turn([0,2.40,.30]),S);
        if(push){G=new T.Vector3(side*pushHandX,.12,pushWristZ+.17);W=G.clone().add(new T.Vector3(0,0,-.17));E=twoJoint(S,W,1.08,.98,new T.Vector3(side*.60,0,-1));handDirection=new T.Vector3(0,0,1);}
        else{G=bar.clone();G.x=side*1.65;W=G.clone().add(new T.Vector3(0,-.17,0));E=twoJoint(S,W,1.08,.98,new T.Vector3(side,-.50,.60));handDirection=new T.Vector3(0,1,0);}
        poseSegment(arm.upper,S,E);poseSegment(arm.fore,E,W);poseHand(arm,W,handDirection,G);
        const u=E.clone().sub(S).normalize(),v=W.clone().sub(E).normalize(),elbowAngle=T.MathUtils.radToDeg(Math.acos(T.MathUtils.clamp(-u.dot(v),-1,1)));armChecks.push({side,shoulder:S.toArray(),elbow:E.toArray(),wrist:W.toArray(),grip:G.toArray(),upperLength:S.distanceTo(E),foreLength:E.distanceTo(W),elbowAngle});
      }
      for(const key in regionMaterials)regionMaterials[key].color.setHex(key==='context'?palettes.context:palettes.ivory);if(!push&&b){for(const s of scapulae)studyMaterial(s.node,studyBenchScapMat,50);for(const r of ribs)studyMaterial(r,studyRibMat);if(!sternum.userData.azOriginalMaterial)sternum.userData.azOriginalMaterial=sternum.material;sternum.material=studyRibMat;}landmarks.forEach(x=>x.visible=false);ghost.visible=false;model.updateMatrixWorld(true);
      let contacts;
      if(push)contacts={hands:armChecks.map(a=>a.grip),toes:legChecks.map(l=>l.footContact),floorHeight:.08};
      else contacts={butt:buttContact.toArray(),feet:legChecks.map(l=>l.footContact),padHeight:benchPadTop,floorHeight:.08};
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

    const standardSquat={femur:Math.hypot(.10,1.63),torso:1};
    const profileToeAngle=Math.PI/6,standardSquatToeAngle=Math.PI/18;
    const profilePlants=new Map();
    function squatProfilePlant(leg,profile){
      const key=leg.side*(profile?2:1);
      if(!profilePlants.has(key)){
        const toeAngle=profile?profileToeAngle:standardSquatToeAngle;
        const plant=supportedFoot(leg,leg.side*(profile?.92:.78),.045,0,leg.side*toeAngle);
        let heel=Infinity,toe=-Infinity;
        const point=new T.Vector3();
        for(const vertex of tensionFootPoints(leg)){
          const z=point.copy(vertex).applyQuaternion(plant.quaternion).z;
          heel=Math.min(heel,z);toe=Math.max(toe,z);
        }
        plant.midfootZ=plant.ankle.z+(heel+toe)/2;
        profilePlants.set(key,plant);
      }
      return profilePlants.get(key);
    }
    const squatBarOffsets=new Map();
    function squatBarOffset(scale,pelvicOffset=0){
      const neutral=pelvicOffset===0;
      if(neutral&&squatBarOffsets.has(scale))return squatBarOffsets.get(scale);
      // Reconstruct the same high bar seat used by the rendered vertebrae,
      // relative to the hip joint in the upright trunk's coordinate system.
      const hipOffset=new T.Vector3(0,-.17,.005);
      const seat=squatBarSeat(squatBarRadius);
      seat.y*=scale;
      if(axial.every(Boolean)){
        const root=axial[0];
        root.q.setFromAxisAngle(spineAxis,pelvicOffset);
        root.pos.copy(root.origin).sub(new T.Vector3(0,3.3,0));
        if(scale!==1)root.pos.y+=profileBaseOffset(scale);
        root.pos.applyQuaternion(root.q);
        for(let i=1;i<=15;i++){
          axial[i].q.setFromAxisAngle(spineAxis,pelvicOffset*squatPelvisWeight(i));
          joinLevels(axial[i-1],axial[i],i-1,scale);
        }
        seat.add(axial[15].pos);
      }else seat.add(new T.Vector3(0,(squatSupportLevel.y-3.3)*scale,squatSupportLevel.z));
      seat.sub(hipOffset.applyAxisAngle(spineAxis,pelvicOffset));
      if(neutral)squatBarOffsets.set(scale,seat);
      return seat;
    }
    function squatPelvisWeight(level){
      return 1-T.MathUtils.smoothstep(level,0,5);
    }
    function squatFrame(build,phase,profile,extension){
      const foot=legs[0],side=foot.side,plant=squatProfilePlant(foot,profile);
      const shin=Math.hypot(1.31,.04),fullDrop=.3463,toeAngle=profile?profileToeAngle:standardSquatToeAngle;
      const seat=squatBarOffset(build.torso);
      // Begin close to extension with the bar balanced above the foot. The
      // knees open toward the toes as the hips and knees bend together.
      const uprightSeat=seat.clone().applyAxisAngle(spineAxis,.15);
      const lean=Math.asin((plant.midfootZ-plant.ankle.z-uprightSeat.z)/(shin+build.femur));
      const tuck=T.MathUtils.smoothstep(phase,.56,.98);
      const shinAngle=T.MathUtils.lerp(lean+.022,T.MathUtils.degToRad(36.5),phase)-(extension?.12*tuck:0);
      const travel=shin*Math.sin(shinAngle);
      const standingX=T.MathUtils.lerp(plant.ankle.x,side*.51,shin/(shin+build.femur));
      const kneeX=T.MathUtils.lerp(standingX,plant.ankle.x+side*Math.sin(toeAngle)*travel,1-(1-phase)**3);
      const kneeZ=plant.ankle.z+travel*Math.cos(toeAngle*phase);
      const kneeY=plant.ankle.y+Math.sqrt(shin**2-(kneeX-plant.ankle.x)**2-(kneeZ-plant.ankle.z)**2);
      const sagittal=Math.sqrt(build.femur**2-(kneeX-side*.51)**2);
      const angle=monotoneGuide([0,.08,.24,.55,.80,1],[-lean+.022,-lean+.068,.28,.98,Math.PI/2,
        Math.PI/2+Math.asin(fullDrop/sagittal)],phase);
      const hip=new T.Vector3(0,kneeY+sagittal*Math.cos(angle),kneeZ-sagittal*Math.sin(angle));
      // Use the articulated shaft seat. When the pelvis tucks and the lumbar
      // arch reduces, the trunk inclines to keep the load over the foot.
      const pelvicOffset=profile?0:extension?.32-.68*tuck:-.075*tuck;
      const fittedSeat=squatBarOffset(build.torso,pelvicOffset);
      const pitch=Math.asin((plant.midfootZ-hip.z)/Math.hypot(fittedSeat.y,fittedSeat.z))
        -Math.atan2(fittedSeat.z,fittedSeat.y);
      const pelvicPitch=pitch+pelvicOffset;
      const origin=hip.sub(new T.Vector3(0,-.17,.005).applyAxisAngle(spineAxis,pelvicPitch));
      return {origin,pitch,pelvicPitch,knee:new T.Vector3(kneeX,kneeY,kneeZ)};
    }
    const rdlTorso=.825,rdlArm=1.13;
    function poseExercise(t){
      const build=state.movement==='squat_types'?(squatBuilds[state.squatBuild]||squatBuilds.shortLong):null;
      const m=build?'squat':state.movement,b=!build&&state.scenario==='b',phase=Math.max(0,Math.min(1,t));
      if(m==='lunge'){poseLunge(phase);return;}
      if(m==='pushup'||m==='bench'){poseHorizontalExercise(phase);return;}
      const smooth=(lo,hi,x)=>{const v=Math.max(0,Math.min(1,(x-lo)/(hi-lo)));return v*v*(3-2*v);};
      exerciseArms.visible=true;equipment.visible=true;equipment.children.forEach(o=>o.visible=false);
      let hipY=3.27,hipZ=0,basePitch=0,pelvisPitch=0,lumbar=0,thoracic=0,cervical=0,rearShift=0,expansion=0,pro=0,bodyLift=0,feetY=.19,feetZ=.045;
      const squat=m==='squat'?squatFrame(build||standardSquat,phase,Boolean(build),b):null;
      const rdl=m==='rdl',torsoScale=rdl?rdlTorso:build?.torso||1;
      const armScale=rdl?rdlArm:1;
      const rdlFeet=new Map();
      let rdlKnee;
      if(rdl){
        for(const l of legs)rdlFeet.set(l.side,supportedFoot(l,l.side*.61,feetZ,0,l.side*T.MathUtils.degToRad(10)));
        const {ankle}=rdlFeet.get(legs[0].side);
        const shinAngle=T.MathUtils.lerp(-.027,b?.075:.025,phase);
        const thighAngle=T.MathUtils.lerp(.078,b?.58:.47,phase);
        const shin=Math.sqrt(1.31**2+.04**2-.05**2),thigh=Math.sqrt(1.63**2+.10**2-.05**2);
        rdlKnee=new T.Vector3(0,ankle.y+shin*Math.cos(shinAngle),ankle.z+shin*Math.sin(shinAngle));
        basePitch=(b?1.19:1.30)*phase;
        pelvisPitch=basePitch*(b?.60:1);
        const pivot=new T.Vector3(0,-.17,.005).applyAxisAngle(spineAxis,pelvisPitch);
        hipY=rdlKnee.y+thigh*Math.cos(thighAngle)-pivot.y;
        hipZ=rdlKnee.z-thigh*Math.sin(thighAngle)-pivot.z;
        lumbar=b?.32*smooth(.20,1,phase):0;
        cervical=b?.105*smooth(.50,1,phase):0;
        pro=b?smooth(.20,1,phase):0;
        rdlPressureCue.visible=true;rdlPressureCue.position.z=b?-.035:.22;
        deadliftFloor.visible=true;
      }
      if(squat){
        hipY=squat.origin.y;hipZ=squat.origin.z;
        pelvisPitch=squat.pelvicPitch;basePitch=squat.pitch;
        floor.visible=true;floor.scale.set(1.65,1.20,1);floorRing.visible=false;
      }
      if(m==='press'||m==='row'){
        hipY=2.24;hipZ=m==='press'?(b?.343:.052):-.08;pelvisPitch=b?-.28:.095;basePitch=b?0:.04;lumbar=b?.10:-.025;thoracic=b?.08:.015;rearShift=b?-.18:0;expansion=b?.16:.015;
        pro=m==='row'?(b?.86:.45)*(1-phase)+(b?.16:-.08*phase):b?.36+.10*phase:.035;
        feetY=b?.67:.19;feetZ=1.40;seat.visible=true;seatedFloor.visible=true;footrest.visible=b;
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
        if(squat||rdl)return new T.Vector3(0,r*torsoScale,-.14).applyAxisAngle(spineAxis,basePitch).add(pelvis.position);
        const steps=28,step=r/steps,stride=step*torsoScale,v=new T.Vector3(0,hipY,hipZ-.14);
        for(let i=0;i<steps;i++){const a=nominalAngle((i+.5)*step);v.y+=Math.cos(a)*stride;v.z+=Math.sin(a)*stride;}
        v.z+=.045*Math.sin(r/2.5*Math.PI*2)-lumbar*.28*bow(r,.10,1.45)-thoracic*.30*bow(r,.95,2.55)+rearShift*smooth(.8,1.9,r);
        return v;
      };
      const angleAt=r=>{const d=centreAt(r+.008).sub(centreAt(Math.max(0,r-.008)));return Math.atan2(d.z,d.y);};
      const turn=p=>centreAt(p[1]).add(new T.Vector3(p[0],0,p[2]+.14).applyAxisAngle(new T.Vector3(1,0,0),angleAt(p[1])));
      const armFrame=r=>{const theta=angleAt(r);return {up:new T.Vector3(0,Math.cos(theta),Math.sin(theta)),forward:new T.Vector3(0,-Math.sin(theta),Math.cos(theta))};};
      const elevationArc=m==='press'?.20*phase:m==='pullup'?.18*(1-phase):0;
      const reachArc=m==='row'?.29*(1-phase)-.075*phase:m==='press'?.07*phase:0;
      const sockets=new Map();
      const shoulderAt=side=>{
        if(sockets.has(side))return torso.localToWorld(sockets.get(side).clone());
        if(rdl)return torso.localToWorld(new T.Vector3(side*(1.04+.025*pro),.83+.19*pro,.02+.29*pro));
        if(squat)return torso.localToWorld(new T.Vector3(side*(1.04+(build?.15*(1-build.torso):0)),.83,.02));
        const shoulder=shoulderPoint(turn,side,elevationArc,reachArc);
        return shoulder;
      };
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
      torso.scale.y=torsoScale;
      torso.position.copy(turn([0,1.42,0]));torso.rotation.set(torsoAngle,0,0);torso.updateMatrixWorld(true);
      head.position.copy(turn([0,2.95,-.08]));head.rotation.set(rdl?basePitch+lumbar+cervical:angleAt(2.95),0,0);
      for(const v of spineGroups){
        const r=v.y-3.3;
        v.node.scale.y=torsoScale;
        v.node.position.copy(squat||rdl?turn([0,r,v.z]):centreAt(r));
        v.node.rotation.set(rdl?basePitch+lumbar*T.MathUtils.smoothstep(r,1.20,2.45):angleAt(r),0,0);
        v.node.visible=true;
      }
      spineGuide.visible=false;torso.visible=true;head.visible=true;pelvis.visible=true;
      arms.forEach(a=>a.node.visible=false);torso.children.forEach(o=>{if(o.isMesh&&o.material===ctxM)o.visible=false;});
      // Rib attachments follow the vertebral curve rather than one rigid chest tilt.
      if(!squat&&!rdl)for(let i=0;i<ribs.length;i++){
        const r=ribs[i],level=2.35-Math.floor(i/2)*.132;
        r.position.copy(torso.worldToLocal(centreAt(level)));r.rotation.x=angleAt(level)-torsoAngle;r.scale.set(1,1,1);
      }
      if(expansion)fitCostalCartilage?.expandPosedRibs(expansion);
      sternum.position.copy(sternumRest);sternum.position.z+=expansion*.08;
      if(m==='pullup'&&b){sternum.position.y+=.05*(1-.20*phase);sternum.position.z+=.035;}
      for(const s of scapulae){
        s.node.visible=true;
        if(rdl||squat){
          s.node.position.set(s.side*(.64+.14*pro),.53,-.36+.12*pro);
          s.node.rotation.set(0,-s.side*(.20+.47*pro),s.side*.11*pro);
          continue;
        }
        const level=1.95,theta=angleAt(level),offset=new T.Vector3(s.side*(.64+.14*pro),0,-.20+.23*pro-expansion*.55).applyAxisAngle(spineAxis,theta);
        s.node.position.copy(torso.worldToLocal(centreAt(level).add(offset)));
        s.node.rotation.set(theta-torsoAngle,-s.side*(.20+.58*pro),0);
        if(m==='press'){s.node.rotation.z=s.side*(.08+.55*phase);s.node.rotation.x-=.075*phase;}
        if(m==='pullup'){s.node.rotation.z=s.side*(.08+.48*(1-phase));s.node.position.y+=.10*(1-phase);}
      }
      if(rdl||squat||m==='press'||m==='pullup')fitAxialPose(phase);
      if((m==='press'||m==='pullup')&&fitShoulderGirdle?.socketOnCage){
        for(const arm of exArms)sockets.set(arm.side,fitShoulderGirdle.socketOnCage(arm.side,shoulderAt(arm.side),m));
        if(m==='pullup'){
          const vectors=explicitPullVectors(1),offset=pullGrip(1)
            .addScaledVector(vectors.upper,-1.08).addScaledVector(vectors.fore,-1.11).sub(shoulderAt(1));
          offset.x=0;hipY+=offset.y;hipZ+=offset.z;bodyLift+=offset.y;
          for(const node of [pelvis,torso,head,...spineGroups.map(v=>v.node)])node.position.add(offset);
          model.updateMatrixWorld(true);
        }
      }
      const L1=Math.hypot(.10,1.63),L2=Math.hypot(1.31,.04),legChecks=[];
      const squatToeAngle=build?profileToeAngle:standardSquatToeAngle;
      for(const l of legs){
        const H=pelvis.localToWorld(new T.Vector3(l.side*.51,-.17,.005));
        const planted=rdl?rdlFeet.get(l.side):squat?squatProfilePlant(l,Boolean(build)):['press','row'].includes(m)?supportedFoot(l,l.side*.61,feetZ,0,0,b?.58:.08):null;
        const A=planted?planted.ankle:m==='pullup'?new T.Vector3(l.side*.61,.19+bodyLift,hipZ+.045):m==='dips'?new T.Vector3(l.side*.61,1.75-.40*phase,-.72):new T.Vector3(l.side*.61,feetY,feetZ);
        const K=squat?new T.Vector3(l.side*Math.abs(squat.knee.x),squat.knee.y,squat.knee.z):
          rdl?new T.Vector3(l.side*.56,rdlKnee.y,rdlKnee.z):twoJoint(H,A,L1,L2,new T.Vector3(0,0,1));
        const fd=K.clone().sub(H),sd=A.clone().sub(K);
        const femurScale=build?Math.sqrt(build.femur**2-.10**2)/1.63:fd.length()/L1;
        const shaft=new T.Vector3(l.side*.10,-1.63*(build?femurScale:1),0).normalize();
        const thighDirection=fd.clone().normalize();
        l.root.position.copy(H);l.femur.quaternion.setFromUnitVectors(shaft,thighDirection);
        // Follow the turned-out knee around the thigh axis while keeping the hip and knee seated.
        if(squat)l.femur.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(thighDirection,-l.side*squatToeAngle*(.45+.30*phase)));
        l.femur.scale.set(1,femurScale,1);
        l.shin.position.copy(K).sub(H);l.shin.quaternion.setFromUnitVectors(new T.Vector3(0,-1.31,.04).normalize(),sd.clone().normalize());l.shin.scale.set(1,sd.length()/L2,1);
        l.foot.position.copy(l.shin.worldToLocal(A.clone()));l.foot.quaternion.copy(l.shin.quaternion).invert();if(planted)l.foot.quaternion.multiply(planted.quaternion);
        else if(m==='dips'||m==='pullup')l.foot.rotation.set(.22,0,0);
        l.foot.scale.y=L2/sd.length();
        l.root.visible=true;l.femur.visible=true;l.shin.visible=true;l.foot.visible=true;l.femurMat.color.setHex(palettes.ivory);l.shinMat.color.setHex(palettes.context);l.footMat.color.setHex(palettes.ivory);
        legChecks.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),...(m==='squat'?{footYaw:l.side*squatToeAngle,footMinHeight:planted.contact.y,kneeAboveHip:K.y-H.y,kneeToePlaneError:new T.Vector3(Math.cos(l.side*squatToeAngle),0,-Math.sin(l.side*squatToeAngle)).dot(K.clone().sub(A))}:planted?{footMinHeight:planted.contact.y,footContact:planted.contact.toArray()}:{})});
      }
      model.updateMatrixWorld(true);
      let gripCentre;
      if(rdl){
        const S=shoulderAt(1),z=.25+.11*phase+.91*pro;
        const reach=2.06*rdlArm+.103;
        const dy=Math.sqrt(reach**2-(S.x-deadliftGripX)**2-(S.z-z)**2);
        gripCentre=new T.Vector3(0,S.y-dy,z);
        tensionEquipment.visible=tensionBar.visible=true;tensionBar.position.copy(gripCentre);
      }
      if(squat){
        const support=axial[15]?.surface||squatSupportLevel.node;
        gripCentre=support.localToWorld(squatBarSeat(squatBarRadius));
        barbell.position.copy(gripCentre);barbell.visible=true;
      }

      const armChecks=[];
      for(const arm of exArms){
        arm.lengthFactor=armScale;
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
          if(rdl){G=gripCentre.clone();G.x=side*deadliftGripX;bend=new T.Vector3(side*.15,0,.20);}
          else if(m==='squat'){G=gripCentre.clone();G.x=side*1.25;bend=new T.Vector3(side,0,-.8);}
          else if(m==='dips'){G=new T.Vector3(side*1.1,3.9,.10);bend=new T.Vector3(side*.40,0,-.90);}
          handDirection=G.clone().sub(S).normalize();W=G.clone().addScaledVector(handDirection,-.17);E=twoJoint(S,W,1.08*armScale,.98*armScale,bend);
        }
        poseSegment(arm.upper,S,E);poseSegment(arm.fore,E,W);poseHand(arm,W,handDirection,G);
        const u=E.clone().sub(S).normalize(),v=W.clone().sub(E).normalize(),elbowAngle=T.MathUtils.radToDeg(Math.acos(T.MathUtils.clamp(-u.dot(v),-1,1))),humeralElevation=T.MathUtils.radToDeg(Math.acos(T.MathUtils.clamp(-u.dot(frame.up),-1,1))),humeralSagittal=T.MathUtils.radToDeg(Math.atan2(u.dot(frame.forward),-u.dot(frame.up)));
        armChecks.push({side,shoulder:S.toArray(),elbow:E.toArray(),wrist:W.toArray(),grip:G.toArray(),upperLength:S.distanceTo(E),foreLength:E.distanceTo(W),elbowAngle,humeralElevation,humeralSagittal});
      }
      if(m==='row'){
        gripCentre=new T.Vector3().fromArray(armChecks[0].grip).add(new T.Vector3().fromArray(armChecks[1].grip)).multiplyScalar(.5);rowHandle.position.copy(gripCentre);rowHandle.visible=true;
        rowUpright.visible=true;
        const d=rowAnchor.clone().sub(gripCentre);cable.position.copy(rowAnchor).add(gripCentre).multiplyScalar(.5);cable.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());cable.scale.y=d.length();cable.visible=true;
      }
      for(const key in regionMaterials)regionMaterials[key].color.setHex(key==='context'?palettes.context:palettes.ivory);
      if(m==='press')for(const s of scapulae)studyMaterial(s.node,studyScapMat);
      landmarks.forEach(x=>x.visible=false);ghost.visible=false;model.updateMatrixWorld(true);
      exerciseDebug={movement:state.movement,scenario:state.scenario||'a',phase,pelvisPitch,basePitch,lumbar,thoracic,cervical,rearShift,posteriorExpansion:expansion,protraction:pro,headPitch:angleAt(2.95),spine:[.25,.70,1.20,1.75,2.25,2.60].map(r=>centreAt(r).toArray()),legs:legChecks,arms:armChecks,bar:gripCentre?gripCentre.toArray():null,support:m==='press'?{backrestAngle:78,padOpacity:studyPadMat.opacity,backrestCentre:pressBackrest.position.toArray(),scapulaeHighlighted:true}:null};
    }

    // A quiet floor and support contact remain useful when the model rotates.
    const floorMat=new T.MeshBasicMaterial({color:0xdfe6f1,transparent:true,opacity:.24,side:T.DoubleSide});
    const floor=mesh(new T.CircleGeometry(1.28,64),floorMat,scene);floor.rotation.x=-Math.PI/2;floor.position.y=.08;floor.scale.set(1,.65,1);
    const deadliftFloor=mesh(new T.CylinderGeometry(1,1,.028,64),floorMat,scene);
    deadliftFloor.scale.set(4.35,1,1.73);
    deadliftFloor.position.set(0,.066,.22);
    deadliftFloor.visible=false;
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
      model.updateMatrixWorld(true);model.traverseVisible(o=>{if(!o.isMesh||o.material===ctxM)return;for(let ancestor=o.parent;ancestor;ancestor=ancestor.parent)if(ancestor===head)return;const line=new T.LineSegments(new T.EdgesGeometry(o.geometry,28),ghostMaterial);line.matrixAutoUpdate=false;line.matrix.copy(o.matrixWorld);ghost.add(line);});
    }
    const labelLayer=document.createElement('div');Object.assign(labelLayer.style,{position:'absolute',inset:'0',pointerEvents:'none',overflow:'hidden'});container.style.position='relative';container.appendChild(labelLayer);
    const labelNodes=new Map(), occupied=[];
    function screenPoint(position){
      const p=position.clone().project(camera);
      return {x:(p.x*.5+.5)*width,y:(.5-p.y*.5)*height,visible:Math.abs(p.x)<=1&&Math.abs(p.y)<=1&&Math.abs(p.z)<=1};
    }
    function label(name,position,style=''){
      const anchor=screenPoint(position);
      if(!anchor.visible)return;
      let item=labelNodes.get(name);
      if(!item){
        const tag=document.createElement('span'),line=document.createElement('i');
        tag.textContent=name;line.setAttribute('aria-hidden','true');
        labelLayer.appendChild(line);labelLayer.appendChild(tag);
        item={tag,line};labelNodes.set(name,item);
      }
      const {tag,line}=item;
      tag.className='azc-model-label '+style;line.className='azc-label-line '+style;
      tag.hidden=false;
      const w=tag.offsetWidth||65,h=tag.offsetHeight||20;
      const offsets=[[10,-h-6],[10,6],[-w-10,-h-6],[-w-10,6],[10,-2*h-10],[-w-10,h+12]];
      for(const [dx,dy] of offsets){
        const left=T.MathUtils.clamp(anchor.x+dx,3,width-w-3);
        const top=T.MathUtils.clamp(anchor.y+dy,4,height-h-4);
        const right=left+w,bottom=top+h;
        if(occupied.some(r=>left<r.right+2&&right>r.left-2&&top<r.bottom+2&&bottom>r.top-2))continue;
        if(anchor.x>=left&&anchor.x<=right&&anchor.y>=top&&anchor.y<=bottom)continue;
        occupied.push({left,top,right,bottom});
        tag.style.left=left+'px';tag.style.top=top+'px';
        const endX=T.MathUtils.clamp(anchor.x,left,right),endY=T.MathUtils.clamp(anchor.y,top,bottom);
        line.hidden=false;line.style.left=anchor.x+'px';line.style.top=anchor.y+'px';
        line.style.width=Math.hypot(endX-anchor.x,endY-anchor.y)+'px';
        line.style.transform='rotate('+Math.atan2(endY-anchor.y,endX-anchor.x)+'rad)';
        return;
      }
      tag.hidden=true;
    }
    function labelPelvicLandmarks(){
      for(const [front,index] of [[true,0],[false,1]]){
        const points=[index,index+2].map((i,side)=>({name:(side?'Left':'Right')+(front?' front ilium':' rear ilium'),p:landmarks[i].getWorldPosition(new T.Vector3())}));
        points.sort((a,b)=>a.p.distanceToSquared(camera.position)-b.p.distanceToSquared(camera.position));
        const a=screenPoint(points[0].p),b=screenPoint(points[1].p);
        label(points[0].name,points[0].p,front?'azc-front-mark':'azc-rear-mark');
        const sideOn=Math.abs(Math.sin(yaw)*Math.cos(pitch))>.985;
        if(!a.visible||(!sideOn&&Math.hypot(a.x-b.x,a.y-b.y)>12))label(points[1].name,points[1].p,(front?'azc-front-mark':'azc-rear-mark')+' azc-far-mark');
      }
    }
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
    let drag=null,helmetFrame=0,helmetProgress=0,helmetOpen=false,helmetDistance=1,helmetYaw=0,helmetPitch=0;
    function closeHelmet(){
      if(!helmetOpen&&!helmetProgress)return;
      cancelAnimationFrame(helmetFrame);helmetFrame=0;helmetOpen=false;helmetProgress=0;
      skull.userData.setOpening(0);
    }
    function toggleHelmet(){
      if(helmetProgress===0){
        const normal=new T.Vector3(.38,.12,1).applyQuaternion(skull.getWorldQuaternion(new T.Quaternion())).normalize();
        helmetYaw=Math.atan2(Math.sin(Math.atan2(normal.x,normal.z)-yaw),Math.cos(Math.atan2(normal.x,normal.z)-yaw));
        helmetPitch=Math.asin(normal.y)-pitch;helmetDistance=distance;
      }
      helmetOpen=!helmetOpen;
      cancelAnimationFrame(helmetFrame);
      const start=performance.now(),from=helmetProgress,to=Number(helmetOpen);
      const reduced=document.documentElement?.dataset.lzMotion==='reduced'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const duration=reduced?0:490*Math.abs(from-to);
      function animate(now){
        if(disposed)return;
        const t=duration?Math.min(1,(now-start)/duration):1;
        helmetProgress=from+(to-from)*t;skull.userData.setOpening(helmetProgress);
        render();if(t<1)helmetFrame=requestAnimationFrame(animate);
      }
      animate(start);
    }
    const helmetRay=new T.Raycaster();
    function helmetAt(event){
      if(isDevelopment()||!head.visible||!skull?.userData.setOpening)return false;
      const rect=canvas.getBoundingClientRect();
      const pointer=new T.Vector2((event.clientX-rect.left)*2/rect.width-1,1-(event.clientY-rect.top)*2/rect.height);
      helmetRay.setFromCamera(pointer,camera);
      const hits=[];skull.traverseVisible(o=>{if(o.isMesh)o.raycast(helmetRay,hits);});
      if(!hits.length)return false;
      const nearest=Math.min(...hits.map(h=>h.distance));
      const blockers=[];
      model.traverseVisible(o=>{
        if(!o.isMesh)return;
        for(let parent=o.parent;parent;parent=parent.parent)if(parent===skull)return;
        o.raycast(helmetRay,blockers);
      });
      return !blockers.some(h=>h.distance<nearest-.004);
    }
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
        if(drag||e.button!==0)return;
        drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor='grabbing';
      });
      onCanvas('pointermove',e=>{
        if(!drag||e.pointerId!==drag.id)return;
        if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5)return;
        drag.moved=true;
        yaw-=(e.clientX-drag.x)*.008;
        pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.006,-Math.PI/2,Math.PI/2);
        drag.x=e.clientX;drag.y=e.clientY;
        controls.onOrbit?.(yaw,pitch);
        render();
      });
      const end=e=>{
        if(!drag||e.pointerId!==drag.id)return;
        const tap=e.type==='pointerup'&&!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5;
        drag=null;canvas.style.cursor='grab';
        if(tap&&helmetAt(e))toggleHelmet();
      };
      onCanvas('pointerup',end);onCanvas('pointercancel',end);onCanvas('lostpointercapture',end);
      onCanvas('wheel',e=>{
        e.preventDefault();
        const factor=e.deltaY>0?1.06:1/1.06;
        if(controls.onZoom)controls.onZoom(factor);else zoomCamera(factor);
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
    function fallbackDraw(activeScene=scene){
      ctx.clearRect(0,0,width,height);
      activeScene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const triangles=[];
      const projection=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
      activeScene.traverseVisible(mesh=>{
        if(mesh===balanceLine||mesh===comDot)return;
        if(!mesh.isMesh||!mesh.material.visible||mesh.material.opacity<=0)return;
        const geometry=mesh.geometry,{position,color}=geometry.attributes,index=geometry.index;
        const material=mesh.material,vertexColors=material.vertexColors&&color;
        let projected=projectedBuffers.get(geometry);
        if(!projected){projected=new Float32Array(position.count*4);projectedBuffers.set(geometry,projected);}
        cameraModel.multiplyMatrices(projection,mesh.matrixWorld);
        for(let i=0;i<position.count;i++){
          point.fromBufferAttribute(position,i);
          const matrix=cameraModel.elements,offset=i*4;
          projected[offset+3]=matrix[3]*point.x+matrix[7]*point.y+matrix[11]*point.z+matrix[15];
          point.applyMatrix4(cameraModel);
          projected[offset]=(point.x*.5+.5)*width;
          projected[offset+1]=(-point.y*.5+.5)*height;
          projected[offset+2]=point.z;
        }
        const len=index?index.count:position.count;
        for(let i=0;i<len;i+=3){
          const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2;
          const a=ia*4,b=ib*4,c=ic*4;
          // A perspective divide reverses points behind the eye. Exclude
          // those facets before the software painter sorts the visible head.
          if(Math.min(projected[a+3],projected[b+3],projected[c+3])<camera.near)continue;
          let ax=projected[a],ay=projected[a+1],bx=projected[b],by=projected[b+1],cx=projected[c],cy=projected[c+1];
          const winding=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
          if(Math.abs(winding)<.08||
              material.side===T.FrontSide&&winding>0||material.side===T.BackSide&&winding<0)continue;
          if(Math.min(ax,bx,cx)>width||Math.max(ax,bx,cx)<0||Math.min(ay,by,cy)>height||Math.max(ay,by,cy)<0)continue;
          const az=projected[a+2],bz=projected[b+2],cz=projected[c+2];
          if(Math.min(az,bz,cz)>1||Math.max(az,bz,cz)<-1)continue;
          displayColor.copy(material.color);
          if(vertexColors){
            displayColor.r*=(vertexColors.getX(ia)+vertexColors.getX(ib)+vertexColors.getX(ic))/3;
            displayColor.g*=(vertexColors.getY(ia)+vertexColors.getY(ib)+vertexColors.getY(ic))/3;
            displayColor.b*=(vertexColors.getZ(ia)+vertexColors.getZ(ib)+vertexColors.getZ(ic))/3;
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
            opacity:material.opacity,order:material.userData.groundSurface?-1:material.depthTest===false?mesh.renderOrder:0});
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
      if(activeScene===scene&&ghost.visible)drawGhostOutline(projection);
      ctx.globalAlpha=1;
      if(activeScene===scene&&previewEquipment.visible&&comDot.visible)drawBalanceGuide(projection);
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
    function cameraUpdate(){
      let centre=target,azimuth=yaw,elevation=pitch,radius=distance;
      if(state.movement==='baby'&&developmentModel){
        centre=developmentModel.babyCenter();
      }
      // Compare shaft and joint heights without parallax from the near plate.
      const fit=tensionFrames[state.movement];
      camera=isDeadlift(state.movement)||fit?deadliftCamera:perspective;
      if(fit){
        const [x,y,z]=fit.half;
        const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));
        // Project the whole movement envelope, including during manual orbit.
        const horizontal=x*c+z*s;
        const vertical=y*Math.abs(Math.cos(pitch))+(x*s+z*c)*Math.abs(Math.sin(pitch));
        radius*=Math.max(vertical,horizontal/perspective.aspect);
      }else if(camera===deadliftCamera){
        const span=Math.hypot(8.85*Math.cos(yaw),4.15*Math.sin(yaw));
        const widthScale=1/(2*halfFovTan*perspective.aspect);
        const baseDistance=state.movement==='tension_deadlift'?11.7:13.1;
        radius*=Math.max(baseDistance,span*widthScale)/Math.max(baseDistance,4.15*widthScale);
      }
      if(helmetProgress&&head.visible&&!isDevelopment()){
        const t=helmetProgress*helmetProgress*(3-2*helmetProgress);
        const point=skull.localToWorld(new T.Vector3(0,.28,.01));
        centre=centre.clone().lerp(point,t);azimuth+=helmetYaw*t;
        elevation=T.MathUtils.clamp(pitch+helmetPitch*t,-Math.PI/2,Math.PI/2);
        radius=T.MathUtils.lerp(distance,Math.max(1.6,2.70*distance/helmetDistance),t);
      }
      if(camera===deadliftCamera){
        camera.top=radius*halfFovTan;camera.bottom=-camera.top;
        camera.right=camera.top*perspective.aspect;camera.left=-camera.right;
        radius=12;
      }
      camera.up.set(-Math.sin(azimuth)*Math.sin(elevation),Math.cos(elevation),-Math.cos(azimuth)*Math.sin(elevation));
      camera.position.set(centre.x+Math.sin(azimuth)*Math.cos(elevation)*radius,centre.y+Math.sin(elevation)*radius,centre.z+Math.cos(azimuth)*Math.cos(elevation)*radius);
      camera.lookAt(centre);camera.updateProjectionMatrix();
    }
    // Use tracked points on the displayed surfaces, including deforming cartilage.
    const sideRib=ribs[9].children[0],ribPoints=sideRib.geometry.attributes.position;
    let lateralVertex=0;
    for(let i=1;i<ribPoints.count;i++)if(ribPoints.getX(i)>ribPoints.getX(lateralVertex))lateralVertex=i;
    const otherRib=ribs[8].children[0],otherPoints=otherRib.geometry.attributes.position;
    let oppositeVertex=0;
    for(let i=1;i<otherPoints.count;i++)if(otherPoints.getX(i)<otherPoints.getX(oppositeVertex))oppositeVertex=i;
    const ribPoint=()=>sideRib.localToWorld(new T.Vector3().fromBufferAttribute(ribPoints,lateralVertex));
    const costalMargin=ribs[16].getObjectByName('Costal cartilage 9 (right)');
    const rightBlade=scapulae[0].node.children[0];
    rightBlade.geometry.computeBoundingSphere();
    const fixedTargetLabel=document.createElement('span');
    fixedTargetLabel.className='azc-target-label';
    fixedTargetLabel.textContent='Fixed balance target';
    labelLayer.appendChild(fixedTargetLabel);
    const guide=document.createElement('canvas');
    guide.className='azc-baby-overlay';guide.setAttribute('aria-hidden','true');
    guide.hidden=true;labelLayer.appendChild(guide);
    let guidePen;
    function drawBabyBalance(){
      if(!guidePen)guidePen=guide.getContext('2d');
      if(!guidePen)return;
      const ratio=Math.min(2,window.devicePixelRatio||1);
      const w=Math.round(width*ratio),h=Math.round(height*ratio);
      if(guide.width!==w||guide.height!==h){guide.width=w;guide.height=h;}
      const pen=guidePen;
      pen.setTransform(ratio,0,0,ratio,0,0);pen.clearRect(0,0,width,height);
      const {center,ground,hull,rail}=developmentModel.balance;
      const project=p=>screenPoint(p);
      const dot=(p,r,color,fill)=>{
        pen.beginPath();pen.arc(p.x,p.y,r,0,Math.PI*2);
        if(fill){pen.fillStyle=fill;pen.fill();}
        pen.strokeStyle=color;pen.lineWidth=2;pen.stroke();
      };
      const footprint=hull.map(v=>new T.Vector3(v.x,ground.y,v.z));
      const inFront=p=>p.clone().applyMatrix4(camera.matrixWorldInverse).z < -camera.near;
      if(hull.length>=3&&footprint.every(inFront)){
        pen.beginPath();footprint.forEach((v,i)=>{
          const p=project(v);
          if(i)pen.lineTo(p.x,p.y);else pen.moveTo(p.x,p.y);
        });pen.closePath();pen.fillStyle='rgba(20,137,135,.18)';pen.fill();
        pen.strokeStyle='#168783';pen.lineWidth=1.6;pen.stroke();
      }
      for(const support of rail)if(inFront(support))dot(project(support),5,'#086763','#c1f2e9');
      const c=project(center),g=project(ground);
      if((!c.visible&&!g.visible)||!inFront(center)||!inFront(ground))return;
      pen.beginPath();pen.moveTo(c.x,c.y);pen.lineTo(g.x,g.y);
      pen.strokeStyle='#805015';pen.lineWidth=2;pen.setLineDash([3,4]);pen.stroke();pen.setLineDash([]);
      dot(g,5,'#81501a','#fff4d8');dot(c,6,'#503422','#ffc25c');
    }
    let developmentModel;
    const isDevelopment=()=>state.movement==='baby'||state.movement==='chimp';
    const speciesTags=['Human','Chimpanzee'].map(name=>{
      const tag=document.createElement('span');tag.className='azc-species-tag';tag.textContent=name;
      tag.hidden=true;labelLayer.appendChild(tag);return tag;
    });
    function render(){if(disposed)return;cameraUpdate();camera.updateMatrixWorld(true);
      guide.hidden=state.movement!=='baby';
      if(isDevelopment()){
        const comparing=state.movement==='chimp';
        if(!comparing)developmentModel.showBabyMat(camera.position.y>=0);
        const anchors=comparing?developmentModel.layout(yaw,state.mode==='chain'):[];
        if(renderer)renderer.render(developmentModel.scene,camera);else fallbackDraw(developmentModel.scene);
        if(!guide.hidden)drawBabyBalance();
        for(const {tag,line} of labelNodes.values()){tag.hidden=true;line.hidden=true;}
        fixedTargetLabel.hidden=true;
        speciesTags.forEach((tag,i)=>{
          const p=comparing?screenPoint(anchors[i]):null;
          tag.hidden=!p?.visible;
          if(!tag.hidden){tag.style.left=p.x+'px';tag.style.top=p.y+'px';}
        });
        return;
      }
      for(const tag of speciesTags)tag.hidden=true;
      if(renderer)renderer.render(scene,camera);else fallbackDraw();
      fixedTargetLabel.hidden=!previewEquipment.visible;
      if(previewEquipment.visible){
        const base=balanceLine.localToWorld(new T.Vector3(0,-.5,0)).project(camera);
        const x=(base.x*.5+.5)*width,y=(.5-base.y*.5)*height;
        fixedTargetLabel.hidden=Math.abs(base.z)>1||x<0||x>width||y<0||y>height-24;
        if(!fixedTargetLabel.hidden){
          const half=fixedTargetLabel.offsetWidth/2;
          fixedTargetLabel.style.left=Math.max(half,Math.min(width-half,x))+'px';
          fixedTargetLabel.style.top=(y+4)+'px';
        }
      }
      for(const {tag,line} of labelNodes.values()){tag.hidden=true;line.hidden=true;}
      occupied.length=0;if(!state.labels)return;
      if(state.movement==='tilt'){labelPelvicLandmarks();return;}
      const movement=state.movement;
      if(movement==='lunge'&&exerciseDebug){label('Pelvis',landmarks[2].getWorldPosition(new T.Vector3()));const f=exerciseDebug.legs.find(l=>l.side===-1),b=exerciseDebug.legs.find(l=>l.side===1);label('Right front',new T.Vector3(...f.ankle));label('Left rear',new T.Vector3(...b.ankle));return;}
      if(movement==='deadlift_types'&&tensionDebug){
        const near=camera.position.x<0?0:1;
        const leg=tensionDebug.joints[near],arm=exArms[near],bar=tensionDebug.bar;
        label('Shoulder',arm.upper.getWorldPosition(new T.Vector3()));
        label('Hip joint',new T.Vector3(...leg.hip));
        label('Knee joint',new T.Vector3(...leg.knee));
        label('Bar shaft',new T.Vector3(0,bar[1],bar[2]));return;
      }
      if(movement==='squat_types'&&exerciseDebug){
        const leg=exerciseDebug.legs[0],bar=exerciseDebug.bar;
        label('Hip joint',new T.Vector3(...leg.hip));label('Knee',new T.Vector3(...leg.knee));
        label('Bar',new T.Vector3(-1.55,bar[1],bar[2]));return;
      }
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
    const straight=new T.Group();previewEquipment.add(straight);between(straight,[-1.95,0,0],[1.95,0,0],comparisonBarRadius,comparisonBarRadius,previewSteel);for(const x of[-1.88,1.88]){const p=mesh(new T.CylinderGeometry(.27,.27,.12,20),previewSteel,straight);p.rotation.z=Math.PI/2;p.position.x=x;}
    const safety=new T.Group(), safetyPlateCenter=new T.Vector3();
    previewEquipment.add(safety);
    const handleBend=new T.Vector3(.56,-.02,.76);
    const handleEnd=new T.Vector3(.56,-.38,1.18);
    const safetyGrip=handleBend.clone().lerp(handleEnd,.78);
    const sleeveStart=handleBend.clone().lerp(handleEnd,.59);
    between(safety,[-1.10,0,0],[1.10,0,0],.055,.055,previewMetal);
    between(safety,[-.20,0,0],[.20,0,0],.12,.12,previewFoam);
    for(const side of[-1,1]){
      // The yoke runs behind the neck and over each shoulder before the grips turn down.
      const x=side*handleBend.x;
      between(safety,[x,0,0],[x,handleBend.y,handleBend.z],.045,.045,previewMetal);
      between(safety,[x,0,.10],[x,-.014,.55],.105,.105,previewFoam);
      between(safety,[x,handleBend.y,handleBend.z],[x,handleEnd.y,handleEnd.z],.042,.042,previewMetal);
      between(safety,[x,sleeveStart.y,sleeveStart.z],[x,handleEnd.y,handleEnd.z],.050,.050,previewFoam);
      between(safety,[side*1.10,0,0],[side*1.30,-.12,0],.055,.055,previewMetal);
      between(safety,[side*1.30,-.12,0],[side*1.49,-.42,.50],.055,.055,previewMetal);
      between(safety,[side*1.30,-.42,.50],[side*1.75,-.42,.50],.055,.055,previewMetal);
      const plate=mesh(new T.CylinderGeometry(.30,.30,.15,24),previewSteel,safety);
      plate.rotation.z=Math.PI/2;plate.position.set(side*1.49,-.42,.50);
      safetyPlateCenter.addScaledVector(plate.position,.5);
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
      const apparatusOffset=heel
        ? squatBarSeat(comparisonBarRadius).add(V(0,squatSupportLevel.y-3.3,squatSupportLevel.z)).applyQuaternion(rotation)
        : safetyBar?offset(0,2.49,-.58):offset(0,1.95,.78);
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
        const gripOffset=heel?V(s*1.25,0,0):safetyBar?V(s*safetyGrip.x,safetyGrip.y,safetyGrip.z):V(s*.185,.20,0);
        const grip=gripOffset.applyQuaternion(rotation).add(apparatusOffset);
        if(safetyBar)arm.contactAxis=handleEnd.clone().sub(handleBend).applyQuaternion(rotation).normalize();
        const wrist=grip.clone().add(V(0,-.13,0));
        const elbow=twoJoint(shoulder,wrist,1.08,.98,V(s*.25,-1,-.25));
        poseSegment(arm.clavicle,offset(0,2.4,.3),shoulder);
        poseSegment(arm.upper,shoulder,elbow);
        poseSegment(arm.fore,elbow,wrist);
        poseHand(arm,wrist,grip.clone().sub(wrist).normalize(),grip);
      }
      fitShoulderGirdle?.fitHands(m);
      const upperMoment=offset(0,1.05,-.03).multiplyScalar(trunkMass).addScaledVector(offset(0,2.95,-.08),headMass);
      // Fraction of segment length measured from its proximal joint (Winter, 2009).
      const addSegment=(sum,start,end,mass,fraction)=>sum.addScaledVector(start,mass*(1-fraction)).addScaledVector(end,mass*fraction);
      for(const arm of exArms){
        addSegment(upperMoment,arm.upper.position,arm.fore.position,upperArmMass,.436);
        addSegment(upperMoment,arm.fore.position,arm.hand.position,forearmMass,.430);
        addSegment(upperMoment,arm.hand.position,arm.contact,handMass,.5);
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
          addSegment(moment,H,K,thighMass,.433);
          addSegment(moment,K,A,shinMass,.433);
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
      const hipAxis=V(0,-.17,.005);
      pelvis.rotation.x=pitch*.45;
      pelvis.position.copy(origin).add(hipAxis).sub(hipAxis.clone().applyQuaternion(pelvis.quaternion));
      torso.position.copy(offset(0,1.42,0)).add(origin);
      head.position.copy(offset(0,2.95,-.08)).add(origin);
      head.quaternion.copy(rotation);
      for(const v of spineGroups){
        v.node.position.copy(offset(0,v.y-3.3,v.z)).add(origin);
        v.node.quaternion.copy(rotation);
      }
      blendLumbar();
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

    const deadliftGripX=.90;
    const plateRadius=.82, unitsPerMeter=plateRadius/.225;
    const pullFloorY=.08, groundedBarY=pullFloorY+plateRadius, ankleZ=.045;
    const setupBarZ=.329, lockoutBarZ=.23, lockoutLean=.052;

    // Monotone cubic interpolation keeps the calibrated joint paths smooth
    // and prevents overshoot between the guide poses.
    function monotoneGuide(stops,values,phase){
      const last=stops.length-1;
      const rate=i=>(values[i+1]-values[i])/(stops[i+1]-stops[i]);
      const slope=i=>{
        if(i===0)return rate(0);
        if(i===last)return rate(last-1);
        const before=rate(i-1),after=rate(i);
        if(before*after<=0)return 0;
        const left=stops[i]-stops[i-1],right=stops[i+1]-stops[i];
        return 3*(left+right)/((left+2*right)/before+(2*left+right)/after);
      };
      let i=0;
      while(i<last-1&&phase>stops[i+1])i++;
      const span=stops[i+1]-stops[i],t=(phase-stops[i])/span,u=1-t;
      return values[i]+t*t*(3-2*t)*(values[i+1]-values[i])
        +t*u*span*(u*slope(i)-t*slope(i+1));
    }

    function conventionalPullFrame(lift,build){
      const V=(x,y,z)=>new T.Vector3(x,y,z);
      const ankleY=pullFloorY-Math.min(...tensionFootPoints(legs[0]).map(v=>v.y));
      const thigh=Math.hypot(1.63,Math.sqrt(.10**2-.05**2));
      const shin=Math.sqrt(1.31**2+.04**2-.05**2);
      const torsoY=2.25*build.torso+.17,torsoZ=.015,torsoLength=Math.hypot(torsoY,torsoZ);
      const reach=Math.sqrt((2.06*build.arm+.103)**2-(1.04-deadliftGripX)**2);
      const kneeAt=angle=>({y:ankleY+shin*Math.cos(angle),z:ankleZ+shin*Math.sin(angle)});
      const hipAt=(knee,angle)=>V(0,knee.y+thigh*Math.cos(angle),knee.z-thigh*Math.sin(angle));

      // Ground the plates and place the hip at the rear intersection of the
      // thigh and torso circles. Each build has a calibrated setup and knee pass.
      const startKnee=kneeAt(build.setupShin);
      const sy=groundedBarY+Math.sqrt(reach**2-build.shoulderLead**2)-startKnee.y;
      const sz=setupBarZ+build.shoulderLead-startKnee.z;
      const span=Math.hypot(sy,sz);
      const along=(thigh**2+span**2-torsoLength**2)/(2*span);
      const behind=Math.sqrt(thigh**2-along**2);
      const startThigh=Math.atan2(behind*sy-along*sz,along*sy+behind*sz);
      const finishHip=hipAt(kneeAt(-lockoutLean),lockoutLean);
      const finishBarY=finishHip.y+torsoY-Math.sqrt(reach**2-(finishHip.z+torsoZ-lockoutBarZ)**2);

      // Use shaft height for the knee clearance landmarks, so the shorter
      // and longer pulls reach the corresponding poses at different times.
      const travel=finishBarY-groundedBarY;
      const kneePass=(kneeAt(0).y-groundedBarY)/travel;
      const phase=lift+lift*lift*(1-lift);
      const keys=[0,kneePass*.62,kneePass,kneePass+(1-kneePass)*.42,kneePass+(1-kneePass)*.80,1];
      const pass=build.kneePassThigh;
      const shinAngle=monotoneGuide(keys,[build.setupShin,build.setupShin*.31,-.032,-.018,-.029,-lockoutLean],phase);
      const thighAngle=monotoneGuide(keys,[startThigh,(startThigh+pass)*.5,pass,pass*.71,pass*.28,lockoutLean],phase);
      const bar=V(0,groundedBarY+travel*phase,monotoneGuide(keys,[setupBarZ,.321,.28,.185,.207,lockoutBarZ],phase));
      const knee=kneeAt(shinAngle),hip=hipAt(knee,thighAngle);

      // Find the forward trunk orientation with a fixed shoulder-to-grip
      // reach. The bar, arm length and leg positions determine the hinge.
      const dy=bar.y-hip.y,dz=bar.z-hip.z,toBar=Math.hypot(dy,dz);
      const cosine=(toBar**2+torsoLength**2-reach**2)/(2*toBar*torsoLength);
      const pitch=Math.atan2(dz,dy)-Math.acos(T.MathUtils.clamp(cosine,-1,1))-Math.atan2(torsoZ,torsoY);
      const Q=new T.Quaternion().setFromAxisAngle(spineAxis,pitch);
      const origin=hip.sub(V(0,-.17,.005).applyQuaternion(Q));
      return {origin,Q,bar,kneeTargets:new Map(legs.map(l=>[l.side,V(l.side*.56,knee.y,knee.z)]))};
    }

    // Slight yielding through the chain, with most visible recoil at the ankle.
    function poseTensionPogo(phase){
      const p=T.MathUtils.clamp(phase,0,1),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),contactEnd=.30;
      const contact=p<=contactEnd||p===1;
      const u=p===1?0:contact?p/contactEnd:(p-contactEnd)/(1-contactEnd);
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

    const tensionIds=new Set(['deadlift_types','tension_deadlift','tension_pushup','tension_swing','tension_pogo','tension_cat']);
    let tensionDebug=null;
    const tensionEquipment=new T.Group();scene.add(tensionEquipment);
    const tensionLoad=new T.MeshStandardMaterial({color:0x304b65,roughness:.68,metalness:.14,transparent:true,opacity:.18,depthWrite:false});
    tensionLoad.userData.azStudyAlpha=true;
    const tensionBar=new T.Group();tensionEquipment.add(tensionBar);
    // Dimensions in meters, scaled from the 450 mm plates.
    const collarFace=.6575,barEnd=1.10,shaftRadius=.01425,sleeveRadius=.0255;
    function barCylinder(from,to,radius,material){
      const part=mesh(new T.CylinderGeometry(radius*unitsPerMeter,radius*unitsPerMeter,
        (to-from)*unitsPerMeter,48),material,tensionBar);
      part.rotation.z=Math.PI/2;
      part.position.x=(from+to)*.5*unitsPerMeter;
      return part;
    }
    barCylinder(-collarFace,collarFace,shaftRadius,steel).name='Bar shaft';
    for(const side of [-1,1]){
      const section=(from,to,radius,material,name)=>{
        const bounds=side<0?[-to,-from]:[from,to];
        barCylinder(...bounds,radius,material).name=name;
      };
      section(collarFace,barEnd,sleeveRadius,steel,'Sleeve');
      section(collarFace,collarFace+.025,.047,steel,'Inner collar');
      section(collarFace+.025,collarFace+.070,.225,tensionLoad,'450 mm plate');
      section(collarFace+.070,collarFace+.117,.051,steel,'Locking collar');
    }
    const tensionSpineMaterials=new Map(),tensionSpineMeshes=[];
    for(const v of spineGroups)v.node.traverse(o=>{if(!o.isMesh)return;const original=o.material;if(!tensionSpineMaterials.has(original))tensionSpineMaterials.set(original,original.clone());tensionSpineMeshes.push({mesh:o,original,highlight:tensionSpineMaterials.get(original)});});
    function tensionHighlight(m,p){
      let level=m==='tension_deadlift'?.95:m==='tension_pushup'?.54:m==='tension_cat'?.12:m==='tension_swing'?.30+.60*Math.pow(Math.sin(Math.PI*p),2):.30;
      for(const mat of tensionSpineMaterials.values())mat.color.copy(new T.Color(palettes.ivory)).lerp(new T.Color(0x4d83b4),level);
      thorM.color.copy(new T.Color(palettes.ivory)).lerp(new T.Color(0x709dbf),level*.80);pelvicM.color.copy(new T.Color(palettes.ivory)).lerp(new T.Color(0x709dbf),level*.70);
      if(m==='tension_pogo'){const contact=tensionDebug.contact;for(const l of legs){l.footMat.color.setHex(contact?0x4d83b4:0xa6bccb);l.shinMat.color.setHex(contact?0x7ea8c4:palettes.context);}}
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
      const p=T.MathUtils.clamp(phase,0,1),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),lift=m==='deadlift_types'?p:.5-.5*Math.cos(p*Math.PI*2);
      const build=m==='deadlift_types'?(deadliftBuilds[state.bodyType]||deadliftBuilds.longLong):standardDeadliftBuild;
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
      if(m==='tension_swing'||m==='tension_cat'){
        if(m==='tension_swing')poseTensionSwing(lift);else poseTensionCat(p);
        tensionHighlight(m,lift);tensionDebug.cyclePhase=p;return;
      }
      const jointChecks=[],armChecks=[];
      const {origin,Q,bar,kneeTargets}=conventionalPullFrame(lift,build);
      tensionBar.visible=true;tensionBar.position.copy(bar);
      floor.visible=false;deadliftFloor.visible=true;
      const footPitch=0,footLift=0;
      const turn=(x,y,z)=>V(x,y*build.torso,z).applyQuaternion(Q).add(origin);
      torso.scale.y=build.torso;
      pelvis.position.copy(origin);pelvis.quaternion.copy(Q);pelvis.updateMatrixWorld(true);torso.position.copy(turn(0,1.42,0));torso.quaternion.copy(Q);head.position.copy(turn(0,2.95,-.08));head.quaternion.copy(Q);
      for(const v of spineGroups){v.node.position.copy(turn(0,v.y-3.3,v.z));v.node.quaternion.copy(Q);v.node.scale.y=build.torso;}sternum.position.copy(sternumRest);
      for(const l of legs){
        const toeOut=l.side*T.MathUtils.degToRad(14);
        const fQ=new T.Quaternion().setFromEuler(new T.Euler(footPitch,toeOut,0,'YXZ'));
        let minY=Infinity;
        for(const x of tensionFootPoints(l))minY=Math.min(minY,x.clone().applyQuaternion(fQ).y);
        const A=V(l.side*.61,pullFloorY-minY,ankleZ),H=pelvis.localToWorld(V(l.side*.51,-.17,.005));
        const K=kneeTargets.get(l.side);
        l.root.position.copy(H);
        l.femur.quaternion.setFromUnitVectors(V(l.side*.10,-1.63,0).normalize(),K.clone().sub(H).normalize());
        l.shin.quaternion.setFromUnitVectors(V(0,-1.31,.04).normalize(),A.clone().sub(K).normalize());
        // Track the knee toward the toes without moving the hip or ankle.
        const turnLeg=new T.Quaternion().setFromAxisAngle(H.clone().sub(A).normalize(),toeOut);
        K.sub(H).applyQuaternion(turnLeg).add(H);
        l.femur.quaternion.premultiply(turnLeg);
        l.shin.quaternion.premultiply(turnLeg);
        l.femur.scale.set(1,1,1);l.shin.scale.set(1,1,1);
        l.shin.position.copy(K).sub(H);l.root.updateMatrixWorld(true);
        l.foot.position.copy(l.shin.worldToLocal(A.clone()));
        l.foot.quaternion.copy(l.shin.quaternion).invert().multiply(fQ);l.foot.scale.set(1,1,1);
        jointChecks.push({side:l.side,hip:H.toArray(),knee:K.toArray(),ankle:A.toArray(),footMinHeight:minY+A.y,footPitch});
      }
      for(const arm of exArms){
        arm.lengthFactor=build.arm;
        const side=arm.side,S=turn(side*1.04,2.25,.02),G=bar.clone().add(V(side*deadliftGripX,0,0));
        const direction=G.clone().sub(S).normalize(),W=G.clone().addScaledVector(direction,-.17);
        const E=twoJoint(S,W,1.08*build.arm,.98*build.arm,V(side*.25,0,.20));
        poseSegment(arm.clavicle,turn(0,2.40,.30),S);
        poseSegment(arm.upper,S,E);poseSegment(arm.fore,E,W);poseHand(arm,W,direction,G);
        armChecks.push({side,shoulder:S.toArray(),elbow:E.toArray(),wrist:W.toArray(),grip:G.toArray(),upperLength:S.distanceTo(E),foreLength:E.distanceTo(W)});
      }
      model.updateMatrixWorld(true);
      tensionDebug={movement:m,phase:p,lift,joints:jointChecks,legs:jointChecks,arms:armChecks,bar:bar.toArray(),contacts:{floorHeight:pullFloorY,footLift},trunkPitch:new T.Euler().setFromQuaternion(Q).x};
      tensionHighlight('tension_deadlift',p);
    }

    // New teaching examples only. Parent controller owns the playback phase.
    const tensionBellGroup=new T.Group();scene.add(tensionBellGroup);tensionBellGroup.visible=false;
    const tensionBellMaterial=new T.MeshStandardMaterial({color:0x344f6b,roughness:.65,metalness:.12});
    const tensionBellBody=mesh(new T.SphereGeometry(1,24,16),tensionBellMaterial,tensionBellGroup);tensionBellBody.position.y=-.43;tensionBellBody.scale.set(.34,.36,.29);
    const tensionBellBase=mesh(new T.CylinderGeometry(.23,.25,.065,20),tensionBellMaterial,tensionBellGroup);tensionBellBase.position.y=-.72;
    // A straight two-hand grip sits between the curved sides of the handle.
    const bellHandle=new T.CurvePath();
    const handlePoint=(x,y)=>new T.Vector3(x,y,0);
    bellHandle.add(new T.CubicBezierCurve3(handlePoint(-.22,-.18),handlePoint(-.43,-.10),handlePoint(-.54,.19),handlePoint(-.405,.19)));
    bellHandle.add(new T.LineCurve3(handlePoint(-.405,.19),handlePoint(.405,.19)));
    bellHandle.add(new T.CubicBezierCurve3(handlePoint(.405,.19),handlePoint(.54,.19),handlePoint(.43,-.10),handlePoint(.22,-.18)));
    mesh(new T.TubeGeometry(bellHandle,64,.045,12,false),tensionBellMaterial,tensionBellGroup);
    // Centre each hand on its own half of the straight handle, with a gap for the thumbs.
    const bellGrip=handlePoint(.215,.19);
    const tensionFemur=Math.hypot(.10,1.63),tensionShin=Math.hypot(1.31,.04);
    function poseSupportedTensionLeg(leg,hip,knee,plant){
      const V=(x,y,z)=>new T.Vector3(x,y,z),ankle=plant.ankle;
      leg.root.position.copy(hip);
      leg.femur.quaternion.setFromUnitVectors(V(leg.side*.10,-1.63,0).normalize(),knee.clone().sub(hip).normalize());
      leg.shin.position.copy(knee).sub(hip);
      leg.shin.quaternion.setFromUnitVectors(V(0,-1.31,.04).normalize(),ankle.clone().sub(knee).normalize());
      leg.root.updateMatrixWorld(true);
      leg.foot.position.copy(leg.shin.worldToLocal(ankle.clone()));
      leg.foot.quaternion.copy(leg.shin.quaternion).invert().multiply(plant.quaternion);
      return {side:leg.side,hip:hip.toArray(),knee:knee.toArray(),ankle:ankle.toArray(),
        femurLength:hip.distanceTo(knee),tibiaLength:knee.distanceTo(ankle),footMinHeight:plant.contact.y};
    }
    function poseTensionSwing(phase){
      const V=(x,y,z)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep;
      tensionBellGroup.visible=true;
      floor.scale.set(1.8,2.5,1);
      const extension=smooth(phase,.02,.76),pitch=1.25*(1-extension),pelvisPitch=pitch*.78;
      const feet=legs.map(leg=>supportedFoot(leg,leg.side*.68,.04));
      const ankle=feet[0].ankle;
      // Fit standing height to the planted feet and full leg reach. Retain a
      // fraction of a degree at the endpoint of the two-link solve.
      const reach=tensionFemur+tensionShin-.000018;
      const hipHeight=ankle.y+Math.sqrt(reach**2-(.68-.51)**2-(ankle.z-.005)**2);
      const origin=V(0,T.MathUtils.lerp(2.75,hipHeight+.17,extension),-(1-extension));
      const centreAt=r=>V(0,r,-.14+.025*Math.sin(r/2.5*Math.PI*2)).applyAxisAngle(spineAxis,pitch).add(origin);
      const turn=(x,y,z)=>centreAt(y).add(V(x,0,z+.14).applyAxisAngle(spineAxis,pitch));
      pelvis.position.copy(origin);pelvis.rotation.set(pelvisPitch,0,0);
      torso.position.copy(turn(0,1.42,0));torso.rotation.set(pitch,0,0);torso.updateMatrixWorld(true);
      head.position.copy(turn(0,2.95,-.08));head.rotation.set(pitch,0,0);
      for(const level of spineGroups){
        level.node.position.copy(centreAt(level.y-3.3));level.node.rotation.set(pitch,0,0);
      }
      for(let i=0;i<ribs.length;i++){
        ribs[i].position.copy(torso.worldToLocal(centreAt(2.35-Math.floor(i/2)*.132)));
      }
      const raise=smooth(phase,.12,1),pro=.04+.21*raise;
      for(const s of scapulae){
        const offset=V(s.side*(.64+.14*pro),0,-.20+.23*pro).applyAxisAngle(spineAxis,pitch);
        s.node.position.copy(torso.worldToLocal(centreAt(1.95).add(offset)));
        s.node.rotation.set(0,-s.side*(.20+.58*pro),s.side*.26*raise);
      }
      const legChecks=legs.map((leg,i)=>{
        const hip=pelvis.localToWorld(V(leg.side*.51,-.17,.005)),plant=feet[i];
        const knee=twoJoint(hip,plant.ankle,tensionFemur,tensionShin,V(0,0,1),.00001);
        return poseSupportedTensionLeg(leg,hip,knee,plant);
      });
      const reachAcross=1.04-bellGrip.x,reachSag=Math.sqrt(2.22**2-reachAcross**2);
      const swingAngle=-.68+2.14*smooth(phase,.08,1);
      const gripCentre=turn(0,2.25,.02).add(V(0,-Math.cos(swingAngle)*reachSag,Math.sin(swingAngle)*reachSag));
      const bellRotation=new T.Quaternion().setFromAxisAngle(spineAxis,-swingAngle);
      const bellOrigin=gripCentre.clone().sub(V(0,bellGrip.y,bellGrip.z).applyQuaternion(bellRotation));
      tensionBellGroup.position.copy(bellOrigin);tensionBellGroup.quaternion.copy(bellRotation);
      const arms=exArms.map(arm=>{
        const side=arm.side,shoulder=turn(side*1.04,2.25,.02);
        const grip=V(side*bellGrip.x,bellGrip.y,bellGrip.z).applyQuaternion(bellRotation).add(bellOrigin);
        arm.contactAxis=V(1,0,0);
        const direction=grip.clone().sub(shoulder).normalize(),wrist=grip.clone().addScaledVector(direction,-.17);
        const elbow=twoJoint(shoulder,wrist,1.08,.98,V(side*.2,-1,.1));
        poseSegment(arm.upper,shoulder,elbow);poseSegment(arm.fore,elbow,wrist);poseHand(arm,wrist,direction,grip);
        return {side,shoulder:shoulder.toArray(),elbow:elbow.toArray(),wrist:wrist.toArray(),grip:grip.toArray(),upperLength:shoulder.distanceTo(elbow),foreLength:elbow.distanceTo(wrist),wristReach:shoulder.distanceTo(wrist)};
      });
      tensionDebug={movement:'tension_swing',phase,legs:legChecks,arms,pelvisPitch,bell:gripCentre.toArray(),
        spine:[0,.5,1,1.5,2,2.5,2.95].map(r=>centreAt(r).toArray()),
        contacts:{feet:legChecks.map(leg=>leg.ankle),floor:.08},phaseLabel:phase<.30?'Backswing':phase<.70?'Hip Drive':'Float'};
    }

    function poseTensionCat(phase){
      const V=(x,y,z)=>new T.Vector3(x,y,z),flex=Math.sin(2*Math.PI*phase);
      const hipSlide=-.15+.13*flex,kneeY=.273,kneeZ=-1.06;
      const hipY=kneeY+Math.sqrt(tensionFemur**2-(.64-.51)**2-hipSlide**2);
      const archCentre=Math.PI/2+.005;
      const hip=V(0,hipY,kneeZ+hipSlide),hipPivot=V(0,-.17,.005);
      const palmZ=1.34,palmX=1.03,floorY=.08;
      floor.scale.set(2.0,3.5,1);

      // Fit one continuous curve, then rotate it about the hip to keep the
      // shoulder near full reach over the fixed palm as the arch changes.
      function fitCatSpine(tilt){
        const centre=archCentre+tilt;
        pelvis.rotation.set(centre-.25*flex,0,0);
        pelvis.position.copy(hip).sub(hipPivot.clone().applyQuaternion(pelvis.quaternion));
        for(const [i,level] of spineGroups.entries()){
          const pitch=centre+flex*T.MathUtils.lerp(-.25,.33,T.MathUtils.smoothstep(i,0,16));
          level.node.rotation.set(pitch,0,0);
          level.node.position.copy(V(0,level.y-3.3,level.z).applyAxisAngle(spineAxis,centre).add(pelvis.position));
        }
        head.position.copy(V(0,2.95,-.08).applyAxisAngle(spineAxis,centre).add(pelvis.position));
        head.rotation.set(centre+.66*flex,0,0);
        fitAxialPose(phase);
      }
      fitCatSpine(0);
      const palm=V(palmX,floorY,palmZ);
      const contact=fitShoulderGirdle?.floorPivot(1,palm)||palm.clone().add(V(0,.06,-.20));
      const shoulderOffset=torso.localToWorld(V(1.04,.83,.02)).sub(hip),probe=V(0,0,0);
      const armReach=2.112;
      let low=-.46,high=.30;
      for(let i=0;i<18;i++){
        const tilt=(low+high)*.5;
        const span=probe.copy(shoulderOffset).applyAxisAngle(spineAxis,tilt).add(hip).distanceTo(contact);
        if(span>armReach)low=tilt;else high=tilt;
      }
      fitCatSpine((low+high)*.5);

      const legChecks=legs.map(leg=>{
        const knee=V(leg.side*.64,kneeY,kneeZ);
        const plant=supportedFoot(leg,knee.x,0,1.45,0,.08,1.14);
        plant.ankle.z=knee.z-Math.sqrt(tensionShin**2-(plant.ankle.y-knee.y)**2);
        return poseSupportedTensionLeg(leg,pelvis.localToWorld(V(leg.side*.51,-.17,.005)),knee,plant);
      });
      const pro=(flex+1)*.5;
      for(const s of scapulae){
        s.node.position.set(s.side*(.64+.10*pro),.53,-.36+.10*pro);
        s.node.rotation.set(0,-s.side*(.20+.25*pro),0);
      }
      const arms=exArms.map(arm=>{
        const side=arm.side,shoulder=torso.localToWorld(V(side*1.04,.83,.02));
        const contact=V(side*palmX,floorY,palmZ),wrist=fitShoulderGirdle?.floorPivot(side,contact)||contact.clone().add(V(0,.06,-.20));
        const elbow=twoJoint(shoulder,wrist,1.08,.98,V(side*.15,0,-1));
        poseSegment(arm.upper,shoulder,elbow);poseSegment(arm.fore,elbow,wrist);poseHand(arm,wrist,V(0,0,1),contact);
        return {side,shoulder:shoulder.toArray(),elbow:elbow.toArray(),wrist:wrist.toArray(),grip:contact.toArray(),upperLength:shoulder.distanceTo(elbow),foreLength:elbow.distanceTo(wrist),wristReach:shoulder.distanceTo(wrist)};
      });
      tensionDebug={movement:'tension_cat',phase,legs:legChecks,arms,pelvisPitch:pelvis.rotation.x,
        spine:[0,3,7,11,16].map(i=>axial[i].pos.toArray()),
        contacts:{knees:legChecks.map(leg=>leg.knee),palms:arms.map(arm=>arm.grip),floor:.08},
        phaseLabel:Math.abs(flex)<.04?'Neutral':flex>0?'Round':'Extend',segmentalMotion:true};
    }

    // The atlas stores each vertebra relative to a separate animation guide.
    // Join the rendered bones at disc centres in the reference skeleton, so
    // rotating two adjacent guides cannot push one articular surface through the other.
    const lumbarRegistration=[.052,.051,.048,.024,.006];
    const axial=spineGroups.map(({node,y,z},i)=>{
      const surface=node.children.find(o=>o.name.startsWith('BodyParts3D '));
      if(!surface)return null;
      surface.geometry.computeBoundingBox();
      const box=surface.geometry.boundingBox,origin=new T.Vector3(0,y,z+(lumbarRegistration[i]||0));
      const centre=box.getCenter(new T.Vector3()).add(origin);
      centre.z=origin.z+box.max.z-.055;
      return {node,surface,origin,centre,pos:new T.Vector3(),q:new T.Quaternion()};
    });
    const neck=Array.from({length:7},(_,i)=>{
      const surface=head.getObjectByName('BodyParts3D C'+(7-i));
      if(!surface)return null;
      surface.geometry.computeBoundingBox();
      const box=surface.geometry.boundingBox,origin=new T.Vector3(0,6.25,-.08);
      const centre=box.getCenter(new T.Vector3()).add(origin);
      centre.z=origin.z+box.max.z-.045;
      return {node:head,surface,origin,centre,pos:new T.Vector3(),q:new T.Quaternion()};
    });
    const skull=head.getObjectByName('Johnny Iron Man helmet');
    // Sagittal corrections sampled from the opposing atlas surfaces at
    // 0.025-radian intervals, in order from L5/L4 through C2/C1.
    const discClearance=[
      [[0.049,0],[0.043,0],[0.034,0],[0.028,0],[0.019,0],[0.01,0],[0.004,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.061,-0.042],[0.061,-0.03],[0.058,0],[0.049,0],[0.04,0],[0.031,-0.006],[0.025,0],[0.016,0],[0.007,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.049,-0.012],[0.04,-0.012],[0.031,-0.012],[0.025,-0.006],[0.016,-0.006],[0.01,-0.003],[0.001,-0.003],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.028,-0.012],[0.022,-0.009],[0.019,-0.009],[0.01,-0.006],[0.004,-0.003],[0.001,-0.003],[0.001,-0.003],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,-0.003],[0.001,-0.003],[0.001,-0.003],[0.001,-0.006],[0.001,-0.006]],
      [[0.007,-0.003],[0.004,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.025,-0.006],[0.019,-0.006],[0.013,-0.006],[0.01,-0.003],[0.004,-0.003],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.013,-0.006],[0.01,-0.006],[0.007,-0.003],[0.004,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,-0.003],[0.001,-0.003],[0.001,-0.006]],
      [[0.01,-0.006],[0.007,-0.003],[0.004,-0.003],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.007,-0.009],[0.01,-0.003],[0.004,-0.003],[0.004,0],[0.001,0],[0.001,0],[0.001,-0.003],[0.001,-0.003],[0.001,-0.003],[0.001,-0.006],[0.001,-0.006]],
      [[0.013,-0.006],[0.01,-0.003],[0.007,0],[0.004,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.007,-0.003],[0.001,-0.003],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.004,0],[0.001,-0.003]],
      [[0.01,-0.009],[0.007,-0.006],[0.004,-0.003],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.004,0.003],[0.004,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.01,0],[0.007,0],[0.007,0],[0.004,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.013,-0.006],[0.01,-0.003],[0.007,0],[0.004,0],[0.004,0],[0.004,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.013,0],[0.01,0],[0.007,0],[0.004,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.013,0],[0.007,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.013,0],[0.007,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.016,-0.006],[0.01,-0.006],[0.007,0],[0.004,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.022,0],[0.016,-0.003],[0.01,-0.003],[0.007,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.007,-0.003],[0.004,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
      [[0.001,0.003],[0.001,0.003],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0],[0.001,0]],
    ];
    const disc=new T.Vector3(),fromDisc=new T.Vector3(),workQ=new T.Quaternion();
    const spineAxis=new T.Vector3(1,0,0);
    const referenceQ=new T.Quaternion(),stepQ=new T.Quaternion();
    function joinLevels(from,to,index,scale=1,toScale=scale){
      disc.copy(from.centre).lerp(to.centre,.5);
      fromDisc.subVectors(disc,from.origin);fromDisc.y*=scale;
      to.pos.copy(fromDisc.applyQuaternion(from.q)).add(from.pos);
      fromDisc.subVectors(to.origin,disc);fromDisc.y*=toScale;
      to.pos.add(fromDisc.applyQuaternion(to.q));
      const rel=referenceQ.copy(from.q).invert().multiply(to.q);
      const angle=2*Math.atan2(rel.x,rel.w);
      const row=discClearance[index],end=row.length-1;
      const sample=T.MathUtils.clamp(angle/.025+end/2,0,end);
      const lo=Math.floor(sample),hi=Math.min(end,lo+1),t=sample-lo;
      const a=row[lo],b=row[hi];
      fromDisc.set(0,T.MathUtils.lerp(a[0],b[0],t),T.MathUtils.lerp(a[1],b[1],t));
      to.pos.add(fromDisc.applyQuaternion(from.q));
    }
    function seatSurface(level){
      const {node,surface,pos,q}=level;
      if(node.scale.y!==1){
        // Apply each proportion in the bone's own axes. Rotating a child of
        // a nonuniformly scaled guide would shear it during a hip hinge.
        node.updateMatrix();
        surface.matrixAutoUpdate=false;
        surface.matrix.compose(pos,q,node.scale).premultiply(guideInverse.copy(node.matrix).invert());
        surface.matrixWorldNeedsUpdate=true;return;
      }
      workQ.copy(node.quaternion).invert();
      surface.position.copy(pos).sub(node.position).applyQuaternion(workQ).divide(node.scale);
      surface.quaternion.copy(workQ).multiply(q);
    }
    const terminalFrame=new T.Quaternion(),lateralAxis=new T.Vector3(0,0,1);
    const articulatedLessons=new Set(['bench','pushup','lunge','tension_pushup','tension_swing','tension_pogo','squat','squat_types','rdl','row','dips','press','pullup','tension_cat','tension_deadlift','deadlift_types','cgoblet','cheels','csafety']);
    function pitchInFrame(frame,rotation){
      workQ.copy(frame).invert().multiply(rotation);
      return 2*Math.atan2(workQ.x,workQ.w);
    }
    const ribDelta=new T.Matrix4(),actualFrame=new T.Matrix4(),guideInverse=new T.Matrix4(),fromGuide=new T.Matrix4();
    function carryRibsWithVertebrae(){
      torso.updateMatrix();
      const toChest=guideInverse.copy(torso.matrix).invert();
      for(let i=0;i<ribs.length;i++){
        const level=axial[16-Math.floor(i/2)],rib=ribs[i];
        level.node.updateMatrix();if(level.surface.matrixAutoUpdate)level.surface.updateMatrix();rib.updateMatrix();
        actualFrame.multiplyMatrices(level.node.matrix,level.surface.matrix);
        ribDelta.copy(toChest).multiply(actualFrame)
          .multiply(fromGuide.copy(level.node.matrix).invert()).multiply(torso.matrix).multiply(rib.matrix);
        ribDelta.decompose(rib.position,rib.quaternion,rib.scale);

      }
    }
    function seatCostovertebralJoints(){
      if(!fitCostalCartilage?.seatRib)return;
      torso.updateMatrix();
      const toChest=guideInverse.copy(torso.matrix).invert();
      for(let i=0;i<ribs.length;i++){
        const level=axial[16-Math.floor(i/2)];
        level.node.updateMatrix();level.surface.updateMatrix();
        actualFrame.copy(toChest).multiply(level.node.matrix).multiply(level.surface.matrix);
        fitCostalCartilage.seatRib(i,actualFrame,ribParents[i].offset);
      }
    }
    // Register the free shoulder girdle to T1 after the spine has articulated.
    // Keep the same sternum-to-spine relationship as the atlas reference pose.
    const chestAtRest=torso.position.clone();
    function seatLungeChest(top){
      const offset=top.origin.clone().sub(chestAtRest).applyQuaternion(torso.quaternion);
      const shift=top.pos.clone().sub(offset).sub(torso.position);
      torso.position.add(shift);
      for(const arm of exArms){
        for(const part of [arm.upper,arm.fore,arm.hand])part.position.add(shift);
      }
      for(const arm of exerciseDebug.arms){
        for(const key of ['shoulder','elbow','wrist','grip'])
          arm[key]=new T.Vector3().fromArray(arm[key]).add(shift).toArray();
      }
      seatRibsOnSpine();
    }
    function seatFittedChest(top,scale){
      // Keep the sternum and shoulder girdle in the upper thorax frame.
      // Each rib's posterior attachment follows its own seated vertebra.
      torso.quaternion.copy(top.q);
      torso.position.copy(chestAtRest).sub(top.origin);
      torso.position.y*=scale;
      torso.position.applyQuaternion(top.q).add(top.pos);
      torso.updateMatrix();
      const toChest=guideInverse.copy(torso.matrix).invert();
      const dimensions=new T.Vector3(1,scale,1);
      for(let i=0;i<ribs.length;i++){
        const level=axial[16-Math.floor(i/2)],{rib,offset}=ribParents[i];
        actualFrame.compose(level.pos,level.q,dimensions);
        ribDelta.makeTranslation(offset.x,offset.y,offset.z).premultiply(actualFrame).premultiply(toChest);
        ribDelta.decompose(rib.position,rib.quaternion,rib.scale);
      }
      torso.updateMatrixWorld(true);
    }
    function profileBaseOffset(scale){return .049-(scale-.675)*.185;}
    function fitAxialPose(amount){
      if(!axial.every(Boolean)||state.movement==='foot'&&state.mode==='local')return;
      const scale=torso.scale.y,base=axial[0],articulated=articulatedLessons.has(state.movement);
      const trunkTransition=['foot','tilt','chain'].includes(state.movement);
      const last=articulated?15:state.movement==='tilt'?16:13;
      const target=axial[last].node;
      base.q.copy(pelvis.quaternion);
      base.pos.copy(base.origin).sub(fromDisc.set(0,3.3,0)).applyQuaternion(base.q).add(pelvis.position);
      if(state.movement==='ribshift'||state.mode==='chain'&&['hike','ribs','scapula','chain'].includes(state.movement)){
        // Reconstruct the lumbar curve from its disc centres. The rib cage
        // translates with T12, so the ribs stay attached as the pelvis moves.
        const upper=axial[5],span=upper.origin.y-base.origin.y;
        const shift=fromDisc.copy(upper.origin).sub(base.origin).applyQuaternion(base.q).add(base.pos);
        const tilt=upper.node.position.clone().sub(shift).applyQuaternion(workQ.copy(base.q).invert());
        seatSurface(base);
        for(let i=1;i<=5;i++){
          const level=axial[i],t=i/5,bend=Math.sin(Math.PI*t)*1.55/span;
          level.q.copy(base.q).slerp(torso.quaternion,t)
            .multiply(stepQ.setFromAxisAngle(spineAxis,tilt.z*bend))
            .multiply(stepQ.setFromAxisAngle(lateralAxis,-tilt.x*bend));
          joinLevels(axial[i-1],level,i-1,1);
          // The sagittal lookup excludes the extra clearance required by
          // lateral bending between asymmetric articular facets.
          workQ.copy(axial[i-1].q).invert().multiply(level.q);
          const lateral=Math.hypot(workQ.y,workQ.z);
          const gap=i===1?.004+.8*lateral:i===5?.001+1.2*lateral:0;
          const hikeFacet=i===4&&state.movement==='hike'?Math.abs(amount):0;
          level.pos.add(fromDisc.set(0,gap-.003*hikeFacet,-.005*hikeFacet).applyQuaternion(level.q));
          if(i<5)seatSurface(level);
        }
        const residual=fromDisc.copy(upper.pos).sub(upper.node.position);
        torso.position.add(residual);head.position.add(residual);
        for(let i=5;i<axial.length;i++)axial[i].node.position.add(residual);
        return;
      }
      if(!articulated&&!trunkTransition){
        seatSurface(base);
        for(let i=1;i<5;i++){
          const v=axial[i];v.q.copy(v.node.quaternion);
          v.pos.copy(v.node.position).add(fromDisc.set(0,0,lumbarRegistration[i]).applyQuaternion(v.q));
          seatSurface(v);
        }
        return;
      }
      const targetPitch=pitchInFrame(base.q,target.quaternion);
      terminalFrame.copy(target.quaternion).multiply(stepQ.setFromAxisAngle(spineAxis,-targetPitch));
      const m=state.movement;
      let key=m,phase=amount;
      if(['bench','pushup','lunge','row','press','dips','pullup'].includes(m))key+='_'+(state.scenario==='b'?'b':'a');
      const fittedChest=m==='rdl'||m==='squat'||m==='squat_types'||m==='tension_cat';
      const braced=isConventionalPull(m);
      // The pelvis and the cervical bones retain their original dimensions.
      // Seat the two ends of the scaled thoracolumbar column against them.
      if(scale!==1)base.pos.add(fromDisc.set(0,profileBaseOffset(scale),0).applyQuaternion(base.q));
      if(m==='foot'||m==='chain')key+='_'+state.mode;
      if(trunkTransition)phase=(amount+1)/2;
      const samples=braced?null:axialPoseKeys[key],end=samples?samples.length/last-1:0;
      const frame=T.MathUtils.clamp(phase,0,1)*end,lo=Math.floor(frame),hi=Math.min(lo+1,end),mix=frame-lo;
      let angle=0;
      for(let i=1;i<=last;i++){
        if(samples)angle+=.002*T.MathUtils.lerp(samples[lo*last+i-1],samples[hi*last+i-1],mix);
        const v=axial[i];
        // The reference surfaces already contain the spinal curves. Carry the
        // column with the pelvis throughout the braced lifts.
        if(braced)v.q.copy(base.q);
        else if(fittedChest){
          v.q.copy(v.node.quaternion);
          if(m!=='tension_cat')v.q.slerp(base.q,m==='rdl'?1-T.MathUtils.smoothstep(i,0,9):squatPelvisWeight(i));
        }
        else v.q.copy(base.q).slerp(terminalFrame,i/last).multiply(stepQ.setFromAxisAngle(spineAxis,angle));
        joinLevels(axial[i-1],v,i-1,scale);
      }
      if(!articulated){
        for(let i=0;i<last;i++)seatSurface(axial[i]);
        seatCostovertebralJoints();
        return;
      }
      const top=axial[16];top.q.copy(top.node.quaternion);
      const diff=axial[15].q.angleTo(top.q);if(diff>.098)top.q.slerp(axial[15].q,1-.098/diff);
      joinLevels(axial[15],top,15,scale);
      for(const level of axial)seatSurface(level);
      if(m==='lunge')seatLungeChest(top);
      if(fittedChest)seatFittedChest(top,scale);
      else if(['lunge','row','dips','tension_deadlift','deadlift_types'].includes(m))carryRibsWithVertebrae();
      if(!fittedChest&&!braced&&m!=='lunge')seatCostovertebralJoints();
      if(!skull||!neck.every(Boolean))return;
      const lower=axial[16];
      for(let i=0;i<neck.length;i++){
        const v=neck[i];v.q.copy(lower.q).slerp(head.quaternion,(i+1)/8);
        const prev=i?neck[i-1]:lower,angle=prev.q.angleTo(v.q);
        if(angle>.098)v.q.slerp(prev.q,1-.098/angle);
        joinLevels(prev,v,16+i,fittedChest&&i===0?scale:1,1);
        if(!fittedChest&&scale!==1&&i===0)v.pos.add(fromDisc.set(0,.013-(scale-.675)*.05,0).applyQuaternion(v.q));
        seatSurface(v);
      }
      skull.position.copy(neck[6].pos).sub(head.position).applyQuaternion(workQ.copy(head.quaternion).invert());
    }
    function applyPose(amount=state.amount){
      if(isDevelopment()){
        if(!developmentModel){
          developmentModel=window.azDevelopmentLessons.create(T,pelvis,legs,exArms);
          for(const light of scene.children.filter(node=>node.isLight))developmentModel.scene.add(light.clone());
        }
        developmentModel.pose(state,amount);return;
      }
      // Support calibration can run during pose construction. Start from the
      // reference surfaces so the previous lesson cannot alter its result.
      for(const v of [...axial,...neck])if(v){v.surface.matrixAutoUpdate=true;v.surface.position.set(0,0,0);v.surface.quaternion.identity();}
      if(skull)skull.position.set(0,0,0);
      setJointPose(amount);
      const gripMovement=state.movement==='squat_types'?'squat':state.movement;
      // These lifts need the final ribs before solving shoulder or bar contact.
      if(!['squat','rdl','bench','press','pullup','tension_cat'].includes(gripMovement))fitAxialPose(amount);
      if(state.movement!=='bench')fitCostalCartilage?.();
      if(exerciseArms.visible&&!previewDebug)fitShoulderGirdle?.fitHands(gripMovement);
      fitShoulderGirdle?.(gripMovement);
      if(state.movement==='bench'&&exerciseDebug){
        const back=lowestSurfacePoint(backSurfaces),occiput=lowestSurfacePoint([head]);
        exerciseDebug.contacts.upperBackBone=back.toArray();
        exerciseDebug.contacts.upperBack=[back.x,benchPadTop,back.z];
        exerciseDebug.contacts.head=[occiput.x,benchPadTop,occiput.z];
      }
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
      // Seat the proximal shank surfaces in the kneeling pose with the ankle fixed.
      const shankFit=state.movement==='tension_cat'?1.045:1;
      for(const leg of legs) leg.fitPatella?.(shankFit);
    }
    function blendLumbar(){
      pelvis.updateMatrix();torso.updateMatrix();
      for(let i=0;i<5;i++){
        const v=spineGroups[i],fraction=i/5;
        const lower=new T.Vector3(0,v.y-3.3,v.z).applyMatrix4(pelvis.matrix);
        const upper=new T.Vector3(0,v.y-4.72,v.z).applyMatrix4(torso.matrix);
        v.node.position.copy(lower).lerp(upper,fraction);
        v.node.quaternion.copy(pelvis.quaternion).slerp(torso.quaternion,fraction);
      }
    }
    function setJointPose(amount){
      const a=Math.max(-1,Math.min(1,amount)),chain=state.mode==='chain',selectedSide=state.side==='right'?-1:1,m=state.movement;
      torso.scale.y=1;for(const level of spineGroups)level.node.scale.y=1;for(const arm of exArms)arm.lengthFactor=1;
      restoreStudyMaterials();for(const item of tensionSpineMeshes)item.mesh.material=item.original;previewEquipment.visible=false;previewDebug=null;tensionEquipment.visible=false;tensionBellGroup.visible=false;tensionDebug=null;
      exerciseArms.visible=false;equipment.visible=false;exerciseDebug=null;
      pelvis.rotation.set(0,0,0);pelvis.position.set(0,3.3,0);torso.rotation.set(0,0,0);torso.position.set(0,4.72,0);head.rotation.set(0,0,0);head.position.set(0,6.25,-.08);
      for(const l of legs){l.root.position.set(l.baseX,3.13,.01);l.root.rotation.set(0,0,0);l.femur.rotation.set(0,0,0);l.shin.position.set(l.side*.10,-1.63,0);l.shin.rotation.set(0,0,0);l.shin.scale.set(1,1,1);l.femur.scale.set(1,1,1);l.foot.position.set(0,-1.31,.04);l.foot.rotation.set(0,0,0);l.foot.scale.set(1,1,1);l.mid.rotation.set(0,0,0);l.mid.position.y=0;l.mid.scale.y=1;l.poseFootArch(0);l.poseToes?.(0);}
      for(let i=0;i<ribs.length;i++){const r=ribs[i];r.position.set(0,.93-Math.floor(i/2)*.132,-.30);r.rotation.set(0,0,0);r.scale.set(1,1,1);for(const c of r.children){if(c.isMesh&&c.userData.azRestPositions){c.geometry.attributes.position.array.set(c.userData.azRestPositions);c.geometry.attributes.position.needsUpdate=true;if(c.userData.azRestNormals){c.geometry.attributes.normal.array.set(c.userData.azRestNormals);c.geometry.attributes.normal.needsUpdate=true;}else c.geometry.computeVertexNormals();}}}
      for(const s of scapulae){s.node.position.set(s.side*.64,.53,-.36);s.node.rotation.set(0,-s.side*.20,0);}
      spineGuide.rotation.x=0;spineGuide.position.z=0;
      for(const s of spineGroups){s.node.position.set(0,s.y,s.z);s.node.rotation.set(0,0,0);}
      pressureMarks.forEach(p=>p.node.visible=false);floor.visible=deadliftFloor.visible=floorRing.visible=false;floor.position.set(0,.08,0);
      sternum.position.copy(sternumRest);sternum.quaternion.copy(sternumRestRotation);
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
          blendLumbar();
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
      if(m==='foot'&&chain||m==='tilt'||m==='chain'&&!chain)blendLumbar();
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
      ghost.visible=state.ghost;model.updateMatrixWorld(true);
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
    if(!isDevelopment()){applyPose(0);rebuildGhost();}
    function focus(){
      const m=state.movement,chain=state.mode==='chain';
      // Reserve the full horizontal motion envelope when the viewport narrows.
      function frame(x,y,z,verticalDistance,horizontalSpan){
        target.set(x,y,z);
        const widthDistance=horizontalSpan/(2*halfFovTan*perspective.aspect);
        distance=Math.max(verticalDistance,widthDistance);
      }
      if(m==='baby'){
        frame(0,.8,0,5.17,3.2);
      }else if(m==='chimp'){
        if(chain)frame(0,.11,0,3.62,4.28);
        else frame(0,1.69,.08,8.05,5.65);
      }else if(m==='tension_deadlift')frame(0,3.12,.13,11.7,4.15);
      else if(isDeadlift(m))frame(0,3.20,.15,13.1,4.15);
      else if(tensionFrames[m]){
        const {y,z}=tensionFrames[m];
        target.set(0,y,z);
        distance=1/halfFovTan;
      }else if(previewIds.has(m))frame(0,3.15,.10,13.8,4.0);
      else if(m==='squat'||m==='squat_types')frame(0,3.47,-.04,13.65,4.7);
      else if(m==='lunge')frame(0,3.05,.05,12.7,4.3);
      else if(m==='pushup'||m==='bench')frame(0,m==='pushup'?1.4:1.8,m==='pushup'?.2:-.25,m==='bench'?9.0:8.4,m==='pushup'?8.05:7.35);
      else if(exerciseIds.has(m)){
        const y=m==='pullup'?4.68:m==='dips'?3.7:m==='press'?3.3:3.1;
        const depth=m==='pullup'?16.55:m==='dips'?13.4:m==='press'?14.2:m==='row'?13.7:12.4;
        frame(0,y,m==='row'?1.50:.1,depth,m==='row'?5.8:m==='press'?5.4:4.7);
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
      perspective.aspect=width/height;
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
      setOrbit(newYaw,newPitch){yaw=newYaw;pitch=newPitch;render();},
      get ribWidth(){return ribPoint().x-otherRib.localToWorld(new T.Vector3().fromBufferAttribute(otherPoints,oppositeVertex)).x;},
      get deadliftAboveKnees(){return tensionDebug?.bar?.[1]>tensionDebug?.legs[0].knee[1];},
      get squatBelowKnees(){return state.movement==='squat'&&exerciseDebug.legs.every(leg=>leg.kneeAboveHip>0);},
      get pogoInContact(){return tensionDebug?.contact;},
      get rowPastTrunk(){return state.movement==='row'&&exerciseDebug.arms.every(arm=>arm.humeralSagittal<0);},
      debugCamera:()=>({yaw,pitch,distance,target:target.toArray()}),
      update(next){
        if((next.movement&&next.movement!==state.movement)||(next.mode&&next.mode!==state.mode))closeHelmet();
        const previous=state.movement,side=state.side,mode=state.mode;state=Object.assign({},state,next);if(previous!==state.movement||mode!==state.mode||(side!==state.side&&state.movement==='foot')){focus();if(!isDevelopment()){applyPose(0);rebuildGhost();}}applyPose();render();},
      setView(name){closeHelmet();if(name==='top'||name==='bottom'){yaw=0;pitch=name==='top'?Math.PI/2:-Math.PI/2;}else if(name==='front'){yaw=0;pitch=.04;}else if(name==='back'){yaw=Math.PI;pitch=.04;}else if(name==='side'){yaw=Math.PI/2;pitch=isDeadlift(state.movement)?0:.04;}else{yaw=isDevelopment()?(state.movement==='baby'?1.22:-1.12):tensionIds.has(state.movement)?1.00:previewIds.has(state.movement)&&state.movement[0]==='c'?1.05:['squat','squat_types'].includes(state.movement)?.75:state.movement==='bench'?1.10:state.movement==='lunge'?.90:state.movement==='foot'?(state.side==='right'?.95:-.95):state.movement==='hip'?(state.side==='right'?-.45:.45):.45;pitch=state.movement==='baby'?.29:state.movement==='chimp'?.14:state.movement==='bench'?.42:state.movement==='lunge'?.12:.10;}render();},
      resetCamera(){closeHelmet();yaw=0;pitch=.04;focus();render();},resize,
      dispose(){
        if(disposed)return;disposed=true;cancelAnimationFrame(helmetFrame);fitShoulderGirdle?.dispose();drag=null;ro.disconnect();
        clearCanvasEvents();
        const geometries=new Set(),materials=new Set([...Object.values(regionMaterials),studyPadMat,studyRibMat,studyScapMat,studyBenchScapMat,...tensionSpineMaterials.values(),steel,seatMat,dumbbellHeads,landmarkM,cavityM,floorMat,ghostMaterial]);
        for(const activeScene of [scene,developmentModel?.scene].filter(Boolean))activeScene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const material of Array.isArray(o.material)?o.material:[o.material])materials.add(material);if(o.userData.azOriginalMaterial)materials.add(o.userData.azOriginalMaterial);});
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
