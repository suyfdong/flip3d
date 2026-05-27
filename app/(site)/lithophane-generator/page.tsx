import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/lithophane-generator/`;
const title = "Lithophane Generator — Free Online Photo to STL | No Signup Required";
const description =
  "Make a 3D-printable lithophane from a photo in your browser. Dark areas print thicker so the image appears when backlit. Tune thickness and download an STL. Free, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Lithophane Generator — Free Online Photo to STL",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lithophane Generator — Free Online",
    description: "Turn a photo into a printable lithophane STL. 100% local.",
  },
};

export default function Page() {
  return <ImageToStlTool defaultMode="lithophane" variant="lithophane" />;
}
