import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/photo-to-stl/`;
const title = "Photo to STL — 3D Print a Photo Free Online | No Signup";
const description =
  "Turn a photo into a printable 3D STL in your browser. 3D print a photo as a relief or lithophane — brightness becomes height. Free, instant, 100% local, no upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Photo to STL — 3D Print a Photo, Free & Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Photo to STL — Free Online",
    description: "3D print a photo as a relief or lithophane. 100% local.",
  },
};

const ABOUT = [
  "To 3D print a photo, the image's brightness is turned into height: light pixels become tall, dark pixels stay low. Flip3D builds a watertight solid from that heightmap — a raised relief you can print flat, or a lithophane that reveals the picture when backlit.",
  "Everything runs in your browser with no upload. Drop a photo (PNG, JPG or WebP), adjust the size and thickness, preview it in 3D, and download a slicer-ready STL. Nothing is sent to a server and there's no signup or watermark.",
  "For a portrait or pet photo, a lithophane usually looks best — switch the mode and print it a few millimetres thick so the tones show through when lit from behind. For logos and high-contrast pictures, a plain relief prints cleanly.",
];

const FAQ = [
  {
    q: "How do I 3D print a photo?",
    a: "Drop your photo above, choose relief or lithophane, set the physical size and thickness, and download the STL. Slice and print it like any model. The brightness of each pixel sets how tall that spot is.",
  },
  {
    q: "Is converting a photo to STL free?",
    a: "Yes — free, no signup, no watermark, and no file-size paywall. The conversion runs locally in your browser with WebGL.",
  },
  {
    q: "What's the difference between a relief and a lithophane?",
    a: "A relief is a raised surface printed flat — light areas stick out. A lithophane inverts that so dark areas print thicker; when you backlight it, the photo appears in shades of light. Portraits look best as lithophanes.",
  },
  {
    q: "Does my photo get uploaded anywhere?",
    a: "No. There is no server and no upload. Your photo is read and converted entirely on your device, and nothing is stored.",
  },
  {
    q: "Which photos work best?",
    a: "Clear, well-lit photos with good contrast. High-detail shots produce fine surface texture; increase the resolution for more detail, or lower it if your slicer struggles with the triangle count.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="lithophane" variant="photo" />
      <SeoFaqSection
        crumbName="Photo to STL"
        crumbUrl={URL}
        aboutTitle="3D printing a photo"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/lithophane-generator/", title: "Lithophane Generator", desc: "Best mode for portraits — glows when backlit" },
          { href: "/picture-to-stl/", title: "Picture to STL", desc: "Same tool, framed for any picture" },
          { href: "/image-to-stl/", title: "Image to STL", desc: "The general image → 3D converter" },
          { href: "/tools/print-checker/", title: "3D Print Checker", desc: "Check the result before you print" },
        ]}
      />
    </>
  );
}
