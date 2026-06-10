import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/png-to-obj/`;
const title = "PNG to OBJ Converter — Free Online | No Signup Required";
const description =
  "Convert a PNG to a 3D OBJ mesh in your browser. Brightness becomes height for a relief; transparency flattens to the base. Free, instant, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "PNG to OBJ — Free Online Heightmap Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PNG to OBJ — Free Online",
    description: "Turn a PNG into a 3D OBJ relief mesh. 100% local, no signup.",
  },
};

export default function Page() {
  return <ImageToStlTool defaultMode="relief" variant="png" targetFormat="obj" />;
}
