import type { Metadata } from "next";
import ConverterPage from "@/components/ConverterPage";
import { buildConverterMetadata } from "@/lib/seo";

export const metadata: Metadata = buildConverterMetadata("wrl", "stl");

export default function Page() {
  return <ConverterPage from="wrl" to="stl" />;
}
