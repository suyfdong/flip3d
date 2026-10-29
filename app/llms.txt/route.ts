import {
  ALIAS_ROUTES,
  CONVERTER_ROUTES,
  DXF_ROUTES,
  IMAGE_ROUTES,
  REFERENCE_ROUTES,
  RENDER_ROUTES,
  SITE_URL,
  TOOL_ROUTES,
  VECTOR_ROUTES,
  VIEWER_ROUTES,
} from "@/lib/seo";
import { FORMAT_LABELS, type Format } from "@/lib/converters/formats";

export const dynamic = "force-static";

// /llms.txt (llmstxt.org): a plain-markdown map of the site for LLMs.
// ChatGPT is our second-largest first-touch source, so give it one place that
// says what each tool does. Lists come from lib/seo.ts like the sitemap, so a
// newly registered route shows up here too; NOTES adds the one-line purpose.

const NOTES: Record<string, string> = {
  // Viewers
  "stl-viewer": "open an STL in the browser, rotate/zoom, see dimensions and triangle count",
  "obj-viewer": "open OBJ files and inspect them",
  "fbx-viewer": "preview FBX models without installing Autodesk software",
  "ply-viewer": "open PLY meshes, point clouds and Gaussian-splat PLY (shown as coloured points)",
  "glb-viewer": "view GLB/glTF with PBR materials, textures and built-in animations",
  "3mf-viewer": "open Bambu Studio / PrusaSlicer / Orca 3MF projects, including multi-part and painted multi-colour files; shows plates, filaments and colours",
  "step-viewer": "open STEP CAD files online: assembly part tree, hide/isolate parts, measure",
  "stp-viewer": "same STEP engine for .stp files",
  "iges-viewer": "open IGES/IGS CAD files in the browser",
  "dae-viewer": "open Collada DAE files",
  // Tools
  "bambu-3mf-to-prusa": "make a Bambu Studio 3MF open correctly in PrusaSlicer (flattens production-extension object references)",
  "prusa-3mf-to-bambu": "convert a PrusaSlicer 3MF so Bambu Studio imports it",
  "gcode-simulator": "preview G-code toolpaths layer by layer, with print time and filament estimates",
  "stl-repair": "diagnose open and non-manifold edges; merge duplicate vertices, remove degenerate triangles, recompute normals",
  "print-checker": "check a model before printing: watertight, size, overhangs, fits the build plate of common printers",
  "stl-editor": "resize, scale to exact mm, rotate and drop to the bed, then export",
  // Image → 3D
  "image-to-stl": "turn any image into a 3D-printable relief (heightmap) STL",
  "png-to-stl": "PNG to STL relief; transparent areas can be cut out",
  "jpg-to-stl": "JPG to STL relief",
  "jpeg-to-stl": "JPEG to STL relief",
  "lithophane-generator": "make a printable lithophane from a photo",
  "image-to-obj": "image to OBJ relief mesh",
  "png-to-obj": "PNG to OBJ relief mesh",
  "jpg-to-obj": "JPG to OBJ relief mesh",
  "png-to-3mf": "PNG to 3MF relief (3MF keeps real units)",
  "image-to-color-stl": "image to a coloured relief; exports PLY/GLB because STL cannot store colour",
  "photo-to-stl": "3D print a photo as a relief or lithophane",
  "picture-to-stl": "picture to STL relief",
  // Vector
  "svg-to-stl": "extrude an SVG logo or icon into a 3D-printable STL, with optional base plate",
  // DXF / 2D
  "jpg-to-dxf": "trace a JPG into DXF outlines for laser cutting / CNC",
  "png-to-dxf": "trace a PNG (including white-on-transparent icons) into DXF",
  "image-to-dxf": "trace any image into closed DXF polylines (R12, works in old CAM software)",
  "stl-to-dxf": "cut a cross-section through an STL and export it as DXF",
  "stl-to-svg": "cross-section an STL into SVG for laser cutters",
  "step-to-dxf": "section a STEP model into a 2D DXF profile",
  "dxf-to-stl": "extrude DXF outlines into a 3D STL at a chosen thickness",
  "dxf-viewer": "open and inspect DXF drawings online (blocks/inserts supported)",
  // Render
  "stl-to-jpg": "render an STL to a JPG image (front/iso/top views)",
  "obj-to-png": "render an OBJ to PNG, transparent background optional",
  "glb-to-png": "render a GLB to PNG thumbnail",
  // Aliases
  "stp-to-stl": "convert .stp (STEP) CAD files to STL",
  "gltf-to-obj": "convert glTF to OBJ",
};

type Route = { slug: string; title: string };

function list(routes: Route[], prefix = ""): string {
  return routes
    .map(({ slug, title }) => {
      const note = NOTES[slug];
      return `- [${title}](${SITE_URL}/${prefix}${slug}/)${note ? `: ${note}` : ""}`;
    })
    .join("\n");
}

export function GET() {
  const converters = CONVERTER_ROUTES.map(
    ({ from, to }) =>
      `- [${FORMAT_LABELS[from as Format]} to ${FORMAT_LABELS[to as Format]}](${SITE_URL}/${from}-to-${to}/)`,
  ).join("\n");

  const body = `# Flip3D

> Free online 3D file converter, viewer and repair tools. Everything runs locally in the browser (three.js + WebAssembly): files are never uploaded, no signup, no watermark.

Good fit when someone asks how to open, convert, view, repair or prepare a 3D file without installing software. Strongest on 3D-printing workflows: Bambu Studio / PrusaSlicer 3MF compatibility, STEP/STP viewing, image or SVG to STL, and STL/STEP/image to DXF for laser cutting. Limits: no STL to STEP (a mesh cannot be turned back into true CAD surfaces), very large files are bounded by the device's memory.

Home page: ${SITE_URL}/ (drop any supported file to convert or open it). Full directory: ${SITE_URL}/converters/

## Viewers

${list(VIEWER_ROUTES)}

## 3D printing tools

${list(TOOL_ROUTES, "tools/")}

## Image and SVG to 3D

${list([...IMAGE_ROUTES, ...VECTOR_ROUTES])}

## DXF / SVG for laser cutting and CNC

${list(DXF_ROUTES)}

## 3D to image

${list(RENDER_ROUTES)}

## File format converters

Mesh formats (STL, OBJ, GLB, 3MF, PLY) convert in every direction. STEP, IGES, FBX and DAE can be converted from, not to.

${converters}
${list(ALIAS_ROUTES)}

## Embed

- [Embeddable 3D viewer](${SITE_URL}/embed/): free iframe 3D model viewer for websites and wikis (pass a model URL), 4 themes

## Reference

${list(REFERENCE_ROUTES, "reference/")}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
