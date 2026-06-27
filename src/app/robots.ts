import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/write/", "/edit-post/", "/settings/"],
    },
    sitemap: "https://blog.v-manish-kumar.dev/sitemap.xml",
  };
}
