import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/stl-to-obj/`;
const title = "STL to OBJ Converter — Free Online | No Signup Required";
const description =
  "Convert STL to OBJ in your browser — free, instant, 100% local. Re-encodes your mesh as a Wavefront .obj for Blender, Maya, ZBrush and more. No upload, no signup, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "STL to OBJ — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STL to OBJ — Free Online",
    description: "Convert STL files to Wavefront OBJ in your browser. 100% local, no signup.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert an STL file to OBJ?",
    a: "Drop your .stl file into the box above, preview it in the 3D viewer, then click Convert & Download .obj. The conversion runs entirely in your browser — nothing is uploaded.",
  },
  {
    q: "Is this STL to OBJ converter free?",
    a: "Yes. It's free with no signup, no watermark, and no file-size paywall. Flip3D processes everything locally in your browser.",
  },
  {
    q: "Will the OBJ have colors or materials?",
    a: "No — and that's not a limitation of the converter. STL stores only geometry, so there are no colors or materials to carry over. You get a clean Wavefront OBJ with the same mesh; add materials in your 3D app afterward if you need them.",
  },
  {
    q: "Does the OBJ open in Blender, Maya or ZBrush?",
    a: "Yes. OBJ is supported by virtually every 3D and DCC app — Blender, Maya, 3ds Max, ZBrush, Cinema 4D — which is the main reason to convert from STL.",
  },
  {
    q: "Is my STL file uploaded anywhere?",
    a: "No. There is no upload and no server. The file is read and converted entirely on your device, and nothing is stored.",
  },
  {
    q: "Can I convert OBJ back to STL?",
    a: "Yes — use the OBJ to STL converter for the reverse direction. For how the formats differ, see the STL vs OBJ vs 3MF reference.",
  },
];

const CONTENT: ConverterContent = {
  lede:
    "Drop a .stl file and download a Wavefront .obj in seconds. Re-encodes your mesh for Blender, Maya, ZBrush and any tool that prefers OBJ. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting an STL file to OBJ",
  about: [
    "STL is a geometry-only triangle mesh. OBJ (Wavefront) is a text-based mesh that can also hold groups, materials, and texture coordinates. This STL to OBJ converter re-encodes the same triangles as a standard .obj that any 3D or CAD tool reads.",
    "Because the source STL has no color or materials, the OBJ comes out as plain geometry — there's nothing to invent. The mesh is preserved triangle-for-triangle; if you want materials or UVs, add them in your 3D app after importing.",
    "The usual reason to go STL → OBJ is to bring a printable model into a DCC tool like Blender, Maya, or ZBrush, which all favor OBJ. If you instead need materials and textures to travel with the file for the web or a game engine, convert to GLB rather than OBJ.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/stl-to-glb/",
      title: "STL → GLB",
      desc: "Web/game-ready format that can carry materials",
    },
    {
      href: "/reference/stl-vs-obj-vs-3mf/",
      title: "STL vs OBJ vs 3MF",
      desc: "Which format to use, and what each one keeps",
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
          { name: "STL to OBJ", url: URL },
        ])}
      />
      <ConverterPage from="stl" to="obj" content={CONTENT} />
    </>
  );
}
