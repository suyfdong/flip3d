"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Dropzone from "@/components/Dropzone";
import { parseGcode, type ParsedGcode } from "@/lib/gcode/parser";
import { computeGcodeStats, formatDuration } from "@/lib/gcode/stats";
import { buildSampleGcode } from "@/lib/gcode/sample";
import {
  trackFileUploaded,
  trackSampleLoaded,
  trackConvertError,
} from "@/lib/analytics";
import type { GcodeViewerHandle } from "@/components/GcodeViewer";

const GcodeViewer = dynamic(() => import("@/components/GcodeViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] rounded-xl bg-zinc-100 dark:bg-zinc-900">
      <span className="text-sm text-zinc-500">Loading viewer…</span>
    </div>
  ),
});

type Status = "idle" | "loading" | "ready" | "error";

export default function GcodeSimulator() {
  const [parsed, setParsed] = useState<ParsedGcode | null>(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(100); // 0-100
  const [showTravel, setShowTravel] = useState(false);

  const viewerRef = useRef<GcodeViewerHandle | null>(null);

  const stats = useMemo(
    () => (parsed ? computeGcodeStats(parsed) : null),
    [parsed],
  );

  // Drive the viewer's drawRange whenever progress / parsed changes.
  useEffect(() => {
    if (!parsed || !viewerRef.current) return;
    const moveCount = Math.round((progressPct / 100) * parsed.moves.length);
    viewerRef.current.setProgress(moveCount);
  }, [progressPct, parsed]);

  const currentLayer = useMemo(() => {
    if (!parsed || !parsed.moves.length) return null;
    const moveIdx = Math.max(
      0,
      Math.min(
        Math.round((progressPct / 100) * parsed.moves.length) - 1,
        parsed.moves.length - 1,
      ),
    );
    return parsed.moves[moveIdx].layer;
  }, [progressPct, parsed]);

  const handleFile = async (buffer: ArrayBuffer, name: string) => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const text = new TextDecoder("utf-8").decode(buffer);
      const result = parseGcode(text);
      if (!result.moves.length) {
        throw new Error(
          "No G0/G1 motion commands detected — is this really a G-code file?",
        );
      }
      setParsed(result);
      setFileName(name);
      setProgressPct(100);
      setStatus("ready");
      trackFileUploaded("stl", "drop"); // reuse: format param unused for tools
    } catch (err) {
      console.error("G-code parse failed", err);
      const msg = err instanceof Error ? err.message : "Failed to parse G-code";
      setErrorMsg(msg);
      setStatus("error");
      trackConvertError("stl", "stl", msg);
    }
  };

  const handleSample = async () => {
    setStatus("loading");
    setErrorMsg(null);
    trackSampleLoaded("stl");
    try {
      const text = buildSampleGcode();
      const buffer = new TextEncoder().encode(text).buffer;
      await handleFile(
        buffer as ArrayBuffer,
        "flip3d-sample.gcode",
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to build sample",
      );
      setStatus("error");
    }
  };

  const handleReset = () => {
    setParsed(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
    setProgressPct(100);
  };

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        {!parsed ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                3D Printing · G-code
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  G-code Simulator
                </span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Drag in a sliced .gcode file. See the toolpath in 3D, scrub the
                print timeline, and check what the slicer&apos;s actually about
                to do before you start a 12-hour print.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Dropzone onFileLoaded={handleFile} accept={[".gcode", ".gco", ".g"]} />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 text-center">
                Bambu Studio / PrusaSlicer / OrcaSlicer / Cura outputs all
                supported.
              </p>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  No .gcode handy?
                </span>
                <button
                  onClick={handleSample}
                  disabled={status === "loading"}
                  className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  Try a sample .gcode
                </button>
              </div>

              {status === "loading" && (
                <div className="mt-4 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm">
                  Parsing G-code…
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
                <h1 className="text-2xl font-semibold tracking-tight">
                  {fileName}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {parsed.detectedSlicer
                    ? `Detected: ${parsed.detectedSlicer} · `
                    : ""}
                  Drag to rotate · scroll to zoom
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                ← Load another .gcode
              </button>
            </div>

            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                <Stat
                  label="print time"
                  value={formatDuration(stats.totalSeconds)}
                />
                <Stat
                  label="filament"
                  value={`${stats.filamentGrams.toFixed(1)} g · ${(
                    stats.filamentMm / 1000
                  ).toFixed(2)} m`}
                />
                <Stat
                  label="layers"
                  value={stats.layerCount.toLocaleString()}
                />
                <Stat
                  label="bounding box (mm)"
                  value={`${stats.bbox.x.toFixed(0)} × ${stats.bbox.y.toFixed(
                    0,
                  )} × ${stats.bbox.z.toFixed(0)}`}
                />
              </div>
            )}

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 mb-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="font-medium">Timeline</span>
                <span className="text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                  {progressPct}% · layer {currentLayer ?? "—"} /{" "}
                  {stats?.layerCount ?? 0}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={progressPct}
                onChange={(e) => setProgressPct(parseInt(e.target.value, 10))}
                className="w-full accent-blue-500"
              />
              <div className="flex items-center justify-between mt-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTravel}
                    onChange={(e) => setShowTravel(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Show travel moves
                  </span>
                </label>
                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 bg-blue-500" />
                    Extrusion
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 bg-zinc-300" />
                    Travel
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[60vh] sm:h-[480px] lg:h-[560px] flex flex-col">
              <GcodeViewer
                ref={viewerRef}
                parsed={parsed}
                showTravel={showTravel}
              />
            </div>
          </>
        )}
      </section>

      {!parsed && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-5">
              Why preview G-code before printing?
            </h2>
            <ul className="space-y-3 text-zinc-700 dark:text-zinc-300 list-disc pl-6">
              <li>
                <strong>Catch supports going to weird places</strong> — slicer
                support algorithms occasionally route under overhangs that
                won&apos;t actually need them, wasting filament and time.
              </li>
              <li>
                <strong>Verify travel routing</strong> — long travel moves
                across previously printed areas mean ringing / scarring;
                enable Show travel moves and watch the gray lines cross the
                model.
              </li>
              <li>
                <strong>Spot weird layer transitions</strong> — scrub layer-by-layer
                to find the layer where the print suddenly looks different
                (often where slicer changed strategy or hit an interface).
              </li>
              <li>
                <strong>Sanity-check before a 12-hour print</strong> — much cheaper
                than discovering at layer 200 that the model lifted off the
                bed at layer 3.
              </li>
            </ul>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-6">
              Print time and filament estimates are computed from the G-code
              itself (feedrate × distance, filament cylinder volume × density).
              Real-world times are typically 5–15% longer due to acceleration
              limits the previewer doesn&apos;t simulate.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/tools/bambu-3mf-to-prusa/"
                className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
              >
                <div className="font-semibold">Bambu 3MF → Prusa 3MF</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Cross-slicer file compatibility
                </div>
              </Link>
              <Link
                href="/reference/bambu-vs-prusa/"
                className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
              >
                <div className="font-semibold">Bambu vs Prusa</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Slicer workflow comparison
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2">
      <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
        {value}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
        {label}
      </div>
    </div>
  );
}
