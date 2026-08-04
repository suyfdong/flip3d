import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema, itemListSchema } from "@/lib/schema";
import {
  FORMATS,
  FORMAT_LABELS,
  SOURCE_ONLY_FORMATS,
  isExportable,
  type Format,
} from "@/lib/converters";
import {
  ALIAS_ROUTES,
  CONVERTER_ROUTES,
  DXF_ROUTES,
  IMAGE_ROUTES,
  REFERENCE_ROUTES,
  SITE_URL,
  TOOL_ROUTES,
  VECTOR_ROUTES,
  VIEWER_ROUTES,
} from "@/lib/seo";

const URL = `${SITE_URL}/converters/`;
const title =
  "All 3D File Converters — Free Online 3D Model Converter | No Signup";
const description =
  "Every Flip3D converter in one place. Pick a source format and a target: STL, OBJ, GLB, 3MF, PLY from STEP, IGES, FBX, DAE, images, SVG and DXF. Free, no signup, 100% local.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: URL },
  openGraph: {
    title: "All 3D File Converters — Free & Local",
    description,
    url: URL,
    siteName: "Flip3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "All 3D File Converters — Free Online",
    description: "Browse every STL, OBJ, GLB, 3MF and PLY converter. 100% local.",
  },
};

/** Pairs that actually have a page, so the matrix can never link to a 404. */
const BUILT = new Set(CONVERTER_ROUTES.map(({ from, to }) => `${from}-${to}`));
const TARGETS: Format[] = FORMATS.filter(isExportable);

const WHY_FORMAT: Array<{ fmt: Format; use: string }> = [
  { fmt: "stl", use: "3D printing. Geometry only — no colour, no units, no metadata. The safe default for any slicer." },
  { fmt: "3mf", use: "3D printing with more than geometry: units, multiple objects and colour survive. Preferred by Bambu Studio, PrusaSlicer, Orca and Cura." },
  { fmt: "obj", use: "Editing elsewhere. Plain text, read by every 3D package. Materials live in a separate .mtl, which Flip3D does not write." },
  { fmt: "glb", use: "Web and AR. One self-contained binary file with materials inside — the format to embed or hand to a viewer." },
  { fmt: "ply", use: "Scans and point-cloud pipelines. What Meshroom, Polycam and most photogrammetry tools expect." },
];

const FAQ = [
  {
    q: "Which 3D file converter do I need?",
    a: "Find your source format in the left column of the table above and your target across the top — the cell is the converter. If you're printing, target STL or 3MF; if you're editing elsewhere, OBJ; for web or AR, GLB.",
  },
  {
    q: "Is the 3D model converter free?",
    a: "Yes. Every converter here is free with no signup, no watermark and no file-size paywall. There's no trial and no paid tier.",
  },
  {
    q: "Is there a free STL file converter here?",
    a: "Yes — STL is both the most common source and the most common target. Read the STL row of the table for STL → OBJ, GLB, 3MF and PLY, or the STL column for everything that converts into STL. All of it is free and runs locally.",
  },
  {
    q: "Which FBX converter should I use?",
    a: "FBX is read-only in Flip3D: it converts to STL, OBJ, GLB, 3MF or PLY, but there's no FBX exporter, so nothing converts to FBX. Pick the target from the FBX row above, or open the file first in the FBX viewer.",
  },
  {
    q: "Do my files get uploaded to a server?",
    a: "No. There is no server and no upload. Every conversion runs in your browser with three.js and WebAssembly, and nothing is stored.",
  },
  {
    q: "Which formats can Flip3D read, and which can it write?",
    a: "It reads STL, OBJ, GLB/glTF, 3MF, PLY, STEP/STP, IGES/IGS, FBX and DAE, plus images, SVG and DXF. It writes STL, OBJ, GLB, 3MF, PLY and DXF. STEP, IGES, FBX and DAE are read-only — there's no exporter for them, so those columns don't exist rather than producing a file that only pretends to be one.",
  },
  {
    q: "Why can't I convert STL to STEP?",
    a: "An STL is a bag of triangles; a STEP file is a solid built from real surfaces. Going mesh → solid can't recover geometry that was never in the file, so the only thing a converter can output is a faceted shape wearing a .step extension — useless for CAD and misleading. We don't do it. For a 2D profile out of a mesh, STL to DXF gives you a genuine cross-section instead.",
  },
  {
    q: "Can it handle a DWG file?",
    a: "No. DWG is AutoCAD's proprietary binary format. Re-export as ASCII DXF and use the DXF converters — every CAD package can do that.",
  },
  {
    q: "Is there a file-size limit?",
    a: "200MB per file. Because everything runs on your own machine, the practical limit is your device's memory rather than a server quota.",
  },
];

function FormatCell({ from, to }: { from: Format; to: Format }) {
  if (from === to) {
    return <td className="px-2 py-2 text-center text-zinc-300 dark:text-zinc-700">—</td>;
  }
  if (!BUILT.has(`${from}-${to}`)) {
    return <td className="px-2 py-2 text-center text-zinc-300 dark:text-zinc-700">·</td>;
  }
  return (
    <td className="px-2 py-2 text-center">
      <Link
        href={`/${from}-to-${to}/`}
        className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
      >
        {FORMAT_LABELS[from]}→{FORMAT_LABELS[to]}
      </Link>
    </td>
  );
}

function LinkGrid({
  items,
}: {
  items: Array<{ href: string; title: string; desc: string }>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className="block px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
        >
          <div className="font-semibold text-sm">{i.title}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{i.desc}</div>
        </Link>
      ))}
    </div>
  );
}

export default function Page() {
  const listItems = [
    ...CONVERTER_ROUTES.map(({ from, to }) => ({
      name: `${FORMAT_LABELS[from]} to ${FORMAT_LABELS[to]}`,
      url: `${SITE_URL}/${from}-to-${to}/`,
    })),
    ...ALIAS_ROUTES.map((r) => ({ name: r.title, url: `${SITE_URL}/${r.slug}/` })),
    ...IMAGE_ROUTES.map((r) => ({ name: r.title, url: `${SITE_URL}/${r.slug}/` })),
    ...VECTOR_ROUTES.map((r) => ({ name: r.title, url: `${SITE_URL}/${r.slug}/` })),
    ...DXF_ROUTES.map((r) => ({ name: r.title, url: `${SITE_URL}/${r.slug}/` })),
    ...VIEWER_ROUTES.map((r) => ({ name: r.title, url: `${SITE_URL}/${r.slug}/` })),
    ...TOOL_ROUTES.map((r) => ({
      name: r.title,
      url: `${SITE_URL}/tools/${r.slug}/`,
    })),
  ];

  return (
    <>
      <JsonLd data={faqPageSchema(FAQ)} />
      <JsonLd data={itemListSchema(listItems)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: "All Converters", url: URL },
        ])}
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-10">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
            Directory · {listItems.length} tools
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              All 3D File Converters
            </span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Every converter, viewer and tool on Flip3D in one place. Pick your
            source format on the left and the target across the top. All of them
            are free, need no signup, and run entirely in your browser — your
            files never get uploaded.
          </p>
        </div>
      </section>

      <section className="border-t border-zinc-200 dark:border-zinc-800 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            3D model converter matrix
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-3xl">
            Nine source formats, five export targets. STEP, IGES, FBX and DAE are
            read-only — Flip3D has no exporter for them, so they appear as rows
            but not as columns.
          </p>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold">From ↓ / To →</th>
                  {TARGETS.map((t) => (
                    <th key={t} className="px-2 py-3 font-semibold whitespace-nowrap">
                      {FORMAT_LABELS[t]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FORMATS.map((from) => (
                  <tr
                    key={from}
                    className="border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                      {FORMAT_LABELS[from]}
                      {SOURCE_ONLY_FORMATS.has(from) && (
                        <span className="ml-1.5 text-[10px] uppercase tracking-wide text-zinc-400">
                          read-only
                        </span>
                      )}
                    </th>
                    {TARGETS.map((to) => (
                      <FormatCell key={to} from={from} to={to} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
            Extension aliases:{" "}
            {ALIAS_ROUTES.map((r, i) => (
              <span key={r.slug}>
                {i > 0 && " · "}
                <Link href={`/${r.slug}/`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {r.title}
                </Link>
              </span>
            ))}
            . A <code>.stp</code> file is a STEP file and a <code>.gltf</code> is
            glTF — same engine, separate page.
          </p>
        </div>
      </section>

      <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            Which format should I convert to?
          </h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Target</th>
                  <th className="px-4 py-3 text-left font-semibold">Pick it when</th>
                </tr>
              </thead>
              <tbody>
                {WHY_FORMAT.map(({ fmt, use }) => (
                  <tr key={fmt} className="border-t border-zinc-200 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left font-medium align-top whitespace-nowrap">
                      {FORMAT_LABELS[fmt]}
                    </th>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4 max-w-3xl">
            Longer comparison in the{" "}
            <Link href="/reference/stl-vs-obj-vs-3mf/" className="text-blue-600 dark:text-blue-400 hover:underline">
              STL vs OBJ vs 3MF vs GLB vs PLY
            </Link>{" "}
            reference.
          </p>
        </div>
      </section>

      <section className="border-t border-zinc-200 dark:border-zinc-800 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Images & vectors to 3D</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
              Not a mesh conversion — brightness becomes height, or a vector
              outline gets extruded into a solid.
            </p>
            <LinkGrid
              items={[
                ...IMAGE_ROUTES.map((r) => ({
                  href: `/${r.slug}/`,
                  title: r.title,
                  desc: "Heightmap relief or lithophane",
                })),
                ...VECTOR_ROUTES.map((r) => ({
                  href: `/${r.slug}/`,
                  title: r.title,
                  desc: "Extrude filled vector paths into a solid",
                })),
              ]}
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">2D CAD, laser & CNC</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
              DXF is a 2D drawing format, so these either trace an image, take a
              real cross-section through a model, or extrude a drawing.
            </p>
            <LinkGrid
              items={DXF_ROUTES.map((r) => ({
                href: `/${r.slug}/`,
                title: r.title,
                desc: r.slug === "dxf-viewer"
                  ? "Open a .dxf drawing in the browser"
                  : r.slug === "dxf-to-stl"
                    ? "Extrude a drawing into a printable solid"
                    : r.slug.startsWith("stl") || r.slug.startsWith("step")
                      ? "Cross-section a model into a 2D outline"
                      : "Trace an image into cuttable polylines",
              }))}
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Viewers</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
              Open a file and look at it — no conversion, no install, no account.
            </p>
            <LinkGrid
              items={VIEWER_ROUTES.map((r) => ({
                href: `/${r.slug}/`,
                title: r.title,
                desc: "Rotate, zoom and inspect in the browser",
              }))}
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Tools</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
              Everything that isn&apos;t a format conversion: repair, editing,
              print checks and slicer interop.
            </p>
            <LinkGrid
              items={TOOL_ROUTES.map((r) => ({
                href: `/tools/${r.slug}/`,
                title: r.title,
                desc: "Free, in-browser, nothing uploaded",
              }))}
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Reference</h2>
            <LinkGrid
              items={REFERENCE_ROUTES.map((r) => ({
                href: `/reference/${r.slug}/`,
                title: r.title,
                desc: "Comparison & lookup tables",
              }))}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            Frequently asked questions
          </h2>
          <dl className="space-y-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  {f.q}
                </dt>
                <dd className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
