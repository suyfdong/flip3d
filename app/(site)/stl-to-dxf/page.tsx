import type { Metadata } from "next";
import MeshToDxfTool from "@/components/MeshToDxfTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/stl-to-dxf/`;
const title = "STL to DXF Converter — Free Online | No Signup Required";
const description =
  "Convert STL to DXF in your browser: cut a 2D section across X, Y or Z for laser cutting and CNC (DXF or SVG), or export every triangle as 3DFACE. Free, 100% local.";

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
  "A 2D section cuts the model with a plane — across Z for the top view, or across Y / X for the front and side — at a position you choose, and exports the outline of that cut as closed DXF polylines. This is what you want for laser cutting, waterjet, plasma or CNC profiling, and for dropping a real profile into a 2D drawing. The same outline also downloads as a millimetre-sized SVG.",
  "3D faces writes every triangle straight through as a DXF 3DFACE entity. The shape is unchanged, so a CAD package that imports faceted geometry gets the whole model — but the file is large and it's still a mesh, not a solid with feature history.",
  "Because it's a genuine section and not a flattened silhouette, curved or tapered walls give a different outline at different heights. Pick the height that matters for your cut — the slider updates the preview live.",
];

const FAQ = [
  {
    q: "How do I convert an STL to DXF?",
    a: "Drop the STL above, leave the mode on 2D section, pick the cut direction, and drag the slider until the preview shows the outline you need. Then click Download DXF. Nothing is uploaded.",
  },
  {
    q: "Can I convert STL to DXF for laser cutting?",
    a: "Yes — that's what the 2D section is for. It gives a real closed outline (holes included) in millimetres, written as R12 POLYLINE entities that LightBurn, LaserGRBL and CAM packages read. Many online converters instead hand you a 3D mesh DXF, which laser software can't cut.",
  },
  {
    q: "My part was modelled standing up — how do I get its face?",
    a: "Change the cut direction to Y (front) or X (side). The section is then taken across that axis, so you get the profile you'd see looking at the part face-on.",
  },
  {
    q: "Can I get an SVG instead of a DXF?",
    a: "Yes. In 2D section mode there's a Download SVG button next to Download DXF; the SVG is a hairline-stroke outline sized in millimetres for laser and craft-cutter software. There's also a dedicated STL to SVG page.",
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
          { href: "/stl-to-svg/", title: "STL to SVG", desc: "Same section as a laser-ready SVG" },
          { href: "/dxf-viewer/", title: "DXF Viewer", desc: "Open the result and check it" },
          { href: "/tools/stl-repair/", title: "STL Repair", desc: "Close holes so sections come out clean" },
        ]}
      />
    </>
  );
}
