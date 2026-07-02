import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// File-based robots route (Next.js 16 App Router). Next serves this at
// `/robots.txt`, deriving the file from the returned `MetadataRoute.Robots`.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
