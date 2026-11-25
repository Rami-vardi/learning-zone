// Sample the signed distance to a registered bone in its local frame.
export function sampleClearance(field, x, y, z, gradient) {
  const {nx, ny, nz, values, origin, unit, step} = field;
  const gx = (x-origin[0])/step, gy = (y-origin[1])/step, gz = (z-origin[2])/step;
  if (gx<0 || gx>=nx-1 || gy<0 || gy>=ny-1 || gz<0 || gz>=nz-1) return Infinity;
  const ix=Math.floor(gx), iy=Math.floor(gy), iz=Math.floor(gz);
  const u=gx-ix, v=gy-iy, w=gz-iz, oneU=1-u, oneV=1-v, oneW=1-w;
  const plane=nx*ny, k=ix+nx*iy+plane*iz, far=k+plane;
  const a0=values[k], a1=values[k+1], a2=values[k+nx], a3=values[k+nx+1];
  const b0=values[far], b1=values[far+1], b2=values[far+nx], b3=values[far+nx+1];
  const aLow=oneU*a0+u*a1, aHigh=oneU*a2+u*a3;
  const bLow=oneU*b0+u*b1, bHigh=oneU*b2+u*b3;
  const front=oneV*aLow+v*aHigh, back=oneV*bLow+v*bHigh;
  const scale=unit/step;
  gradient.set(scale*(oneW*(oneV*(a1-a0)+v*(a3-a2))+w*(oneV*(b1-b0)+v*(b3-b2))),
    scale*(oneW*(aHigh-aLow)+w*(bHigh-bLow)), scale*(back-front));
  return unit*(oneW*front+w*back);
}

// Signed distances are sampled on the actual iliac and proximal femoral
// surfaces in bone coordinates. The mesh is always corrected from its posed
// rest surface, so a previous frame or camera angle cannot change its shape.
export function createHipFootCorrection(T, nodes, assets, software = false) {
  const bySide = {R: [], L: []};
  const profiles = new Map(), femoralBindings = new WeakMap();
  for (const asset of assets) {
    for (const item of asset.meshes) {
      if(item.name==='maximus')femoralBindings.set(item,asset.bones.indexOf(item.side+'femur'));
    }
    for (const field of asset.clearanceFields || []) {
      const [nx, ny, nz] = field.shape;
      const side = field.bone === 'rightHip' || field.bone.startsWith('R') ? 'R' : 'L';
      bySide[side].push({...field, nx, ny, nz, node: nodes.get(field.bone),
        values: new Int8Array(asset.data, asset.start + field.offset, nx * ny * nz)});
    }
    for (const field of [...(asset.tendonFields || []), ...(asset.hipContours || [])]) {
      const [nx, nz] = field.shape;
      const hip = Boolean(field.muscles);
      const side = hip ? (field.bone === 'rightHip' ? 'R' : 'L') : field.bone[0];
      const [x,y] = field.normal;
      const data = {...field, nx, nz, node: nodes.get(field.bone),
        normal: hip ? field.normal : [x,y,0],
        axisU: hip ? field.axisU : [y,-x,0],
        axisV: hip ? field.axisV : [0,0,1],
        values: new Int16Array(asset.data, asset.start + field.offset, nx * nz)};
      for (const muscle of field.muscles || [field.muscle]) {
        const key = side + muscle;
        if (!profiles.has(key)) profiles.set(key, []);
        profiles.get(key).push(data);
      }
    }
  }
  const styled = new WeakSet(), materials = new Map();
  const inv = new T.Matrix4(), local = new T.Vector3(), gradient = new T.Vector3();
  const hipMuscles = new Set(['maximus','medius','minimus']);

  function bundles(part, useCanvas) {
    const geometry = part.mesh.geometry;
    const coords = new Float32Array(part.positions.count);
    const colors = geometry.attributes.color;
    for (let i = 0; i < coords.length; i++) {
      const j = i * 3, x = Math.abs(part.rest[j]), y = part.rest[j+1], z = part.rest[j+2];
      // Maximus runs obliquely toward the lateral thigh. Medius and minimus
      // fan towards the trochanter. These bands illustrate regional direction.
      let c;
      if (part.item.bundleGuides) {
        const along=(x-.40)-.75*(y-3.40)+.32*(z+.25);
        const across=(y-3.40)+.75*(x-.40)-.30*(z+.25);
        const [upper,middle,lower]=part.item.bundleGuides;
        const at=k=>(k[0]*along+k[1])*along+k[2];
        const mid=at(middle),spacing=across>mid ? at(upper)-mid : mid-at(lower);
        c=2.15*(across-mid)/Math.max(.13,spacing);
      } else if(part.item.bundleInsertion) {
        const [ix,iy,iz]=part.item.bundleInsertion;
        const radial=Math.max(.075,Math.hypot(x-ix,y-iy));
        c=4.2*Math.atan2(z-iz,radial);
      } else {
        c=((y-3.1)+.98*x-.24*z+.08*x*x)*6.3;
      }
      coords[i] = c;
      if (useCanvas) {
        const tone = .97 + .115*Math.cos(c*Math.PI*2);
        colors.setXYZ(i, colors.getX(i)*tone, colors.getY(i)*tone, colors.getZ(i)*tone);
      }
    }
    if (useCanvas) { colors.needsUpdate = true; return; }
    geometry.setAttribute('lensBundleCoordinate',new T.BufferAttribute(coords,1));
    const original = part.mesh.material;
    if (!materials.has(original)) {
      const material = original.clone();
      material.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader.replace('#include <common>',
          '#include <common>\nattribute float lensBundleCoordinate;\nvarying float vLensBundleCoordinate;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLensBundleCoordinate = lensBundleCoordinate;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
          '#include <common>\nvarying float vLensBundleCoordinate;')
          .replace('#include <color_fragment>', `#include <color_fragment>
            float bundle = vLensBundleCoordinate * 6.2831853;
            float contrast = 1.0 - smoothstep(.15, .55, fwidth(vLensBundleCoordinate));
            diffuseColor.rgb *= 1.0 + contrast * (.10*cos(bundle) + .035*cos(2.0*bundle));`);
      };
      material.customProgramCacheKey = () => 'anatomy-directional-bundles-v1';
      materials.set(original,material);
    }
    part.mesh.material = materials.get(original);
  }

  function clearBone(part, field) {
    const world = field.node.matrixWorld, a = part.positions.array;
    inv.copy(world).invert();
    for (let i = 0; i < a.length; i += 3) {
      local.fromArray(a,i).applyMatrix4(inv);
      let moved = false;
      for (let pass = 0; pass < 4; pass++) {
        const distance = sampleClearance(field, local.x, local.y, local.z, gradient);
        if (distance >= .0025) break;
        const length=gradient.length();
        if (length < .002) break;
        local.addScaledVector(gradient,Math.min(.045,.003-distance)/length);
        moved=true;
      }
      if (moved) local.applyMatrix4(world).toArray(a,i);
    }
  }
  const contactMeshes = new WeakMap();

  function contactMesh(part) {
    const geo = part.mesh.geometry;
    if (contactMeshes.has(geo)) return contactMeshes.get(geo);
    const count = part.positions.count, uniqueIds = new Int32Array(count), ids = new Map(), source = [];
    for (let i = 0; i < count; i++) {
      const j = 3*i, key = part.rest[j] + ',' + part.rest[j+1] + ',' + part.rest[j+2];
      if (!ids.has(key)) { ids.set(key, source.length); source.push(i); }
      uniqueIds[i] = ids.get(key);
    }
    const faces = [], connected = new Set();
    const index = geo.index.array, rest = part.rest;
    for (let i = 0; i < index.length; i += 3) {
      const a = index[i]*3, b = index[i+1]*3, c = index[i+2]*3;
      for (let f=0;f<3;f++) {
        const v=uniqueIds[index[i+f]], w=uniqueIds[index[i+(f+1)%3]];
        if(v!==w)connected.add(Math.min(v,w)*65536+Math.max(v,w));
      }
      // Fine atlas facets conform to the sampled envelope at their vertices.
      // Test the centers and edges of coarser facets that can bridge a ridge.
      const edge = (j,k) => Math.hypot(rest[j]-rest[k],rest[j+1]-rest[k+1],rest[j+2]-rest[k+2]);
      const plantarTendon = part.name === 'longus';
      if (plantarTendon && (Math.max(rest[a+1],rest[b+1],rest[c+1]) > .19 ||
          Math.min(rest[a+2],rest[b+2],rest[c+2]) < .035)) continue;
      if (Math.max(edge(a,b),edge(b,c),edge(a,c)) < (plantarTendon ? .009 : .044)) continue;
      faces.push(uniqueIds[index[i]],uniqueIds[index[i+1]],uniqueIds[index[i+2]]);
    }
    const edges=new Uint16Array(connected.size*2);
    let e=0;
    for(const id of [...connected].sort((a,b)=>a-b)){edges[e++]=Math.floor(id/65536);edges[e++]=id%65536;}
    const materialFaces=Uint16Array.from(index,i=>uniqueIds[i]),restArea=new Float32Array(index.length/3),footprint=new Uint8Array(index.length/3);
    for(let f=0;f<restArea.length;f++){
      const a=3*index[3*f],b=3*index[3*f+1],c=3*index[3*f+2];
      const ux=rest[b]-rest[a],uy=rest[b+1]-rest[a+1],uz=rest[b+2]-rest[a+2];
      const vx=rest[c]-rest[a],vy=rest[c+1]-rest[a+1],vz=rest[c+2]-rest[a+2];
      restArea[f]=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx);
      if(part.name==='maximus' && Math.abs((rest[a]+rest[b]+rest[c])/3)>.57 &&
          (rest[a+1]+rest[b+1]+rest[c+1])/3<3.05 && (rest[a+2]+rest[b+2]+rest[c+2])/3>-.17){
        let femoralWeight=0;
        for(let v=0;v<3;v++)for(let k=4*index[3*f+v],n=k+4;k<n;k++){
          if(part.bone[k]===femoralBindings.get(part.item))femoralWeight+=part.weight[k];
        }
        footprint[f]=femoralWeight>3*255*.92;
      }
    }
    const cached = {uniqueIds, source, materialFaces,restArea,footprint, edges, edgeCosts: new Float32Array(connected.size), faces: Uint16Array.from(faces),
      points: new Float32Array(source.length*3), shifts: new Float32Array(source.length)};
    contactMeshes.set(geo,cached);
    return cached;
  }

  function requiredShift(x,y,z,field,clearance) {
    const {nx, nz, values, normal, axisU, axisV, origin, unit, step} = field;
    const gx=(axisU[0]*x+axisU[1]*y+axisU[2]*z-origin[0])/step;
    const gz=(axisV[0]*x+axisV[1]*y+axisV[2]*z-origin[1])/step;
    if (gx<0 || gz<0 || gx>=nx-1 || gz>=nz-1) return 0;
    const ix=Math.floor(gx), iz=Math.floor(gz), k=ix+iz*nx, u=gx-ix, w=gz-iz;
    const near=(1-u)*values[k]+u*values[k+1], far=(1-u)*values[k+nx]+u*values[k+nx+1];
    return Math.max(0,unit*((1-w)*near+w*far)+clearance-normal[0]*x-normal[1]*y-normal[2]*z);
  }

  // Spread a contact displacement across the connected belly. An isolated
  // projected vertex otherwise stretches or flattens a whole coarse facet.
  function spreadContact(surface, slope) {
    const {points, shifts, edges, edgeCosts} = surface;
    for (let e=0; e<edges.length; e+=2) {
      const a=edges[e]*3,b=edges[e+1]*3;
      const dx=points[a]-points[b],dy=points[a+1]-points[b+1],dz=points[a+2]-points[b+2];
      edgeCosts[e/2]=slope*Math.sqrt(dx*dx+dy*dy+dz*dz);
    }
    for (let pass=0;pass<6;pass++) {
      let changed=false;
      const forward=pass%2===0;
      for(let e=forward?0:edges.length-2;forward?e<edges.length:e>=0;e+=forward?2:-2) {
        const a=edges[e],b=edges[e+1],cost=edgeCosts[e/2];
        const diff=shifts[a]-shifts[b];
        if(diff>cost+.00002) {shifts[b]=shifts[a]-cost;changed=true;}
        else if(diff < -cost-.00002) {shifts[a]=shifts[b]-cost;changed=true;}
      }
      if(!changed)break;
    }
  }

  function followSurface(part, field) {
    const isHip = Boolean(field.muscles), world = field.node.matrixWorld, a = part.positions.array;
    inv.copy(world).invert();
    const {uniqueIds, source, faces, points, shifts} = contactMesh(part);
    const {normal} = field, clearance = .003;
    for (let i = 0; i < source.length; i++) {
      const j = source[i]*3;
      shifts[i] = 0;
      local.fromArray(a,j).applyMatrix4(inv).toArray(points,i*3);
      if (!isHip && (part.rest[j+1] > .19 || part.rest[j+2] < .035)) continue;
      shifts[i] = requiredShift(local.x,local.y,local.z,field,clearance);
    }
    if (part.name === 'maximus' || part.name === 'piriformis' || part.name === 'quadratus' || part.name === 'longus') {
      for (let i = 0; i < faces.length; i += 3) {
        const a=faces[i], b=faces[i+1], c=faces[i+2];
        const j=a*3, k=b*3, l=c*3;
        const center=requiredShift((points[j]+points[k]+points[l])/3,
          (points[j+1]+points[k+1]+points[l+1])/3,(points[j+2]+points[k+2]+points[l+2])/3,field,clearance);
        for (let edge = 0; edge < 3; edge++) {
          const f=faces[i+edge], g=faces[i+(edge+1)%3], m=f*3, n=g*3;
          const mid=requiredShift((points[m]+points[n])/2,(points[m+1]+points[n+1])/2,
            (points[m+2]+points[n+2])/2,field,clearance);
          shifts[f]=Math.max(shifts[f],center,mid);
          shifts[g]=Math.max(shifts[g],center,mid);
        }
      }
    }
    spreadContact(contactMesh(part), isHip ? .16 : .36);
    for (let i=0;i<uniqueIds.length;i++) {
      const id=uniqueIds[i], j=i*3;
      let offset=shifts[id];
      if (!offset) continue;
      // Piriformis retains its anterior sacral origin and travels through the
      // greater sciatic foramen. Wrap only its emerging lateral segment.
      if (part.name === 'piriformis') {
        const t=Math.max(0,Math.min(1,(Math.abs(part.rest[j])-.32)/.105));
        offset*=t*t*(3-2*t);
      }
      local.fromArray(points,id*3);
      local.x+=offset*normal[0]; local.y+=offset*normal[1]; local.z+=offset*normal[2];
      local.applyMatrix4(world).toArray(a,j);
    }
  }

  // The atlas surface is a material sheet. Prevent a contacting sheet from
  // folding into a sliver or spanning a gap with a single enlarged triangle.
  // Corrections act on shared vertices and conserve each unconstrained
  // triangle's center instead of rescaling the whole muscle.
  function retainSurfaceArea(part) {
    const {source,uniqueIds,materialFaces,restArea,footprint,points}=contactMesh(part);
    const output=part.positions.array;
    for(let i=0;i<source.length;i++) {
      const j=3*source[i],k=3*i;
      points[k]=output[j];points[k+1]=output[j+1];points[k+2]=output[j+2];
    }
    let changed=false;
    for(let pass=0;pass<5;pass++){
      let active=false;
      for(let f=0;f<restArea.length;f++){
        if(restArea[f]<.00005)continue;
        const j=3*materialFaces[3*f],k=3*materialFaces[3*f+1],l=3*materialFaces[3*f+2];
        const ux=points[k]-points[j],uy=points[k+1]-points[j+1],uz=points[k+2]-points[j+2];
        const vx=points[l]-points[j],vy=points[l+1]-points[j+1],vz=points[l+2]-points[j+2];
        let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
        const area=Math.sqrt(nx*nx+ny*ny+nz*nz);
        const lo=footprint[f] ? .94 : .65, hi=footprint[f] ? 1.12 : 2.15;
        const target=Math.min(hi*restArea[f],Math.max(lo*restArea[f],area));
        if(Math.abs(target-area)<.000025 || area<1e-10)continue;
        nx/=area;ny/=area;nz/=area;
        const bx=vy*nz-vz*ny,by=vz*nx-vx*nz,bz=vx*ny-vy*nx;
        const cx=ny*uz-nz*uy,cy=nz*ux-nx*uz,cz=nx*uy-ny*ux;
        const ax=-bx-cx,ay=-by-cy,az=-bz-cz;
        const divisor=ax*ax+ay*ay+az*az+bx*bx+by*by+bz*bz+cx*cx+cy*cy+cz*cz;
        if(divisor<1e-12)continue;
        const s=(target-area)/divisor;
        points[j]+=s*ax;points[j+1]+=s*ay;points[j+2]+=s*az;
        points[k]+=s*bx;points[k+1]+=s*by;points[k+2]+=s*bz;
        points[l]+=s*cx;points[l+1]+=s*cy;points[l+2]+=s*cz;
        active=true;
      }
      if(!active)break;
      changed=true;
    }
    if(changed)for(let i=0;i<uniqueIds.length;i++){
      const j=3*i,k=3*uniqueIds[i];output[j]=points[k];output[j+1]=points[k+1];output[j+2]=points[k+2];
    }
  }

  function correct(part, useCanvas = software) {
    if (hipMuscles.has(part.name)) {
      const geometry = part.mesh.geometry;
      if (!styled.has(geometry)) {
        bundles(part, useCanvas);
        styled.add(geometry);
      }
    }
    const fields = profiles.get(part.side + part.name);
    if (fields) for (const field of fields) followSurface(part, field);
    if(part.name==='maximus')retainSurfaceArea(part);
    if (hipMuscles.has(part.name) || part.name === 'piriformis') {
      for (const field of bySide[part.side]) clearBone(part, field);
    }
  }
  correct.dispose = () => { for (const material of materials.values()) material.dispose(); };
  return correct;
}
