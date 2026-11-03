"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Dropzone from "@/components/Dropzone";
import DxfPreview from "@/components/DxfPreview";
import { downloadBlob } from "@/lib/converters";
import { writeDxfPolylines, type Polyline } from "@/lib/dxf/write";
import { writeSvgPolylines } from "@/lib/dxf/svg";
import { parseDxf } from "@/lib/dxf/parse";
import {
  trackFileUploaded,
  trackSampleLoaded,
  trackVectorConverted,
  trackConvertError,
} from "@/lib/analytics";

/**
 * SVG ↔ DXF, both directions in one component.
 *
 * Both sides are flat line work, so the pipeline is: parse to polylines in
 * millimetres → optional rescale → write the other format. Curves are
 * tessellated (SVG beziers/arcs → short segments; DXF arcs/circles were
 * already tessellated by parseDxf) — every page says so.
 */

export type VectorVariant = "svg-dxf" | "dxf-svg";

type Units = "mm" | "in";

/** Millimetres per drawing unit, by DXF $INSUNITS code. */
const DXF_UNIT_MM: Record<number, { mm: number; label: string }> = {
  1: { mm: 25.4, label: "inches" },
  2: { mm: 304.8, label: "feet" },
  4: { mm: 1, label: "millimetres" },
  5: { mm: 10, label: "centimetres" },
  6: { mm: 1000, label: "metres" },
};

const SAMPLE_DXF = (() => {
  const g: string[] = ["0", "SECTION", "2", "HEADER", "9", "$INSUNITS", "70", "4", "0", "ENDSEC", "0", "SECTION", "2", "ENTITIES"];
  const ring = (pts: Array<[number, number]>) => {
    g.push("0", "LWPOLYLINE", "90", `${pts.length}`, "70", "1");
    for (const [x, y] of pts) g.push("10", `${x}`, "20", `${y}`);
  };
  ring([[0, 0], [120, 0], [120, 60], [0, 60]]);
  g.push("0", "CIRCLE", "10", "30", "20", "30", "40", "14");
  g.push("0", "CIRCLE", "10", "90", "20", "30", "40", "14");
  ring([[52, 22], [68, 22], [68, 38], [52, 38]]);
  g.push("0", "LINE", "10", "10", "20", "52", "11", "110", "21", "52");
  g.push("0", "ENDSEC", "0", "EOF", "");
  return g.join("\n");
})();

const COPY: Record<
  VectorVariant,
  { eyebrow: string; title: string; intro: string; from: string; to: string; accept: string[]; label: string; note: string }
> = {
  "svg-dxf": {
    eyebrow: "SVG → DXF · Vector to CAD",
    title: "SVG to DXF",
    intro:
      "Convert an SVG into an R12 DXF for laser cutting, CNC routing or AutoCAD. Fills and strokes both become cut paths, the drawing keeps its real size, and nothing is uploaded — free, instant, 100% in your browser.",
    from: "svg",
    to: "dxf",
    accept: [".svg"],
    label: "SVG file",
    note: "Reads path, rect, circle, ellipse, line, polyline and polygon, with transforms. Live <text> and embedded bitmaps can't be converted — outline the text first.",
  },
  "dxf-svg": {
    eyebrow: "DXF → SVG · CAD to vector",
    title: "DXF to SVG",
    intro:
      "Convert a DXF drawing into an SVG at true size — hairline cut paths for LightBurn, Glowforge or Cricut, or filled shapes for the web. Free, no signup, and the file never leaves your browser.",
    from: "dxf",
    to: "svg",
    accept: [".dxf"],
    label: "DXF file",
    note: "ASCII DXF only — binary DXF and DWG aren't supported. Reads LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC, SPLINE and block references.",
  },
};

type Loaded = {
  /** Polylines in mm at the drawing's own size. */
  polylines: Polyline[];
  sizeMM: [number, number];
  /** Facts about what was (not) converted, shown in the side panel. */
  notes: string[];
  /** DXF only: the file didn't declare units, so the user picks them. */
  unitsUnknown: boolean;
  /** DXF only: units the file declared, for the default output unit. */
  declaredInches: boolean;
};

function scale(polys: Polyline[], k: number): Polyline[] {
  if (k === 1) return polys;
  return polys.map((p) => ({ closed: p.closed, points: p.points.map(([x, y]) => [x * k, y * k] as [number, number]) }));
}

function bounds(polys: Polyline[]): [number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of polys) for (const [x, y] of p.points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return Number.isFinite(minX) ? [maxX - minX, maxY - minY] : [0, 0];
}

const fmt = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));

export default function VectorConvertTool({ variant }: { variant: VectorVariant }) {
  const copy = COPY[variant];
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  /** DXF with no $INSUNITS: what one drawing unit is, in mm. */
  const [assumedUnitMM, setAssumedUnitMM] = useState(1);
  /** Requested output width in mm; null = keep the drawing's own size. */
  const [widthMM, setWidthMM] = useState<number | null>(null);
  const [outUnits, setOutUnits] = useState<Units>("mm");
  const [svgStyle, setSvgStyle] = useState<"cut" | "fill">("cut");

  const load = useCallback(
    async (text: string, name: string, origin: "drop" | "sample") => {
      try {
        let next: Loaded;
        if (variant === "svg-dxf") {
          const { svgToPolylines } = await import("@/lib/svg/svg-to-polylines");
          const r = svgToPolylines(text);
          const notes: string[] = [];
          if (r.scale.source === "px") {
            notes.push(
              "The SVG has no physical units (only pixels), so it was sized at 96 px per inch — the Inkscape and browser standard. Set the width below if the size is off.",
            );
          }
          notes.push("Strokes become their centre line — a DXF has no line width.");
          if (r.textElements) notes.push(`${r.textElements} <text> element${r.textElements === 1 ? "" : "s"} skipped — convert text to outlines to include it.`);
          if (r.imageElements) notes.push(`${r.imageElements} embedded bitmap${r.imageElements === 1 ? "" : "s"} skipped.`);
          if (r.hiddenPaths) notes.push(`${r.hiddenPaths} hidden or unpainted path${r.hiddenPaths === 1 ? "" : "s"} skipped.`);
          next = { polylines: r.polylines, sizeMM: r.sizeMM, notes, unitsUnknown: false, declaredInches: false };
          setOutUnits("mm");
        } else {
          const doc = parseDxf(text);
          if (!doc.polylines.length) {
            throw new Error(
              "This DXF only holds 3D faces, no 2D line work. Use STL to SVG to cut a section through a 3D model instead.",
            );
          }
          const known = doc.insUnits ? DXF_UNIT_MM[doc.insUnits] : undefined;
          const unitMM = known?.mm ?? 1;
          const polys = scale(doc.polylines, unitMM);
          const notes: string[] = [];
          if (known) notes.push(`Drawing units: ${known.label} (from the file).`);
          if (doc.approximatedSplines) notes.push("Splines were drawn through their defining points, so they may be slightly angular.");
          const skipped = Object.entries(doc.unsupported);
          if (skipped.length) notes.push(`Not converted: ${skipped.map(([k, n]) => `${k} ×${n}`).join(", ")}.`);
          if (doc.faces.length) notes.push(`${doc.faces.length} 3D faces skipped — SVG is 2D.`);
          notes.push("Arcs and circles are written as many short segments, not true arcs.");
          next = {
            polylines: polys,
            sizeMM: bounds(polys),
            notes,
            unitsUnknown: !known,
            declaredInches: doc.insUnits === 1 || doc.insUnits === 2,
          };
          setAssumedUnitMM(1);
          setOutUnits(next.declaredInches ? "in" : "mm");
        }
        setLoaded(next);
        setFileName(name);
        setWidthMM(null);
        setErrorMsg(null);
        if (origin === "drop") trackFileUploaded(copy.from, "drop");
        else trackSampleLoaded(copy.from);
      } catch (err) {
        const msg = err instanceof Error ? err.message : `Could not read this ${copy.from.toUpperCase()}`;
        setLoaded(null);
        setErrorMsg(msg);
        trackConvertError(copy.from, copy.to, msg);
      }
    },
    [variant, copy.from, copy.to],
  );

  const handleFile = useCallback(
    (buffer: ArrayBuffer, name: string) =>
      void load(new TextDecoder("utf-8", { fatal: false }).decode(buffer), name, "drop"),
    [load],
  );

  const handleSample = async () => {
    if (variant === "svg-dxf") {
      const { SAMPLE_SVG_FOR_DXF } = await import("@/lib/svg/svg-to-polylines");
      void load(SAMPLE_SVG_FOR_DXF, "flip3d-sample.svg", "sample");
    } else {
      void load(SAMPLE_DXF, "flip3d-sample.dxf", "sample");
    }
  };

  /** Polylines in mm after unit assumption + width rescale. */
  const output = useMemo(() => {
    if (!loaded) return null;
    const unitK = loaded.unitsUnknown ? assumedUnitMM : 1;
    const naturalW = loaded.sizeMM[0] * unitK;
    const k = unitK * (widthMM && naturalW > 0 ? widthMM / naturalW : 1);
    const polylines = scale(loaded.polylines, k);
    return { polylines, size: [loaded.sizeMM[0] * k, loaded.sizeMM[1] * k] as [number, number], naturalW };
  }, [loaded, assumedUnitMM, widthMM]);

  const closed = output ? output.polylines.filter((p) => p.closed).length : 0;
  const open = output ? output.polylines.length - closed : 0;

  const handleDownload = () => {
    if (!output) return;
    try {
      const base = fileName.replace(/\.[^.]+$/, "") || "drawing";
      const k = outUnits === "in" ? 1 / 25.4 : 1;
      const polys = scale(output.polylines, k);
      if (variant === "svg-dxf") {
        const dxf = writeDxfPolylines(polys, { units: outUnits, layer: "0" });
        downloadBlob(new Blob([dxf], { type: "image/vnd.dxf" }), `${base}.dxf`);
      } else {
        const svg = writeSvgPolylines(polys, { units: outUnits, style: svgStyle, title: base });
        downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${base}.svg`);
      }
      trackVectorConverted(copy.from, copy.to);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed";
      setErrorMsg(msg);
      trackConvertError(copy.from, copy.to, msg);
    }
  };

  const reset = () => {
    setLoaded(null);
    setFileName("");
    setErrorMsg(null);
    setWidthMM(null);
  };

  if (!loaded || !output) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
            {copy.eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              {copy.title}
            </span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">{copy.intro}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Dropzone onFileLoaded={handleFile} accept={copy.accept} label={copy.label} />
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">No file handy?</span>
            <button
              onClick={handleSample}
              className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Try a sample
            </button>
          </div>
          {errorMsg && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
              ⚠️ {errorMsg}
            </div>
          )}
          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            {copy.note}
          </p>
        </div>
      </section>
    );
  }

  const unitLabel = outUnits === "in" ? "in" : "mm";
  const shownW = outUnits === "in" ? output.size[0] / 25.4 : output.size[0];
  const shownH = outUnits === "in" ? output.size[1] / 25.4 : output.size[1];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{fileName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {closed} closed shape{closed === 1 ? "" : "s"} · {open} open path{open === 1 ? "" : "s"} ·{" "}
            {fmt(shownW)} × {fmt(shownH)} {unitLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            ← Open another file
          </button>
          <button
            onClick={handleDownload}
            disabled={output.polylines.length === 0}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Download {copy.to.toUpperCase()}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="order-2 lg:order-1 h-[55vh] sm:h-[520px]">
          <DxfPreview polylines={output.polylines} />
        </div>

        <div className="order-1 lg:order-2 space-y-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          {loaded.unitsUnknown && (
            <div>
              <label className="text-sm font-medium block mb-1">Drawing units</label>
              <select
                value={assumedUnitMM}
                onChange={(e) => {
                  setAssumedUnitMM(Number(e.target.value));
                  setWidthMM(null);
                }}
                className="w-full text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5"
              >
                <option value={1}>Millimetres</option>
                <option value={10}>Centimetres</option>
                <option value={25.4}>Inches</option>
                <option value={1000}>Metres</option>
              </select>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                The file doesn&apos;t say what one unit is. Pick it so the output comes out at the right size.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Width</label>
              {widthMM !== null && (
                <button
                  onClick={() => setWidthMM(null)}
                  className="text-xs px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                >
                  Original size
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={Number(output.size[0].toFixed(2))}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v) && v > 0) setWidthMM(v);
                }}
                className="w-full text-sm font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5"
              />
              <span className="text-xs text-zinc-500">mm</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Height follows the aspect ratio.</p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Output units</label>
            <div className="flex gap-2">
              {(["mm", "in"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setOutUnits(u)}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg border ${
                    outUnits === u
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                  }`}
                >
                  {u === "mm" ? "Millimetres" : "Inches"}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {variant === "svg-dxf"
                ? "Coordinates are written in this unit and $INSUNITS is set to match."
                : "The SVG's width and height carry this unit, so it imports at true size."}
            </p>
          </div>

          {variant === "dxf-svg" && (
            <div>
              <label className="text-sm font-medium block mb-1">SVG style</label>
              <div className="flex gap-2">
                {(
                  [
                    ["cut", "Cut lines"],
                    ["fill", "Filled shapes"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setSvgStyle(v)}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-lg border ${
                      svgStyle === v
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                        : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {svgStyle === "cut"
                  ? "Hairline strokes, no fill — what laser software expects."
                  : "Closed shapes filled black with holes kept open — for Cricut print-then-cut or the web."}
              </p>
            </div>
          )}

          <ul className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400 list-disc pl-4">
            {loaded.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
            {open > 0 && (
              <li className="text-amber-700 dark:text-amber-400">
                Amber paths are open — they cut as lines (score marks, engraving) but don&apos;t enclose an area.
              </li>
            )}
          </ul>

          {errorMsg && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">🔒 This file never left your browser.</p>
            {variant === "svg-dxf" ? (
              <>
                <Link href="/svg-to-stl/" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Want a 3D part instead? → SVG to STL
                </Link>
                <Link href="/dxf-viewer/" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Check the result → DXF Viewer
                </Link>
              </>
            ) : (
              <>
                <Link href="/dxf-to-stl/" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Extrude it into a solid → DXF to STL
                </Link>
                <Link href="/svg-to-stl/" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Or 3D-print the SVG → SVG to STL
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
        {variant === "svg-dxf"
          ? "Curves are written as short straight segments (no chord longer than 0.25 mm) in an R12 DXF — the flavour every laser, CNC and CAD program reads. Closed shapes stay closed; open paths stay open."
          : "Closed loops stay closed and holes come out as their own paths. Arcs, circles and splines are written as short segments, so the SVG cuts to size but isn't an editable CAD drawing."}
      </p>
    </section>
  );
}
