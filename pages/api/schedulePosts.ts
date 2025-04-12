// pages/api/schedulePosts.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The API now accepts posts in one of two shapes:
// Format A (Single Image):
//   {
//     uri: string,          // image public URL
//     description: string,  // post caption
//     scheduledTime: string // ISO datetime string
//   }
// Format B (Multiple Images):
//   {
//     images: string[],     // array of image public URLs (max 4)
//     title?: string,       // post title (optional)
//     scheduledTime: string // ISO datetime string
//   }
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
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    console.log("Incoming request body:", req.body);
    const scheduledPosts: ScheduledPostInput[] = req.body;

    if (!Array.isArray(scheduledPosts)) {
      res.status(400).json({ error: "Invalid data. Expected an array." });
      return;
    }

    const createdPosts = await Promise.all(
      scheduledPosts.map(async (post) => {
        // Determine the caption. Use title if provided; otherwise, use description; default to empty.
        const caption = post.title || post.description || "";
        
        // Determine the images array.
        let imagesToUse: string[] = [];
        if (post.images && Array.isArray(post.images) && post.images.length > 0) {
          imagesToUse = post.images.slice(0, 4);
        } else if (post.uri && typeof post.uri === "string") {
          imagesToUse = [post.uri];
        }

        if (imagesToUse.length === 0) {
          throw new Error("Each post must contain at least one image.");
        }

        // Create the scheduled post record (without images) in the database.
        const createdPost = await prisma.scheduledPost.create({
          data: {
            title: caption,
            scheduledTime: new Date(post.scheduledTime),
          },
        });

        // Create separate records for each image associated with the post.
        await Promise.all(
          imagesToUse.map(async (uri) => {
            return await prisma.scheduledPostImage.create({
              data: {
                imageUri: uri,
                postId: createdPost.id,
              },
            });
          })
        );

        return createdPost;
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
