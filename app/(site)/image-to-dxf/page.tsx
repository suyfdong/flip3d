import type { Metadata } from "next";
import ImageToDxfTool from "@/components/ImageToDxfTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/image-to-dxf/`;
const title = "Image to DXF Converter — Free Online | Picture to DXF, No Signup";
const description =
  "Convert an image to DXF in your browser. Trace any picture, logo or drawing into DXF polylines for laser cutting, CNC and plotting. Free, instant, 100% local, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Image to DXF — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to DXF — Free Online",
    description: "Trace any picture into DXF polylines for laser cutting. 100% local.",
  },
};

const ABOUT = [
  "Raster images (PNG, JPG, WebP) store pixels; DXF stores lines. Converting one to the other means tracing: the picture is split into ink and background at a brightness threshold, and the border between the two is followed and written out as DXF polylines.",
  "That output is what a laser cutter, CNC router, vinyl cutter or plotter actually needs — a path to follow. Set the width in millimetres and the drawing comes out at real size, with millimetre units declared in the file.",
  "The honest limit: tracing can only find an edge that exists. Line art, logos, stencils and silhouettes convert cleanly. A photograph with soft shading has no single brightness where the subject ends, so the threshold cuts through it — convert the photo to a silhouette first, or use Image to STL if you want a 3D relief instead of a cut path.",
];

const FAQ = [
  {
    q: "How do I convert an image to DXF?",
    a: "Drop any PNG, JPG or WebP above. It's traced right away — move the threshold slider until the preview shows the shape you want, set the width in millimetres, and download the DXF.",
  },
  {
    q: "Is this image to DXF converter free?",
    a: "Yes — completely free, no signup, no watermark, and no file-size paywall.",
  },
  {
    q: "What is a DXF used for?",
    a: "It's the standard exchange format for 2D machining: laser cutters, CNC routers, waterjets, plasma tables, vinyl cutters and plotters all take DXF. That's why an image has to be traced into paths before those machines can use it.",
  },
  {
    q: "Which images give a good result?",
    a: "Anything with a clear light/dark split: logos, stencils, silhouettes, line drawings, signatures, scanned ink. Photographs with gradients don't, because there's no single brightness that separates subject from background.",
  },
  {
    q: "Can I control how detailed the trace is?",
    a: "Three sliders: Threshold sets where ink stops and background starts, Smoothing flattens the pixel staircase (and fine detail with it), and Ignore specks drops islands below a chosen area so noise doesn't become cut paths.",
  },
  {
    q: "What DXF version does it produce?",
    a: "AutoCAD R12 (AC1009) ASCII with POLYLINE entities and millimetre units — the flavour with the widest software support.",
  },
  {
    q: "Does the image get uploaded?",
    a: "No. There is no server and no upload. Decoding and tracing both run on your device, and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={softwareAppSchema({
          name: "Image to DXF Converter",
          description,
          url: URL,
        })}
      />
      <ImageToDxfTool variant="image" />
      <SeoFaqSection
        crumbName="Image to DXF"
        crumbUrl={URL}
        aboutTitle="Converting an image to DXF"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/jpg-to-dxf/", title: "JPG to DXF", desc: "Same tracer, framed for JPG files" },
          { href: "/png-to-dxf/", title: "PNG to DXF", desc: "Transparent backgrounds drop out" },
          { href: "/dxf-to-stl/", title: "DXF to STL", desc: "Extrude a DXF outline into a 3D solid" },
          { href: "/image-to-stl/", title: "Image to STL", desc: "Want 3D instead? Brightness becomes height" },
        ]}
      />
    </>
  );
}
