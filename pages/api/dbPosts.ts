import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const posts = await prisma.scheduledPost.findMany({
      include: {
        images: true,
      },
    });
    return res.status(200).json({
      success: true,
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        scheduledTime: post.scheduledTime?.toISOString(),
        posted: post.posted,
        images: post.images.map((img) => img.imageUri),
      })),
    });
  }

  if (req.method === "POST") {
    const { id, title, scheduledTime } = req.body;
    try {
      const updated = await prisma.scheduledPost.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(scheduledTime !== undefined && { scheduledTime: new Date(scheduledTime) }),
        },
      });
      return res.status(200).json({ success: true, updated });
    } catch (error) {
      console.error("Failed to update post:", error);
      return res.status(500).json({ success: false });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, error: "Missing ID" });

    try {
      // First delete related images
      await prisma.scheduledPostImage.deleteMany({
        where: { postId: parseInt(id as string) },
      });

      // Then delete the post
      await prisma.scheduledPost.delete({
        where: { id: parseInt(id as string) },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to delete post:", error);
      return res.status(500).json({ success: false });
    }
  }

  res.status(405).end();
}
