// pages/api/listUploads.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";

/**
 * API route to list uploaded images and their titles.
 * This route reads a JSON file saved at "public/uploads/uploadData.json"
 * that contains an array of image data objects.
 * Each image data object should have:
 *   - uri: string (the public URL, for example "/uploads/media/posts/202501/image1.jpg")
 *   - description: string (the title or description)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests.
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Define the path to the JSON file that stores the processed image data.
    const dataPath = path.join(process.cwd(), "public", "uploads", "uploadData.json");
    // Read the file contents as UTF-8 text.
    const fileContents = await fs.readFile(dataPath, "utf-8");
    // Parse the file as JSON.
    const images = JSON.parse(fileContents);
    // Return the image list.
    res.status(200).json({ success: true, images });
  } catch (error) {
    console.error("Error reading uploadData.json:", error);
    res.status(500).json({ error: "Failed to list uploaded files" });
  }
}
