import type { Metadata } from "next";
import ImageToDxfTool from "@/components/ImageToDxfTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/jpg-to-dxf/`;
const title = "JPG to DXF Converter — Free Online | No Signup Required";
const description =
  "Convert JPG to DXF in your browser. Trace a photo or logo into DXF polylines for laser cutting and CNC — set the threshold, size it in mm, download. Free, instant, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "JPG to DXF — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JPG to DXF — Free Online",
    description: "Trace a JPG into DXF polylines for laser cutting. 100% local.",
  },
};

const ABOUT = [
  "Converting a JPG to DXF means tracing it: the image is split into ink and background at a brightness threshold, the border between them is followed pixel by pixel, and that border becomes DXF polylines your laser cutter, CNC router or plotter can follow.",
  "Everything runs in your browser. Drop a JPG, move the threshold slider until the preview shows the shape you want, set the physical width in millimetres, and download an R12 DXF. Nothing is uploaded, and there's no signup or watermark.",
  "What you get is a polyline trace, not a curve-fitted vector illustration. That's the right output for cutting — but it also means the result is only as good as the threshold: if the image has no clean light/dark edge, no tracer can invent one.",
];

const FAQ = [
  {
    q: "How do I convert a JPG to DXF?",
    a: "Drop the JPG above. It's traced immediately; adjust the threshold until the preview matches the shape you want, set the width in millimetres, then click Download DXF. Nothing is uploaded — the tracing runs on your device.",
  },
  {
    q: "Is this JPG to DXF converter free?",
    a: "Yes. Free, no signup, no watermark, no file-size paywall. There's no trial and no paid tier.",
  },
  {
    q: "Which images convert to DXF well?",
    a: "High-contrast art: logos, silhouettes, stencils, line drawings, signatures. A photograph with soft gradients has no single brightness where the subject stops, so it traces into noise no matter how you set the threshold.",
  },
  {
    q: "What DXF version does it write?",
    a: "AutoCAD R12 (AC1009) ASCII with POLYLINE entities — the most widely accepted flavour. LightBurn, LaserGRBL, Inkscape, Illustrator, Fusion 360 and standard CAM packages all read it.",
  },
  {
    q: "How do I set the real-world size?",
    a: "Use the Width slider — it sets the X extent of the finished drawing in millimetres, and the height follows the image's aspect ratio. The file declares millimetre units, so CAM software reads the size directly.",
  },
  {
    q: "Why does my trace have lots of tiny shapes?",
    a: "JPG compression noise and dithering create specks of ink. Raise the 'Ignore specks' slider to drop islands below a given area, and raise Smoothing to flatten the pixel staircase along the edges.",
  },
  {
    q: "Can it trace a photo of a person or an object?",
    a: "It will produce an outline, but usually not a useful one — a photo's tones run continuously, so the threshold cuts through the middle of the subject. Convert the photo to a high-contrast silhouette first, or use Image to STL if what you actually want is a 3D relief.",
  },
  {
    q: "Does my image get uploaded to a server?",
    a: "No. There is no server and no upload. The image is decoded and traced entirely on your device, and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={softwareAppSchema({
          name: "JPG to DXF Converter",
          description,
          url: URL,
        })}
      />
      <ImageToDxfTool variant="jpg" />
      <SeoFaqSection
        crumbName="JPG to DXF"
        crumbUrl={URL}
        aboutTitle="Converting a JPG to DXF"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/png-to-dxf/", title: "PNG to DXF", desc: "Same tracer, transparent areas drop out" },
          { href: "/image-to-dxf/", title: "Image to DXF", desc: "The general image → DXF converter" },
          { href: "/dxf-to-stl/", title: "DXF to STL", desc: "Extrude a DXF outline into a 3D solid" },
          { href: "/jpg-to-stl/", title: "JPG to STL", desc: "Want 3D instead? Turn the JPG into a relief" },
        ]}
      />
    </>
  );
}
