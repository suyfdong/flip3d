import type { Metadata } from "next";
import ConverterPage from "@/components/ConverterPage";
import { buildConverterMetadata } from "@/lib/seo";

export const metadata: Metadata = buildConverterMetadata("fbx", "3mf");

export default function Page() {
  return <ConverterPage from="fbx" to="3mf" />;
}
