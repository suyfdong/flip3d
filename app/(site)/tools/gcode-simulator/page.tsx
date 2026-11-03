import type { Metadata } from "next";
import GcodeSimulator from "@/components/GcodeSimulator";
import SeoFaqSection from "@/components/SeoFaqSection";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/tools/gcode-simulator/`;
const description =
  "Free online G-code viewer: drop a sliced .gcode file to see the toolpath in 3D, scrub layer by layer, and read print time and filament use. Bambu, Prusa, Orca and Cura files, arcs included. No signup.";

export const metadata: Metadata = {
  title: "G-code Viewer & Simulator — Free Online .gcode Preview in 3D",
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "G-code Viewer & Simulator — Preview Print Toolpaths Online",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "G-code Viewer — Free Online",
    description: "Preview .gcode toolpaths in 3D before you start the print.",
  },
};

const ABOUT = [
  "A G-code file is the list of moves your printer will actually make, so it's the last chance to catch a problem before a long print: a missing layer, supports where you didn't want them, a first layer that doesn't reach the bed. Drop the .gcode here and the toolpath is drawn in 3D — extrusion moves in colour, travel moves separately — with a slider to scrub through the print layer by layer.",
  "The panel reads the numbers you'd want before committing a spool: estimated print time, filament length and weight, layer count and the size of the printed area, plus which slicer produced the file.",
  "It reads output from Bambu Studio, OrcaSlicer, PrusaSlicer, SuperSlicer and Cura, including arc moves (G2/G3) written when arc fitting is turned on, relative and absolute extrusion, and the slicers' own layer markers. Binary G-code (.bgcode from newer Prusa printers) isn't supported — export plain .gcode instead.",
];

const FAQ = [
  {
    q: "How do I view a G-code file online?",
    a: "Drop the .gcode (or .gco / .g / Bambu .gcode.3mf) file into the box above. The toolpath appears in 3D straight away — drag to rotate, scroll to zoom, and use the slider to step through the layers. Nothing is uploaded.",
  },
  {
    q: "Is this G-code viewer free?",
    a: "Yes. Free, no signup and no file limit — it runs entirely in your browser.",
  },
  {
    q: "Can it open Bambu Lab and OrcaSlicer G-code?",
    a: "Yes — plain .gcode and Bambu's sliced .gcode.3mf (File → Export → Export plate sliced file) both open; for a multi-plate file the first plate is shown. Arc moves (G2/G3) from arc fitting are drawn as arcs. An unsliced .3mf project has no G-code yet — open it in the 3MF Viewer instead.",
  },
  {
    q: "How accurate is the print time estimate?",
    a: "It's computed from the moves and their feed rates, without the printer's acceleration and jerk limits, so it usually reads shorter than the slicer's own estimate. Use it to compare files, and the slicer's number for planning.",
  },
  {
    q: "Can it convert G-code back to STL?",
    a: "No. G-code holds the nozzle path, not the model's surface, so turning it back into a solid is only an approximation. Keep the original STL or 3MF — or open it in the STL viewer.",
  },
  {
    q: "What about .bgcode files?",
    a: "Binary G-code from Prusa's newer printers isn't supported yet. In PrusaSlicer, turn off binary G-code in Printer Settings → General, or export plain .gcode.",
  },
  {
    q: "Is my G-code uploaded anywhere?",
    a: "No. The file is parsed and drawn on your own device.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={softwareAppSchema({ name: "G-code Viewer & Simulator", description, url: URL })} />
      <GcodeSimulator />
      <SeoFaqSection
        crumbName="G-code Viewer"
        crumbUrl={URL}
        aboutTitle="Previewing G-code before you print"
        about={ABOUT}
        faq={FAQ}
        related={[
          { href: "/tools/print-checker/", title: "3D Print Checker", desc: "Check the model before slicing" },
          { href: "/3mf-viewer/", title: "3MF Viewer", desc: "Open the Bambu / Prusa project itself" },
          { href: "/stl-viewer/", title: "STL Viewer", desc: "Look at the original model" },
          { href: "/tools/3d-model-compressor/", title: "3D Model Compressor", desc: "Lighten a heavy STL before slicing" },
        ]}
      />
    </>
  );
}
