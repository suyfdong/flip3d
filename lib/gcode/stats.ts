import type { ParsedGcode } from "./parser";

export type GcodeStats = {
  totalMoves: number;
  extrusionMoves: number;
  travelMoves: number;
  totalSeconds: number;
  filamentMm: number;
  filamentGrams: number;
  layerCount: number;
  bbox: { x: number; y: number; z: number };
};

// 1.75mm PLA, density 1.24 g/cm³ is a sensible default. Real value depends on
// material — we show this as an estimate.
const FILAMENT_DIAMETER_MM = 1.75;
const FILAMENT_DENSITY_G_PER_CM3 = 1.24;

export function computeGcodeStats(parsed: ParsedGcode): GcodeStats {
  let totalSeconds = 0;
  let filamentMm = 0;
  let extrusion = 0;
  let travel = 0;

  for (const m of parsed.moves) {
    const dist = Math.hypot(m.dx, m.dy, m.dz);
    const speedMmPerSec = m.f / 60;
    if (speedMmPerSec > 0 && dist > 0) totalSeconds += dist / speedMmPerSec;
    if (m.isExtrusion) {
      if (m.de > 0) filamentMm += m.de;
      extrusion++;
    } else {
      travel++;
    }
  }

  // Volume of filament cylinder: π r² · length (mm³).
  // Mass: volume · density (g/cm³) ÷ 1000 (mm³ → cm³).
  const radius = FILAMENT_DIAMETER_MM / 2;
  const volumeMm3 = Math.PI * radius * radius * filamentMm;
  const filamentGrams = (volumeMm3 * FILAMENT_DENSITY_G_PER_CM3) / 1000;

  return {
    totalMoves: parsed.moves.length,
    extrusionMoves: extrusion,
    travelMoves: travel,
    totalSeconds,
    filamentMm,
    filamentGrams,
    layerCount: parsed.layerCount,
    bbox: {
      x: parsed.bbox.max[0] - parsed.bbox.min[0],
      y: parsed.bbox.max[1] - parsed.bbox.min[1],
      z: parsed.bbox.max[2] - parsed.bbox.min[2],
    },
  };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
