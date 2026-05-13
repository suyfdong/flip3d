import type { Metadata } from "next";
import ConverterPage from "@/components/ConverterPage";
import { buildConverterMetadata } from "@/lib/seo";

export const metadata: Metadata = buildConverterMetadata("iges", "3mf");

export default function Page() {
  return <ConverterPage from="iges" to="3mf" />;
}
