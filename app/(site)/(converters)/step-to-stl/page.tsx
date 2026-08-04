import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/step-to-stl/`;
const title = "STEP to STL Converter — Free Online | No Signup Required";
const description =
  "Convert STEP / STP to STL in your browser — free, instant, 100% local. Reads CAD solids with OpenCASCADE and tessellates them to a slicer-ready STL. No upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "STEP to STL — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STEP to STL — Free Online",
    description: "Convert .step / .stp CAD files to STL in your browser. 100% local.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert a STEP file to STL?",
    a: "Drop your .step or .stp file into the box above, preview it in the 3D viewer, then click Convert & Download .stl. It's read and tessellated entirely in your browser — nothing is uploaded.",
  },
  {
    q: "Is STP the same as STEP?",
    a: "Yes. .stp and .step are just two extensions for the same ISO 10303 CAD format. This converter accepts both.",
  },
  {
    q: "How do I open a STEP file in STL format?",
    a: "You don't open a STEP in STL — you convert it, which is what this page does. Drop the .step or .stp file, and it comes back out as an .stl you can open in any slicer or mesh editor. The original STEP is left untouched on your machine.",
  },
  {
    q: "Is the STEP to STL converter free?",
    a: "Yes. It's free with no signup, no watermark, and no file-size paywall. Flip3D runs the OpenCASCADE engine locally in your browser.",
  },
  {
    q: "What quality is the converted mesh?",
    a: "The CAD solid is tessellated automatically into a detailed triangle mesh that's suitable for slicing and 3D printing. STL is an approximation of the exact STEP surfaces, so very tight curves become many small facets.",
  },
  {
    q: "Is my STEP file uploaded anywhere?",
    a: "No. There is no upload and no server. The WebAssembly OpenCASCADE reader runs on your device, and nothing is stored.",
  },
  {
    q: "Can I convert STL back to STEP?",
    a: "No, and we won't pretend to. STL is a triangle mesh, and a mesh can't be turned back into an editable CAD solid — the exact surfaces are gone once a model is tessellated. Tools that output a \"STEP\" from an STL just wrap the triangles in a STEP shell; it opens but isn't a real parametric part.",
  },
];

const CONTENT: ConverterContent = {
  lede:
    "Drop a .step or .stp file and download a clean STL in seconds. Reads CAD solids with OpenCASCADE and tessellates them for any slicer. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting a STEP / STP file to STL",
  about: [
    "STEP (.step or .stp — same ISO 10303 format, two extensions) is a precise B-rep CAD format that stores exact analytic surfaces and solids. STL is a triangle-mesh approximation of those surfaces. This converter reads your STEP with OpenCASCADE compiled to WebAssembly and tessellates the solid into a standard STL that any slicer or mesh tool accepts.",
    "Both .stp and .step work here — they're the same thing. Curved faces become many small triangles in the STL, so a round hole turns into a faceted ring rather than a true cylinder. That's expected: STL has no concept of analytic geometry, only triangles.",
    "There's no STL-to-STEP here on purpose. Once a model is a mesh, the exact CAD surfaces are gone, so it can't be rebuilt into an editable solid. Anything that claims to convert STL back to STEP is just wrapping the triangles in a STEP shell — it opens in CAD but isn't a real parametric part.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/stp-to-stl/",
      title: "STP → STL",
      desc: "Same converter, if your file uses the .stp extension",
    },
    {
      href: "/step-viewer/",
      title: "STEP Viewer",
      desc: "Just want to look at it? Open the CAD file without converting",
    },
    {
      href: "/step-to-obj/",
      title: "STEP → OBJ",
      desc: "Same CAD import, exported as a Wavefront OBJ mesh",
    },
    {
      href: "/iges-to-stl/",
      title: "IGES → STL",
      desc: "Convert the other common CAD exchange format",
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
          { name: "STEP to STL", url: URL },
        ])}
      />
      <ConverterPage from="step" to="stl" content={CONTENT} />
    </>
  );
}
