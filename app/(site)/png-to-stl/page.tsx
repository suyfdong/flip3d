import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/png-to-stl/`;
const title = "PNG to STL Converter — Free Online | No Signup Required";
const description =
  "Convert a PNG to a printable 3D STL in your browser. Brightness becomes height for a relief or lithophane; transparency flattens to the base. Free, instant, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "PNG to STL — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PNG to STL — Free Online",
    description: "Turn a PNG into a printable 3D relief or lithophane. 100% local.",
  },
};

const FAQ = [
  {
    q: "How do I convert a PNG to STL?",
    a: "Drop your .png above, pick relief or lithophane, set the size and thickness, and download the STL. Brightness becomes height; transparent pixels flatten to the base of the model.",
  },
  {
    q: "What happens to transparency in a PNG?",
    a: "Transparent (alpha) areas are treated as the base level, so cut-out PNGs keep a clean flat background instead of a raised block. Opaque areas are raised by their brightness.",
  },
  {
    q: "Why does my PNG STL come out almost flat?",
    a: "Height comes from brightness, so an image whose tones sit in a narrow band gives a nearly flat relief. Raise the height/thickness setting, or start from a higher-contrast PNG — a flat result means the source had little to work with, not that the conversion failed.",
  },
  {
    q: "Is the PNG to STL converter free?",
    a: "Yes — free, no signup, no watermark, and no file-size paywall. It converts locally in your browser.",
  },
  {
    q: "Does my PNG get uploaded?",
    a: "No. There is no server and no upload — the PNG is converted on your device and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="png" />
      <SeoFaqSection
        crumbName="PNG to STL"
        crumbUrl={URL}
        aboutTitle="Converting a PNG to STL"
        about={[
          "A PNG-to-STL converter maps pixel brightness to height and builds a watertight 3D solid from it. PNG is a good source because it's lossless and supports transparency: opaque areas rise by their brightness while transparent areas flatten to the base, so logos and icons come out clean.",
          "Drop your PNG, choose a relief or a backlit lithophane, set the width and thickness, preview in 3D, and download a slicer-ready STL. It runs entirely in your browser — no upload, no signup, no watermark.",
        ]}
        faq={FAQ}
      />
    </>
  );
}
