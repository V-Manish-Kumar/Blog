"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "../db";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
  });
  if (!dbUser || dbUser.role !== "admin") {
    throw new Error("Forbidden");
  }
  return dbUser;
}

// Get all users (Admin only)
export async function getUsers() {
  await verifyAdmin();

  return await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// Update user role (Admin only)
export async function updateUserRole(targetClerkId: string, role: "admin" | "writer" | "viewer") {
  const currentAdmin = await verifyAdmin();

  // 1. Get target user
  const targetUser = await db.user.findUnique({
    where: { clerkId: targetClerkId },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Prevent modifying the Super Admin (manishedu980@gmail.com) under any circumstances
  if (targetUser.email.toLowerCase() === "manishedu980@gmail.com") {
    throw new Error("Permission Denied: Cannot modify the role of the Super Admin.");
  }

  // If the current admin is NOT the Super Admin, restrict them
  const isSuperAdmin = currentAdmin.email.toLowerCase() === "manishedu980@gmail.com";
  if (!isSuperAdmin) {
    if (role === "admin" || targetUser.role === "admin") {
      throw new Error("Permission Denied: Only the Super Admin can promote or demote Admin roles.");
    }
  }

  // 1. Update in local SQLite DB
  const updatedUser = await db.user.update({
    where: { clerkId: targetClerkId },
    data: { role },
  });

  // 2. Update in Clerk publicMetadata
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(targetClerkId, {
      publicMetadata: {
        role,
      },
    });
  } catch (error) {
    console.error("Failed to update Clerk metadata:", error);
    // Keep DB in sync anyway or throw error
  }

  revalidatePath("/admin/users");
  return updatedUser;
}

// Delete user (Super Admin only)
export async function deleteUser(targetClerkId: string) {
  const currentAdmin = await verifyAdmin();

  // ONLY the Super Admin (manishedu980@gmail.com) can delete users
  if (currentAdmin.email.toLowerCase() !== "manishedu980@gmail.com") {
    throw new Error("Permission Denied: Only the Super Admin can delete users.");
  }

  // Find the target user
  const targetUser = await db.user.findUnique({
    where: { clerkId: targetClerkId },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Prevent deleting oneself
  if (targetUser.email.toLowerCase() === "manishedu980@gmail.com") {
    throw new Error("Permission Denied: Cannot delete yourself.");
  }

  // 1. Delete in Clerk
  try {
    const client = await clerkClient();
    await client.users.deleteUser(targetClerkId);
  } catch (error) {
    console.error("Failed to delete user in Clerk:", error);
    // Even if Clerk delete fails (e.g. user already deleted there), proceed to delete from SQLite
  }

  // 2. Delete from local SQLite database (cascade deletes handle posts, comments, bookmarks, reactions)
  const deletedUser = await db.user.delete({
    where: { clerkId: targetClerkId },
  });

  revalidatePath("/admin/users");
  return deletedUser;
}
