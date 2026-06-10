import * as THREE from "three";
import { analyzeGeometry, type MeshIssues } from "@/lib/repair/analyze";

/**
 * Print-readiness pre-flight. Reuses the repair topology analysis (watertight /
 * manifold / holes) and adds the print-specific checks slicers care about:
 * physical size + unit sanity, whether it fits a common print bed, and how much
 * of the surface overhangs past the support threshold.
 *
 * Everything here is pure geometry (no DOM / WebGL), so it runs in Node tests
 * and in a worker as well as the browser. Z is treated as the build (up) axis,
 * the standard convention for 3D-printing STLs.
 */

export type BedFit = {
  name: string;
  bed: [number, number, number]; // mm, [x, y, z]
  fits: boolean;
};

export type PrintReadiness = {
  topology: MeshIssues;
  sizeMM: [number, number, number];
  /** Solid volume in cm³ — only trustworthy when the mesh is watertight. */
  volumeCm3: number | null;
  /** Share of surface area (0–100) that overhangs past the threshold, excluding
   * faces resting on the build plate. Informational: high = lots of support. */
  overhangAreaPct: number;
  overhangThresholdDeg: number;
  /** Heuristic that the model's units look wrong (e.g. metres read as mm). */
  unitWarning: "tiny" | "huge" | null;
  bedFits: BedFit[];
  verdict: "ready" | "warn" | "fail";
  /** Human-readable, constructive summary lines for the UI. */
  reasons: string[];
};

/** Common consumer print beds, mm. Stand-in until the bed-sizes reference page
 * lands; kept short and recognizable rather than exhaustive. */
export const COMMON_BEDS: { name: string; bed: [number, number, number] }[] = [
  { name: "Bambu X1 / P1 / A1", bed: [256, 256, 256] },
  { name: "Creality Ender 3", bed: [220, 220, 250] },
  { name: "Prusa MK3 / MK4", bed: [250, 210, 210] },
  { name: "Bambu A1 mini", bed: [180, 180, 180] },
];

type Options = {
  overhangThresholdDeg?: number; // angle from horizontal; >threshold needs support
  beds?: { name: string; bed: [number, number, number] }[];
};

export function analyzePrintReadiness(
  geo: THREE.BufferGeometry,
  opts: Options = {},
): PrintReadiness {
  const overhangThresholdDeg = opts.overhangThresholdDeg ?? 45;
  const beds = opts.beds ?? COMMON_BEDS;
  const topology = analyzeGeometry(geo);

  // ---- bounding box / size ----
  geo.computeBoundingBox();
  const bb = geo.boundingBox ?? new THREE.Box3();
  const sizeMM: [number, number, number] = [
    bb.max.x - bb.min.x,
    bb.max.y - bb.min.y,
    bb.max.z - bb.min.z,
  ];
  const minZ = bb.min.z;
  const heightZ = Math.max(sizeMM[2], 1e-6);
  // Faces within this band of the bottom rest on the bed → not real overhangs.
  const baseBand = Math.max(0.4, heightZ * 0.01);

  // ---- per-triangle passes: area + signed volume, then overhang ----
  const pos = geo.getAttribute("position") as THREE.BufferAttribute | undefined;
  const index = geo.getIndex();

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const n = new THREE.Vector3();
  const bc = new THREE.Vector3();

  const triCount = pos ? (index ? index.count / 3 : pos.count / 3) : 0;
  const idx = (t: number, s: 0 | 1 | 2) =>
    index ? index.getX(t * 3 + s) : t * 3 + s;
  const readTri = (t: number) => {
    a.fromBufferAttribute(pos!, idx(t, 0));
    b.fromBufferAttribute(pos!, idx(t, 1));
    c.fromBufferAttribute(pos!, idx(t, 2));
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    n.crossVectors(ab, ac); // |n| = 2 × area, direction = face normal
  };

  // Pass 1: total area + signed volume. The volume sign tells us whether the
  // mesh winding is net outward (+) or inverted (−), so the overhang test below
  // stays correct even on a uniformly flipped-normal STL (a common defect).
  let totalArea = 0;
  let signedVol6 = 0; // 6× signed volume
  for (let t = 0; t < triCount && pos; t++) {
    readTri(t);
    const area2 = n.length();
    if (area2 === 0) continue; // degenerate
    totalArea += area2 * 0.5;
    signedVol6 += a.dot(bc.crossVectors(b, c)); // tetra (origin,a,b,c) × 6
  }
  const orient = signedVol6 >= 0 ? 1 : -1;

  // A face needs support when its surface tips past the threshold from
  // horizontal AND points downward. Vertical walls (nz≈0) never need support;
  // a flat ceiling (nz≈−1) always does.
  const nzSupportMax = -Math.cos((overhangThresholdDeg * Math.PI) / 180);

  // Pass 2: overhang area, excluding faces resting on the build plate.
  let overhangArea = 0;
  for (let t = 0; t < triCount && pos; t++) {
    readTri(t);
    const area2 = n.length();
    if (area2 === 0) continue;
    const nz = (orient * n.z) / area2; // outward-oriented normal's z
    if (nz < nzSupportMax) {
      const centroidZ = (a.z + b.z + c.z) / 3;
      if (centroidZ > minZ + baseBand) overhangArea += area2 * 0.5;
    }
  }

  const overhangAreaPct =
    totalArea > 0 ? (overhangArea / totalArea) * 100 : 0;
  const volumeCm3 = topology.isClosed
    ? Math.abs(signedVol6 / 6) / 1000
    : null;

  // ---- unit sanity ----
  const maxDim = Math.max(...sizeMM);
  const unitWarning: "tiny" | "huge" | null =
    maxDim > 0 && maxDim < 1 ? "tiny" : maxDim > 1000 ? "huge" : null;

  // ---- bed fit (allow a 90° rotation about Z) ----
  const [sx, sy, sz] = sizeMM;
  const bedFits: BedFit[] = beds.map(({ name, bed }) => {
    const [bx, by, bz] = bed;
    const fits =
      sz <= bz && ((sx <= bx && sy <= by) || (sx <= by && sy <= bx));
    return { name, bed, fits };
  });
  const fitsAnyBed = bedFits.some((f) => f.fits);

  // ---- verdict + reasons ----
  const reasons: string[] = [];
  let verdict: "ready" | "warn" | "fail" = "ready";
  const fail = () => (verdict = "fail");
  const warn = () => (verdict = verdict === "fail" ? "fail" : "warn");

  if (topology.nonManifoldEdges > 0) {
    fail();
    reasons.push(
      `Non-manifold geometry (${topology.nonManifoldEdges} bad edges) — slicers may misread inside vs outside. Run STL Repair.`,
    );
  }
  if (!topology.isClosed) {
    fail();
    reasons.push(
      `Not watertight (${topology.boundaryEdges} open edges / holes) — fix with STL Repair before printing.`,
    );
  }
  if (unitWarning === "tiny") {
    fail();
    reasons.push(
      `Model is under 1 mm across — almost certainly a unit mismatch. Scale it up in your slicer.`,
    );
  } else if (unitWarning === "huge") {
    fail();
    reasons.push(
      `Model is over 1 m across — likely a unit mismatch. Scale it down in your slicer.`,
    );
  }
  if (!fitsAnyBed) {
    fail();
    reasons.push(
      `Too large for common print beds (${sx.toFixed(0)}×${sy.toFixed(0)}×${sz.toFixed(0)} mm) — split it or scale down.`,
    );
  }
  if (topology.degenerateTriangles > 0) {
    warn();
    reasons.push(
      `${topology.degenerateTriangles} degenerate (zero-area) triangles — harmless but worth cleaning in STL Repair.`,
    );
  }
  if (overhangAreaPct > 25) {
    warn();
    reasons.push(
      `${overhangAreaPct.toFixed(0)}% of the surface overhangs past ${overhangThresholdDeg}° — plan for supports.`,
    );
  }
  if (verdict === "ready") {
    reasons.push("Watertight, manifold, fits a common bed — good to slice.");
  }

  return {
    topology,
    sizeMM,
    volumeCm3,
    overhangAreaPct,
    overhangThresholdDeg,
    unitWarning,
    bedFits,
    verdict,
    reasons,
  };
}
