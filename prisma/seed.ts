import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import crypto from "crypto";

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing database
  await db.pageView.deleteMany();
  await db.comment.deleteMany();
  await db.reaction.deleteMany();
  await db.bookmark.deleteMany();
  await db.postTag.deleteMany();
  await db.post.deleteMany();
  await db.tag.deleteMany();
  await db.subscriber.deleteMany();
  await db.user.deleteMany();

  // 2. Seed Mock Author / Users
  const adminUser = await db.user.create({
    data: {
      clerkId: "user_mock_admin",
      email: "manishedu980@gmail.com",
      name: "Manish Kumar",
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
      role: "admin",
    },
  });

  const contributorUser = await db.user.create({
    data: {
      clerkId: "user_mock_contributor",
      email: "writer@v-manish-kumar.dev",
      name: "John Doe",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256",
      role: "writer",
    },
  });

  const viewerUser = await db.user.create({
    data: {
      clerkId: "user_mock_viewer",
      email: "viewer@gmail.com",
      name: "Jane Smith",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256",
      role: "viewer",
    },
  });

  console.log("Users seeded successfully.");

  // 3. Seed Tags
  const tagNames = ["AI", "DevOps", "Docker", "Kubernetes", "Flask", "React", "Python", "TypeScript", "SQL", "Cloud"];
  const tags: any = {};
  for (const name of tagNames) {
    tags[name] = await db.tag.create({
      data: { name: name.toLowerCase() },
    });
  }

  console.log("Tags seeded successfully.");

  // 4. Seed Posts
  // A. Project Update
  const projectPost = await db.post.create({
    data: {
      title: "blog.v-manish-kumar.dev Platform",
      slug: "blog-v-manish-kumar-dev-platform",
      content: "Building my personal developer blogging and social feed timeline platform in public. Configured Next.js App Router, Prisma ORM with SQLite, Clerk authentication, and custom Tailwind styling. Next steps include writing the admin SaaS control panel and deploying to Vercel/Docker.",
      type: "project",
      status: "published",
      readingTime: 2,
      repositoryLink: "https://github.com/manishedu980/blog-v-manish-kumar-dev",
      demoLink: "https://blog.v-manish-kumar.dev",
      progressPercentage: 85,
      projectStatus: "Building in Public",
      pinned: true,
      authorId: adminUser.id,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });

  await db.postTag.createMany({
    data: [
      { postId: projectPost.id, tagId: tags["React"].id },
      { postId: projectPost.id, tagId: tags["TypeScript"].id },
      { postId: projectPost.id, tagId: tags["DevOps"].id },
    ],
  });

  // B. Long Form Article
  const articlePost = await db.post.create({
    data: {
      title: "How to Build Modern AI Agents with the Model Context Protocol (MCP)",
      slug: "build-modern-ai-agents-model-context-protocol-mcp",
      content: `In this deep dive, we will explore the Model Context Protocol (MCP) by Anthropic and learn how to build production-grade AI coding assistants that safely execute CLI commands, edit local files, and search the web.

## What is Model Context Protocol (MCP)?
MCP is an open standard that enables developers to build secure, modular integrations for AI models. Think of it as LSP (Language Server Protocol) but tailored specifically for AI.

### Core Components of MCP:
1. **MCP Hosts**: The application invoking the AI (e.g. Claude Desktop, cursor, or Antigravity IDE).
2. **MCP Client**: Initiates connection protocols and coordinates tools.
3. **MCP Servers**: Expose specific tools, resources, and prompt templates.

## Setting Up an MCP Server
Let's build a simple node-based MCP server that queries SQLite databases.

\`\`\`typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "sqlite-query-server",
  version: "1.0.0"
}, {
  capabilities: { tools: {} }
});

// Define your sqlite query tool here...
\`\`\`

## Verification and Safety
When running arbitrary CLI commands or sql scripts, security is paramount. Always use sandboxed terminal boundaries or prompt the user for validation.
`,
      type: "article",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800",
      readingTime: 6,
      featured: true,
      authorId: adminUser.id,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  await db.postTag.createMany({
    data: [
      { postId: articlePost.id, tagId: tags["AI"].id },
      { postId: articlePost.id, tagId: tags["TypeScript"].id },
    ],
  });

  // C. Short Post
  const shortPost = await db.post.create({
    data: {
      title: "Short Update",
      slug: `update-${Date.now()}`,
      content: "Just migrated my blog backend from Flask/MySQL to a unified Next.js 16 + Prisma 7 setup. The app is now tuned for deployment on Vercel with a cleaner build flow, a predictable environment setup, and production-ready publishing workflows. #devops #react #typescript",
      type: "short",
      status: "published",
      readingTime: 1,
      authorId: adminUser.id,
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  await db.postTag.createMany({
    data: [
      { postId: shortPost.id, tagId: tags["DevOps"].id },
      { postId: shortPost.id, tagId: tags["TypeScript"].id },
    ],
  });

  // D. Learning Note (TIL)
  const notePost = await db.post.create({
    data: {
      title: "Prisma 7 Dynamic Connection Setup",
      slug: "prisma-7-dynamic-connection-setup",
      content: "Today I Learned that Prisma 7 manages database connection setup through `prisma.config.ts` with an explicit driver adapter such as `@prisma/adapter-better-sqlite3`. That keeps the stack lightweight and makes the data layer easier to move between local and deployed environments.",
      type: "note",
      status: "published",
      readingTime: 1,
      authorId: adminUser.id,
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    },
  });

  await db.postTag.createMany({
    data: [
      { postId: notePost.id, tagId: tags["SQL"].id },
      { postId: notePost.id, tagId: tags["TypeScript"].id },
    ],
  });

  // E. Pending Draft from Contributor
  const pendingPost = await db.post.create({
    data: {
      title: "Optimizing Docker Containers for Production deployments",
      slug: "optimizing-docker-containers-production-deployments",
      content: "Docker image size matters. Multi-stage builds can reduce a standard node application image from 1.2GB down to 120MB by stripping devDependencies, compiler binaries, and leveraging distroless alpine bases. Here's how to structure a production-grade Dockerfile...",
      type: "article",
      status: "draft",
      readingTime: 4,
      authorId: contributorUser.id,
    },
  });

  await db.postTag.createMany({
    data: [
      { postId: pendingPost.id, tagId: tags["Docker"].id },
      { postId: pendingPost.id, tagId: tags["DevOps"].id },
    ],
  });

  console.log("Posts seeded successfully.");

  // 5. Seed Interactions
  // A. Reactions
  await db.reaction.createMany({
    data: [
      { postId: projectPost.id, type: "like", userId: viewerUser.id },
      { postId: projectPost.id, type: "rocket", userId: contributorUser.id },
      { postId: articlePost.id, type: "like", userId: viewerUser.id },
      { postId: articlePost.id, type: "mindblown", userId: contributorUser.id },
      { postId: shortPost.id, type: "fire", userId: viewerUser.id },
    ],
  });

  // B. Bookmarks
  await db.bookmark.create({
    data: {
      postId: articlePost.id,
      userId: viewerUser.id,
    },
  });

  // C. Comments
  await db.comment.create({
    data: {
      postId: projectPost.id,
      userId: contributorUser.id,
      content: "This looks super slick Manish! Loving the GitHub-style contribution widget in the sidebar.",
    },
  });

  await db.comment.create({
    data: {
      postId: projectPost.id,
      userId: viewerUser.id,
      content: "Congrats on launching! I bookmarked this to follow your updates.",
    },
  });

  console.log("Interactions seeded successfully.");

  // 6. Seed Newsletter Subscribers (Skipped to ensure only real subscribers exist)
  console.log("Subscribers seeding skipped.");


  // 7. Seed Page Views (spread over 14 days)
  console.log("Generating analytics history...");
  const userAgents = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X)",
  ];

  const postIds = [projectPost.id, articlePost.id, shortPost.id, notePost.id];

  for (let i = 13; i >= 0; i--) {
    const viewDate = new Date();
    viewDate.setDate(viewDate.getDate() - i);

    const day = viewDate.getDay();
    const isWeekend = day === 0 || day === 6;
    const viewsCount = isWeekend ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 30) + 15;

    for (let v = 0; v < viewsCount; v++) {
      const mockIp = `192.168.1.${Math.floor(Math.random() * 15) + (i * 2)}`;
      const ipHash = crypto.createHash("sha256").update(mockIp).digest("hex");
      const randomPostId = postIds[Math.floor(Math.random() * postIds.length)];

      await db.pageView.create({
        data: {
          postId: randomPostId,
          ipHash,
          userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
          path: `/post/some-post`,
          createdAt: viewDate,
        },
      });
    }
  }

  console.log("Database seeded successfully! Finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
