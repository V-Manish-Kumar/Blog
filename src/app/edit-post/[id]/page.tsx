import { syncUser } from "@/lib/auth-sync";
import Navbar from "@/components/Navbar";
import RichTextEditor from "@/components/RichTextEditor";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dbUser = await syncUser();

  // Protect on server level
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "writer")) {
    redirect("/");
  }

  // Load post details and its tags
  const post = await db.post.findUnique({
    where: { id },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  if (!post) {
    notFound();
  }

  // Writers can only edit their own posts
  if (dbUser.role !== "admin" && post.authorId !== dbUser.id) {
    redirect("/");
  }

  // Format post details for editor
  const formattedPost = {
    ...post,
    type: post.type as any,
    tags: post.tags.map((t) => t.tag.name),
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="border-b pb-4 border-slate-200/60 dark:border-zinc-800/80">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 font-sans">
              Edit Post
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Modify the title, content, or settings of this update.
            </p>
          </div>

          <RichTextEditor post={formattedPost} userRole={dbUser.role} />
        </div>
      </main>
    </div>
  );
}
