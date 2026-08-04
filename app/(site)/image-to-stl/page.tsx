import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/image-to-stl/`;
const title = "Image to STL Converter — Free Online | No Signup Required";
const description =
  "Convert an image to a printable 3D STL in your browser. Turn a photo or picture into a relief or lithophane — brightness becomes height. Free 2D to 3D, instant, 100% local, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Image to STL — Free Online Heightmap & Lithophane Maker",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to STL — Free Online",
    description: "Turn any image into a printable 3D relief or lithophane. 100% local.",
  },
};

const FAQ = [
  {
    q: "How do I convert an image to STL?",
    a: "Drop your image (PNG, JPG or WebP) above, choose relief or lithophane, set the size and thickness, and download the STL. Brightness is turned into height, so light areas rise and dark areas stay low.",
  },
  {
    q: "Can I 3D print a photo or picture with this?",
    a: "Yes. This is a 2D-to-3D converter — a photo, picture, logo or drawing all work. For a portrait, use lithophane mode so the image shows when backlit; for logos, a plain relief prints cleanly.",
  },
  {
    q: "Is this the same as an \"img to STL\" converter?",
    a: "Yes — img, image, photo and picture all mean the same thing here. Any PNG, JPG or WebP goes in the same box and comes out as an STL.",
  },
  {
    q: "Is the image to STL converter free?",
    a: "Yes — free, no signup, no watermark, and no file-size paywall. It runs locally in your browser with WebGL.",
  },
  {
    q: "Does my image get uploaded anywhere?",
    a: "No. There is no server and no upload. The image is converted entirely on your device and nothing is stored.",
  },
  {
    q: "Can I export OBJ instead of STL?",
    a: "Yes. The same heightmap pipeline can output a Wavefront OBJ — use the Image to OBJ page if your workflow needs OBJ.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="image" />
      <SeoFaqSection
        crumbName="Image to STL"
        crumbUrl={URL}
        aboutTitle="Converting an image to STL (2D to 3D)"
        about={[
          "An image-to-STL converter maps brightness to height: each pixel's lightness sets how tall that point is, producing a 3D surface from a flat image. Flip3D turns that heightmap into a watertight solid — a raised relief to print flat, or a lithophane that reveals the image when backlit.",
          "It's a 2D-to-3D workflow that works for photos, pictures, logos and line drawings. Drop the image, tune the width, base and max thickness, preview it in 3D, and download a slicer-ready STL. Everything is local: no upload, no signup, no watermark.",
        ]}
        faq={FAQ}
        related={[
          { href: "/photo-to-stl/", title: "Photo to STL", desc: "3D print a photo as a relief or lithophane" },
          { href: "/picture-to-stl/", title: "Picture to STL", desc: "Turn any picture into a printable STL" },
          { href: "/lithophane-generator/", title: "Lithophane Generator", desc: "Backlit photo prints that glow when lit" },
          { href: "/image-to-obj/", title: "Image to OBJ", desc: "Same pipeline, Wavefront OBJ output" },
        ]}
      />
    </>
  );
}
