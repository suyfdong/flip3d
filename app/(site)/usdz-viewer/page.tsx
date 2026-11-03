import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema, softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/usdz-viewer/`;
const title = "USDZ Viewer — Free Online .USDZ File Viewer for Windows, Mac & Linux";
const description =
  "Open USDZ files online on any computer — Windows, Linux or Mac. View Apple AR models with textures, inspect parts, measure, and convert to GLB, OBJ or STL. Free, no upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: { title: "USDZ Viewer — Free, 100% Local", description, url: URL, siteName: "Flip3D", locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: "USDZ Viewer — Free, 100% Local", description: "Open .usdz files on Windows, Mac or Linux. No upload, no signup." },
};

const config: ViewerConfig = {
  format: "usdz",
  formatLabel: "USDZ",
  accept: [".usdz"],
  eyebrow: "USDZ · Apple AR · 3D Viewer",
  heading: "USDZ File Viewer",
  intro:
    "Open a .usdz file on any computer — Windows, Linux or Mac, no Xcode or Reality Composer needed. Drag to rotate, check the textures and size, then convert it if you need another format. Free and 100% local.",
  about: [
    "USDZ is the format behind Apple's AR Quick Look: iPhone and iPad open it natively, but Windows and most browsers don't. This viewer reads it directly in the browser — both binary (USDC) and text (USDA) packages — with their materials and textures.",
    "The side panel lists the parts, so you can hide or isolate pieces, and the measure and section tools work on the model as they do on any other format here.",
    "Reality Composer extras — behaviours, physics, anchors, multiple scenes — aren't part of the geometry, so they aren't shown. What you see is the model itself.",
    "Need the model in Blender, a slicer or on the web? Convert the USDZ to GLB, OBJ, STL, 3MF or PLY below.",
  ],
  faq: [
    {
      q: "How do I open a USDZ file on Windows?",
      a: "Drop it into the box above. Windows has no built-in USDZ viewer, but this page opens it in the browser with its textures — no install, no Apple account.",
    },
    {
      q: "Is this USDZ viewer free?",
      a: "Yes. Free, no signup and no watermark. The file is read on your own device.",
    },
    {
      q: "Can I convert USDZ to OBJ, STL or GLB?",
      a: "Yes — use the links below. GLB keeps the textures and is the best choice for Blender, three.js and Android AR; OBJ and STL keep the shape for CAD and 3D printing.",
    },
    {
      q: "Why does my model look different from AR Quick Look?",
      a: "AR Quick Look adds real-world lighting and can play Reality Composer behaviours. Here the model is shown with neutral studio lighting and no behaviours, which is closer to what you'll get after converting it.",
    },
    {
      q: "Is my USDZ file uploaded?",
      a: "No. There's no server step — the file is unpacked and rendered entirely in your browser.",
    },
  ],
  links: [
    { href: "/usdz-to-glb/", title: "USDZ → GLB", desc: "Keep the textures, open in Blender or on Android" },
    { href: "/usdz-to-obj/", title: "USDZ → OBJ", desc: "Editable mesh for any 3D app" },
    { href: "/usdz-to-stl/", title: "USDZ → STL", desc: "3D-print the model" },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd data={softwareAppSchema({ name: "USDZ File Viewer", description, url: URL })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "USDZ File Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
