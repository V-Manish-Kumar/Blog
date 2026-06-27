"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/lib/actions/newsletter";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await subscribeNewsletter(email);
      if (res.success) {
        setStatus({ type: "success", message: res.message });
        setEmail("");
      } else {
        setStatus({ type: "error", message: "Something went wrong. Please try again." });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Failed to subscribe." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground p-5 shadow-sm">
      <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
        <Mail className="h-4 w-4 text-indigo-500" />
        <span>Join the Newsletter</span>
      </h3>
      <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
        Get weekly updates on software architecture, DevOps experiments, and building AI agents in public.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          disabled={loading}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {loading ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      {status && (
        <div
          className={`mt-3 flex items-start gap-1.5 rounded-md p-2.5 text-xs ${
            status.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30"
              : "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 border border-red-200/50 dark:border-red-900/30"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
