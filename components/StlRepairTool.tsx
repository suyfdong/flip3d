"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as THREE from "three";
import Dropzone, { SUPPORTED_FORMATS } from "@/components/Dropzone";
import {
  parseToObject,
  detectFormat,
  exportToBlob,
  downloadBlob,
  disposeObject,
  type Format,
} from "@/lib/converters";
import { repairObject, type RepairReport } from "@/lib/repair/repair";
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

type Status = "idle" | "loading" | "ready" | "error";
type ViewMode = "before" | "after";

const BRAND_BLUE = 0x3b82f6;
const ISSUE_RED = 0xef4444;

function buildBrokenSampleMesh(): THREE.Mesh {
  // Construct a deliberately broken mesh:
  // - a triangle with a duplicate vertex (degenerate after merge)
  // - a few overlapping vertices that should weld
  // - a hole (one face missing from a closed cube)
  const positions: number[] = [];

  const v: [number, number, number][] = [
    [-5, -5, -5], [ 5, -5, -5], [ 5,  5, -5], [-5,  5, -5],
    [-5, -5,  5], [ 5, -5,  5], [ 5,  5,  5], [-5,  5,  5],
  ];

  const tri = (a: number, b: number, c: number) => {
    positions.push(...v[a], ...v[b], ...v[c]);
  };

  // bottom
  tri(0, 1, 2); tri(0, 2, 3);
  // top
  tri(4, 6, 5); tri(4, 7, 6);
  // front
  tri(0, 4, 5); tri(0, 5, 1);
  // back
  tri(3, 2, 6); tri(3, 6, 7);
  // left
  tri(0, 3, 7); tri(0, 7, 4);
  // right (intentionally OMITTED → leaves a hole)

  // Add a degenerate triangle (collapsed) to trigger that repair path.
  positions.push(0, 0, 0,  0, 0, 0,  1, 0, 0);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: BRAND_BLUE,
    metalness: 0.1,
    roughness: 0.6,
  });
  return new THREE.Mesh(geo, mat);
}

export default function StlRepairTool() {
  const [originalObject, setOriginalObject] = useState<THREE.Object3D | null>(null);
  const [repairedObject, setRepairedObject] = useState<THREE.Object3D | null>(null);
  const [report, setReport] = useState<RepairReport | null>(null);
  const [fileName, setFileName] = useState("");
  const [view, setView] = useState<ViewMode>("after");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dispose both objects on unmount or when replaced.
  useEffect(() => {
    return () => {
      if (originalObject) disposeObject(originalObject);
    };
  }, [originalObject]);
  useEffect(() => {
    return () => {
      if (repairedObject) disposeObject(repairedObject);
    };
  }, [repairedObject]);

  const displayObject = view === "before" ? originalObject : repairedObject;

  const issueCount = useMemo(() => {
    if (!report) return 0;
    return (
      report.before.duplicateVertexGroups +
      report.before.degenerateTriangles +
      report.before.boundaryEdges +
      report.before.nonManifoldEdges
    );
  }, [report]);

  const runRepair = async (input: THREE.Object3D, sourceFormat: Format) => {
    const { geometry, report: r } = repairObject(input);

    // Build a repaired Object3D for the viewer. Use a red material if any
    // issues remain (boundary/non-manifold edges) so the user sees something
    // is still off even after the fix.
    const issuesRemaining =
      r.after.boundaryEdges > 0 || r.after.nonManifoldEdges > 0;
    const mat = new THREE.MeshStandardMaterial({
      color: issuesRemaining ? ISSUE_RED : BRAND_BLUE,
      metalness: 0.1,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, mat);
    setRepairedObject(mesh);
    setReport(r);
    trackFileConverted(sourceFormat, "stl");
  };

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
      setOriginalObject(parsed);
      setFileName(name);
      trackFileUploaded(fmt, source);
      await runRepair(parsed, fmt);
      setStatus("ready");
    } catch (err) {
      console.error("Repair failed", err);
      const msg = err instanceof Error ? err.message : "Repair failed";
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
      const broken = buildBrokenSampleMesh();
      const blob = await exportToBlob(broken, "stl");
      broken.geometry.dispose();
      (broken.material as THREE.Material).dispose();
      const buffer = await blob.arrayBuffer();
      await handleFile(buffer, "flip3d-broken-sample.stl", "sample");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to build sample");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setOriginalObject(null);
    setRepairedObject(null);
    setReport(null);
    setFileName("");
    setView("after");
    setStatus("idle");
    setErrorMsg(null);
  };

  const handleDownload = async () => {
    if (!repairedObject) return;
    try {
      const blob = await exportToBlob(repairedObject, "stl");
      const base = fileName.replace(/\.[^.]+$/, "") || "repaired";
      downloadBlob(blob, `${base}-repaired.stl`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
    }
  };

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        {!originalObject ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                3D Printing · Mesh Cleanup
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  STL Repair
                </span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Welds duplicate vertices, removes degenerate triangles, and
                detects holes / non-manifold edges that make slicers complain.
                Free, instant, 100% local.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Dropzone onFileLoaded={handleFile} accept={[...SUPPORTED_FORMATS]} />

              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  No file handy?
                </span>
                <button
                  onClick={handleSample}
                  disabled={status === "loading"}
                  className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  Try a broken sample
                </button>
              </div>

              {status === "loading" && (
                <div className="mt-4 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm">
                  Analyzing and repairing…
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
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownload}
                  disabled={!repairedObject}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50"
                >
                  Download repaired .stl
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  ← Load another file
                </button>
              </div>
            </div>

            {report && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                <IssueStat
                  label="duplicate vertex groups"
                  before={report.before.duplicateVertexGroups}
                  after={report.after.duplicateVertexGroups}
                />
                <IssueStat
                  label="degenerate triangles"
                  before={report.before.degenerateTriangles}
                  after={report.after.degenerateTriangles}
                />
                <IssueStat
                  label="boundary edges (holes)"
                  before={report.before.boundaryEdges}
                  after={report.after.boundaryEdges}
                  noteUnfixed
                />
                <IssueStat
                  label="non-manifold edges"
                  before={report.before.nonManifoldEdges}
                  after={report.after.nonManifoldEdges}
                  noteUnfixed
                />
              </div>
            )}

            <div className="flex items-center gap-1 mb-4 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-fit">
              <button
                onClick={() => setView("before")}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  view === "before"
                    ? "bg-white dark:bg-zinc-800 shadow-sm font-medium"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Before
              </button>
              <button
                onClick={() => setView("after")}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  view === "after"
                    ? "bg-white dark:bg-zinc-800 shadow-sm font-medium"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                After
              </button>
              {report &&
                (report.after.boundaryEdges > 0 ||
                  report.after.nonManifoldEdges > 0) && (
                  <span className="ml-3 text-xs text-red-700 dark:text-red-300 font-medium">
                    ⚠ Repaired mesh has unresolved issues (shown in red)
                  </span>
                )}
              {report && report.after.isManifold && (
                <span className="ml-3 text-xs text-green-700 dark:text-green-400 font-medium">
                  ✓ Closed &amp; manifold
                </span>
              )}
            </div>

            <div className="h-[60vh] sm:h-[480px] lg:h-[560px]">
              <MeshViewer object={displayObject} />
            </div>

            {report && report.actions.length > 0 && (
              <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <h2 className="text-sm font-semibold mb-2">Repair actions</h2>
                <ul className="text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-6 space-y-1">
                  {report.actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
                ⚠️ {errorMsg}
              </div>
            )}
          </>
        )}
      </section>

      {!originalObject && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-5">
              What gets fixed (and what doesn&apos;t, yet)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-5">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                  ✓ Auto-repaired (v1)
                </h3>
                <ul className="text-sm space-y-1 text-zinc-700 dark:text-zinc-300">
                  <li>Duplicate / near-duplicate vertices (welded with 1e-4 tolerance)</li>
                  <li>Degenerate triangles (zero area, collapsed edges)</li>
                  <li>Missing or wrong vertex normals (recomputed)</li>
                  <li>Strips non-position attributes that confuse slicers</li>
                </ul>
              </div>
              <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-5">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  ⚠ Detected, not yet auto-fixed
                </h3>
                <ul className="text-sm space-y-1 text-zinc-700 dark:text-zinc-300">
                  <li>Holes / boundary edges (counted in the report)</li>
                  <li>Non-manifold edges (3+ faces meeting on one edge)</li>
                  <li>Self-intersections</li>
                  <li>Inverted faces (winding flipped)</li>
                </ul>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3">
                  These need a true manifold engine — coming in v2.
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The most common slicer-blocking issue is a mesh with duplicate
              vertices left over from CAD or OBJ export. The vertices look
              fine in a viewer (perfectly overlapping) but adjacent faces
              don&apos;t actually share an edge, so the slicer sees the model
              as a pile of disconnected triangles. v1 catches that and a few
              other geometry-only fixes; v2 (with a WASM manifold engine)
              will handle holes and self-intersection.
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
                href="/tools/gcode-simulator/"
                className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
              >
                <div className="font-semibold">G-code Simulator</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Preview your sliced toolpath
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function IssueStat({
  label,
  before,
  after,
  noteUnfixed,
}: {
  label: string;
  before: number;
  after: number;
  noteUnfixed?: boolean;
}) {
  const fixed = before - after;
  const stillBad = after > 0;
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        stillBad
          ? "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
          : fixed > 0
            ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      }`}
    >
      <div className="font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
        {before.toLocaleString()} → {after.toLocaleString()}
        {fixed > 0 && (
          <span className="ml-2 text-xs text-green-700 dark:text-green-400 font-normal">
            (−{fixed.toLocaleString()})
          </span>
        )}
        {noteUnfixed && after > 0 && (
          <span className="ml-2 text-xs text-amber-700 dark:text-amber-400 font-normal">
            v2
          </span>
        )}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
        {label}
      </div>
    </div>
  );
}
