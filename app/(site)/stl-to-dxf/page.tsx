import type { Metadata } from "next";
import MeshToDxfTool from "@/components/MeshToDxfTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/stl-to-dxf/`;
const title = "STL to DXF Converter — Free Online | No Signup Required";
const description =
  "Convert STL to DXF in your browser. Take a cross-section through the model for laser cutting and CNC, or export every triangle as DXF 3DFACE entities. Free, instant, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "STL to DXF — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STL to DXF — Free Online",
    description: "Section an STL into a DXF outline, or export 3DFACE triangles.",
  },
};

const ABOUT = [
  "STL is a 3D triangle mesh; DXF is a 2D drawing format. There's no conversion that keeps everything, so this tool gives you the two that are actually useful — and tells you which one you're getting.",
  "A 2D section cuts the model with a horizontal plane at a height you choose and exports the outline of that cut as closed DXF polylines. This is what you want for laser cutting, waterjet, plasma or CNC profiling, and for dropping a real footprint into a 2D drawing.",
  "3D faces writes every triangle straight through as a DXF 3DFACE entity. The shape is unchanged, so a CAD package that imports faceted geometry gets the whole model — but the file is large and it's still a mesh, not a solid with feature history.",
  "Because it's a genuine section and not a flattened silhouette, curved or tapered walls give a different outline at different heights. Pick the height that matters for your cut — the slider updates the preview live.",
];

const FAQ = [
  {
    q: "How do I convert an STL to DXF?",
    a: "Drop the STL above, leave the mode on 2D section, and drag the cut-height slider until the preview shows the outline you need. Then click Download DXF. Nothing is uploaded.",
  },
  {
    q: "Is this STL to DXF converter free?",
    a: "Yes — free, no signup, no watermark, no file-size paywall.",
  },
  {
    q: "Why does an STL have to become a section instead of the whole shape?",
    a: "DXF's 2D entities can only hold flat geometry. A mesh has depth, so something must be chosen: a cut at one height, or the triangles themselves as 3DFACE entities. Anything else would be throwing away information without saying so.",
  },
  {
    q: "Which mode should I pick?",
    a: "Cutting a flat part on a laser or router: use 2D section. Getting the 3D shape into a CAD package that accepts faceted geometry: use 3D faces. If you just want to view or print the model, you don't need DXF at all.",
  },
  {
    q: "The outline has amber gaps — what does that mean?",
    a: "Those chains didn't close, which means the mesh has holes or non-manifold edges where the plane crossed it. They're exported as open polylines rather than dropped. Run the model through STL Repair first if you need a closed cut path.",
  },
  {
    q: "Can I convert other formats to DXF here?",
    a: "Yes. The dropzone accepts OBJ, GLB, 3MF, PLY, STEP, IGES, FBX and DAE as well as STL — anything Flip3D can read gets sectioned the same way.",
  },
  {
    q: "What DXF version does it write?",
    a: "AutoCAD R12 (AC1009) ASCII with millimetre units. Sections use POLYLINE entities; the 3D mode uses 3DFACE.",
  },
  {
    q: "Does my STL get uploaded to a server?",
    a: "No. There is no server and no upload. The mesh is read and sectioned entirely on your device.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={softwareAppSchema({
          name: "STL to DXF Converter",
          description,
          url: URL,
        })}
      />
      <MeshToDxfTool variant="stl" />
      <SeoFaqSection
        crumbName="STL to DXF"
        crumbUrl={URL}
        aboutTitle="Converting an STL to DXF"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/dxf-to-stl/", title: "DXF to STL", desc: "The reverse — extrude a drawing into a solid" },
          { href: "/step-to-dxf/", title: "STEP to DXF", desc: "Section a CAD part instead of a mesh" },
          { href: "/dxf-viewer/", title: "DXF Viewer", desc: "Open the result and check it" },
          { href: "/tools/stl-repair/", title: "STL Repair", desc: "Close holes so sections come out clean" },
        ]}
      />
    </>
  );
}
