"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type * as THREE from "three";
import Dropzone from "@/components/Dropzone";
import { disposeObject, exportToBlob, downloadBlob } from "@/lib/converters";
import {
  imageToMesh,
  MODE_DEFAULTS,
  RESOLUTION_MIN,
  RESOLUTION_MAX,
  type HeightmapMode,
  type ImageToMeshOptions,
} from "@/lib/heightmap/image-to-mesh";
import {
  trackFileUploaded,
  trackSampleLoaded,
  trackImageConverted,
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

const IMAGE_ACCEPT = [".png", ".jpg", ".jpeg", ".webp"];

type Status = "idle" | "ready" | "error";

export type ImageToStlVariant =
  | "image"
  | "png"
  | "jpg"
  | "lithophane"
  | "photo"
  | "picture";

const VARIANT_COPY: Record<
  ImageToStlVariant,
  { eyebrow: string; title: string; intro: string; sourceExt: string }
> = {
  image: {
    eyebrow: "Image → 3D · Heightmap",
    title: "Image to STL",
    intro:
      "Turn any photo, logo, or drawing into a printable 3D relief or lithophane. Brightness becomes height — drop an image and download an STL. Free, instant, 100% local.",
    sourceExt: "image",
  },
  png: {
    eyebrow: "PNG → 3D · Heightmap",
    title: "PNG to STL",
    intro:
      "Convert a PNG into a printable 3D model. Transparent areas flatten to the base; brightness becomes height. Drop your PNG and download an STL — free, in your browser.",
    sourceExt: "png",
  },
  jpg: {
    eyebrow: "JPG → 3D · Heightmap",
    title: "JPG to STL",
    intro:
      "Convert a JPG photo into a printable 3D relief or lithophane. Brightness becomes height. Drop your JPG and download an STL — free, no upload, no signup.",
    sourceExt: "jpg",
  },
  lithophane: {
    eyebrow: "Lithophane Generator",
    title: "Lithophane Maker",
    intro:
      "Turn a photo into a 3D-printable lithophane: dark areas print thicker so the image appears when backlit. Tune thickness, drop a photo, download an STL. Free and local.",
    sourceExt: "photo",
  },
  photo: {
    eyebrow: "Photo → 3D · Heightmap",
    title: "Photo to STL",
    intro:
      "3D print a photo: turn any photo into a printable STL relief or lithophane. Brightness becomes height — drop a photo and download an STL. Free, instant, 100% local, no signup.",
    sourceExt: "photo",
  },
  picture: {
    eyebrow: "Picture → 3D · Heightmap",
    title: "Picture to STL",
    intro:
      "Convert a picture to a printable 3D STL. 3D print a picture as a relief or lithophane — brightness becomes height. Drop a picture and download an STL. Free, no upload, no signup.",
    sourceExt: "picture",
  },
};

// Title + intro overrides when the page outputs OBJ instead of STL. The mesh
// pipeline is identical (a watertight heightmap solid); only the export format
// and the on-page copy change. Lithophane stays STL-only, so it's omitted here.
const OBJ_COPY: Partial<Record<ImageToStlVariant, { title: string; intro: string }>> = {
  image: {
    title: "Image to OBJ",
    intro:
      "Turn any photo, logo, or drawing into a 3D OBJ model. Brightness becomes height — drop an image and download a Wavefront OBJ. Free, instant, 100% local.",
  },
  png: {
    title: "PNG to OBJ",
    intro:
      "Convert a PNG into a 3D OBJ mesh. Transparent areas flatten to the base; brightness becomes height. Drop your PNG and download an OBJ — free, in your browser.",
  },
  jpg: {
    title: "JPG to OBJ",
    intro:
      "Convert a JPG photo into a 3D OBJ mesh. Brightness becomes height. Drop your JPG and download a Wavefront OBJ — free, no upload, no signup.",
  },
};

export default function ImageToStlTool({
  defaultMode = "relief",
  variant = "image",
  targetFormat = "stl",
}: {
  defaultMode?: HeightmapMode;
  variant?: ImageToStlVariant;
  targetFormat?: "stl" | "obj";
}) {
  const objCopy = targetFormat === "obj" ? OBJ_COPY[variant] : undefined;
  const copy = objCopy ? { ...VARIANT_COPY[variant], ...objCopy } : VARIANT_COPY[variant];
  const tgtLabel = targetFormat.toUpperCase();
  const imageRef = useRef<ImageBitmap | HTMLCanvasElement | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [fileName, setFileName] = useState("");
  const [opts, setOpts] = useState<ImageToMeshOptions>(MODE_DEFAULTS[defaultMode]);
  const [object, setObject] = useState<THREE.Mesh | null>(null);
  const [triangles, setTriangles] = useState(0);
  const [sizeMM, setSizeMM] = useState<[number, number, number]>([0, 0, 0]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dispose the previous mesh whenever it's replaced or on unmount.
  useEffect(() => {
    return () => {
      if (object) disposeObject(object);
    };
  }, [object]);

  // Regenerate the mesh (debounced) whenever the image or any param changes.
  useEffect(() => {
    if (!imageRef.current) return;
    const handle = setTimeout(() => {
      try {
        const result = imageToMesh(imageRef.current!, opts);
        setObject(result.mesh);
        setTriangles(result.triangles);
        setSizeMM(result.sizeMM);
        setStatus("ready");
        setErrorMsg(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not build the model";
        setErrorMsg(msg);
        setStatus("error");
        trackConvertError("stl", "stl", msg);
      }
    }, 140);
    return () => clearTimeout(handle);
  }, [imageVersion, opts]);

  const loadImage = useCallback(
    async (
      source: Blob | HTMLCanvasElement,
      name: string,
      mode: HeightmapMode,
      origin: "drop" | "sample",
    ) => {
      try {
        let img: ImageBitmap | HTMLCanvasElement;
        if (source instanceof Blob) {
          img = await createImageBitmap(source);
        } else {
          img = source;
        }
        imageRef.current = img;
        setFileName(name);
        setOpts(MODE_DEFAULTS[mode]);
        setImageVersion((v) => v + 1);
        if (origin === "drop") trackFileUploaded("stl", "drop");
        else trackSampleLoaded("stl");
      } catch {
        setErrorMsg("That image couldn't be decoded. Try a PNG, JPG or WebP.");
        setStatus("error");
      }
    },
    [],
  );

  const handleFile = useCallback(
    (buffer: ArrayBuffer, name: string) => {
      const ext = name.split(".").pop()?.toLowerCase() ?? "png";
      const type =
        ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "webp"
            ? "image/webp"
            : "image/png";
      void loadImage(new Blob([buffer], { type }), name, defaultMode, "drop");
    },
    [loadImage, defaultMode],
  );

  const handleSample = useCallback(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    const grad = ctx.createRadialGradient(256, 220, 40, 256, 256, 300);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 120px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3D", 256, 256);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 432, 432);
    void loadImage(c, "flip3d-sample.png", defaultMode, "sample");
  }, [loadImage, defaultMode]);

  const handleReset = () => {
    imageRef.current = null;
    setObject(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
    setOpts(MODE_DEFAULTS[defaultMode]);
  };

  const handleDownload = async () => {
    if (!object) return;
    try {
      const blob = await exportToBlob(object, targetFormat);
      const base = fileName.replace(/\.[^.]+$/, "") || "model";
      downloadBlob(blob, `${base}-${opts.mode}.${targetFormat}`);
      trackImageConverted(copy.sourceExt, opts.mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
    }
  };

  const set = <K extends keyof ImageToMeshOptions>(
    key: K,
    value: ImageToMeshOptions[K],
  ) => setOpts((o) => ({ ...o, [key]: value }));

  const setMode = (mode: HeightmapMode) => setOpts(MODE_DEFAULTS[mode]);

  const loaded = imageRef.current !== null;

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        {!loaded ? (
          <>
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
              <Dropzone onFileLoaded={handleFile} accept={IMAGE_ACCEPT} label="image" />
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">No image handy?</span>
                <button
                  onClick={handleSample}
                  className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Try a sample
                </button>
              </div>
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
                  {fileName || copy.title}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Drag to rotate · scroll to zoom · {triangles.toLocaleString()} triangles ·{" "}
                  {sizeMM[0].toFixed(0)}×{sizeMM[1].toFixed(0)}×{sizeMM[2].toFixed(1)} mm
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownload}
                  disabled={!object}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50"
                >
                  Download .{targetFormat}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  ← Load another image
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
              <div className="h-[55vh] sm:h-[480px] lg:h-[560px] order-2 lg:order-1">
                <MeshViewer object={object} />
              </div>

              <div className="order-1 lg:order-2 space-y-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
                    Mode
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {(["relief", "lithophane"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 px-3 py-1.5 text-sm rounded-md capitalize transition-colors ${
                          opts.mode === m
                            ? "bg-white dark:bg-zinc-700 shadow-sm font-medium"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <Slider
                  label="Width"
                  value={opts.widthMM}
                  min={20}
                  max={300}
                  step={1}
                  unit="mm"
                  onChange={(v) => set("widthMM", v)}
                />
                <Slider
                  label="Base thickness"
                  value={opts.baseThicknessMM}
                  min={0}
                  max={Math.max(0.1, opts.maxThicknessMM - 0.2)}
                  step={0.1}
                  unit="mm"
                  onChange={(v) => set("baseThicknessMM", v)}
                />
                <Slider
                  label="Max thickness"
                  value={opts.maxThicknessMM}
                  min={opts.baseThicknessMM + 0.2}
                  max={20}
                  step={0.1}
                  unit="mm"
                  onChange={(v) => set("maxThicknessMM", v)}
                />
                <Slider
                  label="Detail (resolution)"
                  value={opts.resolution}
                  min={RESOLUTION_MIN}
                  max={RESOLUTION_MAX}
                  step={10}
                  unit="px"
                  onChange={(v) => set("resolution", v)}
                />

                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={opts.invert}
                    onChange={(e) => set("invert", e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-600"
                  />
                  Invert (swap dark / light)
                </label>

                {triangles > 350000 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    High triangle count — lower the detail if your slicer struggles.
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
            <h2 className="text-2xl font-bold tracking-tight mb-5">How to use it</h2>
            <ol className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2 list-decimal pl-6 mb-8">
              <li>
                Drop a PNG, JPG or WebP above (high-contrast images give the
                cleanest result).
              </li>
              <li>
                Pick <strong>Relief</strong> (bright = taller emboss) or{" "}
                <strong>Lithophane</strong> (dark = thicker, glows when backlit).
              </li>
              <li>
                Set the physical width and thickness, then download a watertight{" "}
                {tgtLabel}.
              </li>
            </ol>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(targetFormat === "obj"
                ? [
                    {
                      href: "/image-to-stl/",
                      title: "Image → STL",
                      desc: "Same tool, STL output for slicers",
                    },
                    {
                      href: "/obj-to-stl/",
                      title: "OBJ → STL",
                      desc: "Convert the result to a print-ready STL",
                    },
                  ]
                : [
                    {
                      href: "/tools/stl-repair/",
                      title: "STL Repair",
                      desc: "Clean up a mesh before slicing",
                    },
                    {
                      href: "/stl-to-3mf/",
                      title: "STL → 3MF",
                      desc: "Convert the result for your slicer",
                    },
                  ]
              ).map((l) => (
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
      )}
    </>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm text-zinc-700 dark:text-zinc-300">{label}</label>
        <span className="text-sm font-mono tabular-nums text-zinc-500">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}
