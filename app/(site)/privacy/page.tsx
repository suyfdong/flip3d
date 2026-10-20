import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/privacy/`;
const LAST_UPDATED = "October 20, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy — Flip3D",
  description:
    "Flip3D processes every 3D file locally in your browser. We never see your files. Plain-English explanation of the analytics, advertising cookies and affiliate links on the site.",
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
            Your 3D files never leave your browser — ads and analytics never
            see them. To keep the tools free, the site shows a small number of
            ads and a few disclosed affiliate links, and uses Google Analytics
            4 to see which tools get used. No accounts, no email collection.
            Visitors in the EEA, UK and Switzerland are asked for consent
            before advertising cookies are set.
          </p>
        </div>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          What we never see
        </h2>
        <p>
          Every 3D file you load into Flip3D is parsed, viewed, converted, and
          downloaded entirely inside your browser. The bytes never travel to
          our servers. The application is a static site — there&apos;s no
          backend that could receive a file even if we wanted one. Ad and
          analytics scripts run on the page, but they have no access to the
          files you open: the files are held in memory by our code and are
          never sent in any network request.
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

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-5 mb-2">
          Advertising (Google AdSense and Adsterra)
        </h3>
        <p>
          Some pages show ads, placed below the tools rather than inside them.
          Ads are served by Google AdSense and by Adsterra. These third-party
          vendors, including Google, use cookies and similar identifiers to
          serve ads based on your prior visits to this and other websites,
          to limit how often you see an ad, and to measure ad performance and
          prevent fraud. They receive standard request data such as your IP
          address, browser and device type, and the page URL.
        </p>
        <p>
          Google&apos;s use of advertising cookies enables it and its partners
          to serve ads to you based on your visits to Flip3D and/or other
          sites on the internet. You can opt out of personalized advertising
          in{" "}
          <a href="https://adssettings.google.com/" target="_blank" rel="noopener" className="text-blue-600 dark:text-blue-400 underline hover:no-underline">
            Google Ads Settings
          </a>{" "}
          or, for other participating vendors, at{" "}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener" className="text-blue-600 dark:text-blue-400 underline hover:no-underline">
            aboutads.info
          </a>
          . See{" "}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener" className="text-blue-600 dark:text-blue-400 underline hover:no-underline">
            how Google uses information from sites that use its services
          </a>{" "}
          and{" "}
          <a href="https://adsterra.com/privacy-policy/" target="_blank" rel="noopener" className="text-blue-600 dark:text-blue-400 underline hover:no-underline">
            Adsterra&apos;s privacy policy
          </a>
          .
        </p>
        <p>
          We only use banner-style ads. We don&apos;t run pop-ups, pop-unders,
          redirects or full-screen interstitials, and ads are never shown in
          the embeddable viewer that other sites put on their pages.
        </p>

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-5 mb-2">
          Affiliate links
        </h3>
        <p>
          A few pages link to retailers such as the Bambu Lab store through an
          affiliate program, marked &quot;affiliate link&quot; next to the
          link. If you buy something after clicking, we may earn a commission
          at no extra cost to you. The affiliate network may set a cookie
          when you click so the sale can be attributed. Nothing is set until
          you click.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          What we don&apos;t do
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>See, store or upload your 3D files</li>
          <li>Sell personal data we hold — we don&apos;t hold any</li>
          <li>Send marketing email — we don&apos;t have your email</li>
          <li>Use social-media tracking pixels (Facebook, TikTok, etc.)</li>
          <li>Show pop-ups, pop-unders or redirect ads</li>
        </ul>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          Cookies
        </h2>
        <p>
          Flip3D itself sets no cookies of its own. Third parties on the page
          may set:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Analytics</strong> — Google Analytics 4 (
            <code className="font-mono text-sm bg-zinc-100 dark:bg-zinc-900 px-1 rounded">_ga</code>,{" "}
            <code className="font-mono text-sm bg-zinc-100 dark:bg-zinc-900 px-1 rounded">_ga_*</code>)
          </li>
          <li>
            <strong>Advertising</strong> — Google AdSense and Adsterra, to
            serve, cap and measure ads
          </li>
          <li>
            <strong>Consent</strong> — Google&apos;s consent message stores the
            choice you made
          </li>
          <li>
            <strong>Affiliate</strong> — only after you click an affiliate
            link
          </li>
        </ul>
        <p>
          In the EEA, the UK and Switzerland, analytics and advertising
          cookies are only set after you agree in the consent message, and
          Adsterra ads are not loaded at all unless you consent. You can
          change your choice any time with &quot;Privacy choices&quot; in the
          site footer, clear cookies in your browser settings, or use a
          content blocker — the tools work the same either way.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
          Your rights (GDPR / UK GDPR / US state laws)
        </h2>
        <p>
          Flip3D has no accounts and stores nothing tied to your identity, so
          there&apos;s nothing on our side to access, export, or delete. Data
          collected by Google and Adsterra through cookies is handled under
          their policies; the consent message and &quot;Privacy choices&quot;
          link let you withdraw consent or opt out of personalized ads,
          including where US state laws treat ad targeting as a &quot;sale&quot;
          or &quot;sharing&quot; of personal information. For Google&apos;s
          handling, see{" "}
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
          If we change anything material — a new analytics provider or ad
          network, for example — we&apos;ll update this page and the &quot;Last
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
