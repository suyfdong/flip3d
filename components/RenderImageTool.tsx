"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as THREE from "three";
import Dropzone from "@/components/Dropzone";
import {
  detectFormat,
  disposeObject,
  downloadBlob,
  parseToObject,
  FORMAT_LABELS,
  type Format,
} from "@/lib/converters";
import { renderObjectToBlob } from "@/lib/render/snapshot";
import {
  IMAGE_FORMATS,
  IMAGE_LABELS,
  outputName,
  SIZE_MAX,
  SIZE_MIN,
  supportsAlpha,
  VIEW_LABELS,
  VIEW_PRESETS,
  type ImageFormat,
  type ViewPreset,
} from "@/lib/render/framing";
import {
  trackConvertError,
  trackFileUploaded,
  trackRendered,
  trackSampleLoaded,
} from "@/lib/analytics";

const MeshViewer = dynamic(() => import("@/components/MeshViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] rounded-xl bg-zinc-100 dark:bg-zinc-900">
      <span className="text-sm text-zinc-500">Loading viewer…</span>
    </div>
  ),
});

/** Cross-link shown under the tool. */
export type RenderLink = { href: string; title: string; desc: string };

export type RenderConfig = {
  /** Format the page is named after — used for analytics + copy, not to force parsing. */
  sourceFormat: Format;
  /** Image format the page is named after; preselected in the UI. */
  imageFormat: ImageFormat;
  eyebrow: string;
  heading: string;
  intro: string;
  about: string[];
  faq: { q: string; a: string }[];
  links: RenderLink[];
};

type Status = "idle" | "loading" | "rendering" | "error";

const SIZE_PRESETS: Array<{ label: string; w: number; h: number }> = [
  { label: "512²", w: 512, h: 512 },
  { label: "1024²", w: 1024, h: 1024 },
  { label: "2048²", w: 2048, h: 2048 },
  { label: "1920×1080", w: 1920, h: 1080 },
];

const BACKGROUNDS: Array<{ label: string; value: string }> = [
  { label: "Transparent", value: "transparent" },
  { label: "White", value: "#ffffff" },
  { label: "Light", value: "#f4f4f5" },
  { label: "Dark", value: "#18181b" },
];

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

export default function RenderImageTool({ config }: { config: RenderConfig }) {
  const { sourceFormat, imageFormat, eyebrow, heading, intro, about, faq, links } =
    config;

  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [format, setFormat] = useState<ImageFormat>(imageFormat);
  const [view, setView] = useState<ViewPreset>("iso");
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 1024, h: 1024 });
  const [background, setBackground] = useState<string>(
    supportsAlpha(imageFormat) ? "transparent" : "#ffffff",
  );
  const [quality, setQuality] = useState(0.92);

  // Dispose the previous object whenever it's replaced or on unmount — without
  // this, revisiting/leaving the page leaks geometry + GPU buffers.
  useEffect(() => {
    return () => {
      if (object) disposeObject(object);
    };
  }, [object]);

  // JPEG can't carry alpha. Rather than silently encoding a black backdrop,
  // move the picker off "transparent" as soon as JPG is selected.
  useEffect(() => {
    if (!supportsAlpha(format) && background === "transparent") {
      setBackground("#ffffff");
    }
  }, [format, background]);

  const handleFile = useCallback(async (buffer: ArrayBuffer, name: string) => {
    const detected = detectFormat(name);
    if (!detected) {
      setErrorMsg(`Unsupported file type: ${name}`);
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg(null);
    try {
      const parsed = await parseToObject(buffer, detected);
      setObject(parsed);
      setFileName(name);
      setStatus("idle");
      trackFileUploaded(detected, "drop");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : `Could not open this .${detected} file`;
      setErrorMsg(msg);
      setStatus("error");
      trackConvertError(detected, detected, msg);
    }
  }, []);

  const handleSample = useCallback(() => {
    setObject(makeSample());
    setFileName(`sample.${sourceFormat}`);
    setStatus("idle");
    setErrorMsg(null);
    trackSampleLoaded(sourceFormat);
  }, [sourceFormat]);

  const handleReset = () => {
    setObject(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
  };

  const handleDownload = async () => {
    if (!object) return;
    setStatus("rendering");
    setErrorMsg(null);
    try {
      const blob = await renderObjectToBlob(object, {
        width: size.w,
        height: size.h,
        format,
        view,
        background,
        quality,
      });
      downloadBlob(blob, outputName(fileName, format));
      trackRendered(detectFormat(fileName) ?? sourceFormat, format);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not render the image",
      );
      setStatus("error");
    }
  };

  const loaded = object !== null;
  const alpha = supportsAlpha(format);
  const lossy = format !== "png";

  return (
    <>
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
              <Dropzone onFileLoaded={handleFile} />
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  No model handy?
                </span>
                <button
                  onClick={handleSample}
                  className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Try a sample
                </button>
              </div>
              {status === "loading" && (
                <p className="mt-4 text-center text-sm text-zinc-500">Opening…</p>
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
                  {fileName || heading}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Drag to rotate the preview · the download uses the camera angle
                  picked on the right, at {size.w}×{size.h}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownload}
                  disabled={status === "rendering"}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50"
                >
                  {status === "rendering"
                    ? "Rendering…"
                    : `Download .${format}`}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  ← Load another model
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
              <div className="h-[55vh] sm:h-[480px] lg:h-[560px] order-2 lg:order-1">
                <MeshViewer object={object} />
              </div>

              <div className="order-1 lg:order-2 space-y-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                <Field label="Image format">
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {IMAGE_FORMATS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                          format === f
                            ? "bg-white dark:bg-zinc-700 shadow-sm font-medium"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {IMAGE_LABELS[f]}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Camera angle">
                  <div className="grid grid-cols-2 gap-1.5">
                    {VIEW_PRESETS.map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          view === v
                            ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400"
                        }`}
                      >
                        {VIEW_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Resolution">
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {SIZE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setSize({ w: p.w, h: p.h })}
                        className={`px-2 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                          size.w === p.w && size.h === p.h
                            ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <NumberInput
                      value={size.w}
                      onChange={(w) => setSize((s) => ({ ...s, w }))}
                      label="Width in pixels"
                    />
                    <span className="text-zinc-400 text-sm">×</span>
                    <NumberInput
                      value={size.h}
                      onChange={(h) => setSize((s) => ({ ...s, h }))}
                      label="Height in pixels"
                    />
                  </div>
                </Field>

                <Field label="Background">
                  <div className="grid grid-cols-2 gap-1.5">
                    {BACKGROUNDS.map((b) => {
                      const disabled = b.value === "transparent" && !alpha;
                      return (
                        <button
                          key={b.value}
                          onClick={() => setBackground(b.value)}
                          disabled={disabled}
                          title={
                            disabled
                              ? "JPG has no alpha channel — use PNG or WebP for transparency"
                              : undefined
                          }
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            background === b.value
                              ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium"
                              : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400"
                          }`}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                  {!alpha && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                      JPG has no alpha channel — pick PNG or WebP if you need a
                      transparent background.
                    </p>
                  )}
                </Field>

                {lossy && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm text-zinc-700 dark:text-zinc-300">
                        Quality
                      </label>
                      <span className="text-sm font-mono tabular-nums text-zinc-500">
                        {Math.round(quality * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.4}
                      max={1}
                      step={0.01}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
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
        <>
          <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold tracking-tight mb-5">
                How it works
              </h2>
              <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2 list-disc pl-5 mb-8">
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
              <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
                Reads {Object.values(FORMAT_LABELS).join(", ")} — drop any of them
                and export a picture.
              </p>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <input
      type="number"
      min={SIZE_MIN}
      max={SIZE_MAX}
      step={1}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-2 py-1.5 text-sm font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 tabular-nums"
    />
  );
}
