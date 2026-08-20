"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as THREE from "three";
import Dropzone from "@/components/Dropzone";
import { JsonLd } from "@/components/JsonLd";
import { faqPageSchema } from "@/lib/schema";
import {
  FORMAT_LABELS,
  SOURCE_ONLY_FORMATS,
  parseToObject,
  exportToBlob,
  downloadBlob,
  disposeObject,
  type Format,
} from "@/lib/converters";
import {
  trackFileUploaded,
  trackSampleLoaded,
  trackFileConverted,
  trackConvertError,
} from "@/lib/analytics";

const MeshViewer = dynamic(() => import("@/components/MeshViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] rounded-xl bg-zinc-100 dark:bg-zinc-900">
      <span className="text-sm text-zinc-500">Loading viewer…</span>
    </div>
  ),
});

type Status = "idle" | "loading" | "converting" | "error";

/**
 * Optional rich on-page content for a converter landing. Lets a high-value
 * page (e.g. /3mf-to-stl) carry a tuned lede, format-specific body, FAQ, and
 * extra internal links to capture its keyword-variant cluster — while the
 * other routes keep the lean default. All fields are plain serializable data
 * so this passes cleanly from a server route into this client component.
 */
export type ConverterContent = {
  lede?: string;
  aboutTitle?: string;
  about?: string[];
  faq?: { q: string; a: string }[];
  related?: { href: string; title: string; desc: string }[];
  /** Override the displayed source-format label (e.g. "STP" on /stp-to-stl,
   * which parses as the "step" format). Does not change parsing. */
  fromLabel?: string;
};

type Props = {
  from: Format;
  to: Format;
  content?: ConverterContent;
};

/**
 * Verb-form FAQ every converter page carries.
 *
 * Searchers phrase this two ways and the SERPs are different: the noun form
 * ("obj to stl") is locked up by convert3d, while the verb/converter forms
 * ("convert obj to stl" KD13, "how to convert obj file to stl" KD11,
 * "3mf to stl converter" KD17) are largely unclaimed — sloyd.ai ranks #2 on
 * several with a single page. Our 31 lean converter routes had no FAQ at all,
 * so they carried none of that phrasing. This generates it from the format
 * pair; the 11 rich routes pass their own `content.faq` and opt out.
 */
function buildBaselineFaq(
  fromLabel: string,
  toLabel: string,
  toExt: string,
  sourceOnly: boolean,
): { q: string; a: string }[] {
  const faq = [
    {
      q: `How do I convert ${fromLabel} to ${toLabel}?`,
      a: `Drop your ${fromLabel} file into the box above, check it in the 3D preview, then click Convert & Download .${toExt}. The whole conversion runs in your browser, so there is nothing to install and nothing to upload.`,
    },
    {
      q: `Is there a free ${fromLabel} to ${toLabel} converter with no signup?`,
      a: `This is one. There is no account, no watermark, no email step and no file-size paywall — just drop the file and download the ${toLabel}.`,
    },
    {
      q: `Can I convert ${fromLabel} to ${toLabel} online without installing software?`,
      a: `Yes. The converter runs entirely in the browser using WebGL, so it works on Windows, macOS, Linux and mobile without any download. Your file is read on your own device and never sent to a server.`,
    },
  ];
  if (sourceOnly) {
    faq.push({
      q: `Can I convert ${toLabel} back to ${fromLabel}?`,
      a: `No — ${fromLabel} is read-only here. Flip3D can open ${fromLabel} files and write ${toLabel}, but it does not write ${fromLabel}. That limit is deliberate: producing a fake ${fromLabel} from mesh data would lose the information the format is meant to carry.`,
    });
  }
  return faq;
}

export default function ConverterPage({ from, to, content }: Props) {
  const fromLabel = content?.fromLabel ?? FORMAT_LABELS[from];
  const toLabel = FORMAT_LABELS[to];

  // Rich routes supply their own FAQ *and* their own FAQPage JSON-LD, so only
  // the lean routes get the generated block — otherwise the page would carry
  // two FAQPage schemas.
  const faqItems =
    content?.faq && content.faq.length > 0
      ? content.faq
      : buildBaselineFaq(fromLabel, toLabel, to, SOURCE_ONLY_FORMATS.has(from));
  const emitFaqSchema = !(content?.faq && content.faq.length > 0);

  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dispose the loaded Object3D when it changes or on unmount.
  // Without this, navigating away (clicking the logo, jumping to another
  // landing page) leaks the geometry + material + GPU buffers and stalls
  // the next page's MeshViewer initialization.
  useEffect(() => {
    return () => {
      if (object) disposeObject(object);
    };
  }, [object]);

  const handleFile = async (
    buffer: ArrayBuffer,
    name: string,
    source: "drop" | "sample" = "drop",
  ) => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const parsed = await parseToObject(buffer, from);
      // The useEffect cleanup will dispose the previous object when state updates.
      setObject(parsed);
      setFileName(name);
      setStatus("idle");
      trackFileUploaded(from, source);
    } catch (err) {
      console.error("Parse failed", err);
      setErrorMsg(err instanceof Error ? err.message : `Could not parse .${from} file`);
      setStatus("error");
    }
  };

  const handleSample = async () => {
    setStatus("loading");
    setErrorMsg(null);
    trackSampleLoaded(from);
    try {
      const geo = new THREE.TorusKnotGeometry(10, 3, 100, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.1,
        roughness: 0.6,
      });
      const sampleMesh = new THREE.Mesh(geo, mat);
      const blob = await exportToBlob(sampleMesh, from);
      geo.dispose();
      mat.dispose();
      const buffer = await blob.arrayBuffer();
      await handleFile(buffer, `flip3d-sample.${from}`, "sample");
    } catch (err) {
      console.error("Sample failed", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load sample");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setObject(null);
    setFileName("");
    setStatus("idle");
    setErrorMsg(null);
  };

  const handleConvert = async () => {
    if (!object) return;
    setStatus("converting");
    setErrorMsg(null);
    try {
      const blob = await exportToBlob(object, to);
      const baseName = fileName.replace(/\.[^.]+$/, "") || "model";
      downloadBlob(blob, `${baseName}.${to}`);
      setStatus("idle");
      trackFileConverted(from, to);
    } catch (err) {
      console.error("Convert failed", err);
      const msg = err instanceof Error ? err.message : "Conversion failed";
      setErrorMsg(msg);
      setStatus("error");
      trackConvertError(from, to, msg);
    }
  };

  const reverseExists = !SOURCE_ONLY_FORMATS.has(from);
  const reverseSlug = reverseExists ? `/${to}-to-${from}/` : "/";
  const reverseLabel = reverseExists
    ? `${toLabel} → ${fromLabel}`
    : "All conversions";
  const reverseHint = reverseExists
    ? "Go the other way"
    : `${fromLabel} is read-only in Flip3D — we import it but don't write it back. Browse other conversions.`;

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12">
        {!object ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                Free Online Converter
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Convert{" "}
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {fromLabel} to {toLabel}
                </span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                {content?.lede ??
                  `Drop a .${from} file, get a .${to} back in seconds. Runs entirely in your browser — no upload, no signup, no watermark.`}
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Dropzone
                onFileLoaded={handleFile}
                accept={
                  from === "step"
                    ? [".step", ".stp"]
                    : from === "iges"
                      ? [".iges", ".igs"]
                      : from === "glb"
                        ? [".glb", ".gltf"]
                        : [`.${from}`]
                }
              />

              {!SOURCE_ONLY_FORMATS.has(from) && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    No .{from} handy?
                  </span>
                  <button
                    onClick={handleSample}
                    disabled={status === "loading"}
                    className="px-3 py-1 rounded-full font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    Try a sample .{from}
                  </button>
                </div>
              )}

              {status === "loading" && (
                <div className="mt-4 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300">
                  Parsing file…
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{fileName}</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Drag to rotate · scroll to zoom
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                ← Load another .{from}
              </button>
            </div>

            <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="font-mono uppercase px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                  {fromLabel}
                </span>
                <span className="text-zinc-500">→</span>
                <span className="font-mono uppercase px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                  {toLabel}
                </span>
              </div>
              <button
                onClick={handleConvert}
                disabled={status === "converting"}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "converting"
                  ? "Converting…"
                  : `Convert & Download .${to}`}
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="h-[60vh] sm:h-[480px] lg:h-[560px]">
              <MeshViewer object={object} />
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  Want to embed a viewer on your site?
                </span>{" "}
                One line of iframe HTML, 4 themes, free forever.
              </div>
              <Link
                href="/embed/"
                className="px-4 py-2 text-sm font-medium rounded-lg border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 whitespace-nowrap"
              >
                Embed viewer →
              </Link>
            </div>
          </>
        )}
      </section>

      {!object && (
        <>
          <section className="border-t border-zinc-200 dark:border-zinc-800 py-14">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                How to convert {fromLabel} to {toLabel}
              </h2>
              <ol className="space-y-3 text-zinc-700 dark:text-zinc-300 list-decimal pl-6">
                <li>
                  Drag your <code className="font-mono text-sm">.{from}</code>{" "}
                  file into the box above (or click to browse).
                </li>
                <li>
                  Preview the model in the viewer — drag to rotate, scroll to
                  zoom.
                </li>
                <li>
                  Click <strong>Convert &amp; Download .{to}</strong>. The{" "}
                  <code className="font-mono text-sm">.{to}</code> file lands in
                  your downloads folder.
                </li>
              </ol>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-6">
                Conversion runs in your browser via{" "}
                <code className="font-mono">three.js</code>. Your file never
                leaves your device — there&apos;s no upload, no server, and
                nothing is stored.
              </p>
            </div>
          </section>

          {content?.about && content.about.length > 0 && (
            <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl font-bold tracking-tight mb-5">
                  {content.aboutTitle ?? `About ${fromLabel} → ${toLabel}`}
                </h2>
                <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {content.about.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </section>
          )}

          {faqItems.length > 0 && (
            <section className="border-t border-zinc-200 dark:border-zinc-800 py-14">
              {emitFaqSchema && <JsonLd data={faqPageSchema(faqItems)} />}
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl font-bold tracking-tight mb-5">
                  Frequently asked questions
                </h2>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
                  {faqItems.map((f) => (
                    <details key={f.q} className="group py-4">
                      <summary className="flex cursor-pointer items-center justify-between font-medium list-none">
                        {f.q}
                        <span className="ml-4 text-zinc-400 transition-transform group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {f.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="border-t border-zinc-200 dark:border-zinc-800 py-14 bg-zinc-50 dark:bg-zinc-950/50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <h2 className="text-xl font-bold tracking-tight mb-4">
                Related converters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {content?.related?.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors"
                  >
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {r.desc}
                    </div>
                  </Link>
                ))}
                <Link
                  href={reverseSlug}
                  className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="font-semibold">{reverseLabel}</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {reverseHint}
                  </div>
                </Link>
                <Link
                  href="/embed/"
                  className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="font-semibold">Embed viewer →</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    One line of iframe HTML on your site
                  </div>
                </Link>
                <Link
                  href="/"
                  className="block px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="font-semibold">All Tools</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Convert any of 4 formats to any other
                  </div>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
