import { Suspense } from "react";
import type { Metadata } from "next";
import EmbedViewer from "@/components/EmbedViewer";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Embedded 3D Viewer | Flip3D",
  description: "Flip3D embedded 3D model viewer.",
  alternates: { canonical: `${SITE_URL}/embed/stl-viewer/` },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <Suspense fallback={<EmbedFallback />}>
      <EmbedViewer />
    </Suspense>
  );
}

function EmbedFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
      <span className="text-sm text-zinc-500">Loading viewer…</span>
    </div>
  );
}
