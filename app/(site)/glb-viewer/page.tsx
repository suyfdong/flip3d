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
  "GLB Viewer Online — Open .GLB Files on Windows 11 & Mac, Free | glTF Viewer";
const description =
  "Open .glb and .gltf files online with their textures, materials and animations — no 3D Viewer app needed on Windows 11 or Mac. Free, 100% local, no upload.";

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
    "Drop a .glb or .gltf file to see it with its own textures and materials, play its animations, hide or isolate parts, and measure it. Works the same on Windows 11, Mac and Linux — free, instant, and the file never leaves your browser.",
  about: [
    "Got a .glb file and nothing that opens it? This page is the whole answer — no app, no account, no upload.",
    "This is the fallback a lot of people land on after Windows 11 dropped the built-in 3D Viewer app that used to preview .glb files. An online GLB viewer needs no install and no admin rights, so it also works on locked-down work machines.",
    "Views GLB and glTF 2.0 — the standard format for web, AR, game and AI 3D-generator output. Textures and PBR materials (metal, roughness) are shown as authored, with image-based lighting so metallic surfaces don't render black; animation clips play with a pause / clip picker, and the parts panel lists the model's nodes.",
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
      a: "Windows 10 shipped a 3D Viewer app that previewed .glb and .fbx, but it isn't part of a fresh Windows 11 install and Microsoft has deprecated it, so you can't count on having it. This page does the same job in any browser — drop the .glb in, no install and no admin rights needed, which also makes it work on locked-down work PCs.",
    },
    {
      q: "How do I view GLB files on Windows 11?",
      a: "Open this page in Edge or Chrome and drag the .glb from File Explorer into the box above. It renders straight away with textures and animations — nothing to install from the Store, and nothing is uploaded.",
    },
    {
      q: "Does the viewer show textures and play animations?",
      a: "Yes. Embedded textures and PBR materials are kept exactly as stored in the GLB, and if the file contains animation clips the first one plays automatically, with pause and a clip picker in the corner. Models that have no material assigned are shown in a neutral blue.",
    },
    {
      q: "Can I open GLB files from AI 3D generators?",
      a: "Yes. Image-to-3D and text-to-3D tools usually export textured .glb files; drop one here to check the mesh and texture before you print or edit it, and use the GLB to STL converter when you need a printable mesh.",
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
