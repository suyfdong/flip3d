import type { Format } from "./converters";
import type { EmbedTheme } from "./embed-themes";

const SITE = "https://flip3d.app";

/** Root-level viewer page for each parseable format (see VIEWER_ROUTES in seo.ts). */
export const VIEWER_PATH_BY_FORMAT: Record<Format, string> = {
  stl: "/stl-viewer/",
  obj: "/obj-viewer/",
  glb: "/glb-viewer/",
  "3mf": "/3mf-viewer/",
  ply: "/ply-viewer/",
  step: "/step-viewer/",
  iges: "/iges-viewer/",
  fbx: "/fbx-viewer/",
  dae: "/dae-viewer/",
};

/**
 * "Open in Flip3D" target for the embed badge: the full-size viewer page with
 * the same model pre-loaded via ?url=. utm_* keeps GA4 attribution as
 * embed / iframe so badge clicks stay measurable.
 */
export function buildOpenInFlip3dUrl(
  modelUrl: string,
  fmt: Format,
  theme: EmbedTheme,
): string {
  const u = new URL(VIEWER_PATH_BY_FORMAT[fmt], SITE);
  u.searchParams.set("url", modelUrl);
  u.searchParams.set("utm_source", "embed");
  u.searchParams.set("utm_medium", "iframe");
  u.searchParams.set("utm_campaign", "open_viewer");
  u.searchParams.set("utm_content", theme);
  return u.toString();
}

/** Human file name from a model URL, for the viewer heading. */
export function fileNameFromUrl(modelUrl: string): string {
  try {
    const last = new URL(modelUrl).pathname.split("/").pop() ?? "";
    return decodeURIComponent(last) || "model";
  } catch {
    return "model";
  }
}
