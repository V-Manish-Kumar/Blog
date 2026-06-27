import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const posts = await db.post.findMany({
    where: { status: "published" },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 20,
  });

  const feedItems = posts
    .map((post) => {
      const pubDate = new Date(post.publishedAt || post.createdAt).toUTCString();
      const escapedTitle = post.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
      const escapedDesc = post.content
        .slice(0, 200)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
        
      return `
    <item>
      <title>${escapedTitle}</title>
      <link>https://blog.v-manish-kumar.dev/post/${post.slug}</link>
      <guid>https://blog.v-manish-kumar.dev/post/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapedDesc}</description>
      <author>${post.author.email} (${post.author.name || "Anonymous"})</author>
    </item>`;
    })
    .join("");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>blog.v-manish-kumar.dev Feed</title>
    <link>https://blog.v-manish-kumar.dev</link>
    <description>Building AI, DevOps and Software Projects in Public.</description>
    <language>en-us</language>
    <atom:link href="https://blog.v-manish-kumar.dev/feed.xml" rel="self" type="application/rss+xml" />
    ${feedItems}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
