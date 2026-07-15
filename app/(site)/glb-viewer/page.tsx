import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/glb-viewer/`;
const title = "Online GLB & glTF Viewer — Free, No Signup | View in Browser";
const description =
  "Open and view GLB / glTF files online in your browser. Drag to rotate, zoom and inspect any .glb or .gltf model — free, instant, 100% local. No upload, no signup, nothing installed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online GLB / glTF Viewer — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online GLB / glTF Viewer — Free",
    description: "View .glb / .gltf files in your browser. No upload, no signup.",
  },
};

const config: ViewerConfig = {
  format: "glb",
  formatLabel: "GLB",
  accept: [".glb", ".gltf"],
  eyebrow: "GLB · glTF · 3D Viewer",
  heading: "Online GLB & glTF Viewer",
  intro:
    "Drop a .glb or .gltf file to open it in a fast 3D viewer — drag to rotate, scroll to zoom, and inspect the model. Free, instant, and 100% local: your file never leaves the browser.",
  about: [
    "Views GLB and glTF 2.0 — the standard format for web, AR and asset pipelines. Self-contained .glb files load most reliably.",
    "Everything runs on your device with WebGL. There's no upload, no account, and no file-size paywall.",
    "A single .gltf that references external .bin or texture files may render geometry only, since those side files aren't included in one upload — .glb bundles everything and is preferred.",
    "Need it for printing or editing? Convert the GLB to STL, OBJ or 3MF below.",
  ],
  faq: [
    {
      q: "How do I open a GLB or glTF file online?",
      a: "Drop your .glb or .gltf file into the box above. It opens instantly in a 3D viewer — drag to rotate, scroll to zoom. Nothing is uploaded; the file is read locally in your browser.",
    },
    {
      q: "What's the difference between GLB and glTF here?",
      a: "GLB is the binary, self-contained version of glTF — geometry, materials and textures in one file. A .gltf is JSON that often points to separate .bin and image files. Both open here; .glb is the most reliable because everything is bundled.",
    },
    {
      q: "Is this GLB viewer free?",
      a: "Yes. It's completely free with no signup, no watermark, and no file-size limit beyond 200MB. The model renders locally with WebGL.",
    },
    {
      q: "Is my GLB file uploaded anywhere?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "Can I convert the GLB to STL for printing?",
      a: "Yes. Flip3D converts GLB to STL, OBJ, 3MF and PLY in the browser. The convert links are next to and below the viewer.",
    },
  ],
  links: [
    {
      href: "/glb-to-stl/",
      title: "GLB → STL",
      desc: "Convert this GLB to a printable STL",
    },
    {
      href: "/glb-to-obj/",
      title: "GLB → OBJ",
      desc: "Convert to OBJ for editing",
    },
    {
      href: "/gltf-to-obj/",
      title: "glTF → OBJ",
      desc: "Convert a .gltf scene to OBJ",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Online GLB & glTF Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "GLB Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
