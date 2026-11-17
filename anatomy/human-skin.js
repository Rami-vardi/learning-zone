/* Optional MakeHuman surface, driven exclusively by Johnny's existing pose.
 * Three.js and loaders: MIT. Human assets: see human/ATTRIBUTION.md.
 */
(function(){
'use strict';
const T=window.THREE,bytes=new Map();
const V=a=>new T.Vector3().fromArray(a),M=a=>new T.Matrix4().fromArray(a);
const pos=a=>new T.Vector3().setFromMatrixPosition(a);
const clamp=T.MathUtils.clamp;
function resources(group){
 const geometries=new Set(),materials=new Set(),textures=new Set(),skeletons=new Set();
 group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.skeleton)skeletons.add(o.skeleton);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const x of Object.values(m))if(x?.isTexture)textures.add(x);}});
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures){t.source?.data?.close?.();t.dispose();}for(const s of skeletons)s.dispose();
 group.removeFromParent();group.clear();
}
function load(url){
 if(!bytes.has(url))bytes.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('Human asset '+r.status);return r.arrayBuffer();}).catch(e=>{bytes.delete(url);throw e;}));
 return bytes.get(url).then(buffer=>new Promise((resolve,reject)=>new window.AZGLTFLoader().parse(buffer.slice(0),url.slice(0,url.lastIndexOf('/')+1),resolve,reject)));
}
function adapter(gltf,rest,type){
 const group=gltf.scene;group.name='Johnny '+type+' skin';group.updateMatrixWorld(true);
 const meshes=[],bones=new Map(),source=new Map(),restTarget=new Map(),originalLocal=new Map();
 group.traverse(o=>{if(o.isSkinnedMesh){meshes.push(o);o.frustumCulled=false;}if(o.isBone){bones.set(o.name,o);source.set(o.name,o.matrixWorld.clone());originalLocal.set(o.name,o.matrix.clone());}});
 if(!meshes.length)throw Error('The human model has no weighted surface.');
 for(const name of ['pelvis','spine_01','spine_02','spine_03','neck_01','head','upperarm_l','lowerarm_l','hand_l','thigh_l','calf_l','foot_l','ball_l','upperarm_r','lowerarm_r','hand_r','thigh_r','calf_r','foot_r','ball_r'])if(!bones.has(name))throw Error('Missing human joint '+name);
 const sourcePos=name=>pos(source.get(name)),node=(p,n)=>M(p.nodes[n].matrix),np=(p,n,v)=>new T.Vector3(...v).applyMatrix4(node(p,n));
 const sourceBounds=new T.Box3().setFromObject(group);
 const sourceScale=(np(rest,'head',[0,.50,0]).y-.08)/sourceBounds.getSize(new T.Vector3()).y;
 const defs={pelvis:{a:p=>pos(node(p,'pelvis')),b:p=>pos(node(p,'spine_0')),next:'spine_01',frame:'pelvis'},
  spine_01:{a:p=>pos(node(p,'spine_0')),b:p=>pos(node(p,'spine_5')),next:'spine_02',frame:'spine_0'},
  spine_02:{a:p=>pos(node(p,'spine_5')),b:p=>pos(node(p,'spine_9')),next:'spine_03',frame:'spine_5'},
  spine_03:{a:p=>pos(node(p,'spine_9')),b:p=>np(p,'head',[0,-.40,0]),next:'neck_01',frame:'torso'},
  neck_01:{a:p=>np(p,'head',[0,-.40,0]),b:p=>np(p,'head',[0,-.15,0]),next:'head',frame:'head'},
  head:{a:p=>np(p,'head',[0,-.15,0]),b:p=>np(p,'head',[0,.40,0]),frame:'head'}};
 for(const key of ['l','r']){
  const a=(p,n)=>V(p.limb[key][n]);
  defs['clavicle_'+key]={a:p=>np(p,'torso',[0,1,.18]),b:p=>a(p,'shoulder'),next:'upperarm_'+key,frame:'torso'};
  defs['upperarm_'+key]={a:p=>a(p,'shoulder'),b:p=>a(p,'elbow'),next:'lowerarm_'+key};
  defs['lowerarm_'+key]={a:p=>a(p,'elbow'),b:p=>a(p,'wrist'),next:'hand_'+key};
  defs['hand_'+key]={a:p=>a(p,'wrist'),b:p=>a(p,'handEnd')};
  defs['thigh_'+key]={a:p=>a(p,'hip'),b:p=>a(p,'knee'),next:'calf_'+key,frame:'femur_'+key};
  defs['calf_'+key]={a:p=>a(p,'knee'),b:p=>a(p,'ankle'),next:'foot_'+key,frame:'shin_'+key};
  defs['foot_'+key]={a:p=>a(p,'ankle'),b:p=>a(p,'footEnd'),next:'ball_'+key,frame:'foot_'+key};
  defs['ball_'+key]={a:p=>a(p,'footEnd'),b:p=>np(p,'foot_'+key,[0,-.045,.60]),frame:'foot_'+key};
 }
 const palmFits={};
 for(const key of ['l','r']){const wrist=sourcePos('hand_'+key),center=new T.Vector3();for(const finger of ['index','middle','pinky'])center.add(sourcePos(finger+'_01_'+key));center.divideScalar(3);
  const direction=center.clone().sub(wrist),Y=direction.clone().normalize(),X=sourcePos('index_01_'+key).sub(sourcePos('pinky_01_'+key));X.addScaledVector(Y,-X.dot(Y)).normalize();
  palmFits[key]={wrist,length:direction.length(),basis:new T.Matrix4().makeBasis(X,Y,new T.Vector3().crossVectors(X,Y).normalize())};
 }
 function palmTarget(p,key){const l=p.limb[key],W=V(l.wrist);return l.grip?V(l.grip):W.clone().lerp(V(l.handEnd),.60);}
 function handFit(p,key){const fit=palmFits[key],W=V(p.limb[key].wrist),G=palmTarget(p,key),Y=G.clone().sub(W).normalize(),frame=M(p.limb[key].handFrame),X=new T.Vector3(1,0,0).transformDirection(frame).multiplyScalar(key==='l'?-1:1);X.addScaledVector(Y,-X.dot(Y)).normalize();
  const basis=new T.Matrix4().makeBasis(X,Y,new T.Vector3().crossVectors(X,Y).normalize()),scale=new T.Matrix4().makeScale(sourceScale,W.distanceTo(G)/fit.length,sourceScale);
  return new T.Matrix4().makeTranslation(W.x,W.y,W.z).multiply(basis).multiply(scale).multiply(fit.basis.clone().transpose()).multiply(new T.Matrix4().makeTranslation(-fit.wrist.x,-fit.wrist.y,-fit.wrist.z)).multiply(source.get('hand_'+key));
 }
 // Capture a fitted rest skeleton once. Animation always uses Johnny's targets.
 for(const [name,d] of Object.entries(defs)){
  const original=source.get(name),a=sourcePos(name),b=d.next?sourcePos(d.next):a.clone().add(new T.Vector3(0,1,0).transformDirection(original).multiplyScalar(name==='head'?.13:name.startsWith('hand')?.09:.035));
  const A=d.a(rest),B=d.b(rest),q=new T.Quaternion(),sc=new T.Vector3();original.decompose(new T.Vector3(),q,sc);
  const rotation=new T.Quaternion().setFromUnitVectors(b.clone().sub(a).normalize(),B.clone().sub(A).normalize()).multiply(q);
  const scale=new T.Vector3(sourceScale,A.distanceTo(B)/Math.max(.001,a.distanceTo(b)),sourceScale);
  restTarget.set(name,new T.Matrix4().compose(A,rotation,scale));
  d.restDirection=B.clone().sub(A).normalize();d.restFrame=d.frame?node(rest,d.frame):null;
 }
 function targets(pose){
  const out=new Map();
  for(const [name,d] of Object.entries(defs)){
   if(name.startsWith('hand_')&&graspScenes.has(pose.movement)){out.set(name,handFit(pose,name.slice(-1)));continue;}
   const A=d.a(pose),B=d.b(pose),r=restTarget.get(name),q=new T.Quaternion(),scale=new T.Vector3();r.decompose(new T.Vector3(),q,scale);
   if(d.frame){const rq=new T.Quaternion(),cq=new T.Quaternion();d.restFrame.decompose(new T.Vector3(),rq,new T.Vector3());node(pose,d.frame).decompose(new T.Vector3(),cq,new T.Vector3());q.premultiply(cq.multiply(rq.invert()));}
   else q.premultiply(new T.Quaternion().setFromUnitVectors(d.restDirection,B.clone().sub(A).normalize()));
   // Preserve the frame's twist while aligning the surface bone to the exact
   // solved endpoints, including body scenes with independently positioned knees.
   const axis=new T.Vector3(0,1,0).applyQuaternion(q),direction=B.clone().sub(A).normalize();
   q.premultiply(new T.Quaternion().setFromUnitVectors(axis.normalize(),direction));
   // Length changes come from the existing solved segment, including its scale.
   scale.y*=A.distanceTo(B)/Math.max(.0001,d.a(rest).distanceTo(d.b(rest)));
   out.set(name,new T.Matrix4().compose(A,q,scale));
  }
  return out;
 }
 const graspScenes=new Set(['rdl','squat','press','row','pullup','dips','bench','cgoblet','cheels','csafety','tension_deadlift','tension_swing']);
 const fingerCurl=[];
 for(const key of ['l','r']){const index=source.get('index_01_'+key),pinky=source.get('pinky_01_'+key);if(!index||!pinky)continue;const across=pos(pinky).sub(pos(index)).normalize().multiplyScalar(key==='l'?1:-1);
  for(const [name,bone] of bones){const match=name.match(/^(thumb|index|middle|ring|pinky)_0([123])_([lr])$/);if(!match||match[3]!==key)continue;const q=new T.Quaternion();source.get(name).decompose(new T.Vector3(),q,new T.Vector3());fingerCurl.push({bone,axis:across.clone().applyQuaternion(q.invert()),angle:match[1]==='thumb'?[.30,.58,.38][Number(match[2])-1]:[.48,.91,.72][Number(match[2])-1]});}
 }
 function poseFingers(pose){if(!graspScenes.has(pose.movement))return;for(const f of fingerCurl){const p=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3();f.bone.matrix.decompose(p,q,scale);q.multiply(new T.Quaternion().setFromAxisAngle(f.axis,f.angle));f.bone.matrix.compose(p,q,scale);f.bone.matrixWorldNeedsUpdate=true;f.bone.updateMatrixWorld(true);}}
 function place(mapping){
  function walk(o){if(o.isBone){const desired=mapping.get(o.name);if(desired){o.matrix.copy(o.parent?o.parent.matrixWorld.clone().invert().multiply(desired):desired);o.matrixAutoUpdate=false;}else if(originalLocal.has(o.name)){o.matrix.copy(originalLocal.get(o.name));o.matrixAutoUpdate=false;}}o.matrixWorldNeedsUpdate=true;o.updateMatrixWorld(false);for(const c of o.children)walk(c);}
  // updateMatrixWorld on a parent recurses, then descendants are fitted in order.
  group.updateMatrixWorld(true);walk(group);
 }
 place(targets(rest));
 // Bake the source rest shape into Johnny's proportions, then rebind it. This
 // allows his small anatomical groups to deform the same textured surface.
 for(const mesh of meshes){
  const old=mesh.skeleton,geometry=mesh.geometry.clone(),attr=geometry.attributes.position,si=geometry.attributes.skinIndex,sw=geometry.attributes.skinWeight;
  const p=new T.Vector3(),v=new T.Vector3(),sum=new T.Vector3();
  for(let i=0;i<attr.count;i++){
   p.fromBufferAttribute(attr,i).applyMatrix4(mesh.bindMatrix);sum.set(0,0,0);
   for(let j=0;j<4;j++){const weight=sw.getComponent(i,j);if(!weight)continue;const index=si.getComponent(i,j),bone=old.bones[index];v.copy(p).applyMatrix4(old.boneInverses[index]).applyMatrix4(bone.matrixWorld);sum.addScaledVector(v,weight);}
   attr.setXYZ(i,sum.x,sum.y,sum.z);
  }
  mesh.geometry=geometry;mesh.removeFromParent();group.add(mesh);mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.set(1,1,1);mesh.updateMatrixWorld(true);mesh.bindMatrix.identity();mesh.bindMatrixInverse.identity();
  const skeleton=new T.Skeleton(old.bones,old.bones.map(b=>b.matrixWorld.clone().invert()));mesh.bind(skeleton,new T.Matrix4());
  geometry.computeVertexNormals();mesh.userData.azIndexCache=new Map();mesh.userData.azFullIndex=geometry.index?Array.from(geometry.index.array):Array.from({length:attr.count},(_,i)=>i);
 }
 // Fit the bare-foot envelope to the actual Johnny contact geometry before
 // assigning the detailed anatomical weights. No pose or contact solver changes.
 const footBoxes={l:new T.Box3(),r:new T.Box3()},footVertices=[];
 for(const mesh of meshes){const a=mesh.geometry.attributes.position,si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight;
  for(let i=0;i<a.count;i++){let footWeight={l:0,r:0};for(let j=0;j<4;j++){const name=mesh.skeleton.bones[si.getComponent(i,j)].name;if(/^(foot|ball)_[lr]$/.test(name))footWeight[name.slice(-1)]+=sw.getComponent(i,j);}
   const key=footWeight.l>footWeight.r?'l':'r';if(footWeight[key]>.5){const p=new T.Vector3().fromBufferAttribute(a,i);footBoxes[key].expandByPoint(p);footVertices.push({mesh,i,key,p});}}
 }
 for(const v of footVertices){const src=footBoxes[v.key],target=rest.nodes['foot_'+v.key].bounds,lo=V(target.min),hi=V(target.max);hi.y+=.012;lo.x-=.018;hi.x+=.018;lo.z-=.012;hi.z+=.012;
  const size=src.getSize(new T.Vector3()),q=v.p.clone().sub(src.min).divide(size).multiply(hi.sub(lo)).add(lo);v.mesh.geometry.attributes.position.setXYZ(v.i,q.x,q.y,q.z);
 }
 for(const mesh of meshes)mesh.geometry.computeVertexNormals();
 const contacts={foot_l:[],foot_r:[],hand_l:[],hand_r:[]};
 const extras=[],counts={foot:0,rib:0,scapula:0,spine:0},samples={foot:[],rib:[],scapula:[],spine:[]};
 const extraKeys=Object.keys(rest.nodes).filter(k=>/^foot_[lr]_\d+$/.test(k)||/^rib_\d+$/.test(k)||/^scap_[lr]$/.test(k)||/^spine_\d+$/.test(k));
 const extraNodes=new Map();
 for(const key of extraKeys){const bone=new T.Bone();bone.name='johnny_'+key;bone.matrixAutoUpdate=false;bone.matrix.copy(node(rest,key));group.add(bone);bone.updateMatrixWorld(true);extraNodes.set(key,bone);extras.push({key,bone,inverse:node(rest,key).invert()});}
 const region=(name,p)=>name.startsWith('thigh')?'thigh_'+(name.endsWith('_l')?'l':'r'):name.startsWith('calf')?'calf_'+(name.endsWith('_l')?'l':'r'):/^(foot|ball)_/.test(name)?'foot_'+(name.endsWith('_l')?'l':'r'):/^(upperarm|lowerarm|hand|thumb|index|middle|ring|pinky|clavicle)_/.test(name)?'arm_'+(name.includes('_l')?'l':'r'):/^(head|neck)/.test(name)?'head':name==='pelvis'?'pelvis':'torso';
 function nearest(keys,p,n=2){return keys.map(key=>({key,d:p.distanceTo(rest.nodes[key].anchor?V(rest.nodes[key].anchor):pos(node(rest,key)))})).sort((a,b)=>a.d-b.d).slice(0,n);}
 const skeletonCache=new Map();
 // Supplemental bones use the source's exact independent transforms. Surface
 // weights blend at the boundaries so hips, ankles and shoulders stay joined.
 for(const mesh of meshes){
  const geometry=mesh.geometry,a=geometry.attributes.position,si=geometry.attributes.skinIndex,sw=geometry.attributes.skinWeight;
  const sb=mesh.skeleton.bones.slice(),inv=mesh.skeleton.boneInverses.slice(),extraIndex=new Map();
  for(const x of extras){extraIndex.set(x.key,sb.length);sb.push(x.bone);inv.push(x.inverse.clone());}
  const weights=[],indices=[],regions=[];
  for(let i=0;i<a.count;i++){
   const p=new T.Vector3().fromBufferAttribute(a,i),base=[];let dominant='torso',dominantBone='',max=-1;
   for(let j=0;j<4;j++){const w=sw.getComponent(i,j),index=si.getComponent(i,j);if(w){base.push({index,w});if(w>max){dominantBone=mesh.skeleton.bones[index].name;dominant=region(dominantBone,p);max=w;}}}
   regions.push(dominant);let add=[],blend=0,kind=null;
   if(/^foot_[lr]$/.test(dominant)){const key=dominant.slice(-1),bounds=rest.nodes['foot_'+key].bounds,mask=clamp((bounds.max[1]+.02-p.y)/Math.max(.01,(bounds.max[1]-bounds.min[1])*.65),.08,1);contacts[dominant].push({mesh,index:i,base:p.clone(),mask});}
   if(/^(hand|thumb|index|middle|ring|pinky)_/.test(dominantBone)){const key=dominantBone.endsWith('_l')?'l':'r',wrist=V(rest.limb[key].wrist),dir=V(rest.limb[key].handEnd).sub(wrist).normalize(),mask=clamp(p.clone().sub(wrist).dot(dir)/.16,.15,1);contacts['hand_'+key].push({mesh,index:i,base:p.clone(),mask});}

   if(/^foot_[lr]$/.test(dominant)){
    const key=dominant.slice(-1),keys=extraKeys.filter(n=>n.startsWith('foot_'+key+'_'));
    // Every tarsal, metatarsal and phalanx receives nearby surface vertices.
    const local=p.clone().applyMatrix4(node(rest,'foot_'+key).invert());
    const candidates=nearest(keys,p,3);add=candidates.map(v=>({index:extraIndex.get(v.key),w:1/Math.pow(.025+v.d,3)}));blend=clamp((.22-local.y)/.18,.12,1);kind='foot';
   }else if(dominant==='torso'){
    const local=p.clone().applyMatrix4(node(rest,'torso').invert());
    const scapKey='scap_'+(p.x>=0?'l':'r'),scapDist=Math.hypot(Math.abs(local.x)-.64,(local.y-.53)*.85,(local.z+.36)*1.4);
    if(local.z<-.13&&scapDist<.61){add=[{index:extraIndex.get(scapKey),w:1}];blend=.72*Math.pow(1-scapDist/.61,.6);kind='scapula';}
    else if(local.y>-.58&&local.y<1.14&&Math.abs(local.x)>.12){const side=p.x>=0?1:0,keys=extraKeys.filter(k=>/^rib_\d+$/.test(k)&&Number(k.slice(4))%2===side);add=nearest(keys,p,2).map(v=>({index:extraIndex.get(v.key),w:1/(.06+v.d)**3}));blend=.85;kind='rib';}
    else {add=nearest(extraKeys.filter(k=>k.startsWith('spine_')),p,2).map(v=>({index:extraIndex.get(v.key),w:1/(.08+v.d)**3}));blend=.72;kind='spine';}
   }
   const total=add.reduce((s,x)=>s+x.w,0);const merged=base.map(x=>({index:x.index,w:x.w*(1-blend)})).concat(add.map(x=>({index:x.index,w:blend*x.w/total}))).sort((x,y)=>y.w-x.w).slice(0,4),sum=merged.reduce((s,x)=>s+x.w,0);
   for(let j=0;j<4;j++){indices.push(merged[j]?.index||0);weights.push((merged[j]?.w||0)/sum);}
   if(kind&&blend>.05){counts[kind]++;if(samples[kind].length<8)samples[kind].push({mesh:mesh.name,index:i});}
  }
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));const skeletonKey=sb.map(b=>b.uuid).join('|');let fittedSkeleton=skeletonCache.get(skeletonKey);if(!fittedSkeleton){fittedSkeleton=new T.Skeleton(sb,inv);skeletonCache.set(skeletonKey,fittedSkeleton);}mesh.bind(fittedSkeleton,new T.Matrix4());mesh.userData.azRegions=regions;
 }
 // Contact fitting changes only feet/palms. Precompute the small triangle
 // neighborhoods whose normals can change, instead of rebuilding body normals.
 const normalPatches=new Map();
 for(const mesh of meshes){const touched=new Set();for(const list of Object.values(contacts))for(const r of list)if(r.mesh===mesh)touched.add(r.index);if(!touched.size)continue;
  const full=mesh.userData.azFullIndex,targets=new Set(touched);
  for(let i=0;i<full.length;i+=3)if(touched.has(full[i])||touched.has(full[i+1])||touched.has(full[i+2])){targets.add(full[i]);targets.add(full[i+1]);targets.add(full[i+2]);}
  const triangles=[];for(let i=0;i<full.length;i+=3)if(targets.has(full[i])||targets.has(full[i+1])||targets.has(full[i+2]))triangles.push(full[i],full[i+1],full[i+2]);
  const mask=new Uint8Array(mesh.geometry.attributes.position.count);for(const i of targets)mask[i]=1;
  normalPatches.set(mesh,{targets:Array.from(targets),triangles,mask,sum:new Float32Array(mask.length*3)});
 }
 function contactNormals(mesh){const patch=normalPatches.get(mesh);if(!patch)return;const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,{targets,triangles,mask,sum}=patch,a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3();
  for(const i of targets){sum[i*3]=sum[i*3+1]=sum[i*3+2]=0;}
  for(let k=0;k<triangles.length;k+=3){const i=triangles[k],j=triangles[k+1],l=triangles[k+2];a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,j);c.fromBufferAttribute(p,l);ab.subVectors(b,a);ac.subVectors(c,a);ab.cross(ac);for(const v of [i,j,l])if(mask[v]){sum[v*3]+=ab.x;sum[v*3+1]+=ab.y;sum[v*3+2]+=ab.z;}}
  for(const i of targets){const x=sum[i*3],y=sum[i*3+1],z=sum[i*3+2],length=Math.hypot(x,y,z)||1;n.setXYZ(i,x/length,y/length,z/length);}n.needsUpdate=true;
 }
 let latest=rest,disposed=false,lastVisibility='',lastPose='',contactCorrections={};
 function update(pose){
  if(disposed)return;const signaturePose=JSON.stringify(pose);if(signaturePose===lastPose)return;lastPose=signaturePose;latest=pose;place(targets(pose));poseFingers(pose);
  for(const x of extras){x.bone.matrix.copy(node(pose,x.key));x.bone.matrixWorld.copy(x.bone.matrix);}
  const visibility={head:pose.nodes.head.visible,pelvis:pose.nodes.pelvis.visible,torso:pose.nodes.torso.visible};for(const key of ['l','r'])for(const part of ['thigh','calf','foot','arm'])visibility[part+'_'+key]=pose.limb[key].visible[part];
  const signature=JSON.stringify(visibility);
  if(signature!==lastVisibility){lastVisibility=signature;for(const mesh of meshes){const index=mesh.userData.azFullIndex,r=mesh.userData.azRegions,filtered=[];for(let i=0;i<index.length;i+=3){if(visibility[r[index[i]]]&&visibility[r[index[i+1]]]&&visibility[r[index[i+2]]])filtered.push(index[i],index[i+1],index[i+2]);}const cache=mesh.userData.azIndexCache;if(cache.has(signature))mesh.geometry.setIndex(cache.get(signature));else{mesh.geometry.setIndex(filtered);cache.set(signature,mesh.geometry.index);}}}
  for(const skeleton of new Set(meshes.map(m=>m.skeleton)))skeleton.update();
  // Soft tissue has thickness whereas Johnny's contact solver uses bones. Fit
  // only the contact surface to his existing contact envelope, keeping every
  // rig matrix fixed. This also works in flight, so no new motion is invented.
  const dirty=new Set(),contactMatrices=new Map();contactCorrections={};
  for(const [name,list] of Object.entries(contacts)){
   const key=name.slice(-1),hand=name.startsWith('hand'),enabled=!hand||['pushup','tension_pushup','tension_cat'].includes(pose.movement),target=hand?pose.limb[key].handMinimum:pose.limb[key].footMinimum;
   for(const r of list){r.mesh.geometry.attributes.position.setXYZ(r.index,r.base.x,r.base.y,r.base.z);dirty.add(r.mesh);}
   if(!enabled||target==null||!list.length)continue;
   let offset=-Infinity;const current=new T.Vector3();
   for(const r of list){current.copy(r.base);r.mesh.applyBoneTransform(r.index,current);offset=Math.max(offset,(target-current.y)/r.mask);}
   if(!Number.isFinite(offset))continue;contactCorrections[name]=offset;
   if(Math.abs(offset)<1e-7)continue;
   const matrices=contactMatrices,blend=new T.Matrix4(),delta=new T.Vector3(),inverse=new T.Matrix3();
   for(const r of list){const mesh=r.mesh,sk=mesh.skeleton;let transforms=matrices.get(mesh);if(!transforms){transforms=sk.bones.map((b,i)=>b.matrixWorld.clone().multiply(sk.boneInverses[i]));matrices.set(mesh,transforms);}
    blend.elements.fill(0);const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight;
    for(let j=0;j<4;j++){const weight=sw.getComponent(r.index,j),m=transforms[si.getComponent(r.index,j)].elements;for(let k=0;k<16;k++)blend.elements[k]+=weight*m[k];}
    inverse.setFromMatrix4(blend).invert();delta.set(0,offset*r.mask,0).applyMatrix3(inverse).add(r.base);mesh.geometry.attributes.position.setXYZ(r.index,delta.x,delta.y,delta.z);
   }
  }
  for(const mesh of dirty){mesh.geometry.attributes.position.needsUpdate=true;contactNormals(mesh);}
 }
 function vertex(mesh,index){const v=new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,index);mesh.applyBoneTransform(index,v);return v.applyMatrix4(mesh.matrixWorld).toArray();}
 function debug(){
  const bindings=[];for(const [name,d] of Object.entries(defs)){const b=bones.get(name),expected=d.a(latest),actual=b.getWorldPosition(new T.Vector3());bindings.push({name,expected:expected.toArray(),actual:actual.toArray(),error:actual.distanceTo(expected)});}
  const palms=(graspScenes.has(latest.movement)?['l','r']:[]).map(key=>{const actual=new T.Vector3();for(const finger of ['index','middle','pinky'])actual.add(bones.get(finger+'_01_'+key).getWorldPosition(new T.Vector3()));actual.divideScalar(3);const expected=palmTarget(latest,key);return {side:key,actual:actual.toArray(),expected:expected.toArray(),error:actual.distanceTo(expected)};});
  const surface={};for(const [kind,list] of Object.entries(samples))surface[kind]=list.map(s=>{const mesh=meshes.find(m=>m.name===s.mesh);return {...s,position:vertex(mesh,s.index)};});
  return {type,bindings,palms,supplemental:counts,surface,boneCount:meshes[0].skeleton.bones.length,meshCount:meshes.length,contactCorrections,grip:graspScenes.has(latest.movement)?'equipment':'open'};
 }
 update(rest);
 return {group,update,debug,dispose(){if(disposed)return;disposed=true;resources(group);}};
}
window.AZHumanSkin={async create({type,rest,pose,asset}){const gltf=await load(asset('human/'+type+'.glb'));let result;try{result=adapter(gltf,rest,type);result.update(pose);return result;}catch(e){resources(gltf.scene);throw e;}},createFromGLTF:adapter};
})();
