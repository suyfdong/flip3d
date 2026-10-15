"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as THREE from "three";
import Dropzone from "@/components/Dropzone";
import { parseToObject, disposeObject, type Format } from "@/lib/converters";
import UrlParamLoader, { withModelUrl } from "@/components/UrlParamLoader";
import ModelInfoPanel, { unitLabelFor } from "@/components/ModelInfoPanel";
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

/** Cross-link to a converter/tool page — the viewer's primary next action. */
export type ViewerLink = { href: string; title: string; desc: string };

export type ViewerConfig = {
  /** Format to parse uploaded files as (also the analytics label). */
  format: Format;
  /** Human label, e.g. "STL". */
  formatLabel: string;
  /** Accepted extensions, e.g. [".stl"]. */
  accept: string[];
  /** Small uppercase eyebrow above the H1. */
  eyebrow: string;
  /** Hero H1 text (gradient). */
  heading: string;
  /** One-paragraph intro under the H1. */
  intro: string;
  /** "How it works" / about bullets shown when idle. */
  about: string[];
  /** Visible FAQ (also emitted as FAQPage JSON-LD from the page). */
  faq: { q: string; a: string }[];
  /** Where to send the user next (convert this file, repair, etc.). */
  links: ViewerLink[];
};

type Status = "idle" | "loading" | "error";

/** In-memory demo model so "Try a sample" needs zero network / bundled asset. */
function makeSample(): THREE.Mesh {
  const geometry = new THREE.TorusKnotGeometry(0.9, 0.28, 160, 24);
  const material = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    metalness: 0.1,
    roughness: 0.6,
  });
  return new THREE.Mesh(geometry, material);
}

export default function ViewerTool({ config }: { config: ViewerConfig }) {
  const { format, formatLabel, accept, eyebrow, heading, intro, about, faq, links } =
    config;

  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Set when the model came from ?url= — "Do more" links then carry it along.
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [measuring, setMeasuring] = useState(false);
  // null = use the file's own convention; otherwise the user's choice.
  const [upAxis, setUpAxis] = useState<"y" | "z" | null>(null);

  // Dispose the previous object whenever it's replaced or on unmount — without
  // this, revisiting/leaving the page leaks geometry + GPU buffers.
  useEffect(() => {
    return () => {
      if (object) disposeObject(object);
    };
  }, [object]);

  const handleFile = useCallback(
    async (buffer: ArrayBuffer, name: string) => {
      setStatus("loading");
      setErrorMsg(null);
      try {
        const parsed = await parseToObject(buffer, format);
        setObject(parsed);
        setUpAxis(null);
        setFileName(name);
        setStatus("idle");
        trackFileUploaded(format, "drop");
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : `Could not open this .${format} file`;
        setErrorMsg(msg);
        setStatus("error");
        trackConvertError(format, format, msg);
      }
    },
    [format],
  );

  // ?url=… — the "Open in Flip3D" badge inside embedded viewers lands here
  // with the same model, so the visitor gets it full-size instead of a logo.
  const handleUrlLoaded = useCallback(
    async (buffer: ArrayBuffer, name: string) => {
      try {
        const parsed = await parseToObject(buffer, format);
        setObject(parsed);
        setUpAxis(null);
        setFileName(name);
        setStatus("idle");
        trackFileUploaded(format, "url");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : `Could not open this .${format} file`;
        setErrorMsg(msg);
        setStatus("error");
        trackConvertError(format, format, msg);
      }
    },
    [format],
  );

  const handleSample = useCallback(() => {
    setObject(makeSample());
    setUpAxis(null);
    setFileName(`sample.${format}`);
    setStatus("idle");
    setErrorMsg(null);
    trackSampleLoaded(format);
  }, [format]);

  const handleReset = () => {
    setMeasuring(false);
    setUpAxis(null);
    setObject(null);
    setFileName("");
    setModelUrl(null);
    setStatus("idle");
    setErrorMsg(null);
  };

  const loaded = object !== null;

  return (
    <>
      <UrlParamLoader
        onStart={() => {
          setStatus("loading");
          setErrorMsg(null);
          setModelUrl(new URLSearchParams(window.location.search).get("url"));
        }}
        onLoaded={handleUrlLoaded}
        onError={(m) => {
          setErrorMsg(m);
          setStatus("error");
        }}
      />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        {!loaded ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                {eyebrow}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {heading}
                </span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {intro}
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Dropzone
                onFileLoaded={handleFile}
                accept={accept}
                label={`${formatLabel} file`}
              />
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  No {formatLabel} handy?
                </span>
                <button
                  onClick={handleSample}
                  className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Try a sample
                </button>
              </div>
              {status === "loading" && (
                <p className="mt-4 text-center text-sm text-zinc-500">
                  {modelUrl ? "Loading model from URL…" : "Opening model…"}
                </p>
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
                  {fileName || `${formatLabel} Viewer`}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Drag to rotate · scroll to zoom · right-drag to pan
                </p>
                <LoadNotes object={object} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() =>
                    setUpAxis((u) => {
                      const current = u ?? (object?.userData.upAxis === "z" ? "z" : "y");
                      return current === "z" ? "y" : "z";
                    })
                  }
                  title="Model lying on its side? Switch which axis points up."
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  ⤾ Flip upright
                </button>
                <button
                  onClick={() => setMeasuring((m) => !m)}
                  aria-pressed={measuring}
                  className={`px-4 py-2 text-sm rounded-lg border ${
                    measuring
                      ? "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
                      : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  📏 {measuring ? "Measuring" : "Measure"}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  ← Open another file
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
              <div className="h-[55vh] sm:h-[480px] lg:h-[560px] order-2 lg:order-1">
                <MeshViewer
                  object={object}
                  measure={measuring}
                  unitLabel={unitLabelFor(object)}
                  upAxis={upAxis ?? undefined}
                  playAnimations
                />
              </div>

              <div className="order-1 lg:order-2 space-y-4">
              <ModelInfoPanel object={object} />
              <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Do more with this file
                </p>
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={withModelUrl(l.href, modelUrl)}
                    className="block px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700"
                  >
                    <div className="font-semibold text-sm">{l.title}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {l.desc}
                    </div>
                  </Link>
                ))}
                <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">
                  🔒 This file never left your browser.
                </p>
              </div>
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
        <>
          <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold tracking-tight mb-5">
                About the {formatLabel} viewer
              </h2>
              <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2 list-disc pl-6 mb-8">
                {about.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
                  >
                    <div className="font-semibold">{l.title}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {l.desc}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {faq.length > 0 && (
            <section className="border-t border-zinc-200 dark:border-zinc-800 py-14">
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl font-bold tracking-tight mb-6">
                  Frequently asked questions
                </h2>
                <dl className="space-y-6">
                  {faq.map((f) => (
                    <div key={f.q}>
                      <dt className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                        {f.q}
                      </dt>
                      <dd className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {f.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

// One-line facts about how the file was read, so users know what they're
// looking at (flattened Bambu parts, point cloud vs mesh, splat preview).
function LoadNotes({ object }: { object: THREE.Object3D | null }) {
  if (!object) return null;
  const notes: string[] = [];
  const parts = object.userData.flattenedParts as number | undefined;
  if (parts) {
    notes.push(
      `Bambu/Orca multi-part 3MF — merged ${parts} internal object file${parts === 1 ? "" : "s"} so the whole model shows.`,
    );
  }
  const pc = object.userData.pointCloud as
    | { points: number; splat: boolean; color: boolean }
    | undefined;
  if (pc) {
    notes.push(
      pc.splat
        ? `3D Gaussian Splat — previewed as ${pc.points.toLocaleString("en-US")} colored points (base color only, not a full splat render).`
        : `Point cloud — ${pc.points.toLocaleString("en-US")} points, ${pc.color ? "with the scan's own colors" : "no color data"}, no faces.`,
    );
  }
  if (!notes.length) return null;
  return (
    <ul className="mt-2 space-y-1 text-xs text-emerald-700 dark:text-emerald-400">
      {notes.map((n) => (
        <li key={n}>✓ {n}</li>
      ))}
    </ul>
  );
}
