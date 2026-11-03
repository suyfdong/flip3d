import type { Metadata } from "next";
import ConverterPage from "@/components/ConverterPage";
import { buildConverterMetadata } from "@/lib/seo";

export const metadata: Metadata = buildConverterMetadata("wrl", "ply");

export default function Page() {
  return <ConverterPage from="wrl" to="ply" />;
}
