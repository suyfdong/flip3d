"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as THREE from "three";
import Dropzone from "@/components/Dropzone";
import {
  parseToObject,
  exportToBlob,
  downloadBlob,
  disposeObject,
  detectFormat,
  isExportable,
  FORMAT_LABELS,
  type Format,
} from "@/lib/converters";
import { flattenToGeometry } from "@/lib/repair/repair";
import {
  applyTransform,
  sizeOf,
  scaleForLongestAxis,
  longestAxis,
  MM_PER_INCH,
  DEFAULT_TRANSFORM,
  type TransformOptions,
  type Vec3,
} from "@/lib/edit/transform";
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

const BRAND_MATERIAL = () =>
  new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.1, roughness: 0.6 });

const EXPORT_FORMATS: Format[] = ["stl", "obj", "glb", "3mf", "ply"];

type Status = "idle" | "loading" | "error";

export default function StlEditorTool() {
  const baseGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const baseSizeRef = useRef<Vec3>({ x: 0, y: 0, z: 0 });
  const [baseVersion, setBaseVersion] = useState(0);

  const [fileName, setFileName] = useState("");
  const [sourceFormat, setSourceFormat] = useState<Format>("stl");
  const [targetFormat, setTargetFormat] = useState<Format>("stl");
  const [opts, setOpts] = useState<TransformOptions>(DEFAULT_TRANSFORM);

  const [object, setObject] = useState<THREE.Mesh | null>(null);
  const [size, setSize] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [triangles, setTriangles] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dispose the previous transformed mesh whenever it's replaced / unmounted.
  useEffect(() => {
    return () => {
      if (object) disposeObject(object);
    };
  }, [object]);

  // Dispose the base geometry only on unmount.
  useEffect(() => {
    return () => {
      baseGeoRef.current?.dispose();
    };
  }, []);

  // Rebuild the transformed mesh (debounced) whenever the base or params change.
  useEffect(() => {
    const base = baseGeoRef.current;
    if (!base) return;
    const handle = setTimeout(() => {
      try {
        const geo = applyTransform(base, opts);
        const mesh = new THREE.Mesh(geo, BRAND_MATERIAL());
        setObject(mesh);
        setSize(sizeOf(geo));
        const pos = geo.getAttribute("position");
        const idx = geo.getIndex();
        setTriangles(Math.floor(idx ? idx.count / 3 : pos.count / 3));
        setStatus("idle");
        setErrorMsg(null);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Could not apply the edit");
        setStatus("error");
      }
    }, 120);
    return () => clearTimeout(handle);
  }, [baseVersion, opts]);

  const loadObject = useCallback((parsed: THREE.Object3D, fmt: Format) => {
    const base = flattenToGeometry(parsed);
    base.computeBoundingBox();
    // Centre the base on X/Y so rotation pivots sensibly; keep its own Z.
    const box = base.boundingBox!;
    base.translate(
      -(box.min.x + box.max.x) / 2,
      -(box.min.y + box.max.y) / 2,
      0,
    );
    baseGeoRef.current?.dispose();
    baseGeoRef.current = base;
    baseSizeRef.current = sizeOf(base);
    disposeObject(parsed);
    setSourceFormat(fmt);
    setTargetFormat(isExportable(fmt) ? fmt : "stl");
    setOpts(DEFAULT_TRANSFORM);
    setBaseVersion((v) => v + 1);
  }, []);

  const handleFile = useCallback(
    async (buffer: ArrayBuffer, name: string) => {
      setStatus("loading");
      setErrorMsg(null);
      const fmt = detectFormat(name) ?? "stl";
      try {
        const parsed = await parseToObject(buffer, fmt);
        loadObject(parsed, fmt);
        setFileName(name);
        trackFileUploaded(fmt, "drop");
      } catch (err) {
        const msg = err instanceof Error ? err.message : `Could not open .${fmt}`;
        setErrorMsg(msg);
        setStatus("error");
        trackConvertError(fmt, fmt, msg);
      }
    },
    [loadObject],
  );

  const handleSample = useCallback(() => {
    const geo = new THREE.TorusKnotGeometry(18, 6, 160, 24);
    const mesh = new THREE.Mesh(geo, BRAND_MATERIAL());
    loadObject(mesh, "stl");
    setFileName("sample.stl");
    trackSampleLoaded("stl");
  }, [loadObject]);

  const handleReset = () => {
    baseGeoRef.current?.dispose();
    baseGeoRef.current = null;
    setObject(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
    setOpts(DEFAULT_TRANSFORM);
  };

  const handleDownload = async () => {
    if (!object) return;
    try {
      const blob = await exportToBlob(object, targetFormat);
      const stem = fileName.replace(/\.[^.]+$/, "") || "model";
      downloadBlob(blob, `${stem}-edited.${targetFormat}`);
      trackFileConverted(sourceFormat, targetFormat);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
    }
  };

  const set = <K extends keyof TransformOptions>(k: K, v: TransformOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));

  const rotateStep = (axis: keyof Vec3, delta: number) =>
    setOpts((o) => ({
      ...o,
      rotationDeg: {
        ...o.rotationDeg,
        [axis]: (((o.rotationDeg[axis] + delta) % 360) + 360) % 360,
      },
    }));

  const multiplyScale = (factor: number) =>
    setOpts((o) => ({ ...o, scale: o.scale * factor }));

  const resizeLongest = (mm: number) =>
    set("scale", scaleForLongestAxis(baseSizeRef.current, mm));

  const loaded = baseGeoRef.current !== null;
  const scalePct = Math.round(opts.scale * 100);
  const longest = longestAxis(size);

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        {!loaded ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                STL Editor · Resize &amp; Reorient
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Free STL Editor
                </span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Open an STL and edit it in your browser — resize to an exact size,
                convert inches to millimetres, rotate to reorient for printing, drop
                it on the bed, and export. Free, instant, 100% local.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Dropzone onFileLoaded={handleFile} label="STL file" />
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">No file handy?</span>
                <button
                  onClick={handleSample}
                  className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Try a sample
                </button>
              </div>
              {status === "loading" && (
                <p className="mt-4 text-center text-sm text-zinc-500">Opening model…</p>
              )}
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
                  {fileName || "STL Editor"}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {size.x.toFixed(1)} × {size.y.toFixed(1)} × {size.z.toFixed(1)} mm ·{" "}
                  {triangles.toLocaleString()} triangles · {scalePct}% scale
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value as Format)}
                  className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  aria-label="Export format"
                >
                  {EXPORT_FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {FORMAT_LABELS[f]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleDownload}
                  disabled={!object}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50"
                >
                  Download
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  ← Open another
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
              <div className="h-[55vh] sm:h-[480px] lg:h-[560px] order-2 lg:order-1">
                <MeshViewer object={object} />
              </div>

              <div className="order-1 lg:order-2 space-y-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                {/* Scale */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Scale
                    </label>
                    <span className="text-sm font-mono tabular-nums text-zinc-500">
                      {scalePct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={400}
                    step={1}
                    value={Math.min(scalePct, 400)}
                    onChange={(e) => set("scale", Number(e.target.value) / 100)}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => multiplyScale(MM_PER_INCH)}
                      className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                      title="Model modelled in inches → millimetres"
                    >
                      inch → mm (×25.4)
                    </button>
                    <button
                      onClick={() => multiplyScale(1 / MM_PER_INCH)}
                      className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                      title="Model modelled in millimetres → inches"
                    >
                      mm → inch (÷25.4)
                    </button>
                  </div>
                </div>

                {/* Resize longest side */}
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Set longest side (mm)
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={longest ? Math.round(longest) : ""}
                      key={`${baseVersion}-${Math.round(longest)}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          resizeLongest(Number((e.target as HTMLInputElement).value));
                      }}
                      onBlur={(e) => resizeLongest(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono tabular-nums"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    Scales uniformly so proportions stay correct.
                  </p>
                </div>

                {/* Rotation */}
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Rotate (90° steps)
                  </label>
                  <div className="space-y-1.5 mt-1.5">
                    {(["x", "y", "z"] as const).map((axis) => (
                      <div key={axis} className="flex items-center gap-2">
                        <span className="w-4 text-xs font-mono uppercase text-zinc-500">
                          {axis}
                        </span>
                        <button
                          onClick={() => rotateStep(axis, -90)}
                          className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                        >
                          −90°
                        </button>
                        <button
                          onClick={() => rotateStep(axis, 90)}
                          className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                        >
                          +90°
                        </button>
                        <span className="text-xs font-mono tabular-nums text-zinc-400 ml-auto">
                          {opts.rotationDeg[axis]}°
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drop to floor */}
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opts.dropToFloor}
                    onChange={(e) => set("dropToFloor", e.target.checked)}
                    className="accent-blue-500"
                  />
                  Drop onto the print bed (z = 0)
                </label>

                <button
                  onClick={() => setOpts(DEFAULT_TRANSFORM)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  Reset edits
                </button>

                {triangles > 500000 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    High triangle count — your slicer may be slow.
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
            <h2 className="text-2xl font-bold tracking-tight mb-5">
              What you can edit
            </h2>
            <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2 list-disc pl-6 mb-8">
              <li><strong>Resize</strong> to an exact size, or scale by a percentage — always uniform so the model isn&apos;t distorted.</li>
              <li><strong>Convert units</strong> — one click turns an inch-modelled STL into millimetres (×25.4), or back.</li>
              <li><strong>Rotate</strong> in 90° steps on any axis to reorient the part for a better print.</li>
              <li><strong>Drop to the bed</strong> so the lowest point sits on z = 0, ready to slice.</li>
              <li><strong>Export</strong> to STL, OBJ, GLB, 3MF or PLY. It also opens OBJ, STEP, FBX and more — not just STL.</li>
            </ul>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/tools/stl-repair/" className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700">
                <div className="font-semibold">STL Repair</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Fix holes &amp; non-manifold edges</div>
              </Link>
              <Link href="/tools/print-checker/" className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700">
                <div className="font-semibold">3D Print Checker</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Check size, walls &amp; overhangs</div>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
