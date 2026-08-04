/**
 * DXF → 3D mesh.
 *
 * Two paths, picked from what the drawing actually contains:
 *  - 3DFACE entities → the faceted mesh is already 3D, so it's rebuilt as-is.
 *  - 2D line work → the closed loops are extruded to a thickness you choose.
 *
 * Extrusion is the only honest way to get a solid out of a 2D drawing: we're
 * giving a flat outline a thickness, not reconstructing a 3D part that was
 * never in the file. Loops that don't close can't bound a solid, so they're
 * counted and reported instead of being turned into a broken model.
 */

import * as THREE from "three";
import { dxfToLoops, type DxfDocument } from "./parse";
import type { Point2 } from "./write";

const BRAND_BLUE = 0x3b82f6;

export type DxfExtrudeOptions = {
  /** Extrude thickness along Z, in millimetres. */
  depthMM: number;
  /**
   * "original" treats the drawing's own units as millimetres (what most CAD
   * exports mean); "width" rescales the whole drawing to `widthMM` across X.
   */
  scaleMode: "original" | "width";
  /** Target X extent in mm when scaleMode is "width". */
  widthMM: number;
};

export const DEFAULT_DXF_EXTRUDE: DxfExtrudeOptions = {
  depthMM: 3,
  scaleMode: "original",
  widthMM: 100,
};

export const DEPTH_MIN = 0.2;
export const DEPTH_MAX = 100;
export const WIDTH_MIN = 5;
export const WIDTH_MAX = 1000;

export type DxfMeshResult = {
  mesh: THREE.Mesh;
  triangles: number;
  sizeMM: [number, number, number];
  /** How the model was built — extruded outline vs. an existing 3D mesh. */
  mode: "extruded" | "faces";
  /** Closed loops that became solid outlines (extruded mode). */
  loopCount: number;
  /** Loops nested inside another and cut out as holes. */
  holeCount: number;
  /** Line chains that never closed and so couldn't be extruded. */
  openChains: number;
};

function areaOf(pts: Point2[]): number {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function pointInPolygon(pt: Point2, poly: Point2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] &&
        pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Signed volume of a non-indexed triangle soup; negative ⇒ inward-facing. */
function signedVolume(geo: THREE.BufferGeometry): number {
  const p = geo.attributes.position as THREE.BufferAttribute;
  let v = 0;
  for (let i = 0; i < p.count; i += 3) {
    const ax = p.getX(i), ay = p.getY(i), az = p.getZ(i);
    const bx = p.getX(i + 1), by = p.getY(i + 1), bz = p.getZ(i + 1);
    const cx = p.getX(i + 2), cy = p.getY(i + 2), cz = p.getZ(i + 2);
    v += ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);
  }
  return v / 6;
}

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

function finish(
  geo: THREE.BufferGeometry,
  extra: Omit<DxfMeshResult, "mesh" | "triangles" | "sizeMM">,
): DxfMeshResult {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -bb.min.z);
  geo.computeVertexNormals();
  geo.computeBoundingBox();

  const size = new THREE.Vector3();
  geo.boundingBox!.getSize(size);

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: BRAND_BLUE,
      metalness: 0.05,
      roughness: 0.75,
      side: THREE.DoubleSide,
    }),
  );

  return {
    mesh,
    triangles: Math.round(geo.attributes.position.count / 3),
    sizeMM: [size.x, size.y, size.z],
    ...extra,
  };
}

export function dxfToMesh(
  doc: DxfDocument,
  opts: DxfExtrudeOptions,
): DxfMeshResult {
  // --- Path 1: the drawing already holds a 3D faceted mesh ------------------
  if (doc.faces.length > 0) {
    const positions = new Float32Array(doc.faces.length * 9);
    let o = 0;
    for (const tri of doc.faces) {
      for (const v of tri) {
        positions[o++] = v[0];
        positions[o++] = v[1];
        positions[o++] = v[2];
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    if (opts.scaleMode === "width") {
      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      const w = Math.max(1e-9, bb.max.x - bb.min.x);
      const s = opts.widthMM / w;
      geo.scale(s, s, s);
    }
    return finish(geo, {
      mode: "faces",
      loopCount: 0,
      holeCount: 0,
      openChains: 0,
    });
  }

  // --- Path 2: extrude the 2D outline --------------------------------------
  const { loops, openChains } = dxfToLoops(doc);
  if (loops.length === 0) {
    throw new Error(
      openChains.length > 0
        ? `Found ${openChains.length} open line chain${openChains.length === 1 ? "" : "s"} but no closed outline. A solid needs closed shapes — check the drawing for gaps between line ends.`
        : "No closed shapes found in this DXF, so there's nothing to extrude.",
    );
  }

  // Nesting: a loop inside an odd number of other loops is a hole.
  const depths = loops.map((loop) =>
    loops.reduce(
      (d, other) => (other !== loop && pointInPolygon(loop[0], other) ? d + 1 : d),
      0,
    ),
  );

  const outers: number[] = [];
  const holes: number[] = [];
  depths.forEach((d, i) => (d % 2 === 0 ? outers : holes).push(i));

  const shapes: THREE.Shape[] = [];
  for (const oi of outers) {
    const pts = loops[oi];
    const ccw = areaOf(pts) > 0 ? pts : pts.slice().reverse();
    const shape = new THREE.Shape(ccw.map(([x, y]) => new THREE.Vector2(x, y)));

    for (const hi of holes) {
      if (depths[hi] !== depths[oi] + 1) continue;
      const h = loops[hi];
      if (!pointInPolygon(h[0], pts)) continue;
      // Pick the tightest enclosing outer so a hole isn't cut from a parent
      // that merely contains the shape it really belongs to.
      let tightest = oi;
      for (const other of outers) {
        if (depths[other] !== depths[oi]) continue;
        if (!pointInPolygon(h[0], loops[other])) continue;
        if (Math.abs(areaOf(loops[other])) < Math.abs(areaOf(loops[tightest]))) {
          tightest = other;
        }
      }
      if (tightest !== oi) continue;

      const cw = areaOf(h) < 0 ? h : h.slice().reverse();
      shape.holes.push(new THREE.Path(cw.map(([x, y]) => new THREE.Vector2(x, y))));
    }
    shapes.push(shape);
  }

  const parts = shapes.map(
    (s) => new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, steps: 1 }),
  );
  let geo: THREE.BufferGeometry;
  if (parts.length === 1) {
    geo = parts[0];
  } else {
    const merged = new THREE.BufferGeometry();
    const total = parts.reduce((n, g) => n + g.attributes.position.count, 0);
    const arr = new Float32Array(total * 3);
    let off = 0;
    for (const g of parts) {
      const src = g.toNonIndexed().attributes.position.array as ArrayLike<number>;
      arr.set(src as Float32Array, off);
      off += src.length;
    }
    merged.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    geo = merged;
  }

  // Extrude with unit depth, then scale Z, so thickness is exact regardless of
  // the drawing's own coordinate scale.
  let xy = 1;
  if (opts.scaleMode === "width") {
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    xy = opts.widthMM / Math.max(1e-9, bb.max.x - bb.min.x);
  }
  geo.scale(xy, xy, opts.depthMM);

  if (signedVolume(geo) < 0) reverseWinding(geo);

  return finish(geo, {
    mode: "extruded",
    loopCount: outers.length,
    holeCount: shapes.reduce((n, s) => n + s.holes.length, 0),
    openChains: openChains.length,
  });
}
