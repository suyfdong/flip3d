import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/stl-viewer/`;
const title = "Online STL Viewer — Free STL Reader | Open .STL Files in Browser";
const description =
  "Free online STL viewer — view STL online with no signup. Open an .stl file, rotate and inspect the 3D model in your browser. Works as an STL reader and STL model viewer. 100% local, no upload, nothing installed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online STL Viewer & STL Reader — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online STL Viewer — Free",
    description: "View .stl files in your browser. No upload, no signup.",
  },
};

const config: ViewerConfig = {
  format: "stl",
  formatLabel: "STL",
  accept: [".stl"],
  eyebrow: "STL · 3D Viewer",
  heading: "Online STL Viewer",
  intro:
    "Drop an STL file to open it in a fast 3D viewer — drag to rotate, scroll to zoom, and inspect the mesh. Free, instant, and 100% local: your file never leaves the browser.",
  about: [
    "Works as a plain STL reader, STL file reader and STL model viewer — open the file, look at it, done. Nothing to download or install, and no account.",
    "Views both binary and ASCII STL files — the standard mesh format for 3D printing.",
    "Everything runs on your device with WebGL. There's no upload, no account, and no file-size paywall.",
    "STL stores only triangles (no color or units), so every model renders in a single shaded material — that's expected, not a loading error.",
    "Need to print or edit it? Jump straight to the STL repair checker or convert it to another format below.",
  ],
  faq: [
    {
      q: "How do I open an STL file online?",
      a: "Drop your .stl file into the box above. It opens instantly in a 3D viewer — drag to rotate, scroll to zoom. Nothing is uploaded; the file is read locally in your browser.",
    },
    {
      q: "Is there a free STL reader I don't have to install?",
      a: "This page is one. It's a browser-based STL reader — no download, no licence, no account. Open the page, drop the file, and the model is on screen in a second.",
    },
    {
      q: "How do I read an STL file without CAD software?",
      a: "Drop it here. An STL is just a list of triangles, so reading one only needs something that can draw those triangles — not a CAD package. This page does that in the browser; you get the shape on screen plus the triangle, vertex and bounding-box numbers underneath, which is usually all anyone needs from an STL file reader.",
    },
    {
      q: "Can I view an STL file online on my phone?",
      a: "Yes. The viewer runs on mobile browsers too — tap and drag to rotate, pinch to zoom. Since the file is read locally, a phone with no 3D software can still open it.",
    },
    {
      q: "Is this STL viewer free?",
      a: "Yes. It's completely free with no signup, no watermark, and no file-size limit beyond 200MB. Flip3D renders the model locally with WebGL.",
    },
    {
      q: "Does my STL file get uploaded to a server?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "Why is my STL model all one color?",
      a: "STL files store only geometry — no color, material, or texture data. Every viewer shows STL in a single shaded color; a uniform look means it loaded correctly.",
    },
    {
      q: "Can I edit or repair the STL here?",
      a: "This page is a viewer, but Flip3D also has a free STL repair tool and a 3D print checker that detect holes, non-manifold edges, and printability issues — links are above and below the viewer.",
    },
  ],
  links: [
    {
      href: "/tools/stl-repair/",
      title: "Repair this STL",
      desc: "Fix holes, flipped normals & non-manifold edges",
    },
    {
      href: "/tools/print-checker/",
      title: "3D Print Checker",
      desc: "Check watertightness, size & overhangs before printing",
    },
    {
      href: "/stl-to-obj/",
      title: "STL → OBJ",
      desc: "Convert this STL to another mesh format",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Online STL Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "STL Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
