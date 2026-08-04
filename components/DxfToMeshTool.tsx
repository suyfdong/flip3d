"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type * as THREE from "three";
import Dropzone from "@/components/Dropzone";
import DxfPreview from "@/components/DxfPreview";
import {
  disposeObject,
  exportToBlob,
  downloadBlob,
  FORMAT_LABELS,
  type Format,
} from "@/lib/converters";
import { parseDxf, type DxfDocument } from "@/lib/dxf/parse";
import {
  dxfToMesh,
  DEFAULT_DXF_EXTRUDE,
  DEPTH_MIN,
  DEPTH_MAX,
  WIDTH_MIN,
  WIDTH_MAX,
  type DxfExtrudeOptions,
  type DxfMeshResult,
} from "@/lib/dxf/dxf-to-mesh";
import {
  trackFileUploaded,
  trackSampleLoaded,
  trackFileConverted,
  trackConvertError,
} from "@/lib/analytics";

const MeshViewer = dynamic(() => import("@/components/MeshViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] rounded-xl bg-zinc-100 dark:bg-zinc-900">
      <span className="text-sm text-zinc-500">Loading viewer…</span>
    </div>
  ),
});

const EXPORT_TARGETS: Format[] = ["stl", "obj", "glb", "3mf", "ply"];

/** A gasket-style sample: an outer plate with a round hole and two slots. */
const SAMPLE_DXF = (() => {
  const groups: string[] = ["0", "SECTION", "2", "ENTITIES"];
  const ring = (pts: Array<[number, number]>) => {
    groups.push("0", "LWPOLYLINE", "90", `${pts.length}`, "70", "1");
    for (const [x, y] of pts) groups.push("10", `${x}`, "20", `${y}`);
  };
  ring([[0, 0], [80, 0], [80, 50], [0, 50]]);
  groups.push("0", "CIRCLE", "10", "40", "20", "25", "40", "12");
  ring([[10, 10], [24, 10], [24, 18], [10, 18]]);
  ring([[56, 32], [70, 32], [70, 40], [56, 40]]);
  groups.push("0", "ENDSEC", "0", "EOF", "");
  return groups.join("\n");
})();

type Status = "idle" | "loading" | "ready" | "error";

export default function DxfToMeshTool({
  targetFormat = "stl",
}: {
  targetFormat?: Format;
}) {
  const [doc, setDoc] = useState<DxfDocument | null>(null);
  const [fileName, setFileName] = useState("");
  const [opts, setOpts] = useState<DxfExtrudeOptions>(DEFAULT_DXF_EXTRUDE);
  const [result, setResult] = useState<DxfMeshResult | null>(null);
  const [format, setFormat] = useState<Format>(targetFormat);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Free the GPU buffers of the previous build whenever it's replaced.
  useEffect(() => {
    const mesh = result?.mesh;
    return () => {
      if (mesh) disposeObject(mesh as unknown as THREE.Object3D);
    };
  }, [result]);

  useEffect(() => {
    if (!doc) return;
    const handle = setTimeout(() => {
      try {
        setResult(dxfToMesh(doc, opts));
        setStatus("ready");
        setErrorMsg(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not build a solid";
        setResult(null);
        setErrorMsg(msg);
        setStatus("error");
        trackConvertError("stl", "stl", msg);
      }
    }, 120);
    return () => clearTimeout(handle);
    // Deliberately not keyed on the export format — switching STL/OBJ/GLB only
    // changes how the same solid is serialised, so rebuilding it would drop and
    // re-upload the GPU buffers for nothing.
  }, [doc, opts]);

  const load = useCallback((text: string, name: string, origin: "drop" | "sample") => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const parsed = parseDxf(text);
      setDoc(parsed);
      setFileName(name);
      setOpts(DEFAULT_DXF_EXTRUDE);
      if (origin === "drop") trackFileUploaded("stl", "drop");
      else trackSampleLoaded("stl");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not read this DXF";
      setDoc(null);
      setErrorMsg(msg);
      setStatus("error");
    }
  }, []);

  const handleFile = useCallback(
    (buffer: ArrayBuffer, name: string) => {
      load(new TextDecoder("utf-8", { fatal: false }).decode(buffer), name, "drop");
    },
    [load],
  );

  const handleReset = () => {
    setDoc(null);
    setResult(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const blob = await exportToBlob(result.mesh, format);
      const base = fileName.replace(/\.[^.]+$/, "") || "model";
      downloadBlob(blob, `${base}.${format}`);
      trackFileConverted("stl", format);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
    }
  };

  const previewPolylines = useMemo(() => doc?.polylines ?? [], [doc]);
  const skipped = doc ? Object.entries(doc.unsupported) : [];

  if (!doc) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
            DXF → 3D · Extrude
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              DXF to {FORMAT_LABELS[targetFormat]}
            </span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Turn a 2D DXF drawing into a printable 3D solid. Closed outlines are
            extruded to the thickness you pick, inner loops become holes — free,
            instant, and 100% in your browser.
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
          {status === "loading" && (
            <p className="mt-4 text-center text-sm text-zinc-500">Reading drawing…</p>
          )}
          {errorMsg && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
              ⚠️ {errorMsg}
            </div>
          )}
          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            ASCII DXF only — binary DXF and DWG aren&apos;t supported. Reads LINE,
            LWPOLYLINE, POLYLINE, CIRCLE, ARC, SPLINE, 3DFACE and block
            references.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{fileName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {result
              ? result.mode === "faces"
                ? `${result.triangles.toLocaleString()} triangles from 3DFACE entities`
                : `${result.loopCount} outline${result.loopCount === 1 ? "" : "s"} · ${result.holeCount} hole${result.holeCount === 1 ? "" : "s"} · ${result.sizeMM.map((v) => v.toFixed(1)).join(" × ")} mm`
              : "Building…"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            ← New file
          </button>
          <button
            onClick={handleDownload}
            disabled={!result}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Download {FORMAT_LABELS[format]}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="order-2 lg:order-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-[38vh] sm:h-[440px]">
            <DxfPreview polylines={previewPolylines} />
          </div>
          <div className="h-[38vh] sm:h-[440px]">
            {result ? (
              <MeshViewer object={result.mesh} />
            ) : (
              <div className="w-full h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <span className="text-sm text-zinc-500">No solid yet</span>
              </div>
            )}
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Thickness</label>
              <span className="text-xs font-mono text-zinc-500">{opts.depthMM} mm</span>
            </div>
            <input
              type="range"
              min={DEPTH_MIN}
              max={DEPTH_MAX}
              step={0.2}
              value={opts.depthMM}
              onChange={(e) => setOpts((o) => ({ ...o, depthMM: Number(e.target.value) }))}
              className="w-full accent-blue-500"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              How far the flat outline is extruded along Z.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Size</p>
            <div className="grid grid-cols-2 gap-2">
              {(["original", "width"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setOpts((o) => ({ ...o, scaleMode: m }))}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    opts.scaleMode === m
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                  }`}
                >
                  {m === "original" ? "Keep drawing units" : "Scale to width"}
                </button>
              ))}
            </div>
            {opts.scaleMode === "width" ? (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs">Width</label>
                  <span className="text-xs font-mono text-zinc-500">{opts.widthMM} mm</span>
                </div>
                <input
                  type="range"
                  min={WIDTH_MIN}
                  max={WIDTH_MAX}
                  step={5}
                  value={opts.widthMM}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, widthMM: Number(e.target.value) }))
                  }
                  className="w-full accent-blue-500"
                />
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Drawing units are read as millimetres — right for most CAD exports.
                {doc.insUnits === 1 && " This file declares inches; switch to Scale to width if it comes out 25× small."}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Export as</p>
            <div className="flex flex-wrap gap-2">
              {EXPORT_TARGETS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    format === f
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                  }`}
                >
                  {FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {result && result.openChains > 0 && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs">
              {result.openChains} line chain{result.openChains === 1 ? "" : "s"} never
              closed and couldn&apos;t be extruded (amber in the drawing). Close the
              gaps in your CAD tool to include them.
            </div>
          )}
          {doc.approximatedSplines && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs">
              This drawing contains splines. They&apos;re approximated by their
              defining points, so curves may be slightly angular.
            </div>
          )}
          {skipped.length > 0 && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs">
              Skipped entities we can&apos;t read yet:{" "}
              {skipped.map(([k, n]) => `${k} ×${n}`).join(", ")}.
            </div>
          )}
          {errorMsg && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              🔒 This file never left your browser.
            </p>
            <Link
              href="/stl-to-dxf/"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Going the other way? → STL to DXF
            </Link>
            <Link
              href="/tools/print-checker/"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Check the solid before printing → 3D Print Checker
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
        A DXF is a flat drawing, so the third dimension has to come from you: the
        outline is given the thickness you choose. Nothing is invented about the
        part&apos;s real shape, and outlines that don&apos;t close can&apos;t
        bound a solid.
      </p>
    </section>
  );
}
