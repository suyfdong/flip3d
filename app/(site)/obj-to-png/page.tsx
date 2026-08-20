import type { Metadata } from "next";
import RenderImageTool, { type RenderConfig } from "@/components/RenderImageTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/obj-to-png/`;
const title = "OBJ to PNG — Free Online OBJ Renderer | No Signup Required";
const description =
  "Render an OBJ to a PNG image in your browser, with a transparent background if you want one. Pick the angle, resolution and format. Free, instant, 100% local — no upload, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "OBJ to PNG — Render an OBJ to an Image, Free",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OBJ to PNG — Free Online",
    description: "Render an OBJ to a transparent PNG. No upload, no signup.",
  },
};

const config: RenderConfig = {
  sourceFormat: "obj",
  imageFormat: "png",
  eyebrow: "OBJ → Image · Renderer",
  heading: "OBJ to PNG",
  intro:
    "Render a Wavefront OBJ to a PNG — with a transparent background, at the angle and resolution you pick. Good for product shots, docs, catalogue thumbnails and asset previews. Free and 100% local.",
  about: [
    "This is a renderer, not a mesh converter: the OBJ goes in, a raster image comes out. The result is a picture, not geometry.",
    "PNG keeps a real alpha channel, so the model can sit on a transparent background and drop cleanly onto any page. WebP does the same; JPG cannot.",
    "Pick isometric, front, top or right. The camera frames the model's bounding sphere, so switching angles never changes the scale.",
    "An OBJ's colors live in a separate .mtl file, which isn't part of the .obj you drop here — so an untextured OBJ renders in a single shaded material.",
    "It reads more than OBJ: drop an STL, GLB, 3MF, PLY, STEP, IGES, FBX or DAE and it renders those too.",
  ],
  faq: [
    {
      q: "How do I convert an OBJ to a PNG?",
      a: "Drop the .obj file above, choose a camera angle and resolution, then hit Download .png. The model is rendered locally in your browser with WebGL — nothing is uploaded.",
    },
    {
      q: "Can I get a PNG with a transparent background?",
      a: "Yes — transparent is the default background for PNG. The alpha channel is preserved, so the model can be layered over any color or image afterwards.",
    },
    {
      q: "Why is my OBJ rendering without its colors or texture?",
      a: "An OBJ references its materials from a separate .mtl file and its textures from image files next to it. Dropping the .obj alone gives the renderer geometry but no materials, so it uses a single shaded color. Convert to GLB first if you need the textures baked into one file.",
    },
    {
      q: "Can I turn the PNG back into an OBJ?",
      a: "Not the same model — a render discards the 3D geometry. The Image to STL tool can build a new heightmap relief from a picture, but it will not reconstruct the original mesh.",
    },
    {
      q: "Does my OBJ file get uploaded anywhere?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "What resolution can I export?",
      a: "64 up to 4096 pixels per side, square or custom, with one-click presets at 512², 1024², 2048² and 1920×1080.",
    },
  ],
  links: [
    {
      href: "/obj-viewer/",
      title: "OBJ Viewer",
      desc: "Open and inspect the model before rendering",
    },
    {
      href: "/obj-to-glb/",
      title: "OBJ → GLB",
      desc: "Bake materials and textures into one file",
    },
    {
      href: "/obj-to-stl/",
      title: "OBJ → STL",
      desc: "Need a mesh, not a picture? Convert instead",
    },
    {
      href: "/glb-to-png/",
      title: "GLB → PNG",
      desc: "Same renderer, GLB source with materials",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "OBJ to PNG Renderer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "OBJ to PNG", url: URL },
        ])}
      />
      <RenderImageTool config={config} />
    </>
  );
}
