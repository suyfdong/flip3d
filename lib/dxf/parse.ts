/**
 * DXF reader — enough of the format to get real drawings into 3D.
 *
 * Supported entities: LINE, LWPOLYLINE, POLYLINE/VERTEX, CIRCLE, ARC, SPLINE
 * (as a polyline through its fit/control points), 3DFACE, and INSERT — block
 * references are expanded with their insertion point, scale and rotation, which
 * matters because a lot of real drawings keep every shape inside a block.
 *
 * Anything we don't handle (ELLIPSE, HATCH, polyface meshes, …) is counted and
 * reported rather than silently dropped, so the UI can say what was skipped.
 *
 * Pure text in, plain data out — no DOM, no three.js.
 */

import type { Point2, Polyline, Triangle3 } from "./write";

export type DxfDocument = {
  /** Every curve, tessellated into polylines. */
  polylines: Polyline[];
  /** 3DFACE triangles, if the file carries a faceted mesh. */
  faces: Triangle3[];
  /** Entity type → how many were skipped. */
  unsupported: Record<string, number>;
  /** True when at least one SPLINE was approximated by its defining points. */
  approximatedSplines: boolean;
  /** $INSUNITS from the header, if present (4 = mm, 1 = inches). */
  insUnits: number | null;
};

type Group = { code: number; value: string };

/** Split a DXF into (group code, value) pairs. */
function tokenize(text: string): Group[] {
  const lines = text.split(/\r\n|\r|\n/);
  const groups: Group[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    if (Number.isNaN(code)) {
      // Desync (a stray blank line) — resync by scanning for the next integer.
      i -= 1;
      continue;
    }
    groups.push({ code, value: lines[i + 1] });
  }
  return groups;
}

type RawEntity = { type: string; groups: Group[] };

/** Angle in degrees → tessellation step count for an arc of that sweep. */
function arcSteps(sweepDeg: number): number {
  return Math.max(8, Math.ceil((Math.abs(sweepDeg) / 360) * 72));
}

function num(g: Group | undefined, fallback = 0): number {
  if (!g) return fallback;
  const v = parseFloat(g.value.trim());
  return Number.isFinite(v) ? v : fallback;
}

function first(groups: Group[], code: number): Group | undefined {
  return groups.find((g) => g.code === code);
}

type Transform = {
  x: number;
  y: number;
  sx: number;
  sy: number;
  /** Rotation in radians. */
  rot: number;
};

const IDENTITY: Transform = { x: 0, y: 0, sx: 1, sy: 1, rot: 0 };

function apply(t: Transform, p: Point2): Point2 {
  const x = p[0] * t.sx;
  const y = p[1] * t.sy;
  const c = Math.cos(t.rot);
  const s = Math.sin(t.rot);
  return [t.x + x * c - y * s, t.y + x * s + y * c];
}

function circlePoints(cx: number, cy: number, r: number): Point2[] {
  const steps = 72;
  const pts: Point2[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function arcPoints(
  cx: number, cy: number, r: number,
  startDeg: number, endDeg: number,
): Point2[] {
  // DXF arcs always sweep counter-clockwise from start to end.
  let sweep = endDeg - startDeg;
  while (sweep <= 0) sweep += 360;
  const steps = arcSteps(sweep);
  const pts: Point2[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((startDeg + (sweep * i) / steps) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/** Pull LWPOLYLINE vertices: 10/20 pairs in file order. */
function lwPolylinePoints(groups: Group[]): Point2[] {
  const pts: Point2[] = [];
  let pendingX: number | null = null;
  for (const g of groups) {
    if (g.code === 10) pendingX = parseFloat(g.value.trim());
    else if (g.code === 20 && pendingX !== null) {
      pts.push([pendingX, parseFloat(g.value.trim())]);
      pendingX = null;
    }
  }
  return pts.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}

/**
 * SPLINE approximation. We connect the fit points when the file has them
 * (they lie on the curve), otherwise the control points (which don't, so the
 * result is a rougher hull). Either way it's an approximation and the caller
 * is told so.
 */
function splinePoints(groups: Group[]): Point2[] {
  const fit: Point2[] = [];
  let px: number | null = null;
  for (const g of groups) {
    if (g.code === 11) px = parseFloat(g.value.trim());
    else if (g.code === 21 && px !== null) {
      fit.push([px, parseFloat(g.value.trim())]);
      px = null;
    }
  }
  if (fit.length >= 2) return fit;
  return lwPolylinePoints(groups);
}

/** Group the ENTITIES/BLOCKS stream into entities, keeping POLYLINE's VERTEX run. */
function collectEntities(groups: Group[], from: number, to: number): RawEntity[] {
  const out: RawEntity[] = [];
  let cur: RawEntity | null = null;
  let polyline: RawEntity | null = null;

  for (let i = from; i < to; i++) {
    const g = groups[i];
    if (g.code === 0) {
      const type = g.value.trim().toUpperCase();
      if (polyline) {
        if (type === "VERTEX") {
          cur = { type: "VERTEX", groups: [] };
          polyline.groups.push({ code: -1, value: "VERTEX" });
          out.push(cur);
          continue;
        }
        if (type === "SEQEND") {
          polyline = null;
          cur = null;
          continue;
        }
      }
      cur = { type, groups: [] };
      out.push(cur);
      if (type === "POLYLINE") polyline = cur;
      continue;
    }
    if (cur) cur.groups.push(g);
  }
  return out;
}

function sectionRange(groups: Group[], name: string): [number, number] | null {
  for (let i = 0; i < groups.length - 1; i++) {
    if (groups[i].code === 0 && groups[i].value.trim().toUpperCase() === "SECTION" &&
        groups[i + 1].code === 2 && groups[i + 1].value.trim().toUpperCase() === name) {
      for (let j = i + 2; j < groups.length; j++) {
        if (groups[j].code === 0 && groups[j].value.trim().toUpperCase() === "ENDSEC") {
          return [i + 2, j];
        }
      }
      return [i + 2, groups.length];
    }
  }
  return null;
}

/** Split the BLOCKS section into name → entity list. */
function parseBlocks(groups: Group[]): Map<string, RawEntity[]> {
  const blocks = new Map<string, RawEntity[]>();
  const range = sectionRange(groups, "BLOCKS");
  if (!range) return blocks;

  const [from, to] = range;
  let name: string | null = null;
  let start = -1;
  for (let i = from; i < to; i++) {
    const g = groups[i];
    if (g.code !== 0) continue;
    const type = g.value.trim().toUpperCase();
    if (type === "BLOCK") {
      const nameGroup = groups.slice(i, Math.min(i + 20, to)).find((x) => x.code === 2);
      name = nameGroup ? nameGroup.value.trim() : null;
      start = i + 1;
    } else if (type === "ENDBLK" && name && start >= 0) {
      blocks.set(name.toUpperCase(), collectEntities(groups, start, i));
      name = null;
      start = -1;
    }
  }
  return blocks;
}

type Sink = {
  polylines: Polyline[];
  faces: Triangle3[];
  unsupported: Record<string, number>;
  splineSeen: boolean;
};

const IGNORED_SILENTLY = new Set([
  "VERTEX", "SEQEND", "ENDBLK", "BLOCK", "ATTRIB", "ATTDEF",
  "VIEWPORT", "DIMENSION", "TEXT", "MTEXT", "POINT",
]);

function emitEntities(
  entities: RawEntity[],
  blocks: Map<string, RawEntity[]>,
  t: Transform,
  sink: Sink,
  depth: number,
): void {
  const push = (points: Point2[], closed: boolean) => {
    if (points.length < 2) return;
    sink.polylines.push({ points: points.map((p) => apply(t, p)), closed });
  };

  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    switch (e.type) {
      case "LINE": {
        push(
          [
            [num(first(e.groups, 10)), num(first(e.groups, 20))],
            [num(first(e.groups, 11)), num(first(e.groups, 21))],
          ],
          false,
        );
        break;
      }
      case "LWPOLYLINE": {
        const flags = num(first(e.groups, 70));
        push(lwPolylinePoints(e.groups), (flags & 1) === 1);
        break;
      }
      case "POLYLINE": {
        const flags = num(first(e.groups, 70));
        // Bit 64 = polyface mesh, bit 16 = polygon mesh — vertex/face indexing
        // we don't decode. Report rather than emit a wrong outline.
        if ((flags & 64) === 64 || (flags & 16) === 16) {
          sink.unsupported["POLYLINE (mesh)"] =
            (sink.unsupported["POLYLINE (mesh)"] ?? 0) + 1;
          break;
        }
        const pts: Point2[] = [];
        for (let j = i + 1; j < entities.length && entities[j].type === "VERTEX"; j++) {
          pts.push([num(first(entities[j].groups, 10)), num(first(entities[j].groups, 20))]);
        }
        push(pts, (flags & 1) === 1);
        break;
      }
      case "CIRCLE": {
        push(
          circlePoints(
            num(first(e.groups, 10)),
            num(first(e.groups, 20)),
            num(first(e.groups, 40)),
          ),
          true,
        );
        break;
      }
      case "ARC": {
        push(
          arcPoints(
            num(first(e.groups, 10)),
            num(first(e.groups, 20)),
            num(first(e.groups, 40)),
            num(first(e.groups, 50)),
            num(first(e.groups, 51)),
          ),
          false,
        );
        break;
      }
      case "SPLINE": {
        const pts = splinePoints(e.groups);
        if (pts.length >= 2) {
          sink.splineSeen = true;
          const flags = num(first(e.groups, 70));
          push(pts, (flags & 1) === 1);
        }
        break;
      }
      case "3DFACE": {
        const p = (a: number, b: number, c: number): [number, number, number] => {
          const xy = apply(t, [num(first(e.groups, a)), num(first(e.groups, b))]);
          return [xy[0], xy[1], num(first(e.groups, c))];
        };
        const v0 = p(10, 20, 30);
        const v1 = p(11, 21, 31);
        const v2 = p(12, 22, 32);
        const v3 = p(13, 23, 33);
        sink.faces.push([v0, v1, v2]);
        // A real quad (4th corner distinct) becomes a second triangle.
        const same =
          Math.abs(v3[0] - v2[0]) < 1e-9 &&
          Math.abs(v3[1] - v2[1]) < 1e-9 &&
          Math.abs(v3[2] - v2[2]) < 1e-9;
        if (!same) sink.faces.push([v0, v2, v3]);
        break;
      }
      case "INSERT": {
        const name = (first(e.groups, 2)?.value ?? "").trim().toUpperCase();
        const block = blocks.get(name);
        if (!block || depth > 8) {
          sink.unsupported["INSERT"] = (sink.unsupported["INSERT"] ?? 0) + 1;
          break;
        }
        const local: Transform = {
          x: num(first(e.groups, 10)),
          y: num(first(e.groups, 20)),
          sx: num(first(e.groups, 41), 1) || 1,
          sy: num(first(e.groups, 42), 1) || 1,
          rot: (num(first(e.groups, 50)) * Math.PI) / 180,
        };
        // Compose parent ∘ local so nested blocks land in the right place.
        const origin = apply(t, [local.x, local.y]);
        const composed: Transform = {
          x: origin[0],
          y: origin[1],
          sx: t.sx * local.sx,
          sy: t.sy * local.sy,
          rot: t.rot + local.rot,
        };
        emitEntities(block, blocks, composed, sink, depth + 1);
        break;
      }
      default: {
        if (!IGNORED_SILENTLY.has(e.type)) {
          sink.unsupported[e.type] = (sink.unsupported[e.type] ?? 0) + 1;
        }
      }
    }
  }
}

export function parseDxf(text: string): DxfDocument {
  if (!/\bSECTION\b/.test(text) && !/\bEOF\b/.test(text)) {
    throw new Error(
      "This doesn't look like a DXF file. Binary DXF and DWG aren't supported — re-export as ASCII DXF (R12 or later).",
    );
  }
  const groups = tokenize(text);

  const insUnitsIdx = groups.findIndex(
    (g) => g.code === 9 && g.value.trim().toUpperCase() === "$INSUNITS",
  );
  const insUnits =
    insUnitsIdx >= 0 && groups[insUnitsIdx + 1]
      ? num(groups[insUnitsIdx + 1], 0) || null
      : null;

  const blocks = parseBlocks(groups);
  const range = sectionRange(groups, "ENTITIES");
  const entities = range ? collectEntities(groups, range[0], range[1]) : [];

  const sink: Sink = {
    polylines: [],
    faces: [],
    unsupported: {},
    splineSeen: false,
  };
  emitEntities(entities, blocks, IDENTITY, sink, 0);

  if (sink.polylines.length === 0 && sink.faces.length === 0) {
    const skipped = Object.keys(sink.unsupported);
    throw new Error(
      skipped.length
        ? `No usable geometry found. The drawing only contains entities we can't read yet: ${skipped.join(", ")}.`
        : "No geometry found in this DXF — the ENTITIES section is empty.",
    );
  }

  return {
    polylines: sink.polylines,
    faces: sink.faces,
    unsupported: sink.unsupported,
    approximatedSplines: sink.splineSeen,
    insUnits,
  };
}

/**
 * Weld the drawing's line work into closed loops.
 *
 * Drawings are usually a soup of separate LINE and ARC entities that only form
 * a shape once their endpoints are joined, so we chain on a tolerance derived
 * from the drawing size. Chains that never close are returned separately —
 * they can't be extruded into a solid, and the caller says so instead of
 * quietly producing a broken model.
 */
export function dxfToLoops(
  doc: DxfDocument,
  toleranceScale = 1e-4,
): { loops: Point2[][]; openChains: Point2[][] } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of doc.polylines) {
    for (const [x, y] of p.points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const span = Math.max(maxX - minX, maxY - minY, 1e-6);
  const tol = span * toleranceScale;
  const q = (v: number) => Math.round(v / tol);
  const key = (p: Point2) => `${q(p[0])},${q(p[1])}`;

  const loops: Point2[][] = [];
  const openChains: Point2[][] = [];
  const open: Array<Point2[]> = [];

  // Already-closed polylines go straight through.
  for (const p of doc.polylines) {
    if (p.closed && p.points.length >= 3) loops.push(p.points);
    else if (p.points.length >= 2) open.push(p.points);
  }

  // Index open chains by both endpoints, then walk them end to end.
  const byStart = new Map<string, number[]>();
  const add = (m: Map<string, number[]>, k: string, i: number) => {
    const l = m.get(k);
    if (l) l.push(i);
    else m.set(k, [i]);
  };
  open.forEach((chain, i) => {
    add(byStart, key(chain[0]), i);
    add(byStart, key(chain[chain.length - 1]), i);
  });

  const used = new Uint8Array(open.length);
  for (let i = 0; i < open.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    let pts = open[i].slice();

    for (;;) {
      const tail = key(pts[pts.length - 1]);
      if (tail === key(pts[0]) && pts.length >= 3) break;
      const candidates = byStart.get(tail) ?? [];
      let nextIdx = -1;
      for (const c of candidates) if (!used[c]) { nextIdx = c; break; }
      if (nextIdx < 0) break;

      used[nextIdx] = 1;
      const next = open[nextIdx];
      const forward = key(next[0]) === tail;
      const piece = forward ? next : next.slice().reverse();
      pts = pts.concat(piece.slice(1));
    }

    const closed = key(pts[0]) === key(pts[pts.length - 1]);
    if (closed && pts.length >= 4) {
      pts.pop(); // drop the duplicated closing point
      loops.push(pts);
    } else if (closed && pts.length === 3) {
      loops.push(pts);
    } else {
      openChains.push(pts);
    }
  }

  return { loops, openChains };
}
