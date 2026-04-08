import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/seo";

const routes = ["/", "/about", "/history", "/privacy"] as const;
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: toAbsoluteUrl(route),
    lastModified,
    changeFrequency: route === "/" ? "hourly" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
