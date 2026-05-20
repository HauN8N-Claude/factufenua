import { SiteConfig } from "@/site-config";
import type { MetadataRoute } from "next";

// Static lastModified date (Next 16 cacheComponents: no `new Date()` in
// Server Components / route handlers used for prerender).
const LAST_MODIFIED = "2026-05-20";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SiteConfig.prodUrl;

  return [
    {
      url: `${base}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/editeur`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/mentions-legales`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/cgu`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/confidentialite`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
