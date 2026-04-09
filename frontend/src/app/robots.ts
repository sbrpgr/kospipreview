import type { MetadataRoute } from "next";
import { SITE_URL, toAbsoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/data/"],
      },
    ],
    sitemap: toAbsoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
