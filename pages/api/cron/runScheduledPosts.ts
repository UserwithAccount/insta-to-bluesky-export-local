// pages/api/cron/processScheduled.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { postToBluesky } from "@/lib/postToBluesky";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Required ENV vars
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error("❌ Missing SMTP configuration in environment variables.");
    return res.status(500).json({ error: "SMTP configuration missing" });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    const now = new Date();
    console.log("⏰ Checking for due posts at:", now.toISOString());

    const duePosts = await prisma.scheduledPost.findMany({
      where: { posted: false, scheduledTime: { lte: now } },
      include: { images: true },
    });

    console.log(`📦 Found ${duePosts.length} due post(s)`);

    const results = [];

    for (const post of duePosts) {
      let attempts = 0;
      let success = false;
      let lastError = "";

      while (!success && attempts < 5) {
        try {
          console.log(`📤 Attempting to post ID ${post.id}, try ${attempts + 1}`);
          await postToBluesky(post.id);
          success = true;
        } catch (err: any) {
          attempts++;
          lastError = err?.message || String(err);
          console.error(`❌ Attempt ${attempts} failed for post ${post.id}:`, lastError);
        }
      }

      try {
        await prisma.cronLog.create({
          data: {
            postId: post.id,
            status: success ? "success" : "failed",
            message: success ? "Posted successfully" : lastError,
            attempts,
          },
        });
      } catch (logErr: any) {
        console.error(`⚠️ Failed to write cron log for post ${post.id}:`, logErr?.message || logErr);
      }

      if (!success && attempts === 5 && NOTIFY_EMAIL) {
        try {
          await transporter.sendMail({
            from: `"Bluesky Poster" <${SMTP_USER}>`,
            to: NOTIFY_EMAIL,
            subject: `🚨 Failed to post (ID: ${post.id})`,
            text: `Post ID ${post.id} failed after 5 attempts.\n\nLast error:\n${lastError}`,
          });
        } catch (emailErr: any) {
          console.error(`📨 Email sending failed:`, emailErr?.message || emailErr);
        }
      }

      results.push({ id: post.id, success, attempts });
    }

    return res.status(200).json({ results });
  } catch (err: any) {
    console.error("🔥 Top-level cron job error:", err.message || err);
    return res.status(500).json({ error: "Failed to process scheduled posts" });
  }
}
