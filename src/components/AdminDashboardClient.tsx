"use client";

import { useState, useTransition } from "react";
import { updatePost, deletePost } from "@/lib/actions/posts";
import { updateUserRole, deleteUser } from "@/lib/actions/users";
import { deleteSubscriber } from "@/lib/actions/newsletter";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  Users,
  Mail,
  TrendingUp,
  Eye,
  Edit2,
  Trash2,
  Pin,
  CheckCircle,
  Clock,
  Download,
  AlertCircle,
  Hash,
  Search,
} from "lucide-react";

interface AdminDashboardClientProps {
  initialAnalytics: any;
  initialPosts: any[];
  initialUsers: any[];
  initialSubscribers: any[];
  currentUserEmail: string;
}

export default function AdminDashboardClient({
  initialAnalytics,
  initialPosts,
  initialUsers,
  initialSubscribers,
  currentUserEmail,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "posts" | "users" | "subscribers"
  >("analytics");
  const [activeUserSubTab, setActiveUserSubTab] = useState<
    "viewer" | "writer" | "admin"
  >("viewer");
  const [activePostSubTab, setActivePostSubTab] = useState<
    "published" | "pending" | "draft"
  >("published");
  const [posts, setPosts] = useState(initialPosts);
  const [users, setUsers] = useState(initialUsers);
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [isPending, startTransition] = useTransition();
  const isSuperAdmin =
    currentUserEmail.toLowerCase() === "manishedu980@gmail.com";

  const [postSearch, setPostSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [subscriberSearch, setSubscriberSearch] = useState("");

  // ----------------------------------------------------
  // Actions
  // ----------------------------------------------------

  const handleApprove = async (postId: string) => {
    startTransition(async () => {
      try {
        await updatePost(postId, { status: "published" });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, status: "published", publishedAt: new Date() }
              : p,
          ),
        );
      } catch (err) {
        alert("Failed to approve post.");
      }
    });
  };

  const handleTogglePin = async (postId: string, currentPinned: boolean) => {
    startTransition(async () => {
      try {
        await updatePost(postId, { pinned: !currentPinned });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, pinned: !currentPinned } : p,
          ),
        );
      } catch (err) {
        alert("Failed to update post status.");
      }
    });
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    startTransition(async () => {
      try {
        await deletePost(postId);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } catch (err) {
        alert("Failed to delete post.");
      }
    });
  };

  const handleRoleChange = async (
    userId: string,
    clerkId: string,
    newRole: "admin" | "writer" | "viewer",
  ) => {
    if (
      !confirm(
        `Are you sure you want to change this user's role to ${newRole}?`,
      )
    )
      return;

    startTransition(async () => {
      try {
        await updateUserRole(clerkId, newRole);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
      } catch (err) {
        alert("Failed to update user role.");
      }
    });
  };

  const handleUserDelete = async (userId: string, clerkId: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this user? This will delete all their posts, comments, and activity and cannot be undone.",
      )
    )
      return;

    startTransition(async () => {
      try {
        await deleteUser(clerkId);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } catch (err: any) {
        alert(err.message || "Failed to delete user.");
      }
    });
  };

  const handleSubscriberDelete = async (subId: string, email: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently remove ${email} from the newsletter?`,
      )
    )
      return;

    startTransition(async () => {
      try {
        await deleteSubscriber(subId);
        setSubscribers((prev) => prev.filter((s) => s.id !== subId));
      } catch (err: any) {
        alert(err.message || "Failed to delete subscriber.");
      }
    });
  };

  const exportSubscribersCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Email,Status,Joined At"].join("\n") +
      "\n" +
      subscribers
        .map(
          (s) =>
            `${s.email},${s.active ? "Active" : "Inactive"},${s.createdAt}`,
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `subscribers-${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------
  // Filters
  // ----------------------------------------------------

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.type.toLowerCase().includes(postSearch.toLowerCase());
    return matchesSearch && p.status === activePostSubTab;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchesSearch && u.role === activeUserSubTab;
  });

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(subscriberSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800/80 overflow-x-auto scrollbar-none">
        {[
          { id: "analytics", name: "Analytics Dashboard", icon: BarChart3 },
          { id: "posts", name: "Content Manager", icon: FileText },
          { id: "users", name: "User Permissions", icon: Users },
          { id: "subscribers", name: "Newsletter Subscribers", icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TABS CONTENT */}

      {/* 1. ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* SaaS Counter Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                name: "Total Views",
                val: initialAnalytics.summary.totalViews,
                desc: "Cumulative page hits",
                color: "text-indigo-600",
              },
              {
                name: "Unique Visitors",
                val: initialAnalytics.summary.totalVisitors,
                desc: "Unique IP hashes",
                color: "text-violet-600",
              },
              {
                name: "Active Subscribers",
                val: initialAnalytics.summary.totalSubscribers,
                desc: "Newsletter audience",
                color: "text-emerald-600",
              },
              {
                name: "Published Updates",
                val: initialAnalytics.summary.totalPosts,
                desc: "Live content",
                color: "text-blue-600",
              },
              {
                name: "Pending Drafts",
                val: initialAnalytics.summary.totalDrafts,
                desc: "Needs approval",
                color: "text-amber-600",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card text-card-foreground p-4 shadow-sm"
              >
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono block">
                  {c.name}
                </span>
                <span
                  className={`text-2xl font-black ${c.color} tracking-tight block mt-1 font-mono`}
                >
                  {c.val}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-450 block mt-1 leading-none font-mono">
                  {c.desc}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Graph */}
            <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">
                Visits & Views Trend (Last 14 Days)
              </h3>

              {/* Custom CSS Bar Chart */}
              <div className="flex items-end justify-between h-48 pt-6 px-2 border-b border-l border-slate-100 dark:border-zinc-800">
                {initialAnalytics.dailyVisits.map((day: any) => {
                  const maxVal = Math.max(
                    ...initialAnalytics.dailyVisits.map((d: any) => d.views),
                    1,
                  );
                  const viewHeight = (day.views / maxVal) * 100;
                  const visitorHeight = (day.visitors / maxVal) * 100;

                  return (
                    <div
                      key={day.date}
                      className="flex flex-col items-center flex-1 group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-zinc-100 text-[9px] font-mono px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-md">
                        <div>Date: {day.date}</div>
                        <div className="text-indigo-400">
                          Views: {day.views}
                        </div>
                        <div className="text-violet-400">
                          Visitors: {day.visitors}
                        </div>
                      </div>

                      {/* Bar Bars */}
                      <div className="w-full max-w-[12px] flex gap-[2px] items-end h-32 justify-center">
                        <div
                          className="w-[5px] bg-indigo-500 dark:bg-indigo-600 rounded-t-sm"
                          style={{ height: `${viewHeight}%` }}
                        />
                        <div
                          className="w-[5px] bg-violet-400 dark:bg-violet-500 rounded-t-sm"
                          style={{ height: `${visitorHeight}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-mono mt-1 rotate-45 origin-left truncate w-8 leading-none">
                        {day.date.split("-")[2]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-4 text-[9px] font-mono pt-2">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 bg-indigo-500 dark:bg-indigo-600 rounded-sm" />
                  <span className="text-slate-500">Page Views</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 bg-violet-400 dark:bg-violet-500 rounded-sm" />
                  <span className="text-slate-500">Unique Visitors</span>
                </span>
              </div>
            </div>

            {/* Right Rankings */}
            <div className="space-y-6">
              {/* Popular Posts */}
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Popular Articles</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {initialAnalytics.mostViewedPosts.map(
                    (post: any, idx: number) => (
                      <div
                        key={post.id}
                        className="flex justify-between items-center text-xs py-1 border-b dark:border-zinc-800/60 last:border-0"
                      >
                        <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate max-w-[150px]">
                          {idx + 1}. {post.title}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          {post.views}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Popular Tags */}
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Trending Tags</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {initialAnalytics.popularTags.map((tag: any) => (
                    <div
                      key={tag.name}
                      className="flex justify-between items-center text-xs py-1 border-b dark:border-zinc-800/60 last:border-0"
                    >
                      <span className="font-semibold text-slate-700 dark:text-zinc-350">
                        #{tag.name}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-slate-500">
                        {tag.count} {tag.count === 1 ? "post" : "posts"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONTENT MANAGER TAB */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          {/* Post Manager search & Sub Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 w-full">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  placeholder="Filter posts..."
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                />
              </div>

              {/* Status Sub Tabs */}
              <div className="flex border-b dark:border-zinc-800 gap-1 pb-0.5 overflow-x-auto scrollbar-none">
                {[
                  { id: "published", label: "Published" },
                  { id: "pending", label: "Pending Approval" },
                  { id: "draft", label: "Drafts" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePostSubTab(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                      activePostSubTab === tab.id
                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    {tab.id === "published" ? "Published" : tab.id === "pending" ? "Pending Approval" : "Drafts"} ({posts.filter((p) => p.status === tab.id).length})
                  </button>
                ))}
              </div>
            </div>

            <Link
              href="/write"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm"
            >
              <span>+ Create Post</span>
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900/60 border-b dark:border-zinc-850 font-mono text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Engagement</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-slate-400 dark:text-zinc-550 italic"
                    >
                      No posts found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">
                        <div
                          className="max-w-[200px] truncate"
                          title={post.title}
                        >
                          {post.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 capitalize">
                        {post.type}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-zinc-350">
                        {post.author.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            post.status === "published"
                              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                          }`}
                        >
                          {post.status === "published" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          <span>{post.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-600 dark:text-zinc-400 space-x-2">
                        <span>{post._count.views}v</span>
                        <span>{post._count.reactions}r</span>
                        <span>{post._count.comments}c</span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        {/* Approval Action */}
                        {post.status !== "published" && (
                          <button
                            onClick={() => handleApprove(post.id)}
                            disabled={isPending}
                            className="p-1.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 cursor-pointer border border-emerald-200/40 hover:bg-emerald-100"
                            title="Approve / Publish"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Pin Action */}
                        <button
                          onClick={() => handleTogglePin(post.id, post.pinned)}
                          disabled={isPending}
                          className={`p-1.5 rounded cursor-pointer border ${
                            post.pinned
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200/50"
                              : "bg-slate-50 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 border-slate-200 dark:border-zinc-700"
                          }`}
                          title={post.pinned ? "Unpin Post" : "Pin Post"}
                        >
                          <Pin
                            className={`h-3.5 w-3.5 ${post.pinned ? "rotate-45" : ""}`}
                          />
                        </button>

                        {/* Edit Action */}
                        <Link
                          href={`/edit-post/${post.id}`}
                          className="inline-flex p-1.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/40 hover:bg-blue-100"
                          title="Edit Post"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>

                        {/* Delete Action */}
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={isPending}
                          className="p-1.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-455 cursor-pointer border border-rose-200/40 hover:bg-rose-100"
                          title="Delete Post"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
              />
            </div>

            {/* Role Segregation Tabs */}
            <div className="flex border-b dark:border-zinc-800 gap-1 pb-0.5">
              {(["viewer", "writer", "admin"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveUserSubTab(role)}
                  className={`px-3 py-1.5 text-xs font-semibold border-b-2 capitalize transition-colors cursor-pointer ${
                    activeUserSubTab === role
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {role}s ({users.filter((u) => u.role === role).length})
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900/60 border-b dark:border-zinc-850 font-mono text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Assign Role</th>
                  {isSuperAdmin && (
                    <th className="px-4 py-3 text-center w-20">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSuperAdmin ? 6 : 5}
                      className="text-center py-8 text-slate-400 dark:text-zinc-550 italic"
                    >
                      No users found in this category.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20"
                    >
                      <td className="px-4 py-3 flex items-center gap-2">
                        <img
                          src={user.imageUrl || "/avatar-fallback.png"}
                          alt={user.name || "User"}
                          className="h-7 w-7 rounded-full border object-cover"
                        />
                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                          {user.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            user.role === "admin"
                              ? "bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-455 border border-rose-100/50"
                              : user.role === "writer"
                                ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100/50"
                                : "bg-slate-100 text-slate-655 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-455 font-mono">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={user.role}
                          disabled={
                            isPending ||
                            user.email.toLowerCase() ===
                              "manishedu980@gmail.com" ||
                            (!isSuperAdmin && user.role === "admin")
                          }
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              user.clerkId,
                              e.target.value as any,
                            )
                          }
                          className="rounded border border-slate-200 dark:border-zinc-800 bg-card px-2 py-1 text-[11px] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="writer">Writer</option>
                          {(isSuperAdmin || user.role === "admin") && (
                            <option value="admin">Admin</option>
                          )}
                        </select>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-center">
                          {user.email.toLowerCase() !==
                          "manishedu980@gmail.com" ? (
                            <button
                              onClick={() =>
                                handleUserDelete(user.id, user.clerkId)
                              }
                              disabled={isPending}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50 cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Owner
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SUBSCRIBERS TAB */}
      {activeTab === "subscribers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                placeholder="Search emails..."
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
              />
            </div>
            <button
              onClick={exportSubscribersCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Email List (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900/60 border-b dark:border-zinc-850 font-mono text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                  <th className="px-4 py-3">Subscriber Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-slate-400 dark:text-zinc-550 italic"
                    >
                      No subscribers found.
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                        {sub.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            sub.active
                              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                          }`}
                        >
                          {sub.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-455 font-mono">
                        {new Date(sub.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            handleSubscriberDelete(sub.id, sub.email)
                          }
                          disabled={isPending}
                          className="p-1.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-455 cursor-pointer border border-rose-200/40 hover:bg-rose-100 disabled:opacity-50"
                          title="Remove subscriber"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
