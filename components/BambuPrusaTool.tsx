"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as THREE from "three";
import Dropzone from "@/components/Dropzone";
import {
  parseToObject,
  disposeObject,
  downloadBlob,
} from "@/lib/converters";
import {
  sanitize3MF,
  type SanitizeReport,
} from "@/lib/converters/3mf-sanitizer";
import {
  trackFileUploaded,
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

type Direction = "bambu-to-prusa" | "prusa-to-bambu";

type Status = "idle" | "loading" | "processing" | "ready" | "error";

type Props = {
  direction: Direction;
};

const DIRECTION_COPY: Record<
  Direction,
  {
    fromName: string;
    toName: string;
    title: string;
    tagline: string;
    sourceHint: string;
    targetHint: string;
  }
> = {
  "bambu-to-prusa": {
    fromName: "Bambu Studio",
    toName: "PrusaSlicer",
    title: "Bambu 3MF → Prusa 3MF",
    tagline:
      "PrusaSlicer choking on a .3mf exported from Bambu Studio? Strip the Bambu-private metadata so any standard slicer can open it.",
    sourceHint:
      "Drop a .3mf exported from Bambu Studio, OrcaSlicer, or Bambu Handy.",
    targetHint: "Open the result in PrusaSlicer (or any spec-compliant slicer).",
  },
  "prusa-to-bambu": {
    fromName: "PrusaSlicer",
    toName: "Bambu Studio",
    title: "Prusa 3MF → Bambu 3MF",
    tagline:
      "Bambu Studio rejecting a PrusaSlicer .3mf? Re-package it as a clean 3MF that Bambu Studio's import will accept.",
    sourceHint:
      "Drop a .3mf saved from PrusaSlicer (Slic3rPE / PrusaSlicer dialect).",
    targetHint: "Open the result in Bambu Studio — geometry imports cleanly.",
  },
};

export default function BambuPrusaTool({ direction }: Props) {
  const copy = DIRECTION_COPY[direction];

  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<SanitizeReport | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);

  const handleFile = async (buffer: ArrayBuffer, name: string) => {
    setStatus("loading");
    setErrorMsg(null);
    setReport(null);
    setOutputBlob(null);

    try {
      // 1. Preview: parse 3MF for the viewer
      const parsed = await parseToObject(buffer, "3mf");
      if (object) disposeObject(object);
      setObject(parsed);
      setFileName(name);
      trackFileUploaded("3mf", "drop");

      // 2. Sanitize: produce the cleaned .3mf
      setStatus("processing");
      const file = new File([buffer], name, { type: "model/3mf" });
      const { blob, report: r } = await sanitize3MF(file);
      setOutputBlob(blob);
      setReport(r);
      setStatus("ready");
    } catch (err) {
      console.error("Sanitize failed", err);
      const msg = err instanceof Error ? err.message : "Couldn't process file";
      setErrorMsg(msg);
      setStatus("error");
      trackConvertError("3mf", "3mf", msg);
    }
  };

  const handleDownload = () => {
    if (!outputBlob) return;
    const base = fileName.replace(/\.[^.]+$/, "") || "model";
    const suffix = direction === "bambu-to-prusa" ? "prusa" : "bambu";
    downloadBlob(outputBlob, `${base}-${suffix}.3mf`);
    trackFileConverted("3mf", "3mf");
  };

  const handleReset = () => {
    if (object) disposeObject(object);
    setObject(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
    setReport(null);
    setOutputBlob(null);
  };

  const reverseSlug =
    direction === "bambu-to-prusa"
      ? "/tools/prusa-3mf-to-bambu/"
      : "/tools/bambu-3mf-to-prusa/";
  const reverseLabel =
    direction === "bambu-to-prusa"
      ? "Prusa → Bambu"
      : "Bambu → Prusa";

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        {!object ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                3D Printing · Cross-vendor
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {copy.title}
                </span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {copy.tagline}
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Dropzone onFileLoaded={handleFile} accept={[".3mf"]} />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 text-center">
                {copy.sourceHint}
              </p>

              {status === "loading" && (
                <div className="mt-4 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm">
                  Parsing .3mf…
                </div>
              )}
              {status === "processing" && (
                <div className="mt-4 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm">
                  Sanitizing…
                </div>
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
                <h1 className="text-2xl font-semibold tracking-tight">{fileName}</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Drag to rotate · scroll to zoom
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                ← Load another .3mf
              </button>
            </div>

            <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {copy.fromName}
                </span>
                <span className="text-zinc-500">→</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {copy.toName}
                </span>
                {status === "ready" && report && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                    {(report.outputBytes / 1024).toFixed(1)} KB
                    {report.outputBytes < report.inputBytes && (
                      <>
                        {" "}
                        (saved{" "}
                        {Math.round(
                          (1 - report.outputBytes / report.inputBytes) * 100,
                        )}
                        %)
                      </>
                    )}
                  </span>
                )}
              </div>
              <button
                onClick={handleDownload}
                disabled={status !== "ready" || !outputBlob}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "ready" ? "Download cleaned .3mf" : "Processing…"}
              </button>
            </div>

            {report && (report.droppedPaths.length > 0 || report.strippedNamespaces.length > 0) && (
              <details className="mb-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm">
                <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-300">
                  What was removed
                </summary>
                <div className="mt-3 space-y-3 text-zinc-600 dark:text-zinc-400">
                  {report.strippedNamespaces.length > 0 && (
                    <div>
                      <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Private XML namespaces stripped:
                      </p>
                      <ul className="list-disc pl-6 font-mono text-xs">
                        {report.strippedNamespaces.map((ns) => (
                          <li key={ns}>xmlns:{ns}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.droppedPaths.length > 0 && (
                    <div>
                      <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Slicer-private files dropped ({report.droppedPaths.length}):
                      </p>
                      <ul className="list-disc pl-6 font-mono text-xs max-h-32 overflow-y-auto">
                        {report.droppedPaths.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs italic">
                    Geometry, units, and base material are preserved. Slicer-specific
                    settings (AMS map, pressure advance, calibration cache) are dropped —
                    re-slice in {copy.toName}.
                  </p>
                </div>
              </details>
            )}

            <div className="h-[60vh] sm:h-[480px] lg:h-[560px]">
              <MeshViewer object={object} />
            </div>
          </>
        )}
      </section>

      {!object && (
        <>
          <section className="border-t border-zinc-200 dark:border-zinc-800 py-14">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold tracking-tight mb-5">
                What this tool does (and doesn&apos;t)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-5">
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    ✓ Preserved
                  </h3>
                  <ul className="text-sm space-y-1 text-zinc-700 dark:text-zinc-300">
                    <li>All geometry (every mesh, every triangle)</li>
                    <li>Object hierarchy &amp; transforms</li>
                    <li>Base materials &amp; colors</li>
                    <li>Units (millimeters by default)</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-5">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                    ⚠ Dropped (you re-slice anyway)
                  </h3>
                  <ul className="text-sm space-y-1 text-zinc-700 dark:text-zinc-300">
                    <li>AMS / MMU multi-material slot maps</li>
                    <li>Slicer calibration cache</li>
                    <li>Pressure advance &amp; printer profiles</li>
                    <li>Sliced G-code (if embedded)</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Cross-slicer printer settings don&apos;t translate cleanly anyway —
                Bambu&apos;s AMS speaks a different language than Prusa&apos;s MMU3.
                The geometry is the part that needs to move across; you re-slice in
                the destination slicer either way. This tool just gets the geometry
                through the door.
              </p>
            </div>
          </section>

          <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <h2 className="text-xl font-bold tracking-tight mb-4">
                Related
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href={reverseSlug}
                  className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="font-semibold">{reverseLabel}</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Go the other way
                  </div>
                </Link>
                <Link
                  href="/reference/bambu-vs-prusa/"
                  className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="font-semibold">Bambu vs Prusa, explained</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Why these files don&apos;t cross over cleanly
                  </div>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
