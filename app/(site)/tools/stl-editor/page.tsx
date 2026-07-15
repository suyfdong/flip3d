import type { Metadata } from "next";
import StlEditorTool from "@/components/StlEditorTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/tools/stl-editor/`;
const title = "Free STL Editor — Resize, Rotate & Edit STL Online | No Signup";
const description =
  "Free online STL editor. Open an STL and edit it in your browser — resize to an exact size, convert inches to mm, rotate to reorient, drop it on the bed, and export. 100% local, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Free STL Editor — Resize, Rotate & Export, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free STL Editor — Online",
    description: "Resize, rotate and export STL files in your browser. No signup.",
  },
};

const ABOUT = [
  "This is a lightweight STL editor for the edits people actually need before printing: getting the size right and orienting the part well. Open an STL (or OBJ, STEP, FBX, PLY, 3MF and more), then resize it to an exact dimension, scale by a percentage, or fix a units mismatch with a single inch↔mm button.",
  "Rotate in 90° steps on any axis to lay a part flat, and drop it onto the bed so the lowest point sits at z = 0 — exactly what a slicer expects. Every change updates the live dimensions readout so you can hit a target size precisely.",
  "Scaling is always uniform, so your model never gets stretched out of proportion. When you're done, export to STL, OBJ, GLB, 3MF or PLY. It all runs locally in your browser — no upload, no signup, no watermark. For deeper fixes, pair it with the STL repair tool and the 3D print checker.",
];

const FAQ = [
  {
    q: "How do I edit an STL file for free?",
    a: "Drop your .stl above and use the panel to resize, rotate and reposition it, then download the edited file. It's free, runs in your browser, and nothing is uploaded.",
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
    q: "Can I rotate the model to orient it for printing?",
    a: "Yes. Rotate in 90° steps on the X, Y or Z axis, and enable “drop onto the bed” so the part sits flat on z = 0, ready to slice.",
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
          name: "Free STL Editor",
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
