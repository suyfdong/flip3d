import type { Metadata } from "next";
import ViewerTool, { type ViewerConfig } from "@/components/ViewerTool";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareAppSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/ply-viewer/`;
const title = "PLY Viewer — Open .PLY Point Clouds, 3D Scans & Splats Online";
const description =
  "Free online PLY viewer for 3D scans, point clouds and meshes — keeps scan colors, previews Gaussian splats, measures distances. 100% local, no upload.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "Online PLY Viewer — Free, 100% Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online PLY Viewer — Free",
    description: "View .ply files in your browser. No upload, no signup.",
  },
};

const config: ViewerConfig = {
  format: "ply",
  formatLabel: "PLY",
  accept: [".ply"],
  eyebrow: "PLY · 3D Viewer",
  heading: "Online PLY Viewer",
  intro:
    "Drop a .ply scan, point cloud, mesh or Gaussian splat. Point clouds draw as points in the scan's own colors, colored meshes keep their vertex colors, and you can measure between any two points. Free, and the file never leaves your browser.",
  about: [
    "Views PLY (Stanford Polygon) files — the format 3D scanners and photogrammetry tools like Meshroom and Polycam export.",
    "Handles both binary and ASCII PLY. Everything runs on your device with WebGL — no upload, no account, no file-size paywall.",
    "Point clouds (PLY files with vertices but no faces — typical of LiDAR, photogrammetry and phone scans) render as points, not as a broken surface, using the per-point RGB colors when the file has them.",
    "3D Gaussian Splat PLYs (with f_dc_* fields) are recognised and previewed as colored points from each splat's base color. That's a preview of where the splats are and their color — not a full splat render with view-dependent shading.",
    "The side panel shows the PLY header: binary or ASCII encoding, element counts and every vertex field (x, y, z, red/green/blue, normals, splat fields…). Use Measure to click two points and read the distance.",
    "Need a printable or portable file? Convert the PLY to STL, OBJ or GLB below.",
  ],
  faq: [
    {
      q: "How do I open a PLY file online?",
      a: "Drop your .ply file into the box above. It opens instantly in a 3D viewer — drag to rotate, scroll to zoom. Nothing is uploaded; the file is read locally in your browser.",
    },
    {
      q: "What opens a .ply file?",
      a: "MeshLab, CloudCompare and Blender read PLY, but each needs an install and a slow first launch. This PLY file viewer opens the scan straight in the browser instead.",
    },
    {
      q: "Is this PLY viewer free?",
      a: "Yes. It's completely free with no signup, no watermark, and no file-size limit beyond 200MB. The model renders locally with WebGL.",
    },
    {
      q: "Does it support binary and ASCII PLY?",
      a: "Yes. Both PLY encodings load. PLY files from 3D scanners and photogrammetry (often binary) open the same way as ASCII exports.",
    },
    {
      q: "Can I view a PLY point cloud online?",
      a: "Yes. If the PLY has vertices but no faces it's drawn as a point cloud, with point size scaled to the scan and the file's own per-point colors. The stats bar shows the point count, and the File details panel lists the fields stored per point.",
    },
    {
      q: "Does it open Gaussian Splat .ply files?",
      a: "It opens them as a preview: each splat is drawn as a point colored from its base (DC) color, so you can check the capture's extent and color. It doesn't do full Gaussian splat rendering (view-dependent color, blending of the ellipsoids) — use a dedicated splat viewer for that.",
    },
    {
      q: "Does the PLY viewer show the scan's colors?",
      a: "Yes. Per-vertex RGB colors are kept for both point clouds and meshes. Files without color data are shown in a neutral blue.",
    },
    {
      q: "Can I measure a PLY scan?",
      a: "Yes. Click Measure, then click two points on the scan to get the straight-line distance and the X/Y/Z offsets, in the file's own units (scanner apps usually export meters or millimeters).",
    },
    {
      q: "Is my PLY file uploaded anywhere?",
      a: "No. There is no server and no upload. The file is parsed and rendered entirely on your device, and nothing is stored.",
    },
    {
      q: "Can I convert the PLY to STL?",
      a: "If the PLY is a mesh (it has faces), yes — Flip3D converts it to STL, OBJ, GLB and 3MF in the browser. A point cloud has no surface, so it can't become a printable STL directly; reconstruct a surface first (for example Poisson reconstruction in MeshLab or CloudCompare), then convert.",
    },
  ],
  links: [
    {
      href: "/ply-to-stl/",
      title: "PLY → STL",
      desc: "Convert this PLY to a printable STL",
    },
    {
      href: "/ply-to-obj/",
      title: "PLY → OBJ",
      desc: "Convert to OBJ for editing",
    },
    {
      href: "/tools/print-checker/",
      title: "3D Print Checker",
      desc: "Check scan meshes for printability",
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqPageSchema(config.faq)} />
      <JsonLd
        data={softwareAppSchema({
          name: "Online PLY Viewer",
          description,
          url: URL,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "PLY Viewer", url: URL },
        ])}
      />
      <ViewerTool config={config} />
    </>
  );
}
