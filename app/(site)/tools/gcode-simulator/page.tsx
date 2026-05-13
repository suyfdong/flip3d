import type { Metadata } from "next";
import GcodeSimulator from "@/components/GcodeSimulator";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/tools/gcode-simulator/`;

export const metadata: Metadata = {
  title:
    "Free Online G-code Simulator — Preview .gcode in 3D | Flip3D",
  description:
    "Drag a sliced .gcode file to preview the toolpath in your browser. Print time, filament weight, layer-by-layer scrubbing. Bambu, Prusa, Orca, Cura supported. No signup.",
  alternates: { canonical: URL },
  openGraph: {
    title: "G-code Simulator — Preview Print Toolpaths Online",
    description:
      "3D preview of any .gcode with timeline scrubbing, time and filament estimates.",
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "G-code Simulator — Free Online",
    description: "Preview .gcode toolpaths in 3D before you start the print.",
  },
};

export default function Page() {
  return <GcodeSimulator />;
}
