import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/png-to-obj/`;
const title = "PNG to OBJ Converter — Free Online | No Signup Required";
const description =
  "Convert a PNG to a 3D OBJ mesh in your browser. Brightness becomes height for a relief; transparency flattens to the base. Free, instant, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "PNG to OBJ — Free Online Heightmap Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PNG to OBJ — Free Online",
    description: "Turn a PNG into a 3D OBJ relief mesh. 100% local, no signup.",
  },
};

const ABOUT = [
  "PNG is the best source format for this job, for two reasons. It is lossless, so the brightness values you see are the brightness values the converter samples — a JPEG's compression artefacts would otherwise turn into real bumps in the mesh. And it has a real alpha channel, which the converter treats as a shape mask: every transparent pixel sits flat on the base plate, so a logo cut-out comes out as a logo-shaped solid instead of a rectangle with a faint ghost of the logo on it.",
  "When the PNG has a transparent background, a \"Flat logo shape\" option appears and switches on automatically. Leave it on for logos, icons, keychains and signs: the opaque shape rises to full height with a flat top, which is what you want for a two-colour print or a single-colour embossed plate. Turn it off to raise the shape by brightness instead, which is right for photos and textured artwork.",
  "The output is a Wavefront OBJ — ASCII geometry with normals and UVs, no .mtl and no materials. One OBJ-specific caveat: neither OBJ nor our exporter has a place for the PNG's colours in a single file, so if colour matters, switch on \"Keep the image's colors\" and the tool will write PLY or GLB instead.",
];

const STEPS = [
  {
    title: "Export the logo with a transparent background",
    body: "In your design tool, hide the background layer and export PNG. A white rectangle behind the logo counts as opaque pixels and will print as a raised block.",
  },
  {
    title: "Drop it above and check the shape",
    body: "The transparent-background detector should switch \"Flat logo shape\" on. The preview should show your logo standing proud of a thin base plate, not a textured rectangle.",
  },
  {
    title: "Set width and base thickness",
    body: "Width is the finished size. A base of 1–2 mm is enough for a keychain or a sign; go thicker if the piece is large and handled a lot.",
  },
  {
    title: "Download the OBJ (or switch to STL)",
    body: "Take the OBJ for Blender or a game engine. If you're printing, the STL version of this exact tool produces a smaller file for the same geometry.",
  },
];

const FAQ = [
  {
    q: "What happens to the transparent parts of my PNG?",
    a: "They stay at the base thickness — they never rise. That makes transparency a free shape mask: cut the background out and the mesh follows the outline. Partially transparent pixels are handled too, but hard-edged cut-outs give the cleanest walls.",
  },
  {
    q: "Can I use this to turn a logo into a keychain or a sign?",
    a: "Yes, that is the main use. Export the logo as a PNG with a transparent background, keep \"Flat logo shape\" on, and set width to the real size you want. For a key-ring hole, either subtract a cylinder in your slicer or cut it in a modelling app — a transparent circle in the PNG lowers to the base plate but does not cut through it.",
  },
  {
    q: "Does the OBJ keep the PNG's colours?",
    a: "No. The OBJ contains geometry only, with no .mtl and no vertex colours. The tool offers a colour route instead: turn on \"Keep the image's colors\" and it exports PLY or GLB, which do store per-vertex colour. STL and 3MF cannot store it at all.",
  },
  {
    q: "Why did my PNG come out almost flat?",
    a: "Height comes from brightness, so an image whose tones sit in a narrow range produces a shallow relief. Increase \"Max thickness\" or start from a higher-contrast PNG. If the PNG has a transparent background and the flat-logo option is on, the shape is meant to be flat on top — that is the mode working, not failing.",
  },
  {
    q: "Is the OBJ file editable afterwards?",
    a: "Yes — it is plain ASCII, so you can open it in Blender, Maya, Unity or any script that reads OBJ. The mesh is a dense triangle grid (square-ish quads split into triangles), so sculpting works but clean topology does not come for free.",
  },
  {
    q: "Is my PNG uploaded anywhere?",
    a: "No. It is decoded on your device and the mesh is built in the browser. There is no server, no account and no watermark on the output.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="png" targetFormat="obj" />
      <SeoFaqSection
        crumbName="PNG to OBJ"
        crumbUrl={URL}
        aboutTitle="PNG to OBJ, and why transparency matters"
        about={ABOUT}
        stepsTitle="Turning a logo PNG into a printable solid"
        steps={STEPS}
        faq={FAQ}
        related={[
          {
            href: "/png-to-stl/",
            title: "PNG to STL",
            desc: "Same geometry, smaller binary file for printing",
          },
          {
            href: "/image-to-obj/",
            title: "Image to OBJ",
            desc: "The general image → OBJ converter",
          },
          {
            href: "/png-to-3mf/",
            title: "PNG to 3MF",
            desc: "Opens at the right size in any slicer",
          },
          {
            href: "/tools/print-checker/",
            title: "3D Print Checker",
            desc: "Verify the mesh before you print it",
          },
        ]}
      />
    </>
  );
}
