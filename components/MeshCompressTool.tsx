"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as THREE from "three";
import Dropzone from "@/components/Dropzone";
import UrlParamLoader from "@/components/UrlParamLoader";
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
import { takeFile } from "@/lib/file-handoff";
import {
  trackFileUploaded,
  trackSampleLoaded,
  trackConvertError,
  trackCompressed,
} from "@/lib/analytics";
import type { SimplifyReport } from "@/lib/simplify/simplify";

const MeshViewer = dynamic(() => import("@/components/MeshViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] rounded-xl bg-zinc-100 dark:bg-zinc-900">
      <span className="text-sm text-zinc-500">Loading viewer…</span>
    </div>
  ),
});

const MESH_FORMATS: Format[] = ["stl", "obj", "glb", "3mf", "ply"];
const POINT_FORMATS: Format[] = ["ply", "glb"];
const PRESETS = [0.75, 0.5, 0.25, 0.1, 0.05];
const TEXTURE_SIZES = [0, 4096, 2048, 1024, 512];

type Source = {
  object: THREE.Object3D;
  format: Format;
  bytes: number;
  isPointCloud: boolean;
  hasTextures: boolean;
  /** Multiply model units by this to get mm (GLB is metres). */
  mmPerUnit: number;
  /** Bounding-box diagonal in model units, to express deviation as a share of size. */
  diagonal: number;
};

type Output = { object: THREE.Object3D; report: SimplifyReport };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 2 : 1)} MB`;
}

function diagonalOf(object: THREE.Object3D): number {
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  return size.length() || 1;
}

function inspect(object: THREE.Object3D): { isPointCloud: boolean; hasTextures: boolean } {
  let meshes = 0;
  let points = 0;
  let hasTextures = false;
  object.traverse((n) => {
    if ((n as THREE.Points).isPoints) points++;
    const mesh = n as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes++;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      for (const v of Object.values(m)) if ((v as THREE.Texture)?.isTexture) hasTextures = true;
    }
  });
  return { isPointCloud: meshes === 0 && points > 0, hasTextures };
}

function setWireframe(object: THREE.Object3D, on: boolean) {
  object.traverse((n) => {
    const mesh = n as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) if ("wireframe" in m) (m as THREE.MeshStandardMaterial).wireframe = on;
  });
}

export default function MeshCompressTool() {
  const [source, setSource] = useState<Source | null>(null);
  const [fileName, setFileName] = useState("");
  const [ratio, setRatio] = useState(0.5);
  const [lockBorder, setLockBorder] = useState(false);
  const [targetFormat, setTargetFormat] = useState<Format>("stl");
  const [maxTexture, setMaxTexture] = useState(0);
  const [wireframe, setWireframeOn] = useState(false);

  const [output, setOutput] = useState<Output | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  /** Exact size of the file the Download button would produce right now. */
  const [outSize, setOutSize] = useState<{ key: string; blob: Blob } | null>(null);
  const [sizing, setSizing] = useState(false);

  // Dispose replaced outputs / sources.
  useEffect(() => () => { if (output) disposeObject(output.object); }, [output]);
  useEffect(() => () => { if (source) disposeObject(source.object); }, [source]);

  const loadBuffer = useCallback(
    async (buffer: ArrayBuffer, name: string, origin: "drop" | "url" | "handoff") => {
      setLoading(true);
      setErrorMsg(null);
      const fmt = detectFormat(name) ?? "stl";
      try {
        const object = await parseToObject(buffer, fmt);
        const info = inspect(object);
        setSource({
          object,
          format: fmt,
          bytes: buffer.byteLength,
          ...info,
          mmPerUnit: fmt === "glb" ? 1000 : 1,
          diagonal: diagonalOf(object),
        });
        setFileName(name);
        setTargetFormat(
          info.isPointCloud ? (fmt === "glb" ? "glb" : "ply") : isExportable(fmt) ? fmt : "stl",
        );
        setRatio(0.5);
        setMaxTexture(0);
        trackFileUploaded(fmt, origin);
      } catch (err) {
        const msg = err instanceof Error ? err.message : `Could not open .${fmt}`;
        setErrorMsg(msg);
        trackConvertError(fmt, "compress", msg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleFile = useCallback(
    (buffer: ArrayBuffer, name: string) => void loadBuffer(buffer, name, "drop"),
    [loadBuffer],
  );

  // ?handoff=1 — another tool (Image to STL, SVG to STL) passed its output here.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("handoff")) return;
    window.history.replaceState(null, "", window.location.pathname);
    takeFile().then((f) => {
      if (f) void loadBuffer(f.buffer, f.name, "handoff");
    });
  }, [loadBuffer]);

  const handleSample = useCallback(() => {
    // A dense knot (~100k triangles), the kind of file people want to shrink.
    const mesh = new THREE.Mesh(
      new THREE.TorusKnotGeometry(20, 6, 1024, 48).toNonIndexed(),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.1, roughness: 0.6 }),
    );
    mesh.geometry.computeVertexNormals();
    mesh.userData.upAxis = "z";
    const tris = mesh.geometry.getAttribute("position").count / 3;
    setSource({
      object: mesh,
      format: "stl",
      bytes: 84 + 50 * tris,
      isPointCloud: false,
      hasTextures: false,
      mmPerUnit: 1,
      diagonal: diagonalOf(mesh),
    });
    setFileName("dense-knot.stl");
    setTargetFormat("stl");
    setRatio(0.25);
    setErrorMsg(null);
    trackSampleLoaded("stl");
  }, []);

  // Re-simplify (debounced) when the source or settings change.
  useEffect(() => {
    if (!source) return;
    setBusy(true);
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const { simplifyObject, ready } = await import("@/lib/simplify/simplify");
        await ready;
        if (cancelled) return;
        const result = simplifyObject(source.object, { ratio, lockBorder });
        if (cancelled) {
          disposeObject(result.object);
          return;
        }
        setOutput(result);
        setErrorMsg(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not simplify this model";
        setErrorMsg(msg);
        trackConvertError(source.format, "compress", msg);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [source, ratio, lockBorder]);

  useEffect(() => {
    if (output) setWireframe(output.object, wireframe);
  }, [output, wireframe]);

  const exportOpts = useCallback(
    () => ({
      maxTextureSize: targetFormat === "glb" && maxTexture ? maxTexture : undefined,
      objDecimals: targetFormat === "obj" ? 6 : undefined,
    }),
    [targetFormat, maxTexture],
  );
  const sizeKey = output ? `${targetFormat}|${maxTexture}|${output.report.trianglesAfter}|${output.report.pointsAfter}|${ratio}|${lockBorder}` : "";

  // Exact output size: export in the background once the settings settle.
  useEffect(() => {
    if (!output) return;
    let cancelled = false;
    setSizing(true);
    const handle = setTimeout(async () => {
      try {
        const blob = await exportToBlob(output.object, targetFormat, exportOpts());
        if (!cancelled) setOutSize({ key: sizeKey, blob });
      } catch (err) {
        if (!cancelled) setErrorMsg(err instanceof Error ? err.message : "Export failed");
      } finally {
        if (!cancelled) setSizing(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [output, targetFormat, exportOpts, sizeKey]);

  const handleDownload = async () => {
    if (!output || !source) return;
    try {
      const blob =
        outSize && outSize.key === sizeKey
          ? outSize.blob
          : await exportToBlob(output.object, targetFormat, exportOpts());
      const stem = fileName.replace(/\.[^.]+$/, "") || "model";
      downloadBlob(blob, `${stem}-${Math.round(ratio * 100)}pct.${targetFormat}`);
      trackCompressed(source.format, targetFormat, ratio);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed";
      setErrorMsg(msg);
      trackConvertError(source.format, targetFormat, msg);
    }
  };

  const handleReset = () => {
    setSource(null);
    setOutput(null);
    setOutSize(null);
    setFileName("");
    setErrorMsg(null);
  };

  if (!source) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        <UrlParamLoader
          onLoaded={(b, n) => loadBuffer(b, n, "url")}
          onStart={() => setLoading(true)}
          onError={(m) => {
            setLoading(false);
            setErrorMsg(m);
          }}
        />
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
            Mesh Compressor · Reduce polygons
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              3D Model Compressor
            </span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Shrink STL, OBJ, GLB, 3MF and PLY files by reducing the triangle count
            while keeping the shape. See the result live, check the deviation, and
            download — free, no upload, 100% in your browser.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Dropzone onFileLoaded={handleFile} />
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">No file handy?</span>
            <button
              onClick={handleSample}
              className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Try a sample
            </button>
          </div>
          {loading && <p className="mt-4 text-center text-sm text-zinc-500">Opening model…</p>}
          {errorMsg && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
              ⚠️ {errorMsg}
            </div>
          )}
          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Textures, UVs and vertex colours are kept. STEP / IGES / FBX / DAE open
            too and export as a mesh format.
          </p>
        </div>
      </section>
    );
  }

  const r = output?.report;
  const unit = source.isPointCloud ? "points" : "triangles";
  const before = r ? (source.isPointCloud ? r.pointsBefore : r.trianglesBefore) : 0;
  const after = r ? (source.isPointCloud ? r.pointsAfter : r.trianglesAfter) : 0;
  const sizeNow = outSize && outSize.key === sizeKey ? outSize.blob.size : null;
  const saved = sizeNow !== null ? 1 - sizeNow / source.bytes : null;
  const formats = source.isPointCloud ? POINT_FORMATS : MESH_FORMATS;
  const errMM = r ? r.maxError * source.mmPerUnit : 0;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{fileName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {r
              ? `${before.toLocaleString("en-US")} → ${after.toLocaleString("en-US")} ${unit} · ${formatBytes(source.bytes)} → ${
                  sizeNow !== null ? formatBytes(sizeNow) : "…"
                }${saved !== null ? ` (${saved >= 0 ? "−" : "+"}${Math.abs(Math.round(saved * 100))}%)` : ""}`
              : "Simplifying…"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value as Format)}
            className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            aria-label="Export format"
          >
            {formats.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
          <button
            onClick={handleDownload}
            disabled={!output || busy}
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
        <div className="relative h-[55vh] sm:h-[480px] lg:h-[560px] order-2 lg:order-1">
          <MeshViewer object={output?.object ?? null} preserveView />
          {busy && (
            <span className="absolute top-3 left-3 text-xs px-2 py-1 rounded bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-300">
              Simplifying…
            </span>
          )}
        </div>

        <div className="order-1 lg:order-2 space-y-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Keep {unit}
              </label>
              <span className="text-sm font-mono tabular-nums text-zinc-500">
                {ratio < 0.1 ? (ratio * 100).toFixed(1) : Math.round(ratio * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              // Square-root scale: more travel at the low end, where 2% vs 5% matters.
              value={Math.round(Math.sqrt(ratio) * 1000)}
              onChange={(e) => {
                const t = Number(e.target.value) / 1000;
                setRatio(Math.max(0.005, Math.min(1, t * t)));
              }}
              className="w-full accent-blue-500"
              aria-label={`Share of ${unit} to keep`}
            />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setRatio(p)}
                  className={`px-2 py-0.5 text-xs rounded border ${
                    Math.abs(ratio - p) < 1e-6
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                  }`}
                >
                  {p * 100}%
                </button>
              ))}
            </div>
          </div>

          {!source.isPointCloud && r && (
            <dl className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <dt>Max deviation</dt>
                <dd className="font-mono">
                  {errMM < 0.001 ? "< 0.001" : errMM.toFixed(errMM < 1 ? 3 : 2)}{" "}
                  {source.format === "glb" || source.format === "stl" || source.format === "3mf" ? "mm" : "units"}
                  <span className="text-zinc-400"> · {((r.maxError / source.diagonal) * 100).toFixed(2)}% of size</span>
                </dd>
              </div>
            </dl>
          )}

          {!source.isPointCloud && (
            <>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lockBorder}
                  onChange={(e) => setLockBorder(e.target.checked)}
                  className="accent-blue-500 mt-0.5"
                />
                <span>
                  Keep open edges exact
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    For surfaces with an outline (terrain, a scan with holes). Closed
                    models don&apos;t need it.
                  </span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={wireframe}
                  onChange={(e) => setWireframeOn(e.target.checked)}
                  className="accent-blue-500"
                />
                Show wireframe
              </label>
            </>
          )}

          {targetFormat === "glb" && source.hasTextures && (
            <div>
              <label className="text-sm font-medium block mb-1">Max texture size</label>
              <select
                value={maxTexture}
                onChange={(e) => setMaxTexture(Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5"
              >
                {TEXTURE_SIZES.map((t) => (
                  <option key={t} value={t}>
                    {t === 0 ? "Keep original" : `${t} × ${t} px`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Textures are often most of a GLB&apos;s size — halving them cuts that part by ~75%.
              </p>
            </div>
          )}

          <ul className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400 list-disc pl-4">
            {sizing && <li>Measuring the output file…</li>}
            {r?.limited && (
              <li className="text-amber-700 dark:text-amber-400">
                Some parts couldn&apos;t go this low without breaking their shape or
                outline, so the result has a few more {unit} than asked.
              </li>
            )}
            {source.hasTextures && targetFormat !== "glb" && (
              <li className="text-amber-700 dark:text-amber-400">
                {FORMAT_LABELS[targetFormat]} doesn&apos;t carry textures — choose GLB to keep them.
              </li>
            )}
            {saved !== null && saved < 0 && (
              <li className="text-amber-700 dark:text-amber-400">
                The output is larger than the original — the source was already
                compressed (e.g. Draco/meshopt GLB) or the format stores more per
                triangle. Try another format or a lower percentage.
              </li>
            )}
            {!source.isPointCloud && (
              <li>Closed models stay closed; UV seams and texture coordinates are kept.</li>
            )}
          </ul>

          {errorMsg && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">🔒 This file never left your browser.</p>
            <Link href="/tools/print-checker/" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Check it&apos;s still printable → Print Checker
            </Link>
            <Link href="/tools/stl-repair/" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Holes or bad edges? → STL Repair
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
