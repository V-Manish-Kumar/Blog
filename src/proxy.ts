import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isWriterRoute = createRouteMatcher([
  "/write(.*)",
  "/drafts(.*)",
  "/edit-post(.*)",
]);
const isAuthRoute = createRouteMatcher([
  "/profile(.*)",
  "/settings(.*)",
  "/bookmarks(.*)",
]);

export const proxy = clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  const isProtected = isAdminRoute(req) || isWriterRoute(req) || isAuthRoute(req);
  if (!userId && isProtected) {
    return redirectToSignIn();
  }

  if (userId) {
    const claims = (await auth()).sessionClaims;
    let role = (claims?.metadata as any)?.role || (claims as any)?.publicMetadata?.role;

    if (!role) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        role = (user.publicMetadata?.role as string) || "viewer";
      } catch (e) {
        role = "viewer";
      }
    }

    // Admin routes require admin role
    if (isAdminRoute(req) && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Writer routes require admin or writer role
    if (isWriterRoute(req) && role !== "admin" && role !== "writer") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.[\\w]+$|_next/image|_next/static|favicon.ico).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Verify middleware matcher includes clerk path
    '/__clerk/:path*',
  ],
};
