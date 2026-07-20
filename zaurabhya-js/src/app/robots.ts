import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/order-confirmation/", "/api/"],
    },
    sitemap: "https://www.zaurabhya.com/sitemap.xml",
  };
}
