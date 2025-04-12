// pages/api/listUploads.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "uploads", "uploadData.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const posts = JSON.parse(fileContent) as {
      postId: string;
      title: string;
      images: string[];
    }[];

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Failed to read uploadData.json:", error);
    res.status(500).json({ error: "Failed to list uploaded posts" });
  }
}