import * as THREE from "three";
import {
  applyTransform,
  sizeOf,
  scaleForLongestAxis,
  DEFAULT_TRANSFORM,
  type TransformOptions,
} from "@/lib/edit/transform";

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
const near = (a: number, b: number, eps = 1e-3) => Math.abs(a - b) < eps;

function opts(over: Partial<TransformOptions> = {}): TransformOptions {
  return { ...DEFAULT_TRANSFORM, dropToFloor: false, ...over };
}

// 1) sizeOf a 20mm box
console.log("\n[1] sizeOf");
{
  const s = sizeOf(new THREE.BoxGeometry(20, 20, 20));
  check("20mm box → 20×20×20", near(s.x, 20) && near(s.y, 20) && near(s.z, 20),
    `(${s.x},${s.y},${s.z})`);
}

// 2) uniform scale ×2 doubles every extent
console.log("\n[2] uniform scale");
{
  const g = applyTransform(new THREE.BoxGeometry(10, 20, 30), opts({ scale: 2 }));
  const s = sizeOf(g);
  check("scale 2 → 20×40×60", near(s.x, 20) && near(s.y, 40) && near(s.z, 60),
    `(${s.x},${s.y},${s.z})`);
}

// 3) 90° rotation about X swaps Y and Z extents
console.log("\n[3] rotate 90° about X");
{
  const g = applyTransform(
    new THREE.BoxGeometry(10, 20, 30),
    opts({ rotationDeg: { x: 90, y: 0, z: 0 } }),
  );
  const s = sizeOf(g);
  check("10×20×30 → 10×30×20", near(s.x, 10) && near(s.y, 30) && near(s.z, 20),
    `(${s.x},${s.y.toFixed(2)},${s.z.toFixed(2)})`);
}

// 4) dropToFloor puts the lowest point on z = 0
console.log("\n[4] drop to floor");
{
  // Box centred at origin spans z ∈ [-15, 15]; after drop, minZ should be 0.
  const g = applyTransform(
    new THREE.BoxGeometry(10, 20, 30),
    opts({ dropToFloor: true }),
  );
  g.computeBoundingBox();
  const minZ = g.boundingBox!.min.z;
  check("minZ == 0 after drop", near(minZ, 0), `minZ=${minZ.toFixed(3)}`);
}

// 5) scaleForLongestAxis
console.log("\n[5] resize longest axis");
{
  const base = sizeOf(new THREE.BoxGeometry(10, 20, 30)); // longest = 30
  const f = scaleForLongestAxis(base, 60);
  check("longest 30 → target 60 ⇒ ×2", near(f, 2), `f=${f}`);
  const g = applyTransform(new THREE.BoxGeometry(10, 20, 30), opts({ scale: f }));
  const s = sizeOf(g);
  check("applied → longest axis == 60", near(Math.max(s.x, s.y, s.z), 60),
    `(${s.x},${s.y},${s.z})`);
}

// 6) empty / bad input guards
console.log("\n[6] guards");
{
  check("scaleForLongestAxis(0 size) → 1",
    scaleForLongestAxis({ x: 0, y: 0, z: 0 }, 50) === 1);
  check("scaleForLongestAxis(target 0) → 1",
    scaleForLongestAxis({ x: 10, y: 10, z: 10 }, 0) === 1);
  const g = applyTransform(new THREE.BoxGeometry(10, 10, 10), opts({ scale: -5 }));
  const s = sizeOf(g);
  check("negative scale ignored (stays 10)", near(s.x, 10), `x=${s.x}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
