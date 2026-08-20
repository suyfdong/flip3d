// Server component: appends an About + FAQ block to a tool landing page and
// emits FAQPage + Breadcrumb JSON-LD into the static HTML. Used to enrich the
// image→3D pages (which render a client tool) with keyword-variant content
// without touching the interactive component.

import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

type Props = {
  /** Breadcrumb leaf name, e.g. "Photo to STL". */
  crumbName: string;
  /** Absolute canonical URL of the page. */
  crumbUrl: string;
  aboutTitle?: string;
  about?: string[];
  /**
   * Optional numbered "how to <do the thing>" block. Tool pages need this
   * because the query cluster is almost entirely question-shaped — "how to
   * edit stl files", "how to modify stl file" — while the page itself only
   * had noun phrasing. This stays operational (the actual steps in this tool),
   * not a "what is X" explainer, per the no-explainer-content rule.
   */
  stepsTitle?: string;
  steps?: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  /** Optional internal cross-links (keeps sibling pages from being orphaned). */
  related?: { href: string; title: string; desc: string }[];
};

export default function SeoFaqSection({
  crumbName,
  crumbUrl,
  aboutTitle,
  about,
  stepsTitle,
  steps,
  faq,
  related,
}: Props) {
  return (
    <>
      <JsonLd data={faqPageSchema(faq)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Flip3D", url: `${SITE_URL}/` },
          { name: crumbName, url: crumbUrl },
        ])}
      />

      {about && about.length > 0 && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 py-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {aboutTitle && (
              <h2 className="text-2xl font-bold tracking-tight mb-5">
                {aboutTitle}
              </h2>
            )}
            <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {about.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {steps && steps.length > 0 && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 py-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-6">
              {stepsTitle ?? "How it works"}
            </h2>
            <ol className="space-y-5">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex-none w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {step.title}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {faq.length > 0 && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-6">
              Frequently asked questions
            </h2>
            <dl className="space-y-6">
              {faq.map((f) => (
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

            {related && related.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10">
                {related.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
                  >
                    <div className="font-semibold">{l.title}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {l.desc}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
