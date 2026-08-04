import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/iges-viewer/`;
const title =
  "Online IGES Viewer — Free, No Signup | View .IGS & .IGES CAD Files";
const description =
  "Open and view IGES files online in your browser. Rotate and zoom any .igs or .iges CAD model — free, instant, 100% local. No CAD software, no upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online IGES Viewer — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online IGES Viewer — Free",
    description: "View .igs / .iges CAD files in your browser. No install, no signup.",
  },
};

const config: ViewerConfig = {
  format: "iges",
  formatLabel: "IGES",
  accept: [".iges", ".igs"],
  eyebrow: "IGES · IGS · CAD Viewer",
  heading: "Online IGES Viewer",
  intro:
    "Drop an .igs or .iges file to open it in a fast 3D viewer — drag to rotate, scroll to zoom, and inspect the CAD model. Free, instant, and 100% local: no CAD licence and no upload.",
  about: [
    "Opens IGES (.igs / .iges) — the legacy neutral CAD exchange format still used for supplier parts, moulds and older machine-shop drawings.",
    "The surfaces are tessellated in your browser by an OpenCascade WASM engine, so the first file spends a few seconds loading the engine, then later files are instant.",
    "Everything runs on your device. Nothing is uploaded, which matters when the part is covered by an NDA.",
    "IGES is a surface format, so imported models are sometimes not watertight — run the result through the 3D Print Checker before printing it.",
    "Convert the IGES to STL, OBJ, GLB, 3MF or PLY below.",
  ],
  faq: [
    {
      q: "How do I open an IGES file online?",
      a: "Drop your .igs or .iges file into the box above. It's tessellated and rendered right in the browser — drag to rotate, scroll to zoom. No CAD software needed.",
    },
    {
      q: "Is .igs the same as .iges?",
      a: "Yes — the same format with a shortened extension. This viewer accepts both.",
    },
    {
      q: "Is this IGES viewer free?",
      a: "Yes. Free, no signup, no watermark, and no file-size limit beyond 200MB.",
    },
    {
      q: "Is my CAD file uploaded to a server?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "My IGES model looks like it has gaps — why?",
      a: "IGES stores trimmed surfaces rather than a stitched solid, so exports often have small gaps between faces. That's a property of the file, not the viewer. If you plan to print it, convert to STL and check it with the 3D Print Checker or STL Repair.",
    },
    {
      q: "Can I convert IGES to STL here?",
      a: "Yes. Flip3D converts IGES to STL, OBJ, GLB, 3MF and PLY in the browser. IGES is read-only — there's no IGES export.",
    },
  ],
  links: [
    {
      href: "/iges-to-stl/",
      title: "IGES → STL",
      desc: "Convert this CAD file to a printable STL",
    },
    {
      href: "/iges-to-obj/",
      title: "IGES → OBJ",
      desc: "Convert to an editable OBJ mesh",
    },
    {
      href: "/tools/print-checker/",
      title: "3D Print Checker",
      desc: "Check watertightness before printing it",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Online IGES Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "IGES Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
