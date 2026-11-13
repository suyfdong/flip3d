import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";
import { CONTACT_EMAIL, GITHUB_ISSUES_URL, GITHUB_REPO_URL } from "@/lib/contact";

const URL = `${SITE_URL}/about/`;

export const metadata: Metadata = {
  title: "About Flip3D — Free, Local, Open 3D File Tools",
  description:
    "Flip3D is a free 3D file converter, viewer and print checker that runs entirely in your browser. No upload, no signup, no watermark. Open source on GitHub.",
  alternates: { canonical: URL },
  openGraph: {
    title: "About Flip3D",
    description:
      "Free 3D file converter, viewer and print checker running entirely in your browser.",
    url: URL,
    siteName: "Flip3D",
    type: "website",
  },
};

const linkClass =
  "text-blue-600 dark:text-blue-400 underline hover:no-underline";

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
          Flip3D is a converter, viewer and print-checking toolbox for 3D files.
          It reads 11 formats — STL, OBJ, GLB/glTF, 3MF, PLY, STEP, IGES, FBX,
          DAE, USDZ and WRL — writes STL, OBJ, GLB, 3MF and PLY, and adds
          image → 3D, SVG → 3D and DXF pipelines for people who start from a
          picture or a 2D drawing instead of a model. Everything runs in your
          browser through{" "}
          <a
            href="https://threejs.org"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
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
          What&apos;s in it today
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>52 conversion landing pages</strong> — every mesh direction
            between STL, OBJ, GLB, 3MF and PLY, plus STEP, IGES, FBX, DAE, USDZ
            and WRL into any of those five. The read-only formats are labelled
            as such, not hidden.
          </li>
          <li>
            <strong>12 viewer pages</strong> with orbit/zoom, cross-section
            clipping, distance, angle and hole-diameter measuring, and a part
            tree that shows plates, filament slots and part colours for 3MF and
            STEP assemblies.
          </li>
          <li>
            <strong>7 tools</strong> for the jobs the conversions can&apos;t
            do: Bambu ↔ Prusa 3MF repacking, a G-code simulator,{" "}
            <Link href="/tools/stl-repair/" className={linkClass}>
              STL repair
            </Link>
            ,{" "}
            <Link href="/tools/print-checker/" className={linkClass}>
              a print-readiness checker
            </Link>{" "}
            (watertight, manifold, overhangs, bed fit), an{" "}
            <Link href="/tools/stl-editor/" className={linkClass}>
              STL editor
            </Link>{" "}
            for scaling and rotating, and a mesh compressor.
          </li>
          <li>
            <strong>Image, vector and 2D pipelines</strong> — photo → STL and
            lithophanes, coloured reliefs, SVG extrusion, a full DXF path for
            laser and CNC work, and 3D → PNG/JPG renders for thumbnails.
          </li>
          <li>
            <strong>A reference library</strong> — start with{" "}
            <Link
              href="/reference/stl-vs-obj-vs-3mf/"
              className={linkClass}
            >
              STL vs OBJ vs 3MF vs GLB vs PLY
            </Link>{" "}
            or{" "}
            <Link href="/reference/bambu-vs-prusa/" className={linkClass}>
              Bambu vs Prusa
            </Link>
            .
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          Built for 3D printing first
        </h2>
        <p>
          Most file converters treat 3D printing as just another format list.
          A lot of the work here goes into the parts that actually break a
          print: Bambu Studio and OrcaSlicer save their projects with the 3MF
          production extension, where the geometry lives in separate object
          files that PrusaSlicer and other readers reject — Flip3D flattens
          those parts into a single core-spec 3MF before anything else happens.
          The{" "}
          <Link href="/tools/print-checker/" className={linkClass}>
            print checker
          </Link>{" "}
          then tells you whether the mesh is watertight, how much of it has to
          stand on support, and whether it even fits your printer bed. When a
          tool can&apos;t do something honestly — turning a triangle mesh back
          into editable CAD, for example — the page says so instead of shipping
          a fake.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          How it&apos;s built
        </h2>
        <p>
          Next.js and Tailwind CSS for the UI. three.js for parsing, viewing and
          exporting meshes; occt-import-js (OpenCascade compiled to WebAssembly)
          for STEP and IGES. JSZip for 3MF packaging. Cloudflare Pages for
          static hosting. All client-side — the server&apos;s only job is to
          send you the HTML and JavaScript. The source is public on{" "}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            GitHub
          </a>
          , including the converters, so you can check what a tool does before
          you trust it with a file.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          Free, forever
        </h2>
        <p>
          No signup, no email capture, no premium tier locked behind a
          paywall. The site is paid for by a few banner ads (placed below the
          tools, never inside them, no pop-ups) and by clearly labeled
          affiliate links. If we ever add anything paid, it will be
          additional — every tool that&apos;s free today stays free. Flip3D is
          run by an independent developer, not a company, and there are no
          investors to satisfy.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          Get in touch
        </h2>
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
            {CONTACT_EMAIL}
          </a>{" "}
          for anything that doesn&apos;t fit in a public thread — privacy
          questions, advertising, a file you&apos;d rather not attach to a
          GitHub issue. Bugs and feature requests are fastest on{" "}
          <a
            href={GITHUB_ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            GitHub issues
          </a>
          , where the fix is public and everyone can see it.
        </p>
      </section>
    </article>
  );
}
