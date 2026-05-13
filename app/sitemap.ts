import type { MetadataRoute } from "next";
import { CONVERTER_ROUTES, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const home = {
    url: `${SITE_URL}/`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 1.0,
  };
  const converters = CONVERTER_ROUTES.map(({ from, to }) => ({
    url: `${SITE_URL}/${from}-to-${to}/`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [home, ...converters];
}
