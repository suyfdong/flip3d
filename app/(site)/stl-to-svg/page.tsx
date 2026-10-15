import type { Metadata } from "next";
import MeshToDxfTool from "@/components/MeshToDxfTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/stl-to-svg/`;
const title = "STL to SVG Converter — Free Online | Laser-Ready Outline, No Signup";
const description =
  "Convert STL to SVG in your browser: cut a section across X, Y or Z and download the outline at true millimetre size for LightBurn, Inkscape or a laser cutter. Free, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "STL to SVG — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STL to SVG — Free Online",
    description: "Section an STL into a laser-ready SVG outline, in millimetres.",
  },
};

const ABOUT = [
  "STL is a 3D mesh and SVG is a flat drawing, so the useful conversion is a cut: pick the direction (top, front or side) and the position, and the tool exports the outline where that plane passes through the model.",
  "The SVG is written for cutting, not for display: every outline is a hairline stroke with no fill, closed loops stay closed, holes come out as their own paths, and the document's width and height are set in millimetres so it imports at true size.",
  "Use it to turn a 3D-printable part into a laser-cut plate, a gasket, a stencil, a router template, or a flat layer for a stacked plywood model — or just to drop a real profile into a 2D design.",
  "Need DXF instead? The same section downloads as an R12 DXF from the button next to Download SVG, which most CAM and CNC software prefers.",
];

const FAQ = [
  {
    q: "How do I convert an STL to SVG?",
    a: "Drop the STL above, choose which way to cut (Z for the top view, Y for the front, X for the side), drag the slider until the preview shows the outline you want, and click Download SVG. Nothing is uploaded.",
  },
  {
    q: "Is this STL to SVG converter free?",
    a: "Yes — free, no signup, no watermark and no file-size paywall. It runs entirely in your browser.",
  },
  {
    q: "Will the SVG come out at the right size in my laser software?",
    a: "The SVG's width and height are written in millimetres (for example width=\"60mm\"), so software that honours SVG units — LightBurn and Inkscape among them — imports it at true size. If a program assumes pixels instead, check the scale once on import.",
  },
  {
    q: "Why do I only get one outline, not the whole 3D shape?",
    a: "SVG is a 2D format. An honest STL to SVG conversion has to choose a plane; the tool cuts the model where you say and gives you that exact outline. A flattened silhouette would merge features at different depths into a shape that matches no real slice of the part.",
  },
  {
    q: "My part was modelled standing up — how do I get its face?",
    a: "Switch the cut direction to Y or X. The section is then taken across that axis, so you get the profile you'd see looking at the part from the front or the side.",
  },
  {
    q: "Are curves real arcs in the SVG?",
    a: "No. An STL is made of triangles, so a round hole is already a many-sided polygon before it's cut, and the SVG path follows those segments. It cuts to size; if you need true arcs, export the profile from the original CAD file.",
  },
  {
    q: "The outline has gaps — why?",
    a: "Chains that don't close mean the mesh has holes or non-manifold edges at that position. They're kept as open paths (amber in the preview) rather than silently joined. Run the model through STL Repair first if you need a closed cut path.",
  },
  {
    q: "Can I convert other 3D formats to SVG?",
    a: "Yes. The dropzone also accepts OBJ, GLB, 3MF, PLY, STEP, IGES, FBX and DAE — anything Flip3D can read is sectioned the same way.",
  },
  {
    q: "Is my STL uploaded anywhere?",
    a: "No. There is no server and no upload — the mesh is read and cut on your own device.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={softwareAppSchema({
          name: "STL to SVG Converter",
          description,
          url: URL,
        })}
      />
      <MeshToDxfTool variant="stl-svg" />
      <SeoFaqSection
        crumbName="STL to SVG"
        crumbUrl={URL}
        aboutTitle="Converting an STL to SVG"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/stl-to-dxf/", title: "STL to DXF", desc: "Same section as an R12 DXF for CAM / CNC" },
          { href: "/svg-to-stl/", title: "SVG to STL", desc: "The reverse — extrude a drawing into a printable solid" },
          { href: "/step-to-dxf/", title: "STEP to DXF", desc: "Profile a CAD part instead of a mesh" },
          { href: "/tools/stl-repair/", title: "STL Repair", desc: "Close holes so outlines come out clean" },
        ]}
      />
    </>
  );
}
