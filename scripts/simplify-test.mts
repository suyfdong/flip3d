// Mesh decimation tests. Run: npx tsx scripts/simplify-test.mts
import * as THREE from "three";
import { simplifyGeometry, simplifyObject, simplifyPointGeometry, ready, binaryStlBytes } from "@/lib/simplify/simplify";
import { analyzeGeometry } from "@/lib/repair/analyze";
import { analyzePrintReadiness } from "@/lib/print-check/analyze";
import { trimObjPrecision } from "@/lib/converters/export";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${name} ${extra}`); }
  else { fail++; console.log(`  ✗ FAIL: ${name} ${extra}`); }
}
const tris = (g: THREE.BufferGeometry) => (g.getIndex() ? g.getIndex()!.count : g.getAttribute("position").count) / 3;

await ready;

console.log("Indexed sphere with UV seam (like a GLB primitive)");
{
  const sphere = new THREE.SphereGeometry(10, 128, 64); // 16k tris, UV seam + pole duplicates
  const before = tris(sphere);
  const r = simplifyGeometry(sphere, { ratio: 0.25, lockBorder: false });
  const after = tris(r.geometry);
  check("~25% of triangles kept", after <= before * 0.26 && after >= before * 0.2, `(${before} → ${after})`);
  check("error is small vs radius 10", r.error < 0.2, `(${r.error.toFixed(4)})`);
  check("uv attribute kept", !!r.geometry.getAttribute("uv"));
  check("normals kept from source", !!r.geometry.getAttribute("normal"));
  // No cracks along the UV seam: weld by position and the surface must be closed.
  const welded = r.geometry.clone();
  welded.deleteAttribute("uv"); welded.deleteAttribute("normal");
  const topo = analyzeGeometry(welded);
  check("no cracks along the UV seam (closed after position weld)", topo.boundaryEdges === 0, `(${topo.boundaryEdges} open edges)`);
  check("vertices compacted (no unused vertices)", r.geometry.getAttribute("position").count < sphere.getAttribute("position").count * 0.35);
  check("source untouched", tris(sphere) === before);
}

console.log("Triangle soup (STL-like, non-indexed with face normals)");
{
  const soup = new THREE.TorusKnotGeometry(20, 6, 200, 32).toNonIndexed();
  soup.computeVertexNormals();
  const before = tris(soup);
  const r = simplifyGeometry(soup, { ratio: 0.1, lockBorder: false });
  const after = tris(r.geometry);
  check("10% target reached", after <= before * 0.11, `(${before} → ${after})`);
  check("marked as not originally indexed", r.wasIndexed === false);
  const pr = analyzePrintReadiness(r.geometry);
  check("still watertight + manifold after decimation", pr.topology.isClosed && pr.topology.isManifold, `(${pr.topology.boundaryEdges}/${pr.topology.nonManifoldEdges})`);
  const v0 = analyzePrintReadiness((() => { const g = soup.clone(); g.deleteAttribute("normal"); return g; })()).volumeCm3!;
  const v1 = pr.volumeCm3!;
  check("volume within 5% at a 10% triangle budget", Math.abs(v1 - v0) / v0 < 0.05, `(${v0.toFixed(2)} → ${v1.toFixed(2)} cm³)`);
}

console.log("Torus (UV seams in both directions, near-equal seam positions)");
{
  const torus = new THREE.TorusGeometry(10, 3, 64, 128);
  for (const ratio of [0.25, 0.1]) {
    const r = simplifyGeometry(torus, { ratio, lockBorder: false });
    const w = r.geometry.clone(); w.deleteAttribute("uv"); w.deleteAttribute("normal");
    check(`no seam cracks at ${ratio * 100}%`, analyzeGeometry(w).boundaryEdges === 0, `(${analyzeGeometry(w).boundaryEdges} open, ${tris(r.geometry)} tris)`);
  }
}

console.log("Open mesh + lockBorder");
{
  const plane = new THREE.PlaneGeometry(100, 50, 100, 50);
  const pos = plane.getAttribute("position");
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) / 8) * 3);
  const locked = simplifyGeometry(plane, { ratio: 0.1, lockBorder: true });
  const box = new THREE.Box3().setFromBufferAttribute(locked.geometry.getAttribute("position") as THREE.BufferAttribute);
  check("outline kept exactly with lockBorder", Math.abs(box.max.x - 50) < 1e-5 && Math.abs(box.min.y + 25) < 1e-5);
  const before = analyzeGeometry(plane).boundaryEdges;
  check("locked border keeps every border edge", analyzeGeometry(locked.geometry).boundaryEdges === before, `(${before})`);
}

console.log("Multi-material groups");
{
  const box = new THREE.BoxGeometry(10, 10, 10, 20, 20, 20); // 6 groups
  const r = simplifyGeometry(box, { ratio: 0.2, lockBorder: false });
  check("6 groups survive", r.geometry.groups.length === 6);
  const idxCount = r.geometry.getIndex()!.count;
  const sum = r.geometry.groups.reduce((s, g) => s + g.count, 0);
  check("group ranges cover the index buffer", sum === idxCount && r.geometry.groups.every((g) => g.count % 3 === 0));
}

console.log("Object tree, materials, point cloud");
{
  const matA = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const meshA = new THREE.Mesh(new THREE.IcosahedronGeometry(5, 20), matA);
  const pts = new THREE.BufferGeometry();
  const n = 20000;
  const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) { p[i] = Math.random() * 10; c[i] = Math.random(); }
  pts.setAttribute("position", new THREE.BufferAttribute(p, 3));
  pts.setAttribute("color", new THREE.BufferAttribute(c, 3));
  const cloud = new THREE.Points(pts, new THREE.PointsMaterial());
  const root = new THREE.Group(); root.add(meshA, cloud);
  const { object, report } = simplifyObject(root, { ratio: 0.3, lockBorder: false });
  check("report counts triangles", report.trianglesAfter < report.trianglesBefore * 0.31, `(${report.trianglesBefore} → ${report.trianglesAfter})`);
  check("point cloud thinned to ~30%", Math.abs(report.pointsAfter - 6000) <= 900, `(${report.pointsAfter})`);
  check("colours kept on points", !!(object.children[1] as THREE.Points).geometry.getAttribute("color"));
  check("source mesh untouched", tris(meshA.geometry) === report.trianglesBefore);
  check("material cloned, not shared", (object.children[0] as THREE.Mesh).material !== matA);
}

{
  const obj = "o mesh_1.23456789\nv 0.30000001192092896 -0.0000000001 12.5\nvt 0.5 0.25000000372529\nf 1/1 2/2 3/3\nusemtl Mat.001";
  const t = trimObjPrecision(obj, 6);
  check("OBJ trim: vertex numbers rounded", t.includes("v 0.3 0 12.5") && t.includes("vt 0.5 0.25"), JSON.stringify(t));
  check("OBJ trim: names and faces untouched", t.includes("o mesh_1.23456789") && t.includes("f 1/1 2/2 3/3") && t.includes("usemtl Mat.001"));
}
{
  // Quantized attributes (GLB-style): 8-bit normalized colours must round-trip raw.
  const g = new THREE.IcosahedronGeometry(5, 8);
  const merged = (() => { const m = g.clone(); m.deleteAttribute("normal"); m.deleteAttribute("uv"); return m; })();
  const n = merged.getAttribute("position").count;
  const col = new Uint8Array(n * 3).fill(200);
  merged.setAttribute("color", new THREE.BufferAttribute(col, 3, true));
  const r = simplifyGeometry(merged, { ratio: 0.3, lockBorder: false });
  const c = r.geometry.getAttribute("color") as THREE.BufferAttribute;
  check("normalized Uint8 colour kept raw (200, not 0.78)", c.array instanceof Uint8Array && c.normalized && c.array.every((v) => v === 200));
}
check("binary STL size formula", binaryStlBytes(1000) === 50084);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
