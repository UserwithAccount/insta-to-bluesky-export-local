// cron/scheduler.ts

import { PrismaClient } from "@prisma/client";
import { postToBluesky } from "../lib/postToBluesky";
import dotenv from "dotenv";

// Load environment variables (DATABASE_URL, Bluesky keys, etc.)
dotenv.config();

const prisma = new PrismaClient();

async function runScheduler() {
  console.log("[Cron] Checking for scheduled posts...");
  const now = new Date();

  try {
    const duePosts = await prisma.scheduledPost.findMany({
      where: {
        scheduledTime: { lte: now },
        posted: false,
      },
      include: {
        images: true,
      },
    });

    if (duePosts.length === 0) {
      console.log("[Cron] No posts to send.");
      return;
    }

    for (const post of duePosts) {
      try {
        console.log(`[Cron] Sending post ID ${post.id} to Bluesky...`);
        await postToBluesky(post.id);
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { posted: true },
        });
        console.log(`[Cron] Post ID ${post.id} marked as posted.`);
      } catch (error) {
        console.error(`[Cron] Failed to send post ID ${post.id}:`, error);
      }
    }
  } catch (err) {
    console.error("[Cron] Error during cron execution:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runScheduler();
