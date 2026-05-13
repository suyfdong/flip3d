"use client";

import { useMemo, useState } from "react";
import { FORMATS, type Format } from "@/lib/converters";

const EXAMPLE_URLS: Array<{ label: string; url: string; format: Format }> = [
  {
    label: "Khronos sample (Box.glb, 5 KB)",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb",
    format: "glb",
  },
];

export default function EmbedCodeGenerator() {
  const [modelUrl, setModelUrl] = useState("");
  const [height, setHeight] = useState(500);
  const [format, setFormat] = useState<"" | Format>("");
  const [copied, setCopied] = useState(false);

  const embedUrl = useMemo(() => {
    if (!modelUrl.trim()) return "";
    const u = new URL("https://flip3d.app/embed/stl-viewer/");
    u.searchParams.set("url", modelUrl.trim());
    if (format) u.searchParams.set("format", format);
    return u.toString();
  }, [modelUrl, format]);

  const iframeHtml = useMemo(() => {
    if (!embedUrl) return "";
    return `<iframe src="${embedUrl}" width="100%" height="${height}" style="border:none;border-radius:12px" loading="lazy" allowfullscreen></iframe>`;
  }, [embedUrl, height]);

  const handleCopy = async () => {
    if (!iframeHtml) return;
    try {
      await navigator.clipboard.writeText(iframeHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // older browsers: select the text
    }
  };

  const handleExample = (url: string, fmt: Format) => {
    setModelUrl(url);
    setFormat(fmt);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Model URL
          </span>
          <input
            type="url"
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
            placeholder="https://example.com/model.stl"
            className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-blue-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Format
          </span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "" | Format)}
            className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-blue-400 focus:outline-none"
          >
            <option value="">Auto-detect</option>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Height (px)
          </span>
          <input
            type="number"
            min={200}
            max={1200}
            step={50}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value) || 500)}
            className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-blue-400 focus:outline-none w-28"
          />
        </label>
      </div>

      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-zinc-500 dark:text-zinc-400">Try a sample:</span>
        {EXAMPLE_URLS.map((e) => (
          <button
            key={e.url}
            type="button"
            onClick={() => handleExample(e.url, e.format)}
            className="px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            iframe HTML
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!iframeHtml}
            className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <pre className="px-3 py-3 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto font-mono">
          {iframeHtml ||
            "<!-- Enter a model URL above to generate iframe code -->"}
        </pre>
      </div>

      {iframeHtml && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Live preview
          </span>
          <iframe
            key={embedUrl + height}
            src={embedUrl}
            width="100%"
            height={height}
            style={{ border: "none", borderRadius: 12 }}
            loading="lazy"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
