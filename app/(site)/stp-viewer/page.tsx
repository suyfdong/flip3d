import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/stp-viewer/`;
const title =
  "Free STP File Viewer Online — No Signup | Open .STP in Your Browser";
const description =
  "Free online STP file viewer. Open a .stp CAD file in your browser, rotate and zoom it instantly — no SolidWorks, no install, no upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Free STP File Viewer Online",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free STP File Viewer — Online",
    description: "Open .stp CAD files in your browser. No install, no signup.",
  },
};

const config: ViewerConfig = {
  format: "step",
  formatLabel: "STP",
  accept: [".stp", ".step"],
  eyebrow: "STP · CAD Viewer",
  heading: "Free STP File Viewer",
  intro:
    "Someone sent you a .stp file and nothing on your machine will open it? Drop it here. It renders in seconds — no SolidWorks licence, no install, no account, and the file never leaves your browser.",
  about: [
    "Opens .stp files (and the identical .step extension) exported by SolidWorks, Fusion 360, Inventor, CATIA, Creo and Onshape.",
    "No CAD seat required — the solid is tessellated locally by an OpenCascade WASM engine, so a supplier part can be reviewed on any laptop.",
    "Nothing is uploaded, so confidential or NDA-covered parts stay on your machine.",
    "Geometry only: the viewer shows the shape, not the feature history, dimensions or tolerances.",
    "Once you can see it, convert the .stp to STL for printing or to OBJ/GLB for downstream tools below.",
  ],
  faq: [
    {
      q: "How do I open a .stp file without CAD software?",
      a: "Drop the .stp file into the box above. Flip3D tessellates and renders it in the browser — drag to rotate, scroll to zoom. No SolidWorks, Fusion or Inventor licence needed.",
    },
    {
      q: "Is this STP file viewer really free?",
      a: "Yes — free, no signup, no watermark, no trial window. Files up to 200MB open with no paid tier.",
    },
    {
      q: "Is .stp the same as .step?",
      a: "Yes. Both are the ISO 10303 STEP exchange format; the three-letter .stp exists because older Windows tools expected three-character extensions. This viewer accepts either.",
    },
    {
      q: "Does the .stp file get uploaded anywhere?",
      a: "No. There's no server and no upload — the file is read and rendered on your own device, then discarded when you close the tab.",
    },
    {
      q: "Can I measure or edit the part here?",
      a: "Not yet — this is a viewer. You can convert the .stp to a mesh and then resize it in the free STL Editor, or check it for printability in the 3D Print Checker.",
    },
    {
      q: "How do I turn a .stp file into an STL?",
      a: "Use the STP to STL converter — same engine, but it exports a printable mesh. It runs in the browser too, so nothing is uploaded.",
    },
  ],
  links: [
    {
      href: "/stp-to-stl/",
      title: "STP → STL",
      desc: "Convert this .stp to a printable STL",
    },
    {
      href: "/step-to-glb/",
      title: "STEP → GLB",
      desc: "Convert to GLB for web & AR",
    },
    {
      href: "/step-viewer/",
      title: "STEP Viewer",
      desc: "Same viewer, .step extension",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Free STP File Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "STP Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
