import type { Metadata } from "next";
import ConverterPage from "@/components/ConverterPage";
import { buildConverterMetadata } from "@/lib/seo";

export const metadata: Metadata = buildConverterMetadata("glb", "ply");

export default function Page() {
  return <ConverterPage from="glb" to="ply" />;
}
