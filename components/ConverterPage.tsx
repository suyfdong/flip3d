"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as THREE from "three";
import Dropzone from "@/components/Dropzone";
import {
  FORMAT_LABELS,
  parseToObject,
  exportToBlob,
  downloadBlob,
  disposeObject,
  type Format,
} from "@/lib/converters";

const MeshViewer = dynamic(() => import("@/components/MeshViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] rounded-xl bg-zinc-100 dark:bg-zinc-900">
      <span className="text-sm text-zinc-500">Loading viewer…</span>
    </div>
  ),
});

type Status = "idle" | "loading" | "converting" | "error";

type Props = {
  from: Format;
  to: Format;
};

export default function ConverterPage({ from, to }: Props) {
  const fromLabel = FORMAT_LABELS[from];
  const toLabel = FORMAT_LABELS[to];

  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (buffer: ArrayBuffer, name: string) => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const parsed = await parseToObject(buffer, from);
      if (object) disposeObject(object);
      setObject(parsed);
      setFileName(name);
      setStatus("idle");
    } catch (err) {
      console.error("Parse failed", err);
      setErrorMsg(err instanceof Error ? err.message : `Could not parse .${from} file`);
      setStatus("error");
    }
  };

  const handleSample = async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const geo = new THREE.TorusKnotGeometry(10, 3, 100, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.1,
        roughness: 0.6,
      });
      const sampleMesh = new THREE.Mesh(geo, mat);
      const blob = await exportToBlob(sampleMesh, from);
      geo.dispose();
      mat.dispose();
      const buffer = await blob.arrayBuffer();
      await handleFile(buffer, `flip3d-sample.${from}`);
    } catch (err) {
      console.error("Sample failed", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load sample");
      setStatus("error");
    }
  };

  const handleReset = () => {
    if (object) disposeObject(object);
    setObject(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
  };

  const handleConvert = async () => {
    if (!object) return;
    setStatus("converting");
    setErrorMsg(null);
    try {
      const blob = await exportToBlob(object, to);
      const baseName = fileName.replace(/\.[^.]+$/, "") || "model";
      downloadBlob(blob, `${baseName}.${to}`);
      setStatus("idle");
    } catch (err) {
      console.error("Convert failed", err);
      setErrorMsg(err instanceof Error ? err.message : "Conversion failed");
      setStatus("error");
    }
  };

  const reverseSlug = `/${to}-to-${from}/`;

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        {!object ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                Free Online Converter
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Convert{" "}
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {fromLabel} to {toLabel}
                </span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Drop a .{from} file, get a .{to} back in seconds. Runs entirely
                in your browser — no upload, no signup, no watermark.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Dropzone onFileLoaded={handleFile} accept={[`.${from}`]} />

              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  No .{from} handy?
                </span>
                <button
                  onClick={handleSample}
                  disabled={status === "loading"}
                  className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  Try a sample .{from}
                </button>
              </div>

              {status === "loading" && (
                <div className="mt-4 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300">
                  Parsing file…
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
                ← Load another .{from}
              </button>
            </div>

            <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="font-mono uppercase px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                  {fromLabel}
                </span>
                <span className="text-zinc-500">→</span>
                <span className="font-mono uppercase px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                  {toLabel}
                </span>
              </div>
              <button
                onClick={handleConvert}
                disabled={status === "converting"}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "converting"
                  ? "Converting…"
                  : `Convert & Download .${to}`}
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="h-[560px]">
              <MeshViewer object={object} />
            </div>
          </>
        )}
      </section>

      {!object && (
        <>
          <section className="border-t border-zinc-200 dark:border-zinc-800 py-14">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                How to convert {fromLabel} to {toLabel}
              </h2>
              <ol className="space-y-3 text-zinc-700 dark:text-zinc-300 list-decimal pl-6">
                <li>
                  Drag your <code className="font-mono text-sm">.{from}</code>{" "}
                  file into the box above (or click to browse).
                </li>
                <li>
                  Preview the model in the viewer — drag to rotate, scroll to
                  zoom.
                </li>
                <li>
                  Click <strong>Convert &amp; Download .{to}</strong>. The{" "}
                  <code className="font-mono text-sm">.{to}</code> file lands in
                  your downloads folder.
                </li>
              </ol>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-6">
                Conversion runs in your browser via{" "}
                <code className="font-mono">three.js</code>. Your file never
                leaves your device — there&apos;s no upload, no server, and
                nothing is stored.
              </p>
            </div>
          </section>

          <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-xl font-bold tracking-tight mb-4">
                Related converters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href={reverseSlug}
                  className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="font-semibold">
                    {toLabel} → {fromLabel}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Go the other way
                  </div>
                </Link>
                <Link
                  href="/"
                  className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="font-semibold">All Tools</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Convert any of 4 formats to any other
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
