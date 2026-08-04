import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/step-viewer/`;
const title =
  "Online STEP Viewer — Free, No Signup | View STEP & STP CAD Files";
const description =
  "Open and view STEP files online in your browser. Drag to rotate, zoom and inspect any .step or .stp CAD model — free, instant, 100% local. No upload, no signup, no CAD software.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online STEP Viewer — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online STEP Viewer — Free",
    description: "View .step / .stp CAD files in your browser. No upload, no signup.",
  },
};

const config: ViewerConfig = {
  format: "step",
  formatLabel: "STEP",
  accept: [".step", ".stp"],
  eyebrow: "STEP · STP · CAD Viewer",
  heading: "Online STEP Viewer",
  intro:
    "Drop a .step or .stp file to open it in a fast 3D viewer — drag to rotate, scroll to zoom, and inspect the CAD model. Free, instant, and 100% local: no CAD software and no upload.",
  about: [
    "Opens STEP (AP203 / AP214 / AP242) and the .stp extension — the neutral CAD exchange format written by SolidWorks, Fusion 360, CATIA, Inventor and Onshape.",
    "The B-rep solid is tessellated in your browser by an OpenCascade WASM engine, so the first file takes a few seconds to load the engine — after that it's instant.",
    "Everything runs on your device. There's no upload, no account, and no file-size paywall — useful when the CAD file is under NDA.",
    "This is a geometry viewer: it shows the shape, not the feature tree, dimensions or PMI annotations.",
    "Need the model elsewhere? Convert the STEP to STL, OBJ, GLB, 3MF or PLY below.",
  ],
  faq: [
    {
      q: "How do I open a STEP file online?",
      a: "Drop your .step or .stp file into the box above. It's tessellated and rendered right in the browser — drag to rotate, scroll to zoom. Nothing is uploaded and no CAD software is needed.",
    },
    {
      q: "Is this STEP viewer free?",
      a: "Yes. Completely free with no signup, no watermark and no file-size limit beyond 200MB. There's no trial and no paid tier.",
    },
    {
      q: "What's the difference between .step and .stp?",
      a: "Nothing — they're the same ISO 10303 format with two extensions. Older Windows software preferred the three-letter .stp. This viewer accepts both.",
    },
    {
      q: "Is my CAD file uploaded to a server?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored — which is why it's safe for confidential parts.",
    },
    {
      q: "Why does the first STEP file take a few seconds?",
      a: "STEP is a B-rep (solid) format, so it has to be converted to triangles before it can be drawn. Flip3D loads an OpenCascade WASM engine once to do that; every file after it opens much faster.",
    },
    {
      q: "Can I convert the STEP file to STL for 3D printing?",
      a: "Yes. Flip3D converts STEP to STL, OBJ, GLB, 3MF and PLY in the browser. STEP is read-only here (there's no STEP export — mesh formats can't be turned back into real solids), but every mesh export is available. Convert links are by the viewer.",
    },
  ],
  links: [
    {
      href: "/step-to-stl/",
      title: "STEP → STL",
      desc: "Convert this CAD file to a printable STL",
    },
    {
      href: "/step-to-obj/",
      title: "STEP → OBJ",
      desc: "Convert to an editable OBJ mesh",
    },
    {
      href: "/stp-viewer/",
      title: "STP Viewer",
      desc: "Same viewer, .stp extension",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Online STEP Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "STEP Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
