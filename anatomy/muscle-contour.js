// Reconstruct the outside of a folded atlas surface from its posed triangle sections.
// Rings occupy ordered, parallel planes. Each point follows the outermost measured
// crossing of its ray, so internal folds cannot become visible sheets of tissue.
const obstacles=new WeakMap();
function boneVertices(T,node){
  let data=obstacles.get(node);
  if(!data){data={matrix:new T.Matrix4(),points:new Float32Array(node.geometry.attributes.position.count*3),bounds:new T.Box3(),ready:false};obstacles.set(node,data);}
  node.updateWorldMatrix(true,false);
  if(data.ready&&data.matrix.equals(node.matrixWorld))return data;
  data.matrix.copy(node.matrixWorld);data.bounds.makeEmpty();data.ready=true;
  const p=new T.Vector3(),positions=node.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    p.fromBufferAttribute(positions,i).applyMatrix4(node.matrixWorld);p.toArray(data.points,i*3);data.bounds.expandByPoint(p);
  }
  return data;
}
function inside(cut,x,y){
  let parity=false;
  for(let i=0;i<cut.length;i+=4){
    const a=cut[i+1],b=cut[i+3];
    if((a>y)!==(b>y)&&x<cut[i]+(cut[i+2]-cut[i])*(y-a)/(b-a))parity=!parity;
  }
  return parity;
}
export function createMuscleContour(T, surface, software, bones) {
  const rings=software?17:29, sides=software?12:22, last=1+rings*sides;
  const positions=new T.BufferAttribute(new Float32Array((last+1)*3),3).setUsage(T.DynamicDrawUsage);
  const colors=new T.BufferAttribute(new Float32Array((last+1)*3),3).setUsage(T.DynamicDrawUsage);
  const geometry=new T.BufferGeometry(),indices=[];
  for(let j=0;j<sides;j++){
    const next=(j+1)%sides;
    indices.push(0,1+next,1+j,last,last-sides+j,last-sides+next);
    for(let i=0;i<rings-1;i++){
      const a=1+i*sides+j,b=1+i*sides+next;
      indices.push(a,b,b+sides,a,b+sides,a+sides);
    }
  }
  geometry.setIndex(indices);geometry.setAttribute('position',positions);geometry.setAttribute('color',colors);
  const src=surface.getAttribute('position'),tone=surface.getAttribute('color'),tri=surface.index.array;
  const axial=new Float64Array(src.count),planeX=new Float64Array(src.count),planeY=new Float64Array(src.count);
  const segments=Array.from({length:rings},()=>[]);
  const boneCuts=bones.map(node=>({
    node, planes:Array.from({length:rings},()=>[]), local:new Float64Array(node.geometry.attributes.position.count*3)
  }));
  const bounds=new T.Box3();
  const cos=[],sin=[];
  for(let j=0;j<sides;j++){cos.push(Math.cos(2*Math.PI*j/sides));sin.push(Math.sin(2*Math.PI*j/sides));}
  const mean=new T.Vector3(),axis=new T.Vector3(0,1,0),u=new T.Vector3(),v=new T.Vector3(),p=new T.Vector3();
  // The same atlas landmarks orient the frame throughout a rep, including backward scrubbing.
  let aId=0,bId=0,rimId=0;
  const distanceTo=(i,j)=>p.fromBufferAttribute(src,i).distanceToSquared(u.fromBufferAttribute(src,j));
  for(let i=1;i<src.count;i++)if(distanceTo(i,0)>distanceTo(aId,0))aId=i;
  for(let i=0;i<src.count;i++)if(distanceTo(i,aId)>distanceTo(bId,aId))bId=i;
  axis.fromBufferAttribute(src,bId).sub(u.fromBufferAttribute(src,aId)).normalize();
  let widest=0;
  for(let i=0;i<src.count;i++){
    p.fromBufferAttribute(src,i).sub(u.fromBufferAttribute(src,aId));
    const r=p.lengthSq()-p.dot(axis)**2;if(r>widest){widest=r;rimId=i;}
  }
  const supports=new Float64Array(sides);
  function update(){
    bounds.setFromBufferAttribute(src);
    mean.set(0,0,0);
    for(let i=0;i<src.count;i++)mean.add(p.fromBufferAttribute(src,i));
    mean.multiplyScalar(1/src.count);
    let xx=0,xy=0,xz=0,yy=0,yz=0,zz=0;
    for(let i=0;i<src.count;i++){
      const {x,y,z}=p.fromBufferAttribute(src,i).sub(mean);
      xx+=x*x;xy+=x*y;xz+=x*z;yy+=y*y;yz+=y*z;zz+=z*z;
    }
    axis.fromBufferAttribute(src,bId).sub(u.fromBufferAttribute(src,aId)).normalize();
    for(let i=0;i<14;i++){const {x,y,z}=axis;axis.set(xx*x+xy*y+xz*z,xy*x+yy*y+yz*z,xz*x+yz*y+zz*z).normalize();}
    u.fromBufferAttribute(src,rimId).sub(p.fromBufferAttribute(src,aId));
    u.addScaledVector(axis,-u.dot(axis)).normalize();v.crossVectors(axis,u);
    let lo=Infinity,hi=-Infinity,lowId=0,highId=0;
    for(let i=0;i<src.count;i++){
      p.fromBufferAttribute(src,i).sub(mean);const a=axial[i]=p.dot(axis);
      planeX[i]=p.dot(u);planeY[i]=p.dot(v);
      if(a<lo){lo=a;lowId=i;}if(a>hi){hi=a;highId=i;}
    }
    const span=hi-lo;if(span<1e-7)return;
    const spacing=span/rings,first=lo+.5*spacing;
    for(const list of segments)list.length=0;
    for(let f=0;f<tri.length;f+=3){
      const a=tri[f],b=tri[f+1],c=tri[f+2];
      const start=Math.max(0,Math.ceil((Math.min(axial[a],axial[b],axial[c])-first)/spacing));
      const finish=Math.min(rings-1,Math.floor((Math.max(axial[a],axial[b],axial[c])-first)/spacing));
      for(let r=start;r<=finish;r++){
        const level=first+r*spacing,list=segments[r],begin=list.length;
        for(let j=0;j<3;j++){
          const i=tri[f+j],k=tri[f+(j+1)%3];if((axial[i]>level)===(axial[k]>level))continue;
          const t=(level-axial[i])/(axial[k]-axial[i]);
          list.push(planeX[i]+t*(planeX[k]-planeX[i]),planeY[i]+t*(planeY[k]-planeY[i]),i,k,t);
        }
        if(list.length-begin!==10)list.length=begin;
      }
    }
    // Intersect the actual neighboring bones with the same planes. An outer
    // curve that bridges a concave atlas cut must still clear the underlying bone.
    for(const {node,planes,local} of boneCuts){
      for(const cut of planes)cut.length=0;
      const bone=boneVertices(T,node);if(!bounds.intersectsBox(bone.bounds))continue;
      for(let i=0;i<local.length;i+=3){
        p.fromArray(bone.points,i).sub(mean);
        local[i]=p.dot(axis);local[i+1]=p.dot(u);local[i+2]=p.dot(v);
      }
      const index=node.geometry.index.array;
      for(let f=0;f<index.length;f+=3){
        const a=3*index[f],b=3*index[f+1],c=3*index[f+2];
        const start=Math.max(0,Math.ceil((Math.min(local[a],local[b],local[c])-first)/spacing));
        const finish=Math.min(rings-1,Math.floor((Math.max(local[a],local[b],local[c])-first)/spacing));
        for(let r=start;r<=finish;r++){
          const level=first+r*spacing,cut=planes[r],begin=cut.length;
          for(let j=0;j<3;j++){
            const i=3*index[f+j],k=3*index[f+(j+1)%3];
            if((local[i]>level)===(local[k]>level))continue;
            const t=(level-local[i])/(local[k]-local[i]);
            cut.push(local[i+1]+t*(local[k+1]-local[i+1]),local[i+2]+t*(local[k+2]-local[i+2]));
          }
          if(cut.length-begin!==4)cut.length=begin;
        }
      }
    }
    function put(dest,x,y,a,i,k,t){
      p.copy(mean).addScaledVector(axis,a).addScaledVector(u,x).addScaledVector(v,y);
      positions.setXYZ(dest,p.x,p.y,p.z);
      const at=3*i,bt=3*k,raw=tone.array;
      colors.setXYZ(dest,raw[at]+(raw[bt]-raw[at])*t,raw[at+1]+(raw[bt+1]-raw[at+1])*t,raw[at+2]+(raw[bt+2]-raw[at+2])*t);
    }
    put(0,planeX[lowId],planeY[lowId],lo,lowId,lowId,0);
    put(last,planeX[highId],planeY[highId],hi,highId,highId,0);
    for(let r=0;r<rings;r++){
      const list=segments[r],level=first+r*spacing;
      let cx=0,cy=0;
      for(let i=0;i<list.length;i+=5){cx+=list[i];cy+=list[i+1];}
      if(list.length){cx/=list.length/5;cy/=list.length/5;}
      else {const t=(level-lo)/span;cx=planeX[lowId]+t*(planeX[highId]-planeX[lowId]);cy=planeY[lowId]+t*(planeY[highId]-planeY[lowId]);}
      // Open cuts at narrow tendons may supply only one side of a ray. In those
      // directions use supporting lines of that same section instead of collapsing to its center.
      const obstacles=boneCuts.map(b=>b.planes[r]).filter(cut=>cut.length);
      if(obstacles.some(cut=>inside(cut,cx,cy))){
        let found=false;
        for(const weight of [.25,.5,.75,1]){
          for(let k=0;k<list.length;k+=5){
            const x=cx+weight*(list[k]-cx),y=cy+weight*(list[k+1]-cy);
            if(obstacles.every(cut=>!inside(cut,x,y))){cx=x;cy=y;found=true;break;}
          }
          if(found)break;
        }
      }
      supports.fill(span*.0008);
      for(let i=0;i<list.length;i+=5)for(let j=0;j<sides;j++)
        supports[j]=Math.max(supports[j],(list[i]-cx)*cos[j]+(list[i+1]-cy)*sin[j]);
      for(let j=0;j<sides;j++){
        const dx=cos[j],dy=sin[j];let reach=0,source=lowId,other=lowId,fraction=0;
        for(let i=0;i<list.length;i+=10){
          const x=list[i]-cx,y=list[i+1]-cy,ex=list[i+5]-list[i],ey=list[i+6]-list[i+1],det=dx*ey-dy*ex;
          if(Math.abs(det)<1e-10)continue;
          const dist=(x*ey-y*ex)/det,t=(x*dy-y*dx)/det;
          if(t<0||t>1||dist<=reach)continue;
          reach=dist;const k=t<.5?i:i+5;source=list[k+2];other=list[k+3];fraction=list[k+4];
        }
        if(reach<span*.0008){
          reach=Infinity;
          for(let k=0;k<sides;k++){const d=dx*cos[k]+dy*sin[k];if(d>.001)reach=Math.min(reach,supports[k]/d);}
          if(list.length){source=list[2];other=list[3];fraction=list[4];}
        }
        for(const cut of obstacles){
          for(let i=0;i<cut.length;i+=4){
            const x=cut[i]-cx,y=cut[i+1]-cy,ex=cut[i+2]-cut[i],ey=cut[i+3]-cut[i+1],det=dx*ey-dy*ex;
            if(Math.abs(det)<1e-10)continue;
            const t=(x*dy-y*dx)/det;if(t<0||t>=1)continue;
            const d=(x*ey-y*ex)/det;if(d>0&&d<reach+.003)reach=Math.min(reach,Math.max(span*.0001,d-.003));
          }
        }
        put(1+r*sides+j,cx+reach*dx,cy+reach*dy,level,source,other,fraction);
      }
    }
    colors.needsUpdate=positions.needsUpdate=true;
  }
  return {geometry,update};
}
