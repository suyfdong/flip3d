/**
 * Minimal DXF writer (AutoCAD R12 / AC1009 ASCII).
 *
 * R12 is the most widely accepted DXF flavour — LightBurn, LaserGRBL, Inkscape,
 * Illustrator, Fusion 360 and every CAM package read it. We deliberately avoid
 * LWPOLYLINE (R14+) and stick to POLYLINE/VERTEX/SEQEND so older laser and CNC
 * software doesn't reject the file.
 *
 * Two entity modes:
 *  - `writeDxfPolylines` — 2D closed/open polylines (laser cutting, CNC, plotting)
 *  - `writeDxf3dFaces`   — 3D triangles as 3DFACE entities (mesh handoff to CAD)
 *
 * Pure string building with no DOM or three.js dependency, so it runs in Node
 * and is unit-testable.
 */

export type Point2 = [number, number];

export type Polyline = {
  points: Point2[];
  closed: boolean;
};

export type Triangle3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export type DxfWriteOptions = {
  /** Layer name every entity is written to. */
  layer?: string;
  /**
   * $INSUNITS value written into the header. 4 = millimetres, 1 = inches.
   * Ignored by R12-era readers but respected by modern CAM software.
   */
  units?: "mm" | "in";
};

/** DXF numbers: fixed decimals, no exponent notation (some readers choke on 1e-7). */
function num(n: number): string {
  if (!Number.isFinite(n)) return "0.0";
  const s = n.toFixed(6);
  // Normalise "-0.000000" so files are byte-stable across platforms.
  return s === "-0.000000" ? "0.000000" : s;
}

/** One group code + value pair. DXF is strictly two lines per pair. */
function pair(code: number, value: string | number): string {
  return `${code}\n${value}\n`;
}

const INSUNITS = { mm: 4, in: 1 } as const;

function header(
  min: [number, number, number],
  max: [number, number, number],
  units: "mm" | "in",
): string {
  return (
    pair(0, "SECTION") +
    pair(2, "HEADER") +
    pair(9, "$ACADVER") +
    pair(1, "AC1009") +
    pair(9, "$INSUNITS") +
    pair(70, INSUNITS[units]) +
    pair(9, "$INSBASE") +
    pair(10, num(0)) +
    pair(20, num(0)) +
    pair(30, num(0)) +
    pair(9, "$EXTMIN") +
    pair(10, num(min[0])) +
    pair(20, num(min[1])) +
    pair(30, num(min[2])) +
    pair(9, "$EXTMAX") +
    pair(10, num(max[0])) +
    pair(20, num(max[1])) +
    pair(30, num(max[2])) +
    pair(0, "ENDSEC")
  );
}

function tables(layer: string): string {
  return (
    pair(0, "SECTION") +
    pair(2, "TABLES") +
    // Linetype table — a single CONTINUOUS entry, referenced by the layer.
    pair(0, "TABLE") +
    pair(2, "LTYPE") +
    pair(70, 1) +
    pair(0, "LTYPE") +
    pair(2, "CONTINUOUS") +
    pair(70, 0) +
    pair(3, "Solid line") +
    pair(72, 65) +
    pair(73, 0) +
    pair(40, num(0)) +
    pair(0, "ENDTAB") +
    // Layer table — layer 0 plus ours (colour 7 = white/black by background).
    pair(0, "TABLE") +
    pair(2, "LAYER") +
    pair(70, 1) +
    pair(0, "LAYER") +
    pair(2, layer) +
    pair(70, 0) +
    pair(62, 7) +
    pair(6, "CONTINUOUS") +
    pair(0, "ENDTAB") +
    pair(0, "ENDSEC")
  );
}

function polylineEntity(poly: Polyline, layer: string): string {
  // 66 = "vertices follow", 70 bit 1 = closed polyline.
  let out =
    pair(0, "POLYLINE") +
    pair(8, layer) +
    pair(66, 1) +
    pair(70, poly.closed ? 1 : 0) +
    pair(10, num(0)) +
    pair(20, num(0)) +
    pair(30, num(0));
  for (const [x, y] of poly.points) {
    out +=
      pair(0, "VERTEX") +
      pair(8, layer) +
      pair(10, num(x)) +
      pair(20, num(y)) +
      pair(30, num(0));
  }
  out += pair(0, "SEQEND") + pair(8, layer);
  return out;
}

function faceEntity(tri: Triangle3, layer: string): string {
  const [a, b, c] = tri;
  // A 3DFACE is a quad; a triangle repeats its third corner as the fourth.
  return (
    pair(0, "3DFACE") +
    pair(8, layer) +
    pair(10, num(a[0])) + pair(20, num(a[1])) + pair(30, num(a[2])) +
    pair(11, num(b[0])) + pair(21, num(b[1])) + pair(31, num(b[2])) +
    pair(12, num(c[0])) + pair(22, num(c[1])) + pair(32, num(c[2])) +
    pair(13, num(c[0])) + pair(23, num(c[1])) + pair(33, num(c[2]))
  );
}

function bounds2(polys: Polyline[]): {
  min: [number, number, number];
  max: [number, number, number];
} {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of polys) {
    for (const [x, y] of p.points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (!Number.isFinite(minX)) return { min: [0, 0, 0], max: [0, 0, 0] };
  return { min: [minX, minY, 0], max: [maxX, maxY, 0] };
}

function bounds3(tris: Triangle3[]): {
  min: [number, number, number];
  max: [number, number, number];
} {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const t of tris) {
    for (const v of t) {
      for (let k = 0; k < 3; k++) {
        if (v[k] < min[k]) min[k] = v[k];
        if (v[k] > max[k]) max[k] = v[k];
      }
    }
  }
  if (!Number.isFinite(min[0])) return { min: [0, 0, 0], max: [0, 0, 0] };
  return { min, max };
}

/** Serialise 2D polylines as an R12 DXF drawing. */
export function writeDxfPolylines(
  polys: Polyline[],
  opts: DxfWriteOptions = {},
): string {
  const layer = opts.layer ?? "0";
  const units = opts.units ?? "mm";
  const usable = polys.filter((p) => p.points.length >= 2);
  const { min, max } = bounds2(usable);

  let out = header(min, max, units) + tables(layer);
  out += pair(0, "SECTION") + pair(2, "ENTITIES");
  for (const p of usable) out += polylineEntity(p, layer);
  out += pair(0, "ENDSEC") + pair(0, "EOF");
  return out;
}

/** Serialise triangles as 3DFACE entities — a mesh a CAD package can import. */
export function writeDxf3dFaces(
  tris: Triangle3[],
  opts: DxfWriteOptions = {},
): string {
  const layer = opts.layer ?? "0";
  const units = opts.units ?? "mm";
  const { min, max } = bounds3(tris);

  let out = header(min, max, units) + tables(layer);
  out += pair(0, "SECTION") + pair(2, "ENTITIES");
  for (const t of tris) out += faceEntity(t, layer);
  out += pair(0, "ENDSEC") + pair(0, "EOF");
  return out;
}
