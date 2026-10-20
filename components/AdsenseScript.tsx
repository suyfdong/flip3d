// Loads AdSense (and with it Google's consent message) on normal site pages.
// Lives in the (site) layout, not the root one, so the chrome-less /embed/
// iframe on other people's pages never carries ads. A plain <script> rather
// than next/script: AdSense's site check rejects the data-nscript attribute,
// and React 19 hoists async scripts into <head> on its own.

import { ADSENSE_CLIENT } from "@/lib/monetization";

export default function AdsenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}
