import type { Metadata } from "next";
import ConverterPage, { type ConverterContent } from "@/components/ConverterPage";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/stp-to-stl/`;
const title = "STP to STL Converter — Free Online | No Signup Required";
const description =
  "Convert STP / STEP to STL in your browser — free, instant, 100% local. Reads CAD solids with OpenCASCADE and tessellates them to a slicer-ready STL. No upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "STP to STL — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STP to STL — Free Online",
    description: "Convert .stp / .step CAD files to STL in your browser. 100% local.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert an STP file to STL?",
    a: "Drop your .stp file into the box above, preview it in the 3D viewer, then click Convert & Download .stl. It's read and tessellated entirely in your browser — nothing is uploaded.",
  },
  {
    q: "Is STP the same as STEP?",
    a: "Yes. .stp and .step are two extensions for the same ISO 10303 CAD format. This converter accepts both and produces identical results.",
  },
  {
    q: "Is the STP to STL converter free?",
    a: "Yes. It's free with no signup, no watermark, and no file-size paywall. Flip3D runs the OpenCASCADE engine locally in your browser.",
  },
  {
    q: "What quality is the converted mesh?",
    a: "The CAD solid is tessellated automatically into a detailed triangle mesh suitable for slicing and 3D printing. STL approximates the exact STP surfaces, so tight curves become many small facets.",
  },
  {
    q: "Is my STP file uploaded anywhere?",
    a: "No. There is no upload and no server. The WebAssembly OpenCASCADE reader runs on your device, and nothing is stored.",
  },
  {
    q: "Can I convert STL back to STP?",
    a: "No, and we won't pretend to. A triangle mesh can't be rebuilt into an editable CAD solid — the exact surfaces are gone once a model is tessellated. Tools that output an \"STP\" from an STL just wrap the triangles in a STEP shell; it opens but isn't a real parametric part.",
  },
];

const CONTENT: ConverterContent = {
  fromLabel: "STP",
  lede:
    "Drop a .stp file and download a clean STL in seconds. Reads CAD solids with OpenCASCADE and tessellates them for any slicer. Runs entirely in your browser — no upload, no signup, no watermark.",
  aboutTitle: "Converting an STP / STEP file to STL",
  about: [
    "STP (.stp, also written .step) is a precise B-rep CAD format — the ISO 10303 standard — that stores exact analytic surfaces and solids. STL is a triangle-mesh approximation. This converter reads your STP with OpenCASCADE compiled to WebAssembly and tessellates the solid into a standard STL that any slicer or mesh tool accepts.",
    ".stp and .step are the same format under two extensions, so both load here and convert identically. Curved faces become many small triangles in the STL — a round hole turns into a faceted ring rather than a true cylinder. That's expected: STL has no analytic geometry, only triangles.",
    "There's no STL-to-STP here on purpose. Once a model is a mesh, the exact CAD surfaces are gone, so it can't be rebuilt into an editable solid. Anything claiming to convert STL back to STP just wraps the triangles in a STEP shell — it opens in CAD but isn't a real parametric part.",
  ],
  faq: FAQ,
  related: [
    {
      href: "/step-to-stl/",
      title: "STEP → STL",
      desc: "The same converter, framed for the .step extension",
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
          { name: "STP to STL", url: URL },
        ])}
      />
      <ConverterPage from="step" to="stl" content={CONTENT} />
    </>
  );
}
