import type { Metadata } from "next";
import RenderImageTool, { type RenderConfig } from "@/components/RenderImageTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/glb-to-png/`;
const title = "GLB to PNG — Free Online GLB Renderer | No Signup Required";
const description =
  "Render a GLB or glTF to a PNG image in your browser — materials and textures included, transparent background optional. Free, instant, 100% local, no upload and no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "GLB to PNG — Render a GLB to an Image, Free",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GLB to PNG — Free Online",
    description: "Render a GLB or glTF to a transparent PNG. 100% local.",
  },
};

const config: RenderConfig = {
  sourceFormat: "glb",
  imageFormat: "png",
  eyebrow: "GLB → Image · Renderer",
  heading: "GLB to PNG",
  intro:
    "Render a GLB or glTF to a PNG — with its materials and textures, on a transparent background if you want one. Pick the angle and resolution and download. Free, instant, 100% local.",
  about: [
    "This is a renderer, not a mesh converter: the GLB goes in, a raster image comes out. The result is a picture, not geometry.",
    "GLB packs geometry, materials and textures into a single file, so unlike STL or a bare OBJ it renders with the colors the model actually has.",
    "PNG and WebP keep a real alpha channel, so the model can sit on a transparent background. JPG cannot — JPEG has no alpha.",
    "Pick isometric, front, top or right. The camera frames the model's bounding sphere, so switching angles never changes the scale.",
    "It reads .gltf as well as .glb, plus STL, OBJ, 3MF, PLY, STEP, IGES, FBX and DAE.",
  ],
  faq: [
    {
      q: "How do I convert a GLB to a PNG?",
      a: "Drop the .glb (or .gltf) file above, choose a camera angle and resolution, then hit Download .png. The model is rendered locally in your browser with WebGL — nothing is uploaded.",
    },
    {
      q: "Does the render keep the GLB's textures and colors?",
      a: "Yes. A .glb embeds its materials and textures in the same file, so they load with the geometry and show up in the render. A .gltf that references external texture files will render with geometry only, since those files aren't dropped in.",
    },
    {
      q: "Can I get a transparent PNG?",
      a: "Yes — transparent is the default background for PNG. Switch to a solid color if you'd rather have a backdrop, or to JPG if file size matters more than alpha.",
    },
    {
      q: "Can I turn the PNG back into a GLB?",
      a: "Not the same model — a render discards the 3D geometry. The Image to STL tool can build a new heightmap relief from a picture, but it will not reconstruct the original mesh.",
    },
    {
      q: "Does my GLB file get uploaded anywhere?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "What resolution can I export?",
      a: "64 up to 4096 pixels per side, square or custom, with one-click presets at 512², 1024², 2048² and 1920×1080.",
    },
  ],
  links: [
    {
      href: "/glb-viewer/",
      title: "GLB / glTF Viewer",
      desc: "Open and inspect the model before rendering",
    },
    {
      href: "/glb-to-stl/",
      title: "GLB → STL",
      desc: "Need a printable mesh, not a picture?",
    },
    {
      href: "/obj-to-png/",
      title: "OBJ → PNG",
      desc: "Same renderer, OBJ source",
    },
    {
      href: "/stl-to-jpg/",
      title: "STL → JPG",
      desc: "Same renderer, STL source",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "GLB to PNG Renderer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "GLB to PNG", url: URL },
        ])}
      />
      <RenderImageTool config={config} />
    </>
  );
}
