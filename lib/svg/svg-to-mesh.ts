import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Extrude an SVG's filled paths into a printable 3D solid.
 *
 * 100% client-side: SVGLoader parses the markup (needs `DOMParser`, so this only
 * runs in the browser), each filled path becomes one or more THREE.Shape, and we
 * extrude them along +Z. The result is centred in XY and rests on z = 0, so it
 * drops straight onto a print bed.
 *
 * Holes (e.g. the middle of an "O", or letters with counters) are handled by
 * SVGLoader.createShapes, which reads the fill rule and nests holes correctly.
 * Stroke-only / outlined SVGs have no fill area to extrude — we surface a clear
 * error rather than emitting an empty mesh.
 */

export type SvgExtrudeOptions = {
  /** Physical width (X extent) of the model, in millimetres. Y follows aspect. */
  widthMM: number;
  /** Extrude thickness along Z, in millimetres. */
  depthMM: number;
  /** Optional flat base plate under the art, in mm (0 = off). Keeps detached
   *  pieces of a multi-part SVG joined into one printable body. */
  baseMM: number;
};

export const DEFAULTS: SvgExtrudeOptions = {
  widthMM: 60,
  depthMM: 4,
  baseMM: 0,
};

export const WIDTH_MIN = 10;
export const WIDTH_MAX = 300;
export const DEPTH_MIN = 0.4;
export const DEPTH_MAX = 50;
export const BASE_MAX = 10;

const BRAND_BLUE = 0x3b82f6;

export type SvgMeshResult = {
  mesh: THREE.Mesh;
  triangles: number;
  /** Physical size of the model in mm: [x, y, z]. */
  sizeMM: [number, number, number];
  /** Number of filled shapes extruded (informational, shown in the UI). */
  shapeCount: number;
};

/** Signed volume of a non-indexed triangle soup; negative ⇒ inward-facing. */
function signedVolume(geo: THREE.BufferGeometry): number {
  const p = geo.attributes.position as THREE.BufferAttribute;
  let v = 0;
  for (let i = 0; i < p.count; i += 3) {
    const ax = p.getX(i), ay = p.getY(i), az = p.getZ(i);
    const bx = p.getX(i + 1), by = p.getY(i + 1), bz = p.getZ(i + 1);
    const cx = p.getX(i + 2), cy = p.getY(i + 2), cz = p.getZ(i + 2);
    const crx = by * cz - bz * cy;
    const cry = bz * cx - bx * cz;
    const crz = bx * cy - by * cx;
    v += ax * crx + ay * cry + az * crz;
  }
  return v / 6;
}

/** Flip triangle winding in place (swap v1/v2 of every face) on a non-indexed geo. */
function reverseWinding(geo: THREE.BufferGeometry): void {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const arr = p.array as Float32Array;
  for (let i = 0; i < p.count; i += 3) {
    const o1 = (i + 1) * 3;
    const o2 = (i + 2) * 3;
    for (let k = 0; k < 3; k++) {
      const tmp = arr[o1 + k];
      arr[o1 + k] = arr[o2 + k];
      arr[o2 + k] = tmp;
    }
  }
  p.needsUpdate = true;
}

export function svgToMesh(svgText: string, opts: SvgExtrudeOptions): SvgMeshResult {
  const data = new SVGLoader().parse(svgText);

  const shapes: THREE.Shape[] = [];
  for (const path of data.paths) {
    for (const shape of SVGLoader.createShapes(path)) shapes.push(shape);
  }
  if (shapes.length === 0) {
    throw new Error(
      "No filled shapes found. Outline / stroke-only SVGs aren't supported yet — give the paths a fill.",
    );
  }

  // Extrude with unit depth, then scale Z to the requested thickness. This keeps
  // the depth exact no matter how large the SVG's own coordinate space is.
  const parts = shapes.map(
    (shape) =>
      new THREE.ExtrudeGeometry(shape, {
        depth: 1,
        bevelEnabled: false,
        steps: 1,
      }),
  );
  let geo = parts.length === 1 ? parts[0] : (mergeGeometries(parts, false) as THREE.BufferGeometry);
  if (!geo) throw new Error("Could not build geometry from the SVG paths.");

  // SVG's Y axis points down; flip it so the art is upright in a Y-up world.
  geo.scale(1, -1, 1);

  // Scale the XY footprint to the requested width (aspect preserved) and Z to depth.
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const sizeX = Math.max(1e-6, bb.max.x - bb.min.x);
  const xy = opts.widthMM / sizeX;
  geo.scale(xy, xy, opts.depthMM);

  // The Y-flip reversed winding -> normals point inward. Restore outward winding.
  if (signedVolume(geo) < 0) reverseWinding(geo);

  let merged: THREE.BufferGeometry = geo;
  if (opts.baseMM > 0) {
    geo.computeBoundingBox();
    const b = geo.boundingBox!;
    const w = b.max.x - b.min.x;
    const h = b.max.y - b.min.y;
    const base = new THREE.BoxGeometry(w, h, opts.baseMM).toNonIndexed();
    base.translate(
      (b.max.x + b.min.x) / 2,
      (b.max.y + b.min.y) / 2,
      b.min.z - opts.baseMM / 2,
    );
    // Art sits on top of the base; slicers union the overlapping bodies.
    merged = (mergeGeometries([geo, base], false) as THREE.BufferGeometry) ?? geo;
  }

  // Centre XY at origin and rest the bottom on z = 0 (print-bed ready).
  merged.computeBoundingBox();
  const fb = merged.boundingBox!;
  merged.translate(
    -(fb.max.x + fb.min.x) / 2,
    -(fb.max.y + fb.min.y) / 2,
    -fb.min.z,
  );
  merged.computeVertexNormals();

  merged.computeBoundingBox();
  const size = new THREE.Vector3();
  merged.boundingBox!.getSize(size);

  const mat = new THREE.MeshStandardMaterial({
    color: BRAND_BLUE,
    metalness: 0.05,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(merged, mat);

  const triangles = merged.attributes.position.count / 3;

  return {
    mesh,
    triangles: Math.round(triangles),
    sizeMM: [size.x, size.y, size.z],
    shapeCount: shapes.length,
  };
}

/** A small filled-star sample so "Try a sample" works with no file handy. */
export const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path fill="#3b82f6" d="M50 4 L61 38 L97 38 L68 59 L79 94 L50 72 L21 94 L32 59 L3 38 L39 38 Z"/>
</svg>`;
