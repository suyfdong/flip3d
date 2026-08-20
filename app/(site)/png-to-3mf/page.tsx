import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/png-to-3mf/`;
const title = "PNG to 3MF Converter — Free Online | No Signup Required";
const description =
  "Convert a PNG to a printable 3MF in your browser. Free PNG to 3MF converter — brightness becomes height, and 3MF carries real units so Bambu Studio, PrusaSlicer and Cura open it at the right size. 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "PNG to 3MF — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PNG to 3MF — Free Online",
    description: "Turn a PNG into a printable 3MF relief. Units-aware, 100% local.",
  },
};

const FAQ = [
  {
    q: "How do I convert a PNG to 3MF?",
    a: "Drop your .png above, choose relief or lithophane, set the width and thickness, then download the 3MF. Brightness becomes height, and the file is written with real millimetre units.",
  },
  {
    q: "Why convert an image to 3MF instead of STL?",
    a: "3MF records units explicitly. STL does not, which is why an STL sometimes lands in a slicer at 1/25th size or 25× too big and you have to guess whether it was authored in inches. A 3MF opens at the size you set here, in Bambu Studio, PrusaSlicer, Orca and Cura alike.",
  },
  {
    q: "Does the 3MF keep my PNG's colors?",
    a: "Not in this export. 3MF does have an optional color extension, but Flip3D writes plain geometry rather than a half-supported color file. If you want the image's colors carried through, use the color relief tool, which exports PLY or GLB — both handle per-vertex color properly.",
  },
  {
    q: "What happens to transparent areas of the PNG?",
    a: "Transparent pixels are treated as the lightest value, so they flatten to the base of the model instead of spiking. That makes cut-out PNGs with a transparent background work well — the subject rises and the background stays flat.",
  },
  {
    q: "Is the PNG to 3MF converter free?",
    a: "Yes — free, no signup, no watermark and no file-size paywall. It runs locally in your browser.",
  },
  {
    q: "Does my PNG get uploaded anywhere?",
    a: "No. There is no server and no upload — the PNG is converted on your device and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="png" targetFormat="3mf" />
      <SeoFaqSection
        crumbName="PNG to 3MF"
        crumbUrl={URL}
        aboutTitle="Converting a PNG to 3MF"
        about={[
          "This turns a PNG into a printable 3MF: each pixel's brightness sets how tall that point is, and the result is sealed into a watertight solid with a flat base — a relief you print face-up, or a lithophane that reveals the image when backlit.",
          "3MF is worth choosing over STL here for one concrete reason: it stores units. An STL is just numbers with no stated scale, so slicers have to guess; a 3MF says millimetres, and the model arrives at exactly the width you set on this page. Modern slicers all read it.",
          "It runs entirely in your browser — no upload, no account, no watermark.",
        ]}
        faq={FAQ}
        related={[
          { href: "/png-to-stl/", title: "PNG to STL", desc: "Same relief, STL output" },
          { href: "/image-to-color-stl/", title: "Image to Color STL", desc: "Keep the image's colors (PLY / GLB)" },
          { href: "/stl-to-3mf/", title: "STL to 3MF", desc: "Already have an STL? Repackage it" },
          { href: "/lithophane-generator/", title: "Lithophane Generator", desc: "Backlit photo prints" },
        ]}
      />
    </>
  );
}
