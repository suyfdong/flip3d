import type { Metadata } from "next";
import DxfViewerTool from "@/components/DxfViewerTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/dxf-viewer/`;
const title = "Online DXF Viewer — Free, No Signup | Open .DXF Files in Browser";
const description =
  "Free online DXF viewer. Open a .dxf drawing in your browser and see the geometry instantly — no AutoCAD, no install, no upload, no signup. 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online DXF Viewer — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online DXF Viewer — Free",
    description: "Open .dxf drawings in your browser. No install, no signup.",
  },
};

const ABOUT = [
  "Drop a .dxf file and the drawing is rendered in the browser — no AutoCAD seat, no viewer to install, and no account. The file is parsed on your device, so a drawing under NDA stays on your machine.",
  "Closed shapes draw in blue and open paths in amber. That distinction matters before you machine or extrude anything: an open path is fine for cutting a line, but it can't bound a solid, and a gap of a hundredth of a millimetre looks identical to a closed loop until something tells you otherwise.",
  "The panel reports what's in the file — closed shapes, open paths, declared units — and names any entity types that weren't drawn, so you know when you're looking at part of a drawing rather than all of it.",
];

const FAQ = [
  {
    q: "How do I open a DXF file online?",
    a: "Drop your .dxf file into the box above. It renders immediately — no AutoCAD, no install, no upload. The file is read locally in your browser.",
  },
  {
    q: "Is this DXF viewer free?",
    a: "Yes. Free, no signup, no watermark, and no file-size limit beyond 200MB.",
  },
  {
    q: "What program opens a .dxf file?",
    a: "AutoCAD, LibreCAD, Inkscape, Fusion 360 and most CAM software read DXF — all of them installs, and several need a licence. This page opens the drawing in the browser tab you already have open.",
  },
  {
    q: "Can it open DWG files?",
    a: "No. DWG is AutoCAD's proprietary binary format and isn't supported; neither is binary DXF. Re-export as ASCII DXF (R12 or later) from whatever tool produced it.",
  },
  {
    q: "Which entities does it draw?",
    a: "LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC, SPLINE and 3DFACE, plus block references (INSERT) expanded with their position, scale and rotation. Anything else — hatches, ellipses, dimensions, text — is listed as skipped rather than silently ignored.",
  },
  {
    q: "Why are some paths amber?",
    a: "Those chains don't close. It's normal for engraving lines and centrelines, but if you expected a cuttable or extrudable outline, an amber path means there's a gap in the drawing.",
  },
  {
    q: "Is my drawing uploaded anywhere?",
    a: "No. There is no server and no upload — the file is parsed and drawn entirely on your device, and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={softwareAppSchema({
          name: "Online DXF Viewer",
          description,
          url: URL,
        })}
      />
      <DxfViewerTool />
      <SeoFaqSection
        crumbName="DXF Viewer"
        crumbUrl={URL}
        aboutTitle="About the DXF viewer"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/dxf-to-stl/", title: "DXF to STL", desc: "Extrude this drawing into a printable solid" },
          { href: "/stl-to-dxf/", title: "STL to DXF", desc: "Section a 3D model into a 2D drawing" },
          { href: "/jpg-to-dxf/", title: "JPG to DXF", desc: "Trace an image into DXF polylines" },
          { href: "/step-viewer/", title: "STEP Viewer", desc: "Open 3D CAD files the same way" },
        ]}
      />
    </>
  );
}
