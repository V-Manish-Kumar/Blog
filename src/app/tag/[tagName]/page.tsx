import { getPosts } from "@/lib/actions/posts";
import { syncUser } from "@/lib/auth-sync";
import Navbar from "@/components/Navbar";
import { recordPageView } from "@/lib/actions/analytics";
import Feed from "@/components/Feed";
import CurrentProject from "@/components/CurrentProject";
import TrendingTags from "@/components/TrendingTags";
import { headers } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

async function getIpHash() {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export default async function TagPage({ params }: { params: Promise<{ tagName: string }> }) {
  const { tagName } = await params;
  const decodedTag = decodeURIComponent(tagName);
  
  // Track page view
  await recordPageView(`/tag/${decodedTag}`);

  const dbUser = await syncUser();
  const ipHash = await getIpHash();
  
  const initialPosts = await getPosts({
    tag: decodedTag,
    limit: 10,
    offset: 0,
    status: "published",
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="border-b pb-4 border-slate-200/60 dark:border-zinc-800/80">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 font-sans flex items-center gap-1">
                <span>Posts tagged with</span>
                <span className="text-indigo-600 dark:text-indigo-400">#{decodedTag}</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Timeline filtered by the hashtag label.
              </p>
            </div>
            <Feed
              initialPosts={initialPosts}
              currentUserId={dbUser?.id}
              ipHash={ipHash}
            />
          </div>
          <div className="space-y-6">
            <CurrentProject />
            <TrendingTags />
          </div>
        </div>
      </main>
    </div>
  );
}
