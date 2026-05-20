import { SiteConfig } from "@/site-config";
import type { MetadataRoute } from "next";

/**
 * MVP public : seules les pages publiques (landing, éditeur, légal) doivent
 * être indexées. Toutes les routes auth/orgs/admin/api restent dans le code
 * (premium futur) mais ne doivent pas apparaître dans Google.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/editeur", "/mentions-legales", "/cgu", "/confidentialite"],
        disallow: [
          "/admin",
          "/admin/",
          "/auth",
          "/auth/",
          "/orgs",
          "/orgs/",
          "/home",
          "/home/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SiteConfig.prodUrl}/sitemap.xml`,
  };
}
