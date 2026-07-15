import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/gltf-to-obj/`;
const title = "glTF to OBJ Converter — Free Online | No Signup Required";
const description =
  "Convert glTF / GLB to Wavefront OBJ in your browser — free, instant, 100% local. Reads .gltf and .glb and exports clean OBJ geometry. No upload, no signup, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "glTF to OBJ — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "glTF to OBJ — Free Online",
    description: "Convert .gltf / .glb to OBJ in your browser. 100% local.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert a glTF file to OBJ?",
    a: "Drop your .gltf or .glb file into the box above, preview it in the 3D viewer, then click Convert & Download .obj. It's read and converted entirely in your browser — nothing is uploaded.",
  },
  {
    q: "Does it accept both .gltf and .glb?",
    a: "Yes. Both load here. GLB is the binary, self-contained version of glTF; a .gltf is JSON that may reference external .bin and texture files. Self-contained .glb converts most reliably.",
  },
  {
    q: "Will the OBJ keep materials and textures?",
    a: "OBJ stores geometry; materials live in a separate .mtl file and textures in image files. This converter outputs the mesh geometry — colors and PBR materials from the glTF aren't written into the OBJ.",
  },
  {
    q: "Is the glTF to OBJ converter free?",
    a: "Yes. It's free with no signup, no watermark, and no file-size paywall. Flip3D runs the conversion locally in your browser.",
  },
  {
    q: "Is my file uploaded anywhere?",
    a: "No. There is no upload and no server. The model is parsed and converted on your device, and nothing is stored.",
  },
];

const CONTENT: ConverterContent = {
  fromLabel: "glTF",
  lede:
    "Drop a .gltf or .glb file and download a clean OBJ in seconds. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting glTF / GLB to OBJ",
  about: [
    "glTF 2.0 is the standard format for web, AR and real-time engines. GLB is its binary, self-contained form (geometry, materials and textures in one file); a .gltf is JSON that often points to separate .bin and image files. This converter reads both and writes standard Wavefront OBJ.",
    "OBJ carries geometry only — materials belong in a companion .mtl file and textures in image maps. The exported OBJ contains the mesh so it opens anywhere (Blender, ZBrush, slicers), but the glTF's PBR materials and textures aren't baked in.",
    "Everything runs locally with three.js in your browser. Nothing is uploaded, and there's no signup or watermark.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/glb-to-obj/",
      title: "GLB → OBJ",
      desc: "The same converter, framed for the .glb extension",
    },
    {
      href: "/glb-to-stl/",
      title: "GLB → STL",
      desc: "Convert to a printable STL instead",
    },
    {
      href: "/glb-viewer/",
      title: "GLB / glTF Viewer",
      desc: "Just want to look at it? Open it in the viewer",
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
          { name: "glTF to OBJ", url: URL },
        ])}
      />
      <ConverterPage from="glb" to="obj" content={CONTENT} />
    </>
  );
}
