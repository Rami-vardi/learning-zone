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
  tilt: [['rectus', 'oblique', 'erectors'], ['multifidus', 'internalOblique', 'transversus']],
  ribshift: [['rectus', 'oblique', 'erectors'], ['multifidus', 'internalOblique', 'transversus']],
  scapula: [['serratus', 'trapezius'], ['major', 'minor', 'serratus']],
  ribs: [['diaphragm', 'intercostals'], ['internalIntercostals','diaphragm']],
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
  internalOblique: 'internal oblique', internalIntercostals: 'internal intercostals',
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
// Same-side structures to expose when the user peels a particular surface.
const beneath = {
  maximus: ['medius','minimus','piriformis','adductor','semimembranosus'],
  medius: ['minimus','quadratus'], tensor: ['minimus'], tract: ['minimus'],
  rectusFemoris: ['intermedius'], lateralis: ['intermedius'], medialis: ['intermedius'],
  bicepsFemoris: ['semimembranosus','adductor'], semitendinosus: ['semimembranosus','adductor'],
  erectors: ['multifidus'], oblique: ['internalOblique'], internalOblique: ['transversus'],
  rectus: ['transversus'], intercostals: ['internalIntercostals'],
  trapezius: ['major','minor','serratus'], longus: ['posterior'], brevis: ['posterior'],
  anteriorDeltoid: ['supraspinatus','serratus'], middleDeltoid: ['supraspinatus'],
  upperTrap: ['supraspinatus','serratus'], rearDeltoid: ['infraspinatus','teresMajor'],
  tricepsLong: ['tricepsMedial'], tricepsLateral: ['tricepsMedial'],
  sternalPec: ['serratus'], clavicularPec: ['serratus'],
  latissimus: ['infraspinatus','teresMajor','major','minor'], bicepsLong: ['brachialis'], bicepsShort: ['brachialis']
};
const layerBone = {
  scapula:'scapula', press:'scapula', row:'scapula', pullup:'scapula',
  dips:'humerus', bench:'humerus', pushup:'humerus', ribs:'rib6', ribshift:'rib6', chain:'rib6',
  foot:'Talus', rdl:'hip', deadlift_types:'hip', lunge:'hip', hike:'hip', hip:'hip', tilt:'hip',
  squat:'hip', squat_types:'hip', squatcom:'hip', bulgarian_split_squat:'hip'
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
const loadPoseModule = correctionLoader('muscle-pose-correction.js');
const loadDepthModule = correctionLoader('muscle-software-depth.js');

export async function prepare(movement) {
  const list = families[movement];
  const [assets, hipFoot, limb, poseModule, depthModule] = await Promise.all([
    Promise.all(list.map(loadFamily)),
    list.includes('gluteal') || list.includes('ankle') ? loadHipFootModule() : null,
    list.includes('thigh') ? loadLimbModule() : null,
    list.includes('shoulder') || list.includes('thigh') ? loadPoseModule() : null,
    loadDepthModule()
  ]);
  if (poseModule) {
    for (const asset of assets) {
      try {
        poseModule.validatePoseAsset(asset);
      } catch (error) {
        cache.delete(asset.family);
        retryFamilies.add(asset.family);
        throw error;
      }
    }
  }
  return context => createLayer(context, movement, assets, hipFoot, limb, poseModule, depthModule);
}

function createLayer({ T, scene, pelvis, legs, ribs, scapulae, axial, neck, sternum, floor, floorRing, pressureMarks = [], ghost, inspectionSupports = [], software, arms, exArms }, movement, assets, hipFoot, limb, poseModule, depthModule) {
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
  const correctPose = poseModule?.createPoseCorrection(assets, movement, limb?.limbPoseKey);
  const highlightedMaterials = new Map();
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
  const keyed = new Map(parts.map(p => [p.mesh.name,p]));
  const boneKeys = new Map([...nodes].filter(([,n]) => n?.isMesh).map(([key,node]) => [node,key]));
  const ray = new T.Raycaster(), pointer = new T.Vector2(), cameraForward = new T.Vector3();
  const peeled = new Set();
  let deep = false, selected = null, highlighted = null, inspection = [], current = null;
  let chosenBone = null, hiddenBone = null, activeSide = null;
  function keyState() {
    return {peeled:[...peeled],highlight:highlighted?.mesh.name || null,inspection:[...inspection],
      chosenBone,hiddenBone};
  }
  function selection() {
    const item = selected || highlighted || keyed.get(inspection[0]);
    const focused = Boolean(item?.available);
    const side = item?.side === 'R' ? 'Right ' : item?.side === 'L' ? 'Left ' : '';
    const name = item && (muscleNames[item.name] || item.name.replace(/([A-Z])/g,' $1').toLowerCase());
    const label = focused ? side + name : 'Muscle layer';
    return {key:keyState(),focused,label:hiddenBone ? label + ', bone hidden' : label};
  }
  function defaultBone() {
    const partSide = highlighted?.side || keyed.get(inspection[0])?.side;
    const side = partSide === 'L' || ((!partSide || partSide === 'both') && current.side === 'left') ? 'L' : 'R';
    const name = layerBone[movement];
    return name === 'hip' ? (side==='R' ? 'rightHip' : 'leftHip') : side+name;
  }
  // In inspection mode remove only supports between the camera and the tissue.
  // Test the individual pad or rail so the rest of the apparatus stays in context.
  const supportMeshes = [];
  for (const support of inspectionSupports) {
    support.traverse(node => { if (node.isMesh) supportMeshes.push(node); });
  }
  const supportRay = new T.Raycaster(), sample = new T.Vector3(), direction = new T.Vector3();
  const cameraOrigin = new T.Vector3(), supportHits = [];
  function obstructingSupports(camera) {
    const blocked = new Set(), candidates = supportMeshes.filter(mesh => {
      for (let parent = mesh; parent; parent = parent.parent) if (!parent.visible) return false;
      return true;
    });
    if (!candidates.length) return blocked;
    camera.getWorldPosition(cameraOrigin);
    const focused = highlighted ? [highlighted.mesh.name] : inspection;
    for (const part of parts) {
      if (!part.mesh.visible || (focused.length && !focused.includes(part.mesh.name))) continue;
      const step = Math.max(1,Math.floor(part.positions.count / 12));
      for (let i = 0; i < part.positions.count; i += step) {
        sample.fromBufferAttribute(part.positions,i).applyMatrix4(part.mesh.matrixWorld);
        direction.subVectors(sample,cameraOrigin);
        supportRay.far = direction.length() - .001;
        supportRay.set(cameraOrigin,direction.normalize());
        supportHits.length = 0;
        for (const mesh of candidates) {
          if (blocked.has(mesh)) continue;
          mesh.raycast(supportRay,supportHits);
          if (supportHits.length) {
            blocked.add(mesh);
            supportHits.length = 0;
          }
        }
      }
    }
    return blocked;
  }
  function clearPeel() {
    peeled.clear(); highlighted = selected = null; inspection = []; deep = false;
  }
  function reveal(part) {
    if (!part) { clearPeel(); update(current); return true; }
    const next = under(part);
    if (next.length) {
      peeled.add(part.mesh.name);
      inspection = next.map(p => p.mesh.name);
    } else {
      inspection = [part.mesh.name];
    }
    highlighted = selected = null;
    update(current);
    return true;
  }
  function under(part) {
    const names = beneath[part.name] || [];
    return parts.filter(p => p.side === part.side && names.includes(p.name) && p !== part);
  }
  function update(state) {
    if (activeSide !== null && activeSide !== state.side) {
      clearPeel(); chosenBone = hiddenBone = null;
    }
    activeSide = state.side;
    current = state;
    const names = profiles[movement][Number(deep)];
    const chainScapula = (movement === 'ribshift' || movement === 'chain') && state.mode === 'chain';
    const side = state.side === 'right' ? 'R' : 'L';
    const revealed = new Set();
    for (const key of peeled) {
      const source = keyed.get(key);
      if (source) for (const child of under(source)) revealed.add(child);
    }
    for (const part of parts) {
      part.available = (names.includes(part.name) || revealed.has(part) ||
        (chainScapula && profiles.scapula[Number(deep)].includes(part.name))) &&
        !peeled.has(part.mesh.name) && (movement !== 'foot' || part.side === side);
    }
    if (!selected?.available) selected = null;
    if (!highlighted?.available) highlighted = null;
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
      if (!correctPose?.(part, state)) correctLimb?.(part, software);
      positions.needsUpdate = true;
      if (!software) part.mesh.geometry.computeVertexNormals();
      part.mesh.geometry.computeBoundingSphere();
    }
  }
  let depthRenderer = null;
  return {
    update,
    canvasDepth(ctx, width, height) {
      if (!depthRenderer) depthRenderer = depthModule.createDepthRenderer();
      return depthRenderer.begin(ctx,width,height) ? depthRenderer : null;
    },
    useSoftwareRenderer() {
      if (software) return;
      software = true;
      for (const part of parts) configureSurface(part);
      if (current) update(current);
    },
    // The full-depth view is also used for release geometry checks.
    depth() { const next = !deep; clearPeel(); deep = next; update(current); return deep; },
    cutaway() {
      hiddenBone = hiddenBone ? null : (chosenBone || defaultBone());
      return Boolean(hiddenBone);
    },
    selection,
    select(key) {
      if (typeof key === 'string' || key === null) {
        selected = keyed.get(key) || null;
      } else if (key) {
        clearPeel();
        for (const name of key.peeled) if (keyed.has(name)) peeled.add(name);
        inspection = key.inspection.filter(name => keyed.has(name));
        highlighted = keyed.get(key.highlight) || null;
        chosenBone = nodes.has(key.chosenBone) ? key.chosenBone : null;
        hiddenBone = nodes.has(key.hiddenBone) ? key.hiddenBone : null;
      }
      update(current);
    },
    cycle() {
      const choices = parts.filter(p => p.available);
      selected = choices[choices.indexOf(selected) + 1] || null;
      update(current);
      return selection();
    },
    bounds(focusTarget = false) {
      const box = new T.Box3(), currentBounds = new T.Box3();
      const targets = highlighted ? [highlighted.mesh.name] : inspection;
      for (const p of parts) {
        if (p.mesh.visible && (!focusTarget || !targets.length || targets.includes(p.mesh.name))) {
          box.union(currentBounds.setFromBufferAttribute(p.positions));
        }
      }
      return box;
    },
    keyboard(key) {
      if (key === 'Escape') return reveal(null);
      const choices = parts.filter(p => p.mesh.visible);
      if (!choices.length) return false;
      if (key === ' ' || key === 'Enter') return reveal(highlighted || choices[0]);
      if (!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(key)) return false;
      const forward = key==='ArrowRight' || key==='ArrowDown';
      const start = highlighted ? choices.indexOf(highlighted) : (forward ? -1 : 0);
      highlighted = choices[(start + (forward ? 1 : -1) + choices.length) % choices.length];
      inspection = [];
      return true;
    },
    pick(event, canvas, camera) {
      const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) * 2 / rect.width - 1, 1 - (event.clientY - rect.top) * 2 / rect.height);
      ray.setFromCamera(pointer, camera);
      const forward = ray.ray.direction.dot(camera.getWorldDirection(cameraForward));
      ray.near = camera.near / forward;
      ray.far = camera.far / forward;
      const hit = ray.intersectObjects(parts.filter(p => p.mesh.visible).map(p => p.mesh), false)[0];
      const occluders = [];
      this.draw(camera, () => {
        scene.traverseVisible(object => {
          if (object.isMesh && object.parent !== group && object.material.visible &&
              (!object.material.transparent || object.material.opacity >= .99)) occluders.push(object);
        });
      });
      ray.far = hit ? Math.max(0,hit.distance - .0001) : ray.far;
      const front = ray.intersectObjects(occluders,false)[0];
      if (front && boneKeys.has(front.object)) {
        if (!hiddenBone) chosenBone = boneKeys.get(front.object);
        return true;
      }
      if (!hit || front) return reveal(null);
      return reveal(keyed.get(hit.object.name));
    },
    draw(camera, drawScene) {
      const tilt = movement === 'tilt' || movement === 'chain';
      const localContext = current.mode === 'local' && (tilt || (movement === 'hike' && (deep || peeled.size)));
      const showPlantarSurface = movement === 'foot' && (hiddenBone || camera.position.y < floor.position.y);
      if (!hiddenBone && !localContext && !showPlantarSurface && !highlighted) { drawScene(); return; }
      const restore = [];
      function visibility(node, visible) {
        if (node && node.visible !== visible) {
          restore.push([node, 'visible', node.visible]);
          node.visible = visible;
        }
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
        if (hiddenBone) {
          const node = nodes.get(hiddenBone);
          visibility(node,false);
          for (const line of ghost?.children || []) {
            if (line.userData.lensSource === node) visibility(line,false);
          }
          if (['press','row','bench'].includes(movement)) {
            for (const mesh of obstructingSupports(camera)) visibility(mesh,false);
          }
        }
        if (highlighted?.mesh.visible) {
          const mesh = highlighted.mesh, original = mesh.material;
          let highlight = highlightedMaterials.get(original);
          if (!highlight) {
            highlight = original.clone();
            highlight.onBeforeCompile = original.onBeforeCompile;
            highlight.customProgramCacheKey = original.customProgramCacheKey.bind(original);
            highlight.color.setHex(0xffcb8f);
            highlight.emissive.setHex(0x532b06);
            highlightedMaterials.set(original,highlight);
          }
          restore.push([mesh,'material',original]);
          mesh.material = highlight;
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
      for (const highlight of highlightedMaterials.values()) highlight.dispose();
    }
  };
}
