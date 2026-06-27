"use client";

import { useEffect, useState, useTransition } from "react";
import { getPosts } from "@/lib/actions/posts";
import PostCard from "./PostCard";
import { Layers, BookOpen, Terminal, Code2, Search, SlidersHorizontal } from "lucide-react";

interface FeedProps {
  initialPosts: any[];
  currentUserId?: string;
  ipHash?: string;
  preselectedType?: "short" | "article" | "note" | "project";
}

export default function Feed({
  initialPosts,
  currentUserId,
  ipHash = "",
  preselectedType,
}: FeedProps) {
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [selectedType, setSelectedType] = useState<string>(preselectedType || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(initialPosts.length);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10);
  const [isPending, startTransition] = useTransition();

  // Re-fetch posts when filters change
  useEffect(() => {
    // If it is the initial render and no filters are set, use the preloaded server posts
    if (selectedType === "all" && !searchQuery && !preselectedType) {
      setPosts(initialPosts);
      setOffset(initialPosts.length);
      setHasMore(initialPosts.length >= 10);
      return;
    }

    const delayDebounce = setTimeout(() => {
      startTransition(async () => {
        try {
          const typeFilter = selectedType === "all" ? undefined : (selectedType as any);
          const data = await getPosts({
            type: typeFilter,
            search: searchQuery || undefined,
            limit: 10,
            offset: 0,
          });
          setPosts(data);
          setOffset(data.length);
          setHasMore(data.length >= 10);
        } catch (e) {
          console.error("Failed to load feed:", e);
        }
      });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [selectedType, searchQuery, initialPosts, preselectedType]);

  const loadMore = async () => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const typeFilter = selectedType === "all" ? undefined : (selectedType as any);
        const data = await getPosts({
          type: typeFilter,
          search: searchQuery || undefined,
          limit: 10,
          offset: offset,
        });

        if (data.length < 10) {
          setHasMore(false);
        }

        setPosts((prev) => [...prev, ...data]);
        setOffset((prev) => prev + data.length);
      } catch (e) {
        console.error("Failed to load more posts:", e);
      }
    });
  };

  const tabs = [
    { id: "all", name: "All Feed", icon: Layers },
    { id: "article", name: "Articles", icon: BookOpen },
    { id: "short", name: "Shorts", icon: Layers },
    { id: "note", name: "TIL Notes", icon: Terminal },
    { id: "project", name: "Projects", icon: Code2 },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card text-card-foreground p-3 border rounded-xl shadow-sm">
        {/* Type Filter Tabs */}
        <div className="flex overflow-x-auto w-full sm:w-auto gap-1 scrollbar-none py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Global Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, tags, content..."
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Feed Timeline */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed bg-card text-card-foreground p-6">
            <SlidersHorizontal className="h-8 w-8 text-slate-350 dark:text-zinc-655 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">No updates found</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-455 mt-1">
              Try adjusting your search criteria or changing filters.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => {
              // Precalculate active reactions and bookmarks for initial client states
              const isBookmarked = currentUserId
                ? post.bookmarks.some((b: any) => b.userId === currentUserId)
                : false;
              
              const reactedTypes = post.reactions
                .filter((r: any) => (currentUserId && r.userId === currentUserId) || (ipHash && r.ipHash === ipHash))
                .map((r: any) => r.type);

              return (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  initialIsBookmarked={isBookmarked}
                  initialReactedTypes={reactedTypes}
                  ipHash={ipHash}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="px-6 py-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-card text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPending ? "Loading older updates..." : "Load More Activity"}
          </button>
        </div>
      )}
    </div>
  );
}
