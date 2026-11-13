import type { Metadata } from "next";
import ImageToStlTool from "@/components/ImageToStlTool";
import SeoFaqSection from "@/components/SeoFaqSection";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/jpg-to-obj/`;
const title = "JPG to OBJ Converter — Free Online | No Signup Required";
const description =
  "Convert a JPG photo to a 3D OBJ mesh in your browser. Brightness becomes height for a relief model. Free, instant, 100% local, no signup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "JPG to OBJ — Free Online Heightmap Converter",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JPG to OBJ — Free Online",
    description: "Turn a JPG into a 3D OBJ relief mesh. 100% local, no signup.",
  },
};

const ABOUT = [
  "A JPG is a lossy format: the encoder splits the image into 8×8 blocks, throws away high-frequency detail it thinks you won't notice, and reconstructs the rest. On screen that is invisible. In a height map it isn't — the converter reads brightness literally, so every compression artefact becomes a real feature of the surface. Ringing around edges turns into grooves, flat skies pick up a faint checkerboard, and a low-quality export can look sandpapered.",
  "That is not a bug, it is the format being honest about itself. If the result is too busy, the fix is upstream: export the picture as PNG from the original tool if you still have it, save the JPEG at quality 90+ instead of 70, or reduce \"Detail (resolution)\" so the mesh samples fewer of those artefacts. Re-saving an existing JPEG as PNG does not recover anything — the damage is already in the pixels.",
  "The mesh itself is a watertight height field with a flat back, written as a Wavefront OBJ: ASCII vertices, normals, UVs and faces, no .mtl. Since OBJ cannot carry the photo's colours in one file, use the colour toggle to export PLY or GLB if you need them, and use the STL version of this page when the model is going straight to a printer.",
];

const FAQ = [
  {
    q: "Why does my JPG come out bumpy or noisy?",
    a: "JPEG compression artefacts. The codec quantises 8×8 blocks and leaves ringing around sharp edges; on screen those errors are below what your eye cares about, but the converter turns brightness into height, so a one-level pixel difference becomes a real vertical step. Grain and sensor noise in the original photo do the same thing. Use a PNG source, a higher JPEG quality, or a lower detail setting.",
  },
  {
    q: "Should I convert the JPG to PNG first?",
    a: "Only if you have the original. Converting a JPEG to PNG keeps the artefacts and makes the file bigger — PNG is lossless from that point on, but it cannot undo loss that already happened. A better workflow is to re-export from the source (camera RAW, Figma, Illustrator, a screenshot) as PNG and drop that in.",
  },
  {
    q: "Does the OBJ keep the photo's colours?",
    a: "No — the OBJ written here is geometry and UVs only, with no .mtl and no texture. Turn on \"Keep the image's colors\" and the download switches to PLY or GLB, which store per-vertex colour. STL and 3MF can't store it.",
  },
  {
    q: "Can I use a phone photo?",
    a: "Yes, and it will work — but a 12-megapixel photo is far more detail than a relief can express. Lower \"Detail (resolution)\" to somewhere in the low hundreds of pixels wide; you get the same object with far fewer triangles, which is easier for your slicer and for your modelling app.",
  },
  {
    q: "Is this a 3D model of the object in the photo?",
    a: "No. It is a relief: brightness becomes height, so you get a photo-shaped slab with the picture embossed on it. There is no depth estimation and no reconstruction — turning a single JPG into the object it depicts is a different problem, and pretending otherwise would give you a model that doesn't match your photo.",
  },
  {
    q: "Is the JPG uploaded anywhere?",
    a: "No. Image decoding and mesh generation both run in your browser. Nothing is sent to a server, nothing is stored, and the OBJ carries no watermark.",
  },
];

export default function Page() {
  return (
    <>
      <ImageToStlTool defaultMode="relief" variant="jpg" targetFormat="obj" />
      <SeoFaqSection
        crumbName="JPG to OBJ"
        crumbUrl={URL}
        aboutTitle="JPG to OBJ: what compression does to a mesh"
        about={ABOUT}
        faq={FAQ}
        related={[
          {
            href: "/jpg-to-stl/",
            title: "JPG to STL",
            desc: "The printable version of this conversion",
          },
          {
            href: "/jpeg-to-stl/",
            title: "JPEG to STL",
            desc: "The .jpeg spelling, same pipeline",
          },
          {
            href: "/png-to-obj/",
            title: "PNG to OBJ",
            desc: "Lossless source, cleaner surface",
          },
          {
            href: "/image-to-color-stl/",
            title: "Image to Color STL",
            desc: "Keeps colours as PLY or GLB",
          },
        ]}
      />
    </>
  );
}
