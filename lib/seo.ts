import type { Metadata } from "next";
import { FORMAT_LABELS, type Format } from "./converters";

export const SITE_URL = "https://flip3d.app";

export function buildConverterMetadata(from: Format, to: Format): Metadata {
  const fromLabel = FORMAT_LABELS[from];
  const toLabel = FORMAT_LABELS[to];
  const path = `/${from}-to-${to}/`;
  const title = `${fromLabel} to ${toLabel} Converter — Free Online | No Signup Required`;
  const description = `Convert ${fromLabel} to ${toLabel} files in your browser. Free, instant, 100% local — no upload, no signup, no watermark.`;
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Flip3D",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${fromLabel} → ${toLabel} — Free Online Converter`,
      description: `Convert ${fromLabel} to ${toLabel} in your browser. No signup. 100% local.`,
    },
  };
}

export const CONVERTER_ROUTES: Array<{ from: Format; to: Format }> = [
  { from: "stl", to: "obj" },
  { from: "obj", to: "stl" },
  { from: "stl", to: "glb" },
  { from: "glb", to: "stl" },
  { from: "stl", to: "3mf" },
  { from: "3mf", to: "stl" },
];
