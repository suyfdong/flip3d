import type { Metadata } from "next";
import StlRepairTool from "@/components/StlRepairTool";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/tools/stl-repair/`;

export const metadata: Metadata = {
  title: "Free Online STL Repair — Mesh Cleanup in Your Browser | Flip3D",
  description:
    "Welds duplicate vertices, removes degenerate triangles, detects holes and non-manifold edges. Fixes the most common 'slicer can't read this STL' issues. Free, instant, 100% local.",
  alternates: { canonical: URL },
  openGraph: {
    title: "STL Repair — Free Online Mesh Cleanup",
    description:
      "Weld duplicate vertices, remove degenerate triangles, detect holes. 100% in your browser.",
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STL Repair — Free Online",
    description: "Mesh cleanup that fixes slicer-blocking STL issues.",
  },
};

export default function Page() {
  return <StlRepairTool />;
}
