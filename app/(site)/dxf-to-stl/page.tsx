import type { Metadata } from "next";
import DxfToMeshTool from "@/components/DxfToMeshTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/dxf-to-stl/`;
const title = "DXF to STL Converter — Free Online | No Signup Required";
const description =
  "Convert DXF to STL in your browser. Closed outlines are extruded to the thickness you choose, inner loops become holes — download STL, OBJ, GLB, 3MF or PLY. Free, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "DXF to STL — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DXF to STL — Free Online",
    description: "Extrude a DXF drawing into a printable solid. 100% local.",
  },
};

const ABOUT = [
  "A DXF is a flat drawing, so the third dimension has to come from somewhere: this tool extrudes the drawing's closed outlines to a thickness you set. Loops nested inside another outline become holes, so a plate with bolt holes comes through as a plate with bolt holes.",
  "Drop the file and the drawing is shown next to the solid it produces. Set the thickness, choose whether to keep the drawing's own units (read as millimetres, which is what most CAD exports mean) or rescale to a width, then export STL, OBJ, GLB, 3MF or PLY.",
  "It reads LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC, SPLINE and 3DFACE entities, and expands block references (INSERT) with their position, scale and rotation — a lot of real drawings keep every shape inside a block, and without that they'd come through empty.",
  "Two limits worth stating plainly. Outlines that don't close can't bound a solid: they're counted, drawn in amber and left out rather than being welded shut behind your back. And if the DXF already contains 3DFACE triangles, they're rebuilt as-is — no extrusion involved, because the file already had 3D geometry.",
];

const FAQ = [
  {
    q: "How do I convert a DXF to STL?",
    a: "Drop the .dxf file above. The closed outlines are extruded straight away — set the thickness, check the 3D preview, and click Download STL. Nothing is uploaded.",
  },
  {
    q: "Is this DXF to STL converter free?",
    a: "Yes — free, no signup, no watermark, and no file-size paywall.",
  },
  {
    q: "Why does the DXF need a thickness?",
    a: "Because a 2D drawing doesn't have one. The outline says how wide and tall the part is, but nothing about its depth, so you choose it. Nothing about the shape is invented — only the thickness you set.",
  },
  {
    q: "Do holes in my drawing come through?",
    a: "Yes. A closed loop nested inside another closed outline is treated as a hole and cut out of the solid. The tool reports how many outlines and holes it found so you can check the count against your drawing.",
  },
  {
    q: "It says my outline didn't close — what now?",
    a: "The drawing has a gap between two line ends, often too small to see. Endpoints are welded within a small tolerance, but a real gap is left alone rather than guessed at. Fix the gap in your CAD tool and re-export; the open paths show in amber so you can see where they are.",
  },
  {
    q: "My model came out 25× too small — why?",
    a: "The drawing was probably in inches. DXF units are ambiguous, so drawing units are read as millimetres by default. Switch to 'Scale to width' and type the real width, or re-export from CAD in millimetres.",
  },
  {
    q: "Can it open a DWG file?",
    a: "No. DWG is AutoCAD's proprietary binary format, and binary DXF isn't supported either. Re-export as ASCII DXF (R12 or later) — every CAD package can do that.",
  },
  {
    q: "What about splines and curves?",
    a: "CIRCLE and ARC entities are tessellated into fine polylines. SPLINE entities are approximated through their fit points, so curves can look slightly angular — the tool says so when a drawing contains them.",
  },
  {
    q: "Can I export something other than STL?",
    a: "Yes. The same solid exports to STL, OBJ, GLB, 3MF or PLY — pick the format before downloading.",
  },
  {
    q: "Is my drawing uploaded to a server?",
    a: "No. There is no server and no upload. Parsing and extrusion run entirely on your device, and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={softwareAppSchema({
          name: "DXF to STL Converter",
          description,
          url: URL,
        })}
      />
      <DxfToMeshTool targetFormat="stl" />
      <SeoFaqSection
        crumbName="DXF to STL"
        crumbUrl={URL}
        aboutTitle="Converting a DXF to STL"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/dxf-viewer/", title: "DXF Viewer", desc: "Look at the drawing before converting it" },
          { href: "/stl-to-dxf/", title: "STL to DXF", desc: "The reverse — section a model into a drawing" },
          { href: "/svg-to-stl/", title: "SVG to STL", desc: "Same idea, starting from a vector graphic" },
          { href: "/tools/print-checker/", title: "3D Print Checker", desc: "Check the solid before printing" },
        ]}
      />
    </>
  );
}
