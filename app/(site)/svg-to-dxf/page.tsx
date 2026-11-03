import type { Metadata } from "next";
import VectorConvertTool from "@/components/VectorConvertTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/svg-to-dxf/`;
const title = "SVG to DXF Converter — Free Online | True Size, No Signup";
const description =
  "Convert SVG to DXF in your browser for laser cutting, CNC or AutoCAD. Keeps real size (mm or inches), turns fills and strokes into cut paths, writes R12 DXF. Free, no upload.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "SVG to DXF — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SVG to DXF — Free Online",
    description: "Turn an SVG into a true-size R12 DXF for laser and CNC. No upload.",
  },
};

const ABOUT = [
  "Drop an SVG and every visible shape — paths, rectangles, circles, ellipses, lines, polylines and polygons, with their transforms applied — becomes a polyline in the DXF. It doesn't matter whether a shape was drawn as a fill or an outline: a cutting file only needs the geometry.",
  "Size is the part most converters get wrong. When the SVG declares physical units (width=\"100mm\" with a viewBox, the way Inkscape saves), the DXF comes out at exactly that size. When it only has pixels, the tool assumes 96 px per inch — the CSS and Inkscape standard — tells you it did, and lets you type the real width.",
  "The output is AutoCAD R12 (AC1009) with POLYLINE entities, the most widely accepted DXF flavour: LightBurn, LaserGRBL, RDWorks, Fusion 360, AutoCAD, LibreCAD, SolidWorks and Mach3/VCarve all open it. Coordinates are in millimetres or inches, and $INSUNITS is set to match.",
  "Curves become short straight segments — no chord longer than 0.25 mm, which is below a laser's kerf. Closed shapes stay closed, open paths stay open (shown in amber), and nothing is silently joined.",
];

const FAQ = [
  {
    q: "How do I convert an SVG to DXF?",
    a: "Drop the .svg above, check the size in the panel (type a new width if needed), pick millimetres or inches, and click Download DXF. Nothing is uploaded — the conversion runs in your browser.",
  },
  {
    q: "Is this SVG to DXF converter free?",
    a: "Yes. Free, no signup, no watermark and no daily limit.",
  },
  {
    q: "Will the DXF be the right size?",
    a: "If the SVG has real units (mm, cm, in or pt on its width plus a viewBox), yes — that size is used exactly. Pixel-only SVGs are read at 96 px per inch, and the panel says so; type the real width and the whole drawing scales to it.",
  },
  {
    q: "Why does my SVG come out smaller or bigger in Illustrator-made files?",
    a: "Older Illustrator exports size documents at 72 points per inch while browsers and Inkscape use 96 px per inch, so a pixel-only SVG is ambiguous. If the DXF is 25% off, set the width to the size you designed it at.",
  },
  {
    q: "Does it convert strokes and fills?",
    a: "Both. A filled shape gives its outline; a stroked line gives its centre line. Stroke width isn't carried over, because a DXF line has no width — if you need both edges of a thick line, convert the stroke to a path in your editor first (Inkscape: Path → Stroke to Path).",
  },
  {
    q: "What about text in the SVG?",
    a: "Live <text> can't be converted, because the letter shapes depend on a font the file doesn't contain. Convert text to outlines first (Illustrator: Type → Create Outlines; Inkscape: Path → Object to Path) and re-export. The panel counts any text it skipped.",
  },
  {
    q: "Can I open the DXF in AutoCAD or Fusion 360?",
    a: "Yes. R12 DXF opens in every version of AutoCAD, and Fusion 360 can insert it into a sketch (Insert → Insert DXF) as editable lines you can extrude.",
  },
  {
    q: "Are curves exported as arcs or splines?",
    a: "No — as polylines made of short segments. That cuts and machines cleanly, but if you need true arcs to edit in CAD, redraw those features there.",
  },
  {
    q: "Can I convert a DXF back to SVG?",
    a: "Yes — use DXF to SVG, the same tool in reverse.",
  },
  {
    q: "Is my file uploaded?",
    a: "No. There is no server step: the SVG is parsed and the DXF is written on your own device.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={softwareAppSchema({ name: "SVG to DXF Converter", description, url: URL })} />
      <VectorConvertTool variant="svg-dxf" />
      <SeoFaqSection
        crumbName="SVG to DXF"
        crumbUrl={URL}
        aboutTitle="Converting an SVG to DXF"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/dxf-to-svg/", title: "DXF to SVG", desc: "The reverse — CAD drawing to a true-size SVG" },
          { href: "/svg-to-stl/", title: "SVG to STL", desc: "Extrude the same SVG into a 3D-printable part" },
          { href: "/image-to-dxf/", title: "Image to DXF", desc: "Only have a PNG or JPG? Trace it into a DXF" },
          { href: "/dxf-viewer/", title: "DXF Viewer", desc: "Open the DXF to check it before cutting" },
        ]}
      />
    </>
  );
}
