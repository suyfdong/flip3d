import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/jpg-to-stl/`;
const title = "JPG to STL Converter — Free Online | No Signup Required";
const description =
  "Convert a JPG photo to a printable 3D STL in your browser. Brightness becomes height for a relief or lithophane. Free, instant, 100% local — no upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "JPG to STL — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JPG to STL — Free Online",
    description: "Turn a JPG photo into a printable 3D relief or lithophane. 100% local.",
  },
};

const FAQ = [
  {
    q: "How do I convert a JPG to STL?",
    a: "Drop your .jpg or .jpeg above, choose relief or lithophane, set the size and thickness, and download the STL. Each pixel's brightness sets how tall that point is.",
  },
  {
    q: "Does it take WebP files too?",
    a: "Yes. Phone screenshots and downloaded images are often .webp now, so the same box accepts WebP alongside JPG and PNG. Drop it straight in — no need to re-save it as a JPG first.",
  },
  {
    q: "Can I 3D print a photo from a JPG?",
    a: "Yes — JPG is the usual format for photos. For a portrait or pet photo, use lithophane mode and print it a few millimetres thick so the image appears when backlit.",
  },
  {
    q: "Is the JPG to STL converter free?",
    a: "Yes — free, no signup, no watermark, and no file-size paywall. It converts locally in your browser.",
  },
  {
    q: "Does my JPG get uploaded anywhere?",
    a: "No. There is no server and no upload — the JPG is converted on your device and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="jpg" />
      <SeoFaqSection
        crumbName="JPG to STL"
        crumbUrl={URL}
        aboutTitle="Converting a JPG to STL"
        about={[
          "A JPG-to-STL converter turns a photo into a 3D print by mapping brightness to height. JPG is the common format for photographs, so it's ideal for making a relief or a backlit lithophane from a picture or portrait.",
          "Drop the JPG, pick relief or lithophane, set the width and thickness, preview in 3D, and download a slicer-ready STL. Because JPG has no transparency, the whole frame becomes part of the model — crop it first if you only want the subject. It all runs in your browser: no upload, no signup, no watermark.",
        ]}
        faq={FAQ}
      />
    </>
  );
}
