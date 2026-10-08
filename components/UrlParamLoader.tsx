"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { fileNameFromUrl } from "@/lib/viewer-url";

type Props = {
  /** Called with the fetched bytes, exactly like Dropzone's onFileLoaded. */
  onLoaded: (buffer: ArrayBuffer, fileName: string) => void | Promise<void>;
  onStart?: () => void;
  onError?: (message: string) => void;
};

/**
 * Reads `?url=` once and fetches the model (CORS) for any tool page, so the
 * embed badge and the viewer's "Do more with this file" links can hand the
 * same model to the next tool. Wrapped in Suspense because useSearchParams
 * needs a boundary under static export. Renders nothing.
 */
export default function UrlParamLoader(props: Props) {
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  );
}

function Inner({ onLoaded, onStart, onError }: Props) {
  const url = useSearchParams().get("url");
  // Handlers in the tool components are plain functions (new identity each
  // render); keep the latest ones in refs so the effect only depends on url.
  const handlers = useRef({ onLoaded, onStart, onError });
  handlers.current = { onLoaded, onStart, onError };

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    (async () => {
      handlers.current.onStart?.();
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching model`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;
        await handlers.current.onLoaded(buffer, fileNameFromUrl(url));
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Could not load model from URL";
        handlers.current.onError?.(
          `${msg}. The file host must allow CORS — or drop the file here instead.`,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return null;
}

/** Append ?url= to an internal tool link so the next tool opens the same model. */
export function withModelUrl(href: string, modelUrl: string | null): string {
  if (!modelUrl) return href;
  return `${href}?url=${encodeURIComponent(modelUrl)}`;
}
