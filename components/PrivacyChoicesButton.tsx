"use client";

// Re-opens Google's consent message so visitors can change their choice
// (required alongside the GDPR / US-states messages set up in AdSense).

import { ADSENSE_CLIENT } from "@/lib/monetization";

type GoogleFc = {
  callbackQueue?: unknown[];
  showRevocationMessage?: () => void;
};

declare global {
  interface Window {
    googlefc?: GoogleFc;
  }
}

export default function PrivacyChoicesButton() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <button
      type="button"
      onClick={() => {
        const fc = (window.googlefc = window.googlefc || {});
        fc.callbackQueue = fc.callbackQueue || [];
        fc.callbackQueue.push(() => window.googlefc?.showRevocationMessage?.());
      }}
      className="hover:text-blue-600 dark:hover:text-blue-400"
    >
      Privacy choices
    </button>
  );
}
