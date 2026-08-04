import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/dae-viewer/`;
const title =
  "Online DAE Viewer — Free, No Signup | View Collada .DAE Files in Browser";
const description =
  "Open and view DAE (Collada) files online in your browser. Drag to rotate, zoom and inspect any .dae model — free, instant, 100% local. No upload, no signup, nothing installed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online DAE (Collada) Viewer — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online DAE Viewer — Free",
    description: "View .dae Collada files in your browser. No upload, no signup.",
  },
};

const config: ViewerConfig = {
  format: "dae",
  formatLabel: "DAE",
  accept: [".dae"],
  eyebrow: "DAE · Collada · 3D Viewer",
  heading: "Online DAE Viewer",
  intro:
    "Drop a .dae file to open it in a fast 3D viewer — drag to rotate, scroll to zoom, and inspect the model. Free, instant, and 100% local: your file never leaves the browser.",
  about: [
    "Views Collada (.dae) — the XML interchange format exported by SketchUp, Blender, Maya and older AR/asset pipelines.",
    "Everything runs on your device with WebGL. There's no upload, no account, and no file-size paywall.",
    "A .dae that references external texture images will render its geometry, since those side files aren't part of a single upload.",
    "Need the model somewhere else? Convert the DAE to OBJ, STL, GLB, 3MF or PLY below.",
  ],
  faq: [
    {
      q: "How do I open a DAE file online?",
      a: "Drop your .dae file into the box above. It opens instantly in a 3D viewer — drag to rotate, scroll to zoom. Nothing is uploaded; the file is read locally in your browser.",
    },
    {
      q: "Is this Collada viewer free?",
      a: "Yes. Completely free with no signup, no watermark, and no file-size limit beyond 200MB. The model renders locally with WebGL.",
    },
    {
      q: "Does it play DAE animations?",
      a: "No. This is a geometry viewer — it renders the meshes so you can inspect the shape. Skeletal animation and rig playback aren't supported.",
    },
    {
      q: "Is my .dae file uploaded anywhere?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "Can I convert the DAE to another format?",
      a: "Yes. Flip3D converts DAE to OBJ, STL, GLB, 3MF and PLY in the browser. DAE is read-only (there's no Collada export), but every mesh export is available.",
    },
  ],
  links: [
    {
      href: "/dae-to-obj/",
      title: "DAE → OBJ",
      desc: "Convert this Collada file to an editable OBJ",
    },
    {
      href: "/dae-to-glb/",
      title: "DAE → GLB",
      desc: "Convert to GLB for web & AR",
    },
    {
      href: "/dae-to-stl/",
      title: "DAE → STL",
      desc: "Convert to a printable STL",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Online DAE Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "DAE Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
