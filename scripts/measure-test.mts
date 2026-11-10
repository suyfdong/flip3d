import {
  angleAtVertex,
  circleFromThreePoints,
  type Vec3,
} from "@/lib/measure/geometry";

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
const P = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** Rotate a point: Rz(γ)·Ry(β)·Rx(α). */
function rot(p: Vec3, ax: number, ay: number, az: number): Vec3 {
  const [cx, sx] = [Math.cos(ax), Math.sin(ax)];
  const [cy, sy] = [Math.cos(ay), Math.sin(ay)];
  const [cz, sz] = [Math.cos(az), Math.sin(az)];
  const p1 = P(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
  const p2 = P(p1.x * cy + p1.z * sy, p1.y, -p1.x * sy + p1.z * cy);
  return P(p2.x * cz - p2.y * sz, p2.x * sz + p2.y * cz, p2.z);
}

console.log("\n[1] angleAtVertex");
{
  const o = P(0, 0, 0);
  check("right angle = 90", near(angleAtVertex(P(1, 0, 0), o, P(0, 1, 0))!, 90));
  check(
    "equilateral = 60",
    near(angleAtVertex(P(1, 0, 0), o, P(0.5, Math.sqrt(3) / 2, 0))!, 60, 1e-6),
  );
  check("same direction = 0", near(angleAtVertex(P(1, 0, 0), o, P(2, 0, 0))!, 0, 1e-9));
  check("opposite = 180", near(angleAtVertex(P(1, 0, 0), o, P(-1, 0, 0))!, 180, 1e-9));
  check(
    "vertex in 2nd position, 3D arms",
    near(angleAtVertex(P(1, 2, 3), P(1, 1, 3), P(0, 1, 3))!, 90),
  );
  check("zero-length arm → null", angleAtVertex(P(0, 0, 0), o, P(0, 1, 0)) === null);
  check("two identical points → null", angleAtVertex(o, o, P(0, 1, 0)) === null);
  const r = rot(P(1, 0, 0), 0.3, 0.7, -1.1);
  const s = rot(P(0.5, Math.sqrt(3) / 2, 0), 0.3, 0.7, -1.1);
  check("rotation invariant: 60", near(angleAtVertex(r, o, s)!, 60, 1e-6));
}

console.log("\n[2] circleFromThreePoints — known circles");
{
  const circle = (r: number, angles: number[]) =>
    angles.map((t) => P(r * Math.cos(t), r * Math.sin(t), 0));
  const [a, b, c] = circle(5, [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]);
  const k = circleFromThreePoints(a, b, c)!;
  check("radius = 5", k !== null && near(k.radius, 5));
  check("centre at origin", k !== null && dist(k.center, P(0, 0, 0)) < 1e-9);
  check("normal is ±Z", k !== null && near(Math.abs(k.normal.z), 1));
  check(
    "all three points on the circle",
    k !== null && [a, b, c].every((p) => near(dist(p, k.center), k.radius)),
  );

  // Off-centre circle: centre (10, -4, 2), radius 3, arbitrary in-plane angles.
  const centre = P(10, -4, 2);
  const pts = [0.4, 2.2, 4.9].map((t) => P(10 + 3 * Math.cos(t), -4 + 3 * Math.sin(t), 2));
  const k2 = circleFromThreePoints(pts[0], pts[1], pts[2])!;
  check("off-centre: radius 3", k2 !== null && near(k2.radius, 3));
  check("off-centre: centre found", k2 !== null && dist(k2.center, centre) < 1e-9);

  // Tilted / rotated circle — the display wrapper rotates the model, so the
  // maths must not care.
  const rotPts = [0.4, 2.2, 4.9].map((t) =>
    rot(P(3 * Math.cos(t), 3 * Math.sin(t), 0), 0.3, 0.7, -1.1),
  );
  const k3 = circleFromThreePoints(rotPts[0], rotPts[1], rotPts[2])!;
  check("rotated plane: radius 3", k3 !== null && near(k3.radius, 3));
  check("rotated plane: centre at origin", k3 !== null && dist(k3.center, P(0, 0, 0)) < 1e-6);
  check("rotated plane: normal is unit", k3 !== null && near(Math.hypot(k3.normal.x, k3.normal.y, k3.normal.z), 1));
}

console.log("\n[3] circleFromThreePoints — rejections");
{
  check("collinear → null", circleFromThreePoints(P(0, 0, 0), P(1, 0, 0), P(2, 0, 0)) === null);
  check(
    "collinear 3D → null",
    circleFromThreePoints(P(0, 0, 0), P(1, 1, 1), P(2, 2, 2)) === null,
  );
  check("duplicate pair → null", circleFromThreePoints(P(0, 0, 0), P(0, 0, 0), P(1, 0, 0)) === null);
  check("all identical → null", circleFromThreePoints(P(1, 1, 1), P(1, 1, 1), P(1, 1, 1)) === null);
  check(
    "near-collinear (0.0001 off) → null",
    circleFromThreePoints(P(0, 0, 0), P(10, 0, 0), P(5, 0.0001, 0)) === null,
  );
  check(
    "slightly bent (0.05 off) still measures",
    circleFromThreePoints(P(0, 0, 0), P(10, 0, 0), P(5, 0.05, 0)) !== null,
  );
}

console.log("\n[4] scale robustness");
{
  for (const r of [0.005, 0.1, 25.4, 1000, 50000]) {
    const pts = [0.2, 2.1, 4.4].map((t) => P(r * Math.cos(t), r * Math.sin(t), 0));
    const k = circleFromThreePoints(pts[0], pts[1], pts[2]);
    check(`radius ${r} round-trips`, k !== null && near(k.radius / r, 1, 1e-9), k ? `→ ${k.radius.toPrecision(8)}` : "");
  }
}

console.log("\n[5] real-world case — M3 bolt hole (nominal ⌀3.0)");
{
  // Three points on a 1.5 mm-radius rim, in the XY plane, in millimetres.
  const pts = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((t) =>
    P(1.5 * Math.cos(t), 1.5 * Math.sin(t), 0),
  );
  const k = circleFromThreePoints(pts[0], pts[1], pts[2])!;
  check("diameter = 3.00 mm", near(k.radius * 2, 3));
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} passed`);
process.exit(fail === 0 ? 0 : 1);
