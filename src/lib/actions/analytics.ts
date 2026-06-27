"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../db";
import { headers } from "next/headers";
import crypto from "crypto";

async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
  });
  if (!dbUser || dbUser.role !== "admin") {
    throw new Error("Forbidden");
  }
  return dbUser;
}

export async function getAnalytics() {
  await verifyAdmin();

  // 1. Counters
  const totalPosts = await db.post.count({ where: { status: "published" } });
  const totalDrafts = await db.post.count({
    where: {
      status: {
        in: ["draft", "pending"],
      },
    },
  });
  const totalSubscribers = await db.subscriber.count({ where: { active: true } });
  const totalViews = await db.pageView.count();
  
  // Unique visitors count (based on unique ipHash)
  const uniqueVisitorsRaw = await db.pageView.groupBy({
    by: ["ipHash"],
  });
  const totalVisitors = uniqueVisitorsRaw.length;

  // 2. Most viewed posts
  const topPosts = await db.post.findMany({
    where: { status: "published" },
    include: {
      _count: {
        select: { views: true },
      },
    },
    take: 5,
  });
  const mostViewedPosts = topPosts
    .map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      type: p.type,
      views: p._count.views,
    }))
    .sort((a, b) => b.views - a.views);

  // 3. Popular tags count
  const tags = await db.tag.findMany({
    include: {
      _count: {
        select: { posts: true },
      },
    },
    take: 5,
    orderBy: {
      posts: { _count: "desc" },
    },
  });
  const popularTags = tags.map(t => ({
    name: t.name,
    count: t._count.posts,
  }));

  // 4. Daily visits over the last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const views = await db.pageView.findMany({
    where: {
      createdAt: { gte: fourteenDaysAgo },
    },
    select: {
      createdAt: true,
      ipHash: true,
    },
  });

  // Group by date (YYYY-MM-DD)
  const dailyDataMap: { [key: string]: { views: number; visitors: Set<string> } } = {};
  
  // Initialize last 14 days with 0
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split("T")[0];
    dailyDataMap[dateString] = { views: 0, visitors: new Set() };
  }

  views.forEach(v => {
    const dateString = v.createdAt.toISOString().split("T")[0];
    if (dailyDataMap[dateString]) {
      dailyDataMap[dateString].views++;
      dailyDataMap[dateString].visitors.add(v.ipHash);
    }
  });

  const dailyVisits = Object.keys(dailyDataMap).map(date => ({
    date,
    views: dailyDataMap[date].views,
    visitors: dailyDataMap[date].visitors.size,
  }));

  return {
    summary: {
      totalPosts,
      totalDrafts,
      totalSubscribers,
      totalViews,
      totalVisitors,
    },
    mostViewedPosts,
    popularTags,
    dailyVisits,
  };
}

export async function getPlatformActivityMap(days = 365) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const posts = await db.post.findMany({
    where: {
      status: "published",
      publishedAt: {
        gte: startDate,
      },
    },
    select: {
      publishedAt: true,
    },
  });

  const activityMap: Record<string, number> = {};

  posts.forEach((post) => {
    if (post.publishedAt) {
      const year = post.publishedAt.getFullYear();
      const month = String(post.publishedAt.getMonth() + 1).padStart(2, "0");
      const day = String(post.publishedAt.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    }
  });

  return activityMap;
}

/**
 * Records a page view for a specific path, tracking unique visitors anonymously.
 */
export async function recordPageView(path: string, postId?: string) {
  try {
    // Ignore internal, administrative and API routes
    if (
      path.startsWith("/admin") ||
      path.startsWith("/write") ||
      path.startsWith("/edit-post") ||
      path.startsWith("/api") ||
      path.startsWith("/clerk-test")
    ) {
      return { success: false, reason: "Administrative/API path skipped" };
    }

    const headerList = await headers();
    const userAgent = headerList.get("user-agent") || null;
    const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // Prevent duplicate counting: only record if IP has not visited this path in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingView = await db.pageView.findFirst({
      where: {
        path,
        ipHash,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (!existingView) {
      await db.pageView.create({
        data: {
          postId: postId || null,
          ipHash,
          userAgent,
          path,
        },
      });
      return { success: true, newView: true };
    }

    return { success: true, newView: false };
  } catch (err) {
    console.error(`[Analytics Engine Error] Failed to record page view for ${path}:`, err);
    return { success: false, error: String(err) };
  }
}
