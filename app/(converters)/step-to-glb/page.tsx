import type { Metadata } from "next";
import ConverterPage from "@/components/ConverterPage";
import { buildConverterMetadata } from "@/lib/seo";

export const metadata: Metadata = buildConverterMetadata("step", "glb");

export default function Page() {
  return <ConverterPage from="step" to="glb" />;
}
