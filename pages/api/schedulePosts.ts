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

    const createdPosts = [];

    for (const post of scheduledPosts) {
      const caption = post.title || post.description || "";
      const scheduledTime = new Date(post.scheduledTime);

      const imagesToUse: string[] = Array.isArray(post.images)
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

      await prisma.scheduledPostImage.createMany({
        data: imagesToUse.map((uri) => ({
          imageUri: uri,
          postId: createdPost.id,
        })),
      });

      createdPosts.push(createdPost);
    }

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
