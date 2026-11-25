// Each family contains fitted rest surfaces, four bone influences per vertex,
// and inverse bind matrices from Johnny's neutral pose. No writes to the rig.
const families = {
  hike: ['gluteal'], lunge: ['gluteal', 'thigh'], hip: ['gluteal'], tilt: ['trunk'],
  ribshift: ['trunk', 'scapular'], scapula: ['scapular'],
  ribs: ['breathing'], foot: ['ankle']
};
const profiles = {
  hike: [['medius'], ['minimus', 'quadratus']],
  lunge: [['maximus', 'medius', 'rectusFemoris', 'lateralis', 'medialis'], ['minimus', 'quadratus', 'intermedius']],
  hip: [['maximus', 'medius', 'tensor', 'tract'], ['minimus', 'piriformis']],
  tilt: [['rectus', 'oblique', 'erectors'], ['multifidus', 'transversus']],
  ribshift: [['rectus', 'oblique', 'erectors'], ['multifidus', 'transversus']],
  scapula: [['serratus', 'trapezius'], ['major', 'minor', 'serratus']],
  ribs: [['diaphragm', 'intercostals'], ['diaphragm']],
  foot: [['longus', 'brevis'], ['posterior']]
};

// Shared selections apply to every supported body build and stance in the lesson.
const squat = {
  families: ['gluteal','thigh','trunk'],
  layers: [['maximus','rectusFemoris','lateralis','medialis','erectors'],['medius','intermedius','adductor','semimembranosus']]
};
const hinge = {
  families: ['gluteal','thigh','trunk'],
  layers: [['maximus','bicepsFemoris','semitendinosus','erectors'],['semimembranosus','adductor','multifidus']]
};
const press = {
  families: ['shoulder','arm','scapular'],
  layers: [['anteriorDeltoid','middleDeltoid','upperTrap','tricepsLong','tricepsLateral'],['serratus','supraspinatus','tricepsMedial']]
};
const horizontalPress = {
  families: ['shoulder','arm','scapular'],
  layers: [['sternalPec','clavicularPec','anteriorDeltoid','tricepsLong','tricepsLateral'],['serratus','tricepsMedial']]
};
const pull = {
  families: ['shoulder','arm','scapular'],
  layers: [['latissimus','rearDeltoid','trapezius','bicepsLong','bicepsShort'],['major','minor','teresMajor','brachialis','infraspinatus']]
};
const exercises = {
  chain: {families: ['trunk','scapular'], layers: profiles.ribshift},
  squat, squat_types: squat, squatcom: squat, bulgarian_split_squat: squat,
  rdl: hinge,
  deadlift_types: {families: hinge.families, layers: [
    [...hinge.layers[0],'lateralis','medialis'],hinge.layers[1]
  ]},
  press, row: pull, pullup: pull, dips: horizontalPress, bench: horizontalPress, pushup: horizontalPress
};
for (const [id, lesson] of Object.entries(exercises)) {
  families[id] = lesson.families;
  profiles[id] = lesson.layers;
}
const muscleNames = {
  maximus: 'gluteus maximus', medius: 'gluteus medius', minimus: 'gluteus minimus',
  quadratus: 'quadratus lumborum', tensor: 'tensor fasciae latae', tract: 'iliotibial tract',
  rectus: 'rectus abdominis', oblique: 'external oblique', erectors: 'iliocostalis lumborum',
  transversus: 'transversus abdominis', serratus: 'serratus anterior',
  trapezius: 'middle trapezius', intercostals: 'external intercostals',
  bicepsFemoris: 'biceps femoris, long head', major: 'rhomboid major', minor: 'rhomboid minor',
  longus: 'fibularis longus', brevis: 'fibularis brevis', posterior: 'tibialis posterior',
  lateralis: 'vastus lateralis', medialis: 'vastus medialis', intermedius: 'vastus intermedius',
  adductor: 'adductor magnus', upperTrap: 'upper trapezius', rearDeltoid: 'posterior deltoid',
  sternalPec: 'pectoralis major, sternocostal portion', clavicularPec: 'pectoralis major, clavicular portion',
  tricepsLong: 'triceps brachii, long head', tricepsLateral: 'triceps brachii, lateral head',
  tricepsMedial: 'triceps brachii, medial head', bicepsLong: 'biceps brachii, long head',
  bicepsShort: 'biceps brachii, short head', latissimus: 'latissimus dorsi'
};
const cache = new Map();
const retryFamilies = new Set();
// Validate all buffer views before caching a pack. A partial network response
// must be recoverable by pressing the lens control again.
function decodeFamily(data) {
  const length = new DataView(data).getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 4, length)));
  const start = 4 + length;
  const invalid = () => { throw Error('Invalid muscle surfaces'); };
  if (!Array.isArray(header.bones) || !header.bones.length || header.bones.length > 256 ||
      new Set(header.bones).size !== header.bones.length || !header.bones.every(key => typeof key === 'string') ||
      !Array.isArray(header.inverseBind) || header.inverseBind.length !== header.bones.length ||
      !header.inverseBind.every(matrix => Array.isArray(matrix) && matrix.length === 16 && matrix.every(Number.isFinite)) ||
      !Array.isArray(header.meshes) || !header.meshes.length) invalid();
  const vector = (value, size) => Array.isArray(value) && value.length === size && value.every(Number.isFinite);
  const unitVector = (value, size) => vector(value, size) && Math.abs(Math.hypot(...value) - 1) <= .001;
  const footBone = /^[RL](Talus|Calcaneus|Navicular|Cuboid|(?:Medial|Intermediate|Lateral) cuneiform|Metatarsal [1-5])$/;
  for (const [key, dimensions, bytes] of [['clearanceFields', 3, 1], ['tendonFields', 2, 2], ['hipContours', 2, 2]]) {
    if (header[key] === undefined) continue;
    if (!Array.isArray(header[key])) invalid();
    for (const field of header[key]) {
      if (!field || typeof field.bone !== 'string' || !field.bone || !vector(field.origin, dimensions) ||
          !Array.isArray(field.shape) || field.shape.length !== dimensions ||
          !field.shape.every(n => Number.isSafeInteger(n) && n >= 2) ||
          !Number.isFinite(field.step) || field.step <= 0 || !Number.isFinite(field.unit) || field.unit <= 0 ||
          !Number.isSafeInteger(field.offset) || field.offset < 0 || (start + field.offset) % bytes) invalid();
      if (key === 'clearanceFields' && !header.bones.includes(field.bone)) invalid();
      if (key === 'tendonFields' && (!footBone.test(field.bone) ||
          !['longus', 'brevis', 'posterior'].includes(field.muscle) || !unitVector(field.normal, 2))) invalid();
      if (key === 'hipContours' && (!['rightHip','leftHip'].includes(field.bone) || !header.bones.includes(field.bone) ||
          ![field.axisU, field.axisV, field.normal].every(axis => unitVector(axis, 3)) ||
          !Array.isArray(field.muscles) || !field.muscles.length ||
          !field.muscles.every(name => header.meshes.some(mesh => mesh.name === name)))) invalid();
      const size = field.shape.reduce((count, n) => count * n, bytes);
      if (!Number.isSafeInteger(size) || start + field.offset + size > data.byteLength) invalid();
    }
  }
  for (const item of header.meshes) {
    const n = item.n;
    if (!Number.isSafeInteger(n) || n < 1 || n > 65536 || typeof item.name !== 'string' ||
        !['L', 'R', 'both'].includes(item.side)) invalid();
    function view(Type, field, count) {
      if (!Number.isSafeInteger(item[field]) || item[field] < 0 || !Number.isSafeInteger(count) || count < 1) invalid();
      return new Type(data, start + item[field], count);
    }
    const bone = view(Uint8Array, 'bone', 4 * n), weight = view(Uint8Array, 'weight', 4 * n);
    for (let v = 0; v < weight.length; v += 4) {
      if (weight[v] + weight[v + 1] + weight[v + 2] + weight[v + 3] !== 255) invalid();
      for (let k = v; k < v + 4; k++) if (weight[k] && bone[k] >= header.bones.length) invalid();
    }
    const indices = (field, triangles) => {
      if (!Number.isSafeInteger(triangles) || triangles < 1) invalid();
      const values = view(Uint16Array, field, 3 * triangles);
      if (values.some(i => i >= n)) invalid();
      return values;
    };
    item.arrays = {
      rest: Float32Array.from(view(Int16Array, 'position', 3 * n), value => value / 4000),
      bone, weight, tone: view(Uint8Array, 'tendon', n),
      dome: item.dome == null ? null : view(Uint8Array, 'dome', n),
      index: indices('index', item.triangles), sourceVertices: null
    };
    item.softwareIndices = indices('softwareIndex', item.softwareTriangles);
  }
  return { ...header, data, start };
}

// The software rasterizer projects every position, even if no triangle uses
// it. Copy only referenced vertices and preserve the authored index mapping.
function surfaceFor(item, software) {
  if (!software) return item.arrays;
  if (item.compact) return item.compact;
  const sourceVertices = Uint16Array.from(new Set(item.softwareIndices));
  const remap = new Uint16Array(item.n);
  sourceVertices.forEach((source, i) => { remap[source] = i; });
  function compact(values, stride) {
    if (!values) return null;
    const result = new values.constructor(stride * sourceVertices.length);
    sourceVertices.forEach((source, i) => {
      for (let k = 0; k < stride; k++) result[stride * i + k] = values[stride * source + k];
    });
    return result;
  }
  const { rest, bone, weight, tone, dome } = item.arrays;
  item.compact = {
    rest: compact(rest, 3), bone: compact(bone, 4), weight: compact(weight, 4),
    tone: compact(tone, 1), dome: compact(dome, 1),
    index: Uint16Array.from(item.softwareIndices, source => remap[source]), sourceVertices
  };
  return item.compact;
}
function loadFamily(family) {
  if (!cache.has(family)) {
    const url = window.LZAnatomy.asset('muscles/' + family + '.bin');
    // Bypass a previously cached truncated response on the next explicit attempt.
    const promise = fetch(url, retryFamilies.has(family) ? {cache: 'reload'} : undefined).then(async response => {
      if (!response.ok) throw Error('Muscle surfaces unavailable');
      const asset = decodeFamily(await response.arrayBuffer());
      asset.family = family;
      retryFamilies.delete(family);
      return asset;
    }).catch(error => {
      cache.delete(family);
      retryFamilies.add(family);
      throw error;
    });
    cache.set(family, promise);
  }
  return cache.get(family);
}
// Each helper inherits the version of this lens module. A failed import in
// a browser must have a fresh URL on retry; successful imports are shared.
function correctionLoader(file) {
  let pending, attempt = 0;
  return () => {
    if (!pending) {
      const url = new URL(file, import.meta.url);
      url.search = new URL(import.meta.url).search;
      if (attempt) url.searchParams.set('helperRetry', String(attempt));
      pending = import(url.href).catch(error => {
        pending = null;
        attempt++;
        throw error;
      });
    }
    return pending;
  };
}
const loadHipFootModule = correctionLoader('muscle-hip-foot.js');
const loadLimbModule = correctionLoader('muscle-limb-fit.js');

export async function prepare(movement) {
  const list = families[movement];
  const [assets, hipFoot, limb] = await Promise.all([
    Promise.all(list.map(loadFamily)),
    list.includes('gluteal') || list.includes('ankle') ? loadHipFootModule() : null,
    list.includes('thigh') ? loadLimbModule() : null
  ]);
  return context => createLayer(context, movement, assets, hipFoot, limb);
}

function createLayer({ T, scene, pelvis, legs, ribs, scapulae, axial, neck, sternum, floor, floorRing, pressureMarks = [], software, arms, exArms }, movement, assets, hipFoot, limb) {
  const nodes = new Map();
  for (const mesh of pelvis.children) nodes.set(mesh.name.replace('BodyParts3D ', ''), mesh);
  for (const section of [...axial, ...neck]) {
    if (section) nodes.set(section.surface.name.split(' ').pop(), section.surface);
  }
  nodes.set('sternum', sternum);
  for (const leg of legs) {
    const side = leg.side < 0 ? 'R' : 'L';
    for (const bone of ['femur', 'tibia', 'fibula', 'patella']) {
      nodes.set(side + bone, leg.root.getObjectByName('BodyParts3D ' + bone));
    }
    for (const bone of leg.footBones) nodes.set(side + bone.name, bone.children[0]);
  }
  ribs.forEach((rib, i) => nodes.set((i % 2 ? 'L' : 'R') + 'rib' + (1 + (i >> 1)), rib.children[0]));
  for (const blade of scapulae) nodes.set((blade.side < 0 ? 'R' : 'L') + 'scapula', blade.node.children[0]);

  for (const arm of exArms) {
    const side = arm.side < 0 ? 'R' : 'L';
    nodes.set(side + 'humerus', arm.upper.getObjectByName('BodyParts3D humerus'));
    for (const bone of ['radius','ulna']) nodes.set(side + bone, arm.fore.getObjectByName('BodyParts3D ' + bone));
    nodes.set(side + 'clavicle', arms.find(item => item.side === arm.side).clavicle);
  }

  const correctHipFoot = hipFoot?.createHipFootCorrection(T, nodes, assets, software);
  const correctLimb = limb?.createLimbCorrection(T, nodes, assets, software, hipFoot.sampleClearance);
  const faded = new Map();
  const group = new T.Group();
  group.name = 'Muscle lens';
  const muscle = new T.Color(0xa14b41), tendon = new T.Color(0xe0c6a5);
  const material = new T.MeshStandardMaterial({vertexColors: true, roughness: .84, side: T.DoubleSide});
  const parts = [], bindings = [];
  function configureSurface(part) {
    const { rest, bone, weight, tone, dome, index, sourceVertices } = surfaceFor(part.item, software);
    const positions = new T.BufferAttribute(rest.slice(), 3).setUsage(T.DynamicDrawUsage);
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', positions);
    geo.setIndex(new T.BufferAttribute(index, 1));
    const colors = new Float32Array(tone.length * 3);
    const paint = new T.Color();
    for (let i = 0; i < tone.length; i++) paint.copy(muscle).lerp(tendon, tone[i] / 255).toArray(colors, 3 * i);
    geo.setAttribute('color', new T.BufferAttribute(colors, 3));
    if (part.mesh) {
      part.mesh.geometry.dispose();
      part.mesh.geometry = geo;
    } else {
      part.mesh = new T.Mesh(geo, material);
      part.mesh.name = part.side + ' ' + part.name;
      group.add(part.mesh);
    }
    Object.assign(part, { rest, bone, weight, positions, dome, sourceVertices });
  }
  const eligible = new Set(profiles[movement].flat());
  if (movement === 'ribshift' || movement === 'chain') profiles.scapula.flat().forEach(name => eligible.add(name));
  for (const asset of assets) {
    const matrices = asset.bones.map((key, i) => {
      const binding = {node: nodes.get(key), inverse: new T.Matrix4().fromArray(asset.inverseBind[i]), world: new T.Matrix4()};
      if (!binding.node) {
        cache.delete(asset.family);
        retryFamilies.add(asset.family);
        throw Error('Missing muscle attachment ' + key);
      }
      bindings.push(binding);
      return binding.world.elements;
    });
    for (const item of asset.meshes.filter(m => eligible.has(m.name))) {
      const part = { item, name: item.name, side: item.side, matrices };
      configureSurface(part);
      parts.push(part);
    }
  }
  scene.add(group);
  let deep = false, cut = false, selected = null, current = null;
  const ray = new T.Raycaster(), pointer = new T.Vector2(), cameraForward = new T.Vector3();
  function selection() {
    if (!selected) return {key: null, label: 'All muscles in this layer'};
    const side = selected.side === 'R' ? 'Right ' : selected.side === 'L' ? 'Left ' : '';
    const name = muscleNames[selected.name] || selected.name.replace(/([A-Z])/g, ' $1').toLowerCase();
    return {key: selected.mesh.name, label: side + name};
  }
  function update(state) {
    current = state;
    const names = profiles[movement][Number(deep)];
    const chainScapula = (movement === 'ribshift' || movement === 'chain') && state.mode === 'chain';
    const side = state.side === 'right' ? 'R' : 'L';
    for (const part of parts) {
      part.available = (names.includes(part.name) || (chainScapula && profiles.scapula[Number(deep)].includes(part.name)))
        && (movement !== 'foot' || part.side === side);
    }
    if (!selected?.available) selected = null;
    for (const binding of bindings) {
      binding.node.updateWorldMatrix(true, false);
      binding.world.multiplyMatrices(binding.node.matrixWorld, binding.inverse);
    }
    for (const part of parts) {
      part.mesh.visible = part.available && (!selected || selected === part);
      if (!part.mesh.visible) continue;
      const { rest, matrices, bone, weight, positions, dome } = part;
      const out = positions.array;
      for (let i = 0; i < positions.count; i++) {
        const v = 3 * i, x = rest[v], y = rest[v + 1], z = rest[v + 2];
        let px = 0, py = 0, pz = 0;
        for (let k = i * 4; k < i * 4 + 4; k++) {
          const w = weight[k] / 255;
          if (!w) continue;
          const m = matrices[bone[k]];
          px += w * (m[0] * x + m[4] * y + m[8] * z + m[12]);
          py += w * (m[1] * x + m[5] * y + m[9] * z + m[13]);
          pz += w * (m[2] * x + m[6] * y + m[10] * z + m[14]);
        }
        out[v] = px;
        // The apex descends during inspiration while the perimeter follows the lower ribs.
        out[v + 1] = py - (dome ? state.amount * .082 * dome[i] / 255 : 0);
        out[v + 2] = pz;
      }
      correctHipFoot?.(part, software);
      correctLimb?.(part, software);
      positions.needsUpdate = true;
      if (!software) part.mesh.geometry.computeVertexNormals();
      part.mesh.geometry.computeBoundingSphere();
    }
  }
  return {
    update,
    useSoftwareRenderer() {
      if (software) return;
      software = true;
      for (const part of parts) configureSurface(part);
      if (current) update(current);
    },
    depth() { deep = !deep; selected = null; update(current); return deep; },
    cutaway() { cut = !cut; return cut; },
    selection,
    select(key) {
      const next = parts.find(p => p.available && p.mesh.name === key) || null;
      if (selected !== next) {
        selected = next;
        update(current);
      }
    },
    cycle() {
      const choices = parts.filter(p => p.available);
      selected = choices[choices.indexOf(selected) + 1] || null;
      update(current);
      return selection();
    },
    bounds() {
      const box = new T.Box3(), currentBounds = new T.Box3();
      for (const {mesh, positions} of parts) if (mesh.visible) {
        box.union(currentBounds.setFromBufferAttribute(positions));
      }
      return box;
    },
    pick(event, canvas, camera) {
      const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) * 2 / rect.width - 1, 1 - (event.clientY - rect.top) * 2 / rect.height);
      ray.setFromCamera(pointer, camera);
      const forward = ray.ray.direction.dot(camera.getWorldDirection(cameraForward));
      ray.near = camera.near / forward;
      ray.far = camera.far / forward;
      const hit = ray.intersectObjects(parts.filter(p => p.mesh.visible).map(p => p.mesh), false)[0];
      if (!hit) return false;
      // Use the same visible bones and opaque equipment as the rendered frame.
      const occluders = [];
      this.draw(camera, () => {
        scene.traverseVisible(object => {
          if (object.isMesh && object.parent !== group && object.material.visible &&
              (!object.material.transparent || object.material.opacity >= .99)) occluders.push(object);
        });
      });
      ray.far = Math.max(0, hit.distance - .0001);
      if (occluders.some(object => ray.intersectObject(object, false).length)) return false;
      const part = parts.find(p => p.mesh === hit.object);
      selected = selected === part ? null : part;
      update(current);
      return true;
    },
    draw(camera, drawScene) {
      const tilt = movement === 'tilt' || movement === 'chain';
      const localContext = current.mode === 'local' && (tilt || (movement === 'hike' && deep));
      const showPlantarSurface = movement === 'foot' && (cut || camera.position.y < floor.position.y);
      if (!cut && !localContext && !showPlantarSurface) { drawScene(); return; }
      const restore = [];
      function visibility(node, visible) {
        if (node && node.visible !== visible) {
          restore.push([node, 'visible', node.visible]);
          node.visible = visible;
        }
      }
      function fade(mesh) {
        if (!mesh?.isMesh) return;
        // A translucent landmark keeps the hidden structure in context from
        // either renderer. It is used only while drawing the optional lens.
        let faint = faded.get(mesh.material);
        if (!faint) {
          faint = mesh.material.clone();
          faint.transparent = true;
          faint.opacity = .16;
          faint.depthWrite = false;
          faded.set(mesh.material, faint);
        }
        faint.color.copy(mesh.material.color);
        restore.push([mesh, 'material', mesh.material]);
        mesh.material = faint;
      }
      try {
        if (showPlantarSurface) {
          visibility(floor, false);
          visibility(floorRing, false);
          for (const mark of pressureMarks) visibility(mark.node, false);
        }
        if (localContext) {
          const thorax = ribs[0].parent;
          const show = new Set(tilt ? [sternum, ...ribs.slice(8)] : ribs.slice(22));
          visibility(thorax, true);
          for (const child of thorax.children) visibility(child, show.has(child));
          for (const section of axial.slice(0, tilt ? 13 : 6)) visibility(section.node, true);
        }
        if (cut) {
          const side = selected && selected.side !== 'both' ? selected.side : camera.position.x < 0 ? 'R' : 'L';
          if (movement === 'foot') {
            const prefix = current.side === 'right' ? 'R' : 'L';
            for (const key of ['tibia','fibula','Talus','Calcaneus','Cuboid']) fade(nodes.get(prefix + key));
          } else if (['hike','hip','lunge','squat','squat_types','squatcom','bulgarian_split_squat','rdl','deadlift_types'].includes(movement)) {
            if (exercises[movement] || movement === 'lunge') fade(nodes.get(side + 'femur'));
            fade(nodes.get(side === 'R' ? 'rightHip' : 'leftHip'));
          } else {
            for (let i = 1; i <= 12; i++) fade(nodes.get(side + 'rib' + i));
            fade(nodes.get(side + 'scapula'));
            if (exercises[movement]) fade(nodes.get(side + 'humerus'));
          }
        }
        drawScene();
      } finally {
        for (let i = restore.length - 1; i >= 0; i--) {
          const [node, key, original] = restore[i];
          node[key] = original;
        }
      }
    },
    dispose() {
      correctHipFoot?.dispose();
      correctLimb?.dispose?.();
      scene.remove(group);
      parts.forEach(part => part.mesh.geometry.dispose());
      material.dispose();
      for (const faint of faded.values()) faint.dispose();
    }
  };
}
