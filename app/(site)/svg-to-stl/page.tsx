import type { Metadata } from "next";
import SvgToStlTool from "@/components/SvgToStlTool";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/svg-to-stl/`;
const title = "SVG to STL Converter — Free Online | No Signup Required";
const description =
  "Convert an SVG to a printable 3D STL in your browser. Extrude logos, icons and outlines to any depth — holes and counters preserved. Free, instant, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "SVG to STL — Free Online Extruder",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SVG to STL — Free Online",
    description: "Extrude an SVG logo or icon into a printable 3D STL. 100% local.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I convert an SVG to STL?",
    a: "Drop your .svg into the box above, set the width and extrude depth, then click Download .stl. The conversion runs entirely in your browser — nothing is uploaded.",
  },
  {
    q: "Is this SVG to STL converter free?",
    a: "Yes. It's free with no signup, no watermark, and no file-size paywall. Flip3D extrudes the SVG locally in your browser.",
  },
  {
    q: "Does it keep holes, like the inside of an O or A?",
    a: "Yes. The converter reads each path's fill rule and nests holes correctly, so counters and cut-outs stay open in the 3D model.",
  },
  {
    q: "My SVG came out empty — why?",
    a: "Outline-only (stroke) SVGs have no filled area to extrude. Give the paths a fill in your vector editor, or convert strokes to filled outlines first, then re-export.",
  },
  {
    q: "How do I keep separate pieces of my design joined?",
    a: "Turn on the base plate. A thin base (a few tenths of a millimetre) joins detached parts of the artwork into one printable body. Leave it at 0 to print them as separate pieces.",
  },
  {
    q: "Is my SVG file uploaded anywhere?",
    a: "No. There is no upload and no server. The file is parsed and extruded entirely on your device, and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(FAQ)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "SVG to STL", url: URL },
        ])}
      />
      <SvgToStlTool />

      <section className="border-t border-zinc-200 dark:border-zinc-800 py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            SVG to STL — FAQ
          </h2>
          <dl className="space-y-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {f.q}
                </dt>
                <dd className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
