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
  // Mesh ↔ mesh full matrix (5 mesh × 4 = 20)
  { from: "stl", to: "obj" }, { from: "obj", to: "stl" },
  { from: "stl", to: "glb" }, { from: "glb", to: "stl" },
  { from: "stl", to: "3mf" }, { from: "3mf", to: "stl" },
  { from: "stl", to: "ply" }, { from: "ply", to: "stl" },
  { from: "obj", to: "glb" }, { from: "glb", to: "obj" },
  { from: "obj", to: "3mf" }, { from: "3mf", to: "obj" },
  { from: "obj", to: "ply" }, { from: "ply", to: "obj" },
  { from: "glb", to: "3mf" }, { from: "3mf", to: "glb" },
  { from: "glb", to: "ply" }, { from: "ply", to: "glb" },
  { from: "3mf", to: "ply" }, { from: "ply", to: "3mf" },
  // Source-only → mesh
  { from: "step", to: "stl" }, { from: "step", to: "obj" },
  { from: "step", to: "glb" }, { from: "step", to: "3mf" },
  { from: "step", to: "ply" },
  { from: "iges", to: "stl" }, { from: "iges", to: "obj" },
  { from: "iges", to: "glb" }, { from: "iges", to: "3mf" },
  { from: "iges", to: "ply" },
  { from: "fbx", to: "stl" }, { from: "fbx", to: "obj" },
  { from: "fbx", to: "glb" }, { from: "fbx", to: "3mf" },
  { from: "fbx", to: "ply" },
  { from: "dae", to: "stl" }, { from: "dae", to: "obj" },
  { from: "dae", to: "glb" }, { from: "dae", to: "3mf" },
  { from: "dae", to: "ply" },
];

export const REFERENCE_ROUTES: Array<{ slug: string; title: string }> = [
  {
    slug: "stl-vs-obj-vs-3mf",
    title: "STL vs OBJ vs 3MF vs GLB vs PLY",
  },
  {
    slug: "bambu-vs-prusa",
    title: "Bambu Lab vs Prusa — Slicers, 3MF, Workflow",
  },
  {
    slug: "metal-gauge-chart",
    title: "Sheet Metal Gauge to mm/inch Chart",
  },
];

export const LEGAL_ROUTES: Array<{ slug: string }> = [
  { slug: "about" },
  { slug: "privacy" },
  { slug: "terms" },
];

export const TOOL_ROUTES: Array<{ slug: string; title: string }> = [
  {
    slug: "bambu-3mf-to-prusa",
    title: "Bambu 3MF to Prusa 3MF Converter",
  },
  {
    slug: "prusa-3mf-to-bambu",
    title: "Prusa 3MF to Bambu 3MF Converter",
  },
  {
    slug: "gcode-simulator",
    title: "G-code Simulator",
  },
  {
    slug: "stl-repair",
    title: "STL Repair",
  },
];

// Image → 3D (heightmap / lithophane) landing pages. Root-level short URLs
// matching the search queries (image to stl / png to stl / jpg to stl).
export const IMAGE_ROUTES: Array<{ slug: string; title: string }> = [
  { slug: "image-to-stl", title: "Image to STL" },
  { slug: "png-to-stl", title: "PNG to STL" },
  { slug: "jpg-to-stl", title: "JPG to STL" },
  { slug: "lithophane-generator", title: "Lithophane Generator" },
];

// Vector → 3D (SVG extrude) landing pages. Separate pipeline from the mesh
// converters (SVGLoader + ExtrudeGeometry), so they get their own group.
export const VECTOR_ROUTES: Array<{ slug: string; title: string }> = [
  { slug: "svg-to-stl", title: "SVG to STL" },
];

// Extension-alias converter pages: same engine as a CONVERTER_ROUTE but a
// distinct search query gets its own URL + canonical (e.g. .stp vs .step).
export const ALIAS_ROUTES: Array<{ slug: string; title: string }> = [
  { slug: "stp-to-stl", title: "STP to STL" },
];
