// pages/api/dbPosts.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { supabase } from "@/lib/supabase"; // Import the shared Supabase client

const prisma = new PrismaClient();


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const posts = await prisma.scheduledPost.findMany({
        orderBy: { scheduledTime: "asc" },
        include: { images: true },
      });

      const formatted = posts.map((post) => ({
        id: post.id,
        title: post.title,
        scheduledTime: post.scheduledTime?.toISOString() ?? null,
        posted: post.posted,
        images: post.images.map((img) => img.imageUri),
      }));

      return res.status(200).json({ success: true, posts: formatted });
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }
  }

  if (req.method === "POST") {
    const { id, title, scheduledTime } = req.body;

    try {
      const data: Record<string, any> = {};
      if (title !== undefined) data.title = title;
      if (scheduledTime !== undefined) data.scheduledTime = new Date(scheduledTime);

      const updated = await prisma.scheduledPost.update({
        where: { id },
        data,
      });

      return res.status(200).json({ success: true, updated });
    } catch (error) {
      console.error("Failed to update post:", error);
      return res.status(500).json({ error: "Failed to update post" });
    }
  }

  if (req.method === "DELETE") {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: "Missing ID" });

    try {
      const images = await prisma.scheduledPostImage.findMany({
        where: { postId: parseInt(id) },
      });

      for (const img of images) {
        const path = img.imageUri.replace(/^https:\/\/[^\/]+\/storage\/v1\/object\/public\//, "");
        await supabase.storage.from("uploads").remove([path]);
      }

      await prisma.scheduledPostImage.deleteMany({ where: { postId: parseInt(id) } });
      await prisma.scheduledPost.delete({ where: { id: parseInt(id) } });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to delete post:", error);
      return res.status(500).json({ error: "Failed to delete post" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
