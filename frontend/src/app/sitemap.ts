import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/seo";

const ROUTES = [
  { path: "/", changeFrequency: "hourly" as const, priority: 1.0 },
  { path: "/history", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/about", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/operations-policy", changeFrequency: "monthly" as const, priority: 0.75 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/disclaimer", changeFrequency: "monthly" as const, priority: 0.7 },
] as const;

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: toAbsoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

