// Node test for lib/heightmap/image-to-mesh.ts heightfield → solid, focused on
// transparency: transparent pixels must sit at the base in every mode, and
// logo mode (shapeFromAlpha) raises the opaque shape flat to full height.
import { heightfieldToMesh, MODE_DEFAULTS, hasTransparentBackground, type Heightfield } from "../lib/heightmap/image-to-mesh";

let pass = 0;
let fail = 0;
function ok(cond: boolean, msg: string) {
  if (cond) pass++;
  else {
    fail++;
    console.log("FAIL:", msg);
  }
}

// 6×6 image: 2-px transparent border, 2×2 opaque centre. Centre colour varies.
function field(centreLum: number, transparent = true): Heightfield {
  const w = 6, h = 6;
  const lum = new Float32Array(w * h);
  const alpha = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inside = x >= 2 && x <= 3 && y >= 2 && y <= 3;
      const i = y * w + x;
      // Transparent pixels are composited over white by sampleLuminance → lum 1.
      lum[i] = inside ? centreLum : 1;
      alpha[i] = inside || !transparent ? 1 : 0;
    }
  }
  return { width: w, height: h, lum, rgb: new Float32Array(w * h * 3), alpha: transparent ? alpha : undefined };
}

// Top-surface Z per pixel (top grid is the first w*h vertices, rows flipped).
function topZ(f: Heightfield, opts: typeof MODE_DEFAULTS.relief) {
  const pos = heightfieldToMesh(f, opts).geometry.getAttribute("position");
  const z = (x: number, y: number) => pos.getZ((f.height - 1 - y) * f.width + x);
  return { border: z(0, 0), centre: z(2, 2) };
}

const relief = MODE_DEFAULTS.relief; // base 1, max 6
const litho = MODE_DEFAULTS.lithophane; // base 0.8, max 3, invert

// The bug: white-composited transparent border used to be the tallest part.
{
  const t = topZ(field(0), relief);
  ok(t.border === relief.baseThicknessMM, `relief: transparent border at base (got ${t.border})`);
  ok(t.centre === relief.baseThicknessMM, `relief: black opaque centre = base by brightness (got ${t.centre})`);
}
{
  const t = topZ(field(1), relief);
  ok(t.border === relief.baseThicknessMM, "relief: transparent border at base with white logo");
  ok(t.centre === relief.maxThicknessMM, `relief: white opaque centre at max (got ${t.centre})`);
}
// Logo mode: shape from opacity, colour irrelevant.
for (const lum of [0, 0.5, 1]) {
  const t = topZ(field(lum), { ...relief, shapeFromAlpha: true });
  ok(t.border === relief.baseThicknessMM && t.centre === relief.maxThicknessMM, `logo mode lum=${lum}: border base, centre max (${t.border}/${t.centre})`);
}
// Lithophane: transparent stays thin (base), dark opaque is thick.
{
  const t = topZ(field(0), litho);
  ok(Math.abs(t.border - litho.baseThicknessMM) < 1e-6, `litho: transparent at base (got ${t.border})`);
  ok(Math.abs(t.centre - litho.maxThicknessMM) < 1e-6, `litho: black centre thickest (got ${t.centre})`);
}
// No alpha channel (JPG / opaque PNG): behaviour unchanged — white border is tall.
{
  const t = topZ(field(0, false), relief);
  ok(t.border === relief.maxThicknessMM, "opaque image: white border tall as before");
  ok(t.centre === relief.baseThicknessMM, "opaque image: black centre low as before");
}
// Detection.
ok(hasTransparentBackground(field(0)), "cut-out PNG detected");
ok(!hasTransparentBackground(field(0, false)), "opaque image not flagged");
{
  const all = field(0);
  all.alpha!.fill(0);
  ok(!hasTransparentBackground(all), "fully transparent not flagged as logo");
}

console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
