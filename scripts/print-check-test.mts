import * as THREE from "three";
import { analyzePrintReadiness } from "@/lib/print-check/analyze";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name} ${extra}`);
  } else {
    fail++;
    console.log(`  ✗ FAIL: ${name} ${extra}`);
  }
}

function onBed(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox();
  geo.translate(0, 0, -geo.boundingBox!.min.z); // sit on z=0
  return geo;
}

// 1) Solid 20mm cube on the bed
console.log("\n[1] Solid 20mm cube");
{
  const r = analyzePrintReadiness(onBed(new THREE.BoxGeometry(20, 20, 20)));
  check("watertight", r.topology.isClosed);
  check("manifold", r.topology.isManifold);
  check("size 20×20×20", r.sizeMM.every((s) => Math.abs(s - 20) < 1e-3),
    JSON.stringify(r.sizeMM));
  check("volume ≈ 8 cm³", Math.abs((r.volumeCm3 ?? 0) - 8) < 0.01, `${r.volumeCm3}`);
  check("overhang ≈ 0% (base excluded)", r.overhangAreaPct < 1,
    `${r.overhangAreaPct.toFixed(1)}%`);
  check("fits a bed", r.bedFits.some((b) => b.fits));
  check("verdict ready", r.verdict === "ready", r.verdict);
}

// 2) Open plane (2 triangles, all boundary edges) → not watertight → fail
console.log("\n[2] Open plane (not watertight)");
{
  const r = analyzePrintReadiness(new THREE.PlaneGeometry(30, 30));
  check("not watertight", !r.topology.isClosed, `holes=${r.topology.boundaryEdges}`);
  check("verdict fail", r.verdict === "fail", r.verdict);
  check("reason mentions watertight",
    r.reasons.some((x) => /watertight/i.test(x)));
}

// 3) Sphere on the bed → lower hemisphere overhangs
console.log("\n[3] Sphere r=10 (overhangs)");
{
  const r = analyzePrintReadiness(onBed(new THREE.SphereGeometry(10, 48, 32)));
  check("watertight", r.topology.isClosed);
  // Theory: 45° cap fraction ≈ 14.6%, minus the base band resting on the bed.
  check("overhang ≈ 13% (bottom cap at 45°)",
    r.overhangAreaPct > 8 && r.overhangAreaPct < 18,
    `${r.overhangAreaPct.toFixed(1)}%`);
  check("verdict ready (13% < 25% warn line)", r.verdict === "ready", r.verdict);
}

// 4) Oversized 300mm cube → fits no common bed → fail
console.log("\n[4] 300mm cube (too big)");
{
  const r = analyzePrintReadiness(onBed(new THREE.BoxGeometry(300, 300, 300)));
  check("fits no bed", !r.bedFits.some((b) => b.fits));
  check("verdict fail", r.verdict === "fail", r.verdict);
  check("reason mentions too large", r.reasons.some((x) => /too large/i.test(x)));
}

// 5) Sub-mm cube → unit warning → fail
console.log("\n[5] 0.5mm cube (unit mismatch)");
{
  const r = analyzePrintReadiness(onBed(new THREE.BoxGeometry(0.5, 0.5, 0.5)));
  check("unitWarning tiny", r.unitWarning === "tiny", `${r.unitWarning}`);
  check("verdict fail", r.verdict === "fail", r.verdict);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
