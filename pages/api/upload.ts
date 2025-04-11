// pages/api/upload.ts

import type { NextApiRequest, NextApiResponse } from "next";
import IncomingForm from "formidable-serverless";
import { promises as fs } from "fs";
import path from "path";

// Define a minimal interface for our uploaded files.
interface FormidableFile {
  filepath?: string;
  originalFilename?: string;
  webkitRelativePath?: string;
  name?: string;
}

export const config = {
  api: {
    bodyParser: false, // Disable Next.js's built-in body parser.
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const form = new IncomingForm({
    multiples: true, // allow multiple file uploads
    keepExtensions: true,
  });

  form.parse(req, async (err: any, _fields: any, files: Record<string, any>) => {
    if (err) {
      console.error("Error parsing form:", err);
      res.status(500).json({ error: "Form parse failed" });
      return;
    }

    console.log("Files received:", files);

    // Flatten all files from the files object.
    let allFiles: FormidableFile[] = [];
    for (const key of Object.keys(files)) {
      const val = files[key];
      if (Array.isArray(val)) {
        allFiles = allFiles.concat(val as FormidableFile[]);
      } else if (val) {
        allFiles.push(val);
      }
    }

    if (allFiles.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    // Find the JSON file by checking for a filename ending with ".json".
    const jsonFile = allFiles.find((file) => {
      const fname = file.originalFilename || file.webkitRelativePath || file.name;
      return fname && fname.toLowerCase().endsWith(".json");
    });

    if (!jsonFile) {
      res.status(400).json({ error: "No JSON file uploaded" });
      return;
    }

    // Use jsonFile.filepath or fallback to (jsonFile as any).path.
    const jsonFilePath = jsonFile.filepath || (jsonFile as any).path;
    if (!jsonFilePath) {
      res.status(400).json({ error: "JSON file path not found" });
      return;
    }

    // Read and parse the JSON file.
    let parsedJson: any;
    try {
      const jsonText = await fs.readFile(jsonFilePath, "utf-8");
      parsedJson = JSON.parse(jsonText);
    } catch (error) {
      console.error("Failed to parse JSON file:", error);
      res.status(400).json({ error: "Invalid JSON file" });
      return;
    }

    // Helper function: Normalize a file's relative path by removing the top-level folder.
    // E.g. "FolderName/media/posts/202501/image1.jpg" becomes "media/posts/202501/image1.jpg"
    const normalizePath = (file: FormidableFile): string => {
      const rawPath = file.webkitRelativePath || file.originalFilename || file.name || "";
      return rawPath.replace(/^[^\/]+\/(.*)/, "$1");
    };

    // Build a map of image files keyed by their normalized relative path.
    const imageMap = new Map<string, FormidableFile>();
    for (const file of allFiles) {
      if (file === jsonFile) continue;
      const normalized = normalizePath(file);
      if (!normalized) continue;
      if (normalized.match(/\.(jpe?g|png|webp)$/i)) {
        imageMap.set(normalized, file);
      }
    }

    // Process each post in the JSON.
    // Each post should have a "media" array (with objects that have a "uri" property)
    // and a "title" field that serves as the description.
    type ParsedImage = { uri: string; description: string; buffer?: Buffer };
    const images: ParsedImage[] = [];

    for (const post of parsedJson) {
      const description = post.title || "";
      const media = Array.isArray(post.media) ? post.media : [];
      for (const item of media) {
        // The JSON's "uri" should match a normalized file path in the uploaded image map.
        const file = imageMap.get(item.uri);
        if (!file) {
          console.warn(`Missing image for uri: ${item.uri}`);
          continue;
        }
        // Define the destination in the permanent location inside "public/uploads".
        const destination = path.join(process.cwd(), "public", "uploads", item.uri);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        // Copy the file from its temporary location to the destination.
        await fs.copyFile(file.filepath || (file as any).path, destination);
        // Build the public URL for the image, ensuring forward slashes.
        const publicUri = "/uploads/" + item.uri.replace(/\\/g, "/");
        // Optionally, read the file's content into a buffer (for later processing if needed).
        const buffer = await fs.readFile(destination);
        images.push({
          uri: publicUri,
          description,
          buffer,
        });
      }
    }

    // Save the processed data (public URLs and descriptions) to a JSON file for later retrieval.
    const processedData = images.map(({ uri, description }) => ({ uri, description }));
    const dataPath = path.join(process.cwd(), "public", "uploads", "uploadData.json");
    await fs.writeFile(dataPath, JSON.stringify(processedData, null, 2));

    res.status(200).json({
      success: true,
      count: images.length,
      images: processedData,
    });
  });
}
