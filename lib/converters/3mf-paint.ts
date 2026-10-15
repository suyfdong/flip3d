// Per-triangle multi-material painting stored in slicer 3MFs:
//   Bambu Studio / Orca:  <triangle … paint_color="4C"/>
//   PrusaSlicer:          <triangle … slic3rpe:mmu_segmentation="…"/>
// Both use PrusaSlicer's TriangleSelector serialization: a hex string read
// from the LAST character backwards, one nibble per character. Each node is
//   code = nibble; splitSides = code & 3
//   splitSides == 0 → leaf, state = (code & 0b1100) == 0b1100 ? next + 3 : code >> 2
//   splitSides  > 0 → split into splitSides + 1 children, which follow in order
// State 0 = unpainted (object's own filament), n = filament slot n.
// We don't subdivide geometry: each triangle takes its dominant leaf state,
// weighting leaves by their share of the parent's area.

export function decodePaintState(hex: string): number {
  let pos = hex.length - 1;
  const next = (): number => {
    if (pos < 0) return 0;
    const v = parseInt(hex[pos--], 16);
    return Number.isNaN(v) ? 0 : v;
  };
  const weight = new Map<number, number>();
  const visit = (w: number, depth: number) => {
    const code = next();
    const split = code & 0b11;
    if (split === 0 || depth > 16) {
      const state = (code & 0b1100) === 0b1100 ? next() + 3 : code >> 2;
      weight.set(state, (weight.get(state) ?? 0) + w);
      return;
    }
    const children = split + 1;
    for (let i = 0; i < children; i++) visit(w / children, depth + 1);
  };
  visit(1, 0);
  let best = 0;
  let bestW = -1;
  for (const [s, w] of weight) {
    if (w > bestW) {
      best = s;
      bestW = w;
    }
  }
  return best;
}

export type PaintedMesh = {
  objectId: string;
  triCount: number;
  firstVertex: [number, number, number];
  /** Filament slot per triangle (0 = object default). */
  states: Uint8Array;
};

const PAINT_ATTR = /\b(?:paint_color|slic3rpe:mmu_segmentation)\s*=\s*"([0-9A-Fa-f]*)"/;

/** Painted meshes in a (flattened, single-file) 3MF model document. */
export function readPaintedMeshes(xml: string): PaintedMesh[] {
  if (!/paint_color|mmu_segmentation/.test(xml)) return [];
  const out: PaintedMesh[] = [];
  const objRe = /<object\b([^>]*)>([\s\S]*?)<\/object>/g;
  let o: RegExpExecArray | null;
  while ((o = objRe.exec(xml)) !== null) {
    const body = o[2];
    if (!body.includes("<mesh")) continue;
    const id = o[1].match(/\bid\s*=\s*"([^"]*)"/)?.[1] ?? "";
    const v = body.match(/<vertex\b[^>]*>/)?.[0] ?? "";
    const num = (a: string) => Number(v.match(new RegExp(`\\b${a}\\s*=\\s*"([^"]*)"`))?.[1] ?? NaN);
    const states: number[] = [];
    let painted = false;
    const triRe = /<triangle\b([^>]*)>/g;
    let t: RegExpExecArray | null;
    while ((t = triRe.exec(body)) !== null) {
      const m = t[1].match(PAINT_ATTR);
      const s = m && m[1] ? decodePaintState(m[1]) : 0;
      if (s) painted = true;
      states.push(s);
    }
    if (!painted) continue;
    out.push({
      objectId: id,
      triCount: states.length,
      firstVertex: [num("x"), num("y"), num("z")],
      states: Uint8Array.from(states),
    });
  }
  return out;
}
