import type { Metadata } from "next";
import VectorConvertTool from "@/components/VectorConvertTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/dxf-to-svg/`;
const title = "DXF to SVG Converter — Free Online | True Size, No Signup";
const description =
  "Convert DXF to SVG in your browser: true-size hairline cut paths for LightBurn, Glowforge and Cricut, or filled shapes for the web. Blocks and units handled. Free, no upload.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "DXF to SVG — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DXF to SVG — Free Online",
    description: "Turn a DXF drawing into a true-size SVG for laser, Cricut or web. No upload.",
  },
};

const ABOUT = [
  "Drop a .dxf and its line work — LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC and SPLINE, including everything inside block references (INSERT) with their position, scale and rotation — is written out as SVG paths. Unsupported geometry such as hatches and ellipses is listed in the panel rather than silently dropped; text and dimensions are left out.",
  "The SVG keeps the drawing's real size. Units come from the DXF's $INSUNITS header; when a file doesn't declare them, you pick millimetres, centimetres, inches or metres, and the SVG's width and height are written in mm or inches so LightBurn, Inkscape, Glowforge and Cricut Design Space import it at true scale.",
  "Pick the style for where it's going. Cut lines gives hairline strokes with no fill, which is what laser software reads as cut paths. Filled shapes merges closed loops into one even-odd path, so holes stay open — useful for Cricut print-then-cut, a website, or a quick visual of the part.",
  "Arcs and circles are written as many short segments rather than SVG arc commands. The result cuts to size, but it isn't meant for further CAD editing.",
];

const FAQ = [
  {
    q: "How do I convert a DXF to SVG?",
    a: "Drop the .dxf above, check the size, choose Cut lines or Filled shapes, and click Download SVG. The conversion happens in your browser — nothing is uploaded.",
  },
  {
    q: "Is this DXF to SVG converter free?",
    a: "Yes. Free, no signup, no watermark and no file count limit.",
  },
  {
    q: "Will the SVG import at the right size in LightBurn or Cricut?",
    a: "The SVG's width and height carry real units (for example width=\"120mm\"), so programs that honour SVG units — LightBurn, Inkscape, Glowforge and Cricut Design Space — import it at true size. If the DXF didn't declare units, choose them in the panel first.",
  },
  {
    q: "My DXF has no units — what do I pick?",
    a: "Whatever it was drawn in. Most metric CAD drawings are millimetres; US shop drawings are usually inches. If you're not sure, compare a known dimension with the size shown above the preview.",
  },
  {
    q: "Can it convert DWG to SVG?",
    a: "No. DWG is AutoCAD's proprietary binary format. Save or export the drawing as DXF (any version, ASCII) from AutoCAD, DraftSight or LibreCAD, then convert that.",
  },
  {
    q: "Why are some paths amber in the preview?",
    a: "They're open — the line doesn't return to its start. They convert as plain lines (good for scoring or engraving), but they don't enclose an area, so they can't be filled.",
  },
  {
    q: "Does it keep layers and colours?",
    a: "Not yet — everything goes onto one black layer. Split the drawing by layer in your CAD program first if you need separate cut and engrave passes.",
  },
  {
    q: "What happens to text and dimensions?",
    a: "TEXT, MTEXT and DIMENSION entities aren't converted. Explode text to polylines in your CAD program (AutoCAD: TXTEXP or EXPLODE) if you need it in the SVG.",
  },
  {
    q: "Can I go the other way?",
    a: "Yes — SVG to DXF does the reverse, and DXF to STL extrudes the drawing into a 3D-printable solid.",
  },
  {
    q: "Is my drawing uploaded anywhere?",
    a: "No. The DXF is parsed and the SVG is written on your own device, so a drawing under NDA stays on your machine.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={softwareAppSchema({ name: "DXF to SVG Converter", description, url: URL })} />
      <VectorConvertTool variant="dxf-svg" />
      <SeoFaqSection
        crumbName="DXF to SVG"
        crumbUrl={URL}
        aboutTitle="Converting a DXF to SVG"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/svg-to-dxf/", title: "SVG to DXF", desc: "The reverse — SVG to a true-size R12 DXF" },
          { href: "/dxf-viewer/", title: "DXF Viewer", desc: "Just look at the drawing first" },
          { href: "/dxf-to-stl/", title: "DXF to STL", desc: "Extrude the drawing into a printable solid" },
          { href: "/stl-to-svg/", title: "STL to SVG", desc: "Section a 3D model into an SVG outline" },
        ]}
      />
    </>
  );
}
