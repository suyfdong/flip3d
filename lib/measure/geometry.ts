/**
 * Pure 3D measurement maths for the viewer overlay.
 *
 * Points are plain `{x, y, z}` objects so this module carries no three.js and
 * runs (and is tested) in Node. Angles, radii and circumcentres are invariant
 * under rotation and translation, so callers do not need to undo the display
 * wrapper's transform before calling in — only the returned centre matters for
 * display, and that one is mapped by the caller.
 */

export type Vec3 = { x: number; y: number; z: number };

/** Below this, an edge is treated as a zero-length arm. */
const LENGTH_EPS = 1e-9;
/**
 * Triangle "flatness" below this (2 × area relative to the longest edge²) is
 * collinear. 1e-4 ≈ a height-to-base ratio of 0.0001: far flatter than any
 * hand-picked hole rim, far stricter than float noise.
 */
const FLAT_EPS = 1e-4;

const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);
const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

/**
 * Angle at vertex `b`, between the arms b→a and b→c, in degrees (0–180).
 * Returns null when either arm has (near) zero length.
 */
export function angleAtVertex(a: Vec3, b: Vec3, c: Vec3): number | null {
  const u = sub(a, b);
  const v = sub(c, b);
  const lu = len(u);
  const lv = len(v);
  if (lu < LENGTH_EPS || lv < LENGTH_EPS) return null;
  const cos = dot(u, v) / (lu * lv);
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}

export type Circle3D = {
  center: Vec3;
  radius: number;
  /** Unit normal of the plane the three points lie in. */
  normal: Vec3;
};

/**
 * Circumcircle of three points — the "pick three points on the rim of a hole"
 * measurement. Returns null when the points are too close to collinear for a
 * unique circle (including duplicate points).
 */
export function circleFromThreePoints(a: Vec3, b: Vec3, c: Vec3): Circle3D | null {
  const ab = sub(b, a);
  const ac = sub(c, a);
  const abLen = len(ab);
  const acLen = len(ac);
  const bcLen = len(sub(c, b));
  const scale = Math.max(abLen, acLen, bcLen);
  if (scale < LENGTH_EPS) return null;

  const n = cross(ab, ac);
  const twiceArea = len(n); // |ab × ac| = 2 × triangle area
  if (twiceArea < FLAT_EPS * scale * scale) return null;

  // In-plane basis: u along ab, v perpendicular to it inside the same plane.
  if (abLen < LENGTH_EPS) return null;
  const u = mul(ab, 1 / abLen);
  const acAlongU = dot(ac, u);
  const w = sub(ac, mul(u, acAlongU));
  const wLen = len(w);
  if (wLen < LENGTH_EPS) return null;
  const v = mul(w, 1 / wLen);

  // Coordinates in that basis: a = (0,0), b = (bx,0), c = (cx,cy).
  const bx = abLen;
  const cx = acAlongU;
  const cy = wLen;
  // Perpendicular bisector of a–b is x = bx/2; solving for y gives the centre.
  const x = bx / 2;
  const y = (cx * cx - bx * cx + cy * cy) / (2 * cy);

  return {
    center: add(add(a, mul(u, x)), mul(v, y)),
    radius: Math.hypot(x, y),
    normal: mul(n, 1 / twiceArea),
  };
}
