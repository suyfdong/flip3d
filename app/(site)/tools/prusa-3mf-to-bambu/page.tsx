import type { Metadata } from "next";
import BambuPrusaTool from "@/components/BambuPrusaTool";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/tools/prusa-3mf-to-bambu/`;

export const metadata: Metadata = {
  title:
    "Prusa 3MF to Bambu 3MF Converter — Free Online | No Signup Required",
  description:
    "Convert PrusaSlicer .3mf files to a clean 3MF that Bambu Studio will open. Strips Prusa-private extensions, keeps geometry. Free, instant, 100% local.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Prusa 3MF → Bambu 3MF Converter",
    description:
      "Convert PrusaSlicer .3mf to a clean 3MF that Bambu Studio can import.",
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prusa 3MF → Bambu 3MF — Free Online",
    description:
      "Strip Prusa-private extensions so Bambu Studio opens your .3mf.",
  },
};

export default function Page() {
  return <BambuPrusaTool direction="prusa-to-bambu" />;
}
