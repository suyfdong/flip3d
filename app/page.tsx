"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Dropzone from "@/components/Dropzone";

// three.js viewer 必须客户端加载（用 window / WebGL）
const StlViewer = dynamic(() => import("@/components/StlViewer"), {
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
};

const QUICK_TOOLS: ToolCard[] = [
  {
    title: "Online STL Viewer",
    desc: "Drop & preview .stl files instantly in your browser",
    status: "live",
    badge: "Live now",
  },
  {
    title: "Bambu 3MF → Prusa 3MF",
    desc: "Convert between Bambu Studio and PrusaSlicer formats",
    status: "highlight",
    badge: "Coming W4 ⭐",
  },
  {
    title: "STL ↔ STEP",
    desc: "Bidirectional CAD ↔ mesh conversion",
    status: "soon",
    badge: "Coming W2",
  },
  {
    title: "GLB ↔ OBJ",
    desc: "Web3D and game format interchange",
    status: "soon",
    badge: "Coming W2",
  },
  {
    title: "G-code Simulator",
    desc: "Visualize 3D print toolpaths before printing",
    status: "soon",
    badge: "Coming W5",
  },
  {
    title: "STL Repair",
    desc: "Fix non-manifold edges, holes, and self-intersections",
    status: "soon",
    badge: "Coming W6",
  },
];

const ALL_FORMATS = [
  "STL", "OBJ", "GLB", "GLTF", "3MF", "STEP",
  "STP", "FBX", "PLY", "IGES", "DAE", "X_T",
];

export default function Home() {
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [unsupportedFormat, setUnsupportedFormat] = useState<string | null>(null);

  const handleFile = (buffer: ArrayBuffer, name: string) => {
    const ext = name.toLowerCase().split(".").pop() ?? "";
    if (ext === "stl") {
      setFileBuffer(buffer);
      setFileName(name);
      setUnsupportedFormat(null);
    } else {
      // 其他格式现在还没接入 viewer，给出诚实提示
      setUnsupportedFormat(ext.toUpperCase());
      setFileBuffer(null);
      setFileName("");
    }
  };

  const handleReset = () => {
    setFileBuffer(null);
    setFileName("");
    setUnsupportedFormat(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Nav */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
              F
            </div>
            <span className="font-semibold tracking-tight">Flip3D</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="#tools" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Tools
            </a>
            <a href="#why" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Why Flip3D
            </a>
            <a href="#how" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              How it works
            </a>
            <a href="#formats" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Formats
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ============== Hero + Dropzone ============== */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
          {!fileBuffer ? (
            <>
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                  Flip your 3D files.
                  <br />
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    Free, fast, local.
                  </span>
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  Convert, view and repair STL, OBJ, GLB, 3MF, STEP, FBX in your
                  browser. No signup. No upload. 100% local.
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <Dropzone onFileLoaded={handleFile} />

                {unsupportedFormat && (
                  <div className="mt-4 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-sm text-blue-900 dark:text-blue-200">
                    <span className="font-medium">
                      .{unsupportedFormat.toLowerCase()} support coming soon.
                    </span>{" "}
                    Currently only <code className="font-mono">.stl</code> can
                    be previewed in the viewer. Conversion for other formats
                    arrives W2-W6 — see the tools below.
                    <button
                      onClick={handleReset}
                      className="ml-3 underline hover:no-underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {fileName}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Preview · Drag to rotate, scroll to zoom
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  ← Load another file
                </button>
              </div>
              <div className="h-[560px]">
                <StlViewer fileBuffer={fileBuffer} fileName={fileName} />
              </div>
            </>
          )}
        </section>

        {/* Below-fold sections — 仅在没有文件加载时显示 */}
        {!fileBuffer && (
          <>
            {/* ============== Quick Tools 矩阵 ============== */}
            <section
              id="tools"
              className="border-t border-zinc-200 dark:border-zinc-800 py-16"
            >
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      Quick tools
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                      6 tools shipping in the next 6 weeks. We&apos;re building
                      in public.
                    </p>
                  </div>
                  <a
                    href="https://github.com"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    See roadmap →
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {QUICK_TOOLS.map((tool) => (
                    <ToolCardItem key={tool.title} tool={tool} />
                  ))}
                </div>
              </div>
            </section>

            {/* ============== Why Flip3D ============== */}
            <section
              id="why"
              className="border-t border-zinc-200 dark:border-zinc-800 py-16 bg-zinc-50 dark:bg-zinc-950/50"
            >
              <div className="max-w-6xl mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Why Flip3D
                  </h2>
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

            {/* ============== How it works ============== */}
            <section
              id="how"
              className="border-t border-zinc-200 dark:border-zinc-800 py-16"
            >
              <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-2xl font-bold tracking-tight text-center mb-12">
                  How it works
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StepCard
                    n={1}
                    title="Drop your file"
                    desc="Drag any supported 3D file into the browser. Files load instantly from your disk."
                  />
                  <StepCard
                    n={2}
                    title="Convert, view or repair"
                    desc="Pick a tool. Processing happens entirely in your browser via WebAssembly."
                  />
                  <StepCard
                    n={3}
                    title="Download the result"
                    desc="Save the output back to your disk. Nothing is stored on our servers — ever."
                  />
                </div>

                <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-10">
                  Powered by{" "}
                  <code className="font-mono">three.js</code> ·{" "}
                  <code className="font-mono">gltf-transform</code> ·{" "}
                  <code className="font-mono">OpenCASCADE.js</code> — all
                  running in your browser
                </p>
              </div>
            </section>

            {/* ============== Format Grid ============== */}
            <section
              id="formats"
              className="border-t border-zinc-200 dark:border-zinc-800 py-16 bg-zinc-50 dark:bg-zinc-950/50"
            >
              <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-2xl font-bold tracking-tight mb-2 text-center">
                  12 formats and counting
                </h2>
                <p className="text-center text-zinc-600 dark:text-zinc-400 mb-10">
                  From 3D printing to CAD to Web3D — one toolbox.
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {ALL_FORMATS.map((fmt) => (
                    <div
                      key={fmt}
                      className="px-4 py-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center font-mono font-medium text-sm hover:border-blue-400 dark:hover:border-blue-700 transition-colors cursor-pointer"
                    >
                      .{fmt.toLowerCase()}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 flex-wrap gap-2">
          <p>© {new Date().getFullYear()} Flip3D</p>
          <p className="font-mono text-xs">
            v0.1.0 · Built in public · three.js
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ───────────── Small subcomponents ───────────── */

function ToolCardItem({ tool }: { tool: ToolCard }) {
  const isLive = tool.status === "live";
  const isHighlight = tool.status === "highlight";

  return (
    <div
      className={`
        group relative rounded-xl border p-5 transition-all
        ${
          isLive
            ? "border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-900 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            : isHighlight
            ? "border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
        }
      `}
    >
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
    </div>
  );
}

function WhyCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
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

function StepCard({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc: string;
}) {
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
