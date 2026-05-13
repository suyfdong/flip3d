import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/about/`;

export const metadata: Metadata = {
  title: "About Flip3D — Free, Local, Open 3D File Tools",
  description:
    "Flip3D is a free 3D file converter and viewer that runs entirely in your browser. No upload, no signup, no watermark. Open source on GitHub.",
  alternates: { canonical: URL },
  openGraph: {
    title: "About Flip3D",
    description:
      "Free 3D file converter and viewer running entirely in your browser.",
    url: URL,
    siteName: "Flip3D",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
          About
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Free 3D file tools that respect your time and your data
        </h1>
      </header>

      <section className="prose prose-zinc dark:prose-invert max-w-none space-y-5 text-zinc-700 dark:text-zinc-300">
        <p>
          Flip3D is a converter, viewer, and (soon) repair toolbox for 3D
          files. STL, OBJ, GLB, 3MF, PLY today — STEP, FBX, and more on the
          way. Everything runs in your browser through{" "}
          <a
            href="https://threejs.org"
            target="_blank"
            rel="noopener"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            three.js
          </a>{" "}
          and WebAssembly. Your files never leave your device.
        </p>

        <p>
          We built this because the existing converter sites are slow, ad-laden,
          gate features behind email signups, and upload every file you drop
          to some server &quot;just in case.&quot; The browser is fast enough
          to do this work locally. So we did.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          What you get
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>5 mesh formats convertible to each other, today</li>
          <li>A unified 3D viewer with orbit, zoom, and model stats</li>
          <li>One-click sample files so you can try the tool without finding a 3D file first</li>
          <li>Dedicated landing pages for every conversion direction</li>
          <li>A growing reference library — start with{" "}
            <Link href="/reference/stl-vs-obj-vs-3mf/" className="text-blue-600 dark:text-blue-400 underline hover:no-underline">
              STL vs OBJ vs 3MF vs GLB vs PLY
            </Link>
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          What&apos;s coming
        </h2>
        <p>
          We&apos;re building in public. The 12-week roadmap is on{" "}
          <a
            href="https://github.com/suyfdong/flip3d"
            target="_blank"
            rel="noopener"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            GitHub
          </a>
          . Highlights:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Bambu 3MF ↔ Prusa 3MF converter (the cross-vendor pain point)</li>
          <li>G-code simulator for previewing 3D-print toolpaths</li>
          <li>STL repair (non-manifold edges, holes, self-intersections)</li>
          <li>Embeddable viewer iframe for blogs and documentation</li>
          <li>STEP / FBX / IGES support for CAD interchange</li>
        </ul>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          How it&apos;s built
        </h2>
        <p>
          Next.js + Tailwind CSS for the UI. three.js for parsing, viewing, and
          exporting meshes. JSZip for 3MF packaging. Cloudflare Pages for
          static hosting at the edge. All client-side; the server&apos;s only
          job is to send you the HTML and JS.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          Free, forever
        </h2>
        <p>
          No signup, no email capture, no premium tier locked behind a
          paywall. If we ever add anything paid, it will be additional — every
          tool that&apos;s free today stays free.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          Get in touch
        </h2>
        <p>
          File a feature request or bug report on{" "}
          <a
            href="https://github.com/suyfdong/flip3d/issues"
            target="_blank"
            rel="noopener"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            GitHub issues
          </a>
          . That&apos;s the fastest path to anything getting fixed or built.
        </p>
      </section>
    </article>
  );
}
