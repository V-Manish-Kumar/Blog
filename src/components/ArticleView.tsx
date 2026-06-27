"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { addComment, deleteComment, toggleReaction, toggleBookmark } from "@/lib/actions/posts";
import Markdown from "./Markdown";
import { useUser, SignInButton } from "@clerk/nextjs";
import {
  Heart,
  Flame,
  Rocket,
  Brain,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  ArrowLeft,
  Calendar,
  Clock,
  Send,
  ExternalLink,
  Trash2
} from "lucide-react";
import { GithubIcon } from "@/components/icons";

interface ArticleViewProps {
  post: any;
  currentUserId?: string;
  ipHash: string;
}

export default function ArticleView({ post, currentUserId, ipHash }: ArticleViewProps) {
  const { isSignedIn, user } = useUser();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState("");
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() =>
    currentUserId ? post.bookmarks.some((b: any) => b.userId === currentUserId) : false
  );
  
  // Comments state
  const [comments, setComments] = useState<any[]>(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [commentPending, startCommentTransition] = useTransition();

  // Reactions state
  const [reactedTypes, setReactedTypes] = useState<string[]>(() =>
    post.reactions
      .filter((r: any) => (currentUserId && r.userId === currentUserId) || (ipHash && r.ipHash === ipHash))
      .map((r: any) => r.type)
  );

  const [reactionCounts, setReactionCounts] = useState<{ [key: string]: number }>(() => {
    const counts: { [key: string]: number } = { like: 0, fire: 0, rocket: 0, mindblown: 0 };
    post.reactions.forEach((r: any) => {
      if (counts[r.type] !== undefined) counts[r.type]++;
    });
    return counts;
  });

  // Calculate scroll progress and active TOC header
  useEffect(() => {
    const handleScroll = () => {
      // 1. Progress Bar
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }

      // 2. Active Heading in TOC
      const headingElements = Array.from(document.querySelectorAll("h2[id], h3[id]"));
      const scrollPosition = window.scrollY + 100;

      let currentActive = "";
      for (const el of headingElements) {
        const top = (el as HTMLElement).offsetTop;
        if (scrollPosition >= top) {
          currentActive = el.id;
        } else {
          break;
        }
      }
      setActiveHeading(currentActive);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parse headings for Table of Contents
  const tocHeadings = useMemo(() => {
    if (post.type !== "article") return [];
    const headings: { id: string; text: string; level: number }[] = [];
    const lines = post.content.split("\n");
    lines.forEach((line: string) => {
      if (line.startsWith("## ")) {
        const text = line.slice(3).replace(/\*\*|\*|`/g, "").trim();
        const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
        headings.push({ id, text, level: 2 });
      } else if (line.startsWith("### ")) {
        const text = line.slice(4).replace(/\*\*|\*|`/g, "").trim();
        const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
        headings.push({ id, text, level: 3 });
      }
    });
    return headings;
  }, [post.content, post.type]);

  const handleReaction = async (type: string) => {
    const alreadyReacted = reactedTypes.includes(type);

    setReactedTypes((prev) =>
      alreadyReacted ? prev.filter((t) => t !== type) : [...prev, type]
    );

    setReactionCounts((prev) => ({
      ...prev,
      [type]: alreadyReacted ? Math.max(0, prev[type] - 1) : prev[type] + 1,
    }));

    try {
      await toggleReaction(post.id, type, ipHash);
    } catch (e) {
      console.error("Failed to react:", e);
      // Rollback
      setReactedTypes((prev) =>
        alreadyReacted ? [...prev, type] : prev.filter((t) => t !== type)
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
      setIsBookmarked((prev) => !prev);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentPending) return;

    startCommentTransition(async () => {
      try {
        const newComment = await addComment(post.id, commentText.trim());
        setComments((prev) => [newComment, ...prev]);
        setCommentText("");
      } catch (err) {
        console.error("Failed to add comment:", err);
        alert("Failed to submit comment. Try again.");
      }
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment. Try again.");
    }
  };

  const formattedDate = formatDistanceToNow(new Date(post.publishedAt || post.createdAt), {
    addSuffix: true,
  });

  return (
    <>
      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-slate-100 dark:bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-100"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Timeline</span>
          </Link>

          {/* Heading Section */}
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-100 dark:border-zinc-800/80">
              {/* Author Card */}
              <div className="flex items-center gap-2.5">
                <img
                  src={post.author.imageUrl || "/avatar-fallback.png"}
                  alt={post.author.name || "Author"}
                  className="h-9 w-9 rounded-full border bg-slate-50 object-cover"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {post.author.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-400 dark:text-zinc-500 font-mono">
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-3 w-3" />
                      {formattedDate}
                    </span>
                    {post.type === "article" && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {post.readingTime} min read
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bookmark & Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBookmark}
                  className={`flex items-center justify-center p-2 rounded-lg border transition-colors cursor-pointer ${
                    isBookmarked
                      ? "text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/20 dark:border-indigo-900/30"
                      : "text-slate-400 border-slate-200 bg-card hover:text-indigo-500 hover:bg-slate-50 dark:text-zinc-500 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  }`}
                  title="Bookmark article"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-4.5 w-4.5" />
                  ) : (
                    <Bookmark className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="overflow-hidden rounded-xl aspect-[21/9] border">
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Project Details Panel if it is a project */}
          {post.type === "project" && (
            <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-zinc-900/30 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 dark:text-zinc-400">Project Status:</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border dark:border-indigo-900/20 font-bold">
                  {post.projectStatus || "Active"}
                </span>
              </div>
              {post.progressPercentage !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                    <span>Build Progress</span>
                    <span>{post.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full"
                      style={{ width: `${post.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
              {(post.repositoryLink || post.demoLink) && (
                <div className="flex gap-4 pt-1 border-t border-slate-200/50 dark:border-zinc-800/40 text-[11px]">
                  {post.repositoryLink && (
                    <a
                      href={post.repositoryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-slate-600 dark:text-zinc-350 hover:text-indigo-600 transition-colors"
                    >
                      <GithubIcon className="h-4 w-4" />
                      <span>Code Repository</span>
                    </a>
                  )}
                  {post.demoLink && (
                    <a
                      href={post.demoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-slate-600 dark:text-zinc-350 hover:text-indigo-600 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Live Demonstration</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Article Text Content */}
          <article className="py-2">
            <Markdown content={post.content} />
          </article>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/tag/${tag}`}
                  className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors border dark:border-zinc-700/50"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Reactions bar */}
          <div className="flex items-center gap-2 py-4 border-y border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/10 px-4 rounded-xl">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 font-mono pr-2">Reactions:</span>
            
            <button
              onClick={() => handleReaction("like")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                reactedTypes.includes("like")
                  ? "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-455 dark:bg-rose-950/20 dark:border-rose-900/30"
                  : "text-slate-500 border-slate-200 bg-card hover:text-rose-600 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
              }`}
            >
              <Heart className={`h-4 w-4 ${reactedTypes.includes("like") ? "fill-current" : ""}`} />
              <span className="font-mono text-xs">{reactionCounts.like}</span>
            </button>

            <button
              onClick={() => handleReaction("fire")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                reactedTypes.includes("fire")
                  ? "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-455 dark:bg-amber-950/20 dark:border-amber-900/30"
                  : "text-slate-500 border-slate-200 bg-card hover:text-amber-600 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
              }`}
            >
              <Flame className={`h-4 w-4 ${reactedTypes.includes("fire") ? "fill-current" : ""}`} />
              <span className="font-mono text-xs">{reactionCounts.fire}</span>
            </button>

            <button
              onClick={() => handleReaction("rocket")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                reactedTypes.includes("rocket")
                  ? "text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/20 dark:border-indigo-900/30"
                  : "text-slate-500 border-slate-200 bg-card hover:text-indigo-600 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
              }`}
            >
              <Rocket className={`h-4 w-4 ${reactedTypes.includes("rocket") ? "fill-current" : ""}`} />
              <span className="font-mono text-xs">{reactionCounts.rocket}</span>
            </button>

            <button
              onClick={() => handleReaction("mindblown")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                reactedTypes.includes("mindblown")
                  ? "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/20 dark:border-purple-900/30"
                  : "text-slate-500 border-slate-200 bg-card hover:text-purple-600 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
              }`}
            >
              <Brain className="h-4 w-4" />
              <span className="font-mono text-xs">{reactionCounts.mindblown}</span>
            </button>
          </div>

          {/* Comments Section */}
          <div id="comments" className="space-y-6 pt-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-500" />
              <span>Comments ({comments.length})</span>
            </h3>

            {/* Comment Form */}
            {isSignedIn ? (
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  required
                  disabled={commentPending}
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentPending}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{commentPending ? "Submitting..." : "Submit Comment"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl border border-dashed text-center bg-slate-50/50 dark:bg-zinc-900/20">
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
                  You must be logged in to participate in the conversation.
                </p>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 rounded-md cursor-pointer">
                    Sign In to Comment
                  </button>
                </SignInButton>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4 pt-2">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No comments yet. Be the first to reply!</p>
              ) : (
                <div className="flex flex-col gap-4 divide-y divide-slate-100 dark:divide-zinc-800">
                  {comments.map((comment, index) => {
                    const role = (user?.publicMetadata?.role as string) || "viewer";
                    const isAdmin = role === "admin";
                    const canDelete = isAdmin || (currentUserId && currentUserId === comment.userId);

                    return (
                      <div key={comment.id} className={`flex gap-3 ${index > 0 ? "pt-4" : ""}`}>
                        <img
                          src={comment.user.imageUrl || "/avatar-fallback.png"}
                          alt={comment.user.name || "User"}
                          className="h-8 w-8 rounded-full border bg-slate-50 object-cover shrink-0"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-700 dark:text-zinc-350">{comment.user.name}</span>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded cursor-pointer"
                                  title="Delete comment"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <span className="text-slate-400 dark:text-zinc-555">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-655 dark:text-zinc-350 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sticky TOC Column (Articles only) */}
        {tocHeadings.length > 0 && (
          <div className="hidden lg:block lg:col-span-1">
            <aside className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pl-4 border-l border-slate-100 dark:border-zinc-800/80 space-y-4 pr-2">
              <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">
                On This Page
              </h3>
              <nav className="flex flex-col gap-2.5 text-xs">
                {tocHeadings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(heading.id)?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                    className={`block hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium ${
                      heading.level === 3 ? "pl-3 text-slate-450 dark:text-zinc-500" : "text-slate-600 dark:text-zinc-400"
                    } ${
                      activeHeading === heading.id
                        ? "text-indigo-600! dark:text-indigo-400! border-l-2 border-indigo-500 dark:border-indigo-400 pl-1.5"
                        : ""
                    }`}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
