import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Helper to determine base application URL for links
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// Read SMTP credentials
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || `"DevFeed" <no-reply@v-manish-kumar.dev>`;

// Check if SMTP is configured
const isSmtpConfigured = !!(smtpHost && smtpUser && smtpPass);

/**
 * Sends an email using SMTP if configured, otherwise falls back to logging and saving local HTML debug files.
 */
export async function sendMail(options: { to: string; subject: string; html: string }) {
  const { to, subject, html } = options;

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
      });

      console.log(`[SMTP Email Sent] MessageId: ${info.messageId} to: ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("[SMTP Email Error] Failed to send real email via SMTP:", error);
    }
  }

  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    console.warn(`[Email Disabled] SMTP is not configured. Skipping send to ${to} with subject: ${subject}`);
    return { success: false, reason: "SMTP not configured" };
  }

  console.log("[Email Debug] SMTP credentials missing; writing HTML mail to the local workspace.");

  try {
    const emailsDir = path.join(process.cwd(), "emails");
    if (!fs.existsSync(emailsDir)) {
      fs.mkdirSync(emailsDir, { recursive: true });
    }

    const emailPath = path.join(emailsDir, "last-sent-email.html");
    fs.writeFileSync(emailPath, html, "utf-8");
    console.log(`[Local Debug Email Saved] ${emailPath}`);
  } catch (err) {
    console.error("[Local Debug Email Error] Failed to write email to workspace:", err);
  }

  return { success: true, debug: true };
}

/**
 * Renders the subscription confirmation email template.
 */
export function getSubscriptionConfirmTemplate(email: string) {
  const unsubscribeUrl = `${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Confirmed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #4f46e5;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 32px 24px;
            line-height: 1.6;
          }
          .content p {
            margin: 0 0 16px 0;
            font-size: 15px;
            color: #334155;
          }
          .features {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
          }
          .features-title {
            font-weight: 700;
            font-size: 13px;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
          }
          .feature-item {
            font-size: 14px;
            color: #475569;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
          }
          .feature-item::before {
            content: "✓";
            color: #10b981;
            font-weight: bold;
            margin-right: 8px;
          }
          .footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          .footer a {
            color: #4f46e5;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>blog.v-manish-kumar.dev</h1>
          </div>
          <div class="content">
            <p>Hey there,</p>
            <p>You have successfully subscribed to the newsletter feed of <strong>blog.v-manish-kumar.dev</strong>!</p>
            <p>From now on, you'll receive clean developer insights, updates, and learning notes delivered directly to your inbox. No spam, just pure technical logs.</p>
            
            <div class="features">
              <div class="features-title">What you will receive:</div>
              <div class="feature-item">Deep-dive long form technical articles</div>
              <div class="feature-item">Milestones on projects built in public</div>
              <div class="feature-item">TIL (Today I Learned) snippets and code reviews</div>
            </div>
            
            <p>Thank you for tag-along. Excited to build with you in public!</p>
          </div>
          <div class="footer">
            <p>Managed by Manish Kumar • Built in Public</p>
            <p>Don't want these emails anymore? <a href="${unsubscribeUrl}">Unsubscribe instantly</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Renders the new post broadcast notification email template.
 */
export function getNewPostNotificationTemplate(email: string, post: {
  title: string;
  slug: string;
  type: string;
  content: string;
  readingTime: number;
}) {
  const unsubscribeUrl = `${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
  const postUrl = `${APP_URL}/post/${post.slug}`;
  
  // Format Post Type badge color
  let typeColor = "#4f46e5"; // default Indigo
  let typeLabel = "Post";
  if (post.type === "article") {
    typeColor = "#6d28d9"; // Violet
    typeLabel = "Article";
  } else if (post.type === "project") {
    typeColor = "#2563eb"; // Blue
    typeLabel = "Project Update";
  } else if (post.type === "note") {
    typeColor = "#0d9488"; // Teal
    typeLabel = "Learning Note (TIL)";
  } else if (post.type === "short") {
    typeColor = "#db2777"; // Pink
    typeLabel = "Short Update";
  }

  // Create content snippet (strip html/markdown tags if any)
  const cleanSnippet = post.content
    .replace(/[#\n`*_\-\[\]\(\)]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 200)
    .trim() + "...";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New post: ${post.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #0f172a;
            padding: 24px;
            text-align: center;
          }
          .header a {
            color: #ffffff;
            text-decoration: none;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 32px 24px;
            line-height: 1.6;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            font-size: 10px;
            font-weight: 700;
            color: #ffffff;
            background-color: ${typeColor};
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
          }
          .post-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 8px 0;
            line-height: 1.3;
          }
          .metadata {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 20px;
            font-family: monospace;
          }
          .snippet {
            font-size: 15px;
            color: #334155;
            margin-bottom: 28px;
            background-color: #f8fafc;
            border-left: 4px solid #cbd5e1;
            padding: 12px 16px;
            border-radius: 0 8px 8px 0;
          }
          .button-container {
            text-align: center;
            margin: 32px 0 16px 0;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4f46e5;
            color: #ffffff !important;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
          }
          .footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          .footer a {
            color: #4f46e5;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="${APP_URL}">blog.v-manish-kumar.dev</a>
          </div>
          <div class="content">
            <span class="badge">${typeLabel}</span>
            <h2 class="post-title">${post.title}</h2>
            <div class="metadata">
              Manish Kumar • ${post.readingTime} min read
            </div>
            
            <div class="snippet">
              ${cleanSnippet}
            </div>
            
            <p style="font-size: 14px; color: #475569; margin: 0;">
              I just shared a new update on my developer timeline! Click the link below to view the full post, check the codebase demo, or drop a comment:
            </p>
            
            <div class="button-container">
              <a href="${postUrl}" class="btn">Read Full Post</a>
            </div>
          </div>
          <div class="footer">
            <p>Manish Kumar • Timeline Build in Public Feed</p>
            <p>You received this because you are subscribed to the newsletter. <a href="${unsubscribeUrl}">Unsubscribe instantly</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Renders the subscription removal email template.
 */
export function getSubscriptionRemovalTemplate(email: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Removed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #f43f5e;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 32px 24px;
            line-height: 1.6;
          }
          .content p {
            margin: 0 0 16px 0;
            font-size: 15px;
            color: #334155;
          }
          .footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>blog.v-manish-kumar.dev</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>This email is to notify you that your subscription to the <strong>blog.v-manish-kumar.dev</strong> newsletter has been removed by the administrator.</p>
            <p>You will no longer receive any updates, articles, or newsletter broadcasts. If you believe this was done in error or would like to subscribe again, please visit our homepage.</p>
          </div>
          <div class="footer">
            <p>Managed by Manish Kumar • Built in Public</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
