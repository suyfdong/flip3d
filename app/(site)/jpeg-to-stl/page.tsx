import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/jpeg-to-stl/`;
const title = "JPEG to STL Converter — Free Online | No Signup Required";
const description =
  "Convert a .jpeg to a printable 3D STL in your browser. Free JPEG to STL converter — brightness becomes height for a relief or lithophane. Instant, 100% local, no upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "JPEG to STL — Free Online Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JPEG to STL — Free Online",
    description: "Turn a .jpeg into a printable 3D relief or lithophane. 100% local.",
  },
};

// Deliberately NOT a copy of /jpg-to-stl. Same engine, different page: this one
// answers the ".jpeg vs .jpg" question people actually arrive with, and leans on
// the compression-artifact problem, which is specific and genuinely useful for a
// heightmap (JPEG blocking becomes visible bumps in the relief).
const FAQ = [
  {
    q: "Is .jpeg different from .jpg?",
    a: "No — they are the same format, just two spellings of the same extension. The three-letter .jpg dates from an era when file extensions were capped at three characters; scanners, macOS exports and email attachments often keep the full .jpeg. You do not need to rename anything: drop either one in and it converts identically.",
  },
  {
    q: "How do I convert a JPEG to STL?",
    a: "Drop your .jpeg above, pick relief or lithophane, set the physical width and thickness, then download the STL. Each pixel's brightness sets how tall that point is, so a light area rises and a dark area stays low.",
  },
  {
    q: "Why does my printed relief look grainy or blocky?",
    a: "That is usually JPEG compression showing through. JPEG throws away detail in 8×8 pixel blocks, and a heightmap turns every one of those brightness steps into real geometry — so compression artifacts become visible ridges and squares on the print. Start from the highest-quality JPEG you have (or a PNG), avoid re-saving it repeatedly, and lower the Detail slider to smooth the worst of it.",
  },
  {
    q: "What size JPEG should I use?",
    a: "Around 1000–2000 pixels on the long edge is the sweet spot. Below that the relief loses detail; far above it you mostly add triangles without adding anything the printer can resolve, since a 0.4 mm nozzle cannot reproduce pixel-level detail anyway.",
  },
  {
    q: "Can I open the result in Tinkercad?",
    a: "Yes. Tinkercad imports STL, so download the file here and use Import in Tinkercad to bring it in and combine it with other shapes. Keep the model modest in size — Tinkercad rejects very large imports, so lower the Detail slider if the file is too big.",
  },
  {
    q: "Does it work with PNG, JPG and WebP too?",
    a: "Yes, the same box accepts all of them. A PNG is worth choosing when you have one, because it is lossless and has no compression artifacts to bake into the relief.",
  },
  {
    q: "Is the JPEG to STL converter free?",
    a: "Yes — free, no signup, no watermark, and no file-size paywall. It converts locally in your browser.",
  },
  {
    q: "Does my JPEG get uploaded anywhere?",
    a: "No. There is no server and no upload — the JPEG is converted on your device and nothing is stored.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="jpeg" />
      <SeoFaqSection
        crumbName="JPEG to STL"
        crumbUrl={URL}
        aboutTitle="Converting a .jpeg to STL"
        about={[
          "This is a free JPEG to STL converter: it reads the brightness of every pixel in your .jpeg and turns it into height, producing a watertight 3D solid you can slice and print. Use relief mode for a raised emboss you print flat, or lithophane mode for a panel that reveals the image when it is backlit.",
          "One thing matters more with JPEG than with any other input: compression. JPEG is lossy, and a heightmap converts brightness differences directly into geometry — so the block artifacts a heavily compressed JPEG contains end up as physical ridges on the print. The fix is simple: start from the best-quality original you have rather than a re-saved or messaged copy.",
          "Everything runs locally in your browser. There is no upload, no account and no watermark, and the exported STL opens in Bambu Studio, PrusaSlicer, Cura, Tinkercad and anything else that reads STL.",
        ]}
        faq={FAQ}
        related={[
          { href: "/jpg-to-stl/", title: "JPG to STL", desc: "Same engine, .jpg landing page" },
          { href: "/png-to-stl/", title: "PNG to STL", desc: "Lossless source — no compression artifacts" },
          { href: "/lithophane-generator/", title: "Lithophane Generator", desc: "Backlit photo prints that glow when lit" },
          { href: "/image-to-stl/", title: "Image to STL", desc: "Any image format, relief or lithophane" },
        ]}
      />
    </>
  );
}
