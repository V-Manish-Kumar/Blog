import { unsubscribeNewsletter } from "@/lib/actions/newsletter";
import Link from "next/link";
import { CheckCircle, AlertTriangle, Home } from "lucide-react";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Unsubscribe | DevFeed",
  description: "Unsubscribe from the DevFeed newsletter updates.",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email;

  let success = false;
  let message = "";

  if (email) {
    const res = await unsubscribeNewsletter(email);
    success = res.success;
    message = res.message;
  } else {
    message = "No email address was specified in the unsubscribe link. Please verify the link in your email.";
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border bg-card p-8 shadow-lg text-center space-y-6">
          {success ? (
            <div className="space-y-4">
              <div className="inline-flex p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
                Unsubscribed Successfully
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-mono">
                {email}
              </p>
              <p className="text-sm text-slate-655 dark:text-zinc-350 leading-relaxed">
                {message || "You have been removed from our mailing list. You will no longer receive post updates or notifications."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex p-3 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-455">
                <AlertTriangle className="h-12 w-12" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
                Unsubscribe Request Failed
              </h1>
              <p className="text-sm text-slate-655 dark:text-zinc-350 leading-relaxed">
                {message}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer w-full"
            >
              <Home className="h-4 w-4" />
              <span>Back to Homepage</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white dark:bg-zinc-950 py-6 text-center text-xs text-slate-400 dark:text-zinc-650 font-mono">
        <div className="max-w-6xl mx-auto px-4">
          <p>© {new Date().getFullYear()} devFeed. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
