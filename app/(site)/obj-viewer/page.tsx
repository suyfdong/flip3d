import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/obj-viewer/`;
const title = "Online OBJ Viewer — Free, No Signup | View .OBJ Files in Browser";
const description =
  "Open and view Wavefront OBJ files online in your browser. Drag to rotate, zoom and inspect any .obj model — free, instant, 100% local. No upload, no signup, nothing installed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online OBJ Viewer — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online OBJ Viewer — Free",
    description: "View Wavefront .obj files in your browser. No upload, no signup.",
  },
};

const config: ViewerConfig = {
  format: "obj",
  formatLabel: "OBJ",
  accept: [".obj"],
  eyebrow: "OBJ · 3D Viewer",
  heading: "Online OBJ Viewer",
  intro:
    "Drop a Wavefront .obj file to open it in a fast 3D viewer — drag to rotate, scroll to zoom, and inspect the geometry. Free, instant, and 100% local: your file never leaves the browser.",
  about: [
    "Views Wavefront OBJ geometry — the widely used mesh format exported by Blender, Maya, ZBrush and most 3D tools.",
    "Everything runs on your device with WebGL. There's no upload, no account, and no file-size paywall.",
    "OBJ stores geometry; color and texture live in a separate .mtl + image files. The viewer renders the shape in a single shaded material, so materials aren't shown.",
    "Need it in another format? Convert the OBJ to STL, GLB or 3MF below.",
  ],
  faq: [
    {
      q: "How do I open an OBJ file online?",
      a: "Drop your .obj file into the box above. It opens instantly in a 3D viewer — drag to rotate, scroll to zoom. Nothing is uploaded; the file is read locally in your browser.",
    },
    {
      q: "Is this OBJ viewer free?",
      a: "Yes. It's completely free with no signup, no watermark, and no file-size limit beyond 200MB. The model is rendered locally with WebGL.",
    },
    {
      q: "Why doesn't my OBJ show its textures or colors?",
      a: "An .obj file stores only geometry. Colors and textures are defined in a companion .mtl file plus image maps, which a single uploaded .obj doesn't include, so the model renders in one shaded color.",
    },
    {
      q: "Is my OBJ file uploaded anywhere?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "Can I convert the OBJ after viewing it?",
      a: "Yes. Flip3D converts OBJ to STL, GLB, 3MF and PLY — all in the browser. The convert links are next to and below the viewer.",
    },
  ],
  links: [
    {
      href: "/obj-to-stl/",
      title: "OBJ → STL",
      desc: "Convert this OBJ to a printable STL",
    },
    {
      href: "/obj-to-glb/",
      title: "OBJ → GLB",
      desc: "Convert to GLB for web & AR",
    },
    {
      href: "/tools/print-checker/",
      title: "3D Print Checker",
      desc: "Check printability before slicing",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Online OBJ Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "OBJ Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
