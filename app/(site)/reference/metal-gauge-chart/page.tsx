import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";

const TITLE =
  "Sheet Metal Gauge to mm/inch Chart — Steel, Aluminum, Stainless";
const DESCRIPTION =
  "Practical sheet metal gauge reference. Convert gauge number to millimeters or inches for steel, aluminum, and stainless steel. Used by fabricators, makers, and CAD engineers.";
const URL = `${SITE_URL}/reference/metal-gauge-chart/`;

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
    title: "Sheet Metal Gauge Chart — Steel, Aluminum, Stainless",
    description: DESCRIPTION,
  },
};

type Row = {
  gauge: number;
  steelMm: string;
  steelIn: string;
  galvMm: string;
  galvIn: string;
  alumMm: string;
  alumIn: string;
  ssMm: string;
  ssIn: string;
};

// Manufacturers' Standard Gauge (steel/galvanized) and Brown & Sharpe (aluminum)
// Stainless steel: Manufacturers' Standard converted from US sheet metal practice
const ROWS: Row[] = [
  { gauge: 3,  steelMm: "6.07", steelIn: "0.2391", galvMm: "—",    galvIn: "—",     alumMm: "5.83", alumIn: "0.2294", ssMm: "6.07", ssIn: "0.2391" },
  { gauge: 4,  steelMm: "5.69", steelIn: "0.2242", galvMm: "—",    galvIn: "—",     alumMm: "5.19", alumIn: "0.2043", ssMm: "5.69", ssIn: "0.2242" },
  { gauge: 5,  steelMm: "5.31", steelIn: "0.2092", galvMm: "—",    galvIn: "—",     alumMm: "4.62", alumIn: "0.1819", ssMm: "5.31", ssIn: "0.2092" },
  { gauge: 6,  steelMm: "4.94", steelIn: "0.1943", galvMm: "—",    galvIn: "—",     alumMm: "4.11", alumIn: "0.1620", ssMm: "4.94", ssIn: "0.1943" },
  { gauge: 7,  steelMm: "4.55", steelIn: "0.1793", galvMm: "—",    galvIn: "—",     alumMm: "3.67", alumIn: "0.1443", ssMm: "4.76", ssIn: "0.1875" },
  { gauge: 8,  steelMm: "4.18", steelIn: "0.1644", galvMm: "4.27", galvIn: "0.1681", alumMm: "3.26", alumIn: "0.1285", ssMm: "4.37", ssIn: "0.1719" },
  { gauge: 9,  steelMm: "3.80", steelIn: "0.1495", galvMm: "3.89", galvIn: "0.1532", alumMm: "2.91", alumIn: "0.1144", ssMm: "3.97", ssIn: "0.1563" },
  { gauge: 10, steelMm: "3.42", steelIn: "0.1345", galvMm: "3.51", galvIn: "0.1382", alumMm: "2.59", alumIn: "0.1019", ssMm: "3.57", ssIn: "0.1406" },
  { gauge: 11, steelMm: "3.04", steelIn: "0.1196", galvMm: "3.12", galvIn: "0.1233", alumMm: "2.30", alumIn: "0.0907", ssMm: "3.18", ssIn: "0.1250" },
  { gauge: 12, steelMm: "2.66", steelIn: "0.1046", galvMm: "2.75", galvIn: "0.1084", alumMm: "2.05", alumIn: "0.0808", ssMm: "2.78", ssIn: "0.1094" },
  { gauge: 13, steelMm: "2.28", steelIn: "0.0897", galvMm: "2.37", galvIn: "0.0934", alumMm: "1.83", alumIn: "0.0720", ssMm: "2.38", ssIn: "0.0938" },
  { gauge: 14, steelMm: "1.90", steelIn: "0.0747", galvMm: "1.99", galvIn: "0.0785", alumMm: "1.63", alumIn: "0.0641", ssMm: "1.98", ssIn: "0.0781" },
  { gauge: 15, steelMm: "1.71", steelIn: "0.0673", galvMm: "1.80", galvIn: "0.0710", alumMm: "1.45", alumIn: "0.0571", ssMm: "1.79", ssIn: "0.0703" },
  { gauge: 16, steelMm: "1.52", steelIn: "0.0598", galvMm: "1.61", galvIn: "0.0635", alumMm: "1.29", alumIn: "0.0508", ssMm: "1.59", ssIn: "0.0625" },
  { gauge: 17, steelMm: "1.37", steelIn: "0.0538", galvMm: "1.46", galvIn: "0.0575", alumMm: "1.15", alumIn: "0.0453", ssMm: "1.43", ssIn: "0.0563" },
  { gauge: 18, steelMm: "1.21", steelIn: "0.0478", galvMm: "1.31", galvIn: "0.0516", alumMm: "1.02", alumIn: "0.0403", ssMm: "1.27", ssIn: "0.0500" },
  { gauge: 19, steelMm: "1.06", steelIn: "0.0418", galvMm: "1.15", galvIn: "0.0456", alumMm: "0.91", alumIn: "0.0359", ssMm: "1.11", ssIn: "0.0438" },
  { gauge: 20, steelMm: "0.91", steelIn: "0.0359", galvMm: "1.01", galvIn: "0.0396", alumMm: "0.81", alumIn: "0.0320", ssMm: "0.95", ssIn: "0.0375" },
  { gauge: 21, steelMm: "0.84", steelIn: "0.0329", galvMm: "0.93", galvIn: "0.0366", alumMm: "0.72", alumIn: "0.0285", ssMm: "0.87", ssIn: "0.0344" },
  { gauge: 22, steelMm: "0.76", steelIn: "0.0299", galvMm: "0.85", galvIn: "0.0336", alumMm: "0.64", alumIn: "0.0253", ssMm: "0.79", ssIn: "0.0313" },
  { gauge: 23, steelMm: "0.68", steelIn: "0.0269", galvMm: "0.77", galvIn: "0.0306", alumMm: "0.57", alumIn: "0.0226", ssMm: "0.71", ssIn: "0.0281" },
  { gauge: 24, steelMm: "0.60", steelIn: "0.0239", galvMm: "0.70", galvIn: "0.0276", alumMm: "0.51", alumIn: "0.0201", ssMm: "0.64", ssIn: "0.0250" },
  { gauge: 25, steelMm: "0.53", steelIn: "0.0209", galvMm: "0.62", galvIn: "0.0247", alumMm: "0.45", alumIn: "0.0179", ssMm: "0.56", ssIn: "0.0219" },
  { gauge: 26, steelMm: "0.45", steelIn: "0.0179", galvMm: "0.55", galvIn: "0.0217", alumMm: "0.40", alumIn: "0.0159", ssMm: "0.48", ssIn: "0.0188" },
  { gauge: 27, steelMm: "0.42", steelIn: "0.0164", galvMm: "0.51", galvIn: "0.0202", alumMm: "0.36", alumIn: "0.0142", ssMm: "0.44", ssIn: "0.0172" },
  { gauge: 28, steelMm: "0.38", steelIn: "0.0149", galvMm: "0.47", galvIn: "0.0187", alumMm: "0.32", alumIn: "0.0126", ssMm: "0.41", ssIn: "0.0156" },
  { gauge: 29, steelMm: "0.34", steelIn: "0.0135", galvMm: "0.44", galvIn: "0.0172", alumMm: "0.29", alumIn: "0.0113", ssMm: "0.36", ssIn: "0.0141" },
  { gauge: 30, steelMm: "0.30", steelIn: "0.0120", galvMm: "0.40", galvIn: "0.0157", alumMm: "0.25", alumIn: "0.0100", ssMm: "0.32", ssIn: "0.0125" },
];

type Application = { gauge: string; thickness: string; uses: string };

const COMMON_USES: Application[] = [
  { gauge: "10-12", thickness: "2.5-3.5 mm", uses: "Industrial enclosures, heavy-duty brackets, structural panels" },
  { gauge: "14-16", thickness: "1.5-2.0 mm", uses: "HVAC ducting (commercial), automotive body panels, kitchen sinks" },
  { gauge: "18-20", thickness: "1.0-1.2 mm", uses: "HVAC (residential), appliance casings, general fabrication" },
  { gauge: "22-24", thickness: "0.6-0.8 mm", uses: "Roof flashing, decorative panels, light kitchenware" },
  { gauge: "26-28", thickness: "0.4-0.5 mm", uses: "Stovepipes, light-duty enclosures, thin shielding" },
];

type FaqItem = { q: string; a: string };

const FAQ: FaqItem[] = [
  {
    q: "Why does the gauge number get bigger as the metal gets thinner?",
    a: "Historical accident from the wire-drawing industry. Higher gauge meant more passes through the drawing die, which produced thinner wire. The convention stuck, even though it's confusing to anyone who didn't grow up with it.",
  },
  {
    q: "Are aluminum and steel gauges the same thickness?",
    a: "No. Aluminum uses the Brown & Sharpe (B&S) gauge system, which is different from the Manufacturers' Standard used for steel. 18-gauge steel is about 1.21 mm, but 18-gauge aluminum is about 1.02 mm. Always check the material when reading gauge specs.",
  },
  {
    q: "What gauge is 1 mm aluminum?",
    a: "Roughly 18-gauge in the B&S system (1.02 mm). 1 mm aluminum is a common stock thickness for sheet-metal projects.",
  },
  {
    q: "Is 16-gauge stronger than 14-gauge?",
    a: "No — 14-gauge is thicker, therefore stronger. Lower gauge number = thicker metal = more stiffness and load-bearing capacity. The same applies to stud framing, where 16-gauge studs are noticeably thinner than 14-gauge.",
  },
  {
    q: "What's the standard ductwork gauge?",
    a: "Residential HVAC supply ducts are typically 26-30 gauge. Commercial supply ducts step up to 24-26 gauge. Plenums and large-volume ducts use 22 gauge or heavier. SMACNA tables are the authoritative source.",
  },
  {
    q: "Can I 3D print a part to replace sheet metal?",
    a: "For prototypes and low-stress parts, yes — 2-3 mm wall thickness in PETG or ABS roughly approximates 12-14 gauge stiffness. For structural or thermal applications, sheet metal still wins.",
  },
];

export default function Page() {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <JsonLd data={faqPageSchema(FAQ)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Reference", url: `${SITE_URL}/reference/metal-gauge-chart/` },
          { name: "Metal Gauge Chart", url: URL },
        ])}
      />
      <header className="mb-10">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
          Engineering Reference
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          Sheet Metal Gauge to mm / inch
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Quick conversion from gauge number to actual thickness in
          millimeters and inches, across steel, galvanized, aluminum, and
          stainless. Used by fabricators, sheet metal shops, and anyone
          designing parts in CAD that get laser-cut.
        </p>
      </header>

      <section className="mb-12 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-5 sm:p-6">
        <h2 className="text-base font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
          Quick mental model
        </h2>
        <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          <li><strong>Lower gauge = thicker metal.</strong> 12-gauge is stiffer than 18-gauge.</li>
          <li><strong>Steel uses Manufacturers&apos; Standard;</strong> aluminum uses Brown &amp; Sharpe. Same gauge number ≠ same thickness across materials.</li>
          <li><strong>Common rule of thumb:</strong> 16-gauge ≈ 1.5 mm, 18-gauge ≈ 1.2 mm, 20-gauge ≈ 0.9 mm (steel).</li>
        </ul>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-5">
          Gauge thickness chart
        </h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-xs sm:text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-left">
              <tr>
                <th rowSpan={2} className="px-3 py-2 font-semibold border-b border-r border-zinc-200 dark:border-zinc-800 align-middle">
                  Gauge
                </th>
                <th colSpan={2} className="px-3 py-2 font-semibold border-b border-r border-zinc-200 dark:border-zinc-800 text-center">
                  Steel
                </th>
                <th colSpan={2} className="px-3 py-2 font-semibold border-b border-r border-zinc-200 dark:border-zinc-800 text-center">
                  Galvanized
                </th>
                <th colSpan={2} className="px-3 py-2 font-semibold border-b border-r border-zinc-200 dark:border-zinc-800 text-center">
                  Aluminum
                </th>
                <th colSpan={2} className="px-3 py-2 font-semibold border-b border-zinc-200 dark:border-zinc-800 text-center">
                  Stainless
                </th>
              </tr>
              <tr>
                <th className="px-3 py-2 font-medium text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">mm</th>
                <th className="px-3 py-2 font-medium text-xs text-zinc-500 dark:text-zinc-400 border-b border-r border-zinc-200 dark:border-zinc-800">in</th>
                <th className="px-3 py-2 font-medium text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">mm</th>
                <th className="px-3 py-2 font-medium text-xs text-zinc-500 dark:text-zinc-400 border-b border-r border-zinc-200 dark:border-zinc-800">in</th>
                <th className="px-3 py-2 font-medium text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">mm</th>
                <th className="px-3 py-2 font-medium text-xs text-zinc-500 dark:text-zinc-400 border-b border-r border-zinc-200 dark:border-zinc-800">in</th>
                <th className="px-3 py-2 font-medium text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">mm</th>
                <th className="px-3 py-2 font-medium text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">in</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr
                  key={r.gauge}
                  className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <td className="px-3 py-2 font-mono font-semibold text-blue-600 dark:text-blue-400 border-r border-zinc-200 dark:border-zinc-800">
                    {r.gauge}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-700 dark:text-zinc-300">{r.steelMm}</td>
                  <td className="px-3 py-2 font-mono text-zinc-500 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-800">{r.steelIn}</td>
                  <td className="px-3 py-2 font-mono text-zinc-700 dark:text-zinc-300">{r.galvMm}</td>
                  <td className="px-3 py-2 font-mono text-zinc-500 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-800">{r.galvIn}</td>
                  <td className="px-3 py-2 font-mono text-zinc-700 dark:text-zinc-300">{r.alumMm}</td>
                  <td className="px-3 py-2 font-mono text-zinc-500 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-800">{r.alumIn}</td>
                  <td className="px-3 py-2 font-mono text-zinc-700 dark:text-zinc-300">{r.ssMm}</td>
                  <td className="px-3 py-2 font-mono text-zinc-500 dark:text-zinc-500">{r.ssIn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
          Steel and galvanized use Manufacturers&apos; Standard Gauge. Aluminum
          uses Brown &amp; Sharpe (B&amp;S) Gauge. Stainless approximates US
          Standard Gauge converted to sheet practice. Values rounded to 2
          decimals (mm) or 4 decimals (inches).
        </p>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold tracking-tight mb-5">
          Common applications by thickness
        </h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Gauge range
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Thickness
                </th>
                <th className="px-4 py-3 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  Typical uses
                </th>
              </tr>
            </thead>
            <tbody>
              {COMMON_USES.map((u) => (
                <tr
                  key={u.gauge}
                  className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                    {u.gauge}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                    {u.thickness}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {u.uses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold mb-3">More references</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Link
            href="/reference/stl-vs-obj-vs-3mf/"
            className="block px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
          >
            <div className="font-semibold">3D file formats compared</div>
            <div className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
              STL vs OBJ vs 3MF vs GLB vs PLY
            </div>
          </Link>
          <Link
            href="/reference/bambu-vs-prusa/"
            className="block px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700"
          >
            <div className="font-semibold">Bambu vs Prusa</div>
            <div className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
              Slicers, 3MF, workflow
            </div>
          </Link>
        </div>
      </section>
    </article>
  );
}
