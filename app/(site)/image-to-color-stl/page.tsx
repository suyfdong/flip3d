import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/image-to-color-stl/`;
const title = "Image to Color STL — Free Color 3D Relief Maker | No Signup";
const description =
  "Turn an image into a color 3D model in your browser. Brightness becomes height and the picture's colors ride along as vertex color — exported as PLY or GLB, because STL cannot store color. Free, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Image to Color STL — Free Color 3D Relief Maker",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to Color STL — Free Online",
    description: "Make a color 3D relief from any image. PLY / GLB output. 100% local.",
  },
};

const FAQ = [
  {
    q: "Can an STL file store color?",
    a: "No. A standard STL is a plain list of triangles with no color, material or texture channel — that is the whole format. Some slicers read a non-standard color hack stuffed into STL's spare attribute bytes, but support is inconsistent and most software ignores it. Anyone promising a genuinely \"color STL\" is either using that hack or quietly giving you a plain STL.",
  },
  {
    q: "So how do I actually get a color 3D model from my image?",
    a: "Use a format that has a color channel. This page keeps the image's colors as per-vertex color and exports PLY or GLB, both of which carry it properly. The geometry is identical to the plain relief — only the color survives the trip.",
  },
  {
    q: "PLY or GLB — which should I pick?",
    a: "PLY if the file is going to a full-color printing service or into MeshLab, Blender or a photogrammetry tool; per-vertex color in PLY is about as widely understood as it gets. GLB if it is going on the web, into an AR viewer or a game engine — it is the format browsers and viewers read natively.",
  },
  {
    q: "Will my desktop 3D printer print it in color?",
    a: "A single-nozzle FDM printer will not — it prints one filament color regardless of what the file says. Color comes from a multi-material setup (an AMS or MMU, where you assign colors per region), a full-color service like Shapeways or Sculpteo, or a binder-jet machine. For a single-nozzle printer, a lithophane is usually the better answer: it reproduces the image in light and shadow rather than pigment.",
  },
  {
    q: "How do the colors get onto the model?",
    a: "Each vertex of the relief samples the pixel underneath it and stores that color. There is no texture image and no UV map, so the resolution of the color is the resolution of the mesh — raise the Detail slider if the color looks blocky, and lower it if the file gets unwieldy.",
  },
  {
    q: "Can I still get a plain STL from here?",
    a: "Yes. Turn off \"Keep the image's colors\" and the export goes back to a single-color STL, exactly like the standard image-to-STL tool. Nothing else about the geometry changes.",
  },
  {
    q: "Is it free, and is my image uploaded?",
    a: "Free, no signup, no watermark — and there is no upload. The image is read and the model is built on your own device.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="color" defaultKeepColor />
      <SeoFaqSection
        crumbName="Image to Color STL"
        crumbUrl={URL}
        aboutTitle="Getting color out of an image-to-3D conversion"
        about={[
          "People search for an \"image to color STL\" converter because they want a 3D print that looks like their picture — colors included. The honest answer is that STL has no color channel at all: it stores triangles and nothing else. That is not a limitation of any particular tool, it is the file format.",
          "So this page does the thing you actually wanted. It builds the same watertight relief — brightness becomes height — and additionally samples the color of every pixel into per-vertex color, then exports PLY or GLB, two formats that carry color properly. Turn the color option off and you get a plain STL, same as anywhere else.",
          "Everything runs locally in your browser: no upload, no account, no watermark. If your goal is a photo that reads on a single-color printer, look at the lithophane generator instead — it uses thickness rather than pigment to reproduce the image, and it works on any FDM machine.",
        ]}
        faq={FAQ}
        related={[
          { href: "/image-to-stl/", title: "Image to STL", desc: "Plain single-color relief or lithophane" },
          { href: "/lithophane-generator/", title: "Lithophane Generator", desc: "Photo in light and shadow — works on any printer" },
          { href: "/png-to-3mf/", title: "PNG to 3MF", desc: "Same relief, 3MF for modern slicers" },
          { href: "/glb-viewer/", title: "GLB Viewer", desc: "Check the colored GLB in the browser" },
        ]}
      />
    </>
  );
}
