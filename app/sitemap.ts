import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllPosts } from "@/lib/blog";

// Fixed build-time timestamp — deliberately NOT Date.now(), so the sitemap is
// deterministic across builds and only changes when this value is bumped.
const LAST_MODIFIED = "2026-07-01T00:00:00.000Z";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: { path: string; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/signup", changeFrequency: "monthly", priority: 0.8 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
    { path: "/login", changeFrequency: "monthly", priority: 0.5 },
    { path: "/about", changeFrequency: "monthly", priority: 0.5 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
    { path: "/acceptable-use", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.path === "/" ? "/" : r.path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
