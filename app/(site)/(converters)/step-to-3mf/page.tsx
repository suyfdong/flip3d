import type { Metadata } from "next";
import ConverterPage from "@/components/ConverterPage";
import { buildConverterMetadata } from "@/lib/seo";

export const metadata: Metadata = buildConverterMetadata("step", "3mf");

export default function Page() {
  return <ConverterPage from="step" to="3mf" />;
}
