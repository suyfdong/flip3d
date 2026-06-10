import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/glb-to-stl/`;
const title = "GLB to STL Converter — Free Online | No Signup Required";
const description =
  "Convert .glb to STL in your browser — free, instant, 100% local. Turns a binary glTF (GLB) model into a slicer-ready STL for 3D printing. No upload, no signup, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "GLB to STL — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GLB to STL — Free Online",
    description: "Convert .glb files to STL for 3D printing. 100% local, no signup.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert a GLB file to STL?",
    a: "Drop your .glb file into the box above, preview it in the 3D viewer, then click Convert & Download .stl. Everything runs in your browser — the file is never uploaded.",
  },
  {
    q: "Is this GLB to STL converter free?",
    a: "Yes. No signup, no watermark, and no file-size paywall. Flip3D reads and converts your GLB locally on your own device.",
  },
  {
    q: "Does it keep color, textures and materials?",
    a: "No. STL stores geometry only — no color, materials, or textures. A GLB's PBR materials and embedded textures are dropped, leaving a single clean mesh. That's exactly what slicers expect, since 3D printers print shape, not surface color (unless you have a multi-material setup driven separately).",
  },
  {
    q: "My model imports tiny (or huge) in my slicer — why?",
    a: "It's almost always units. glTF/GLB is defined in meters, while STL is unitless and slicers assume millimeters. So a 1-meter GLB can come in as 1 mm. The converter keeps the original coordinates as-is; just scale the model in your slicer (often ×1000) or set the import units.",
  },
  {
    q: "Is the STL ready to 3D print?",
    a: "The geometry is preserved exactly, but GLB models from games, AR, or 3D-scan/AI tools aren't always watertight or manifold, which slicers need. Preview it here first, and if your slicer flags holes or non-manifold edges, run it through our free STL Repair tool before printing.",
  },
  {
    q: "Can I convert glTF (.gltf) to STL?",
    a: "This tool reads binary glTF — the single-file .glb. If you have a text .gltf with separate .bin and texture files, pack it into a .glb first (Blender and most exporters can), then convert.",
  },
  {
    q: "Can I convert STL back to GLB?",
    a: "Yes — use the STL to GLB converter for the reverse direction. For how the formats differ, see the STL vs OBJ vs 3MF reference.",
  },
];

const CONTENT: ConverterContent = {
  lede:
    "Drop a .glb file and download a slicer-ready STL in seconds. Turns a binary glTF model into clean mesh geometry for 3D printing. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting a GLB file to STL",
  about: [
    "GLB is binary glTF — the compact format behind web, AR and game assets, carrying PBR materials, textures and animation. STL is the universal 3D-printing format: a single, geometry-only mesh that every slicer reads. Converting GLB to STL is how you take a model you found or built for the screen and get it ready for the print bed.",
    "This converter reads the geometry from your GLB with three.js and writes a standard STL. Because STL holds shape and nothing else, color, materials, textures and animation are dropped — the printer needs the mesh, not the surface look. The geometry itself is preserved exactly.",
    "Two things to check before printing, because GLB models often come from outside the print world: scale (glTF is in meters, slicers assume millimeters — rescale if it imports tiny), and watertightness (game, AR and AI-generated meshes aren't always solid). Preview here, then use STL Repair if your slicer complains.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/tools/stl-repair/",
      title: "STL Repair",
      desc: "Fix holes & non-manifold edges before printing",
    },
    {
      href: "/glb-to-obj/",
      title: "GLB → OBJ",
      desc: "Editable mesh instead of a print file",
    },
    {
      href: "/reference/stl-vs-obj-vs-3mf/",
      title: "STL vs OBJ vs 3MF",
      desc: "Which mesh format keeps what, and when to use each",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(FAQ)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "GLB to STL", url: URL },
        ])}
      />
      <ConverterPage from="glb" to="stl" content={CONTENT} />
    </>
  );
}
