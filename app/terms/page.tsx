import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/terms/`;
const LAST_UPDATED = "May 13, 2026";

export const metadata: Metadata = {
  title: "Terms of Service — Flip3D",
  description:
    "Plain-English terms for using Flip3D. Provided as-is, no warranty, no liability. Free to use, free to share.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Flip3D Terms of Service",
    description:
      "Plain-English terms for using Flip3D. Free, as-is, no warranty.",
    url: URL,
    siteName: "Flip3D",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
          Legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Last updated: {LAST_UPDATED}
        </p>
      </header>

      <section className="space-y-5 text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-5">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            TL;DR
          </p>
          <p className="text-sm">
            Flip3D is free, provided as-is. Use it for anything legal. We
            can&apos;t promise it&apos;ll never break or that conversions are
            100% lossless. Keep backups of important files.
          </p>
        </div>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          1. The service
        </h2>
        <p>
          Flip3D is a free web application that converts and views 3D files
          in your browser. By using it, you agree to these terms. If you
          don&apos;t agree, please don&apos;t use the site.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          2. Provided as-is
        </h2>
        <p>
          Flip3D is provided <strong>as-is, without warranty of any kind</strong>.
          We make no guarantees about uptime, accuracy of conversions,
          preservation of metadata, or fitness for any particular purpose.
          File format conversions can be lossy by nature — always verify
          critical outputs and keep originals.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          3. Acceptable use
        </h2>
        <p>
          You agree not to use Flip3D to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Process files you don&apos;t have rights to convert or distribute</li>
          <li>Attempt to overload, attack, or reverse-engineer infrastructure</li>
          <li>Violate any applicable law in your jurisdiction</li>
        </ul>
        <p>
          All processing is local to your browser, so there&apos;s nothing on
          our servers to overload — but please be reasonable.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          4. Your content
        </h2>
        <p>
          Your 3D files are yours. Flip3D never sees them, stores them, or
          transfers them anywhere. You retain all rights to anything you
          create, convert, or download.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          5. Limitation of liability
        </h2>
        <p>
          To the maximum extent permitted by law, Flip3D and its operators are
          not liable for any direct, indirect, incidental, or consequential
          damages arising from your use of the service. This includes data
          loss, file corruption, lost time, or any other harm.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          6. Open source
        </h2>
        <p>
          The Flip3D web application source code is available on{" "}
          <a
            href="https://github.com/suyfdong/flip3d"
            target="_blank"
            rel="noopener"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            GitHub
          </a>
          . You&apos;re free to fork it, learn from it, or contribute. The
          &quot;Flip3D&quot; name and branding remain ours.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          7. Changes
        </h2>
        <p>
          We may update these terms occasionally. Material changes will bump
          the &quot;Last updated&quot; date above. Continued use of the site
          after changes means you accept the new terms.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          8. Contact
        </h2>
        <p>
          Questions: open an issue on{" "}
          <a
            href="https://github.com/suyfdong/flip3d/issues"
            target="_blank"
            rel="noopener"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            GitHub
          </a>
          .
        </p>

        <p className="text-sm text-zinc-500 dark:text-zinc-500 pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-8">
          See also: <Link href="/privacy/" className="text-blue-600 dark:text-blue-400 underline hover:no-underline">Privacy Policy</Link>
        </p>
      </section>
    </article>
  );
}
