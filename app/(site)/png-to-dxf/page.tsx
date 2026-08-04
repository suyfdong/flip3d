import type { Metadata } from "next";
import ImageToDxfTool from "@/components/ImageToDxfTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/png-to-dxf/`;
const title = "PNG to DXF Converter — Free Online | No Signup Required";
const description =
  "Convert PNG to DXF in your browser. Trace a logo or graphic into DXF polylines for laser cutting and CNC — transparent areas drop out automatically. Free, instant, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "PNG to DXF — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PNG to DXF — Free Online",
    description: "Trace a PNG into DXF polylines for laser cutting. 100% local.",
  },
};

const ABOUT = [
  "A PNG is traced to DXF by splitting it into ink and background at a brightness threshold, then following that border and writing it out as DXF polylines a laser cutter, CNC router or plotter can drive.",
  "PNGs have one advantage over JPGs here: transparency. Fully transparent pixels are treated as background, so a logo exported with a clear background traces cleanly without any threshold fiddling — and there's no JPG compression noise to speckle the edges.",
  "Everything runs in your browser: drop the PNG, tune the threshold and smoothing, set the width in millimetres, download an R12 DXF. No upload, no signup, no watermark.",
];

const FAQ = [
  {
    q: "How do I convert a PNG to DXF?",
    a: "Drop the PNG above. It traces immediately — adjust the threshold if needed, set the width in millimetres, then click Download DXF. Everything happens on your device.",
  },
  {
    q: "Does it handle transparent PNGs?",
    a: "Yes. Fully transparent pixels count as background, so a logo on a clear background traces to its actual silhouette instead of picking up a white box.",
  },
  {
    q: "Is this PNG to DXF converter free?",
    a: "Yes — free, no signup, no watermark, no file-size paywall.",
  },
  {
    q: "What DXF version is written?",
    a: "AutoCAD R12 (AC1009) ASCII using POLYLINE entities, with millimetre units declared. It opens in LightBurn, LaserGRBL, Inkscape, Illustrator, Fusion 360 and standard CAM software.",
  },
  {
    q: "My PNG is a photo — will it work?",
    a: "It will produce an outline, but photos rarely trace usefully: their tones run continuously, so a single brightness cut lands in the middle of the subject. This is built for logos, silhouettes, stencils and line art.",
  },
  {
    q: "Why are the edges jagged?",
    a: "The trace follows pixel boundaries, so a low-resolution source gives a visible staircase. Raise the Smoothing slider to straighten it, or start from a higher-resolution PNG. Smoothing trades fine detail for cleaner lines.",
  },
  {
    q: "Is my PNG uploaded anywhere?",
    a: "No. There's no server and no upload — the file is decoded and traced entirely in your browser, and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={softwareAppSchema({
          name: "PNG to DXF Converter",
          description,
          url: URL,
        })}
      />
      <ImageToDxfTool variant="png" />
      <SeoFaqSection
        crumbName="PNG to DXF"
        crumbUrl={URL}
        aboutTitle="Converting a PNG to DXF"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/jpg-to-dxf/", title: "JPG to DXF", desc: "Same tracer for JPG photos and scans" },
          { href: "/image-to-dxf/", title: "Image to DXF", desc: "The general image → DXF converter" },
          { href: "/dxf-to-stl/", title: "DXF to STL", desc: "Extrude a DXF outline into a 3D solid" },
          { href: "/png-to-stl/", title: "PNG to STL", desc: "Want 3D instead? Turn the PNG into a relief" },
        ]}
      />
    </>
  );
}
