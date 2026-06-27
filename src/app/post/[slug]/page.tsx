import { getPostBySlug } from "@/lib/actions/posts";
import { syncUser } from "@/lib/auth-sync";
import Navbar from "@/components/Navbar";
import ArticleView from "@/components/ArticleView";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

async function getIpHash() {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.post.findUnique({
    where: { slug },
  });

  if (!post) return { title: "Post Not Found" };

  const description = post.content.slice(0, 160).replace(/[#\n`*_-]/g, "").trim();

  return {
    title: `${post.title} | Manish Kumar`,
    description,
    alternates: {
      canonical: `https://blog.v-manish-kumar.dev/post/${slug}`,
    },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: `https://blog.v-manish-kumar.dev/post/${slug}`,
      publishedTime: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const headerList = await headers();
  const userAgent = headerList.get("user-agent") || "";
  
  const dbUser = await syncUser();
  const ipHash = await getIpHash();

  // Load post details and increment views if viewed by a unique IP within the last hour
  const post = await getPostBySlug(slug, {
    incrementViews: true,
    ipHash,
    userAgent,
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ArticleView
          post={post}
          currentUserId={dbUser?.id}
          ipHash={ipHash}
        />
      </main>

      <footer className="border-t bg-white dark:bg-zinc-950 py-6 mt-12 text-center text-xs text-slate-400 dark:text-zinc-650 font-mono">
        <div className="max-w-5xl mx-auto px-4">
          <p>© {new Date().getFullYear()} devFeed. Built in Public.</p>
        </div>
      </footer>
    </div>
  );
}
