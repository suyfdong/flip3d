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
const title =
  "GLB Viewer Online — Free .GLB File Viewer & glTF Viewer | No Signup";
const description =
  "Free online GLB viewer and .glb file viewer. Open a .glb or .gltf file and view the 3D model in your browser — rotate, zoom, inspect. Works after Windows 11 removed the built-in 3D Viewer. 100% local, no upload, no signup.";

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
  eyebrow: "GLB · glTF · Online File Viewer",
  heading: "Online GLB & glTF Viewer",
  intro:
    "Drop a .glb or .gltf file to open it in a fast 3D viewer — drag to rotate, scroll to zoom, and inspect the model. Free, instant, and 100% local: your file never leaves the browser.",
  about: [
    "Got a .glb file and nothing that opens it? This page is the whole answer — no app, no account, no upload.",
    "This is the fallback a lot of people land on after Windows 11 dropped the built-in 3D Viewer app that used to preview .glb files. An online GLB viewer needs no install and no admin rights, so it also works on locked-down work machines.",
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
      q: "What program opens a .glb file?",
      a: "You don't need one — this page opens .glb files directly in the browser. On the desktop, Windows 3D Viewer, Blender and most game engines import GLB too, but they all require an install; this doesn't.",
    },
    {
      q: "Does Windows 10 or 11 have a built-in 3D viewer for .glb files?",
      a: "Windows 10 shipped a 3D Viewer app that previewed .glb and .fbx, but Microsoft removed it from the default Windows 11 install, so a fresh Windows 11 machine has nothing that opens a .glb. You can still install 3D Viewer from the Microsoft Store, or just drop the file into this page — no install, no admin rights needed.",
    },
    {
      q: "Can I view a whole folder of .glb files at once?",
      a: "Not in one go — this viewer opens one model at a time so it can render at full quality without loading everything into memory. For a quick pass over a folder, open each file in turn; each one loads in about a second because there is no upload step.",
    },
    {
      q: "Why won't my .glb file open by double-clicking it?",
      a: "GLB isn't registered to an app on most systems, so double-clicking does nothing or opens a text editor. Drag the file into the box above instead and it renders immediately.",
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
