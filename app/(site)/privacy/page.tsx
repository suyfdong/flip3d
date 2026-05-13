import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/privacy/`;
const LAST_UPDATED = "May 13, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy — Flip3D",
  description:
    "Flip3D processes every 3D file locally in your browser. We never see your files. Plain-English explanation of what data we do and don't collect.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Flip3D Privacy Policy",
    description:
      "Your files never leave your browser. Plain-English privacy policy.",
    url: URL,
    siteName: "Flip3D",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
          Legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Privacy Policy
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
            Your 3D files never leave your browser. We do collect anonymous
            usage analytics (Google Analytics 4) so we know which tools to
            prioritize. No accounts, no email collection, no selling data.
          </p>
        </div>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          What we never see
        </h2>
        <p>
          Every 3D file you load into Flip3D is parsed, viewed, converted, and
          downloaded entirely inside your browser. The bytes never travel to
          our servers. The application is a static site — there&apos;s no
          backend that could receive a file even if we wanted one.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          What we do collect
        </h2>

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-5 mb-2">
          Anonymous usage analytics (Google Analytics 4)
        </h3>
        <p>
          We use Google Analytics 4 to understand which tools and pages are
          used. GA4 sets cookies and reports back: pages visited, broad
          geographic region (country/city level), device type, referring site,
          and custom events like &quot;file_converted&quot; with the source
          and target format.
        </p>
        <p>
          We have configured GA4 to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Anonymize IP addresses (Google&apos;s default for EU traffic)</li>
          <li>Disable Google signals (no advertising personalization)</li>
          <li>Retain user-level data for 14 months, then auto-delete</li>
        </ul>
        <p>
          If you don&apos;t want this, install any ad/tracker blocker (uBlock
          Origin, Brave Shields, Firefox Strict Tracking Protection) — the
          tools still work identically without GA loaded.
        </p>

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-5 mb-2">
          Cloudflare access logs
        </h3>
        <p>
          The site is hosted on Cloudflare Pages. Cloudflare retains standard
          access logs (IP, user agent, requested URL) for ~24 hours for abuse
          prevention and performance analytics. We don&apos;t actively inspect
          them.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          What we don&apos;t do
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Sell, rent, or share data with third parties</li>
          <li>Run advertising networks</li>
          <li>Send marketing email — we don&apos;t have your email</li>
          <li>Use cross-site tracking pixels (Facebook, TikTok, etc.)</li>
          <li>Profile you for ad targeting</li>
        </ul>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          Cookies
        </h2>
        <p>
          Cookies set by Flip3D: <strong>only Google Analytics 4&apos;s</strong>
          {" "}(<code className="font-mono text-sm bg-zinc-100 dark:bg-zinc-900 px-1 rounded">_ga</code>,{" "}
          <code className="font-mono text-sm bg-zinc-100 dark:bg-zinc-900 px-1 rounded">_ga_*</code>).
          You can clear them from your browser settings at any time.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          GDPR / CCPA
        </h2>
        <p>
          Because no personal data is collected by Flip3D directly — only
          anonymous, aggregated analytics by Google — there&apos;s nothing
          tied to your identity to access, export, or delete on our side.
          For Google Analytics data on Google&apos;s servers, see{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            Google&apos;s privacy policy
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          Changes to this policy
        </h2>
        <p>
          If we change anything material — new analytics provider, payment
          processor, etc. — we&apos;ll update this page and the &quot;Last
          updated&quot; date above. The full history is in the public{" "}
          <a
            href="https://github.com/suyfdong/flip3d"
            target="_blank"
            rel="noopener"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            GitHub repository
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          Contact
        </h2>
        <p>
          Questions or concerns: open an issue on{" "}
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
      </section>
    </article>
  );
}
