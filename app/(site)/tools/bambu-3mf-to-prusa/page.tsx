import type { Metadata } from "next";
import BambuPrusaTool from "@/components/BambuPrusaTool";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/tools/bambu-3mf-to-prusa/`;

export const metadata: Metadata = {
  title:
    "Bambu 3MF to Prusa 3MF Converter — Free Online | No Signup Required",
  description:
    "Convert Bambu Studio .3mf files to PrusaSlicer-compatible 3MF in your browser. Strips Bambu-private metadata, keeps geometry. Free, instant, 100% local.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Bambu 3MF → Prusa 3MF Converter",
    description:
      "Convert Bambu Studio .3mf to PrusaSlicer-compatible 3MF in your browser.",
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bambu 3MF → Prusa 3MF — Free Online",
    description: "Strip Bambu-private metadata so PrusaSlicer can open your .3mf.",
  },
};

export default function Page() {
  return <BambuPrusaTool direction="bambu-to-prusa" />;
}
