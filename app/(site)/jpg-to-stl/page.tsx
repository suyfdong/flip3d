import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
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

export default function Page() {
  return <ImageToStlTool defaultMode="relief" variant="jpg" />;
}
