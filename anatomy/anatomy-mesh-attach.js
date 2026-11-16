window.azAttachAnatomyMeshes=function(parts){
  const T=parts.THREE,assets=window.azRealMeshData.assets;
  function geometry(asset,transform){
    const binary=atob(asset.data),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    const buf=new DataView(bytes.buffer),positions=new Float32Array(asset.n*3),indices=new Uint16Array(asset.f*3);
    for(let i=0;i<asset.n;i++){
      const xyz=[];for(let j=0;j<3;j++)xyz.push(asset.min[j]+buf.getUint16((i*3+j)*2,true)/65535*(asset.max[j]-asset.min[j]));
      const p=transform(xyz);positions.set(p,i*3);
    }
    for(let i=0;i<indices.length;i++)indices[i]=buf.getUint16(asset.n*6+i*2,true);
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setIndex(new T.BufferAttribute(indices,1));geo.computeVertexNormals();return geo;
  }
  function remove(parent,keep=[]){parent.children.slice().forEach(child=>{if(keep.includes(child))return;parent.remove(child);child.traverse(o=>{if(o.geometry)o.geometry.dispose();});});}
  remove(parts.head,parts.cervicalMeshes);
  const skull=assets.skull,centre=skull.min.map((v,i)=>(v+skull.max[i])/2);
  const skullMesh=new T.Mesh(geometry(skull,p=>[(p[0]-centre[0])*.00405,(p[2]-centre[2])*.00405+.12,-(p[1]-centre[1])*.00405]),parts.materials.bone);
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
  for(const name of ['rightHip','leftHip','sacrum']){
    const mesh=new T.Mesh(geometry(assets[name],p=>[p[0]*.00582,(p[2]-840.4)*.00582,-(p[1]+79.1)*.00582+.005]),parts.materials.pelvis);
    mesh.name='BodyParts3D '+name;parts.pelvis.add(mesh);
  }
};
