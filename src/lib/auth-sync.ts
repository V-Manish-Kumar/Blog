import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "./db";

export async function syncUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  // Find user in local database
  let dbUser = await db.user.findUnique({
    where: { clerkId: userId },
  });

  const clerkRole = (user.publicMetadata?.role as string) || null;

  if (!dbUser) {
    // Check if the user already exists by email (e.g., created via database seeding or previous account)
    dbUser = await db.user.findUnique({
      where: { email },
    });

    if (dbUser) {
      // Link the existing account to this Clerk ID
      dbUser = await db.user.update({
        where: { id: dbUser.id },
        data: {
          clerkId: userId,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || dbUser.name,
          imageUrl: user.imageUrl || dbUser.imageUrl,
        },
      });
    } else {
      let assignedRole = "viewer";

      if (clerkRole) {
        assignedRole = clerkRole;
      } else {
        const adminEmails = (process.env.ADMIN_EMAILS || "manishedu980@gmail.com")
          .split(",")
          .map((e) => e.trim().toLowerCase());
        if (adminEmails.includes(email.toLowerCase())) {
          assignedRole = "admin";
        }
      }

      // Set Clerk metadata if not already matching
      if (clerkRole !== assignedRole) {
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            role: assignedRole,
          },
        });
      }

      // Create user in SQLite
      dbUser = await db.user.create({
        data: {
          clerkId: userId,
          email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Anonymous",
          imageUrl: user.imageUrl,
          role: assignedRole,
        },
      });
    }
  } else {
    // Sync local DB role with Clerk publicMetadata role (which is the source of truth)
    const isSuperAdmin = email.toLowerCase() === "manishedu980@gmail.com";
    const targetRole = isSuperAdmin ? "admin" : (clerkRole || dbUser.role);

    if (targetRole !== dbUser.role) {
      dbUser = await db.user.update({
        where: { id: dbUser.id },
        data: { role: targetRole },
      });
    }

    if (isSuperAdmin && clerkRole !== "admin") {
      // Restore Admin role on Clerk for the Super Admin
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: "admin",
        },
      });
    } else if (!clerkRole) {
      // Restore metadata in Clerk if it was somehow lost
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: dbUser.role,
        },
      });
    }
  }

  return dbUser;
}

// Get the current user's role
export async function getRole(): Promise<string> {
  const { userId } = await auth();
  if (!userId) return "visitor";

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  return dbUser?.role || "viewer";
}
