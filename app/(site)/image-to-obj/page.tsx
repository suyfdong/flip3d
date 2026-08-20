import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/image-to-obj/`;
const title = "Image to OBJ Converter — Free Online | No Signup Required";
const description =
  "Convert an image to a 3D OBJ model in your browser. Brightness becomes height — turn a PNG, JPG or WebP into a Wavefront OBJ relief. Free, instant, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Image to OBJ — Free Online Heightmap Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to OBJ — Free Online",
    description: "Turn any image into a 3D OBJ relief mesh. 100% local, no signup.",
  },
};

export default function Page() {
  return <ImageToStlTool defaultMode="relief" variant="image" targetFormat="obj" />;
}
