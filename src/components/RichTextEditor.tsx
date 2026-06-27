"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "@/lib/actions/posts";
import Markdown from "./Markdown";
import {
  Save,
  Eye,
  Edit3,
  Image,
  Link2,
  Percent,
  Layers,
  Hash,
  Upload,
} from "lucide-react";
import { GithubIcon } from "@/components/icons";

interface RichTextEditorProps {
  userRole?: string;
  post?: {
    id: string;
    slug: string;
    title: string;
    content: string;
    type: "short" | "article" | "note" | "project";
    coverImage?: string | null;
    repositoryLink?: string | null;
    demoLink?: string | null;
    progressPercentage?: number | null;
    projectStatus?: string | null;
    tags: string[];
    status: string;
  };
}

export default function RichTextEditor({ post, userRole }: RichTextEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Form Fields State
  const [type, setType] = useState<"short" | "article" | "note" | "project">(
    post?.type || "article",
  );
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [repositoryLink, setRepositoryLink] = useState(
    post?.repositoryLink || "",
  );
  const [demoLink, setDemoLink] = useState(post?.demoLink || "");
  const [progressPercentage, setProgressPercentage] = useState<string>(
    post?.progressPercentage?.toString() || "",
  );
  const [projectStatus, setProjectStatus] = useState(
    post?.projectStatus || "In Progress",
  );
  const [tagsInput, setTagsInput] = useState(post?.tags?.join(", ") || "");
  const [status, setStatus] = useState<"draft" | "published" | "pending">(
    post?.status === "published"
      ? "published"
      : post?.status === "draft"
      ? "draft"
      : post?.status === "pending"
      ? "pending"
      : userRole === "admin"
      ? "draft"
      : "pending",
  );

  // Cover Image upload/URL tabs State
  const [imageSourceTab, setImageSourceTab] = useState<"upload" | "url">(
    post?.coverImage?.startsWith("data:") ? "upload" : "url",
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit (5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert("Post content is required");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const progress = progressPercentage
      ? parseInt(progressPercentage, 10)
      : undefined;

    const payload = {
      title: type === "short" ? "Short Update" : title,
      content,
      type,
      coverImage:
        type === "article" || type === "short" ? coverImage || null : null,
      repositoryLink:
        type === "project" && repositoryLink ? repositoryLink : undefined,
      demoLink: type === "project" && demoLink ? demoLink : undefined,
      progressPercentage: type === "project" ? progress : undefined,
      projectStatus: type === "project" ? projectStatus : undefined,
      tags,
      status,
    };

    startTransition(async () => {
      try {
        if (post?.id) {
          // Update post
          await updatePost(post.id, payload as any);
          router.push(`/post/${post.slug || ""}`);
        } else {
          // Create new post
          const newPost = await createPost(payload as any);
          router.push(
            newPost.status === "published" ? `/post/${newPost.slug}` : "/",
          );
        }
        router.refresh();
      } catch (err: any) {
        console.error("Save failed:", err);
        alert(err.message || "Failed to save post.");
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Post Type Selector */}
      <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
          Content Format
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["article", "short", "note", "project"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2 px-3 text-xs font-semibold rounded-lg capitalize border cursor-pointer transition-colors ${
                type === t
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-card hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              }`}
            >
              {t} {t === "note" && "(TIL)"}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Input Fields */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          {type !== "short" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                Post Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                required
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Conditional Fields based on Type */}
          {(type === "article" || type === "short") && (
            <div className="space-y-2 border rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 flex items-center gap-1">
                  <Image className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Cover Image (Optional)</span>
                </label>
                <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setImageSourceTab("upload")}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      imageSourceTab === "upload"
                        ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSourceTab("url")}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      imageSourceTab === "url"
                        ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    Paste URL
                  </button>
                </div>
              </div>

              {imageSourceTab === "upload" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg cursor-pointer bg-card hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        <Upload className="h-5 w-5 text-slate-400 dark:text-zinc-500 mb-1" />
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
                          Click to upload an image
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                          PNG, JPG, WEBP, GIF up to 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              )}

              {/* Cover Image Preview */}
              {coverImage && (
                <div className="relative mt-2 rounded-lg border overflow-hidden aspect-[21/9] bg-slate-100 dark:bg-zinc-900">
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="absolute top-2 right-2 p-1 px-2 rounded-md bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold cursor-pointer backdrop-blur-xs transition-colors"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          )}

          {type === "project" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <GithubIcon className="h-3.5 w-3.5" />
                  <span>GitHub Repository Link</span>
                </label>
                <input
                  type="url"
                  value={repositoryLink}
                  onChange={(e) => setRepositoryLink(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Live Demo Link</span>
                </label>
                <input
                  type="url"
                  value={demoLink}
                  onChange={(e) => setDemoLink(e.target.value)}
                  placeholder="https://myproject.com"
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5" />
                  <span>Project Progress (%)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(e.target.value)}
                  placeholder="e.g. 75"
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Project Status</span>
                </label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>
          )}

          {/* Markdown Content Area */}
          <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
            {/* Toolbar Tabs */}
            <div className="flex border-b items-center justify-between px-4 py-2 bg-slate-50 dark:bg-zinc-900/40">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">
                {type === "short" ? "Write Update" : "Markdown Editor"}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === "write"
                      ? "bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                      : "text-slate-500 dark:text-zinc-450 hover:bg-slate-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                      : "text-slate-500 dark:text-zinc-450 hover:bg-slate-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Textarea/Preview window */}
            <div className="p-4 min-h-[300px]">
              {activeTab === "write" ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    type === "short"
                      ? "What's happening? Share a quick update..."
                      : "Write in Markdown..."
                  }
                  required
                  rows={14}
                  className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none font-mono"
                />
              ) : (
                <div className="min-h-[300px] select-text">
                  {content.trim() ? (
                    <Markdown content={content} />
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 italic">
                      Nothing to preview yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Settings Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">
              Publishing Options
            </h3>

            {/* Tags */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <span>Tags (comma separated)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ai, devops, docker"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-card px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Status (Draft vs Published) */}
            {userRole === "admin" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("draft")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      status === "draft"
                        ? "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-300 dark:border-zinc-700"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("published")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      status === "published"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    Publish Immediately
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  Status
                </label>
                <div className="px-3 py-2 rounded-lg border border-amber-200/50 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10 text-amber-800 dark:text-amber-400 text-xs font-medium">
                  Saving this post will submit it for Admin Approval.
                </div>
              </div>
            )}

            {/* Save Buttons */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Save className="h-4 w-4" />
              <span>
                {isPending
                  ? "Saving..."
                  : userRole === "admin"
                    ? (post?.id ? "Update Post" : "Publish Post")
                    : (post?.id ? "Update & Submit" : "Submit for Approval")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
