"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toggleReaction, toggleBookmark } from "@/lib/actions/posts";
import { useUser } from "@clerk/nextjs";
import {
  Heart,
  Flame,
  Rocket,
  Brain,
  Bookmark,
  MessageSquare,
  ExternalLink,
  Pin,
  FolderOpen,
  BookOpen,
  Calendar,
  Clock,
  Code2,
  BookmarkCheck,
  CheckCircle2,
} from "lucide-react";
import { GithubIcon } from "@/components/icons";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    content: string;
    type: string;
    status: string;
    coverImage?: string | null;
    readingTime: number;
    repositoryLink?: string | null;
    demoLink?: string | null;
    progressPercentage?: number | null;
    projectStatus?: string | null;
    pinned: boolean;
    featured: boolean;
    publishedAt?: Date | string | null;
    createdAt: Date | string;
    author: {
      name: string | null;
      imageUrl: string | null;
    };
    tags: string[];
    reactions: any[];
    bookmarks: any[];
    _count: {
      comments: number;
    };
  };
  currentUserId?: string;
  initialIsBookmarked?: boolean;
  initialReactedTypes?: string[];
  ipHash?: string;
}

export default function PostCard({
  post,
  currentUserId,
  initialIsBookmarked = false,
  initialReactedTypes = [],
  ipHash = "",
}: PostCardProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [reactedTypes, setReactedTypes] =
    useState<string[]>(initialReactedTypes);

  // Aggregate reaction counts
  const [reactionCounts, setReactionCounts] = useState<{
    [key: string]: number;
  }>(() => {
    const counts: { [key: string]: number } = {
      like: 0,
      fire: 0,
      rocket: 0,
      mindblown: 0,
    };
    post.reactions.forEach((r) => {
      if (counts[r.type] !== undefined) counts[r.type]++;
    });
    return counts;
  });

  const handleReaction = async (type: string) => {
    // optimistic update
    const alreadyReacted = reactedTypes.includes(type);

    setReactedTypes((prev) =>
      alreadyReacted ? prev.filter((t) => t !== type) : [...prev, type],
    );

    setReactionCounts((prev) => ({
      ...prev,
      [type]: alreadyReacted ? Math.max(0, prev[type] - 1) : prev[type] + 1,
    }));

    try {
      await toggleReaction(post.id, type, ipHash);
    } catch (e) {
      console.error("Failed to react:", e);
      // rollback
      setReactedTypes((prev) =>
        alreadyReacted ? [...prev, type] : prev.filter((t) => t !== type),
      );
      setReactionCounts((prev) => ({
        ...prev,
        [type]: alreadyReacted ? prev[type] + 1 : Math.max(0, prev[type] - 1),
      }));
    }
  };

  const handleBookmark = async () => {
    if (!isSignedIn) {
      alert("Please sign in to bookmark posts.");
      return;
    }

    setIsBookmarked(!isBookmarked);
    try {
      await toggleBookmark(post.id);
    } catch (e) {
      console.error("Failed to bookmark:", e);
      setIsBookmarked((prev) => !prev); // rollback
    }
  };

  const formattedDate = formatDistanceToNow(
    new Date(post.publishedAt || post.createdAt),
    {
      addSuffix: true,
    },
  );

  // ----------------------------------------------------
  // Layouts based on post.type
  // ----------------------------------------------------

  // A. SHORT POST (X-timeline / Social Card style)
  const renderShort = () => (
    <div className="flex gap-3">
      {/* Author avatar */}
      <img
        src={post.author.imageUrl || "/avatar-fallback.png"}
        alt={post.author.name || "Avatar"}
        className="h-10 w-10 rounded-full border bg-slate-50 dark:bg-zinc-800 object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
            {post.author.name}
          </span>
          <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
            {formattedDate}
          </span>
        </div>

        {/* Content */}
        <p className="mt-1.5 text-[13.5px] text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Optional Cover Image for Short Post */}
        {post.coverImage && (
          <div className="mt-3 overflow-hidden rounded-lg border max-h-[350px]">
            <img
              src={post.coverImage}
              alt="Update media"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Tag List */}
        {post.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${tag}`}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // B. LONG ARTICLE (Medium/Linear card style)
  const renderArticle = () => (
    <div className="space-y-4">
      {post.coverImage && (
        <Link
          href={`/post/${post.slug}`}
          className="block overflow-hidden rounded-lg aspect-[16/9] border"
        >
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
          />
        </Link>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-zinc-500 font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.readingTime} min read
          </span>
        </div>

        <Link href={`/post/${post.slug}`} className="block group">
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
            {post.title}
          </h2>
        </Link>

        <p className="text-[13px] text-slate-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
          {post.content.length > 250
            ? `${post.content.slice(0, 250)}...`
            : post.content}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <img
            src={post.author.imageUrl || "/avatar-fallback.png"}
            alt={post.author.name || "Avatar"}
            className="h-6.5 w-6.5 rounded-full border bg-slate-50 object-cover"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            {post.author.name}
          </span>
        </div>

        {post.tags.length > 0 && (
          <div className="flex gap-1">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // C. LEARNING NOTE (Notion/Stick note style)
  const renderNote = () => (
    <div className="relative border-l-3 border-amber-500/80 dark:border-amber-400/80 pl-3">
      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 font-mono mb-2">
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
          <BookOpen className="h-3 w-3" />
          TIL Note
        </span>
        <span>{formattedDate}</span>
      </div>

      <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
        {post.title}
      </h3>

      <div className="mt-2 text-[12.5px] text-slate-600 dark:text-zinc-450 leading-relaxed font-mono whitespace-pre-wrap">
        {post.content}
      </div>

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200/30 dark:border-amber-900/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // D. PROJECT UPDATE (GitHub / Linear card style)
  const renderProject = () => (
    <div className="space-y-3 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200">
          <Code2 className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 hover:underline">
            <Link href={`/post/${post.slug}`}>{post.title}</Link>
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 font-bold">
          {post.projectStatus || "Active"}
        </span>
      </div>

      <p className="text-[12.5px] text-slate-600 dark:text-zinc-400 leading-normal">
        {post.content}
      </p>

      {/* Progress */}
      {post.progressPercentage !== null &&
        post.progressPercentage !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-slate-400 dark:text-zinc-500">
              <span>Project Progress</span>
              <span className="font-bold">{post.progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${post.progressPercentage}%` }}
              />
            </div>
          </div>
        )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded border dark:border-zinc-700/60"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Repo / Demo Links */}
      {(post.repositoryLink || post.demoLink) && (
        <div className="flex gap-3 pt-2 text-[10px] text-slate-500 dark:text-zinc-400">
          {post.repositoryLink && (
            <Link
              href={post.repositoryLink}
              target="_blank"
              className="flex items-center gap-1 hover:text-indigo-500 transition-colors"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </Link>
          )}
          {post.demoLink && (
            <Link
              href={post.demoLink}
              target="_blank"
              className="flex items-center gap-1 hover:text-indigo-500 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Demo</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`relative rounded-xl border bg-card text-card-foreground p-5 shadow-sm transition-all duration-300 ${post.pinned ? "border-brand-500 bg-brand-50/5 dark:bg-indigo-950/5" : ""}`}
    >
      {/* Pinned badge */}
      {post.pinned && (
        <div className="absolute top-4 right-4 text-brand-600 dark:text-brand-400 flex items-center gap-1 text-[10px] font-bold font-mono uppercase tracking-wider">
          <Pin className="h-3.5 w-3.5 rotate-45" />
          <span>Pinned</span>
        </div>
      )}

      {/* Render selected card format */}
      {post.type === "short" && renderShort()}
      {post.type === "article" && renderArticle()}
      {post.type === "note" && renderNote()}
      {post.type === "project" && renderProject()}

      {/* Interactive Actions Footer (Likes, Comments, Bookmark) */}
      <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          {/* Reaction: Like */}
          <button
            onClick={() => handleReaction("like")}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              reactedTypes.includes("like")
                ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20"
                : "text-slate-500 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/10"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${reactedTypes.includes("like") ? "fill-current text-rose-600" : ""}`}
            />
            <span className="font-mono text-[10.5px]">
              {reactionCounts.like}
            </span>
          </button>

          {/* Reaction: Fire */}
          <button
            onClick={() => handleReaction("fire")}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              reactedTypes.includes("fire")
                ? "text-amber-600 bg-amber-50 dark:bg-amber-950/20"
                : "text-slate-500 dark:text-zinc-400 hover:text-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-950/10"
            }`}
          >
            <Flame
              className={`h-4 w-4 ${reactedTypes.includes("fire") ? "fill-current text-amber-500" : ""}`}
            />
            <span className="font-mono text-[10.5px]">
              {reactionCounts.fire}
            </span>
          </button>

          {/* Reaction: Rocket */}
          <button
            onClick={() => handleReaction("rocket")}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              reactedTypes.includes("rocket")
                ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20"
                : "text-slate-500 dark:text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10"
            }`}
          >
            <Rocket
              className={`h-4 w-4 ${reactedTypes.includes("rocket") ? "fill-current text-indigo-500" : ""}`}
            />
            <span className="font-mono text-[10.5px]">
              {reactionCounts.rocket}
            </span>
          </button>

          {/* Reaction: Mindblown */}
          <button
            onClick={() => handleReaction("mindblown")}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              reactedTypes.includes("mindblown")
                ? "text-purple-600 bg-purple-50 dark:bg-purple-950/20"
                : "text-slate-500 dark:text-zinc-400 hover:text-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-950/10"
            }`}
          >
            <Brain className="h-4 w-4" />
            <span className="font-mono text-[10.5px]">
              {reactionCounts.mindblown}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Comment Count */}
          <Link
            href={`/post/${post.slug}#comments`}
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded-md"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="font-mono text-[10.5px]">
              {post._count.comments}
            </span>
          </Link>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className={`flex items-center justify-center p-1 rounded-md transition-colors cursor-pointer ${
              isBookmarked
                ? "text-indigo-600 hover:bg-indigo-50/50 dark:text-indigo-400 dark:hover:bg-indigo-950/15"
                : "text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:text-zinc-500 dark:hover:bg-zinc-800"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Post"}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 fill-current animate-pulse" />
            ) : (
              <Bookmark className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
