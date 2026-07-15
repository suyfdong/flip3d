import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/picture-to-stl/`;
const title = "Picture to STL Converter — 3D Print a Picture Free | No Signup";
const description =
  "Convert a picture to a printable 3D STL in your browser. 3D print a picture as a relief or lithophane — brightness becomes height. Free, instant, 100% local, no upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Picture to STL — 3D Print a Picture, Free & Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Picture to STL — Free Online",
    description: "Convert a picture to STL and 3D print it. 100% local.",
  },
};

const ABOUT = [
  "This converter turns a picture into a 3D model by mapping brightness to height: bright parts of the picture rise, dark parts stay low. The result is a watertight STL solid — a relief to print flat, or a lithophane that shows the picture when backlit.",
  "It all runs in your browser. Drop a picture (PNG, JPG or WebP), set the width and thickness, preview the 3D result, and download a slicer-ready STL. There's no upload, no signup, and no watermark.",
  "Want the output in another format or need to check it before printing? Convert to OBJ instead, or run the result through the 3D print checker for watertightness and size — links are on the tool.",
];

const FAQ = [
  {
    q: "How do I 3D print a picture?",
    a: "Drop your picture above, pick relief or lithophane, set the size and thickness, and download the STL. Then slice and print it. Each pixel's brightness controls how tall that point is.",
  },
  {
    q: "Can I convert a picture to STL for free?",
    a: "Yes — it's free with no signup, no watermark, and no file-size limit beyond 200MB. The conversion happens locally in your browser.",
  },
  {
    q: "What picture formats are supported?",
    a: "PNG, JPG/JPEG and WebP. For PNG, transparent areas flatten to the base of the model.",
  },
  {
    q: "Is my picture uploaded to a server?",
    a: "No. There is no upload and no server — the picture is converted entirely on your device and nothing is stored.",
  },
  {
    q: "The model has too many triangles for my slicer — what do I do?",
    a: "Lower the resolution in the tool, which produces a lighter mesh. High-resolution pictures create very dense meshes; reducing resolution keeps the STL slicer-friendly while preserving the overall shape.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="picture" />
      <SeoFaqSection
        crumbName="Picture to STL"
        crumbUrl={URL}
        aboutTitle="3D printing a picture"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/photo-to-stl/", title: "Photo to STL", desc: "Framed for photos and portraits" },
          { href: "/image-to-stl/", title: "Image to STL", desc: "The general image → 3D converter" },
          { href: "/lithophane-generator/", title: "Lithophane Generator", desc: "Backlit prints that reveal the picture" },
          { href: "/image-to-obj/", title: "Image to OBJ", desc: "Same pipeline, OBJ output" },
        ]}
      />
    </>
  );
}
