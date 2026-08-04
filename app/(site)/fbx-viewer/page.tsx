import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/fbx-viewer/`;
const title = "FBX Viewer — Free Online .FBX File Viewer | No Signup";
const description =
  "Free online FBX file viewer. Open a .fbx file and view the 3D model in your browser — rotate, zoom, inspect. Instant, 100% local, no upload, no signup, no Autodesk software.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online FBX Viewer — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online FBX Viewer — Free",
    description: "View .fbx files in your browser. No upload, no signup.",
  },
};

const config: ViewerConfig = {
  format: "fbx",
  formatLabel: "FBX",
  accept: [".fbx"],
  eyebrow: "FBX · 3D Viewer",
  heading: "Online FBX Viewer",
  intro:
    "Drop an .fbx file to open it in a fast 3D viewer — drag to rotate, scroll to zoom, and inspect the model. Free, instant, and 100% local: your file never leaves the browser.",
  about: [
    "Views FBX geometry — the Autodesk interchange format used across game engines, Maya, 3ds Max and Blender.",
    "Everything runs on your device with WebGL. There's no upload, no account, and no file-size paywall.",
    "The viewer shows the model's meshes in a single shaded material; embedded animation and rig data aren't played back.",
    "To use the model elsewhere, convert the FBX to OBJ, STL, GLB or 3MF below.",
  ],
  faq: [
    {
      q: "How do I open an FBX file online?",
      a: "Drop your .fbx file into the box above. It opens instantly in a 3D viewer — drag to rotate, scroll to zoom. Nothing is uploaded; the file is read locally in your browser.",
    },
    {
      q: "What program opens a .fbx file?",
      a: "Maya, 3ds Max, Blender and Unity all import FBX, but each is a large install and some need a licence. This FBX file viewer opens the model in the browser with none of that.",
    },
    {
      q: "Is this FBX viewer free?",
      a: "Yes. It's completely free with no signup, no watermark, and no file-size limit beyond 200MB. The model renders locally with WebGL.",
    },
    {
      q: "Does it show FBX animations?",
      a: "No. This is a geometry viewer — it renders the model's meshes so you can inspect the shape. Skeletal animation and rig playback aren't supported.",
    },
    {
      q: "Is my FBX file uploaded anywhere?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "Can I convert the FBX to another format?",
      a: "Yes. Flip3D converts FBX to OBJ, STL, GLB, 3MF and PLY in the browser. FBX is read-only (there's no FBX export), but you can export to any of those meshes. Convert links are by the viewer.",
    },
  ],
  links: [
    {
      href: "/fbx-to-obj/",
      title: "FBX → OBJ",
      desc: "Convert this FBX to an editable OBJ mesh",
    },
    {
      href: "/fbx-to-glb/",
      title: "FBX → GLB",
      desc: "Convert to GLB for web & AR",
    },
    {
      href: "/fbx-to-stl/",
      title: "FBX → STL",
      desc: "Convert to a printable STL",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Online FBX Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "FBX Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
