import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  // 1. Get webhook secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response(
      "Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
      { status: 500 }
    );
  }

  // 2. Get headers for svix verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // 3. If there are no headers, return error
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  // 4. Get raw body string for verification
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // 5. Verify signature
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  // 6. Handle webhook events
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      return new Response("Error: No email address found", { status: 400 });
    }

    // Check if the user already exists by email (e.g., from seed data or previous account)
    const existingByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // Link the existing account to this Clerk ID
      await db.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId: id,
          name: `${first_name || ""} ${last_name || ""}`.trim() || username || existingByEmail.name,
          imageUrl: image_url || existingByEmail.imageUrl,
        },
      });

      // Update Clerk metadata role to match DB role
      const client = await clerkClient();
      await client.users.updateUserMetadata(id, {
        publicMetadata: {
          role: existingByEmail.role,
        },
      });

      return new Response("User linked by email and synced", { status: 200 });
    }

    // Determine initial role securely based on email whitelist
    const adminEmails = (process.env.ADMIN_EMAILS || "manishedu980@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    const assignedRole = adminEmails.includes(email.toLowerCase()) ? "admin" : "viewer";

    // Set the role in Clerk's publicMetadata if not already configured
    const client = await clerkClient();
    await client.users.updateUserMetadata(id, {
      publicMetadata: {
        role: assignedRole,
      },
    });

    // Create user in local SQLite DB
    await db.user.create({
      data: {
        clerkId: id,
        email,
        name: `${first_name || ""} ${last_name || ""}`.trim() || username || "Anonymous",
        imageUrl: image_url || null,
        role: assignedRole,
      },
    });

    return new Response("User successfully synced and created", { status: 201 });
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url, username, public_metadata } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      return new Response("Error: No email address found", { status: 400 });
    }

    // Find the user in local SQLite DB by Clerk ID
    const existingUser = await db.user.findUnique({
      where: { clerkId: id },
    });

    if (!existingUser) {
      // Check if user already exists by email
      const existingByEmail = await db.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        await db.user.update({
          where: { id: existingByEmail.id },
          data: {
            clerkId: id,
            name: `${first_name || ""} ${last_name || ""}`.trim() || username || existingByEmail.name,
            imageUrl: image_url || existingByEmail.imageUrl,
            role: (public_metadata?.role as string) || existingByEmail.role,
          },
        });
        return new Response("User linked by email and updated", { status: 200 });
      }

      // Fallback: If update event is received but user is missing, create them
      await db.user.create({
        data: {
          clerkId: id,
          email,
          name: `${first_name || ""} ${last_name || ""}`.trim() || username || "Anonymous",
          imageUrl: image_url || null,
          role: (public_metadata?.role as string) || "viewer",
        },
      });
      return new Response("User not found locally, created instead", { status: 201 });
    }

    // Update the local DB user details
    const roleFromMetadata = (public_metadata?.role as string) || existingUser.role;

    await db.user.update({
      where: { clerkId: id },
      data: {
        email,
        name: `${first_name || ""} ${last_name || ""}`.trim() || username || "Anonymous",
        imageUrl: image_url || null,
        role: roleFromMetadata,
      },
    });

    return new Response("User successfully updated", { status: 200 });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      return new Response("Error: No user ID found", { status: 400 });
    }

    // Check if user exists before deleting
    const existingUser = await db.user.findUnique({
      where: { clerkId: id },
    });

    if (existingUser) {
      await db.user.delete({
        where: { clerkId: id },
      });
    }

    return new Response("User successfully deleted", { status: 200 });
  }

  return new Response("Webhook processed", { status: 200 });
}
