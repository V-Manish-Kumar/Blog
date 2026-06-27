import { getPosts } from "@/lib/actions/posts";
import { syncUser } from "@/lib/auth-sync";
import Navbar from "@/components/Navbar";
import { recordPageView } from "@/lib/actions/analytics";
import Feed from "@/components/Feed";
import CurrentProject from "@/components/CurrentProject";
import GitHubGrid from "@/components/GitHubGrid";
import TrendingTags from "@/components/TrendingTags";
import NewsletterSignup from "@/components/NewsletterSignup";
import { getPlatformActivityMap } from "@/lib/actions/analytics";
import { headers } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Helper to compute a hashed version of the visitor's IP address for anonymous reactions
async function getIpHash() {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export default async function Home() {
  // Track page view
  await recordPageView("/");

  // Sync Clerk authentication profile with SQLite
  const dbUser = await syncUser();
  const ipHash = await getIpHash();
  
  // Load the first 10 posts for fast initial SSR paint
  const initialPosts = await getPosts({
    limit: 10,
    offset: 0,
    status: "published",
  });
  const initialActivity = await getPlatformActivityMap();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Timeline Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Header */}
            <div className="space-y-3 border-b pb-6 border-slate-200/60 dark:border-zinc-800/80">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 font-sans sm:text-4xl">
                Manish Kumar
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-lg leading-relaxed">
                Building AI, DevOps and Software Projects in Public.
              </p>
            </div>

            {/* Combined Timeline Feed */}
            <Feed
              initialPosts={initialPosts}
              currentUserId={dbUser?.id}
              ipHash={ipHash}
            />
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <CurrentProject />
            <GitHubGrid initialActivity={initialActivity} />
            <TrendingTags />
            <NewsletterSignup />
          </div>
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
