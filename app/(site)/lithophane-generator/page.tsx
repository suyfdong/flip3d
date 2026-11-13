import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/lithophane-generator/`;
const title = "Lithophane Maker — Free Online Photo to STL | No Signup";
const description =
  "Make a 3D-printable lithophane from a photo in your browser. Dark areas print thicker so the image appears when backlit. Tune thickness and download an STL. Free, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Lithophane Maker — Free Online Photo to STL",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lithophane Maker — Free Online",
    description: "Turn a photo into a printable lithophane STL. 100% local.",
  },
};

const ABOUT = [
  "A lithophane is a picture you can only see when light passes through it. Instead of printing ink on paper, the photo is turned into varying plastic thickness: thin areas let a lot of light through and read as bright, thick areas block it and read as dark. Hold the finished print up to a lamp and the image appears, with real depth to it.",
  "This generator builds that thickness map from your photo and writes a watertight STL you can slice straight away. Each pixel's brightness becomes a height between the base thickness and the maximum thickness you set — dark pixels print thick, light pixels print thin. The defaults (0.8 mm base, 3 mm maximum, 100 mm wide) match the range that most FDM printers render well, and you can move all three.",
  "Two limits are worth knowing before you start. This is a height map, not a 3D reconstruction — the model has the shape of your photo, not the shape of the thing in the photo, so it won't produce a bust from a portrait. And the output is a single material with one colour: colour lithophanes need a different technique (stacked CMYK or filament painting), which this tool does not do.",
];

const FAQ = [
  {
    q: "What is a lithophane?",
    a: "A lithophane is a thin 3D print whose thickness encodes a photograph. Light passing through the plastic reveals the image: thin sections glow and thick sections stay dark. They've existed since the 1820s in porcelain, and 3D printing made them easy to produce at home.",
  },
  {
    q: "How thick should a lithophane be?",
    a: "The defaults are a good starting point: 0.8 mm at the thinnest and 3 mm at the thickest. Going below roughly 0.6 mm gets fragile and can show layer noise instead of an image; going above 3–4 mm makes the print so opaque that you need a very strong light. Increase the maximum thickness for a photo with strong contrast, reduce it for a soft, low-contrast one.",
  },
  {
    q: "Which photos make the best lithophanes?",
    a: "Well-lit portraits and single subjects with clear separation from the background. Faces in particular read very well because the tones are smooth. Avoid photos that are mostly dark (they print mostly thick and stay muddy) or overloaded with fine detail — a busy background turns into noise once the resolution of the print runs out. Cropping tight is usually better than leaving a lot of background.",
  },
  {
    q: "How do I print a lithophane?",
    a: "Print it standing vertically, not lying flat — that's what makes the layer lines run horizontally across the image instead of stacking into visible steps. Use 100% infill, 0.1–0.12 mm layers, no supports and a brim for adhesion. White or translucent filament works best; black and dark colours swallow the light. Backlight it with a small LED panel or a lamp a few centimetres behind the print.",
  },
  {
    q: "What size should I make it?",
    a: "100 mm wide is the default and a good size for a portrait or a small gift. Larger prints show more detail but get floppier and take much longer — a 150 mm lithophane can run into many hours. Below about 60 mm the print can't hold enough tonal detail to look like a photo.",
  },
  {
    q: "Can I make a colour lithophane?",
    a: "Not with this tool. The output is a single-material thickness map, so it is monochrome by construction — the image comes from light transmission, not pigment. Colour lithophanes need a different workflow (stacked CMYK filament swaps, or painting a thickness map by hand), and nothing here should imply otherwise.",
  },
  {
    q: "Does my photo get uploaded anywhere?",
    a: "No. The photo is read and turned into geometry on your own device using WebGL and canvas, and the STL is generated in the browser. There is no server, no account and no storage — nothing leaves your machine.",
  },
];

const STEPS = [
  {
    title: "Drop a photo",
    body: "PNG, JPG, JPEG or WebP. The tool reads brightness only, so colour or greyscale makes no difference. If your photo is landscape and the subject is small, crop it first.",
  },
  {
    title: "Set the width and thickness",
    body: "Width is the physical size of the finished print. Base thickness is the thinnest point — the brightest highlight; maximum thickness is the darkest. The preview updates as you move the sliders.",
  },
  {
    title: "Check it in 3D",
    body: "The mesh is watertight with a flat back, so it is ready to slice as soon as it looks right. If the image is upside down or mirrored in your slicer, that is the slicer's orientation, not the geometry.",
  },
  {
    title: "Download and print standing up",
    body: "Download the STL, then in your slicer stand it vertically, set 100% infill and 0.1–0.12 mm layers, and turn off supports. A brim helps tall, thin prints stay attached.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="lithophane" variant="lithophane" />
      <SeoFaqSection
        crumbName="Lithophane Generator"
        crumbUrl={URL}
        aboutTitle="How a lithophane works"
        about={ABOUT}
        stepsTitle="Make a lithophane from a photo"
        steps={STEPS}
        faq={FAQ}
        related={[
          {
            href: "/photo-to-stl/",
            title: "Photo to STL",
            desc: "Same tool, with relief as the default",
          },
          {
            href: "/image-to-stl/",
            title: "Image to STL",
            desc: "Relief or lithophane from any image",
          },
          {
            href: "/tools/print-checker/",
            title: "3D Print Checker",
            desc: "Check thickness and bed fit before printing",
          },
          {
            href: "/reference/bambu-vs-prusa/",
            title: "Bambu vs Prusa",
            desc: "Slicers and print settings worth knowing",
          },
        ]}
      />
    </>
  );
}
