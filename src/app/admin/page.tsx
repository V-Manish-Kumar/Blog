import { syncUser } from "@/lib/auth-sync";
import Navbar from "@/components/Navbar";
import { getAnalytics } from "@/lib/actions/analytics";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export default async function AdminPage() {
  const dbUser = await syncUser();

  // Guard the page on the server side
  if (!dbUser || dbUser.role !== "admin") {
    redirect("/");
  }

  // Pre-load analytics data
  const analytics = await getAnalytics();

  // Load all posts (including drafts and pending posts)
  const posts = await db.post.findMany({
    orderBy: [
      { pinned: "desc" },
      { createdAt: "desc" },
    ],
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
      _count: {
        select: {
          comments: true,
          views: true,
          reactions: true,
        },
      },
    },
  });

  const formattedPosts = posts.map(p => ({
    ...p,
    tags: p.tags.map(t => t.tag.name),
  }));

  // Load all users
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Load all subscribers
  const subscribers = await db.subscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="border-b pb-4 border-slate-200/60 dark:border-zinc-800/80">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 font-sans">
              Admin Control Panel
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Analyze stats, manage content approvals, modify roles, and export subscribers.
            </p>
          </div>

          {/* Interactive Client Panel Component */}
          <AdminDashboardClient
            initialAnalytics={analytics}
            initialPosts={formattedPosts}
            initialUsers={users}
            initialSubscribers={subscribers}
            currentUserEmail={dbUser?.email || ""}
          />
        </div>
      </main>
    </div>
  );
}
