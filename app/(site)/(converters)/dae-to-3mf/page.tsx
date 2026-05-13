import type { Metadata } from "next";
import ConverterPage from "@/components/ConverterPage";
import { buildConverterMetadata } from "@/lib/seo";

export const metadata: Metadata = buildConverterMetadata("dae", "3mf");

export default function Page() {
  return <ConverterPage from="dae" to="3mf" />;
}
