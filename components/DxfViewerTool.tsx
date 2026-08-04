"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Dropzone from "@/components/Dropzone";
import DxfPreview from "@/components/DxfPreview";
import { parseDxf, type DxfDocument } from "@/lib/dxf/parse";
import { trackFileUploaded, trackSampleLoaded, trackConvertError } from "@/lib/analytics";

const SAMPLE_DXF = (() => {
  const g: string[] = ["0", "SECTION", "2", "ENTITIES"];
  const ring = (pts: Array<[number, number]>) => {
    g.push("0", "LWPOLYLINE", "90", `${pts.length}`, "70", "1");
    for (const [x, y] of pts) g.push("10", `${x}`, "20", `${y}`);
  };
  ring([[0, 0], [120, 0], [120, 60], [0, 60]]);
  g.push("0", "CIRCLE", "10", "30", "20", "30", "40", "14");
  g.push("0", "CIRCLE", "10", "90", "20", "30", "40", "14");
  g.push("0", "ARC", "10", "60", "20", "0", "40", "20", "50", "0", "51", "180");
  ring([[52, 44], [68, 44], [68, 52], [52, 52]]);
  g.push("0", "ENDSEC", "0", "EOF", "");
  return g.join("\n");
})();

const UNIT_LABELS: Record<number, string> = {
  1: "inches",
  2: "feet",
  4: "millimetres",
  5: "centimetres",
  6: "metres",
};

export default function DxfViewerTool() {
  const [doc, setDoc] = useState<DxfDocument | null>(null);
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback((text: string, name: string, origin: "drop" | "sample") => {
    try {
      setDoc(parseDxf(text));
      setFileName(name);
      setErrorMsg(null);
      if (origin === "drop") trackFileUploaded("stl", "drop");
      else trackSampleLoaded("stl");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not read this DXF";
      setDoc(null);
      setErrorMsg(msg);
      trackConvertError("stl", "stl", msg);
    }
  }, []);

  const handleFile = useCallback(
    (buffer: ArrayBuffer, name: string) =>
      load(new TextDecoder("utf-8", { fatal: false }).decode(buffer), name, "drop"),
    [load],
  );

  if (!doc) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
            DXF · 2D Drawing Viewer
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Online DXF Viewer
            </span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Drop a .dxf file to see the drawing in your browser — no AutoCAD, no
            install, no account. Free, instant, and 100% local: the file never
            leaves your machine.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Dropzone onFileLoaded={handleFile} accept={[".dxf"]} label="DXF file" />
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">No DXF handy?</span>
            <button
              onClick={() => load(SAMPLE_DXF, "flip3d-sample.dxf", "sample")}
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
            ASCII DXF only — binary DXF and DWG aren&apos;t supported. Draws LINE,
            LWPOLYLINE, POLYLINE, CIRCLE, ARC, SPLINE and block references.
          </p>
        </div>
      </section>
    );
  }

  const closed = doc.polylines.filter((p) => p.closed).length;
  const open = doc.polylines.length - closed;
  const skipped = Object.entries(doc.unsupported);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{fileName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {closed} closed shape{closed === 1 ? "" : "s"} · {open} open path
            {open === 1 ? "" : "s"}
            {doc.faces.length > 0 ? ` · ${doc.faces.length} 3D faces` : ""}
          </p>
        </div>
        <button
          onClick={() => setDoc(null)}
          className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          ← Open another file
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="order-2 lg:order-1 h-[55vh] sm:h-[520px]">
          <DxfPreview polylines={doc.polylines} />
        </div>

        <div className="order-1 lg:order-2 space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Drawing
          </p>
          <dl className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <dt>Closed shapes</dt>
              <dd className="font-mono">{closed}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Open paths</dt>
              <dd className="font-mono">{open}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Units</dt>
              <dd className="font-mono">
                {doc.insUnits ? (UNIT_LABELS[doc.insUnits] ?? `code ${doc.insUnits}`) : "not declared"}
              </dd>
            </div>
          </dl>

          {open > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Amber paths are open — fine for cutting a line, but they can&apos;t
              become a solid.
            </p>
          )}
          {doc.approximatedSplines && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Splines are drawn through their defining points, so curves may look
              slightly angular here.
            </p>
          )}
          {skipped.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Not drawn: {skipped.map(([k, n]) => `${k} ×${n}`).join(", ")}.
            </p>
          )}

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <Link
              href="/dxf-to-stl/"
              className="block px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700"
            >
              <div className="font-semibold text-sm">DXF → STL</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Extrude this drawing into a printable solid
              </div>
            </Link>
            <Link
              href="/stl-to-dxf/"
              className="block px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700"
            >
              <div className="font-semibold text-sm">STL → DXF</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Section a 3D model back into a 2D drawing
              </div>
            </Link>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">
              🔒 This file never left your browser.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
