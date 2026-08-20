import type { Metadata } from "next";
import StlEditorTool from "@/components/StlEditorTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/tools/stl-editor/`;
const title =
  "Free STL Editor — Edit STL Files Online | Resize, Rotate & Export";
const description =
  "Free online STL file editor. Edit STL files in your browser: resize to an exact size, fix an inch/mm mismatch, rotate to reorient, drop the part on the bed, then export. No signup, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Free STL Editor — Edit STL Files Online, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free STL Editor — Edit STL Files Online",
    description: "Resize, rotate and export STL files in your browser. No signup.",
  },
};

const ABOUT = [
  "Most people who set out to edit STL files want one of two things: the model at the right size, or the part sitting the right way up. This is a lightweight online STL file editor for exactly those two jobs. Open an STL (or OBJ, STEP, FBX, PLY, 3MF and more), then resize it to an exact dimension, scale by a percentage, or fix a units mismatch with a single inch↔mm button.",
  "Rotate in 90° steps on any axis to lay a part flat, and drop it onto the bed so the lowest point sits at z = 0 — exactly what a slicer expects. Every change updates the live dimensions readout so you can hit a target size precisely.",
  "Scaling is always uniform, so your model never gets stretched out of proportion. When you're done, export to STL, OBJ, GLB, 3MF or PLY. It all runs locally in your browser — no upload, no signup, no watermark. For deeper fixes, pair it with the STL repair tool and the 3D print checker.",
];

// The query cluster here is almost entirely question-shaped ("how to edit stl
// files", "how to modify stl file"), so the page states the actual steps.
// Operational, not an explainer.
const STEPS = [
  {
    title: "Open the STL",
    body: "Drag your .stl onto the drop zone, or click to browse. The file is read on your own device — there is no upload and no account. OBJ, STEP, STP, FBX, PLY, 3MF, GLB and DAE open here too, so you can edit a file you have not converted yet.",
  },
  {
    title: "Set the size you actually need",
    body: "Type a target length for the longest side in millimetres, or scale by percentage. If a model came out 25.4× too big or too small it was authored in inches — hit the inch↔mm button to fix it in one click. The live readout shows the exact X × Y × Z as you go.",
  },
  {
    title: "Rotate it flat and drop it on the bed",
    body: "Rotate in 90° steps on X, Y or Z to put the largest flat face down, which is usually the orientation that needs the least support. Enable drop-to-bed so the lowest point sits at z = 0 instead of floating above or sinking below the plate.",
  },
  {
    title: "Export",
    body: "Download the edited model as STL, OBJ, GLB, 3MF or PLY. The transform is baked into the geometry, so the file opens at the new size in any slicer without further scaling.",
  },
];

const FAQ = [
  {
    q: "How do I edit STL files online for free?",
    a: "Drop your .stl into the editor above, then use the panel to resize, rotate and reposition it and download the result. It is free, runs entirely in your browser, and nothing is uploaded. There is no account step and no watermark on the exported file.",
  },
  {
    q: "How do I edit an STL file without installing software?",
    a: "Use this page. It is a browser-based STL editor built on WebGL, so it works on Windows, macOS, Linux, ChromeOS and mobile with nothing to download. Heavier desktop tools like Blender or Fusion 360 can do far more, but for resizing, unit fixes and reorienting they are more setup than the job needs.",
  },
  {
    q: "Can I resize an STL to an exact size?",
    a: "Yes. Type the target size for the longest side in millimetres, or drag the scale slider by percentage. Scaling is uniform, so the proportions stay correct.",
  },
  {
    q: "My STL imported at the wrong scale (inches vs mm) — can I fix it?",
    a: "Yes. If a model was designed in inches but your slicer reads millimetres, click “inch → mm (×25.4)”. There's a reverse button too. This is one of the most common STL fixes.",
  },
  {
    q: "How do I modify an STL file's orientation for printing?",
    a: "Rotate in 90° steps on the X, Y or Z axis until the flattest face points down, then enable “drop onto the bed” so the part sits on z = 0. Good orientation usually matters more for print quality than any slicer setting.",
  },
  {
    q: "What can't this STL editor do?",
    a: "It does not sculpt, cut, boolean or remesh — it changes scale, rotation and position, then bakes that into the exported geometry. Being straight about that is deliberate: for hole filling and non-manifold repair use the STL repair tool, and for printability checks use the 3D print checker.",
  },
  {
    q: "Does it only work with STL?",
    a: "No. It opens STL, OBJ, STEP, FBX, PLY, 3MF, GLB and DAE, and exports to STL, OBJ, GLB, 3MF or PLY — so you can edit and convert in one step.",
  },
  {
    q: "Is my file uploaded to a server?",
    a: "No. There is no upload and no server. The model is edited entirely on your device, and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={softwareAppSchema({
          name: "Free Online STL Editor",
          description,
          url: URL,
        })}
      />
      <StlEditorTool />
      <SeoFaqSection
        crumbName="STL Editor"
        crumbUrl={URL}
        aboutTitle="Editing an STL file online"
        about={ABOUT}
        stepsTitle="How to edit STL files online"
        steps={STEPS}
        faq={FAQ}
        related={[
          { href: "/tools/stl-repair/", title: "STL Repair", desc: "Fix holes, flipped normals & non-manifold edges" },
          { href: "/tools/print-checker/", title: "3D Print Checker", desc: "Check size, walls & overhangs before printing" },
          { href: "/stl-viewer/", title: "STL Viewer", desc: "Just want to look at it? Open the viewer" },
          { href: "/image-to-stl/", title: "Image to STL", desc: "Create an STL from a photo or picture" },
        ]}
      />
    </>
  );
}
