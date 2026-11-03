import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema, softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/wrl-viewer/`;
const title = "WRL Viewer — Free Online VRML File Viewer | Open .WRL Files in Browser";
const description =
  "Open WRL (VRML 2.0 / VRML97) files online — KiCad board models, CAD exports, molecules — with their colours. Measure, inspect parts, convert to STL, OBJ or GLB. Free, no upload.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: { title: "WRL (VRML) Viewer — Free, 100% Local", description, url: URL, siteName: "Flip3D", locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: "WRL (VRML) Viewer — Free, 100% Local", description: "Open .wrl VRML files in your browser. No plugin, no upload." },
};

const config: ViewerConfig = {
  format: "wrl",
  formatLabel: "WRL",
  accept: [".wrl", ".vrml"],
  eyebrow: "WRL · VRML97 · 3D Viewer",
  heading: "WRL (VRML) File Viewer",
  intro:
    "Open a .wrl VRML file in your browser — KiCad board models, CAD exports, molecules, old web 3D — with its colours. Drag to rotate, measure, and convert to STL, OBJ or GLB. Free, nothing to install, 100% local.",
  about: [
    "VRML (.wrl) is one of the oldest 3D formats, and it's still everywhere: KiCad and other PCB tools export 3D boards and component models as VRML, CAD packages offer it for coloured exports, and scientific software uses it for molecules and plots. Almost nothing opens it by default anymore.",
    "This viewer reads VRML 2.0 / VRML97 — shapes, indexed face sets, per-vertex and per-face colours and materials — and shows the file's own colours. The parts list lets you hide or isolate pieces.",
    "Not supported: VRML 1.0 files, external textures and Inline references to other files (only what's inside the one .wrl is shown), and scripted animation.",
    "Want it in a modern format? Convert the WRL to STL for printing, or GLB / OBJ for other 3D software.",
  ],
  faq: [
    {
      q: "How do I open a WRL file?",
      a: "Drop the .wrl into the box above and it opens in the browser — no VRML plugin, no install. It also accepts the less common .vrml extension.",
    },
    {
      q: "Can it open KiCad VRML exports?",
      a: "Yes. KiCad's File → Export → VRML output is VRML 2.0 with per-part colours, which this viewer shows. Component models (.wrl) from KiCad libraries open too.",
    },
    {
      q: "Why is my KiCad model 2.54 times too small?",
      a: "KiCad's library VRML models are drawn in tenths of an inch, not millimetres — an 0603 resistor reads as 0.63 × 0.31 instead of 1.6 × 0.8 mm. Before printing or using the model in mm-based CAD, scale it by 2.54 (the STL Editor does this in one step).",
    },
    {
      q: "Is this WRL viewer free?",
      a: "Yes. Free, no signup and no watermark; the file is read on your own device.",
    },
    {
      q: "My file says \"VRML V1.0\" — why won't it open?",
      a: "Only VRML 2.0 / VRML97 is supported. Most tools that still export VRML default to 2.0 (often labelled \"VRML97\"); re-export with that option.",
    },
    {
      q: "Can I convert WRL to STL?",
      a: "Yes — use WRL → STL below for 3D printing. Colours can't go into STL; choose GLB or PLY if you want to keep them.",
    },
    {
      q: "Is my file uploaded?",
      a: "No. The VRML is parsed and rendered locally in your browser.",
    },
  ],
  links: [
    { href: "/wrl-to-stl/", title: "WRL → STL", desc: "3D-print the model" },
    { href: "/wrl-to-glb/", title: "WRL → GLB", desc: "Keep the colours, open anywhere" },
    { href: "/wrl-to-obj/", title: "WRL → OBJ", desc: "Editable mesh for CAD or Blender" },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd data={softwareAppSchema({ name: "WRL (VRML) File Viewer", description, url: URL })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "WRL (VRML) File Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
