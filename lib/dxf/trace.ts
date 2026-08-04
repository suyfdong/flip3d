/**
 * Bitmap → 2D outline tracing, for JPG/PNG → DXF.
 *
 * What this actually does (and what it doesn't):
 *  - The image is reduced to black/white by a brightness threshold, then the
 *    boundary between "ink" and "background" is followed exactly along pixel
 *    edges and simplified into polylines.
 *  - The result is a *polyline* trace, not a curve-fitted vector artwork. It's
 *    the right output for laser cutting, CNC and plotting; it is not an
 *    auto-traced Illustrator path with Béziers, and we don't claim it is.
 *  - Photographs with soft gradients threshold poorly. High-contrast logos,
 *    silhouettes, stencils and line art are what this is for.
 *
 * Pure arrays in, pure arrays out — no DOM, no three.js — so it runs in Node
 * and is unit-testable.
 */

import type { Point2, Polyline } from "./write";

export type TraceOptions = {
  /** 0-255 brightness cut. Pixels darker than this are "ink". */
  threshold: number;
  /** Treat light pixels as ink instead of dark ones. */
  invert: boolean;
  /** Douglas-Peucker tolerance in pixels. Higher = fewer, straighter segments. */
  simplifyPx: number;
  /** Drop traced islands smaller than this many pixels of area (speckle filter). */
  minAreaPx: number;
  /** Physical width of the finished drawing in mm; height follows the aspect. */
  widthMM: number;
};

export const DEFAULT_TRACE: TraceOptions = {
  threshold: 128,
  invert: false,
  simplifyPx: 1.2,
  minAreaPx: 24,
  widthMM: 100,
};

export const THRESHOLD_MIN = 1;
export const THRESHOLD_MAX = 254;
export const SIMPLIFY_MIN = 0;
export const SIMPLIFY_MAX = 6;
export const WIDTH_MIN = 10;
export const WIDTH_MAX = 1000;

/** Minimal image shape — matches ImageData, but constructible in Node. */
export type RgbaImage = {
  data: Uint8ClampedArray | Uint8Array | number[];
  width: number;
  height: number;
};

export type TraceResult = {
  polylines: Polyline[];
  /** Loops kept after the speckle filter. */
  loopCount: number;
  /** Total vertices across all loops, after simplification. */
  pointCount: number;
  /** Finished drawing size in mm: [x, y]. */
  sizeMM: [number, number];
  /** The brightness cut actually used (equals opts.threshold unless auto-picked). */
  thresholdUsed: number;
};

/** Rec. 601 luma. Fully transparent pixels count as background. */
function luminanceMask(img: RgbaImage, threshold: number, invert: boolean): Uint8Array {
  const { data, width, height } = img;
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    // Flip vertically: image row 0 is the top, but CAD Y points up.
    const srcRow = (height - 1 - y) * width;
    const dstRow = y * width;
    for (let x = 0; x < width; x++) {
      const i = (srcRow + x) * 4;
      const alpha = data[i + 3];
      let ink: boolean;
      if (alpha < 128) {
        ink = false;
      } else {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        ink = lum < threshold;
      }
      mask[dstRow + x] = (invert ? !ink : ink) ? 1 : 0;
    }
  }
  return mask;
}

/**
 * Otsu's method — picks the brightness cut that best separates the histogram
 * into two clusters. Used when the caller asks for an automatic threshold.
 */
export function autoThreshold(img: RgbaImage): number {
  const hist = new Array(256).fill(0);
  const { data, width, height } = img;
  let total = 0;
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    if (data[i + 3] < 128) continue;
    const lum = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
    );
    hist[Math.min(255, Math.max(0, lum))]++;
    total++;
  }
  if (total === 0) return 128;

  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0, wB = 0, best = 0, bestVar = -1;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > bestVar) {
      bestVar = between;
      best = t;
    }
  }
  // Otsu returns the last bin of the dark cluster; cut just above it.
  return Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, best + 1));
}

// Direction encoding: 0 = +x, 1 = +y, 2 = -x, 3 = -y.
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

type Edge = { x: number; y: number; dir: number; used: boolean };

/**
 * Follow the crack between ink and background, emitting closed loops.
 *
 * Every boundary edge is emitted with the ink on its LEFT, so outer loops come
 * out counter-clockwise and holes clockwise — the orientation CAD and slicers
 * expect. At a saddle (two ink pixels touching only at a corner) we turn right,
 * which keeps diagonally-touching ink in one loop instead of splitting it.
 */
function traceCracks(mask: Uint8Array, w: number, h: number): Point2[][] {
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h ? 0 : mask[y * w + x];

  const edges: Edge[] = [];
  // Lattice point (x, y) with 0 <= x <= w, 0 <= y <= h.
  const key = (x: number, y: number) => y * (w + 1) + x;
  const outgoing = new Map<number, number[]>();

  const addEdge = (x: number, y: number, dir: number) => {
    const idx = edges.length;
    edges.push({ x, y, dir, used: false });
    const k = key(x, y);
    const list = outgoing.get(k);
    if (list) list.push(idx);
    else outgoing.set(k, [idx]);
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue;
      if (!at(x, y - 1)) addEdge(x, y, 0); // bottom edge, walk +x
      if (!at(x + 1, y)) addEdge(x + 1, y, 1); // right edge, walk +y
      if (!at(x, y + 1)) addEdge(x + 1, y + 1, 2); // top edge, walk -x
      if (!at(x - 1, y)) addEdge(x, y + 1, 3); // left edge, walk -y
    }
  }

  const loops: Point2[][] = [];
  for (let start = 0; start < edges.length; start++) {
    if (edges[start].used) continue;

    const pts: Point2[] = [];
    let cur = start;
    const startX = edges[start].x;
    const startY = edges[start].y;

    for (;;) {
      const e = edges[cur];
      e.used = true;
      pts.push([e.x, e.y]);

      const nx = e.x + DX[e.dir];
      const ny = e.y + DY[e.dir];
      if (nx === startX && ny === startY) break;

      const candidates = outgoing.get(key(nx, ny));
      if (!candidates) break; // shouldn't happen on a well-formed mask
      // Prefer turning right, then straight, then left, then back.
      let next = -1;
      for (const turn of [3, 0, 1, 2]) {
        const want = (e.dir + turn) % 4;
        for (const c of candidates) {
          if (!edges[c].used && edges[c].dir === want) {
            next = c;
            break;
          }
        }
        if (next >= 0) break;
      }
      if (next < 0) break;
      cur = next;
    }

    if (pts.length >= 4) loops.push(pts);
  }
  return loops;
}

/** Shoelace area; positive = counter-clockwise. */
export function signedArea(pts: Point2[]): number {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function perpDistance(p: Point2, a: Point2, b: Point2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-12) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len;
}

/** Ramer-Douglas-Peucker on an open polyline (endpoints are always kept). */
export function simplify(pts: Point2[], epsilon: number): Point2[] {
  if (epsilon <= 0 || pts.length < 3) return pts.slice();

  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;

  const stack: Array<[number, number]> = [[0, pts.length - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop()!;
    if (hi - lo < 2) continue;
    let far = -1;
    let maxD = epsilon;
    for (let i = lo + 1; i < hi; i++) {
      const d = perpDistance(pts[i], pts[lo], pts[hi]);
      if (d > maxD) {
        maxD = d;
        far = i;
      }
    }
    if (far > 0) {
      keep[far] = 1;
      stack.push([lo, far], [far, hi]);
    }
  }

  const out: Point2[] = [];
  for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i]);
  return out;
}

/**
 * Simplify a closed loop. The loop is rotated to start at the point farthest
 * from its centroid before running RDP, so the fixed endpoint lands on a real
 * corner instead of pinning an arbitrary spot on a straight run.
 */
function simplifyClosed(pts: Point2[], epsilon: number): Point2[] {
  if (epsilon <= 0 || pts.length < 4) return pts.slice();

  let cx = 0, cy = 0;
  for (const [x, y] of pts) {
    cx += x;
    cy += y;
  }
  cx /= pts.length;
  cy /= pts.length;

  let anchor = 0;
  let best = -1;
  for (let i = 0; i < pts.length; i++) {
    const d = (pts[i][0] - cx) ** 2 + (pts[i][1] - cy) ** 2;
    if (d > best) {
      best = d;
      anchor = i;
    }
  }

  const rotated = pts.slice(anchor).concat(pts.slice(0, anchor));
  rotated.push(rotated[0]); // close it so RDP keeps the seam point
  const simplified = simplify(rotated, epsilon);
  simplified.pop(); // drop the duplicated closing point
  return simplified;
}

/** Trace an image into DXF-ready closed polylines, scaled to millimetres. */
export function traceImage(img: RgbaImage, opts: TraceOptions): TraceResult {
  const { width: w, height: h } = img;
  if (w < 2 || h < 2) throw new Error("Image is too small to trace.");

  const threshold = Math.min(
    THRESHOLD_MAX,
    Math.max(THRESHOLD_MIN, Math.round(opts.threshold)),
  );
  const mask = luminanceMask(img, threshold, opts.invert);

  let ink = 0;
  for (let i = 0; i < mask.length; i++) ink += mask[i];
  if (ink === 0) {
    throw new Error(
      "Nothing to trace — every pixel fell on the background side of the threshold. Try moving the threshold slider, or tick Invert.",
    );
  }
  if (ink === mask.length) {
    throw new Error(
      "Nothing to trace — every pixel came out as ink, so there's no outline. Try moving the threshold slider, or tick Invert.",
    );
  }

  const raw = traceCracks(mask, w, h);

  const scale = opts.widthMM / w;
  const polylines: Polyline[] = [];
  let pointCount = 0;
  for (const loop of raw) {
    if (Math.abs(signedArea(loop)) < opts.minAreaPx) continue;
    const simplified = simplifyClosed(loop, opts.simplifyPx);
    if (simplified.length < 3) continue;
    polylines.push({
      points: simplified.map(([x, y]) => [x * scale, y * scale] as Point2),
      closed: true,
    });
    pointCount += simplified.length;
  }

  if (polylines.length === 0) {
    throw new Error(
      "No shapes survived tracing. The image may be too noisy, or every island smaller than the speckle filter — try lowering 'Ignore specks'.",
    );
  }

  return {
    polylines,
    loopCount: polylines.length,
    pointCount,
    sizeMM: [opts.widthMM, (h / w) * opts.widthMM],
    thresholdUsed: threshold,
  };
}
