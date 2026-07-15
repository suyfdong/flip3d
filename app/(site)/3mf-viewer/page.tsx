import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/3mf-viewer/`;
const title = "Online 3MF Viewer — Open .3mf Files Free | No Signup";
const description =
  "Open and view 3MF files online in your browser. Drag to rotate, zoom and inspect any .3mf model from Bambu Studio, PrusaSlicer or Cura — free, instant, 100% local. No upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online 3MF Viewer — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online 3MF Viewer — Free",
    description: "Open and view .3mf files in your browser. No upload, no signup.",
  },
};

const config: ViewerConfig = {
  format: "3mf",
  formatLabel: "3MF",
  accept: [".3mf"],
  eyebrow: "3MF · 3D Viewer",
  heading: "Online 3MF Viewer",
  intro:
    "Drop a .3mf file to open it in a fast 3D viewer — drag to rotate, scroll to zoom, and inspect the model. Free, instant, and 100% local: your file never leaves the browser.",
  about: [
    "Opens 3MF files — the 3D Manufacturing Format that Bambu Studio, PrusaSlicer, Cura and Windows 3D tools use. A .3mf is a zip package holding the mesh plus print metadata.",
    "Everything runs on your device with WebGL. There's no upload, no account, and no file-size paywall.",
    "The viewer renders the model geometry. Some slicer 3MFs (especially multi-plate Bambu files using the production extension) split geometry across internal parts and may show only some of it — the Bambu → Prusa tool flattens those into a single standard 3MF.",
    "Need to slice or edit it elsewhere? Convert the 3MF to STL or OBJ, or re-pack it for another slicer, using the links by the viewer.",
  ],
  faq: [
    {
      q: "How do I open a 3MF file online?",
      a: "Drop your .3mf file into the box above. It opens instantly in a 3D viewer — drag to rotate, scroll to zoom. Nothing is uploaded; the file is read locally in your browser.",
    },
    {
      q: "What is a 3MF file?",
      a: "3MF (3D Manufacturing Format) is a modern 3D-printing file that bundles the model mesh together with print settings and metadata in a single zip-based package. Slicers like Bambu Studio and PrusaSlicer save projects as .3mf.",
    },
    {
      q: "Is this 3MF viewer free?",
      a: "Yes. It's completely free with no signup, no watermark, and no file-size limit beyond 200MB. The model renders locally with WebGL.",
    },
    {
      q: "Why does my Bambu 3MF look incomplete?",
      a: "Some Bambu Studio 3MFs use the production extension, which stores geometry across multiple internal files. A plain viewer may render only part of it. Run it through the Bambu → Prusa converter to flatten it into a single standard 3MF that opens everywhere.",
    },
    {
      q: "Is my 3MF file uploaded anywhere?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "Can I convert the 3MF to STL after viewing it?",
      a: "Yes. Flip3D converts 3MF to STL, OBJ, GLB and PLY in the browser. The convert links are next to and below the viewer.",
    },
  ],
  links: [
    {
      href: "/3mf-to-stl/",
      title: "3MF → STL",
      desc: "Convert this 3MF to a printable STL",
    },
    {
      href: "/tools/bambu-3mf-to-prusa/",
      title: "Bambu 3MF → Prusa",
      desc: "Flatten a Bambu 3MF so any slicer opens it",
    },
    {
      href: "/reference/bambu-vs-prusa/",
      title: "Bambu vs Prusa",
      desc: "How the two 3MF workflows differ",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Online 3MF Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "3MF Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
