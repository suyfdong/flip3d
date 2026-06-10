"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as THREE from "three";
import Dropzone, { SUPPORTED_FORMATS } from "@/components/Dropzone";
import {
  parseToObject,
  detectFormat,
  exportToBlob,
  disposeObject,
} from "@/lib/converters";
import { flattenToGeometry } from "@/lib/repair/repair";
import {
  analyzePrintReadiness,
  type PrintReadiness,
} from "@/lib/print-check/analyze";
import {
  trackFileUploaded,
  trackSampleLoaded,
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

type Status = "idle" | "loading" | "ready" | "error";

const VERDICT_COLOR = { ready: 0x22c55e, warn: 0xf59e0b, fail: 0xef4444 };
const VERDICT_UI = {
  ready: {
    label: "Print-ready",
    cls: "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300",
    icon: "✓",
  },
  warn: {
    label: "Printable — with care",
    cls: "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300",
    icon: "!",
  },
  fail: {
    label: "Not print-ready",
    cls: "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300",
    icon: "✕",
  },
};

export default function PrintCheckTool() {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [report, setReport] = useState<PrintReadiness | null>(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (object) disposeObject(object);
    };
  }, [object]);

  const handleFile = async (
    buffer: ArrayBuffer,
    name: string,
    source: "drop" | "sample" = "drop",
  ) => {
    const fmt = detectFormat(name) ?? "stl";
    setStatus("loading");
    setErrorMsg(null);
    try {
      const parsed = await parseToObject(buffer, fmt);
      trackFileUploaded(fmt, source);

      // Reuse the repair flatten step: one merged, world-space geometry.
      const geo = flattenToGeometry(parsed);
      const result = analyzePrintReadiness(geo);

      // Show a verdict-colored copy so the model itself signals pass/warn/fail.
      const displayGeo = geo.clone();
      displayGeo.computeVertexNormals();
      const mesh = new THREE.Mesh(
        displayGeo,
        new THREE.MeshStandardMaterial({
          color: VERDICT_COLOR[result.verdict],
          metalness: 0.1,
          roughness: 0.6,
        }),
      );
      geo.dispose();
      disposeObject(parsed);

      setObject(mesh);
      setReport(result);
      setFileName(name);
      setStatus("ready");
    } catch (err) {
      console.error("Print check failed", err);
      const msg = err instanceof Error ? err.message : "Could not analyze file";
      setErrorMsg(msg);
      setStatus("error");
      trackConvertError(fmt, "stl", msg);
    }
  };

  const handleSample = async () => {
    setStatus("loading");
    setErrorMsg(null);
    trackSampleLoaded("stl");
    try {
      // A torus knot: watertight but full of curved overhangs — shows a
      // non-trivial report (size, volume, overhang %) rather than a clean cube.
      const geo = new THREE.TorusKnotGeometry(20, 6, 160, 24);
      const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
      const mesh = new THREE.Mesh(geo, mat);
      const blob = await exportToBlob(mesh, "stl");
      geo.dispose();
      mat.dispose();
      await handleFile(await blob.arrayBuffer(), "flip3d-sample.stl", "sample");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to build sample");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setObject(null);
    setReport(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
  };

  const hasTopologyIssue =
    !!report && (!report.topology.isClosed || !report.topology.isManifold);

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        {!object || !report ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                3D Printing · Pre-flight Check
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  3D Print Checker
                </span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Drop an STL (or OBJ, 3MF, STEP…) and get an instant pre-flight
                report: watertight, manifold, size &amp; units, overhangs, and
                whether it fits your print bed. Free, 100% local — nothing is
                uploaded.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Dropzone onFileLoaded={handleFile} accept={[...SUPPORTED_FORMATS]} />
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">No file handy?</span>
                <button
                  onClick={handleSample}
                  disabled={status === "loading"}
                  className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  Try a sample
                </button>
              </div>
              {status === "loading" && (
                <div className="mt-4 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300">
                  Analyzing…
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
                  Drag to rotate · scroll to zoom ·{" "}
                  {report.topology.triangles.toLocaleString()} triangles
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                ← Check another
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
              <div className="h-[55vh] sm:h-[480px] lg:h-[560px] order-2 lg:order-1">
                <MeshViewer object={object} />
              </div>

              <div className="order-1 lg:order-2 space-y-3">
                {/* verdict banner */}
                <div
                  className={`rounded-xl border p-4 ${VERDICT_UI[report.verdict].cls}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current font-bold">
                      {VERDICT_UI[report.verdict].icon}
                    </span>
                    <span className="text-lg font-semibold">
                      {VERDICT_UI[report.verdict].label}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {report.reasons.map((r, i) => (
                      <li key={i} className="leading-snug">
                        • {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* check cards */}
                <div className="grid grid-cols-2 gap-2">
                  <CheckCard
                    label="Watertight"
                    ok={report.topology.isClosed}
                    detail={
                      report.topology.isClosed
                        ? "No holes"
                        : `${report.topology.boundaryEdges} open edges`
                    }
                  />
                  <CheckCard
                    label="Manifold"
                    ok={report.topology.isManifold}
                    detail={
                      report.topology.nonManifoldEdges === 0
                        ? "Clean topology"
                        : `${report.topology.nonManifoldEdges} bad edges`
                    }
                  />
                  <CheckCard
                    label="Size"
                    ok={report.unitWarning === null}
                    detail={`${report.sizeMM[0].toFixed(0)}×${report.sizeMM[1].toFixed(0)}×${report.sizeMM[2].toFixed(0)} mm`}
                  />
                  <CheckCard
                    label={`Overhangs >${report.overhangThresholdDeg}°`}
                    ok={report.overhangAreaPct <= 25}
                    detail={`${report.overhangAreaPct.toFixed(0)}% of surface`}
                  />
                </div>

                {/* bed fit */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
                    Fits print bed?
                  </div>
                  <ul className="space-y-1 text-sm">
                    {report.bedFits.map((b) => (
                      <li key={b.name} className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {b.name}
                        </span>
                        <span
                          className={
                            b.fits
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {b.fits ? "✓ fits" : "✕ too big"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {report.volumeCm3 !== null && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Solid volume ≈ {report.volumeCm3.toFixed(1)} cm³
                    </p>
                  )}
                </div>

                {hasTopologyIssue && (
                  <Link
                    href="/tools/stl-repair/"
                    className="block text-center px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
                  >
                    Fix holes &amp; bad edges → STL Repair
                  </Link>
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

      {!object && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-5">
              What the print check looks at
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-700 dark:text-zinc-300 mb-8">
              <li className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <strong>Watertight &amp; manifold</strong> — open holes and bad
                edges are the #1 reason a slicer prints hollow or fails.
              </li>
              <li className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <strong>Size &amp; units</strong> — flags models that come in
                under 1&nbsp;mm or over 1&nbsp;m, the classic unit mismatch.
              </li>
              <li className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <strong>Bed fit</strong> — checks the footprint against common
                Bambu, Prusa and Creality beds (90° rotation allowed).
              </li>
              <li className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <strong>Overhangs</strong> — how much of the surface tips past
                45° and will need supports.
              </li>
            </ul>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/tools/stl-repair/"
                className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
              >
                <div className="font-semibold">STL Repair</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Weld vertices &amp; fix holes the check finds
                </div>
              </Link>
              <Link
                href="/reference/stl-vs-obj-vs-3mf/"
                className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
              >
                <div className="font-semibold">STL vs OBJ vs 3MF</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Which format to slice from, and why
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function CheckCard({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </span>
        <span
          className={
            ok
              ? "text-green-600 dark:text-green-400"
              : "text-amber-600 dark:text-amber-400"
          }
        >
          {ok ? "✓" : "!"}
        </span>
      </div>
      <div className="mt-1 text-sm font-medium">{detail}</div>
    </div>
  );
}
