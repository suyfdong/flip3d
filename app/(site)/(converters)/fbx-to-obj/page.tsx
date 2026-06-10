import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/fbx-to-obj/`;
const title = "FBX to OBJ Converter — Free Online | No Signup Required";
const description =
  "Convert .fbx to OBJ in your browser — free, instant, 100% local. Pulls the mesh out of an Autodesk FBX and writes a clean Wavefront OBJ. No upload, no signup, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "FBX to OBJ — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FBX to OBJ — Free Online",
    description: "Convert .fbx files to OBJ in your browser. 100% local, no signup.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert an FBX file to OBJ?",
    a: "Drop your .fbx file into the box above, preview it in the 3D viewer, then click Convert & Download .obj. Everything runs in your browser — the file is never uploaded.",
  },
  {
    q: "Is this FBX to OBJ converter free?",
    a: "Yes. No signup, no watermark, and no file-size paywall. Flip3D reads and converts your FBX locally on your own device.",
  },
  {
    q: "Does it keep materials and textures?",
    a: "No. OBJ stores geometry only — the OBJ we write has no .mtl material file and no textures, so an FBX's embedded materials and texture maps are dropped. Vertex positions, normals, and UV coordinates are preserved, so you can re-apply materials in your target app. If you need to keep materials, convert FBX to GLB instead.",
  },
  {
    q: "What happens to animations, bones and rigging?",
    a: "They're dropped. OBJ is a static, single-frame mesh format with no concept of skeletons, skinning, or animation, so the converter exports the geometry only. If your FBX is rigged or animated and you need that preserved, keep it as FBX or use GLB.",
  },
  {
    q: "Can I convert OBJ back to FBX here?",
    a: "Not on Flip3D — FBX is read-only here, meaning we import it but don't write it back out (producing valid FBX requires Autodesk's proprietary SDK). For the reverse direction, use Blender (free) or another desktop tool.",
  },
  {
    q: "Will the OBJ open in Blender, Maya, Unity or Cinema 4D?",
    a: "Yes. OBJ is one of the most widely supported mesh formats — every major 3D app, game engine, and slicer reads it. That portability is the main reason to convert FBX to OBJ.",
  },
  {
    q: "Does it handle large FBX files?",
    a: "Yes. Conversion runs on your own machine, so the limit is your browser's memory rather than an upload cap. Large meshes convert fine on a normal desktop.",
  },
];

const CONTENT: ConverterContent = {
  lede:
    "Drop a .fbx file and download a clean Wavefront OBJ in seconds. Pulls the mesh out of an Autodesk FBX and writes portable OBJ geometry. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting an FBX file to OBJ",
  about: [
    "FBX (Autodesk) is a heavy scene format built for game and film pipelines — a single .fbx can carry meshes, materials, textures, skeletons, skinning, animation, cameras and lights. OBJ (Wavefront) is the opposite: a simple, static mesh that almost every 3D tool can open. Converting FBX to OBJ trades that scene data for maximum portability.",
    "This converter reads the geometry from your FBX with three.js and writes a standard OBJ — vertices, normals and UV coordinates included. Because OBJ has nowhere to store them, materials, textures, rigs and animation are not carried over. The shape itself is preserved exactly, triangle for triangle.",
    "If you only need the model's geometry — to drop into a slicer, a CAD tool, or another mesh editor — OBJ is the right target. If you need to keep PBR materials and textures, convert FBX to GLB instead; if you just want a printable mesh, go straight to STL.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/fbx-to-glb/",
      title: "FBX → GLB",
      desc: "Keep materials and textures instead of dropping them",
    },
    {
      href: "/fbx-to-stl/",
      title: "FBX → STL",
      desc: "Just the geometry, ready for any slicer",
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
          { name: "FBX to OBJ", url: URL },
        ])}
      />
      <ConverterPage from="fbx" to="obj" content={CONTENT} />
    </>
  );
}
