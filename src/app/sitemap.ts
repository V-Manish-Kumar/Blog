import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all published posts to list in sitemap
  const posts = await db.post.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true },
  });

  const postEntries = posts.map((post) => ({
    url: `https://blog.v-manish-kumar.dev/post/${post.slug}`,
    lastModified: post.updatedAt,
  }));

  const staticRoutes = ["", "/articles", "/notes", "/projects", "/bookmarks"].map((route) => ({
    url: `https://blog.v-manish-kumar.dev${route}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...postEntries];
}
