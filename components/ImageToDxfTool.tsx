"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Dropzone from "@/components/Dropzone";
import DxfPreview from "@/components/DxfPreview";
import { downloadBlob } from "@/lib/converters";
import { writeDxfPolylines, type Polyline } from "@/lib/dxf/write";
import {
  traceImage,
  autoThreshold,
  DEFAULT_TRACE,
  THRESHOLD_MIN,
  THRESHOLD_MAX,
  SIMPLIFY_MIN,
  SIMPLIFY_MAX,
  WIDTH_MIN,
  WIDTH_MAX,
  type RgbaImage,
  type TraceOptions,
} from "@/lib/dxf/trace";
import {
  trackFileUploaded,
  trackSampleLoaded,
  trackImageConverted,
  trackConvertError,
} from "@/lib/analytics";

const IMAGE_ACCEPT = [".png", ".jpg", ".jpeg", ".webp"];

/** Tracing cost scales with pixel count, so big photos are sampled down first. */
const MAX_TRACE_WIDTH = 1200;

export type ImageToDxfVariant = "jpg" | "png" | "image";

const VARIANT_COPY: Record<
  ImageToDxfVariant,
  { eyebrow: string; title: string; intro: string; sourceExt: string }
> = {
  jpg: {
    eyebrow: "JPG → DXF · Outline trace",
    title: "JPG to DXF",
    intro:
      "Turn a JPG into a DXF outline for laser cutting, CNC or plotting. The image is traced into vector polylines you can tune before downloading — free, instant, 100% in your browser.",
    sourceExt: "jpg",
  },
  png: {
    eyebrow: "PNG → DXF · Outline trace",
    title: "PNG to DXF",
    intro:
      "Convert a PNG into a DXF outline for laser cutting, CNC or plotting. Transparent areas drop out automatically; the shape is traced into vector polylines. Free and local.",
    sourceExt: "png",
  },
  image: {
    eyebrow: "Image → DXF · Outline trace",
    title: "Image to DXF",
    intro:
      "Convert any image to a DXF outline for laser cutting, CNC or plotting. Set the threshold, size it in millimetres, and download vector polylines — free, no upload, no signup.",
    sourceExt: "image",
  },
};

type Status = "idle" | "working" | "ready" | "error";

/** Decode into raw pixels, sampling down so tracing stays fast. */
function toRgba(img: ImageBitmap | HTMLCanvasElement): RgbaImage {
  const srcW = "width" in img ? img.width : 0;
  const srcH = "height" in img ? img.height : 0;
  const scale = srcW > MAX_TRACE_WIDTH ? MAX_TRACE_WIDTH / srcW : 1;
  const w = Math.max(2, Math.round(srcW * scale));
  const h = Math.max(2, Math.round(srcH * scale));

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img as CanvasImageSource, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  return { data: data.data, width: w, height: h };
}

export default function ImageToDxfTool({
  variant = "jpg",
}: {
  variant?: ImageToDxfVariant;
}) {
  const copy = VARIANT_COPY[variant];

  const imageRef = useRef<RgbaImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [opts, setOpts] = useState<TraceOptions>(DEFAULT_TRACE);
  const [version, setVersion] = useState(0);

  const [polylines, setPolylines] = useState<Polyline[]>([]);
  const [stats, setStats] = useState<{ loops: number; points: number; size: [number, number] } | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Re-trace whenever the image or a setting changes, debounced so dragging a
  // slider doesn't queue up a trace per pixel.
  useEffect(() => {
    if (!imageRef.current) return;
    setStatus("working");
    const handle = setTimeout(() => {
      try {
        const result = traceImage(imageRef.current!, opts);
        setPolylines(result.polylines);
        setStats({
          loops: result.loopCount,
          points: result.pointCount,
          size: result.sizeMM,
        });
        setStatus("ready");
        setErrorMsg(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not trace this image";
        setPolylines([]);
        setStats(null);
        setErrorMsg(msg);
        setStatus("error");
        trackConvertError("stl", "stl", msg);
      }
    }, 140);
    return () => clearTimeout(handle);
  }, [version, opts]);

  const loadImage = useCallback(
    async (source: Blob | HTMLCanvasElement, name: string, origin: "drop" | "sample") => {
      try {
        const bitmap =
          source instanceof Blob ? await createImageBitmap(source) : source;
        const rgba = toRgba(bitmap);
        imageRef.current = rgba;

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(source instanceof Blob ? URL.createObjectURL(source) : source.toDataURL());

        setFileName(name);
        // Start from a threshold that suits this particular image.
        setOpts({ ...DEFAULT_TRACE, threshold: autoThreshold(rgba) });
        setVersion((v) => v + 1);
        if (origin === "drop") trackFileUploaded("stl", "drop");
        else trackSampleLoaded("stl");
      } catch {
        setErrorMsg("That image couldn't be decoded. Try a PNG or JPG.");
        setStatus("error");
      }
    },
    [previewUrl],
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
      void loadImage(new Blob([buffer], { type }), name, "drop");
    },
    [loadImage],
  );

  const handleSample = useCallback(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "#000000";
    // A ring plus a gear-ish set of teeth — high contrast, closed shapes, holes.
    ctx.beginPath();
    ctx.arc(256, 256, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(256, 256, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.font = "bold 96px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3D", 256, 470);
    void loadImage(c, "flip3d-sample.png", "sample");
  }, [loadImage]);

  const handleReset = () => {
    imageRef.current = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPolylines([]);
    setStats(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
    setOpts(DEFAULT_TRACE);
  };

  const handleDownload = () => {
    if (polylines.length === 0) return;
    try {
      const dxf = writeDxfPolylines(polylines, { units: "mm", layer: "OUTLINE" });
      const base = fileName.replace(/\.[^.]+$/, "") || "outline";
      downloadBlob(new Blob([dxf], { type: "image/vnd.dxf" }), `${base}.dxf`);
      trackImageConverted(copy.sourceExt, "relief");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
    }
  };

  const set = <K extends keyof TraceOptions>(key: K, value: TraceOptions[K]) =>
    setOpts((o) => ({ ...o, [key]: value }));

  const loaded = imageRef.current !== null;

  if (!loaded) {
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
          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Works best on high-contrast art: logos, silhouettes, stencils, line
            drawings. A photo with soft gradients has no clean edge to follow, so
            it traces into noise.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{fileName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {stats
              ? `${stats.loops} outline${stats.loops === 1 ? "" : "s"} · ${stats.points} points · ${stats.size[0].toFixed(0)} × ${stats.size[1].toFixed(0)} mm`
              : "Tracing…"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            ← New image
          </button>
          <button
            onClick={handleDownload}
            disabled={polylines.length === 0}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Download DXF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="order-2 lg:order-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center overflow-hidden h-[38vh] sm:h-[420px]">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Source"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          <div className="h-[38vh] sm:h-[420px]">
            <DxfPreview polylines={polylines} />
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Threshold</label>
              <span className="text-xs font-mono text-zinc-500">{opts.threshold}</span>
            </div>
            <input
              type="range"
              min={THRESHOLD_MIN}
              max={THRESHOLD_MAX}
              value={opts.threshold}
              onChange={(e) => set("threshold", Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Where dark stops and light begins.
              </p>
              <button
                onClick={() =>
                  imageRef.current && set("threshold", autoThreshold(imageRef.current))
                }
                className="text-xs px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
              >
                Auto
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={opts.invert}
              onChange={(e) => set("invert", e.target.checked)}
              className="accent-blue-500"
            />
            Invert (trace the light areas)
          </label>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Smoothing</label>
              <span className="text-xs font-mono text-zinc-500">
                {opts.simplifyPx.toFixed(1)} px
              </span>
            </div>
            <input
              type="range"
              min={SIMPLIFY_MIN}
              max={SIMPLIFY_MAX}
              step={0.1}
              value={opts.simplifyPx}
              onChange={(e) => set("simplifyPx", Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Higher drops the pixel staircase — and fine detail with it.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Ignore specks</label>
              <span className="text-xs font-mono text-zinc-500">{opts.minAreaPx} px²</span>
            </div>
            <input
              type="range"
              min={0}
              max={400}
              step={4}
              value={opts.minAreaPx}
              onChange={(e) => set("minAreaPx", Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Drops islands smaller than this, so noise doesn&apos;t become cut paths.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Width</label>
              <span className="text-xs font-mono text-zinc-500">{opts.widthMM} mm</span>
            </div>
            <input
              type="range"
              min={WIDTH_MIN}
              max={WIDTH_MAX}
              step={5}
              value={opts.widthMM}
              onChange={(e) => set("widthMM", Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Physical size of the finished drawing. Height follows the aspect.
            </p>
          </div>

          {status === "working" && (
            <p className="text-xs text-zinc-500">Tracing…</p>
          )}
          {errorMsg && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              🔒 This image never left your browser.
            </p>
            <Link
              href="/image-to-stl/"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Want a 3D relief instead? → Image to STL
            </Link>
            <Link
              href="/dxf-to-stl/"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Turn a DXF back into a solid → DXF to STL
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
        The output is a polyline trace of the black/white edge — the right shape
        for a laser cutter, CNC router or plotter. It isn&apos;t a curve-fitted
        vector illustration, and it can&apos;t recover detail the threshold threw
        away.
      </p>
    </section>
  );
}
