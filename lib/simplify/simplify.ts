import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { clone as cloneWithSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { MeshoptSimplifier } from "meshoptimizer/simplifier";

/**
 * Mesh decimation (and point-cloud thinning) with meshoptimizer.
 *
 * The simplifier only rewrites the index buffer — every vertex it keeps is an
 * original vertex — so UVs, colours, normals, skin weights and morph targets
 * survive untouched, and textured GLBs stay textured. meshoptimizer also
 * detects UV / normal seams (distinct vertices at the same position) and keeps
 * them closed, so a decimated model doesn't crack along its texture seams.
 *
 * Works on a clone; the source object is never modified. No DOM — runs in Node.
 */

export type SimplifyOptions = {
  /** Fraction of triangles (or points) to keep, 0 < ratio ≤ 1. */
  ratio: number;
  /** Never move vertices on open edges — keeps a mesh's outline exact. */
  lockBorder: boolean;
};

export const DEFAULT_SIMPLIFY: SimplifyOptions = { ratio: 0.5, lockBorder: false };

export type SimplifyReport = {
  trianglesBefore: number;
  trianglesAfter: number;
  pointsBefore: number;
  pointsAfter: number;
  /** Largest geometric deviation introduced, in model units (mm for most print files). */
  maxError: number;
  /** True when some mesh hit a limit (locked border, tiny part) before reaching the target. */
  limited: boolean;
};

export const ready = MeshoptSimplifier.ready;

function positionsOf(geo: THREE.BufferGeometry): Float32Array {
  const attr = geo.getAttribute("position");
  // getX/Y/Z undo interleaving and KHR_mesh_quantization normalisation.
  const out = new Float32Array(attr.count * 3);
  for (let i = 0; i < attr.count; i++) {
    out[i * 3] = attr.getX(i);
    out[i * 3 + 1] = attr.getY(i);
    out[i * 3 + 2] = attr.getZ(i);
  }
  return out;
}

/**
 * meshoptimizer recognises a UV/normal seam only when the split vertices have
 * bit-identical positions. Generated or re-exported meshes often differ by a
 * rounding error (cos(2π) vs cos(0)), and then the seam is treated as a real
 * border and cracks open. Snapping to a grid of 1e-6 × the model size fixes the
 * topology; these snapped positions only steer the simplifier — the output
 * keeps the original vertex data.
 */
function snapPositions(p: Float32Array): Float32Array {
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < p.length; i++) {
    if (p[i] < min) min = p[i];
    if (p[i] > max) max = p[i];
  }
  const step = Math.max(max - min, 1e-12) * 1e-6;
  const out = new Float32Array(p.length);
  for (let i = 0; i < p.length; i++) out[i] = Math.round(p[i] / step) * step;
  return out;
}

/** Copy only the listed vertices (old index per new slot) of every attribute. */
function subsetAttributes(
  geo: THREE.BufferGeometry,
  keep: ArrayLike<number>,
  count: number,
): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  const pick = (attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
    const size = attr.itemSize;
    // Raw stored values (getComponent would denormalize quantized data such as
    // 8-bit colours or 16-bit UVs, which then can't be written back as-is).
    const inter = (attr as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute
      ? (attr as THREE.InterleavedBufferAttribute)
      : null;
    const src = (inter ? inter.data.array : attr.array) as unknown as ArrayLike<number> & {
      constructor: new (n: number) => THREE.TypedArray;
    };
    const stride = inter ? inter.data.stride : size;
    const offset = inter ? inter.offset : 0;
    const arr = new src.constructor(count * size);
    for (let i = 0; i < count; i++) {
      const base = keep[i] * stride + offset;
      for (let k = 0; k < size; k++) arr[i * size + k] = src[base + k];
    }
    return new THREE.BufferAttribute(arr, size, attr.normalized);
  };
  for (const name of Object.keys(geo.attributes)) out.setAttribute(name, pick(geo.attributes[name]));
  const morph = geo.morphAttributes as Record<string, Array<THREE.BufferAttribute | THREE.InterleavedBufferAttribute>>;
  for (const name of Object.keys(morph)) {
    (out.morphAttributes as Record<string, THREE.BufferAttribute[]>)[name] = morph[name].map(pick);
  }
  out.morphTargetsRelative = geo.morphTargetsRelative;
  return out;
}

function triangleCount(geo: THREE.BufferGeometry): number {
  const idx = geo.getIndex();
  return Math.floor((idx ? idx.count : geo.getAttribute("position").count) / 3);
}

/**
 * Decimate one triangle geometry. Returns a new geometry (indexed, compacted)
 * plus the absolute error, or null if there's nothing to do.
 */
export function simplifyGeometry(
  source: THREE.BufferGeometry,
  opts: SimplifyOptions,
): { geometry: THREE.BufferGeometry; error: number; limited: boolean; wasIndexed: boolean } {
  const wasIndexed = source.getIndex() !== null;
  let geo = source;
  if (!wasIndexed) {
    // Triangle soup (STL, most OBJ): face normals would keep every corner
    // distinct, so drop them, weld by position (+uv/colour if present), and
    // recompute after.
    geo = source.clone();
    geo.deleteAttribute("normal");
    geo.deleteAttribute("tangent");
    geo = mergeVertices(geo);
  }

  const index = geo.getIndex()!;
  const indices = new Uint32Array(index.count);
  for (let i = 0; i < index.count; i++) indices[i] = index.getX(i);
  const positions = snapPositions(positionsOf(geo));
  const scale = MeshoptSimplifier.getScale(positions, 3);
  const flags = opts.lockBorder ? (["LockBorder"] as const) : ([] as const);

  // Simplify each material group on its own so group ranges stay valid.
  const groups = geo.groups.length > 1 ? geo.groups : [{ start: 0, count: indices.length, materialIndex: 0 }];
  const parts: Uint32Array[] = [];
  const newGroups: Array<{ start: number; count: number; materialIndex: number }> = [];
  let error = 0;
  let limited = false;
  let offset = 0;
  for (const g of groups) {
    const start = Math.max(0, g.start);
    const end = Math.min(indices.length, g.count === Infinity ? indices.length : start + g.count);
    const slice = indices.slice(start - (start % 3), end - ((end - start) % 3));
    if (slice.length < 3) continue;
    const target = Math.max(3, Math.floor((slice.length * opts.ratio) / 3) * 3);
    let out: Uint32Array = slice;
    let err = 0;
    if (target < slice.length) {
      [out, err] = MeshoptSimplifier.simplify(slice, positions, 3, target, 1, [...flags]);
      if (out.length > target * 1.05 + 3) limited = true;
    }
    error = Math.max(error, err * scale);
    parts.push(out);
    newGroups.push({ start: offset, count: out.length, materialIndex: g.materialIndex ?? 0 });
    offset += out.length;
  }

  const merged = new Uint32Array(offset);
  let o = 0;
  for (const p of parts) {
    merged.set(p, o);
    o += p.length;
  }

  // Drop vertices no triangle uses any more (exporters write every vertex).
  const [remap, unique] = MeshoptSimplifier.compactMesh(merged);
  const keep = new Uint32Array(unique);
  for (let v = 0; v < remap.length; v++) if (remap[v] !== 0xffffffff) keep[remap[v]] = v;
  const result = subsetAttributes(geo, keep, unique);
  result.setIndex(new THREE.BufferAttribute(merged, 1));
  if (geo.groups.length > 1) for (const g of newGroups) result.addGroup(g.start, g.count, g.materialIndex);
  if (!result.getAttribute("normal")) result.computeVertexNormals();
  result.computeBoundingBox();
  result.computeBoundingSphere();
  if (geo !== source) geo.dispose();
  return { geometry: result, error, limited, wasIndexed };
}

/** Thin a point cloud to `ratio` of its points, spatially even, keeping colours. */
export function simplifyPointGeometry(source: THREE.BufferGeometry, ratio: number): THREE.BufferGeometry {
  const count = source.getAttribute("position").count;
  const target = Math.max(1, Math.floor(count * ratio));
  if (target >= count) return source.clone();
  const positions = positionsOf(source);
  const color = source.getAttribute("color");
  let colors: Float32Array | undefined;
  if (color && color.itemSize >= 3) {
    colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = color.getX(i);
      colors[i * 3 + 1] = color.getY(i);
      colors[i * 3 + 2] = color.getZ(i);
    }
  }
  const keep = colors
    ? MeshoptSimplifier.simplifyPoints(positions, 3, target, colors, 3, 1)
    : MeshoptSimplifier.simplifyPoints(positions, 3, target);
  const out = subsetAttributes(source, keep, keep.length);
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

/**
 * Decimate every mesh (and thin every point cloud) in an object. Returns a new
 * object tree with its own geometries and cloned materials (textures shared),
 * so disposing it never touches the source.
 */
export function simplifyObject(
  source: THREE.Object3D,
  opts: SimplifyOptions,
): { object: THREE.Object3D; report: SimplifyReport } {
  // SkeletonUtils.clone rebinds skinned meshes to the cloned bones (plain
  // clone() would leave them pointing at the source skeleton).
  const object = cloneWithSkeleton(source);
  object.animations = source.animations;
  const report: SimplifyReport = {
    trianglesBefore: 0,
    trianglesAfter: 0,
    pointsBefore: 0,
    pointsAfter: 0,
    maxError: 0,
    limited: false,
  };

  object.traverse((node) => {
    // Duck-typed: instanceof breaks when two copies of three are loaded.
    if ((node as THREE.Points).isPoints) {
      const node_ = node as THREE.Points;
      const before = node_.geometry.getAttribute("position")?.count ?? 0;
      node_.geometry = simplifyPointGeometry(node_.geometry, opts.ratio);
      node_.material = Array.isArray(node_.material) ? node_.material.map((m) => m.clone()) : node_.material.clone();
      report.pointsBefore += before;
      report.pointsAfter += node_.geometry.getAttribute("position").count;
      return;
    }
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry.getAttribute("position")) return;
    const before = triangleCount(mesh.geometry);
    const r = simplifyGeometry(mesh.geometry, opts);
    mesh.geometry = r.geometry;
    const cloneMat = (m: THREE.Material) => {
      const c = m.clone();
      // Welded soups get smooth normals; keep the faceted look they had.
      if (!r.wasIndexed && "flatShading" in c) (c as THREE.MeshStandardMaterial).flatShading = true;
      return c;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(cloneMat) : cloneMat(mesh.material);
    report.trianglesBefore += before;
    report.trianglesAfter += triangleCount(r.geometry);
    report.maxError = Math.max(report.maxError, r.error);
    report.limited ||= r.limited;
  });

  return { object, report };
}

/** Binary STL size is exact: 84-byte header + 50 bytes per triangle. */
export function binaryStlBytes(triangles: number): number {
  return 84 + 50 * triangles;
}
