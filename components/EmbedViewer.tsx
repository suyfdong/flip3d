"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import * as THREE from "three";
import {
  detectFormat,
  parseToObject,
  disposeObject,
  isFormat,
  type Format,
} from "@/lib/converters";

const MeshViewer = dynamic(() => import("@/components/MeshViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <span className="text-sm text-zinc-500">Loading viewer…</span>
    </div>
  ),
});

type Status = "idle" | "loading" | "error";

export default function EmbedViewer() {
  const params = useSearchParams();
  const url = params.get("url");
  const formatParam = params.get("format");

  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    let loaded: THREE.Object3D | null = null;

    (async () => {
      setStatus("loading");
      setErrorMsg(null);
      try {
        const fmt =
          (formatParam && isFormat(formatParam) ? (formatParam as Format) : null) ??
          detectFormat(url);
        if (!fmt) {
          throw new Error(
            "Unable to detect format from URL. Add &format=stl (or obj/glb/3mf/ply/step).",
          );
        }
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching model`);
        const buffer = await res.arrayBuffer();
        const parsed = await parseToObject(buffer, fmt);
        if (cancelled) {
          disposeObject(parsed);
          return;
        }
        loaded = parsed;
        setObject(parsed);
        setStatus("idle");
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load model";
        setErrorMsg(message);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (loaded) disposeObject(loaded);
    };
  }, [url, formatParam]);

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {!url && <NoUrlNotice />}
      {url && status === "loading" && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-zinc-500">Loading model from URL…</span>
        </div>
      )}
      {url && status === "error" && errorMsg && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
              Couldn&apos;t load this model
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{errorMsg}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3">
              The host must allow CORS for the file to load.
            </p>
          </div>
        </div>
      )}
      {url && status === "idle" && object && (
        <div className="flex-1 min-h-0">
          <MeshViewer object={object} compact />
        </div>
      )}

      <a
        href="https://flip3d.app/?utm_source=embed&utm_medium=iframe"
        target="_blank"
        rel="noopener"
        className="absolute bottom-2 right-2 text-xs px-2.5 py-1 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-colors"
      >
        Powered by <span className="font-semibold">Flip3D</span>
      </a>
    </div>
  );
}

function NoUrlNotice() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md text-center text-zinc-600 dark:text-zinc-400 text-sm">
        <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          No model URL provided
        </p>
        <p>
          Use this URL as an iframe src with a{" "}
          <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded">
            url
          </code>{" "}
          parameter:
        </p>
        <pre className="mt-3 px-3 py-2 rounded bg-zinc-100 dark:bg-zinc-900 text-xs overflow-x-auto text-left">
          {`<iframe src="https://flip3d.app/embed/stl-viewer/?url=YOUR_MODEL.stl" width="100%" height="500"></iframe>`}
        </pre>
        <p className="mt-3 text-xs">
          See the{" "}
          <a
            href="https://flip3d.app/embed/"
            target="_blank"
            rel="noopener"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            embed guide
          </a>{" "}
          for a code generator.
        </p>
      </div>
    </div>
  );
}
