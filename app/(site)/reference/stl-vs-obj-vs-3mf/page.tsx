import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

const TITLE = "STL vs OBJ vs 3MF vs GLB vs PLY — Which 3D File Format Should You Use?";
const DESCRIPTION =
  "Side-by-side decision matrix for the five mesh formats every maker, web3D developer and CAD engineer runs into. Pick the right one in 30 seconds.";
const URL = `${SITE_URL}/reference/stl-vs-obj-vs-3mf/`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "STL vs OBJ vs 3MF vs GLB vs PLY",
    description: DESCRIPTION,
  },
};

type Row = {
  format: string;
  printing: string;
  web: string;
  materials: string;
  size: string;
  best: string;
};

const COMPARISON: Row[] = [
  {
    format: "STL",
    printing: "Universal — every slicer reads it",
    web: "Geometry only, no textures",
    materials: "None (mesh + normals only)",
    size: "Medium (binary) / huge (ASCII)",
    best: "3D printing",
  },
  {
    format: "OBJ",
    printing: "Most slicers accept it",
    web: "Supported but verbose",
    materials: "Optional via .mtl sidecar",
    size: "Larger than STL, text-based",
    best: "CAD / DCC interchange",
  },
  {
    format: "3MF",
    printing: "Modern standard (Bambu / Prusa / Orca)",
    web: "Rarely used outside printing",
    materials: "Yes — colors, units, slicer metadata",
    size: "Compact (zip + XML)",
    best: "Multi-color or AMS prints",
  },
  {
    format: "GLB",
    printing: "Not for printing — too much extra data",
    web: "Web3D standard (PBR, animations)",
    materials: "Full PBR + textures embedded",
    size: "Compact, binary",
    best: "Web / AR / VR / games",
  },
  {
    format: "PLY",
    printing: "Not typical",
    web: "Limited",
    materials: "Per-vertex color (great for scans)",
    size: "Compact (binary)",
    best: "3D scanning, point clouds, research",
  },
];

type Persona = { who: string; recommend: string; reason: string };

const PERSONAS: Persona[] = [
  {
    who: "You're a 3D-printing hobbyist",
    recommend: "STL for single-color, 3MF for AMS / multi-color",
    reason:
      "STL is read by every slicer on the planet; switch to 3MF only when you need colors, multiple plates, or per-object print settings.",
  },
  {
    who: "You're building a web product that shows 3D models",
    recommend: "GLB",
    reason:
      "Single binary, embedded PBR materials, native browser support via <model-viewer>. Three.js, Babylon.js and Sketchfab all default to glTF/GLB.",
  },
  {
    who: "You're moving meshes between Blender / Maya / Cinema 4D",
    recommend: "OBJ — or FBX/USD if you need animation",
    reason:
      "OBJ is the lowest-common-denominator interchange for static meshes. Every DCC tool imports and exports clean OBJ.",
  },
  {
    who: "You scanned an object with a phone or LiDAR rig",
    recommend: "PLY",
    reason:
      "PLY natively stores per-vertex color and normals, which is exactly what a photogrammetry / structured-light pipeline outputs.",
  },
  {
    who: "You're prototyping a CAD part that will be 3D printed",
    recommend: "Export to STL from CAD; archive STEP separately",
    reason:
      "STL freezes geometry as triangles — perfect for slicing, useless for editing. Keep the parametric STEP around so you can iterate.",
  },
];

type FaqItem = { q: string; a: string };

const FAQ: FaqItem[] = [
  {
    q: "Does STL store colors?",
    a: "No. The official STL spec contains triangle vertices and face normals only. A non-standard 'color' extension exists in some CAD tools but is ignored by most slicers — treat STL as monochrome.",
  },
  {
    q: "Is 3MF replacing STL?",
    a: "Slowly. 3MF fixes STL's weaknesses (units, colors, metadata) and is now the default in Bambu Studio and PrusaSlicer. STL persists because of inertia and universal compatibility — both will coexist for years.",
  },
  {
    q: "Can I 3D-print a GLB file?",
    a: "Not directly — slicers don't read GLB. Convert GLB → STL or 3MF first. Textures and materials are dropped; only geometry survives.",
  },
  {
    q: "Why is my OBJ file so much larger than the STL of the same model?",
    a: "OBJ is text by default. Each vertex and face takes more characters than the binary STL encoding. If size matters, convert to binary STL or compressed GLB.",
  },
  {
    q: "What about FBX, USD, IGES, STEP?",
    a: "FBX/USD are animation/asset pipelines (game and film). STEP/IGES are CAD parametric formats — they store features, not just meshes. None are interchangeable with the five mesh formats above; they need a different conversion pipeline.",
  },
];

export default function Page() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
          Format Reference
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          STL vs OBJ vs 3MF vs GLB vs PLY
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
          The five mesh formats every maker, web developer and CAD engineer
          eventually has to choose between. Skip the spec sheets — here&apos;s
          the decision in 30 seconds.
        </p>
      </header>

      <section className="mb-12 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-5 sm:p-6">
        <h2 className="text-base font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
          TL;DR
        </h2>
        <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>Printing single-color?</strong> STL.
          </li>
          <li>
            <strong>Printing with Bambu AMS or multi-material?</strong> 3MF.
          </li>
          <li>
            <strong>Putting a 3D model on the web?</strong> GLB.
          </li>
          <li>
            <strong>Moving between Blender / Maya / CAD?</strong> OBJ.
          </li>
          <li>
            <strong>3D scan / photogrammetry?</strong> PLY.
          </li>
        </ul>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-5">
          Decision matrix
        </h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Format
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  3D printing
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Web / Game
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Materials
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  File size
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Best for
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr
                  key={row.format}
                  className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                    .{row.format.toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {row.printing}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {row.web}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {row.materials}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {row.size}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
                    {row.best}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-5">
          By use case
        </h2>
        <div className="space-y-4">
          {PERSONAS.map((p) => (
            <div
              key={p.who}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {p.who}
              </h3>
              <p className="text-blue-700 dark:text-blue-400 font-medium text-sm mb-2">
                → {p.recommend}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {p.reason}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-5">
          Format deep dives
        </h2>

        <DeepDive
          name="STL"
          year="1989"
          tagline="The 3D printing lingua franca"
          notes={[
            "Triangle mesh + face normals. Nothing else.",
            "Two encodings: binary (compact, recommended) and ASCII (human-readable, huge).",
            "No unit information — millimeters by convention but not enforced. Some files import as meters by accident.",
            "Will outlive us all. Universal slicer support means it's never going away.",
          ]}
        />

        <DeepDive
          name="OBJ"
          year="1990s"
          tagline="The DCC interchange workhorse"
          notes={[
            "Plain text. Vertices, faces, optional UVs and normals.",
            "Materials live in a separate .mtl file — easy to lose during conversion.",
            "Supports n-gons and quads, unlike STL which is triangles-only.",
            "Universally supported by Blender, Maya, 3ds Max, Cinema 4D, ZBrush.",
          ]}
        />

        <DeepDive
          name="3MF"
          year="2015"
          tagline="STL, modernized for the AMS era"
          notes={[
            "Zip archive containing XML descriptions plus mesh data — extensible by design.",
            "Stores color, material, units, build plate, and slicer-specific settings inline.",
            "Default save format in Bambu Studio, PrusaSlicer, OrcaSlicer.",
            "Tool ecosystems differ — Bambu's .3mf is not always cleanly readable by Prusa and vice versa.",
          ]}
        />

        <DeepDive
          name="GLB"
          year="2017"
          tagline="The Web3D PBR binary"
          notes={[
            "Binary glTF — geometry, materials, textures, animations, all in one file.",
            "Designed by Khronos Group as the 'JPEG of 3D' for the web.",
            "First-class support in three.js, Babylon.js, <model-viewer>, AR Quick Look (iOS), Scene Viewer (Android).",
            "Slightly heavier than STL for the same geometry, but compresses well with Draco / meshopt.",
          ]}
        />

        <DeepDive
          name="PLY"
          year="1994 (Stanford)"
          tagline="The scanning and research format"
          notes={[
            "Designed at Stanford for storing scanned models (the famous Stanford Bunny is PLY).",
            "First-class per-vertex color and normals — perfect for photogrammetry pipelines.",
            "Both ASCII and binary variants. Binary recommended for anything non-trivial.",
            "Rarely used outside academic / scanning contexts, but still the cleanest format for vertex-colored meshes.",
          ]}
        />
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-5">FAQ</h2>
        <div className="space-y-5">
          {FAQ.map((item) => (
            <div key={item.q}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                {item.q}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6">
        <h2 className="text-xl font-bold tracking-tight mb-4">
          Convert between any of these
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          All conversions run 100% in your browser. No upload, no signup.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <ConverterLink href="/stl-to-obj/" label="STL → OBJ" />
          <ConverterLink href="/obj-to-stl/" label="OBJ → STL" />
          <ConverterLink href="/stl-to-glb/" label="STL → GLB" />
          <ConverterLink href="/glb-to-stl/" label="GLB → STL" />
          <ConverterLink href="/stl-to-3mf/" label="STL → 3MF" />
          <ConverterLink href="/3mf-to-stl/" label="3MF → STL" />
          <ConverterLink href="/stl-to-ply/" label="STL → PLY" />
          <ConverterLink href="/ply-to-stl/" label="PLY → STL" />
        </div>
      </section>
    </article>
  );
}

function DeepDive({
  name,
  year,
  tagline,
  notes,
}: {
  name: string;
  year: string;
  tagline: string;
  notes: string[];
}) {
  return (
    <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 last:mb-0 last:pb-0">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <h3 className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
          .{name.toLowerCase()}
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">{year}</span>
      </div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 italic">
        {tagline}
      </p>
      <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-5">
        {notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

function ConverterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300 text-center transition-colors font-mono text-xs"
    >
      {label}
    </Link>
  );
}
