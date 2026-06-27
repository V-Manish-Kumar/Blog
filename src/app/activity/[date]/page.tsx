import { syncUser } from "@/lib/auth-sync";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";
import PostCard from "@/components/PostCard";
import { notFound } from "next/navigation";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

async function getIpHash() {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const decodedDate = decodeURIComponent(date);
  
  // Validate if date string is parsable
  const parsedDate = new Date(decodedDate);
  if (isNaN(parsedDate.getTime())) {
    notFound();
  }

  // Get current user and visitor IP hash
  const dbUser = await syncUser();
  const ipHash = await getIpHash();

  // Calculate beginning and end of the specified date
  const startOfDay = new Date(parsedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(parsedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch posts published on this day
  const posts = await db.post.findMany({
    where: {
      status: "published",
      publishedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      author: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
      tags: {
        include: { tag: true },
      },
      reactions: true,
      bookmarks: true,
      comments: true,
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  const formattedPosts = posts.map((p) => ({
    ...p,
    tags: p.tags.map((t) => t.tag.name),
  }));

  const formattedDateString = parsedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Back Navigation */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Timeline</span>
          </Link>

          {/* Header */}
          <div className="border-b pb-4 border-slate-200/60 dark:border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                Platform Activity Log
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-55 font-sans">
              Updates on {formattedDateString}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {formattedPosts.length === 0
                ? "No updates were published on this day."
                : `Showing ${formattedPosts.length} ${
                    formattedPosts.length === 1 ? "update" : "updates"
                  } published on this day.`}
            </p>
          </div>

          {/* Posts Feed */}
          {formattedPosts.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-2xl border-slate-200 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-950/10">
              <Calendar className="h-10 w-10 text-slate-350 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                No activity found
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                There were no articles, notes, projects or updates published on this specific date.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {formattedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={dbUser?.id}
                  ipHash={ipHash}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t bg-white dark:bg-zinc-950 py-6 mt-12 text-center text-xs text-slate-400 dark:text-zinc-650 font-mono">
        <div className="max-w-6xl mx-auto px-4">
          <p>© {new Date().getFullYear()} devFeed. Built in Public.</p>
        </div>
      </footer>
    </div>
  );
}
