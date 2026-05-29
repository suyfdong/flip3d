"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type * as THREE from "three";
import Dropzone from "@/components/Dropzone";
import { disposeObject, exportToBlob, downloadBlob } from "@/lib/converters";
import {
  svgToMesh,
  DEFAULTS,
  WIDTH_MIN,
  WIDTH_MAX,
  DEPTH_MIN,
  DEPTH_MAX,
  BASE_MAX,
  SAMPLE_SVG,
  type SvgExtrudeOptions,
} from "@/lib/svg/svg-to-mesh";
import {
  trackFileUploaded,
  trackSampleLoaded,
  trackSvgConverted,
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

const SVG_ACCEPT = [".svg"];

type Status = "idle" | "ready" | "error";

export default function SvgToStlTool() {
  const svgRef = useRef<string | null>(null);
  const [svgVersion, setSvgVersion] = useState(0);
  const [fileName, setFileName] = useState("");
  const [opts, setOpts] = useState<SvgExtrudeOptions>(DEFAULTS);
  const [object, setObject] = useState<THREE.Mesh | null>(null);
  const [triangles, setTriangles] = useState(0);
  const [shapeCount, setShapeCount] = useState(0);
  const [sizeMM, setSizeMM] = useState<[number, number, number]>([0, 0, 0]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dispose the previous mesh whenever it's replaced or on unmount.
  useEffect(() => {
    return () => {
      if (object) disposeObject(object);
    };
  }, [object]);

  // Regenerate the mesh (debounced) whenever the SVG or any param changes.
  useEffect(() => {
    if (!svgRef.current) return;
    const handle = setTimeout(() => {
      try {
        const result = svgToMesh(svgRef.current!, opts);
        setObject(result.mesh);
        setTriangles(result.triangles);
        setShapeCount(result.shapeCount);
        setSizeMM(result.sizeMM);
        setStatus("ready");
        setErrorMsg(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not build the model";
        setErrorMsg(msg);
        setStatus("error");
        trackConvertError("stl", "stl", msg);
      }
    }, 140);
    return () => clearTimeout(handle);
  }, [svgVersion, opts]);

  const loadSvg = useCallback(
    (text: string, name: string, origin: "drop" | "sample") => {
      svgRef.current = text;
      setFileName(name);
      setOpts(DEFAULTS);
      setSvgVersion((v) => v + 1);
      if (origin === "drop") trackFileUploaded("stl", "drop");
      else trackSampleLoaded("stl");
    },
    [],
  );

  const handleFile = useCallback(
    (buffer: ArrayBuffer, name: string) => {
      try {
        const text = new TextDecoder("utf-8").decode(buffer);
        loadSvg(text, name, "drop");
      } catch {
        setErrorMsg("That SVG couldn't be read. Make sure it's a valid .svg file.");
        setStatus("error");
      }
    },
    [loadSvg],
  );

  const handleSample = useCallback(() => {
    loadSvg(SAMPLE_SVG, "flip3d-sample.svg", "sample");
  }, [loadSvg]);

  const handleReset = () => {
    svgRef.current = null;
    setObject(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
    setOpts(DEFAULTS);
  };

  const handleDownload = async () => {
    if (!object) return;
    try {
      const blob = await exportToBlob(object, "stl");
      const base = fileName.replace(/\.[^.]+$/, "") || "model";
      downloadBlob(blob, `${base}.stl`);
      trackSvgConverted();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
    }
  };

  const set = <K extends keyof SvgExtrudeOptions>(
    key: K,
    value: SvgExtrudeOptions[K],
  ) => setOpts((o) => ({ ...o, [key]: value }));

  const loaded = svgRef.current !== null;

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        {!loaded ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                SVG → 3D · Extrude
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  SVG to STL
                </span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Turn an SVG logo, icon, or outline into a printable 3D model. Filled
                paths are extruded to the depth you set — drop an SVG and download an
                STL. Free, instant, 100% local.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Dropzone onFileLoaded={handleFile} accept={SVG_ACCEPT} label="SVG" />
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">No SVG handy?</span>
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
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {fileName || "SVG to STL"}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Drag to rotate · scroll to zoom · {triangles.toLocaleString()} triangles ·{" "}
                  {shapeCount} {shapeCount === 1 ? "shape" : "shapes"} ·{" "}
                  {sizeMM[0].toFixed(0)}×{sizeMM[1].toFixed(0)}×{sizeMM[2].toFixed(1)} mm
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownload}
                  disabled={!object}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50"
                >
                  Download .stl
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  ← Load another SVG
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
              <div className="h-[55vh] sm:h-[480px] lg:h-[560px] order-2 lg:order-1">
                <MeshViewer object={object} />
              </div>

              <div className="order-1 lg:order-2 space-y-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                <Slider
                  label="Width"
                  value={opts.widthMM}
                  min={WIDTH_MIN}
                  max={WIDTH_MAX}
                  step={1}
                  unit="mm"
                  onChange={(v) => set("widthMM", v)}
                />
                <Slider
                  label="Extrude depth"
                  value={opts.depthMM}
                  min={DEPTH_MIN}
                  max={DEPTH_MAX}
                  step={0.2}
                  unit="mm"
                  onChange={(v) => set("depthMM", v)}
                />
                <Slider
                  label="Base plate"
                  value={opts.baseMM}
                  min={0}
                  max={BASE_MAX}
                  step={0.2}
                  unit="mm"
                  onChange={(v) => set("baseMM", v)}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  A base plate (&gt; 0) joins detached parts of the artwork into one
                  printable body. Leave it at 0 for separate pieces.
                </p>

                {triangles > 350000 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    High triangle count — simplify the SVG if your slicer struggles.
                  </p>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
                ⚠️ {errorMsg}
              </div>
            )}
          </>
        )}
      </section>

      {!loaded && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-5">How to use it</h2>
            <ol className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2 list-decimal pl-6 mb-8">
              <li>
                Drop an SVG above. Paths need a <strong>fill</strong> — outline-only
                (stroke) SVGs have no area to extrude.
              </li>
              <li>
                Set the physical width and the extrude depth (thickness). Holes and
                counters (the inside of an &ldquo;O&rdquo;) are kept automatically.
              </li>
              <li>
                Add a base plate if your design has separate pieces, then download a
                watertight STL.
              </li>
            </ol>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/image-to-stl/"
                className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
              >
                <div className="font-semibold">Image → STL</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Turn a photo into a relief or lithophane
                </div>
              </Link>
              <Link
                href="/stl-to-3mf/"
                className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
              >
                <div className="font-semibold">STL → 3MF</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Convert the result for your slicer
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm text-zinc-700 dark:text-zinc-300">{label}</label>
        <span className="text-sm font-mono tabular-nums text-zinc-500">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}
