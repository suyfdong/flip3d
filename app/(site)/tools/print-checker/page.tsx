import type { Metadata } from "next";
import PrintCheckTool from "@/components/PrintCheckTool";
import { JsonLd } from "@/components/JsonLd";
import { faqPageSchema, breadcrumbSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/tools/print-checker/`;

export const metadata: Metadata = {
  title: "3D Print Checker — Is Your STL Printable? Free Online | Flip3D",
  description:
    "Drop an STL, OBJ or 3MF and get an instant pre-flight check: watertight, manifold, size & units, overhangs, and whether it fits your print bed. Free, 100% local, no upload.",
  alternates: { canonical: URL },
  openGraph: {
    title: "3D Print Checker — Is Your STL Printable?",
    description:
      "Instant pre-flight: watertight, manifold, size, overhangs, bed fit. 100% in your browser.",
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "3D Print Checker — Free Online",
    description: "Is your STL printable? Watertight, overhangs, bed fit — checked locally.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I check if my STL is printable?",
    a: "Drop your STL (or OBJ, 3MF, STEP, etc.) into the box above. The checker runs in your browser and reports whether it's watertight and manifold, its size in millimeters, how much of the surface overhangs past 45°, and whether it fits common print beds.",
  },
  {
    q: "What does 'watertight' and 'manifold' mean?",
    a: "Watertight means the mesh has no holes — every edge is shared by two faces, so the slicer can tell inside from outside. Manifold means no edge is shared by three or more faces. Models that fail either are the most common cause of hollow prints or slicer errors. If yours fails, the report links straight to STL Repair.",
  },
  {
    q: "Is anything uploaded?",
    a: "No. The check runs entirely in your browser with three.js — your file never leaves your device, and nothing is stored.",
  },
  {
    q: "Why does it say my model is the wrong size?",
    a: "STL is unitless, and most slicers assume millimeters. If a model was exported in meters or inches it can come in 1000× too small or far too large. The checker flags anything under 1 mm or over 1 m so you can rescale before slicing.",
  },
  {
    q: "How is the overhang percentage calculated?",
    a: "It measures the share of surface area whose faces tip past 45° from vertical and point downward (excluding the base resting on the build plate). A high percentage means you'll want supports. It's an estimate to plan with, not a substitute for slicing.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(FAQ)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "3D Print Checker", url: URL },
        ])}
      />
      <PrintCheckTool />
    </>
  );
}
