import type { Metadata } from "next";
import RenderImageTool, { type RenderConfig } from "@/components/RenderImageTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/stl-to-jpg/`;
const title = "STL to JPG — Free Online STL Renderer | No Signup Required";
const description =
  "Turn an STL into a JPG or PNG image in your browser. Render a thumbnail or preview picture of your 3D model — pick the angle, size and background. Free, instant, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "STL to JPG — Render an STL to an Image, Free",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STL to JPG — Free Online",
    description: "Render an STL to a JPG or PNG thumbnail. No upload, no signup.",
  },
};

const config: RenderConfig = {
  sourceFormat: "stl",
  imageFormat: "jpg",
  eyebrow: "STL → Image · Renderer",
  heading: "STL to JPG",
  intro:
    "Render an STL to a flat picture — a JPG, PNG or WebP you can drop into a listing, a README, a print queue or a spec sheet. Choose the camera angle, resolution and background, then download. Free and 100% local.",
  about: [
    "This is a renderer, not a mesh converter: the STL goes in, a raster image comes out. Nothing about the geometry is preserved in the file — it's a picture of the model.",
    "Pick isometric, front, top or right. The camera frames the model's bounding sphere, so every angle comes out at the same scale.",
    "Export up to 4096×4096. PNG and WebP keep a transparent background; JPG has no alpha channel, so it always gets a solid backdrop.",
    "STL files store triangles only — no color, material or texture — so the render is a single shaded material. That's the format, not a loading fault.",
    "It reads more than STL: drop an OBJ, GLB, 3MF, PLY, STEP, IGES, FBX or DAE and it renders those too.",
  ],
  faq: [
    {
      q: "How do I convert an STL to a JPG?",
      a: "Drop the .stl file above, pick a camera angle and resolution, then hit Download .jpg. The model is rendered in your browser with WebGL and saved straight to your device — no upload and no signup.",
    },
    {
      q: "Can I get a PNG instead of a JPG?",
      a: "Yes. Switch the image format to PNG (or WebP) before downloading. PNG and WebP also support a transparent background, which JPG cannot — JPEG has no alpha channel.",
    },
    {
      q: "Is this a way to make an STL thumbnail?",
      a: "Yes — that's the main use. Render at 512×512 or 1024×1024 with a transparent or light background and you have a thumbnail for a model listing, a wiki, a README or a print-farm queue.",
    },
    {
      q: "Can I turn the JPG back into an STL?",
      a: "Not the same model. A render throws away the 3D geometry — it is a flat picture. You can build a new relief from an image with the Image to STL tool, but that produces a heightmap, not the original mesh.",
    },
    {
      q: "Why is my rendered STL all one color?",
      a: "STL stores only triangle geometry. There is no color, material or texture data in the file, so every renderer shows it in a single shaded material. Convert to GLB or 3MF first if you need color to survive.",
    },
    {
      q: "Does my STL file get uploaded anywhere?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "What resolution can I export?",
      a: "Anything from 64 up to 4096 pixels per side, square or custom. There are one-click presets at 512², 1024², 2048² and 1920×1080. Very large sizes depend on your GPU's texture limit.",
    },
  ],
  links: [
    {
      href: "/stl-viewer/",
      title: "STL Viewer",
      desc: "Open and inspect the model before rendering",
    },
    {
      href: "/tools/print-checker/",
      title: "3D Print Checker",
      desc: "Check watertightness, size & overhangs before printing",
    },
    {
      href: "/stl-to-obj/",
      title: "STL → OBJ",
      desc: "Need a mesh, not a picture? Convert instead",
    },
    {
      href: "/image-to-stl/",
      title: "Image → STL",
      desc: "The other direction: turn a picture into a printable relief",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "STL to JPG Renderer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "STL to JPG", url: URL },
        ])}
      />
      <RenderImageTool config={config} />
    </>
  );
}
