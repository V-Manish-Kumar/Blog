import { getPosts } from "@/lib/actions/posts";
import { syncUser } from "@/lib/auth-sync";
import Navbar from "@/components/Navbar";
import Feed from "@/components/Feed";
import CurrentProject from "@/components/CurrentProject";
import TrendingTags from "@/components/TrendingTags";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

async function getIpHash() {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export default async function BookmarksPage() {
  const dbUser = await syncUser();

  // Redirect to sign in if not authenticated
  if (!dbUser) {
    redirect("/sign-in");
  }

  const ipHash = await getIpHash();
  
  // Load bookmarked posts
  const initialPosts = await getPosts({
    userId: dbUser.id,
    onlyBookmarks: true,
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 font-sans">
                Bookmarked Updates
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Your saved collection of articles, learning notes, and project logs.
              </p>
            </div>
            <Feed
              initialPosts={initialPosts}
              currentUserId={dbUser.id}
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
