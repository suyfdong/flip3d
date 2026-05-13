import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

const TITLE =
  "Bambu Lab vs Prusa — Slicers, 3MF Files, and the Cross-Vendor Workflow";
const DESCRIPTION =
  "Practical comparison of Bambu Studio vs PrusaSlicer for everyday printing, plus what actually happens when you move .3mf files between them.";
const URL = `${SITE_URL}/reference/bambu-vs-prusa/`;

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
    title: "Bambu Lab vs Prusa: Slicers, 3MF, Workflow",
    description: DESCRIPTION,
  },
};

type Row = {
  dimension: string;
  bambu: string;
  prusa: string;
};

const COMPARISON: Row[] = [
  {
    dimension: "Default slicer",
    bambu: "Bambu Studio (closed source, fast, AMS-first)",
    prusa: "PrusaSlicer (open source, mature, profile-rich)",
  },
  {
    dimension: "Native file",
    bambu: ".3mf (Bambu flavor with metadata, calibration, AMS map)",
    prusa: ".3mf (Prusa flavor, generally cleaner subset)",
  },
  {
    dimension: "Multi-material",
    bambu: "AMS (4-color carousel, easy swap)",
    prusa: "MMU3 (5-color, more setup, more flexibility)",
  },
  {
    dimension: "Ecosystem",
    bambu: "Bambu Handy app, MakerWorld for models, cloud-tied",
    prusa: "Printables.com, fully offline-capable",
  },
  {
    dimension: "Speed (out of box)",
    bambu: "Aggressive — 250-500 mm/s claimed, fast acceleration",
    prusa: "Conservative — 200 mm/s typical, prioritizes reliability",
  },
  {
    dimension: "Hardware philosophy",
    bambu: "Closed enclosure, fewer mods, paid spare parts",
    prusa: "Open frame, mod-friendly, free CAD for parts",
  },
  {
    dimension: "Open source",
    bambu: "Slicer partially, firmware closed",
    prusa: "Slicer + firmware fully open",
  },
];

type Pain = { title: string; problem: string; fix: string };

const PAIN_POINTS: Pain[] = [
  {
    title: "Bambu .3mf won't open in PrusaSlicer",
    problem:
      "Bambu Studio writes Bambu-specific namespaces (AMS mapping, calibration, project_settings.config). PrusaSlicer either rejects the file or loads it with all the metadata stripped.",
    fix: "Convert the file via a generic .3mf rewriter or export from Bambu Studio as a plain .stl/.3mf with metadata stripped. A dedicated Bambu → Prusa converter is on our roadmap (W4).",
  },
  {
    title: "Prusa .3mf in Bambu Studio loses MMU3 colors",
    problem:
      "MMU3 multi-material assignments don't translate to AMS slots. The geometry imports fine; color/material assignment has to be redone manually.",
    fix: "Redo color painting in Bambu Studio, or export as .stl from PrusaSlicer first and start fresh.",
  },
  {
    title: "Wildly different print times for the same model",
    problem:
      "Slicers use different default profiles, speeds, and acceleration. A 6-hour Prusa print might slice as 3.5 hours in Bambu Studio — and vice versa.",
    fix: "Compare actual G-code outputs, not slicer time estimates. The same physical printer can&apos;t magically print twice as fast — the optimistic estimate is wrong about something.",
  },
  {
    title: "Calibration profiles don't transfer",
    problem:
      "Pressure advance / linear advance values calibrated for one slicer often don't apply correctly when imported into the other.",
    fix: "Re-run calibration in the destination slicer. Faster than chasing why prints look different.",
  },
];

type FaqItem = { q: string; a: string };

const FAQ: FaqItem[] = [
  {
    q: "Is Bambu Lab better than Prusa?",
    a: "Wrong question. Bambu Lab is faster out of the box and more turnkey; Prusa is more open, more modular, and more repairable. If you value plug-and-play and speed, pick Bambu. If you value control, openness, and a 10-year-old ecosystem, pick Prusa.",
  },
  {
    q: "Can PrusaSlicer slice for a Bambu X1C?",
    a: "Technically yes — community profiles exist — but the result usually loses Bambu-specific optimizations and AMS support. Use Bambu Studio (or OrcaSlicer, which is a fork that supports both) unless you have a specific reason.",
  },
  {
    q: "What is OrcaSlicer and how does it fit in?",
    a: "Community fork of Bambu Studio that's grown into a unified slicer for Bambu, Prusa, Voron, Creality, and more. Many users switch to Orca specifically to avoid the Bambu/Prusa file conversion problem — it speaks both natively.",
  },
  {
    q: "Why does Bambu Lab make my prints fast, but the prints look slightly worse?",
    a: "Speed-vs-quality tradeoff. Bambu Studio's default profiles prioritize speed; Prusa's prioritize quality. Either slicer can be tuned the other way, but defaults reveal the philosophy.",
  },
  {
    q: "Should I switch from Prusa to Bambu (or vice versa)?",
    a: "Usually no — they solve overlapping problems differently. Switching means relearning slicer quirks, reprinting calibration objects, and rebuilding your tweaked profiles. Switch only if a specific feature (AMS, MMU3, build volume, footprint) is a hard requirement.",
  },
];

export default function Page() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
          Workflow Reference
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          Bambu Lab vs Prusa
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Slicers, .3mf files, and what actually breaks when you try to share
          a file between Bambu Studio and PrusaSlicer. From people who&apos;ve
          done it.
        </p>
      </header>

      <section className="mb-12 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-5 sm:p-6">
        <h2 className="text-base font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
          TL;DR
        </h2>
        <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>Bambu Lab</strong> — fastest out of box, AMS-first, more
            closed.
          </li>
          <li>
            <strong>Prusa</strong> — open, mod-friendly, longer lineage.
          </li>
          <li>
            <strong>Their .3mf files don&apos;t cleanly cross over.</strong>{" "}
            That&apos;s the workflow pain people complain about. There&apos;s
            no fix in either slicer today.
          </li>
          <li>
            <strong>OrcaSlicer</strong> reads both natively — fastest escape
            hatch.
          </li>
        </ul>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-5">
          Side-by-side comparison
        </h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Dimension
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Bambu Lab
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Prusa
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr
                  key={row.dimension}
                  className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {row.dimension}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {row.bambu}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {row.prusa}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-5">
          The real pain points (and how to dodge them)
        </h2>
        <div className="space-y-5">
          {PAIN_POINTS.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
                <strong className="text-zinc-700 dark:text-zinc-300">
                  Problem:
                </strong>{" "}
                {p.problem}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <strong className="text-blue-700 dark:text-blue-400">
                  Workaround:
                </strong>{" "}
                {p.fix}
              </p>
            </div>
          ))}
        </div>
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

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 mb-8">
        <h2 className="text-xl font-bold tracking-tight mb-3">
          Coming soon: dedicated Bambu ↔ Prusa converter
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          We&apos;re shipping a focused tool that converts Bambu Studio .3mf
          files into PrusaSlicer-compatible .3mf (and vice versa), preserving
          geometry and color where possible. Target: W4 of our public
          roadmap.
        </p>
        <p className="text-sm">
          <a
            href="https://github.com/suyfdong/flip3d/issues"
            target="_blank"
            rel="noopener"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            Watch the GitHub repo
          </a>{" "}
          to be notified when it ships.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold mb-3">In the meantime</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          The {`free`} converters at Flip3D let you bounce files between mesh
          formats in your browser — useful for stripping vendor-specific
          metadata or extracting plain geometry.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <Link
            href="/3mf-to-stl/"
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700 text-center font-mono text-xs"
          >
            3MF → STL
          </Link>
          <Link
            href="/stl-to-3mf/"
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700 text-center font-mono text-xs"
          >
            STL → 3MF
          </Link>
          <Link
            href="/3mf-to-stl/"
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700 text-center font-mono text-xs"
          >
            View 3MF
          </Link>
          <Link
            href="/reference/stl-vs-obj-vs-3mf/"
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700 text-center font-mono text-xs"
          >
            Format guide
          </Link>
        </div>
      </section>
    </article>
  );
}
