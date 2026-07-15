import type { MetadataRoute } from "next";
import {
  ALIAS_ROUTES,
  CONVERTER_ROUTES,
  IMAGE_ROUTES,
  LEGAL_ROUTES,
  REFERENCE_ROUTES,
  SITE_URL,
  TOOL_ROUTES,
  VECTOR_ROUTES,
  VIEWER_ROUTES,
} from "@/lib/seo";

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
  const references = REFERENCE_ROUTES.map(({ slug }) => ({
    url: `${SITE_URL}/reference/${slug}/`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const legal = LEGAL_ROUTES.map(({ slug }) => ({
    url: `${SITE_URL}/${slug}/`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));
  const embed = [
    {
      url: `${SITE_URL}/embed/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];
  const tools = TOOL_ROUTES.map(({ slug }) => ({
    url: `${SITE_URL}/tools/${slug}/`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9, // Differentiated tools = highest priority
  }));
  const imageTools = IMAGE_ROUTES.map(({ slug }) => ({
    url: `${SITE_URL}/${slug}/`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9, // Image→3D = differentiated, convert3d doesn't have it
  }));
  const aliases = ALIAS_ROUTES.map(({ slug }) => ({
    url: `${SITE_URL}/${slug}/`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const vectorTools = VECTOR_ROUTES.map(({ slug }) => ({
    url: `${SITE_URL}/${slug}/`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9, // SVG→3D = differentiated, convert3d doesn't have it
  }));
  const viewers = VIEWER_ROUTES.map(({ slug }) => ({
    url: `${SITE_URL}/${slug}/`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8, // Viewer landing pages reusing the MeshViewer engine
  }));
  return [
    home,
    ...converters,
    ...references,
    ...legal,
    ...embed,
    ...tools,
    ...imageTools,
    ...aliases,
    ...vectorTools,
    ...viewers,
  ];
}
