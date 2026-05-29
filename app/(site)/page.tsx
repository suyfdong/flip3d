"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as THREE from "three";
import Dropzone, { SUPPORTED_FORMATS } from "@/components/Dropzone";
import {
  FORMATS,
  FORMAT_LABELS,
  SOURCE_ONLY_FORMATS,
  detectFormat,
  parseToObject,
  exportToBlob,
  downloadBlob,
  disposeObject,
  isExportable,
  type Format,
} from "@/lib/converters";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";
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

type ToolStatus = "live" | "soon" | "highlight";
type ToolCard = {
  title: string;
  desc: string;
  status: ToolStatus;
  badge: string;
  href?: string;
};

const QUICK_TOOLS: ToolCard[] = [
  {
    title: "Mesh ↔ Mesh converter",
    desc: "STL, OBJ, GLB, 3MF, PLY — any direction. Bidirectional, instant.",
    status: "live",
    badge: "Live now",
    href: "/stl-to-obj/",
  },
  {
    title: "CAD / DCC → mesh",
    desc: "STEP, IGES, FBX, DAE imported and converted to a clean mesh",
    status: "live",
    badge: "Live now",
    href: "/step-to-stl/",
  },
  {
    title: "Image → STL / Lithophane",
    desc: "Turn a PNG or JPG into a printable 3D relief or backlit lithophane",
    status: "highlight",
    badge: "New ⭐",
    href: "/image-to-stl/",
  },
  {
    title: "SVG → STL",
    desc: "Extrude a logo, icon, or outline into a printable 3D model. Holes preserved.",
    status: "highlight",
    badge: "New ⭐",
    href: "/svg-to-stl/",
  },
  {
    title: "Embed 3D Viewer",
    desc: "One-line iframe to drop a viewer on any blog or doc site",
    status: "live",
    badge: "Live now",
    href: "/embed/",
  },
  {
    title: "Bambu 3MF ↔ Prusa 3MF",
    desc: "Strip vendor-private metadata so the file opens in the other slicer",
    status: "highlight",
    badge: "Live now ⭐",
    href: "/tools/bambu-3mf-to-prusa/",
  },
  {
    title: "G-code Simulator",
    desc: "Visualize 3D print toolpaths before printing. Bambu / Prusa / Orca / Cura.",
    status: "live",
    badge: "Live now",
    href: "/tools/gcode-simulator/",
  },
  {
    title: "STL Repair",
    desc: "Weld duplicate vertices, remove degenerate triangles, detect holes",
    status: "live",
    badge: "Live now",
    href: "/tools/stl-repair/",
  },
  {
    title: "Lithophane Generator",
    desc: "Photo → 3D-printable lithophane that glows when backlit. Tune the thickness.",
    status: "live",
    badge: "New",
    href: "/lithophane-generator/",
  },
];

const ALL_FORMATS = [
  "STL", "OBJ", "GLB", "GLTF", "3MF", "STEP",
  "STP", "FBX", "PLY", "IGES", "DAE", "X_T",
];

// Files the mesh converter can't read but that have their own dedicated tool —
// point the user there instead of a dead "unsupported" message.
const TOOL_FOR_EXT: Record<string, { href: string; label: string }> = {
  svg: { href: "/svg-to-stl/", label: "SVG to STL" },
  png: { href: "/png-to-stl/", label: "PNG to STL" },
  jpg: { href: "/jpg-to-stl/", label: "JPG to STL" },
  jpeg: { href: "/jpg-to-stl/", label: "JPG to STL" },
  webp: { href: "/image-to-stl/", label: "Image to STL" },
};

type ConvertStatus = "idle" | "loading" | "converting" | "error";

export default function Home() {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [sourceFormat, setSourceFormat] = useState<Format | null>(null);
  const [targetFormat, setTargetFormat] = useState<Format>("obj");
  const [unsupportedExt, setUnsupportedExt] = useState<string | null>(null);
  const [status, setStatus] = useState<ConvertStatus>("idle");
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
    const fmt = detectFormat(name);
    if (!fmt) {
      const ext = name.toLowerCase().split(".").pop() ?? "";
      setUnsupportedExt(ext);
      return;
    }

    setStatus("loading");
    setErrorMsg(null);
    setUnsupportedExt(null);

    try {
      const parsed = await parseToObject(buffer, fmt);
      // useEffect cleanup disposes the previous object on state change.
      setObject(parsed);
      setFileName(name);
      setSourceFormat(fmt);
      setTargetFormat(fmt === "stl" ? "obj" : "stl");
      setStatus("idle");
      trackFileUploaded(fmt, source);
    } catch (err) {
      console.error("Parse failed", err);
      setErrorMsg(err instanceof Error ? err.message : `Could not parse ${fmt} file`);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setObject(null);
    setFileName("");
    setSourceFormat(null);
    setUnsupportedExt(null);
    setErrorMsg(null);
    setStatus("idle");
  };

  const handleSample = async (format: Format) => {
    setStatus("loading");
    setErrorMsg(null);
    setUnsupportedExt(null);
    trackSampleLoaded(format);
    try {
      const geo = new THREE.TorusKnotGeometry(10, 3, 100, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.1,
        roughness: 0.6,
      });
      const sampleMesh = new THREE.Mesh(geo, mat);
      const blob = await exportToBlob(sampleMesh, format);
      geo.dispose();
      mat.dispose();
      const buffer = await blob.arrayBuffer();
      await handleFile(buffer, `flip3d-sample.${format}`, "sample");
    } catch (err) {
      console.error("Sample load failed", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load sample");
      setStatus("error");
    }
  };

  const handleConvert = async () => {
    if (!object || !sourceFormat) return;
    setStatus("converting");
    setErrorMsg(null);
    try {
      const blob = await exportToBlob(object, targetFormat);
      const baseName = fileName.replace(/\.[^.]+$/, "") || "model";
      downloadBlob(blob, `${baseName}.${targetFormat}`);
      setStatus("idle");
      trackFileConverted(sourceFormat, targetFormat);
    } catch (err) {
      console.error("Convert failed", err);
      const msg = err instanceof Error ? err.message : "Conversion failed";
      setErrorMsg(msg);
      setStatus("error");
      trackConvertError(sourceFormat, targetFormat, msg);
    }
  };

  const hasFile = object !== null;

  return (
    <>
      <JsonLd
        data={softwareAppSchema({
          name: "Flip3D",
          description:
            "Free online 3D file converter, viewer and repair tools. STL, OBJ, GLB, 3MF, PLY, STEP, IGES, FBX, DAE — all in the browser.",
          url: SITE_URL,
        })}
      />
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-16 sm:pb-12">
          {!hasFile ? (
            <>
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  Flip your 3D files.
                  <br />
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    Free, fast, local.
                  </span>
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  Convert, view and repair 3D files in your browser — STL, OBJ,
                  GLB, 3MF, PLY, STEP, IGES, FBX, DAE. Bambu ↔ Prusa 3MF,
                  G-code preview, STL repair. No signup. No upload. 100% local.
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                {unsupportedExt && TOOL_FOR_EXT[unsupportedExt] ? (
                  // Routable file (SVG / image): take over the drop area with a
                  // clear "detected" state so the next step is right where the
                  // user just dropped — no easy-to-miss footnote.
                  <div className="flex flex-col items-center justify-center text-center w-full min-h-[220px] sm:min-h-[280px] rounded-2xl border-2 border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 px-6 py-10">
                    <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight mb-1.5">
                      {unsupportedExt.toUpperCase()} detected
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mb-6">
                      {unsupportedExt === "svg"
                        ? "An SVG becomes 3D by extruding its outline — that runs on a separate tool from this mesh converter."
                        : "An image becomes 3D by turning brightness into height — that runs on a separate tool from this mesh converter."}
                    </p>
                    <Link
                      href={TOOL_FOR_EXT[unsupportedExt].href}
                      className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 shadow-sm"
                    >
                      Open {TOOL_FOR_EXT[unsupportedExt].label} →
                    </Link>
                    <button
                      onClick={() => setUnsupportedExt(null)}
                      className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 underline hover:no-underline"
                    >
                      Choose another file
                    </button>
                  </div>
                ) : (
                  <>
                    <Dropzone
                      onFileLoaded={handleFile}
                      // Let image/vector files through so handleFile can point the
                      // user to the right dedicated tool instead of a dead reject.
                      accept={[...SUPPORTED_FORMATS, ".svg", ".png", ".jpg", ".jpeg", ".webp"]}
                    />

                    <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        No file handy? Try a sample:
                      </span>
                      {FORMATS.filter((f) => !SOURCE_ONLY_FORMATS.has(f)).map((f) => (
                        <button
                          key={f}
                          onClick={() => handleSample(f)}
                          disabled={status === "loading"}
                          className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          .{f}
                        </button>
                      ))}
                    </div>

                    {status === "loading" && (
                      <div className="mt-4 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300">
                        Parsing file…
                      </div>
                    )}

                    {unsupportedExt && (
                      <div className="mt-4 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-sm text-blue-900 dark:text-blue-200">
                        <span className="font-medium">.{unsupportedExt} isn&rsquo;t supported here.</span>{" "}
                        This converter handles STL, OBJ, GLB, 3MF, PLY, STEP, IGES, FBX and DAE. For
                        an image use{" "}
                        <Link href="/image-to-stl/" className="underline hover:no-underline">
                          Image to STL
                        </Link>
                        ; for a vector use{" "}
                        <Link href="/svg-to-stl/" className="underline hover:no-underline">
                          SVG to STL
                        </Link>
                        .
                        <button
                          onClick={() => setUnsupportedExt(null)}
                          className="ml-3 underline hover:no-underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </>
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
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {fileName}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Drag to rotate · scroll to zoom · right-click to pan
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  ← Load another file
                </button>
              </div>

              <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Convert this file
                  </span>
                  <span className="font-mono uppercase px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                    {sourceFormat ? FORMAT_LABELS[sourceFormat] : ""}
                  </span>
                  <span className="text-zinc-500">→</span>
                  <select
                    value={targetFormat}
                    onChange={(e) => setTargetFormat(e.target.value as Format)}
                    className="font-mono uppercase px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs cursor-pointer"
                  >
                    {FORMATS.filter((f) => f !== sourceFormat && isExportable(f)).map((f) => (
                      <option key={f} value={f}>
                        {FORMAT_LABELS[f]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleConvert}
                  disabled={status === "converting"}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "converting"
                    ? "Converting…"
                    : `Convert & Download .${targetFormat}`}
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="h-[60vh] sm:h-[480px] lg:h-[560px]">
                <MeshViewer object={object} />
              </div>
            </>
          )}
        </section>

        {!hasFile && (
          <>
            <section
              id="tools"
              className="border-t border-zinc-200 dark:border-zinc-800 py-16"
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Quick tools</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                      Eight tools, all live today — 100% in your browser.
                    </p>
                  </div>
                  <a
                    href="https://github.com/suyfdong/flip3d"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    See roadmap on GitHub →
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {QUICK_TOOLS.map((tool) => (
                    <ToolCardItem key={tool.title} tool={tool} />
                  ))}
                </div>
              </div>
            </section>

            <section
              id="why"
              className="border-t border-zinc-200 dark:border-zinc-800 py-16 bg-zinc-50 dark:bg-zinc-950/50"
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="text-2xl font-bold tracking-tight">Why Flip3D</h2>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                    Built different from the bloated converter sites out there.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <WhyCard
                    icon="🔒"
                    title="100% Local Processing"
                    desc="Your files never leave your browser. We use WebAssembly to convert everything client-side. No upload server, no privacy risk."
                  />
                  <WhyCard
                    icon="💯"
                    title="Always Free, No Signup"
                    desc="No account, no email, no credit card. Open every tool, drop a file, get your output. No ads in your face either."
                  />
                  <WhyCard
                    icon="🛠️"
                    title="Built for Makers"
                    desc="Bambu Lab, Prusa, Anycubic, Creality — we&apos;re fixing the cross-vendor compatibility headaches no one else will."
                  />
                </div>
              </div>
            </section>

            <section
              id="how"
              className="border-t border-zinc-200 dark:border-zinc-800 py-16"
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl font-bold tracking-tight text-center mb-12">
                  How it works
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StepCard n={1} title="Drop your file" desc="Drag any supported 3D file into the browser. Files load instantly from your disk." />
                  <StepCard n={2} title="Convert, view or repair" desc="Pick a target format. Processing happens entirely in your browser via WebAssembly." />
                  <StepCard n={3} title="Download the result" desc="Save the output back to your disk. Nothing is stored on our servers — ever." />
                </div>

                <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-10">
                  Powered by <code className="font-mono">three.js</code> ·{" "}
                  <code className="font-mono">occt-import-js</code> ·{" "}
                  <code className="font-mono">jszip</code> · all running in
                  your browser
                </p>
              </div>
            </section>

            <section
              id="formats"
              className="border-t border-zinc-200 dark:border-zinc-800 py-16 bg-zinc-50 dark:bg-zinc-950/50"
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl font-bold tracking-tight mb-2 text-center">
                  12 formats and counting
                </h2>
                <p className="text-center text-zinc-600 dark:text-zinc-400 mb-10">
                  Four live today. The rest arrive in the next 8 weeks.
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {ALL_FORMATS.map((fmt) => {
                    const lower = fmt.toLowerCase();
                    const isLive =
                      (FORMATS as readonly string[]).includes(lower) ||
                      lower === "stp";
                    return (
                      <div
                        key={fmt}
                        className={`px-4 py-3 rounded-lg border text-center font-mono font-medium text-sm transition-colors ${
                          isLive
                            ? "bg-white dark:bg-zinc-900 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500"
                        }`}
                      >
                        .{fmt.toLowerCase()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
    </>
  );
}

function ToolCardItem({ tool }: { tool: ToolCard }) {
  const isLive = tool.status === "live";
  const isHighlight = tool.status === "highlight";

  const className = `
    group relative block rounded-xl border p-5 transition-all
    ${tool.href ? "hover:shadow-md hover:-translate-y-0.5 hover:border-blue-400 dark:hover:border-blue-700" : ""}
    ${
      isLive
        ? "border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-900"
        : isHighlight
        ? "border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
    }
  `;

  const inner = (
    <>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold tracking-tight">{tool.title}</h3>
        <span
          className={`
            text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ml-2
            ${
              isLive
                ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
                : isHighlight
                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }
          `}
        >
          {tool.badge}
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{tool.desc}</p>
    </>
  );

  if (tool.href) {
    return (
      <Link href={tool.href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

function WhyCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function StepCard({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold mb-4">
        {n}
      </div>
      <h3 className="font-semibold tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
        {desc}
      </p>
    </div>
  );
}
