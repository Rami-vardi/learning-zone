// Each family contains fitted rest surfaces, four bone influences per vertex,
// and inverse bind matrices from Johnny's neutral pose. No writes to the rig.
const families = {
  hike: ['gluteal'], lunge: ['gluteal'], hip: ['gluteal'], tilt: ['trunk'],
  ribshift: ['trunk', 'scapular'], scapula: ['scapular'],
  ribs: ['breathing'], foot: ['ankle']
};
const profiles = {
  hike: [['medius'], ['minimus', 'quadratus']],
  lunge: [['maximus', 'medius'], ['minimus', 'quadratus']],
  hip: [['maximus', 'medius', 'tensor', 'tract'], ['minimus', 'piriformis']],
  tilt: [['rectus', 'oblique', 'erectors'], ['multifidus', 'transversus']],
  ribshift: [['rectus', 'oblique', 'erectors'], ['multifidus', 'transversus']],
  scapula: [['serratus', 'trapezius'], ['major', 'minor', 'serratus']],
  ribs: [['diaphragm', 'intercostals'], ['diaphragm']],
  foot: [['longus', 'brevis'], ['posterior']]
};
const cache = new Map();
function loadFamily(family) {
  if (!cache.has(family)) {
    const url = window.LZAnatomy.asset('muscles/' + family + '.bin');
    const promise = fetch(url).then(async response => {
      if (!response.ok) throw Error('Muscle surfaces unavailable');
      const data = await response.arrayBuffer();
      const length = new DataView(data).getUint32(0, true);
      const header = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 4, length)));
      return { ...header, data, start: 4 + length };
    }).catch(error => { cache.delete(family); throw error; });
    cache.set(family, promise);
  }
  return cache.get(family);
}
export async function prepare(movement) {
  const assets = await Promise.all(families[movement].map(loadFamily));
  return context => createLayer(context, movement, assets);
}

function createLayer({ T, scene, pelvis, legs, ribs, scapulae, axial, neck, sternum, floor, software }, movement, assets) {
  const nodes = new Map();
  for (const mesh of pelvis.children) nodes.set(mesh.name.replace('BodyParts3D ', ''), mesh);
  for (const section of [...axial, ...neck]) {
    if (section) nodes.set(section.surface.name.split(' ').pop(), section.surface);
  }
  nodes.set('sternum', sternum);
  for (const leg of legs) {
    const side = leg.side < 0 ? 'R' : 'L';
    for (const bone of ['femur', 'tibia', 'fibula']) {
      nodes.set(side + bone, leg.root.getObjectByName('BodyParts3D ' + bone));
    }
    for (const bone of leg.footBones) nodes.set(side + bone.name, bone.children[0]);
  }
  ribs.forEach((rib, i) => nodes.set((i % 2 ? 'L' : 'R') + 'rib' + (1 + (i >> 1)), rib.children[0]));
  for (const blade of scapulae) nodes.set((blade.side < 0 ? 'R' : 'L') + 'scapula', blade.node.children[0]);

  const faded = new Map();
  const group = new T.Group();
  group.name = 'Muscle lens';
  const muscle = new T.Color(0xa14b41), tendon = new T.Color(0xe0c6a5);
  const material = new T.MeshStandardMaterial({vertexColors: true, roughness: .84, side: T.DoubleSide});
  const parts = [], bindings = [];
  const eligible = new Set(profiles[movement].flat());
  if (movement === 'ribshift') profiles.scapula.flat().forEach(name => eligible.add(name));
  for (const asset of assets) {
    const matrices = asset.bones.map((key, i) => {
      const binding = {node: nodes.get(key), inverse: new T.Matrix4().fromArray(asset.inverseBind[i]), world: new T.Matrix4()};
      if (!binding.node) throw Error('Missing muscle attachment ' + key);
      bindings.push(binding);
      return binding.world.elements;
    });
    for (const item of asset.meshes.filter(m => eligible.has(m.name))) {
      const array = (Type, key, length) => new Type(asset.data, asset.start + item[key], length);
      const n = item.n;
      const rest = Float32Array.from(array(Int16Array, 'position', n * 3), value => value / 4000);
      const positions = new T.BufferAttribute(rest.slice(), 3).setUsage(T.DynamicDrawUsage);
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', positions);
      const index = software ? 'softwareIndex' : 'index';
      const triangles = software ? item.softwareTriangles : item.triangles;
      geo.setIndex(new T.BufferAttribute(array(Uint16Array, index, triangles * 3), 1));
      const tone = array(Uint8Array, 'tendon', n), colors = new Float32Array(n * 3);
      const paint = new T.Color();
      for (let i = 0; i < n; i++) paint.copy(muscle).lerp(tendon, tone[i] / 255).toArray(colors, 3 * i);
      geo.setAttribute('color', new T.BufferAttribute(colors, 3));
      const mesh = new T.Mesh(geo, material);
      mesh.name = item.side + ' ' + item.name;
      group.add(mesh);
      parts.push({ mesh, name: item.name, side: item.side, rest, positions, matrices,
        bone: array(Uint8Array, 'bone', n * 4), weight: array(Uint8Array, 'weight', n * 4),
        dome: item.dome === null ? null : array(Uint8Array, 'dome', n) });
    }
  }
  scene.add(group);
  let deep = false, cut = false, selected = null, current = null;
  const ray = new T.Raycaster(), pointer = new T.Vector2();
  function update(state) {
    current = state;
    const names = profiles[movement][Number(deep)];
    const chainScapula = movement === 'ribshift' && state.mode === 'chain';
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
      positions.needsUpdate = true;
      if (!software) part.mesh.geometry.computeVertexNormals();
      part.mesh.geometry.computeBoundingSphere();
    }
  }
  return {
    update,
    depth() { deep = !deep; selected = null; update(current); return deep; },
    cutaway() { cut = !cut; return cut; },
    cycle() {
      const choices = parts.filter(p => p.available);
      selected = choices[choices.indexOf(selected) + 1] || null;
      update(current);
    },
    bounds() {
      const box = new T.Box3();
      for (const {mesh} of parts) if (mesh.visible) {
        mesh.geometry.computeBoundingBox();
        box.union(mesh.geometry.boundingBox);
      }
      return box;
    },
    pick(event, canvas, camera) {
      const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) * 2 / rect.width - 1, 1 - (event.clientY - rect.top) * 2 / rect.height);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(parts.filter(p => p.mesh.visible).map(p => p.mesh), false)[0];
      if (!hit) return false;
      const part = parts.find(p => p.mesh === hit.object);
      selected = selected === part ? null : part;
      update(current);
      return true;
    },
    draw(camera, drawScene) {
      const localContext = current.mode === 'local' && (movement === 'tilt' || (movement === 'hike' && deep));
      if (!cut && !localContext) { drawScene(); return; }
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
        if (localContext) {
          const tilt = movement === 'tilt';
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
            visibility(floor, false);
            for (const key of ['tibia','fibula','Talus','Calcaneus','Cuboid']) fade(nodes.get(prefix + key));
          } else if (['hike','hip','lunge'].includes(movement)) {
            fade(nodes.get(side === 'R' ? 'rightHip' : 'leftHip'));
          } else {
            for (let i = 1; i <= 12; i++) fade(nodes.get(side + 'rib' + i));
            fade(nodes.get(side + 'scapula'));
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
      scene.remove(group);
      parts.forEach(part => part.mesh.geometry.dispose());
      material.dispose();
      for (const faint of faded.values()) faint.dispose();
    }
  };
}
