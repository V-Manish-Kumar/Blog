"use client";

import { useEffect, useState } from "react";
import { getTags } from "@/lib/actions/posts";
import { Hash, TrendingUp } from "lucide-react";
import Link from "next/link";

interface TagInfo {
  name: string;
  count: number;
}

export default function TrendingTags() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTags() {
      try {
        const data = await getTags();
        setTags(data);
      } catch (e) {
        console.error("Failed to load trending tags:", e);
      } finally {
        setLoading(false);
      }
    }
    loadTags();
  }, []);

  return (
    <div className="rounded-xl border bg-card text-card-foreground p-5 shadow-sm">
      <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-indigo-500" />
        <span>Trending Tags</span>
      </h3>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-1">
              <div className="h-4 w-20 rounded skeleton" />
              <div className="h-4.5 w-6 rounded skeleton" />
            </div>
          ))}
        </div>
      ) : tags.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-zinc-500 italic">No tags found.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tags.map((tag) => (
            <Link
              key={tag.name}
              href={`/tag/${tag.name}`}
              className="group flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1"
            >
              <div className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors" />
                <span className="font-medium group-hover:underline">{tag.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono bg-slate-100 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded-md">
                {tag.count} {tag.count === 1 ? "post" : "posts"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
