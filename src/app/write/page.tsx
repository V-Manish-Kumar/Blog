import { syncUser } from "@/lib/auth-sync";
import Navbar from "@/components/Navbar";
import RichTextEditor from "@/components/RichTextEditor";
import { redirect } from "next/navigation";

export default async function WritePage() {
  const dbUser = await syncUser();

  // Protect on server level: only admins or writers can access this page
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "writer")) {
    redirect("/");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="border-b pb-4 border-slate-200/60 dark:border-zinc-800/80">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 font-sans">
              Create New Update
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Publish articles, short updates, TIL notes, or project progress.
            </p>
          </div>

          <RichTextEditor userRole={dbUser.role} />
        </div>
      </main>
    </div>
  );
}
