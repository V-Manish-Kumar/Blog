import { syncUser } from "@/lib/auth-sync";
import { db } from "@/lib/db";
import Navbar from "@/components/Navbar";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  MessageSquare, 
  Bookmark, 
  Heart,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default async function ProfilePage() {
  const user = await syncUser();

  // If the user isn't logged in, redirect them to sign-in page
  if (!user) {
    redirect("/sign-in");
  }

  // Load detailed database profile statistics
  const profileDetails = await db.user.findUnique({
    where: { id: user.id },
    include: {
      _count: {
        select: {
          posts: true,
          comments: true,
          bookmarks: true,
          reactions: true,
        },
      },
      bookmarks: {
        include: {
          post: {
            include: {
              author: {
                select: {
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!profileDetails) {
    redirect("/");
  }

  const stats = [
    { name: "Updates Published", count: profileDetails._count.posts, icon: Layers, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" },
    { name: "Comments Made", count: profileDetails._count.comments, icon: MessageSquare, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" },
    { name: "Saved Bookmarks", count: profileDetails._count.bookmarks, icon: Bookmark, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40" },
    { name: "Reactions Triggered", count: profileDetails._count.reactions, icon: Heart, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Cover Header Graphic */}
          <div className="relative h-36 w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          </div>

          {/* Profile Core Info Card */}
          <div className="relative -mt-20 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-zinc-800/80">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                {/* Avatar */}
                {profileDetails.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileDetails.imageUrl}
                    alt={profileDetails.name || "User profile"}
                    className="h-28 w-28 rounded-2xl border-4 border-white dark:border-zinc-950 object-cover shadow-lg bg-white dark:bg-zinc-900"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-2xl border-4 border-white dark:border-zinc-950 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shadow-lg">
                    <UserIcon className="h-12 w-12 text-slate-400" />
                  </div>
                )}

                {/* Name, Email, and Created Date */}
                <div className="space-y-1 sm:pb-2">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 font-sans">
                      {profileDetails.name}
                    </h1>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      profileDetails.role === "admin" 
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                        : profileDetails.role === "writer"
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                        : "bg-slate-100 text-slate-800 dark:bg-zinc-850 dark:text-zinc-300"
                    }`}>
                      <ShieldCheck className="h-3 w-3" />
                      {profileDetails.role}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {profileDetails.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Member since {new Date(profileDetails.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className="bg-white dark:bg-zinc-900/60 border dark:border-zinc-800 p-5 rounded-xl shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wide">
                      {stat.name}
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-50 font-mono mt-0.5">
                      {stat.count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bookmarks Section */}
          <div className="grid grid-cols-1 gap-8">
            <div className="bg-white dark:bg-zinc-900/60 border dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2 font-sans">
                <Bookmark className="h-5 w-5 text-indigo-500" />
                Your Saved Bookmarks
              </h3>

              {profileDetails.bookmarks.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-zinc-800/80 rounded-xl space-y-3">
                  <Bookmark className="h-10 w-10 text-slate-350 dark:text-zinc-600 mx-auto" />
                  <p className="text-sm text-slate-500 dark:text-zinc-400">You haven't bookmarked any updates yet.</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm"
                  >
                    <span>Browse Timeline</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-850">
                  {profileDetails.bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1">
                        <Link
                          href={`/post/${bookmark.post.slug}`}
                          className="font-semibold text-slate-900 dark:text-zinc-150 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                        >
                          <span>{bookmark.post.title}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-500 font-mono">
                          <span>by {bookmark.post.author.name}</span>
                          <span>•</span>
                          <span className="capitalize">{bookmark.post.type}</span>
                          <span>•</span>
                          <span>Saved on {new Date(bookmark.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>

                      <Link
                        href={`/post/${bookmark.post.slug}`}
                        className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-350 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border dark:border-zinc-700 rounded transition-colors"
                      >
                        Read
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
