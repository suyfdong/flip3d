import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { analyzeGeometry, type MeshIssues } from "./analyze";

export type RepairReport = {
  before: MeshIssues;
  after: MeshIssues;
  actions: string[];
};

// Collect every Mesh in the object into one merged BufferGeometry. Repair
// operates on a single geometry — that's the contract STL/PLY expect anyway.
function flattenToGeometry(object: THREE.Object3D): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  object.updateMatrixWorld(true);
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geo = child.geometry.clone();
    geo.applyMatrix4(child.matrixWorld);
    // Strip everything but position + optional normal — repair pipeline
    // doesn't need UVs/colors/groups and they break mergeVertices on edge
    // cases.
    const pos = geo.getAttribute("position");
    if (!pos) {
      geo.dispose();
      return;
    }
    const stripped = new THREE.BufferGeometry();
    stripped.setAttribute("position", pos.clone());
    const idx = geo.getIndex();
    if (idx) stripped.setIndex(idx.clone());
    geometries.push(stripped);
    geo.dispose();
  });

  if (geometries.length === 0) {
    throw new Error("No mesh geometry found to repair");
  }
  if (geometries.length === 1) return geometries[0];

  // Merge multiple meshes into one. Simple manual merge by concatenating
  // position arrays (and offsetting indices) keeps things predictable.
  let totalVerts = 0;
  let totalIdx = 0;
  for (const g of geometries) {
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    totalVerts += pos.count;
    const idx = g.getIndex();
    totalIdx += idx ? idx.count : pos.count;
  }
  const mergedPos = new Float32Array(totalVerts * 3);
  const mergedIdx = new Uint32Array(totalIdx);
  let vOff = 0;
  let iOff = 0;
  for (const g of geometries) {
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      mergedPos[(vOff + i) * 3 + 0] = pos.getX(i);
      mergedPos[(vOff + i) * 3 + 1] = pos.getY(i);
      mergedPos[(vOff + i) * 3 + 2] = pos.getZ(i);
    }
    const idx = g.getIndex();
    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        mergedIdx[iOff + i] = idx.getX(i) + vOff;
      }
      iOff += idx.count;
    } else {
      for (let i = 0; i < pos.count; i++) {
        mergedIdx[iOff + i] = vOff + i;
      }
      iOff += pos.count;
    }
    vOff += pos.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(mergedPos, 3));
  out.setIndex(new THREE.BufferAttribute(mergedIdx, 1));
  return out;
}

// Remove triangles that collapse to a line or a point (post-mergeVertices,
// these show up as triangles where two or more indices are equal).
function removeDegenerateTriangles(geo: THREE.BufferGeometry): {
  geo: THREE.BufferGeometry;
  removed: number;
} {
  const idx = geo.getIndex();
  if (!idx) {
    // Without an index there's no shared-vertex notion of degenerate; bail.
    return { geo, removed: 0 };
  }
  const filtered: number[] = [];
  let removed = 0;
  const arr = idx.array as ArrayLike<number>;
  for (let i = 0; i < arr.length; i += 3) {
    const a = arr[i];
    const b = arr[i + 1];
    const c = arr[i + 2];
    if (a === b || b === c || a === c) {
      removed++;
      continue;
    }
    filtered.push(a, b, c);
  }
  if (removed === 0) return { geo, removed: 0 };
  geo.setIndex(filtered);
  return { geo, removed };
}

export function repairObject(object: THREE.Object3D): {
  geometry: THREE.BufferGeometry;
  report: RepairReport;
} {
  const merged = flattenToGeometry(object);

  // Analyze before — quantized de-dup view of the input.
  const before = analyzeGeometry(merged);

  const actions: string[] = [];

  // 1. Merge near-duplicate vertices (default tolerance 1e-4).
  let working = mergeVertices(merged, 1e-4);
  if (
    working.getAttribute("position").count !==
    merged.getAttribute("position").count
  ) {
    actions.push(
      `Welded ${merged.getAttribute("position").count - working.getAttribute("position").count} duplicate vertices`,
    );
  }
  merged.dispose();

  // 2. Remove degenerate triangles (post-merge they emerge as index repeats).
  const deg = removeDegenerateTriangles(working);
  working = deg.geo;
  if (deg.removed > 0) {
    actions.push(`Removed ${deg.removed} degenerate triangles`);
  }

  // 3. Recompute vertex normals (cleans up bad imported normals + adds
  //    them if missing).
  working.computeVertexNormals();
  actions.push("Recomputed vertex normals");

  // 4. Re-analyze the result.
  const after = analyzeGeometry(working);

  if (after.boundaryEdges > 0) {
    actions.push(
      `${after.boundaryEdges} boundary edges remain (holes — auto-patching ships in v2)`,
    );
  }
  if (after.nonManifoldEdges > 0) {
    actions.push(
      `${after.nonManifoldEdges} non-manifold edges remain (3+ faces on one edge — auto-fix ships in v2)`,
    );
  }
  if (after.isManifold) {
    actions.push("Mesh is closed and manifold ✓");
  }

  return { geometry: working, report: { before, after, actions } };
}
