window.azAttachAnatomyMeshes=function(parts){
  const T=parts.THREE,assets=window.azRealMeshData.assets;
  function geometry(asset,transform,mirror=false){
    const binary=atob(asset.data),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    const buf=new DataView(bytes.buffer),positions=new Float32Array(asset.n*3),indices=new Uint16Array(asset.f*3);
    for(let i=0;i<asset.n;i++){
      const xyz=[];for(let j=0;j<3;j++)xyz.push(asset.min[j]+buf.getUint16((i*3+j)*2,true)/65535*(asset.max[j]-asset.min[j]));
      const p=transform(xyz);positions.set(p,i*3);
    }
    for(let i=0;i<indices.length;i++)indices[i]=buf.getUint16(asset.n*6+i*2,true);
    // Reflections reverse triangle winding. Keep the mirrored left leg's
    // normals oriented outward like the right leg from the source model.
    if (mirror) for (let i = 0; i < indices.length; i += 3) {
      [indices[i+1], indices[i+2]] = [indices[i+2], indices[i+1]];
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setIndex(new T.BufferAttribute(indices,1));geo.computeVertexNormals();
    const light = atob(asset.cavityLight);
    const colors = new Uint8Array(asset.n * 3);
    for (let i = 0; i < asset.n; i++) colors.fill(light.charCodeAt(i), i * 3, i * 3 + 3);
    geo.setAttribute('color', new T.BufferAttribute(colors, 3, true));
    return geo;
  }
  function remove(parent,keep=[]){parent.children.slice().forEach(child=>{if(keep.includes(child))return;parent.remove(child);child.traverse(o=>{if(o.geometry)o.geometry.dispose();});});}
  function reliefMaterial(source) {
    const shaded = source.clone();
    // The teaching modes update this same color when a region is highlighted.
    shaded.color = source.color;
    shaded.vertexColors = true;
    return shaded;
  }
  remove(parts.head,parts.cervicalMeshes);
  const skull=assets.skull,centre=skull.min.map((v,i)=>(v+skull.max[i])/2);
  const skullMesh=new T.Mesh(geometry(skull,p=>[(p[0]-centre[0])*.00405,(p[2]-centre[2])*.00405+.12,-(p[1]-centre[1])*.00405]),reliefMaterial(parts.materials.bone));
  skullMesh.name='BodyParts3D skull, simplified';parts.head.add(skullMesh);
  // Sunglasses remain part of the skull's local coordinate frame.
  const shades=new T.Group();shades.name='Johnny sunglasses';parts.head.add(shades);
  const frameMaterial=new T.MeshStandardMaterial({color:0x111c2b,roughness:.42,metalness:.12});
  const lensMaterial=new T.MeshStandardMaterial({color:0x182d43,roughness:.28,metalness:.18});
  function roundedRectangle(width,height,r){
    const x=-width/2,y=-height/2,shape=new T.Shape();
    shape.moveTo(x+r,y);shape.lineTo(x+width-r,y);shape.quadraticCurveTo(x+width,y,x+width,y+r);
    shape.lineTo(x+width,y+height-r);shape.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
    shape.lineTo(x+r,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-r);
    shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);return shape;
  }
  function glassMesh(shape,depth,material){return new T.Mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:8}),material);}
  for(const side of [-1,1]){
    const rim=glassMesh(roundedRectangle(.238,.151,.036),.018,frameMaterial);rim.position.set(side*.137,.113,.327);rim.rotation.y=side*.12;shades.add(rim);
    const lens=glassMesh(roundedRectangle(.207,.121,.027),.008,lensMaterial);lens.position.set(side*.137,.113,.350);lens.rotation.y=side*.12;shades.add(lens);
    const templePath=new T.CatmullRomCurve3([new T.Vector3(side*.254,.142,.328),new T.Vector3(side*.280,.142,.20),new T.Vector3(side*.287,.126,-.03),new T.Vector3(side*.273,.089,-.10)]);
    const temple=new T.Mesh(new T.TubeGeometry(templePath,20,.010,6,false),frameMaterial);shades.add(temple);
  }
  const bridgePath=new T.CatmullRomCurve3([new T.Vector3(-.030,.138,.350),new T.Vector3(0,.150,.374),new T.Vector3(.030,.138,.350)]);
  shades.add(new T.Mesh(new T.TubeGeometry(bridgePath,12,.009,6,false),frameMaterial));
  remove(parts.pelvis);
  const pelvisMaterial = reliefMaterial(parts.materials.pelvis);
  for(const name of ['rightHip','leftHip','sacrum']){
    const mesh=new T.Mesh(geometry(assets[name],p=>[p[0]*.00582,(p[2]-840.4)*.00582,-(p[1]+79.1)*.00582+.005]),pelvisMaterial);
    mesh.name='BodyParts3D '+name;parts.pelvis.add(mesh);
  }
  // The meshes were fitted to the existing hip, knee and ankle anchors.
  // Change the visible surface only, preserving the articulation frames.
  if (assets.femur && assets.tibia && assets.patella) for (const leg of parts.legs) {
    const mirror = leg.side === 1;
    const transform = ([x, y, z]) => [mirror ? -x : x, y, z];
    const femurMaterial = reliefMaterial(leg.femurMat);
    const shinMaterial = reliefMaterial(leg.shinMat);
    const makeBone = (name, material, fit = transform) => {
      const bone = new T.Mesh(geometry(assets[name], fit, mirror), material);
      bone.name = 'BodyParts3D ' + name;
      return bone;
    };
    const femur = makeBone('femur', femurMaterial);
    const patella = makeBone('patella', femurMaterial);
    // Register the distal mortise to the talar dome in the assembled atlas
    // foot. The proximal joint fitting and the existing ankle pivot stay put.
    const tibia = makeBone('tibia', shinMaterial, position => {
      const point = transform(position);
      point[1] += .126 * T.MathUtils.smoothstep(-point[1], .59, 1.30);
      return point;
    });
    remove(leg.femur);
    remove(leg.shin, [leg.foot, leg.fibula]);
    // The patella travels around the distal femur as the knee flexes.
    // Derive the angle from the articulated segments in the femoral frame.
    const knee = new T.Vector3(leg.side * .10, -1.63, 0);
    const pivot = new T.Group();
    pivot.name = 'Patellofemoral joint';
    pivot.position.copy(knee);
    patella.position.copy(knee).multiplyScalar(-1);
    pivot.add(patella);
    leg.femur.add(femur, pivot);
    const ankle = new T.Vector3();
    leg.fitPatella = () => {
      leg.foot.getWorldPosition(ankle);
      leg.femur.worldToLocal(ankle).sub(knee);
      const flexion = T.MathUtils.clamp(Math.atan2(-ankle.z, -ankle.y) + Math.atan2(.04, 1.31), 0, 2.75);
      pivot.rotation.x = flexion * .64;
    };
    leg.shin.add(tibia);
  }
};
