export type GcodeMove = {
  // absolute end position (mm)
  x: number;
  y: number;
  z: number;
  e: number;
  f: number; // feedrate, mm/min
  // delta vs previous position
  dx: number;
  dy: number;
  dz: number;
  de: number;
  // helpers
  isExtrusion: boolean;
  layer: number; // -1 when unknown
  lineIndex: number; // index in source file
  // remembered prior endpoint so we can build line segments without an extra pass
  px: number;
  py: number;
  pz: number;
};

export type ParsedGcode = {
  moves: GcodeMove[];
  bbox: { min: [number, number, number]; max: [number, number, number] };
  layerCount: number;
  totalLines: number;
  detectedSlicer: string | null;
};

const SLICER_FINGERPRINTS: Array<{ slicer: string; pattern: RegExp }> = [
  { slicer: "Bambu Studio", pattern: /BambuStudio|BambuLab|Bambu Lab/i },
  { slicer: "OrcaSlicer", pattern: /OrcaSlicer/i },
  { slicer: "PrusaSlicer", pattern: /PrusaSlicer|Slic3r PE/i },
  { slicer: "Cura", pattern: /Generated with Cura|UltiMaker|;FLAVOR:/i },
  { slicer: "SuperSlicer", pattern: /SuperSlicer/i },
];

/**
 * Points along a G2 (clockwise) / G3 (counter-clockwise) arc in the XY plane,
 * excluding the start and ending exactly on (ex, ey). Centre from I/J offsets,
 * or from R (negative R = the long way round), following Marlin's maths.
 * Chords are at most 0.5 mm; a zero-length arc with I/J is a full circle.
 */
export function arcPoints(
  px: number, py: number, ex: number, ey: number,
  I: number, J: number, R: number | null, clockwise: boolean,
): Array<[number, number]> {
  let cx: number, cy: number;
  if (R !== null && I === 0 && J === 0) {
    const dx = ex - px, dy = ey - py;
    const d = Math.hypot(dx, dy);
    if (d === 0) return [[ex, ey]];
    const h2 = (R - d / 2) * (R + d / 2);
    const h = h2 > 0 ? Math.sqrt(h2) : 0;
    const sign = clockwise !== R < 0 ? -1 : 1;
    cx = (px + ex) / 2 + sign * h * (-dy / d);
    cy = (py + ey) / 2 + sign * h * (dx / d);
  } else {
    cx = px + I;
    cy = py + J;
  }
  const r = Math.hypot(px - cx, py - cy);
  if (r === 0) return [[ex, ey]];
  const a0 = Math.atan2(py - cy, px - cx);
  const a1 = Math.atan2(ey - cy, ex - cx);
  let sweep = a1 - a0;
  const fullCircle = Math.abs(ex - px) < 1e-9 && Math.abs(ey - py) < 1e-9;
  if (clockwise) {
    if (sweep >= 0 || fullCircle) sweep -= 2 * Math.PI;
    if (fullCircle) sweep = -2 * Math.PI;
  } else {
    if (sweep <= 0 || fullCircle) sweep += 2 * Math.PI;
    if (fullCircle) sweep = 2 * Math.PI;
  }
  const n = Math.min(720, Math.max(1, Math.ceil((Math.abs(sweep) * r) / 0.5)));
  const out: Array<[number, number]> = [];
  for (let k = 1; k < n; k++) {
    const a = a0 + (sweep * k) / n;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  out.push([ex, ey]);
  return out;
}

export function parseGcode(text: string): ParsedGcode {
  const lines = text.split(/\r?\n/);
  const moves: GcodeMove[] = [];

  let x = 0;
  let y = 0;
  let z = 0;
  let e = 0;
  let f = 1500;
  let absoluteMode = true;
  let absoluteExtrusion = true;
  let layer = -1;
  let detectedSlicer: string | null = null;

  const bboxMin: [number, number, number] = [Infinity, Infinity, Infinity];
  const bboxMax: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // ---- slicer fingerprint (only in first ~50 lines for speed) ----
    if (!detectedSlicer && i < 50) {
      for (const fp of SLICER_FINGERPRINTS) {
        if (fp.pattern.test(raw)) {
          detectedSlicer = fp.slicer;
          break;
        }
      }
    }

    // ---- layer change comments (slicer-specific) ----
    // Cura:        ;LAYER:N
    // PrusaSlicer: ;LAYER_CHANGE  (no number, increment)
    // Bambu/Orca:  ; layer num/total_layer_count: N/M
    const layerCuraMatch = raw.match(/^;\s*LAYER:\s*(\d+)/i);
    if (layerCuraMatch) {
      layer = parseInt(layerCuraMatch[1], 10);
    } else if (/^;\s*LAYER_CHANGE/i.test(raw)) {
      layer = layer < 0 ? 0 : layer + 1;
    } else {
      const bambuMatch = raw.match(
        /^;\s*layer\s+num\/total_layer_count:\s*(\d+)/i,
      );
      if (bambuMatch) layer = parseInt(bambuMatch[1], 10) - 1;
    }

    // ---- strip inline comment ----
    const semi = raw.indexOf(";");
    const code = (semi >= 0 ? raw.slice(0, semi) : raw).trim();
    if (!code) continue;

    // Some firmwares/slicers omit spaces ("G1X10Y5") — split before each letter.
    const tokens = code.replace(/([A-Za-z])/g, " $1").trim().split(/\s+/);
    // G00/G01/G02/G03 are the same commands as G0..G3.
    const cmd = tokens[0].toUpperCase().replace(/^G0(\d)$/, "G$1");

    if (cmd === "G2" || cmd === "G3") {
      // Arc move (arc fitting in Bambu Studio / OrcaSlicer / PrusaSlicer).
      const px = x, py = y, pz = z, pe = e;
      let ex = x, ey = y, ez = z, ee = e;
      let I = 0, J = 0, R: number | null = null;
      for (let t = 1; t < tokens.length; t++) {
        const letter = tokens[t][0]?.toUpperCase();
        const val = parseFloat(tokens[t].slice(1));
        if (!Number.isFinite(val)) continue;
        if (letter === "X") ex = absoluteMode ? val : px + val;
        else if (letter === "Y") ey = absoluteMode ? val : py + val;
        else if (letter === "Z") ez = absoluteMode ? val : pz + val;
        else if (letter === "E") ee = absoluteExtrusion ? val : pe + val;
        else if (letter === "F") f = val;
        else if (letter === "I") I = val;
        else if (letter === "J") J = val;
        else if (letter === "R") R = val;
      }
      const pts = arcPoints(px, py, ex, ey, I, J, R, cmd === "G2");
      const n = pts.length;
      let sx = px, sy = py, sz = pz, se = pe;
      for (let k = 0; k < n; k++) {
        const t = (k + 1) / n;
        const [ax, ay] = pts[k];
        const az = pz + (ez - pz) * t;
        const ae = pe + (ee - pe) * t;
        const dx = ax - sx, dy = ay - sy, dz = az - sz, de = ae - se;
        if (dx !== 0 || dy !== 0 || dz !== 0 || de !== 0) {
          const isExtrusion = de > 0 && (dx !== 0 || dy !== 0);
          moves.push({ x: ax, y: ay, z: az, e: ae, f, dx, dy, dz, de, isExtrusion, layer, lineIndex: i, px: sx, py: sy, pz: sz });
          if (isExtrusion) {
            if (ax < bboxMin[0]) bboxMin[0] = ax;
            if (ay < bboxMin[1]) bboxMin[1] = ay;
            if (az < bboxMin[2]) bboxMin[2] = az;
            if (ax > bboxMax[0]) bboxMax[0] = ax;
            if (ay > bboxMax[1]) bboxMax[1] = ay;
            if (az > bboxMax[2]) bboxMax[2] = az;
          }
        }
        sx = ax; sy = ay; sz = az; se = ae;
      }
      x = ex; y = ey; z = ez; e = ee;
    } else if (cmd === "G0" || cmd === "G1") {
      const px = x;
      const py = y;
      const pz = z;
      const pe = e;

      for (let t = 1; t < tokens.length; t++) {
        const tok = tokens[t];
        const letter = tok[0]?.toUpperCase();
        const val = parseFloat(tok.slice(1));
        if (!Number.isFinite(val)) continue;
        if (letter === "X") x = absoluteMode ? val : px + val;
        else if (letter === "Y") y = absoluteMode ? val : py + val;
        else if (letter === "Z") z = absoluteMode ? val : pz + val;
        else if (letter === "E") e = absoluteExtrusion ? val : pe + val;
        else if (letter === "F") f = val;
      }

      const dx = x - px;
      const dy = y - py;
      const dz = z - pz;
      const de = e - pe;

      // Skip true no-ops (no position or extrusion change).
      if (dx === 0 && dy === 0 && dz === 0 && de === 0) continue;

      const isExtrusion = de > 0 && (dx !== 0 || dy !== 0);

      moves.push({
        x, y, z, e, f,
        dx, dy, dz, de,
        isExtrusion,
        layer,
        lineIndex: i,
        px, py, pz,
      });

      if (isExtrusion) {
        if (x < bboxMin[0]) bboxMin[0] = x;
        if (y < bboxMin[1]) bboxMin[1] = y;
        if (z < bboxMin[2]) bboxMin[2] = z;
        if (x > bboxMax[0]) bboxMax[0] = x;
        if (y > bboxMax[1]) bboxMax[1] = y;
        if (z > bboxMax[2]) bboxMax[2] = z;
      }
    } else if (cmd === "G92") {
      // Reset axis position(s) without moving.
      for (let t = 1; t < tokens.length; t++) {
        const tok = tokens[t];
        const letter = tok[0]?.toUpperCase();
        const val = parseFloat(tok.slice(1));
        if (!Number.isFinite(val)) continue;
        if (letter === "X") x = val;
        else if (letter === "Y") y = val;
        else if (letter === "Z") z = val;
        else if (letter === "E") e = val;
      }
    } else if (cmd === "G90") {
      absoluteMode = true;
    } else if (cmd === "G91") {
      absoluteMode = false;
    } else if (cmd === "M82") {
      absoluteExtrusion = true;
    } else if (cmd === "M83") {
      absoluteExtrusion = false;
    }
  }

  // Determine layerCount from observed max layer index (or fall back to
  // counting unique Z heights for slicers that don't emit a layer comment).
  let layerCount = 0;
  for (const m of moves) if (m.layer > layerCount) layerCount = m.layer;
  if (layerCount === 0) {
    const zs = new Set<number>();
    for (const m of moves) if (m.isExtrusion) zs.add(Math.round(m.z * 100));
    layerCount = zs.size;
  } else {
    layerCount += 1; // turn max-index into count
  }

  // If bbox never got hit (no extrusion moves), fall back to all moves.
  if (!Number.isFinite(bboxMin[0])) {
    for (const m of moves) {
      if (m.x < bboxMin[0]) bboxMin[0] = m.x;
      if (m.y < bboxMin[1]) bboxMin[1] = m.y;
      if (m.z < bboxMin[2]) bboxMin[2] = m.z;
      if (m.x > bboxMax[0]) bboxMax[0] = m.x;
      if (m.y > bboxMax[1]) bboxMax[1] = m.y;
      if (m.z > bboxMax[2]) bboxMax[2] = m.z;
    }
  }
  // Final safety
  for (let i = 0; i < 3; i++) {
    if (!Number.isFinite(bboxMin[i])) bboxMin[i] = 0;
    if (!Number.isFinite(bboxMax[i])) bboxMax[i] = 0;
  }

  return {
    moves,
    bbox: { min: bboxMin, max: bboxMax },
    layerCount,
    totalLines: lines.length,
    detectedSlicer,
  };
}
