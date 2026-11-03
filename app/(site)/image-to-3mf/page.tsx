import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/image-to-3mf/`;
const title = "Image to 3MF Converter — Free Online | JPG, PNG, WebP, No Signup";
const description =
  "Convert an image to a printable 3MF in your browser — JPG, PNG or WebP. Relief, lithophane or flat logo, written in real millimetres so Bambu Studio, PrusaSlicer and Orca open it at the right size. Free, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Image to 3MF — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to 3MF — Free Online",
    description: "Turn a JPG, PNG or WebP into a printable 3MF. Real units, 100% local.",
  },
};

const ABOUT = [
  "Drop any picture — a JPG photo, a PNG logo, a WebP from the web — and it becomes a 3MF you can send straight to the slicer. The shape comes from the image itself: brightness sets height for a relief, or thickness for a lithophane that shows the picture when lit from behind; a PNG with a transparent background rises as a flat-topped logo instead.",
  "The reason to pick 3MF over STL is units. A 3MF says millimetres, so the model lands in Bambu Studio, PrusaSlicer, OrcaSlicer or Cura at exactly the width you set here — no guessing whether it was meant to be 100 mm or 100 inches.",
  "Photos and logos want different settings. For a photo, a lithophane at 100–150 mm wide is the classic print; for a logo or text, use a PNG with a transparent background (or a high-contrast JPG) so edges come out crisp. Everything runs in your browser — the image never leaves your device.",
];

const FAQ = [
  {
    q: "How do I convert an image to 3MF?",
    a: "Drop a JPG, PNG or WebP above, choose relief or lithophane, set the width and thickness, and click Download. The 3MF is written in millimetres, so it opens at that size in your slicer.",
  },
  {
    q: "Is this image to 3MF converter free?",
    a: "Yes — free, no signup, no watermark and no file limit. It runs locally in your browser.",
  },
  {
    q: "Can it turn a photo into a full 3D model?",
    a: "No, and no honest tool can from one photo. A picture has no depth information, so the 3D shape has to come from the image's brightness (a relief or lithophane) or its outline (a flat logo). That's what prints well from a single image.",
  },
  {
    q: "Which works better, JPG or PNG?",
    a: "For photos, either — JPG is fine for lithophanes. For logos, a PNG with a transparent background is best: the transparent area stays at the base and the shape rises cleanly. A JPG has no transparency, so a logo on white gets its height from brightness instead; turn on Invert if the logo is dark on light.",
  },
  {
    q: "Will the 3MF keep my image's colors?",
    a: "No — the 3MF is a single-color solid. To print a logo in two colors, add a filament change at the first layer of the raised shape in Bambu Studio, Orca or PrusaSlicer. If you want the colors themselves on the model, use Image to Color STL, which exports PLY or GLB with per-vertex color.",
  },
  {
    q: "How do I open the 3MF in Bambu Studio?",
    a: "File → Import → the .3mf. It arrives at the millimetre size you chose, ready to slice. PrusaSlicer, OrcaSlicer and Cura open it the same way.",
  },
  {
    q: "The file has a lot of triangles — is that a problem?",
    a: "Large flat areas make reliefs heavier than they need to be. When the model is dense, a link under the preview hands it to the 3D Model Compressor, which can usually cut the triangle count by half or more with no visible change.",
  },
  {
    q: "Is my image uploaded?",
    a: "No. There is no server step — the image is converted on your device and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="image" targetFormat="3mf" />
      <SeoFaqSection
        crumbName="Image to 3MF"
        crumbUrl={URL}
        aboutTitle="Converting an image to 3MF"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/png-to-3mf/", title: "PNG to 3MF", desc: "Logos and icons with transparent backgrounds" },
          { href: "/lithophane-generator/", title: "Lithophane Generator", desc: "Backlit photo prints, tuned for light" },
          { href: "/image-to-stl/", title: "Image to STL", desc: "Same relief as an STL" },
          { href: "/3mf-viewer/", title: "3MF Viewer", desc: "Open the 3MF you made" },
        ]}
      />
    </>
  );
}
