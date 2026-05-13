"use client";

import { useMemo, useState } from "react";
import { FORMATS, type Format } from "@/lib/converters";
import { DEFAULT_THEME, THEMES, THEME_SPECS, type EmbedTheme } from "@/lib/embed-themes";

type SamplePick = {
  label: string;
  url: string;
  format: Format;
};

const EXAMPLE_URLS: SamplePick[] = [
  {
    label: "Box.glb (5 KB)",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb",
    format: "glb",
  },
  {
    label: "Duck.glb (118 KB)",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
    format: "glb",
  },
  {
    label: "DamagedHelmet.glb (3.7 MB)",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
    format: "glb",
  },
];

const SIZE_PRESETS: Array<{ label: string; value: number }> = [
  { label: "300px", value: 300 },
  { label: "500px", value: 500 },
  { label: "800px", value: 800 },
];

export default function EmbedCodeGenerator() {
  const [modelUrl, setModelUrl] = useState("");
  const [height, setHeight] = useState(500);
  const [format, setFormat] = useState<"" | Format>("");
  const [theme, setTheme] = useState<EmbedTheme>(DEFAULT_THEME);
  const [copied, setCopied] = useState(false);

  const embedUrl = useMemo(() => {
    if (!modelUrl.trim()) return "";
    const u = new URL("https://flip3d.app/embed/stl-viewer/");
    u.searchParams.set("url", modelUrl.trim());
    if (format) u.searchParams.set("format", format);
    if (theme !== DEFAULT_THEME) u.searchParams.set("theme", theme);
    return u.toString();
  }, [modelUrl, format, theme]);

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
      // older browsers — fallthrough; the textarea is selectable.
    }
  };

  const handleExample = (pick: SamplePick) => {
    setModelUrl(pick.url);
    setFormat(pick.format);
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
            Theme
          </span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as EmbedTheme)}
            className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-blue-400 focus:outline-none capitalize"
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-500 dark:text-zinc-400">Height:</span>
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setHeight(p.value)}
              className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
                height === p.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                  : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
              }`}
            >
              {p.label}
            </button>
          ))}
          <input
            type="number"
            min={200}
            max={1200}
            step={50}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value) || 500)}
            className="px-2 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-20 font-mono"
            aria-label="Custom height in pixels"
          />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
          {THEME_SPECS[theme].description}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-zinc-500 dark:text-zinc-400">Sample models:</span>
        {EXAMPLE_URLS.map((e) => (
          <button
            key={e.url}
            type="button"
            onClick={() => handleExample(e)}
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
        <pre className="px-3 py-3 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto font-mono whitespace-pre-wrap break-all">
          {iframeHtml ||
            "<!-- Enter a model URL above (or pick a sample) to generate iframe code -->"}
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
