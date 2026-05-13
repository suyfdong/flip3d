import * as THREE from "three";

export type MeshIssues = {
  triangles: number;
  vertices: number;
  duplicateVertexGroups: number; // groups of vertices sharing the same position
  degenerateTriangles: number; // zero-area or collapsed
  boundaryEdges: number; // edge used by exactly one face — indicates holes
  nonManifoldEdges: number; // edge used by 3+ faces — bad topology
  hasNormals: boolean;
  // qualitative
  isClosed: boolean; // boundaryEdges === 0 after dedupe
  isManifold: boolean; // boundaryEdges + nonManifoldEdges === 0 after dedupe
};

// Build a quantized-position key so floating-point duplicates collapse.
function posKey(x: number, y: number, z: number, decimals = 5): string {
  const f = Math.pow(10, decimals);
  return `${Math.round(x * f)}|${Math.round(y * f)}|${Math.round(z * f)}`;
}

export function analyzeGeometry(geo: THREE.BufferGeometry): MeshIssues {
  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute | undefined;
  const indexAttr = geo.getIndex();

  if (!posAttr) {
    return {
      triangles: 0,
      vertices: 0,
      duplicateVertexGroups: 0,
      degenerateTriangles: 0,
      boundaryEdges: 0,
      nonManifoldEdges: 0,
      hasNormals: false,
      isClosed: false,
      isManifold: false,
    };
  }

  const vertexCount = posAttr.count;
  const triangleCount = indexAttr ? indexAttr.count / 3 : vertexCount / 3;

  // ---- Detect duplicate vertices (groups) ----
  const posBuckets = new Map<string, number>();
  for (let i = 0; i < vertexCount; i++) {
    const k = posKey(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    posBuckets.set(k, (posBuckets.get(k) ?? 0) + 1);
  }
  let duplicateGroups = 0;
  for (const count of posBuckets.values()) if (count > 1) duplicateGroups++;

  // Resolve each vertex to its canonical (first) index for edge analysis.
  const canonical = new Int32Array(vertexCount);
  const seen = new Map<string, number>();
  for (let i = 0; i < vertexCount; i++) {
    const k = posKey(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    const first = seen.get(k);
    if (first === undefined) {
      seen.set(k, i);
      canonical[i] = i;
    } else {
      canonical[i] = first;
    }
  }

  // ---- Walk triangles. Count edges + degenerate triangles ----
  let degenerate = 0;
  const edgeCount = new Map<string, number>();
  const recordEdge = (a: number, b: number) => {
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;
    const key = `${lo}_${hi}`;
    edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
  };

  const triIndex = (t: number, slot: 0 | 1 | 2): number => {
    if (indexAttr) return indexAttr.getX(t * 3 + slot);
    return t * 3 + slot;
  };

  for (let t = 0; t < triangleCount; t++) {
    const a = canonical[triIndex(t, 0)];
    const b = canonical[triIndex(t, 1)];
    const c = canonical[triIndex(t, 2)];
    if (a === b || b === c || a === c) {
      degenerate++;
      continue;
    }
    recordEdge(a, b);
    recordEdge(b, c);
    recordEdge(c, a);
  }

  let boundary = 0;
  let nonManifold = 0;
  for (const n of edgeCount.values()) {
    if (n === 1) boundary++;
    else if (n > 2) nonManifold++;
  }

  return {
    triangles: triangleCount,
    vertices: vertexCount,
    duplicateVertexGroups: duplicateGroups,
    degenerateTriangles: degenerate,
    boundaryEdges: boundary,
    nonManifoldEdges: nonManifold,
    hasNormals: !!geo.getAttribute("normal"),
    isClosed: boundary === 0,
    isManifold: boundary === 0 && nonManifold === 0,
  };
}
