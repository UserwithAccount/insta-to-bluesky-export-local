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
      return res.status(400).json({ error: "Invalid data. Expected an array." });
    }

    const createOperations = scheduledPosts.map(async (post) => {
      const caption = post.title || post.description || "";

      let imagesToUse: string[] = [];
      if (Array.isArray(post.images) && post.images.length > 0) {
        imagesToUse = post.images.slice(0, 4);
      } else if (post.uri && typeof post.uri === "string") {
        imagesToUse = [post.uri];
      }

      if (imagesToUse.length === 0) {
        throw new Error("Each post must contain at least one image.");
      }

      // Create the post and related images in a transaction
      return await prisma.$transaction(async (tx) => {
        const createdPost = await tx.scheduledPost.create({
          data: {
            title: caption,
            scheduledTime: new Date(post.scheduledTime),
          },
        });

        await tx.scheduledPostImage.createMany({
          data: imagesToUse.map((uri) => ({
            imageUri: uri,
            postId: createdPost.id,
          })),
        });

        return createdPost;
      });
    });

    const createdPosts = await Promise.all(createOperations);

    return res.status(200).json({
      success: true,
      count: createdPosts.length,
      posts: createdPosts,
    });
  } catch (error: any) {
    console.error("Error scheduling posts:", error);
    return res.status(500).json({
      error: "Failed to schedule posts",
      details: error.message || String(error),
    });
  }
}
