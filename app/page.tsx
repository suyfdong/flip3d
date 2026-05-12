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

export default function Home() {
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFile = (buffer: ArrayBuffer, name: string) => {
    setFileBuffer(buffer);
    setFileName(name);
  };

  const handleReset = () => {
    setFileBuffer(null);
    setFileName("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Nav */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
              F
            </div>
            <span className="font-semibold tracking-tight">Flip3D</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Convert
            </a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              View
            </a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Tools
            </a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Reference
            </a>
          </nav>
        </div>
      </header>

      {/* Hero + Tool */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
          {!fileBuffer ? (
            <>
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                  Flip your 3D files.
                  <br />
                  <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
                    Free, fast, local.
                  </span>
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  Convert, view and repair STL, OBJ, GLB, 3MF, STEP, FBX in your
                  browser. No signup. No upload. 100% local.
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <Dropzone
                  onFileLoaded={handleFile}
                  accept={[".stl"]}
                />
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-3 mt-8 text-sm text-zinc-600 dark:text-zinc-400">
                <Pill>🔒 No signup required</Pill>
                <Pill>⚡ Instant — no upload</Pill>
                <Pill>🌐 Works in any browser</Pill>
                <Pill>💯 Always free</Pill>
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

        {/* Supported formats */}
        {!fileBuffer && (
          <section className="border-t border-zinc-200 dark:border-zinc-800 py-16">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="text-2xl font-bold tracking-tight mb-2 text-center">
                Built for every 3D file
              </h2>
              <p className="text-center text-zinc-600 dark:text-zinc-400 mb-10">
                One tool. Many formats. All in your browser.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  "STL",
                  "OBJ",
                  "GLB",
                  "GLTF",
                  "3MF",
                  "STEP",
                  "STP",
                  "FBX",
                  "PLY",
                  "IGES",
                  "DAE",
                  "X_T",
                ].map((fmt) => (
                  <div
                    key={fmt}
                    className="px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center font-mono font-medium text-sm"
                  >
                    .{fmt.toLowerCase()}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} Flip3D</p>
          <p className="font-mono text-xs">v0.1.0 · Built with three.js</p>
        </div>
      </footer>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      {children}
    </span>
  );
}
