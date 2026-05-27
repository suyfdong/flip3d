import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/3mf-to-stl/`;
const title = "3MF to STL Converter — Free Online | No Signup Required";
const description =
  "Convert .3mf to STL in your browser — free, instant, 100% local. Works with Bambu Studio, PrusaSlicer, Orca and Cura 3MF files. No upload, no signup, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "3MF to STL — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "3MF to STL — Free Online",
    description: "Convert .3mf files to STL in your browser. 100% local, no signup.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert a 3MF file to STL?",
    a: "Drop your .3mf file into the box above, preview it in the 3D viewer, then click Convert & Download .stl. The whole conversion runs in your browser — nothing is uploaded.",
  },
  {
    q: "Is this 3MF to STL converter free?",
    a: "Yes. It's free with no signup, no watermark, and no file-size paywall. Flip3D processes everything locally in your browser.",
  },
  {
    q: "Does it work with Bambu Studio, PrusaSlicer, Orca or Cura 3MF files?",
    a: "Yes. It reads the mesh geometry out of slicer 3MFs from all of them. If you instead want to move a project file between Bambu and Prusa without flattening to STL, use the Bambu 3MF ↔ Prusa 3MF tool, which keeps it as a .3mf.",
  },
  {
    q: "What happens to multiple objects or colors in my 3MF?",
    a: "STL stores a single mesh with no color or metadata, so a multi-object or multi-color 3MF is merged into one combined mesh and color/material info is dropped. The geometry is preserved exactly.",
  },
  {
    q: "Is my .3mf file uploaded anywhere?",
    a: "No. There is no upload and no server. The file is read and converted entirely on your device, and nothing is stored.",
  },
  {
    q: "Can I convert STL back to 3MF?",
    a: "Yes — use the STL to 3MF converter for the reverse direction. For the difference between the formats, see the STL vs OBJ vs 3MF reference.",
  },
];

const CONTENT: ConverterContent = {
  lede:
    "Drop a .3mf file and download a clean STL in seconds. Works with Bambu Studio, PrusaSlicer, Orca and Cura 3MF files. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting a 3MF file to STL",
  about: [
    "3MF is a zip-based 3D-printing format that can pack several objects, colors, and slicer settings into one file. STL is the opposite — a single, geometry-only mesh with no color or metadata. This 3MF to STL converter reads the mesh out of your .3mf and writes a standard STL that any slicer or CAD tool accepts.",
    "If your 3MF holds multiple parts, they're merged into one mesh on the way out, since STL can't keep them separate. The geometry itself is preserved triangle-for-triangle — only the color and slicer metadata are dropped, because STL has nowhere to store them.",
    "Going through STL is the right move when you just need plain geometry. If you're instead trying to open a Bambu project in PrusaSlicer (or the reverse) and want to keep it editable, don't flatten to STL — use the Bambu 3MF ↔ Prusa 3MF tool, which strips the vendor-private parts and keeps the file as a .3mf.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/tools/bambu-3mf-to-prusa/",
      title: "Bambu 3MF → Prusa 3MF",
      desc: "Move a project between slicers without flattening to STL",
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
          { name: "3MF to STL", url: URL },
        ])}
      />
      <ConverterPage from="3mf" to="stl" content={CONTENT} />
    </>
  );
}
