"use client";

// One in-content ad between a tool and its explainer sections. AdSense wins
// when its slot is configured; otherwise an Adsterra banner fills in. Renders
// nothing until one of them is configured in lib/monetization.ts.

import { useEffect, useRef, useState } from "react";
import {
  ADSENSE_CLIENT,
  ADSENSE_SLOTS,
  ADSTERRA_BANNERS,
  type AdPlacement,
  type AdsterraBanner,
  adsEnabled,
} from "@/lib/monetization";
import { trackAdSlotShown } from "@/lib/analytics";

type TcfData = {
  gdprApplies?: boolean;
  eventStatus?: string;
  purpose?: { consents?: Record<string, boolean> };
};
type TcfApi = (
  command: string,
  version: number,
  cb: (data: TcfData, success: boolean) => void,
) => void;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    __tcfapi?: TcfApi;
  }
}

/**
 * Adsterra isn't covered by Google's consent message, so in GDPR regions it
 * only loads after the visitor consents to storage (TCF purpose 1). Without a
 * CMP on the page we fall back to the timezone and skip Europe entirely.
 */
function thirdPartyAdsAllowed(): Promise<boolean> {
  return new Promise((resolve) => {
    const started = Date.now();
    const poll = () => {
      const tcf = window.__tcfapi;
      if (tcf) {
        tcf("addEventListener", 2, (data, ok) => {
          if (!ok) return resolve(false);
          if (data.gdprApplies === false) return resolve(true);
          if (
            data.eventStatus === "tcloaded" ||
            data.eventStatus === "useractioncomplete"
          ) {
            resolve(Boolean(data.purpose?.consents?.["1"]));
          }
        });
        return;
      }
      if (Date.now() - started < 3000) {
        setTimeout(poll, 250);
        return;
      }
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
      resolve(!tz.startsWith("Europe/") && !tz.startsWith("Atlantic/"));
    };
    poll();
  });
}

function adsterraDoc(b: AdsterraBanner) {
  // Each banner gets its own document because Adsterra's snippet reads a
  // global `atOptions` and uses document.write. `src` is the exact URL from
  // the panel — Adsterra uses several hosts/paths, so it isn't reconstructed.
  return `<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script>atOptions={key:${JSON.stringify(b.key)},format:"iframe",height:${b.h},width:${b.w},params:{}};</script><script src="${b.src}"></script></body></html>`;
}

function AdsenseUnit({ slot }: { slot: string }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by an extension or not approved yet — leave the space empty.
    }
  }, []);
  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

function AdsterraUnit({ placement }: { placement: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [banner, setBanner] = useState<AdsterraBanner | null>(null);

  useEffect(() => {
    let cancelled = false;
    thirdPartyAdsAllowed().then((ok) => {
      if (cancelled || !ok || !box.current) return;
      const wide = box.current.clientWidth >= 728;
      const leaderboard = ADSTERRA_BANNERS["728x90"];
      const rectangle = ADSTERRA_BANNERS["300x250"];
      if (wide && leaderboard) {
        setBanner(leaderboard);
        trackAdSlotShown(placement, "728x90");
      } else if (rectangle) {
        setBanner(rectangle);
        trackAdSlotShown(placement, "300x250");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [placement]);

  return (
    <div ref={box} className="flex justify-center">
      {banner && (
        <iframe
          title="Advertisement"
          srcDoc={adsterraDoc(banner)}
          width={banner.w}
          height={banner.h}
          loading="lazy"
          // No allow-same-origin / allow-top-navigation: the ad can open a
          // new tab when clicked, but can't touch or redirect this page.
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          className="border-0 max-w-full"
        />
      )}
    </div>
  );
}

export default function AdSlot({
  placement = "content",
  className = "max-w-4xl mx-auto px-4 sm:px-6 py-6",
}: {
  placement?: AdPlacement;
  /** Wrapper spacing; override when the slot sits inside a padded article. */
  className?: string;
}) {
  if (!adsEnabled(placement)) return null;
  const slot = ADSENSE_SLOTS[placement];
  return (
    <aside
      aria-label="Advertisement"
      className={className}
    >
      <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600 text-center mb-2">
        Advertisement
      </p>
      {ADSENSE_CLIENT && slot ? <AdsenseUnit slot={slot} /> : <AdsterraUnit placement={placement} />}
    </aside>
  );
}
