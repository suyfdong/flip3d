import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
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

export default function Page() {
  return <ImageToStlTool defaultMode="relief" variant="png" />;
}
