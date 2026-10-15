/**
 * 2D polylines → SVG for laser cutters and vinyl/craft cutters.
 *
 * Laser software (LightBurn, Inkscape, Glowforge…) cuts along strokes, so every
 * outline is a hairline stroke with no fill. The document's width/height carry
 * real millimetre (or inch) units so it imports at true size, and the drawing
 * is flipped to SVG's y-down convention so it isn't mirrored.
 *
 * Pure string building, no DOM — unit-testable in Node.
 */
import type { Polyline } from "./write";

export type SvgWriteOptions = {
  units?: "mm" | "in";
  /** Stroke width in drawing units. 0.1 mm reads as a hairline in laser software. */
  strokeWidth?: number;
  title?: string;
};

function n(v: number): string {
  const s = v.toFixed(4).replace(/\.?0+$/, "");
  return s === "-0" ? "0" : s;
}

function esc(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
}

export function writeSvgPolylines(polys: Polyline[], opts: SvgWriteOptions = {}): string {
  const units = opts.units ?? "mm";
  const usable = polys.filter((p) => p.points.length >= 2);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of usable) {
    for (const [x, y] of p.points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (!usable.length) {
    minX = minY = 0;
    maxX = maxY = 1;
  }
  const w = Math.max(maxX - minX, 1e-6);
  const h = Math.max(maxY - minY, 1e-6);
  const stroke = opts.strokeWidth ?? (units === "mm" ? 0.1 : 0.004);

  const paths = usable.map((p) => {
    const d = p.points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${n(x - minX)} ${n(maxY - y)}`)
      .join(" ");
    return `  <path d="${d}${p.closed ? " Z" : ""}"/>`;
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}${units}" height="${n(h)}${units}" viewBox="0 0 ${n(w)} ${n(h)}">`,
    opts.title ? `  <title>${esc(opts.title)}</title>` : "",
    `  <g fill="none" stroke="#000000" stroke-width="${n(stroke)}" stroke-linejoin="round" stroke-linecap="round">`,
    ...paths.map((p) => "  " + p),
    `  </g>`,
    `</svg>`,
    "",
  ]
    .filter((l) => l !== "")
    .join("\n");
}
