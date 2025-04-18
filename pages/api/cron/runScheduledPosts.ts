// pages/api/cron/processScheduled.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { postToBluesky } from "@/lib/postToBluesky";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const now = new Date();
    const duePosts = await prisma.scheduledPost.findMany({
      where: {
        posted: false,
        scheduledTime: { lte: now },
      },
      include: { images: true },
    });

    const results = [];

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
          console.error(`Attempt ${attempts} failed for post ${post.id}:`, lastError);
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

      if (!success && attempts >= 5 && NOTIFY_EMAIL) {
        await transporter.sendMail({
          from: `\"Bluesky Poster\" <${process.env.SMTP_USER}>`,
          to: NOTIFY_EMAIL,
          subject: `\uD83D\uDEA8 Failed to post (ID: ${post.id})`,
          text: `The scheduled post with ID ${post.id} failed after 5 attempts.\n\nLast error:\n${lastError}`,
        });
      }

      results.push({ id: post.id, success, attempts });
    }

    return res.status(200).json({ results });
  } catch (error: any) {
    console.error("Cron job error (top-level):", error);
    return res.status(500).json({
      error: "Failed to process scheduled posts",
      details: error.message || String(error),
    });
  }
}
