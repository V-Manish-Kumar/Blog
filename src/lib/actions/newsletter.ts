"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../db";
import { sendMail, getSubscriptionConfirmTemplate, getSubscriptionRemovalTemplate } from "@/lib/email";

// Public: Subscribe to newsletter
export async function subscribeNewsletter(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Invalid email address");
  }

  const existing = await db.subscriber.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    if (!existing.active) {
      await db.subscriber.update({
        where: { id: existing.id },
        data: { active: true },
      });

      // Send confirmation email on reactivation
      try {
        await sendMail({
          to: cleanEmail,
          subject: "Subscription Confirmed",
          html: getSubscriptionConfirmTemplate(cleanEmail),
        });
      } catch (err) {
        console.error("Failed to send reactivation confirmation email:", err);
      }

      return { success: true, message: "Subscription reactivated!" };
    }
    return { success: true, message: "You are already subscribed!" };
  }

  await db.subscriber.create({
    data: {
      email: cleanEmail,
    },
  });

  // Send confirmation email on new subscription
  try {
    await sendMail({
      to: cleanEmail,
      subject: "Subscription Confirmed",
      html: getSubscriptionConfirmTemplate(cleanEmail),
    });
  } catch (err) {
    console.error("Failed to send subscription confirmation email:", err);
  }

  return { success: true, message: "Thank you for subscribing!" };
}

// Public: Unsubscribe from newsletter
export async function unsubscribeNewsletter(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const existing = await db.subscriber.findUnique({
    where: { email: cleanEmail },
  });

  if (!existing) {
    return { success: false, message: "Email address not found." };
  }

  if (!existing.active) {
    return { success: true, message: "You are already unsubscribed." };
  }

  await db.subscriber.update({
    where: { id: existing.id },
    data: { active: false },
  });

  return { success: true, message: "You have been successfully unsubscribed." };
}

// Admin: Get all subscribers
export async function getSubscribers() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser || dbUser.role !== "admin") {
    throw new Error("Forbidden");
  }

  return await db.subscriber.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// Admin: Delete a subscriber
export async function deleteSubscriber(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser || dbUser.role !== "admin") {
    throw new Error("Forbidden");
  }

  const subscriber = await db.subscriber.findUnique({
    where: { id },
  });

  if (!subscriber) {
    throw new Error("Subscriber not found");
  }

  // Delete from DB
  await db.subscriber.delete({
    where: { id },
  });

  // Send email notifying they have been removed by the admin
  try {
    await sendMail({
      to: subscriber.email,
      subject: "Newsletter Subscription Update",
      html: getSubscriptionRemovalTemplate(subscriber.email),
    });
  } catch (err) {
    console.error("Failed to send subscription removal email:", err);
  }

  return { success: true };
}


