import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/seo";

const ROUTES = [
  { path: "/", changeFrequency: "hourly" as const, priority: 1.0 },
  { path: "/history", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/research", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/research/model-in-volatile-markets", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/research/ewy-krw-core-signals", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/research/reading-the-prediction-band", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/about", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/quant-calculator", changeFrequency: "weekly" as const, priority: 0.75 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/operations-policy", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.65 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.65 },
  { path: "/disclaimer", changeFrequency: "monthly" as const, priority: 0.65 },
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

