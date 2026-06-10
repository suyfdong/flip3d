import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/fbx-to-stl/`;
const title = "FBX to STL Converter — Free Online | No Signup Required";
const description =
  "Convert .fbx to STL in your browser — free, instant, 100% local. Turns an Autodesk FBX model into a slicer-ready STL for 3D printing. No upload, no signup, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "FBX to STL — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FBX to STL — Free Online",
    description: "Convert .fbx files to STL for 3D printing. 100% local, no signup.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert an FBX file to STL?",
    a: "Drop your .fbx file into the box above, preview it in the 3D viewer, then click Convert & Download .stl. Everything runs in your browser — the file is never uploaded.",
  },
  {
    q: "Is this FBX to STL converter free?",
    a: "Yes. No signup, no watermark, and no file-size paywall. Flip3D reads and converts your FBX locally on your own device.",
  },
  {
    q: "Does it keep materials, textures and rigging?",
    a: "No. STL stores geometry only. An FBX's materials, textures, skeleton/rig and animation are all dropped, leaving a single clean mesh — which is exactly what a slicer needs. If you want to keep materials for rendering instead, convert FBX to GLB.",
  },
  {
    q: "My model imports at the wrong size — why?",
    a: "It's units. STL is unitless and slicers assume millimeters, while FBX files carry their own unit scale (often centimeters). If the model comes in too small or too large, just scale it in your slicer or set the import units.",
  },
  {
    q: "Is the STL ready to 3D print?",
    a: "The geometry is preserved exactly, but FBX models built for games or animation aren't always watertight or manifold, which slicers require. Preview it here first, and if your slicer flags holes or non-manifold edges, run it through our free STL Repair tool before printing.",
  },
  {
    q: "Can I convert STL back to FBX here?",
    a: "Not on Flip3D — FBX is read-only here, meaning we import it but don't write it back out (valid FBX requires Autodesk's proprietary SDK). For the reverse, use Blender (free) or another desktop tool.",
  },
  {
    q: "Does it handle large FBX files?",
    a: "Yes. Conversion runs on your own machine, so the limit is your browser's memory rather than an upload cap. Large meshes convert fine on a normal desktop.",
  },
];

const CONTENT: ConverterContent = {
  lede:
    "Drop a .fbx file and download a slicer-ready STL in seconds. Turns an Autodesk FBX model into clean mesh geometry for 3D printing. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting an FBX file to STL",
  about: [
    "FBX (Autodesk) is a game- and film-pipeline format that bundles meshes, materials, textures, rigs and animation. STL is the universal 3D-printing format: a single, geometry-only mesh every slicer reads. Converting FBX to STL is how you take a model made for games or animation and get it ready for the print bed.",
    "This converter reads the geometry from your FBX with three.js and writes a standard STL. Because STL holds shape and nothing else, materials, textures, bones and animation are dropped — the printer needs the mesh, not the rig. The geometry itself is preserved exactly.",
    "Two things to check before printing, since FBX models usually come from outside the print world: scale (FBX carries its own units, often centimeters, while slicers assume millimeters — rescale if it imports wrong), and watertightness (game and animation meshes aren't always solid). Preview here, then use STL Repair if your slicer complains.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/tools/stl-repair/",
      title: "STL Repair",
      desc: "Fix holes & non-manifold edges before printing",
    },
    {
      href: "/fbx-to-glb/",
      title: "FBX → GLB",
      desc: "Keep materials and textures instead of dropping them",
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
          { name: "FBX to STL", url: URL },
        ])}
      />
      <ConverterPage from="fbx" to="stl" content={CONTENT} />
    </>
  );
}
