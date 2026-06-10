import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/stl-to-3mf/`;
const title = "STL to 3MF Converter — Free Online | No Signup Required";
const description =
  "Convert .stl to 3MF in your browser — free, instant, 100% local. Repackages an STL mesh as a modern, units-aware 3MF that Bambu Studio, PrusaSlicer and Cura read. No upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "STL to 3MF — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STL to 3MF — Free Online",
    description: "Convert .stl files to modern 3MF in your browser. 100% local, no signup.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert an STL file to 3MF?",
    a: "Drop your .stl file into the box above, preview it in the 3D viewer, then click Convert & Download .3mf. Everything runs in your browser — the file is never uploaded.",
  },
  {
    q: "Is this STL to 3MF converter free?",
    a: "Yes. No signup, no watermark, and no file-size paywall. Flip3D reads your STL and writes the 3MF locally on your own device.",
  },
  {
    q: "Why convert STL to 3MF?",
    a: "3MF is the modern replacement for STL. STL is a bare triangle mesh with no units, color, or metadata, which is why scale and orientation get lost between tools. 3MF is a compact, units-aware package that stores the mesh cleanly and is the native project format for Bambu Studio and PrusaSlicer — so a 3MF travels between programs with far less ambiguity.",
  },
  {
    q: "Will the 3MF open in Bambu Studio, PrusaSlicer and Cura?",
    a: "Yes. 3MF is an open standard that all three read, along with most modern slicers and CAD tools. This converter writes a clean, vanilla 3MF with no slicer-specific extensions, so it loads anywhere.",
  },
  {
    q: "Does it add color or materials?",
    a: "No. An STL carries only geometry, so there's no color to add — the 3MF holds the same single mesh. You can paint or assign materials afterward in your slicer. We never invent data that wasn't in your file.",
  },
  {
    q: "What units does the 3MF use?",
    a: "Millimeters — the default unit in the 3MF spec and what slicers expect. STL is unitless, so if your original was modeled at another scale, double-check the size in your slicer after importing.",
  },
  {
    q: "Can I convert 3MF back to STL?",
    a: "Yes — use the 3MF to STL converter for the reverse direction. For how the two formats compare, see the STL vs OBJ vs 3MF reference.",
  },
];

const CONTENT: ConverterContent = {
  lede:
    "Drop a .stl file and download a modern 3MF in seconds. Repackages your mesh as a clean, units-aware 3MF that Bambu Studio, PrusaSlicer and Cura read. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting an STL file to 3MF",
  about: [
    "STL is the original 3D-printing format — a flat list of triangles with no units, no color, and no metadata. It works everywhere, but that bareness is also why scale and orientation so often get lost moving between programs. 3MF was designed to fix exactly that: it's a compact zipped-XML package that stores the same mesh along with units and room for color and multiple objects.",
    "This converter reads the geometry from your STL and writes a standard 3MF — a vanilla one, with no Bambu- or Prusa-specific extensions — so it opens cleanly in any modern slicer or CAD tool. The mesh is preserved exactly; the file just gains a proper, units-aware container.",
    "Converting STL to 3MF is worth it when you're moving a model into Bambu Studio or PrusaSlicer, which both use 3MF as their native project format, or when you simply want a cleaner, smaller file than a raw STL. If you specifically need to move a Bambu project into PrusaSlicer, use the dedicated Bambu 3MF to Prusa tool instead.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/3mf-to-stl/",
      title: "3MF → STL",
      desc: "The reverse — flatten a 3MF back to a plain STL",
    },
    {
      href: "/tools/bambu-3mf-to-prusa/",
      title: "Bambu 3MF → Prusa",
      desc: "Open a Bambu Studio 3MF in PrusaSlicer",
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
          { name: "STL to 3MF", url: URL },
        ])}
      />
      <ConverterPage from="stl" to="3mf" content={CONTENT} />
    </>
  );
}
