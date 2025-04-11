// pages/api/schedulePosts.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ScheduledPostInput = {
  uri: string;           // The public URL of the image.
  title: string;         // The post title (use an empty string if none is provided).
  scheduledTime: string; // A date/time string in ISO format.
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const scheduledPosts: ScheduledPostInput[] = req.body;

    if (!Array.isArray(scheduledPosts)) {
      res.status(400).json({ error: "Invalid data. Expected an array." });
      return;
    }

    // Create scheduled posts in the database.
    const createdPosts = await Promise.all(
      scheduledPosts.map(async (post) => {
        // Ensure title always has a value (default to empty string).
        const title = post.title || "";
        // Create the scheduled post record using the Prisma client.
        return await prisma.scheduledPost.create({
          data: {
            imageUri: post.uri,
            title,
            scheduledTime: new Date(post.scheduledTime),
          },
        });
      })
    );

    res.status(200).json({
      success: true,
      count: createdPosts.length,
      posts: createdPosts,
    });
  } catch (error) {
    console.error("Error scheduling posts:", error);
    res.status(500).json({ error: "Failed to schedule posts" });
  }
}
