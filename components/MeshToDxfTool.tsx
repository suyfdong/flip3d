"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import Dropzone, { SUPPORTED_FORMATS } from "@/components/Dropzone";
import DxfPreview from "@/components/DxfPreview";
import { parseToObject, downloadBlob, detectFormat, type Format } from "@/lib/converters";
import { flattenToGeometry } from "@/lib/repair/repair";
import { writeDxfPolylines, writeDxf3dFaces, type Polyline } from "@/lib/dxf/write";
import { sliceAtZ, meshToTriangles, zRange } from "@/lib/dxf/section";
import {
  trackFileUploaded,
  trackSampleLoaded,
  trackFileConverted,
  trackConvertError,
} from "@/lib/analytics";

export type MeshToDxfVariant = "stl" | "step";

const VARIANT_COPY: Record<
  MeshToDxfVariant,
  {
    eyebrow: string;
    title: string;
    intro: string;
    accept: string[];
    label: string;
    format: Format;
  }
> = {
  stl: {
    eyebrow: "STL → DXF · Section & outline",
    title: "STL to DXF",
    intro:
      "Cut a horizontal section through an STL and export it as a DXF outline for laser cutting or CNC — or hand the whole mesh over as DXF 3DFACE triangles. Free, instant, 100% local.",
    accept: [...SUPPORTED_FORMATS],
    label: "STL file",
    format: "stl",
  },
  step: {
    eyebrow: "STEP → DXF · Section & outline",
    title: "STEP to DXF",
    intro:
      "Take a horizontal section through a STEP or STP part and export it as a DXF outline for laser cutting, waterjet or CNC. Free, in the browser, no CAD licence needed.",
    accept: [".step", ".stp"],
    label: "STEP file",
    format: "step",
  },
};

type Mode = "section" | "faces";
type Status = "idle" | "loading" | "ready" | "error";

export default function MeshToDxfTool({
  variant = "stl",
}: {
  variant?: MeshToDxfVariant;
}) {
  const copy = VARIANT_COPY[variant];

  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<Mode>("section");
  const [z, setZ] = useState(0);
  const [bounds, setBounds] = useState<[number, number]>([0, 1]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  const slice = useMemo(() => {
    if (!geometry || mode !== "section") return null;
    try {
      return sliceAtZ(geometry, z);
    } catch {
      return null;
    }
  }, [geometry, mode, z]);

  const triangles = useMemo(
    () => (geometry && mode === "faces" ? meshToTriangles(geometry) : null),
    [geometry, mode],
  );

  const load = useCallback(
    async (buffer: ArrayBuffer, name: string, origin: "drop" | "sample") => {
      setStatus("loading");
      setErrorMsg(null);
      try {
        const fmt = detectFormat(name) ?? copy.format;
        const object = await parseToObject(buffer, fmt);
        const geo = flattenToGeometry(object);
        const [lo, hi] = zRange(geo);
        if (!(hi > lo)) {
          throw new Error("This model is flat in Z, so there's no section to take.");
        }
        setGeometry(geo);
        setBounds([lo, hi]);
        setZ((lo + hi) / 2);
        setFileName(name);
        setStatus("ready");
        if (origin === "drop") trackFileUploaded(fmt, "drop");
        else trackSampleLoaded(fmt);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not read this model";
        setErrorMsg(msg);
        setStatus("error");
        trackConvertError(copy.format, "stl", msg);
      }
    },
    [copy.format],
  );

  const handleFile = useCallback(
    (buffer: ArrayBuffer, name: string) => void load(buffer, name, "drop"),
    [load],
  );

  const handleSample = useCallback(() => {
    // A plate with two bolt holes — exactly the kind of part people section.
    const shape = new THREE.Shape([
      new THREE.Vector2(-30, -20),
      new THREE.Vector2(30, -20),
      new THREE.Vector2(30, 20),
      new THREE.Vector2(-30, 20),
    ]);
    for (const cx of [-18, 18]) {
      const hole = new THREE.Path();
      hole.absarc(cx, 0, 6, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false });
    const [lo, hi] = zRange(geo);
    setGeometry(geo);
    setBounds([lo, hi]);
    setZ((lo + hi) / 2);
    setFileName(`flip3d-sample.${variant === "step" ? "step" : "stl"}`);
    setStatus("ready");
    trackSampleLoaded(copy.format);
  }, [copy.format, variant]);

  const handleReset = () => {
    setGeometry(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
  };

  const handleDownload = () => {
    try {
      const base = fileName.replace(/\.[^.]+$/, "") || "model";
      let dxf: string;
      if (mode === "faces") {
        if (!triangles?.length) throw new Error("Nothing to export.");
        dxf = writeDxf3dFaces(triangles, { units: "mm", layer: "MESH" });
      } else {
        const polys: Polyline[] = slice?.polylines ?? [];
        if (polys.length === 0) {
          throw new Error("This section is empty — move the cut height into the model.");
        }
        dxf = writeDxfPolylines(polys, { units: "mm", layer: "SECTION" });
      }
      downloadBlob(new Blob([dxf], { type: "image/vnd.dxf" }), `${base}.dxf`);
      trackFileConverted(copy.format, "stl");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
    }
  };

  if (!geometry) {
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
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {copy.intro}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Dropzone onFileLoaded={handleFile} accept={copy.accept} label={copy.label} />
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Nothing handy?</span>
            <button
              onClick={handleSample}
              className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Try a sample
            </button>
          </div>
          {status === "loading" && (
            <p className="mt-4 text-center text-sm text-zinc-500">Reading model…</p>
          )}
          {errorMsg && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
              ⚠️ {errorMsg}
            </div>
          )}
          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            DXF is a 2D drawing format, so a 3D model can&apos;t go across
            unchanged. You get a real section through the part — or every
            triangle as 3DFACE entities if you need the full shape in CAD.
          </p>
        </div>
      </section>
    );
  }

  const [lo, hi] = bounds;
  const step = Math.max((hi - lo) / 500, 1e-4);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{fileName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {mode === "section"
              ? slice
                ? `${slice.closedLoops} closed outline${slice.closedLoops === 1 ? "" : "s"}${slice.openChains > 0 ? ` · ${slice.openChains} open chain${slice.openChains === 1 ? "" : "s"}` : ""} at Z ${z.toFixed(2)} mm`
                : "Sectioning…"
              : `${triangles?.length ?? 0} triangles as 3DFACE entities`}
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
            className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
          >
            Download DXF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="order-2 lg:order-1 h-[45vh] sm:h-[480px]">
          {mode === "section" ? (
            <DxfPreview polylines={slice?.polylines ?? []} />
          ) : (
            <div className="w-full h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-4xl mb-3">🧊</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-sm">
                  Every triangle is written straight through as a DXF 3DFACE
                  entity — the shape is unchanged, so there&apos;s no 2D outline
                  to preview here.
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                  {(triangles?.length ?? 0).toLocaleString()} faces ≈{" "}
                  {Math.round(((triangles?.length ?? 0) * 210) / 1024).toLocaleString()} KB
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2 space-y-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div>
            <p className="text-sm font-medium mb-2">What to export</p>
            <div className="grid grid-cols-2 gap-2">
              {(["section", "faces"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    mode === m
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                  }`}
                >
                  {m === "section" ? "2D section" : "3D faces"}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {mode === "section"
                ? "A flat outline where the plane cuts the model — for laser, waterjet and CNC."
                : "The whole mesh as 3DFACE triangles — for importing the 3D shape into CAD."}
            </p>
          </div>

          {mode === "section" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Cut height (Z)</label>
                <span className="text-xs font-mono text-zinc-500">{z.toFixed(2)} mm</span>
              </div>
              <input
                type="range"
                min={lo}
                max={hi}
                step={step}
                value={z}
                onChange={(e) => setZ(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 mt-1">
                <span>{lo.toFixed(1)}</span>
                <span>{hi.toFixed(1)}</span>
              </div>
              {slice && slice.openChains > 0 && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs">
                  {slice.openChains} chain{slice.openChains === 1 ? "" : "s"} didn&apos;t
                  close — the mesh has holes or non-manifold edges at this height.
                  They&apos;re exported as open polylines (amber in the preview).
                  <Link href="/tools/stl-repair/" className="underline ml-1">
                    Repair the mesh
                  </Link>
                </div>
              )}
              {slice && slice.polylines.length === 0 && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs">
                  Nothing at this height — move the slider into the part.
                </div>
              )}
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
              href="/dxf-to-stl/"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Going the other way? → DXF to STL
            </Link>
            <Link
              href="/tools/print-checker/"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Check this model for printing → 3D Print Checker
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
        A 2D section is a genuine slice through the model at the height you pick —
        not a flattened silhouette, and not a redrawn CAD sketch. Curved walls
        change shape with height, so pick the height that matters for your cut.
      </p>
    </section>
  );
}
