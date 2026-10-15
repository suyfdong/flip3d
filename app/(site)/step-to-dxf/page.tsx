import type { Metadata } from "next";
import MeshToDxfTool from "@/components/MeshToDxfTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/step-to-dxf/`;
const title = "STEP to DXF Converter — 3D Part to 2D Profile, Free Online | STP to DXF";
const description =
  "Turn a 3D STEP/STP part into a 2D DXF profile: cut across X, Y or Z and export the outline in mm for laser, waterjet or CNC. Free, no CAD licence, nothing uploaded.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "STEP to DXF — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STEP to DXF — Free Online",
    description: "Section a STEP part into a DXF outline. No CAD licence needed.",
  },
};

const ABOUT = [
  "STEP holds a 3D solid; DXF holds a 2D drawing. To get from one to the other you have to pick a plane — this tool cuts the part across X, Y or Z at the position you choose and exports the outline of that cut as closed DXF polylines, holes included.",
  "That's the normal shop workflow: a supplier sends a STEP file, and you need the flat profile to cut a plate, a gasket or a bracket blank. Choose the direction that looks at the face you need (top, front or side), drag the slider until the preview shows that profile, then download an R12 DXF in millimetres — or an SVG for laser software.",
  "The STEP solid is tessellated in your browser by an OpenCascade WASM engine before it's sectioned, so the first file spends a few seconds loading that engine. Because the part is triangulated first, curved edges come out as very fine straight segments rather than true arcs.",
];

const FAQ = [
  {
    q: "How do I convert a STEP file to DXF?",
    a: "Drop the .step or .stp file above, pick the cut direction (X, Y or Z), drag the slider to the profile you need, and click Download DXF. No CAD software and no upload — it runs in the browser.",
  },
  {
    q: "How do I get a 2D DXF of one face of a STEP part?",
    a: "Choose the cut direction that faces it — Z for the top, Y for the front, X for the side — and move the slider just inside that face. The outline of the part at that plane is what gets exported. For a flat plate or sheet-metal blank, any position through the thickness gives the full profile.",
  },
  {
    q: "Does it work with .stp files?",
    a: "Yes. .stp and .step are the same ISO 10303 format with two extensions; both are accepted.",
  },
  {
    q: "Is this STEP to DXF converter free?",
    a: "Yes — free, no signup, no watermark, no file-size paywall, and no CAD licence.",
  },
  {
    q: "Are the curves in the DXF real arcs?",
    a: "No, and it's worth knowing: the STEP solid is tessellated into triangles before sectioning, so a circular hole comes out as a many-sided polyline rather than a CIRCLE entity. It cuts to size, but if you need true arcs for a CAM toolpath, export the DXF from the original CAD system instead.",
  },
  {
    q: "Why a section instead of a flat projection of the whole part?",
    a: "A section is a real cut at a stated position, which is unambiguous. A projected silhouette merges features at different depths into one outline that matches no actual plane of the part — easy to misread on the shop floor.",
  },
  {
    q: "Can I also get the full 3D shape into DXF?",
    a: "Yes — switch to 3D faces and every triangle is written as a DXF 3DFACE entity. That keeps the shape but produces a large mesh file, not a solid with feature history.",
  },
  {
    q: "Is my CAD file uploaded anywhere?",
    a: "No. There is no server and no upload — the part is read, tessellated and sectioned entirely on your device, which is why it's safe for parts under NDA.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={softwareAppSchema({
          name: "STEP to DXF Converter",
          description,
          url: URL,
        })}
      />
      <MeshToDxfTool variant="step" />
      <SeoFaqSection
        crumbName="STEP to DXF"
        crumbUrl={URL}
        aboutTitle="Converting a STEP file to DXF"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/stl-to-dxf/", title: "STL to DXF", desc: "Section a mesh instead of a CAD solid" },
          { href: "/step-viewer/", title: "STEP Viewer", desc: "Open the part first and look at it" },
          { href: "/step-to-stl/", title: "STEP to STL", desc: "Need a printable mesh instead" },
          { href: "/dxf-viewer/", title: "DXF Viewer", desc: "Check the drawing you just exported" },
        ]}
      />
    </>
  );
}
