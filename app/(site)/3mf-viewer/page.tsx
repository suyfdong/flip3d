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
const title = "3MF Viewer — Open Bambu Studio & PrusaSlicer .3mf Files Online";
const description =
  "Open Bambu Studio, Orca & PrusaSlicer .3mf files online: objects in filament colors, plates, printer, thumbnail and measuring. Free, 100% local.";

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
    "Drop a .3mf from Bambu Studio, Orca, PrusaSlicer or Cura. Every object shows in its assigned filament color, with the plates, printer, filament list and slicer thumbnail beside it — and you can measure parts. Free, and the file never leaves your browser.",
  about: [
    "Opens 3MF files — the 3D Manufacturing Format that Bambu Studio, PrusaSlicer, Cura and Windows 3D tools use. A .3mf is a zip package holding the mesh plus print metadata.",
    "Everything runs on your device with WebGL. There's no upload, no account, and no file-size paywall.",
    "Multi-part Bambu Studio / Orca projects store each object in a separate internal file (the 3MF production extension). The viewer merges them before drawing, so the whole project shows — not just the first part.",
    "Slicer projects keep color per filament slot, not in the mesh. The viewer reads the project's filament list and tints each object with the filament it's assigned to; colors stored in the 3MF itself (materials / color groups) are shown as-is. Per-face color painting isn't drawn yet.",
    "The side panel lists the slicer and version, printer model, units, plate and object counts, filaments, and the embedded plate thumbnail. Tick objects on and off, or isolate one, from the parts list. Use Measure to click two points and read the distance in the file's units.",
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
      q: "What program opens a .3mf file?",
      a: "Bambu Studio, PrusaSlicer, Cura and Windows 3D Builder open 3MF — all of them installs, and slicers take a while to boot just to peek at a model. This 3MF file viewer opens it in the browser instead.",
    },
    {
      q: "Is this 3MF viewer free?",
      a: "Yes. It's completely free with no signup, no watermark, and no file-size limit beyond 200MB. The model renders locally with WebGL.",
    },
    {
      q: "Can it open multi-part Bambu Studio and MakerWorld 3MF files?",
      a: "Yes. Bambu Studio and Orca save each object in its own internal file using the 3MF production extension, which many viewers only half-read. This viewer merges those parts before rendering, so the full project appears. To open the same file in PrusaSlicer, run it through the Bambu → Prusa tool.",
    },
    {
      q: "Does the 3MF viewer show filament colors?",
      a: "Yes, at the object level. Bambu, Orca and PrusaSlicer projects list their filaments and which slot each object prints with; the viewer tints every object with that filament color and shows the filament list (color and type) in the side panel. Colors written into the mesh itself are shown as-is. Per-face painted colors are not drawn yet.",
    },
    {
      q: "Can I see the plates, printer and thumbnail inside a 3MF?",
      a: "Yes. The File details panel shows the slicer that saved it, the printer model, units, how many plates and objects it has, and the plate thumbnail the slicer embedded — without opening a slicer.",
    },
    {
      q: "Can I measure a model in a 3MF file?",
      a: "Yes. Click Measure, then click two points on the model to get the straight-line distance plus the X/Y/Z offsets, in the units stored in the 3MF (usually millimeters).",
    },
    {
      q: "Is this a 3MF file opener for Windows and Mac?",
      a: "It works in any modern browser on Windows, macOS, Linux or ChromeOS, so there's nothing to install — open the page, drop the .3mf, and it reads the file locally.",
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
