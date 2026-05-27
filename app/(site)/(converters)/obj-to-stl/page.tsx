import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/obj-to-stl/`;
const title = "OBJ to STL Converter — Free Online | No Signup Required";
const description =
  "Convert .obj to STL in your browser — free, instant, 100% local. Reads Wavefront OBJ geometry and writes a clean STL for any slicer. No upload, no signup, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "OBJ to STL — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OBJ to STL — Free Online",
    description: "Convert .obj files to STL in your browser. 100% local, no signup.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert an OBJ file to STL?",
    a: "Drop your .obj file into the box above, preview it in the 3D viewer, then click Convert & Download .stl. The conversion runs entirely in your browser — nothing is uploaded.",
  },
  {
    q: "Is this OBJ to STL converter free?",
    a: "Yes. It's free with no signup, no watermark, and no file-size paywall. Flip3D processes everything locally in your browser.",
  },
  {
    q: "What happens to the .mtl file, materials and textures?",
    a: "STL stores only geometry — no color, materials, or texture coordinates. So the .mtl materials and any textures referenced by your OBJ are dropped, and named groups are merged into one mesh. The geometry itself is preserved exactly. If you need to keep materials, convert to GLB or 3MF instead.",
  },
  {
    q: "Do I need to upload the .mtl file too?",
    a: "No. STL ignores materials, so only the .obj geometry is used. There's nothing to upload anyway — the file is read on your device.",
  },
  {
    q: "Does it handle large OBJ files?",
    a: "Yes. Conversion runs on your own machine, so size is limited by your browser's memory rather than an upload cap. Large meshes work fine on a normal desktop.",
  },
  {
    q: "Can I convert STL back to OBJ?",
    a: "Yes — use the STL to OBJ converter for the reverse direction. For how the formats differ, see the STL vs OBJ vs 3MF reference.",
  },
];

const CONTENT: ConverterContent = {
  lede:
    "Drop a .obj file and download a clean STL in seconds. Reads Wavefront OBJ geometry and writes a slicer-ready STL. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting an OBJ file to STL",
  about: [
    "OBJ (Wavefront) is a text-based mesh format that can reference an .mtl material file, textures, and named object groups. STL is the opposite — a single, geometry-only mesh with no color or materials. This OBJ to STL converter reads the geometry out of your .obj and writes a standard STL that any slicer or CAD tool accepts.",
    "Because STL can't store materials, the .mtl file, textures, and per-group colors are dropped, and separate groups are merged into one combined mesh. The geometry is preserved triangle-for-triangle — only the surface appearance is lost, since STL has nowhere to keep it.",
    "For 3D printing, STL is exactly what slicers expect, so this is the right conversion. If you instead need to keep materials and UVs — for rendering or game engines — convert to GLB or 3MF rather than STL.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/obj-to-glb/",
      title: "OBJ → GLB",
      desc: "Keep materials and textures instead of dropping them",
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
          { name: "OBJ to STL", url: URL },
        ])}
      />
      <ConverterPage from="obj" to="stl" content={CONTENT} />
    </>
  );
}
