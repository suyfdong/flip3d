// Ads + affiliate configuration. Every ID here is optional: an empty value
// means that network renders nothing, so the site can ship before an account
// is approved. Fill these in (and the matching lines in public/ads.txt) as
// each network comes through.

/** AdSense publisher ID, e.g. "ca-pub-1234567890123456". */
export const ADSENSE_CLIENT: string = "ca-pub-9041836440635279";

/**
 * AdSense ad-unit slot IDs (created in AdSense → Ads → By ad unit after
 * approval). Manual units only — Auto ads would drop ads into the tool area.
 */
export const ADSENSE_SLOTS: Record<"content", string> = {
  content: "",
};

/**
 * Adsterra *Banner* units. Banners only: Popunder / Social Bar / Direct Link /
 * interstitial formats are deliberately unsupported — they hijack the page and
 * are what Adsterra's malvertising reports are about.
 *
 * Store the whole snippet URL, not just the key. Adsterra hands accounts
 * different shapes — `//www.highperformanceformat.com/<key>/invoke.js` for some,
 * `https://bauval.org/22/<key>` for others — so reconstructing the URL from a
 * host + key breaks the unit. `key` is the 32-char value that also goes into
 * `atOptions`. Set an entry to null to disable that size.
 */
export type AdsterraBanner = { key: string; src: string; w: number; h: number };

export const ADSTERRA_BANNERS: Record<
  "728x90" | "300x250",
  AdsterraBanner | null
> = {
  "728x90": {
    key: "883543c173893c7f28cadb3a7bebb0f2",
    src: "https://bauval.org/22/883543c173893c7f28cadb3a7bebb0f2",
    w: 728,
    h: 90,
  },
  "300x250": {
    key: "0ea24e38bc414c0b4136486761c0ce16",
    src: "https://bauval.org/22/0ea24e38bc414c0b4136486761c0ce16",
    w: 300,
    h: 250,
  },
};

/**
 * Bambu Lab affiliate deep-link template. `{url}` is replaced with the
 * URL-encoded store page, e.g. a ShareASale deep link:
 * "https://shareasale.com/r.cfm?b=0&u=YOUR_ID&m=138211&urllink={url}"
 */
export const BAMBU_AFFILIATE_TEMPLATE: string = "";

export const BAMBU_STORE_URL = "https://us.store.bambulab.com/";

export function bambuAffiliateUrl(storeUrl = BAMBU_STORE_URL): string | null {
  if (!BAMBU_AFFILIATE_TEMPLATE) return null;
  return BAMBU_AFFILIATE_TEMPLATE.replace("{url}", encodeURIComponent(storeUrl));
}

export type AdPlacement = keyof typeof ADSENSE_SLOTS;

export function adsEnabled(placement: AdPlacement): boolean {
  return Boolean(
    (ADSENSE_CLIENT && ADSENSE_SLOTS[placement]) ||
      ADSTERRA_BANNERS["728x90"] ||
      ADSTERRA_BANNERS["300x250"],
  );
}

/** EEA + UK + Switzerland: regions where ads/analytics cookies need opt-in. */
export const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL",
  "PT", "RO", "SK", "SI", "ES", "SE", "GB", "CH",
];
