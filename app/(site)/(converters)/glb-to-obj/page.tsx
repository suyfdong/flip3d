import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/glb-to-obj/`;
const title = "GLB to OBJ Converter — Free Online | No Signup Required";
const description =
  "Convert .glb to OBJ in your browser — free, instant, 100% local. Reads binary glTF (GLB) geometry and writes a clean Wavefront OBJ. No upload, no signup, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "GLB to OBJ — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GLB to OBJ — Free Online",
    description: "Convert .glb files to OBJ in your browser. 100% local, no signup.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert a GLB file to OBJ?",
    a: "Drop your .glb file into the box above, preview it in the 3D viewer, then click Convert & Download .obj. Everything runs in your browser — the file is never uploaded.",
  },
  {
    q: "Is this GLB to OBJ converter free?",
    a: "Yes. No signup, no watermark, and no file-size paywall. Flip3D reads and converts your GLB locally on your own device.",
  },
  {
    q: "Is \".glb to .obj\" the same as GLB to OBJ?",
    a: "Yes — the dots are only how the extensions look on disk. One real difference is in the files themselves: a .glb bundles its textures inside a single binary, while the .obj you get back references materials from a separate .mtl file, so a lone .obj will not carry the GLB's textures with it.",
  },
  {
    q: "Does it keep materials, textures and colors?",
    a: "No. GLB stores rich PBR materials and embedded textures; OBJ stores geometry only. The OBJ we write has no .mtl file and no textures, so materials and color are dropped. Vertex positions, normals, and UV coordinates are preserved, so textures can be re-applied in your target app. To keep materials, stay in GLB.",
  },
  {
    q: "Can I convert glTF (.gltf) to OBJ?",
    a: "This tool reads binary glTF — the single-file .glb. If you have a text .gltf with separate .bin and texture files, pack it into a .glb first (most exporters, including Blender, can do this), then convert. The geometry conversion is identical either way.",
  },
  {
    q: "What happens to animations?",
    a: "They're dropped. OBJ is a static, single-frame mesh with no animation track, so any GLB animations are not carried over. Convert only when you need the geometry; keep the GLB if you need the animation.",
  },
  {
    q: "Can I convert OBJ back to GLB?",
    a: "Yes — use the OBJ to GLB converter for the reverse direction, which lets you keep or rebuild materials. For how the formats differ, see the STL vs OBJ vs 3MF reference.",
  },
  {
    q: "Will the OBJ open in Blender, Cinema 4D or Unity?",
    a: "Yes. OBJ is read by every major 3D app, game engine, and slicer. Converting GLB to OBJ is usually about getting the mesh into a tool that doesn't take GLB directly.",
  },
];

const CONTENT: ConverterContent = {
  lede:
    "Drop a .glb file and download a clean Wavefront OBJ in seconds. Reads binary glTF geometry and writes portable OBJ. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting a GLB file to OBJ",
  about: [
    "GLB is binary glTF — the compact, modern format for web, AR and game engines, carrying PBR materials, embedded textures, animation and a full scene graph in one file. OBJ (Wavefront) is a plain, static mesh that nearly every 3D tool can open. Converting GLB to OBJ trades GLB's rich scene data for that universal compatibility.",
    "This converter reads the geometry from your GLB with three.js and writes a standard OBJ — vertices, normals and UV coordinates included. Because OBJ can't hold them, materials, textures and animation are not carried over. The geometry is preserved exactly, so the shape that comes out matches the shape that went in.",
    "OBJ is the right target when a tool won't take GLB directly, or when you only need the raw mesh for editing, CAD, or 3D printing. If you need to keep materials and textures, stay in GLB; if you want a printable mesh, convert straight to STL.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/glb-to-stl/",
      title: "GLB → STL",
      desc: "Geometry only, ready for any slicer",
    },
    {
      href: "/obj-to-glb/",
      title: "OBJ → GLB",
      desc: "The reverse — bring a mesh back into glTF",
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
          { name: "GLB to OBJ", url: URL },
        ])}
      />
      <ConverterPage from="glb" to="obj" content={CONTENT} />
    </>
  );
}
