"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../db";
import { revalidatePath } from "next/cache";
import { sendMail, getNewPostNotificationTemplate } from "@/lib/email";

// Helper to slugify titles
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// Helper to calculate reading time
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 225;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Helper to broadcast new posts to active newsletter subscribers
async function broadcastNewPost(post: {
  title: string;
  slug: string;
  type: string;
  content: string;
  readingTime: number;
}) {
  try {
    const activeSubscribers = await db.subscriber.findMany({
      where: { active: true },
    });

    if (activeSubscribers.length === 0) {
      console.log(`[Broadcast] No active newsletter subscribers found. Skipping broadcast.`);
      return;
    }

    console.log(`[Broadcast] Sending new post email to ${activeSubscribers.length} subscribers...`);

    // Dispatch broadcast emails in parallel
    await Promise.allSettled(
      activeSubscribers.map(async (sub) => {
        try {
          const html = getNewPostNotificationTemplate(sub.email, post);
          await sendMail({
            to: sub.email,
            subject: `New ${post.type === "article" ? "article" : post.type === "project" ? "project update" : post.type === "note" ? "learning note" : "update"}: ${post.title}`,
            html,
          });
        } catch (err) {
          console.error(`[Broadcast Error] Failed to send email to ${sub.email}:`, err);
        }
      })
    );
  } catch (err) {
    console.error("[Broadcast Error] Failed to run newsletter broadcast:", err);
  }
}

// Check if user is admin or writer
async function verifyAuth(allowedRoles: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
  });
  if (!dbUser || !allowedRoles.includes(dbUser.role)) {
    throw new Error("Forbidden");
  }
  return dbUser;
}

// 1. Create a Post
export async function createPost(formData: {
  title: string;
  content: string;
  type: "short" | "article" | "note" | "project";
  coverImage?: string;
  repositoryLink?: string;
  demoLink?: string;
  progressPercentage?: number;
  projectStatus?: string;
  tags?: string[];
  status?: "draft" | "published";
}) {
  const user = await verifyAuth(["admin", "writer"]);

  let slug = slugify(formData.title || "short-update");
  if (!slug || formData.type === "short") {
    slug = `update-${Date.now()}`;
  }

  // Handle unique slug
  const existing = await db.post.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
  }

  const readingTime = calculateReadingTime(formData.content);
  
  // Writers can only submit for approval (status = pending)
  let status = formData.status || "pending";
  if (user.role !== "admin") {
    status = "pending"; // Force pending for contributors/writers
  }

  const post = await db.post.create({
    data: {
      title: formData.title || "Short Update",
      slug,
      content: formData.content,
      type: formData.type,
      status,
      coverImage: formData.coverImage || null,
      readingTime,
      repositoryLink: formData.repositoryLink || null,
      demoLink: formData.demoLink || null,
      progressPercentage: formData.progressPercentage || null,
      projectStatus: formData.projectStatus || null,
      authorId: user.id,
      publishedAt: status === "published" ? new Date() : null,
    },
  });

  // Attach Tags
  if (formData.tags && formData.tags.length > 0) {
    for (const tagName of formData.tags) {
      const cleanName = tagName.trim().toLowerCase();
      if (!cleanName) continue;

      const tag = await db.tag.upsert({
        where: { name: cleanName },
        create: { name: cleanName },
        update: {},
      });

      await db.postTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      });
    }
  }

  if (status === "published") {
    // Run broadcast asynchronously so it doesn't block server action response
    broadcastNewPost({
      title: post.title,
      slug: post.slug,
      type: post.type,
      content: post.content,
      readingTime: post.readingTime,
    }).catch(err => console.error("Post broadcast failed:", err));
  }

  revalidatePath("/");
  revalidatePath("/feed");
  return post;
}

// 2. Update a Post
export async function updatePost(
  postId: string,
  formData: {
    title?: string;
    content?: string;
    type?: "short" | "article" | "note" | "project";
    coverImage?: string;
    repositoryLink?: string;
    demoLink?: string;
    progressPercentage?: number;
    projectStatus?: string;
    tags?: string[];
    status?: "draft" | "published" | "pending";
    pinned?: boolean;
    featured?: boolean;
  }
) {
  const user = await verifyAuth(["admin", "writer"]);

  const existingPost = await db.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) throw new Error("Post not found");

  // Writers can only edit their own drafts
  if (user.role !== "admin" && existingPost.authorId !== user.id) {
    throw new Error("Unauthorized");
  }

  const updateData: any = {};
  if (formData.title !== undefined) updateData.title = formData.title;
  if (formData.content !== undefined) {
    updateData.content = formData.content;
    updateData.readingTime = calculateReadingTime(formData.content);
  }
  if (formData.type !== undefined) updateData.type = formData.type;
  if (formData.coverImage !== undefined) updateData.coverImage = formData.coverImage;
  if (formData.repositoryLink !== undefined) updateData.repositoryLink = formData.repositoryLink;
  if (formData.demoLink !== undefined) updateData.demoLink = formData.demoLink;
  if (formData.progressPercentage !== undefined) updateData.progressPercentage = formData.progressPercentage;
  if (formData.projectStatus !== undefined) updateData.projectStatus = formData.projectStatus;
  
  if (formData.pinned !== undefined && user.role === "admin") updateData.pinned = formData.pinned;
  if (formData.featured !== undefined && user.role === "admin") updateData.featured = formData.featured;

  if (formData.status !== undefined) {
    if (user.role === "admin") {
      updateData.status = formData.status;
      if (formData.status === "published" && !existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      }
    } else {
      updateData.status = "pending"; // Writer can't force publish, set to pending for review
    }
  }

  const updatedPost = await db.post.update({
    where: { id: postId },
    data: updateData,
  });

  // Re-sync tags if provided
  if (formData.tags !== undefined) {
    // Delete existing connections
    await db.postTag.deleteMany({
      where: { postId },
    });

    for (const tagName of formData.tags) {
      const cleanName = tagName.trim().toLowerCase();
      if (!cleanName) continue;

      const tag = await db.tag.upsert({
        where: { name: cleanName },
        create: { name: cleanName },
        update: {},
      });

      await db.postTag.create({
        data: {
          postId,
          tagId: tag.id,
        },
      });
    }
  }

  const wasPublished = existingPost.status === "published";
  const isPublishedNow = updatedPost.status === "published";

  if (isPublishedNow && !wasPublished) {
    // Run broadcast asynchronously so it doesn't block server action response
    broadcastNewPost({
      title: updatedPost.title,
      slug: updatedPost.slug,
      type: updatedPost.type,
      content: updatedPost.content,
      readingTime: updatedPost.readingTime,
    }).catch(err => console.error("Post broadcast failed:", err));
  }

  revalidatePath("/");
  revalidatePath(`/post/${updatedPost.slug}`);
  return updatedPost;
}

// 3. Delete a Post
export async function deletePost(postId: string) {
  const user = await verifyAuth(["admin"]); // Only admin can delete posts

  await db.post.delete({
    where: { id: postId },
  });

  revalidatePath("/");
  revalidatePath("/feed");
  return { success: true };
}

// 4. Get Feed Posts (combines all types, filterable, with pagination)
export async function getPosts(filters?: {
  type?: "short" | "article" | "note" | "project";
  tag?: string;
  search?: string;
  status?: "draft" | "published" | "pending";
  limit?: number;
  offset?: number;
  userId?: string; // Get posts bookmarked or authored by a specific user
  onlyBookmarks?: boolean;
}) {
  const limit = filters?.limit || 10;
  const offset = filters?.offset || 0;
  
  // Construct Prisma query options
  const where: any = {};

  // Status filtering (default only published, except for admins checking drafts)
  if (filters?.status) {
    where.status = filters.status;
  } else {
    where.status = "published";
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  // Tag filter
  if (filters?.tag) {
    where.tags = {
      some: {
        tag: {
          name: filters.tag.toLowerCase(),
        },
      },
    };
  }

  // Author filter or Bookmark filter
  if (filters?.userId) {
    if (filters.onlyBookmarks) {
      where.bookmarks = {
        some: {
          userId: filters.userId,
        },
      };
    } else {
      where.authorId = filters.userId;
    }
  }

  // Search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    where.OR = [
      { title: { contains: searchLower } },
      { content: { contains: searchLower } },
      {
        tags: {
          some: {
            tag: {
              name: { contains: searchLower },
            },
          },
        },
      },
    ];
  }

  // Fetch posts ordered by pinned (true first), then publishedAt/createdAt desc
  const posts = await db.post.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: [
      { pinned: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      author: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          role: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      reactions: true,
      bookmarks: true,
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  return posts.map(post => ({
    ...post,
    tags: post.tags.map(t => t.tag.name),
  }));
}

// 5. Get Post by Slug (and optionally increment views)
export async function getPostBySlug(slug: string, options?: { incrementViews?: boolean; ipHash?: string; userAgent?: string }) {
  const post = await db.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          role: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      reactions: true,
      bookmarks: true,
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  if (!post) return null;

  // View recording and incrementing
  if (options?.incrementViews && options.ipHash) {
    // Check if viewed within last 1 hour by same IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingView = await db.pageView.findFirst({
      where: {
        postId: post.id,
        ipHash: options.ipHash,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (!existingView) {
      await db.pageView.create({
        data: {
          postId: post.id,
          ipHash: options.ipHash,
          userAgent: options.userAgent || null,
          path: `/post/${slug}`,
        },
      });
    }
  }

  return {
    ...post,
    tags: post.tags.map(t => t.tag.name),
  };
}

// 6. Toggle Post Reaction
export async function toggleReaction(postId: string, type: string, ipHash: string) {
  const { userId } = await auth();

  let dbUser = null;
  if (userId) {
    dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  }

  // Find existing reaction
  const existing = await db.reaction.findFirst({
    where: {
      postId,
      type,
      OR: [
        dbUser ? { userId: dbUser.id } : { ipHash },
      ],
    },
  });

  if (existing) {
    // Remove reaction
    await db.reaction.delete({
      where: { id: existing.id },
    });
    return { reacted: false };
  } else {
    // Add reaction
    await db.reaction.create({
      data: {
        postId,
        type,
        userId: dbUser ? dbUser.id : null,
        ipHash: dbUser ? null : ipHash,
      },
    });
    return { reacted: true };
  }
}

// 7. Toggle Bookmark
export async function toggleBookmark(postId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error("User not synced");

  const existing = await db.bookmark.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: user.id,
      },
    },
  });

  if (existing) {
    await db.bookmark.delete({
      where: { id: existing.id },
    });
    return { bookmarked: false };
  } else {
    await db.bookmark.create({
      data: {
        postId,
        userId: user.id,
      },
    });
    return { bookmarked: true };
  }
}

// 8. Add Comment
export async function addComment(postId: string, content: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error("User not synced");

  const comment = await db.comment.create({
    data: {
      postId,
      userId: user.id,
      content,
    },
    include: {
      user: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  revalidatePath(`/post/${postId}`);
  return comment;
}

// 8.5. Delete Comment
export async function deleteComment(commentId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error("User not synced");

  const comment = await db.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");

  // Allow delete if user is admin OR the author of the comment
  if (user.role !== "admin" && comment.userId !== user.id) {
    throw new Error("Forbidden");
  }

  await db.comment.delete({
    where: { id: commentId },
  });

  return { success: true };
}

// 9. Get Tags (Popular/Trending)
export async function getTags() {
  const tags = await db.tag.findMany({
    include: {
      _count: {
        select: { posts: true },
      },
    },
    orderBy: {
      posts: { _count: "desc" },
    },
    take: 12,
  });

  return tags.map(tag => ({
    name: tag.name,
    count: tag._count.posts,
  }));
}
