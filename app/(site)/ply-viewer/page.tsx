import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/ply-viewer/`;
const title = "PLY Viewer — Free Online .PLY File Viewer | No Signup";
const description =
  "Free online PLY file viewer. Open a .ply scan or mesh and view it in your browser — rotate, zoom, inspect. Instant, 100% local, no upload, no signup, nothing installed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online PLY Viewer — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online PLY Viewer — Free",
    description: "View .ply files in your browser. No upload, no signup.",
  },
};

const config: ViewerConfig = {
  format: "ply",
  formatLabel: "PLY",
  accept: [".ply"],
  eyebrow: "PLY · 3D Viewer",
  heading: "Online PLY Viewer",
  intro:
    "Drop a .ply file to open it in a fast 3D viewer — drag to rotate, scroll to zoom, and inspect the mesh. Free, instant, and 100% local: your file never leaves the browser.",
  about: [
    "Views PLY (Stanford Polygon) files — the format 3D scanners and photogrammetry tools like Meshroom and Polycam export.",
    "Handles both binary and ASCII PLY. Everything runs on your device with WebGL — no upload, no account, no file-size paywall.",
    "The mesh renders in a single shaded material so you can read its shape clearly.",
    "Need a printable or portable file? Convert the PLY to STL, OBJ or GLB below.",
  ],
  faq: [
    {
      q: "How do I open a PLY file online?",
      a: "Drop your .ply file into the box above. It opens instantly in a 3D viewer — drag to rotate, scroll to zoom. Nothing is uploaded; the file is read locally in your browser.",
    },
    {
      q: "What opens a .ply file?",
      a: "MeshLab, CloudCompare and Blender read PLY, but each needs an install and a slow first launch. This PLY file viewer opens the scan straight in the browser instead.",
    },
    {
      q: "Is this PLY viewer free?",
      a: "Yes. It's completely free with no signup, no watermark, and no file-size limit beyond 200MB. The model renders locally with WebGL.",
    },
    {
      q: "Does it support binary and ASCII PLY?",
      a: "Yes. Both PLY encodings load. PLY files from 3D scanners and photogrammetry (often binary) open the same way as ASCII exports.",
    },
    {
      q: "Is my PLY file uploaded anywhere?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "Can I convert the PLY to STL?",
      a: "Yes. Flip3D converts PLY to STL, OBJ, GLB and 3MF in the browser. The convert links are next to and below the viewer.",
    },
  ],
  links: [
    {
      href: "/ply-to-stl/",
      title: "PLY → STL",
      desc: "Convert this PLY to a printable STL",
    },
    {
      href: "/ply-to-obj/",
      title: "PLY → OBJ",
      desc: "Convert to OBJ for editing",
    },
    {
      href: "/tools/print-checker/",
      title: "3D Print Checker",
      desc: "Check scan meshes for printability",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Online PLY Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "PLY Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
