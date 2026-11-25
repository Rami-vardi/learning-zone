// The fitted offsets are differences from this lesson's skinned surface, sampled
// in the same model coordinates as the bone matrices. Camera rotation is separate.
const decodedAssets = new WeakMap();

// Tracks with many neighboring phase samples store a standard LZ4 block of
// signed-byte differences. The first frame is absolute.
function decodeDifferences(source, size, stride) {
  const result = new Int8Array(size);
  let read = 0, written = 0;
  function length(n) {
    if (n < 15) return n;
    let next;
    do {
      if (read >= source.length) throw new Error('Incomplete muscle pose length');
      next = source[read++];
      n += next;
    } while (next === 255);
    return n;
  }
  while (read < source.length) {
    const token = source[read++], literals = length(token >> 4);
    if (read + literals > source.length || written + literals > size) throw new Error('Invalid muscle pose literal');
    result.set(source.subarray(read, read + literals), written);
    read += literals;
    written += literals;
    if (read === source.length) break;
    if (read + 2 > source.length) throw new Error('Incomplete muscle pose match');
    const offset = source[read] + (source[read + 1] << 8);
    read += 2;
    const match = length(token & 15) + 4;
    if (offset === 0 || offset > written || written + match > size) throw new Error('Invalid muscle pose match');
    for (let i = 0; i < match; i++, written++) result[written] = result[written - offset];
  }
  if (written !== size) throw new Error('Incomplete muscle pose samples');
  for (let i = stride; i < size; i++) result[i] += result[i - stride];
  return result;
}

function decodeTracks(asset) {
  if (decodedAssets.has(asset)) return decodedAssets.get(asset);
  const tracks = new Map();
  for (const mesh of asset.meshes) {
    if (mesh.poseTracks === undefined) continue;
    if (!mesh.poseTracks || typeof mesh.poseTracks !== 'object' || Array.isArray(mesh.poseTracks)) {
      throw new Error('Invalid muscle pose tracks');
    }
    const poses = new Map();
    for (const [key, track] of Object.entries(mesh.poseTracks)) {
      if (!key || !track || !Number.isSafeInteger(track.count) || track.count < 1 || track.count > mesh.n ||
          !Number.isSafeInteger(track.frames) || track.frames < 2 || track.frames > 257 || !Number.isFinite(track.unit) || track.unit <= 0) {
        throw new Error('Invalid muscle pose samples');
      }
      const size = track.count * track.frames * 3;
      function view(Type, offset, count) {
        const start = asset.start + offset, end = start + count * Type.BYTES_PER_ELEMENT;
        if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(start) ||
            start % Type.BYTES_PER_ELEMENT || !Number.isSafeInteger(end) || end > asset.data.byteLength) {
          throw new Error('Invalid muscle pose data range');
        }
        return new Type(asset.data, start, count);
      }
      const vertices = view(Uint16Array, track.vertices, track.count);
      for (let i = 0; i < vertices.length; i++) {
        if (vertices[i] >= mesh.n || (i && vertices[i] <= vertices[i - 1])) throw new Error('Invalid muscle pose vertex');
      }
      if (!Number.isSafeInteger(size) || size > 32 * 1024 * 1024) throw new Error('Oversized muscle pose track');
      if (track.codec !== undefined && track.codec !== 'lz4-delta') throw new Error('Unknown muscle pose encoding');
      const values = track.codec === undefined ? view(Int8Array, track.values, size) :
        decodeDifferences(view(Uint8Array, track.values, track.bytes), size, track.count * 3);
      poses.set(key, {vertices, values, frames: track.frames,
        unit: track.unit, compact: new WeakMap()});
    }
    tracks.set(mesh, poses);
  }
  decodedAssets.set(asset, tracks);
  return tracks;
}

export function validatePoseAsset(asset) {
  decodeTracks(asset);
}

function compactVertices(track, source, vertexCount) {
  if (track.compact.has(source)) return track.compact.get(source);
  const lookup = new Int32Array(vertexCount).fill(-1), draw = [], packed = [];
  source.forEach((vertex, i) => { lookup[vertex] = i; });
  track.vertices.forEach((vertex, i) => {
    if (lookup[vertex] >= 0) { draw.push(lookup[vertex]); packed.push(i); }
  });
  const result = {draw: Uint16Array.from(draw), packed: Uint16Array.from(packed)};
  track.compact.set(source, result);
  return result;
}

export function createPoseCorrection(assets, lesson, trackKey = (state, movement) => movement + ':' + (state.scenario || 'a')) {
  const parts = new Map();
  for (const asset of assets) for (const [mesh, tracks] of decodeTracks(asset)) parts.set(mesh, tracks);
  return function correct(part, state) {
    const track = parts.get(part.item)?.get(trackKey(state, lesson));
    if (!track) return false;
    const t = Math.min(1, Math.max(0, state.amount)) * (track.frames - 1);
    const lo = Math.floor(t), hi = Math.min(track.frames - 1, lo + 1);
    const stride = track.vertices.length * 3, a = lo * stride, b = hi * stride;
    const wa = (1 - (t - lo)) * track.unit, wb = (t - lo) * track.unit;
    const map = part.sourceVertices && compactVertices(track, part.sourceVertices, part.item.n);
    const vertices = map ? map.draw : track.vertices, out = part.positions.array;
    for (let i = 0; i < vertices.length; i++) {
      const k = 3 * vertices[i], j = 3 * (map ? map.packed[i] : i);
      for (let axis = 0; axis < 3; axis++) out[k + axis] += wa * track.values[a + j + axis] + wb * track.values[b + j + axis];
    }
    return true;
  };
}
