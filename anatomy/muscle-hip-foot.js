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
  const profiles = new Map();
  for (const asset of assets) {
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
      const c = part.name === 'maximus'
        ? ((y - 3.1) + .98*x - .24*z + .08*x*x) * 6.3
        : Math.atan2(z + .055 + .08*(x-.68), Math.max(.065,y-2.99)) * 4.2;
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
    const faces = [];
    const index = geo.index.array, rest = part.rest;
    for (let i = 0; i < index.length; i += 3) {
      const a = index[i]*3, b = index[i+1]*3, c = index[i+2]*3;
      // Fine atlas facets conform to the sampled envelope at their vertices.
      // Test the centers and edges of coarser facets that can bridge a ridge.
      const edge = (j,k) => Math.hypot(rest[j]-rest[k],rest[j+1]-rest[k+1],rest[j+2]-rest[k+2]);
      const plantarTendon = part.name === 'longus';
      if (plantarTendon && (Math.max(rest[a+1],rest[b+1],rest[c+1]) > .19 ||
          Math.min(rest[a+2],rest[b+2],rest[c+2]) < .035)) continue;
      if (Math.max(edge(a,b),edge(b,c),edge(a,c)) < (plantarTendon ? .009 : .044)) continue;
      faces.push(uniqueIds[index[i]],uniqueIds[index[i+1]],uniqueIds[index[i+2]]);
    }
    const cached = {uniqueIds, source, faces: Uint16Array.from(faces),
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

  function followSurface(part, field) {
    const isHip = Boolean(field.muscles), world = field.node.matrixWorld, a = part.positions.array;
    inv.copy(world).invert();
    const {uniqueIds, source, faces, points, shifts} = contactMesh(part);
    const {normal} = field, clearance = .003;
    for (let i = 0; i < source.length; i++) {
      const j = source[i]*3;
      shifts[i] = 0;
      if (!isHip && (part.rest[j+1] > .19 || part.rest[j+2] < .035)) continue;
      local.fromArray(a,j).applyMatrix4(inv);
      shifts[i] = requiredShift(local.x,local.y,local.z,field,clearance);
      local.toArray(points,i*3);
    }
    if (part.name === 'maximus' || part.name === 'piriformis' || part.name === 'longus') {
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

  function clearIliacOrigin(part, field) {
    const world=field.node.matrixWorld, a=part.positions.array;
    const {uniqueIds, source, faces, points, shifts}=contactMesh(part);
    // The quadratus lumborum footprint lies along the inner lip of the crest.
    // Correct only contact at the origin, in a superomedial direction.
    const dx=part.side==='R'?.68:-.68, dy=.70, dz=-.22;
    inv.copy(world).invert();
    function travel(x,y,z) {
      let offset=0;
      for (let pass=0;pass<12;pass++) {
        const distance=sampleClearance(field,x+dx*offset,y+dy*offset,z+dz*offset,gradient);
        if(distance>=.002) break;
        offset+=Math.max(.004,.003-distance);
      }
      return offset;
    }
    for (let i=0;i<source.length;i++) {
      const j=source[i]*3;
      local.fromArray(a,j).applyMatrix4(inv).toArray(points,3*i);
      shifts[i]=part.rest[j+1]<3.97 ? travel(local.x,local.y,local.z) : 0;
    }
    for (let i=0;i<faces.length;i+=3) {
      const a=faces[i], b=faces[i+1], c=faces[i+2], j=3*a,k=3*b,l=3*c;
      if (Math.min(part.rest[3*source[a]+1],part.rest[3*source[b]+1],part.rest[3*source[c]+1])>3.94) continue;
      const center=travel((points[j]+points[k]+points[l])/3,(points[j+1]+points[k+1]+points[l+1])/3,(points[j+2]+points[k+2]+points[l+2])/3);
      shifts[a]=Math.max(shifts[a],center);shifts[b]=Math.max(shifts[b],center);shifts[c]=Math.max(shifts[c],center);
      for(let edge=0;edge<3;edge++) {
        const f=faces[i+edge],g=faces[i+(edge+1)%3],m=f*3,n=g*3;
        const mid=travel((points[m]+points[n])/2,(points[m+1]+points[n+1])/2,(points[m+2]+points[n+2])/2);
        shifts[f]=Math.max(shifts[f],mid);shifts[g]=Math.max(shifts[g],mid);
      }
    }
    for(let i=0;i<uniqueIds.length;i++) {
      const id=uniqueIds[i],delta=shifts[id];
      if(!delta)continue;
      local.fromArray(points,id*3);local.x+=dx*delta;local.y+=dy*delta;local.z+=dz*delta;
      local.applyMatrix4(world).toArray(a,i*3);
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
    if (part.name === 'quadratus') {
      const ilium = bySide[part.side].find(field => field.bone.endsWith('Hip'));
      if (ilium) {
        clearIliacOrigin(part, ilium);
        clearIliacOrigin(part, ilium);
      }
    } else if (hipMuscles.has(part.name) || part.name === 'piriformis') {
      for (const field of bySide[part.side]) clearBone(part, field);
    }
  }
  correct.dispose = () => { for (const material of materials.values()) material.dispose(); };
  return correct;
}
