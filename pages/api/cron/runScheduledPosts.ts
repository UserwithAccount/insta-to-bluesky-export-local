// pages/api/cron/processScheduled.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { postToBluesky } from "@/lib/postToBluesky";
import nodemailer from "nodemailer";

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const now = new Date();
    const duePosts = await prisma.scheduledPost.findMany({
      where: { posted: false, scheduledTime: { lte: now } },
      include: { images: true },
    });

    const results: any[] = [];

    for (const post of duePosts) {
      let attempts = 0;
      let success = false;
      let lastError = null;

      while (!success && attempts < 5) {
        try {
          await postToBluesky(post.id);
          success = true;
        } catch (err: any) {
          attempts++;
          lastError = err?.message || String(err);
        }
      }

      await prisma.cronLog.create({
        data: {
          postId: post.id,
          status: success ? "success" : "failed",
          message: success ? "Posted successfully" : lastError,
          attempts,
        },
      });

      if (!success && attempts === 5 && NOTIFY_EMAIL) {
        try {
          await transporter.sendMail({
            from: `"Bluesky Export" <${SMTP_USER}>`,
            to: NOTIFY_EMAIL,
            subject: `❌ Post Failed after 5 Attempts (Post ID: ${post.id})`,
            text: `Post ${post.id} failed to send after 5 attempts.\n\nLast error:\n${lastError}`,
          });
        } catch (emailError: any) {
          console.error("❌ Email sending failed:", emailError.message || emailError);
        }
      }

      results.push({ id: post.id, success, attempts });
    }

    return res.status(200).json({ success: true, results });
  } catch (err: any) {
    console.error("❌ processScheduled failed:", err.message || err);
    return res.status(500).json({ error: "Failed to process scheduled posts" });
  }
}
