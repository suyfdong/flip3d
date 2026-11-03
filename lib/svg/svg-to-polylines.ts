import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import type { Point2, Polyline } from "@/lib/dxf/write";

/**
 * SVG → flat polylines in millimetres, for writing a DXF.
 *
 * Unlike SVG → STL (which needs filled areas to extrude), a cutting file only
 * cares about path geometry: every visible path becomes a polyline, whether it
 * was drawn as a fill or a stroke. A stroke becomes its centre line — the DXF
 * has no notion of line width — and the UI says so.
 *
 * Parsing goes through three's SVGLoader (needs DOMParser → browser only), but
 * the two halves that matter for correctness are pure and Node-testable:
 *  - `svgDocumentScale` reads width/height/viewBox to get real-world size
 *  - `shapePathsToPolylines` tessellates curves and flips to CAD's y-up
 */

/** Millimetres per one unit of each CSS length unit. px follows the 96 dpi CSS standard. */
const MM_PER: Record<string, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
  pt: 25.4 / 72,
  pc: 25.4 / 6,
  px: 25.4 / 96,
  "": 25.4 / 96,
};

export type SvgScale = {
  /** Millimetres per SVG user unit. */
  mmPerUnit: number;
  /**
   * "declared" — the root width carries a physical unit (mm/cm/in/pt/pc), so
   * the size is what the author set. "px" — only pixels or nothing, so we
   * assumed 96 px per inch (the CSS / Inkscape standard) and the user should
   * check it.
   */
  source: "declared" | "px";
};

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? m[1].trim() : null;
}

function parseLength(v: string | null): { value: number; unit: string } | null {
  if (!v) return null;
  const m = v.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(mm|cm|in|pt|pc|px|%)?$/i);
  if (!m) return null;
  const unit = (m[2] ?? "").toLowerCase();
  if (unit === "%") return null;
  const value = parseFloat(m[1]);
  return Number.isFinite(value) && value > 0 ? { value, unit } : null;
}

/** Real-world size of one SVG user unit, from the root element's width + viewBox. */
export function svgDocumentScale(svgText: string): SvgScale {
  const tag = svgText.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  const width = parseLength(attr(tag, "width"));
  const vb = attr(tag, "viewBox")
    ?.split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const vbWidth = vb && vb.length === 4 && vb[2] > 0 ? vb[2] : null;

  if (width && vbWidth) {
    return {
      mmPerUnit: (width.value * MM_PER[width.unit]) / vbWidth,
      source: width.unit === "" || width.unit === "px" ? "px" : "declared",
    };
  }
  // No viewBox: user units are CSS pixels whatever the width says.
  return { mmPerUnit: MM_PER.px, source: "px" };
}

export type SvgPolylineResult = {
  /** Polylines in millimetres, y-up, with the drawing's lower-left corner at 0,0. */
  polylines: Polyline[];
  /** Natural size of the drawing in mm (before any user rescale). */
  sizeMM: [number, number];
  scale: SvgScale;
  /** Paths skipped because they had neither fill nor stroke, or were hidden. */
  hiddenPaths: number;
  /** Elements SVGLoader can't turn into geometry. */
  textElements: number;
  imageElements: number;
};

type DomLike = {
  nodeName?: string;
  getAttribute?: (n: string) => string | null;
  parentNode?: DomLike | null;
};

/** Containers whose children are never drawn directly. SVGLoader only skips <defs>. */
// (Not <symbol>: SVGLoader draws a <use> by parsing the referenced node in place,
// so a used symbol's children really do have the symbol as their parent.)
const NON_RENDERED = new Set(["clippath", "mask", "marker", "pattern"]);

/**
 * SVGLoader doesn't read `display`, and only skips shapes inside <defs>, so a
 * clip path or a hidden layer (Inkscape hides layers with display:none) would
 * otherwise come out as extra cut lines.
 */
function isNonRendered(node: DomLike): boolean {
  for (let n: DomLike | null | undefined = node; n && n.getAttribute; n = n.parentNode) {
    if (NON_RENDERED.has((n.nodeName ?? "").toLowerCase())) return true;
    const display = n.getAttribute("display");
    const style = n.getAttribute("style") ?? "";
    if (display === "none" || /(^|;)\s*display\s*:\s*none/i.test(style)) return true;
  }
  return false;
}

const near = (a: Point2, b: Point2, eps: number) =>
  Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps;

/**
 * Tessellate SVGLoader's ShapePaths into polylines (mm, y-up, origin at the
 * lower-left of the drawing). Straight segments stay exact; curves are split
 * so no chord is longer than `maxSegMM` (or a 1/600th of the drawing, if that
 * is larger — keeps huge drawings from exploding into millions of points).
 */
export function shapePathsToPolylines(
  paths: THREE.ShapePath[],
  mmPerUnit: number,
  maxSegMM = 0.25,
): { polylines: Polyline[]; hiddenPaths: number } {
  const raw: Polyline[] = [];
  let hiddenPaths = 0;

  for (const path of paths) {
    const ud = (path as THREE.ShapePath & {
      userData?: { style?: Record<string, string>; node?: DomLike };
    }).userData;
    const style = ud?.style;
    if (ud?.node && isNonRendered(ud.node)) {
      hiddenPaths++;
      continue;
    }
    if (style) {
      const noFill = style.fill === "none" || style.fill === "transparent";
      const noStroke = !style.stroke || style.stroke === "none" || style.stroke === "transparent";
      if ((noFill && noStroke) || style.visibility === "hidden" || style.display === "none") {
        hiddenPaths++;
        continue;
      }
    }
    for (const sub of path.subPaths) {
      const pts: Point2[] = [];
      for (const curve of sub.curves) {
        let seg: THREE.Vector2[];
        // Duck-typed: `instanceof` fails when two copies of three are loaded.
        if ((curve as THREE.LineCurve).isLineCurve) {
          seg = [(curve as THREE.LineCurve).v1, (curve as THREE.LineCurve).v2];
        } else {
          const lenMM = curve.getLength() * mmPerUnit;
          const n = Math.min(512, Math.max(8, Math.ceil(lenMM / maxSegMM)));
          seg = curve.getPoints(n) as THREE.Vector2[];
        }
        for (const v of seg) pts.push([v.x * mmPerUnit, -v.y * mmPerUnit]);
      }
      // Drop consecutive duplicates (curve joins repeat their shared endpoint).
      const clean: Point2[] = [];
      for (const p of pts) {
        if (!clean.length || !near(clean[clean.length - 1], p, 1e-9)) clean.push(p);
      }
      if (clean.length < 2) continue;
      let closed = Boolean((sub as THREE.Path & { autoClose?: boolean }).autoClose);
      if (clean.length >= 3 && near(clean[0], clean[clean.length - 1], 1e-6)) {
        clean.pop();
        closed = true;
      }
      if (closed && clean.length < 3) closed = false;
      raw.push({ points: clean, closed });
    }
  }

  // Move the drawing so its lower-left corner sits at the origin.
  let minX = Infinity, minY = Infinity;
  for (const p of raw) for (const [x, y] of p.points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
  }
  const polylines = Number.isFinite(minX)
    ? raw.map((p) => ({ closed: p.closed, points: p.points.map(([x, y]) => [x - minX, y - minY] as Point2) }))
    : [];
  return { polylines, hiddenPaths };
}

export function polylineBounds(polys: Polyline[]): [number, number] {
  let maxX = 0, maxY = 0;
  for (const p of polys) for (const [x, y] of p.points) {
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [maxX, maxY];
}

export function scalePolylines(polys: Polyline[], k: number): Polyline[] {
  if (k === 1) return polys;
  return polys.map((p) => ({ closed: p.closed, points: p.points.map(([x, y]) => [x * k, y * k] as Point2) }));
}

function countTag(svgText: string, tag: string): number {
  return (svgText.match(new RegExp(`<${tag}[\\s>/]`, "gi")) ?? []).length;
}

/** Browser only (SVGLoader uses DOMParser). */
export function svgToPolylines(svgText: string): SvgPolylineResult {
  if (!/<svg\b/i.test(svgText)) {
    throw new Error("This doesn't look like an SVG file — no <svg> element found.");
  }
  const scale = svgDocumentScale(svgText);
  const data = new SVGLoader().parse(svgText);
  const { polylines, hiddenPaths } = shapePathsToPolylines(data.paths, scale.mmPerUnit);
  const textElements = countTag(svgText, "text");
  const imageElements = countTag(svgText, "image");

  if (!polylines.length) {
    if (textElements > 0) {
      throw new Error(
        `No paths found — this SVG is live text (${textElements} <text> element${textElements === 1 ? "" : "s"}). Convert the text to outlines first (Illustrator: Type → Create Outlines; Inkscape: Path → Object to Path) and re-export.`,
      );
    }
    if (imageElements > 0) {
      throw new Error(
        "No paths found — this SVG only wraps a bitmap <image>. Use Image to DXF to trace the picture into outlines instead.",
      );
    }
    throw new Error(
      hiddenPaths > 0
        ? `No visible paths found — ${hiddenPaths} path${hiddenPaths === 1 ? " has" : "s have"} neither fill nor stroke.`
        : "No paths found — the SVG has no path, rect, circle, ellipse, line, polyline or polygon elements.",
    );
  }

  return {
    polylines,
    sizeMM: polylineBounds(polylines),
    scale,
    hiddenPaths,
    textElements,
    imageElements,
  };
}

/** Sample for "Try a sample": a 100 × 60 mm plate with holes, a slot and an open score line. */
export const SAMPLE_SVG_FOR_DXF = `<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="60mm" viewBox="0 0 100 60">
  <rect x="0" y="0" width="100" height="60" rx="6" fill="none" stroke="#000" stroke-width="0.2"/>
  <circle cx="12" cy="12" r="4" fill="none" stroke="#000" stroke-width="0.2"/>
  <circle cx="88" cy="12" r="4" fill="none" stroke="#000" stroke-width="0.2"/>
  <circle cx="12" cy="48" r="4" fill="none" stroke="#000" stroke-width="0.2"/>
  <circle cx="88" cy="48" r="4" fill="none" stroke="#000" stroke-width="0.2"/>
  <path d="M35 30 a15 9 0 1 0 30 0 a15 9 0 1 0 -30 0 Z" fill="none" stroke="#000" stroke-width="0.2"/>
  <line x1="30" y1="52" x2="70" y2="52" stroke="#e00" stroke-width="0.2"/>
</svg>`;
