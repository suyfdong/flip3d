/**
 * Mesh → 2D cross-section, and mesh → DXF triangles.
 *
 * DXF is a 2D drawing format. A triangle mesh cannot be expressed as a 2D
 * drawing without throwing information away, so we offer the two honest
 * conversions instead of pretending otherwise:
 *
 *  - `sliceAtZ` — cut the model with a horizontal plane and emit the outline of
 *    that slice as closed polylines. This is what you want for laser cutting,
 *    waterjet, CNC profiling or dropping a footprint into a 2D drawing.
 *  - `meshToTriangles` — hand every triangle over as DXF 3DFACE entities, which
 *    keeps the full 3D shape for CAD packages that import faceted geometry.
 *
 * Both are pure geometry over a THREE.BufferGeometry (no DOM), so they're
 * unit-testable in Node.
 */

import * as THREE from "three";
import type { Point2, Polyline, Triangle3 } from "./write";

/** Vertices this close to the cutting plane are treated as sitting above it. */
const PLANE_EPS = 1e-7;

export type SliceResult = {
  polylines: Polyline[];
  /** Loops that closed up properly. */
  closedLoops: number;
  /**
   * Chains that never closed — they come from holes or non-manifold edges in
   * the source mesh. Emitted as open polylines rather than silently dropped.
   */
  openChains: number;
};

function positionsOf(geometry: THREE.BufferGeometry): Float32Array {
  const geo = geometry.index ? geometry.toNonIndexed() : geometry;
  const attr = geo.getAttribute("position");
  if (!attr) throw new Error("Geometry has no position attribute.");
  return attr.array instanceof Float32Array
    ? (attr.array as Float32Array)
    : new Float32Array(attr.array as ArrayLike<number>);
}

/** Z range of the mesh — the usable span for a cutting plane. */
export function zRange(geometry: THREE.BufferGeometry): [number, number] {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  return [bb.min.z, bb.max.z];
}

/** Every triangle of the mesh, ready to be written as 3DFACE entities. */
export function meshToTriangles(geometry: THREE.BufferGeometry): Triangle3[] {
  const p = positionsOf(geometry);
  const out: Triangle3[] = [];
  for (let i = 0; i + 8 < p.length; i += 9) {
    out.push([
      [p[i], p[i + 1], p[i + 2]],
      [p[i + 3], p[i + 4], p[i + 5]],
      [p[i + 6], p[i + 7], p[i + 8]],
    ]);
  }
  return out;
}

type Segment = { a: Point2; b: Point2 };

/**
 * Intersect one triangle with the plane z = z0.
 *
 * Vertices within PLANE_EPS of the plane are nudged above it, which removes the
 * degenerate "vertex exactly on the plane" cases that otherwise produce
 * zero-length or duplicated segments.
 */
function cutTriangle(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
  z0: number,
): Segment | null {
  let da = az - z0;
  let db = bz - z0;
  let dc = cz - z0;
  if (Math.abs(da) < PLANE_EPS) da = PLANE_EPS;
  if (Math.abs(db) < PLANE_EPS) db = PLANE_EPS;
  if (Math.abs(dc) < PLANE_EPS) dc = PLANE_EPS;

  const above = (d: number) => d > 0;
  if (above(da) === above(db) && above(db) === above(dc)) return null;

  const hits: Point2[] = [];
  const edge = (
    d1: number, x1: number, y1: number,
    d2: number, x2: number, y2: number,
  ) => {
    if (above(d1) === above(d2)) return;
    const t = d1 / (d1 - d2);
    hits.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  };
  // Walk the edges in winding order so the segment direction follows the face.
  edge(da, ax, ay, db, bx, by);
  edge(db, bx, by, dc, cx, cy);
  edge(dc, cx, cy, da, ax, ay);

  if (hits.length !== 2) return null;
  return { a: hits[0], b: hits[1] };
}

/** Shoelace area; positive = counter-clockwise. */
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

/**
 * Cut the mesh with the horizontal plane z = z0 and return the outline.
 *
 * Segments are welded end-to-end on a tolerance grid scaled to the model, so
 * ordinary float noise from the intersection maths doesn't break a loop apart.
 */
export function sliceAtZ(
  geometry: THREE.BufferGeometry,
  z0: number,
): SliceResult {
  const p = positionsOf(geometry);
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const span = Math.max(
    bb.max.x - bb.min.x,
    bb.max.y - bb.min.y,
    bb.max.z - bb.min.z,
    1e-6,
  );
  // Weld tolerance: 1e-5 of the model size — far below any real feature, far
  // above the float error of a plane/edge intersection.
  const tol = span * 1e-5;
  const quant = (v: number) => Math.round(v / tol);
  const keyOf = (pt: Point2) => `${quant(pt[0])},${quant(pt[1])}`;

  const segments: Segment[] = [];
  for (let i = 0; i + 8 < p.length; i += 9) {
    const seg = cutTriangle(
      p[i], p[i + 1], p[i + 2],
      p[i + 3], p[i + 4], p[i + 5],
      p[i + 6], p[i + 7], p[i + 8],
      z0,
    );
    if (!seg) continue;
    if (keyOf(seg.a) === keyOf(seg.b)) continue; // zero-length after welding
    segments.push(seg);
  }

  if (segments.length === 0) {
    return { polylines: [], closedLoops: 0, openChains: 0 };
  }

  // Adjacency indexes BOTH endpoints. A triangle/plane intersection doesn't
  // yield a consistent circulation direction — which end of the segment comes
  // first depends on which two edges the plane happened to cross — so chaining
  // has to be direction-agnostic and flip segments as needed. Loop orientation
  // is fixed afterwards from the winding, below.
  const ends = new Map<string, number[]>();
  const index = (k: string, i: number) => {
    const list = ends.get(k);
    if (list) list.push(i);
    else ends.set(k, [i]);
  };
  for (let i = 0; i < segments.length; i++) {
    index(keyOf(segments[i].a), i);
    index(keyOf(segments[i].b), i);
  }

  const used = new Uint8Array(segments.length);
  const loops: Point2[][] = [];
  const chains: Point2[][] = [];

  for (let s = 0; s < segments.length; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const startKey = keyOf(segments[s].a);
    const pts: Point2[] = [segments[s].a, segments[s].b];
    let closed = false;

    for (;;) {
      const tailKey = keyOf(pts[pts.length - 1]);
      if (tailKey === startKey) {
        pts.pop(); // the closing point duplicates the first
        closed = true;
        break;
      }
      const candidates = ends.get(tailKey);
      let next = -1;
      if (candidates) {
        for (const c of candidates) if (!used[c]) { next = c; break; }
      }
      if (next < 0) break;
      used[next] = 1;
      // Append whichever end of the next segment isn't the one we joined at.
      const seg = segments[next];
      pts.push(keyOf(seg.a) === tailKey ? seg.b : seg.a);
    }

    if (pts.length < 3) continue;
    if (closed) loops.push(pts);
    else chains.push(pts);
  }

  // Outer loops counter-clockwise, enclosed loops clockwise — the convention
  // CAD and CAM software reads as "material" vs "hole".
  const oriented = loops.map((pts) => {
    const depth = loops.reduce(
      (d, other) => (other !== pts && pointInPolygon(pts[0], other) ? d + 1 : d),
      0,
    );
    const wantCCW = depth % 2 === 0;
    const isCCW = areaOf(pts) > 0;
    return isCCW === wantCCW ? pts : pts.slice().reverse();
  });

  const polylines: Polyline[] = [
    ...oriented.map((points) => ({ points, closed: true })),
    ...chains.map((points) => ({ points, closed: false })),
  ];

  return {
    polylines,
    closedLoops: oriented.length,
    openChains: chains.length,
  };
}
