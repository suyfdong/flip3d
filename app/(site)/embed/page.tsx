import type { Metadata } from "next";
import EmbedCodeGenerator from "@/components/EmbedCodeGenerator";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/embed/`;

export const metadata: Metadata = {
  title: "Embed a 3D Model Viewer — Free iframe | Flip3D",
  description:
    "Embed an interactive 3D model viewer on any website with one line of HTML. Supports STL, OBJ, GLB, 3MF, PLY, and STEP. No signup, no fees.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Embed a 3D viewer on your site",
    description:
      "One line of iframe HTML embeds an interactive STL / GLB / 3MF / OBJ viewer.",
    url: URL,
    siteName: "Flip3D",
    type: "website",
  },
};

export default function Page() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
          For developers and bloggers
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          Embed a 3D viewer on any site
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
          One line of iframe HTML drops a fully interactive viewer onto your
          blog, docs, or product page. Supports STL, OBJ, GLB, 3MF, PLY, and
          STEP. No signup, no fees, no API limits — your file URL goes in, an
          interactive viewer comes out.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          Code generator
        </h2>
        <EmbedCodeGenerator />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          How it works
        </h2>
        <ol className="space-y-3 text-zinc-700 dark:text-zinc-300 list-decimal pl-6">
          <li>
            Host your 3D model anywhere that allows CORS (GitHub releases,
            Cloudflare R2, S3 with public read, your own server with{" "}
            <code className="font-mono text-sm bg-zinc-100 dark:bg-zinc-900 px-1 rounded">
              Access-Control-Allow-Origin: *
            </code>
            ).
          </li>
          <li>
            Paste your model URL into the generator above. Pick a height.
          </li>
          <li>
            Copy the iframe HTML and paste it into your page, blog post, or
            documentation.
          </li>
          <li>
            Done. The viewer loads, runs entirely in the visitor&apos;s
            browser, and a small{" "}
            <span className="font-semibold">Powered by Flip3D</span> link sits
            in the corner.
          </li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          Parameters
        </h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Param
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Required
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">
                  url
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  Yes
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  Public URL to a STL, OBJ, GLB, 3MF, PLY, or STEP file. Must
                  be CORS-accessible.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">
                  format
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  No
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  Override format detection. Use when the URL doesn&apos;t end
                  in a recognized extension. Values:{" "}
                  <code className="font-mono text-xs">stl | obj | glb | 3mf | ply | step</code>.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">FAQ</h2>
        <div className="space-y-5">
          <Faq
            q="Will my model URL show up in someone else's analytics?"
            a="Flip3D doesn't proxy your file — the visitor's browser fetches it directly from your URL. Your host sees the request, with the visitor's referer pointing at the page that embedded the iframe."
          />
          <Faq
            q="What about CORS errors?"
            a="Whatever you host the file on must send Access-Control-Allow-Origin: * (or specifically allow flip3d.app). GitHub raw URLs, Cloudflare R2 with public access, and most CDNs allow CORS by default. Dropbox and Google Drive direct links generally don't."
          />
          <Faq
            q="Can I customize colors / background?"
            a="Not yet — v1 uses Flip3D's default brand color and neutral background for visual consistency. Theme parameters are on the roadmap."
          />
          <Faq
            q="Will the embed slow down my site?"
            a="The iframe is sandboxed and async, so it doesn't block your page load. The 3D engine loads in the iframe only when a visitor scrolls to it (lazy mode is on the roadmap; today it loads when the iframe mounts)."
          />
        </div>
      </section>
    </article>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
        {q}
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{a}</p>
    </div>
  );
}
