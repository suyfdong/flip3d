import type { Metadata } from "next";
import MeshCompressTool from "@/components/MeshCompressTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/tools/3d-model-compressor/`;
const title = "3D Model Compressor — Reduce STL, OBJ & GLB File Size Free Online";
const description =
  "Compress 3D models in your browser: reduce the polygon count of STL, OBJ, GLB, 3MF or PLY files, see the result live, keep textures and shape. Free, no upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "3D Model Compressor — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "3D Model Compressor — Reduce STL / OBJ / GLB Size",
    description: "Cut the triangle count, keep the shape. Free, in your browser.",
  },
};

const ABOUT = [
  "Most oversized 3D files aren't big because of what they show — they're big because they carry far more triangles than anyone can see or print. A photogrammetry scan, an AI-generated model or an STL exported at maximum resolution can easily run to millions of faces. This compressor removes the ones that don't change the shape: flat areas lose almost everything, curves keep what they need.",
  "Drag the slider (or pick 50%, 25%, 10%) and the model re-simplifies live, with an optional wireframe so you can see the triangle density. The panel shows the triangle count before and after, the exact size of the file you'll download, and the maximum deviation from the original surface — so you know whether the change is a hundredth of a millimetre or something you'd notice in a print.",
  "It keeps what matters per format. Closed, printable STL and 3MF models stay closed. Textured GLB models keep their UVs, materials and vertex colours, texture seams stay stitched, and you can cap texture size, which is often most of a GLB's weight. OBJ output is written with sensible precision instead of 17-digit coordinates, which on its own makes an OBJ file noticeably smaller. Point-cloud PLY scans are thinned evenly.",
  "Under the hood it uses meshoptimizer's quadric-error simplifier — the same library game engines and glTF pipelines use — compiled to WebAssembly and run on your machine. Nothing is uploaded.",
];

const STEPS = [
  { title: "Drop your file", body: "STL, OBJ, GLB/glTF, 3MF and PLY open directly; STEP, IGES, FBX and DAE open too and save as a mesh format." },
  { title: "Choose how many triangles to keep", body: "Start at 50%. For prints, 25% is usually invisible on anything but tiny parts; for web or AR, 10% or less is common. Watch the max deviation readout." },
  { title: "Pick the output format", body: "Keep the same format, or switch — GLB keeps textures, STL and 3MF are what slicers want, OBJ and PLY are the most widely readable." },
  { title: "Download", body: "The file name gets the percentage appended, so the original is never overwritten." },
];

const FAQ = [
  {
    q: "How do I reduce the file size of an STL?",
    a: "Drop the STL above, lower the triangle percentage until the max deviation is acceptable (usually well under 0.1 mm at 25–50%), and download. An ASCII STL also shrinks about 5× just by being saved as binary, which this tool always does.",
  },
  {
    q: "Will compressing change the shape of my model?",
    a: "Slightly, and the tool tells you how much: the max deviation is the furthest any part of the new surface moved from the original. Flat faces barely change at any setting; fine detail and small text are the first to soften at very low percentages.",
  },
  {
    q: "Does it keep textures and colours on a GLB?",
    a: "Yes. Only triangles are removed — the vertices that remain keep their UVs, normals, vertex colours and skin weights, and texture seams are held together so nothing tears. You can also cap the texture size, which often saves more than the geometry.",
  },
  {
    q: "Is the result still printable?",
    a: "A watertight model stays watertight — the simplifier never opens holes in a closed surface. For peace of mind, run the result through the 3D Print Checker.",
  },
  {
    q: "Can I use it as an OBJ file shrinker?",
    a: "Yes. Besides reducing triangles, OBJ output is written with six decimal places instead of the 15–17 digits many exporters use, so even at 100% an OBJ usually comes out smaller. Materials (.mtl) and textures aren't written for OBJ — use GLB if you need them.",
  },
  {
    q: "What's the difference between this and Draco compression?",
    a: "Draco and meshopt compression encode the same triangles more compactly and need a decoder to read. Reducing triangles makes the model itself lighter, so the file is smaller in every format and faster to slice, render and edit. They stack — you can Draco-compress the result afterwards.",
  },
  {
    q: "Why didn't it reach the exact percentage I asked for?",
    a: "Some parts can't go that low without breaking — a tiny part may already be at its minimum, and with \"Keep open edges exact\" the outline can't be simplified. The panel says when that happens.",
  },
  {
    q: "Is there a file-size limit? Is my model uploaded?",
    a: "No upload at all — it runs in your browser, so the only limit is your device's memory. Files of a few million triangles work on a typical laptop.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={softwareAppSchema({ name: "3D Model Compressor", description, url: URL })} />
      <MeshCompressTool />
      <SeoFaqSection
        crumbName="3D Model Compressor"
        crumbUrl={URL}
        aboutTitle="Compressing a 3D model"
        about={ABOUT}
        stepsTitle="How to compress a 3D model"
        steps={STEPS}
        faq={FAQ}
        related={[
          { href: "/tools/print-checker/", title: "3D Print Checker", desc: "Confirm the simplified model is still printable" },
          { href: "/tools/stl-repair/", title: "STL Repair", desc: "Fix holes and bad edges first" },
          { href: "/tools/stl-editor/", title: "STL Editor", desc: "Resize or reorient the result" },
          { href: "/glb-viewer/", title: "GLB Viewer", desc: "Check a textured model after compressing" },
        ]}
      />
    </>
  );
}
