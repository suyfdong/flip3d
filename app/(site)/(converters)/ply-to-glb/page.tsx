import type { Metadata } from "next";
import ConverterPage from "@/components/ConverterPage";
import { buildConverterMetadata } from "@/lib/seo";

export const metadata: Metadata = buildConverterMetadata("ply", "glb");

export default function Page() {
  return <ConverterPage from="ply" to="glb" />;
}
