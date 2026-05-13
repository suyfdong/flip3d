// Factory functions for schema.org JSON-LD payloads.
// Keep these typed loosely — Google's parser is forgiving about extras.

import { SITE_URL } from "./seo";

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Flip3D",
    url: SITE_URL,
    description:
      "Free online 3D file converter, viewer, repair and embed tools. STL, OBJ, GLB, 3MF, PLY, STEP, IGES, FBX, DAE — all in the browser.",
    publisher: {
      "@type": "Organization",
      name: "Flip3D",
      url: SITE_URL,
    },
  };
}

export function softwareAppSchema(opts: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    applicationCategory: "Multimedia",
    operatingSystem: "Any (browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: undefined, // omit until real ratings exist
  };
}

export function faqPageSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
