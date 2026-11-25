export function limbPoseKey(state, lesson) {
  const movement = state.movement || lesson;
  if (movement === 'squat_types') return movement + ':' + (state.squatBuild || 'shortLong');
  if (movement === 'deadlift_types') return movement + ':' + (state.bodyType || 'longLong');
  if (lesson === 'squatcom') return movement + ':b';
  const option = movement === 'lunge' && state.splitStanceOption ? ':turn' : '';
  return movement + ':' + (state.scenario || 'a') + option;
}

// Clear the proximal thigh in the posed bone coordinates, including the
// interior of the broad atlas triangles that can bridge the hip in deep flexion.
export function createLimbCorrection(T, nodes, assets, _software, sampleClearance) {
  const quadriceps = new Set(['rectusFemoris', 'intermedius', 'lateralis', 'medialis']);
  const hamstrings = new Set(['bicepsFemoris', 'semitendinosus', 'semimembranosus']);
  const fields = {R: [], L: []};
  for (const asset of assets) {
    for (const field of asset.clearanceFields || []) {
      const [nx, ny, nz] = field.shape;
      const node = nodes.get(field.bone);
      if (!node) continue;
      const side = field.bone === 'rightHip' || field.bone.startsWith('R') ? 'R' : 'L';
      fields[side].push({...field, nx, ny, nz, node, inverse: new T.Matrix4(),
        rayOrigin: new T.Vector3(), rayDirection: new T.Vector3(),
        values: new Int8Array(asset.data, asset.start + field.offset, nx * ny * nz)});
    }
  }
  const inverse = new T.Matrix4(), point = new T.Vector3(), gradient = new T.Vector3();
  const surfaces = new WeakMap();
  function prepare(part) {
    const geometry = part.mesh.geometry;
    let work = surfaces.get(geometry);
    if (work) return work;
    const indices = geometry.index.array, faces = [], vertices = [];
    for (let i = 0; i < part.positions.count; i++) {
      if (part.rest[3*i+1] > 2.30) vertices.push(i);
    }
    for (let j = 0; j < indices.length; j += 3) {
      const a = indices[j], b = indices[j+1], c = indices[j+2];
      if (Math.max(part.rest[3*a+1], part.rest[3*b+1], part.rest[3*c+1]) > 2.30) faces.push(a,b,c);
    }
    work = {vertices, faces, local: new Float32Array(part.positions.array.length),
      correction: new Float32Array(part.positions.array.length), skin: new Float32Array(part.positions.array.length), beforeWrap: new Float32Array(part.positions.array.length), counts: new Uint16Array(part.positions.count)};
    surfaces.set(geometry, work);
    return work;
  }
  function sample(field, x, y, z) {
    const d = sampleClearance(field, x, y, z, gradient);
    if (d >= .005 || gradient.lengthSq() < .000001) return false;
    gradient.normalize().multiplyScalar(Math.min(.045, .007-d));
    return true;
  }
  function clear(part, field, work) {
    const out = part.positions.array, {local, correction, counts, vertices, faces} = work;
    const world = field.node.matrixWorld;
    inverse.copy(world).invert();
    // A selected triangle can include a distal vertex outside the clearance
    // window. Computing all coordinates avoids using an uninitialized point.
    for (let j = 0; j < out.length; j += 3) point.fromArray(out,j).applyMatrix4(inverse).toArray(local,j);
    let moved = false;
    for (let pass = 0; pass < 4; pass++) {
      let changed = false;
      for (const i of vertices) {
        const k = 3 * i;
        if (!sample(field,local[k],local[k+1],local[k+2])) continue;
        local[k] += gradient.x; local[k+1] += gradient.y; local[k+2] += gradient.z;
        changed = true;
      }
      counts.fill(0); correction.fill(0);
      for (let j = 0; j < faces.length; j += 3) {
        const a = 3*faces[j], b = 3*faces[j+1], c = 3*faces[j+2];
        if (!sample(field,(local[a]+local[b]+local[c])/3,(local[a+1]+local[b+1]+local[c+1])/3,
            (local[a+2]+local[b+2]+local[c+2])/3)) continue;
        for (let h = j; h < j+3; h++) {
          const i = faces[h], k = 3*i;
          correction[k] += gradient.x; correction[k+1] += gradient.y; correction[k+2] += gradient.z;
          counts[i]++;
        }
        changed = true;
      }
      if (!changed) break;
      moved = true;
      for (const i of vertices) if (counts[i]) {
        const k = 3*i;
        local[k] += correction[k]/counts[i]; local[k+1] += correction[k+1]/counts[i]; local[k+2] += correction[k+2]/counts[i];
      }
    }
    if (moved) for (const i of vertices) {
      const k = 3*i;
      point.fromArray(local,k).applyMatrix4(world).toArray(out,k);
    }
  }
  // In deep hip flexion, the nearest exits of the two separate bones can
  // point into one another. Slide the anterior thigh around their common
  // anterior surface wherever the two contact regions meet.
  const anterior = new T.Vector3(), otherAnterior = new T.Vector3(), lateral = new T.Vector3();
  function anteriorBlend(part, sideFields) {
    const pelvis = sideFields.find(field => field.bone.endsWith('Hip'));
    const femur = sideFields.find(field => field.bone.endsWith('femur'));
    if (!pelvis || !femur) return 0;
    anterior.set(0,0,1).transformDirection(pelvis.node.matrixWorld);
    otherAnterior.set(0,0,1).transformDirection(femur.node.matrixWorld);
    const bend = Math.min(1,Math.max(0,(.65-anterior.dot(otherAnterior))/.50));
    if (bend === 0) return 0;
    lateral.set(part.side === 'R' ? -1 : 1,0,0).transformDirection(pelvis.node.matrixWorld);
    anterior.add(otherAnterior).normalize().addScaledVector(lateral,1.5).normalize();
    return bend*bend*(3-2*bend);
  }
  function clearAnterior(part, sideFields, work, blend) {
    const { vertices, faces, correction } = work, xyz = part.positions.array;
    for (const field of sideFields) {
      field.inverse.copy(field.node.matrixWorld).invert();
      const m = field.inverse.elements, x=anterior.x, y=anterior.y, z=anterior.z;
      field.rayDirection.set(m[0]*x+m[4]*y+m[8]*z,m[1]*x+m[5]*y+m[9]*z,m[2]*x+m[6]*y+m[10]*z);
    }
    if (blend < 1) {
      work.beforeWrap.set(xyz);
      xyz.set(work.skin);
    }
    function escape(x,y,z) {
      let amount = 0;
      for (const field of sideFields) field.rayOrigin.set(x,y,z).applyMatrix4(field.inverse);
      // A continuous contact weight avoids snapping to the opposite side
      // when a sampling ray grazes the edge of the cortical shell.
      for (let offset = 0; offset <= .49; offset += .025) {
        let distance = Infinity;
        for (const field of sideFields) {
          const origin = field.rayOrigin, dir = field.rayDirection;
          distance = Math.min(distance,sampleClearance(field,origin.x+offset*dir.x,
            origin.y+offset*dir.y,origin.z+offset*dir.z,gradient));
        }
        const depth = Math.max(0,Math.min(1,(.06-distance)/.065));
        const contact = depth*depth*(3-2*depth);
        amount = Math.max(amount,(offset+.030)*contact);
      }
      return amount;
    }
    for (let pass = 0; pass < 3; pass++) {
      correction.fill(0);
      let count = 0;
      for (const i of vertices) {
        const k=3*i, d=escape(xyz[k],xyz[k+1],xyz[k+2]);
        if (d) { correction[k]=d; count++; }
      }
      for (let j=0;j<faces.length;j+=3) {
        const a=3*faces[j], b=3*faces[j+1], c=3*faces[j+2];
        const d=escape((xyz[a]+xyz[b]+xyz[c])/3,(xyz[a+1]+xyz[b+1]+xyz[c+1])/3,
          (xyz[a+2]+xyz[b+2]+xyz[c+2])/3);
        if (!d) continue;
        count++;
        for (let h=j;h<j+3;h++) { const k=3*faces[h]; correction[k]=Math.max(correction[k],d); }
      }
      if (!count) break;
      for (const i of vertices) if (correction[3*i]) {
        const k=3*i,d=correction[k];
        xyz[k]+=d*anterior.x; xyz[k+1]+=d*anterior.y; xyz[k+2]+=d*anterior.z;
      }
    }
    if (blend < 1) for (const i of vertices) {
      for (let k=3*i;k<3*i+3;k++) xyz[k]=work.beforeWrap[k]+blend*(xyz[k]-work.beforeWrap[k]);
    }
  }
  return function correct(part) {
    if (!quadriceps.has(part.name) && !hamstrings.has(part.name)) return;
    const work = prepare(part), sideFields = fields[part.side];
    const anteriorThigh = part.name === 'rectusFemoris' || part.name === 'intermedius';
    const blend = anteriorThigh ? anteriorBlend(part,sideFields) : 0;
    if (blend < 1) {
      if (blend > 0) work.skin.set(part.positions.array);
      for (const field of sideFields) clear(part,field,work);
    }
    if (blend > 0) clearAnterior(part,sideFields,work,blend);
  };
}
