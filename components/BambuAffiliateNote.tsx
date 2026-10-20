"use client";

// Disclosed affiliate link to the Bambu Lab store. Renders nothing until
// BAMBU_AFFILIATE_TEMPLATE is set in lib/monetization.ts.

import Link from "next/link";
import { bambuAffiliateUrl } from "@/lib/monetization";
import { trackAffiliateClick } from "@/lib/analytics";

export default function BambuAffiliateNote({
  placement,
  storeUrl,
  children,
  className = "",
}: {
  /** GA4 label, e.g. "print_checker". */
  placement: string;
  storeUrl?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const href = bambuAffiliateUrl(storeUrl);
  if (!href) return null;
  return (
    <p className={`text-xs text-zinc-500 dark:text-zinc-400 ${className}`}>
      {children}{" "}
      <a
        href={href}
        target="_blank"
        rel="sponsored noopener"
        onClick={() => trackAffiliateClick("bambu", placement)}
        className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
      >
        Bambu Lab store
      </a>
      <span className="text-zinc-400 dark:text-zinc-500">
        {" "}
        (affiliate link —{" "}
        <Link href="/terms/#advertising" className="underline hover:no-underline">
          we may earn a commission
        </Link>
        )
      </span>
    </p>
  );
}
