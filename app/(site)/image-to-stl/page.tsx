import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/image-to-stl/`;
const title = "Image to STL Converter — Free Online | No Signup Required";
const description =
  "Convert an image to a printable 3D STL in your browser. Brightness becomes height — make a relief or lithophane from PNG or JPG. Free, instant, 100% local.";

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

export default function Page() {
  return <ImageToStlTool defaultMode="relief" variant="image" />;
}
