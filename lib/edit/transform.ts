import * as THREE from "three";

// Pure geometry transforms for the STL editor. No DOM / three loaders here, so
// this whole module runs under Node for tests. All operations bake into a fresh
// BufferGeometry (nothing mutates the base), which keeps export trivial — the
// STL/OBJ/etc exporters just read the geometry that's already in world space.

export const MM_PER_INCH = 25.4;

export type Vec3 = { x: number; y: number; z: number };

export type TransformOptions = {
  /** Uniform scale multiplier applied to every axis (no distortion). */
  scale: number;
  /** Rotation in degrees, applied in XYZ order, before scale. */
  rotationDeg: Vec3;
  /** Drop the model so its lowest point sits on z = 0 (the print bed). */
  dropToFloor: boolean;
};

export const DEFAULT_TRANSFORM: TransformOptions = {
  scale: 1,
  rotationDeg: { x: 0, y: 0, z: 0 },
  dropToFloor: true,
};

/** Axis-aligned bounding-box size of a geometry. */
export function sizeOf(geo: THREE.BufferGeometry): Vec3 {
  geo.computeBoundingBox();
  const b = geo.boundingBox!;
  return { x: b.max.x - b.min.x, y: b.max.y - b.min.y, z: b.max.z - b.min.z };
}

export function longestAxis(size: Vec3): number {
  return Math.max(size.x, size.y, size.z);
}

/**
 * Scale factor needed to make the longest axis equal `targetMM`, given the
 * model's *current* (untransformed) size. Returns 1 when the model is empty.
 */
export function scaleForLongestAxis(baseSize: Vec3, targetMM: number): number {
  const longest = longestAxis(baseSize);
  if (longest <= 0 || !Number.isFinite(targetMM) || targetMM <= 0) return 1;
  return targetMM / longest;
}

/**
 * Apply rotation (XYZ degrees) then a uniform scale, baking the result into a
 * new geometry. Optionally drops the model onto z = 0. Vertex normals are
 * recomputed so the export and preview shade correctly.
 */
export function applyTransform(
  base: THREE.BufferGeometry,
  opts: TransformOptions,
): THREE.BufferGeometry {
  const geo = base.clone();

  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(opts.rotationDeg.x),
    THREE.MathUtils.degToRad(opts.rotationDeg.y),
    THREE.MathUtils.degToRad(opts.rotationDeg.z),
    "XYZ",
  );
  const matrix = new THREE.Matrix4().makeRotationFromEuler(euler);
  const s = Number.isFinite(opts.scale) && opts.scale > 0 ? opts.scale : 1;
  matrix.premultiply(new THREE.Matrix4().makeScale(s, s, s));
  geo.applyMatrix4(matrix);

  if (opts.dropToFloor) {
    geo.computeBoundingBox();
    const minZ = geo.boundingBox!.min.z;
    if (minZ !== 0) geo.translate(0, 0, -minZ);
  }

  geo.computeVertexNormals();
  return geo;
}
