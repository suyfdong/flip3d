import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/image-to-obj/`;
const title = "Image to OBJ Converter — Free Online | No Signup Required";
const description =
  "Convert an image to a 3D OBJ model in your browser. Brightness becomes height — turn a PNG, JPG or WebP into a Wavefront OBJ relief. Free, instant, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Image to OBJ — Free Online Heightmap Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to OBJ — Free Online",
    description: "Turn any image into a 3D OBJ relief mesh. 100% local, no signup.",
  },
};

const ABOUT = [
  "This converter turns a picture into a 3D mesh by treating brightness as height. Each pixel gets a position on a grid and a vertical offset taken from its luminance, and the result is closed off with a flat back and side walls — a watertight solid rather than a one-sided surface, so it slices and prints without repair. Dark areas can be raised or lowered depending on the mode you pick; relief raises light areas, lithophane raises dark ones.",
  "It writes Wavefront OBJ. That choice matters more than it sounds: OBJ is plain text (vertices, normals, UVs and faces on separate lines), which makes it readable, diffable, and easy to generate or script. It is also the common denominator of 3D software — Blender, Maya, Unity, Unreal, ZBrush, and most slicers import it. The trade-off is that OBJ has no unit field and no standard way to carry a material inside a single file; materials belong in a sibling .mtl, and this exporter does not write one.",
  "Be clear about what this is: an image becomes a shallow relief of itself, not a 3D model of the object in the picture. There is no depth estimation, no photogrammetry and no AI reconstruction — a photo of a face gives you a face-shaped relief, not a head. If you need a printable version of a photo, that is exactly the right tool. If you need the object, you need photogrammetry or a 3D scanner.",
];

const FAQ = [
  {
    q: "What kind of OBJ file does this produce?",
    a: "A standard ASCII Wavefront OBJ with vertex positions, normals, UV coordinates and faces. It does not write a companion .mtl, so there are no materials in the file — the geometry is complete, the shading is not. Every importer that reads OBJ will open it.",
  },
  {
    q: "Why is the OBJ much larger than the same model as an STL?",
    a: "Because OBJ is text. Every coordinate is printed as a decimal number with a space and a newline, where binary STL stores the same triangle in 50 fixed bytes. For printing, take the STL; use the OBJ when you want to open the mesh in a modelling package or process it with a script.",
  },
  {
    q: "Can I keep the image's colours?",
    a: "Not in OBJ — the OBJ written here carries geometry only, and there is no .mtl to hold a texture. Turn on \"Keep the image's colors\" above and the tool switches the download to PLY or GLB instead, which do store per-vertex colour. STL and 3MF have nowhere to put it either.",
  },
  {
    q: "Can I edit the OBJ in Blender, Unity or ZBrush?",
    a: "Yes. Import it as a plain mesh; it arrives at the real-world size you set in millimetres (assuming the importer treats units as millimetres, which Blender does by default at scale 0.001). Because it is a dense triangle grid, sculpting on top of it is fine but retopology usually isn't worth it for a relief.",
  },
  {
    q: "Is this a 3D model of what's in the photo?",
    a: "No. It is a height field: the image's brightness becomes thickness, and the silhouette stays the image's rectangle unless the source has transparency. A photo of a cup gives a flat plate with the cup's shading on it, not a cup. That is a deliberate, honest limit — the alternative would be a generated model that doesn't match your photo.",
  },
  {
    q: "Is the image uploaded to a server?",
    a: "No. The image is decoded and sampled on your device with canvas, and the OBJ is assembled in the browser. Nothing is uploaded, nothing is stored, and there is no account or watermark.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="image" targetFormat="obj" />
      <SeoFaqSection
        crumbName="Image to OBJ"
        crumbUrl={URL}
        aboutTitle="Converting an image to OBJ"
        about={ABOUT}
        faq={FAQ}
        related={[
          {
            href: "/image-to-stl/",
            title: "Image to STL",
            desc: "The same relief as a binary STL for printing",
          },
          {
            href: "/png-to-obj/",
            title: "PNG to OBJ",
            desc: "Transparent PNGs flatten to the base plate",
          },
          {
            href: "/jpg-to-obj/",
            title: "JPG to OBJ",
            desc: "Photos, and what JPEG artefacts do to a mesh",
          },
          {
            href: "/image-to-color-stl/",
            title: "Image to Color STL",
            desc: "Keep the colours — exported as PLY or GLB",
          },
        ]}
      />
    </>
  );
}
