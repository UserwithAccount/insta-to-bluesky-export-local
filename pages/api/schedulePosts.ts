import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type ScheduledPostInput = {
  title?: string;
  description?: string;
  scheduledTime: string;
  images?: string[];
  uri?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const scheduledPosts: ScheduledPostInput[] = req.body;

    if (!Array.isArray(scheduledPosts)) {
      return res.status(400).json({ error: "Expected an array of posts" });
    }

    const createdPosts = [];

    for (const post of scheduledPosts) {
      const caption = post.title || post.description || "";
      const parsedTime = new Date(post.scheduledTime);
      const scheduledTime = isNaN(parsedTime.getTime()) ? new Date() : parsedTime;

      const imagesToUse = Array.isArray(post.images)
        ? post.images.slice(0, 4)
        : post.uri
        ? [post.uri]
        : [];

      if (imagesToUse.length === 0) {
        console.warn("Skipping post with no images");
        continue;
      }

      const createdPost = await prisma.scheduledPost.create({
        data: {
          title: caption,
          scheduledTime,
        },
      });

      if (imagesToUse.length > 0) {
        await prisma.scheduledPostImage.createMany({
          data: imagesToUse.map((imageUri) => ({
            imageUri,
            postId: createdPost.id,
          })),
        });
      }

      createdPosts.push(createdPost);
    }

    return res.status(200).json({
      success: true,
      count: createdPosts.length,
    });
  } catch (error: any) {
    console.error("Scheduling error:", error);
    return res.status(500).json({
      error: "Failed to schedule posts",
      details: error.message || String(error),
    });
  }
}
