import {
  boundingRadius,
  cameraPositionFor,
  clampSize,
  fitDistance,
  IMAGE_FORMATS,
  IMAGE_MIME,
  outputName,
  SIZE_MAX,
  SIZE_MIN,
  supportsAlpha,
  VIEW_PRESETS,
} from "@/lib/render/framing";

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
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;
const len = (v: { x: number; y: number; z: number }) => Math.hypot(v.x, v.y, v.z);

// 1) bounding radius
console.log("\n[1] boundingRadius");
{
  check("unit cube → √3/2", near(boundingRadius({ x: 1, y: 1, z: 1 }), Math.sqrt(3) / 2));
  check("10×0×0 → 5", near(boundingRadius({ x: 10, y: 0, z: 0 }), 5));
  check("degenerate (0,0,0) → 1 (no div-by-zero downstream)",
    boundingRadius({ x: 0, y: 0, z: 0 }) === 1);
}

// 2) fitDistance — the sphere must actually fit inside the frustum
console.log("\n[2] fitDistance");
{
  const size = { x: 1, y: 1, z: 1 };
  const r = boundingRadius(size);
  for (const aspect of [0.5, 1, 16 / 9, 3]) {
    const d = fitDistance(size, aspect, 45, 1);
    const halfV = (45 / 2) * (Math.PI / 180);
    const halfH = Math.atan(Math.tan(halfV) * aspect);
    // sin(halfAngle) * d === r means the sphere is exactly tangent to both planes
    check(`aspect ${aspect.toFixed(2)}: sphere tangent to tighter plane`,
      near(Math.sin(Math.min(halfV, halfH)) * d, r, 1e-9), `d=${d.toFixed(4)}`);
    check(`aspect ${aspect.toFixed(2)}: fits vertically`,
      Math.sin(halfV) * d >= r - 1e-9);
    check(`aspect ${aspect.toFixed(2)}: fits horizontally`,
      Math.sin(halfH) * d >= r - 1e-9);
  }
}
{
  // Portrait viewports need the camera further back than landscape ones.
  const size = { x: 1, y: 1, z: 1 };
  check("portrait pulls camera further back than landscape",
    fitDistance(size, 0.5, 45) > fitDistance(size, 2, 45));
  check("padding scales the distance linearly",
    near(fitDistance(size, 1, 45, 2), fitDistance(size, 1, 45, 1) * 2, 1e-9));
  check("bad aspect (0) falls back to square, no Infinity",
    Number.isFinite(fitDistance(size, 0, 45)));
  check("bigger model → bigger distance",
    fitDistance({ x: 100, y: 100, z: 100 }, 1, 45) >
      fitDistance({ x: 10, y: 10, z: 10 }, 1, 45));
}

// 3) camera presets
console.log("\n[3] cameraPositionFor");
{
  for (const preset of VIEW_PRESETS) {
    const p = cameraPositionFor(preset, 12.5);
    check(`${preset}: sits exactly `.concat("12.5 from origin"), near(len(p), 12.5, 1e-9),
      `(${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)})`);
  }
  const top = cameraPositionFor("top", 10);
  check("top is not exactly on the Y axis (degenerate lookAt roll)", top.z !== 0);
  check("top is dominated by +Y", top.y > 9.99);
  const front = cameraPositionFor("front", 10);
  check("front looks down -Z", near(front.z, 10, 1e-9) && near(front.x, 0) && near(front.y, 0));
  const right = cameraPositionFor("right", 10);
  check("right looks down -X", near(right.x, 10, 1e-9) && near(right.y, 0) && near(right.z, 0));
  const iso = cameraPositionFor("iso", 10);
  check("iso is positive on all three axes", iso.x > 0 && iso.y > 0 && iso.z > 0);
}

// 4) size clamping
console.log("\n[4] clampSize");
{
  check("rounds", clampSize(1023.4) === 1023);
  check(`floors at ${SIZE_MIN}`, clampSize(1) === SIZE_MIN);
  check(`ceils at ${SIZE_MAX}`, clampSize(99999) === SIZE_MAX);
  check("NaN → min", clampSize(Number.NaN) === SIZE_MIN);
  check("Infinity → min", clampSize(Number.POSITIVE_INFINITY) === SIZE_MIN);
  check("negative → min", clampSize(-500) === SIZE_MIN);
}

// 5) formats
console.log("\n[5] formats");
{
  check("png keeps alpha", supportsAlpha("png"));
  check("webp keeps alpha", supportsAlpha("webp"));
  check("jpg has no alpha", !supportsAlpha("jpg"));
  check("every format has a mime", IMAGE_FORMATS.every((f) => IMAGE_MIME[f]?.startsWith("image/")));
  check("jpg mime is image/jpeg (not image/jpg)", IMAGE_MIME.jpg === "image/jpeg");
}

// 6) output naming
console.log("\n[6] outputName");
{
  check("swaps the extension", outputName("chair.stl", "png") === "chair.png");
  check("keeps dots inside the name",
    outputName("v1.2.final.obj", "jpg") === "v1.2.final.jpg");
  check("extensionless file gains one", outputName("model", "webp") === "model.webp");
  check("empty name falls back", outputName("", "png") === "model.png");
  check("dotfile-only falls back", outputName(".stl", "png") === "model.png");
  check("uppercase extension is replaced", outputName("PART.STL", "png") === "PART.png");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
