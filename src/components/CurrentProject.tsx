"use client";

import { Cpu, ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import Link from "next/link";

export default function CurrentProject() {
  const project = {
    name: "blog.v-manish-kumar.dev",
    description: "Personal blogging timeline platform, mixing long-form articles, short updates, and project progress in a social feed.",
    status: "Building in Public",
    progress: 85,
    github: "https://github.com/manishedu980/blog-v-manish-kumar-dev",
    demo: "/",
    nextTask: "Deploying production build & integrating Clerk webhooks",
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-indigo-500" />
          <span>Active Project</span>
        </h3>
        <span className="animate-pulse flex h-2 w-2 rounded-full bg-emerald-500" />
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-mono">
            {project.name}
          </h4>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
            {project.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{project.status}</span>
            <span className="text-slate-600 dark:text-zinc-400">{project.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="text-[10px] text-slate-500 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-md border border-slate-100/50 dark:border-zinc-800/30">
          <span className="font-semibold text-slate-600 dark:text-zinc-400 font-mono">Next:</span> {project.nextTask}
        </div>

        {/* Action Links */}
        <div className="flex gap-3 pt-1 border-t border-slate-100 dark:border-zinc-800/50">
          <Link
            href={project.github}
            target="_blank"
            className="flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            <span>Repository</span>
          </Link>
          <Link
            href={project.demo}
            className="flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Live Demo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
