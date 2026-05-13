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

    const tokens = code.split(/\s+/);
    const cmd = tokens[0].toUpperCase();

    if (cmd === "G0" || cmd === "G1") {
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
