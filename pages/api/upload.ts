// pages/api/upload.ts

import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: false,
  },
};

const storage = multer.memoryStorage();
const upload = multer({ storage }).any();

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    await runMiddleware(req, res, upload);

    const files = (req as any).files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files received" });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    console.log("🔍 Uploaded files:");
    files.forEach((file) => console.log("•", file.originalname));

    const jsonFile = files.find((file) => file.originalname.endsWith(".json"));
    if (!jsonFile) {
      return res.status(400).json({ error: "No JSON file found" });
    }

    const jsonText = jsonFile.buffer.toString("utf-8");
    const rawPosts = JSON.parse(jsonText);

    const imageMap = new Map<string, Express.Multer.File>();
    for (const file of files) {
      if (file !== jsonFile) {
        const name = path.basename(file.originalname);
        imageMap.set(name, file);
      }
    }

    const output: {
      postId: string;
      title: string;
      images: string[];
    }[] = [];

    for (const post of rawPosts) {
      const postId = String(post.creation_timestamp || uuidv4());
      const title = post.title || "Untitled";
      const media = Array.isArray(post.media) ? post.media : [];

      const imageUris: string[] = [];

      for (const item of media) {
        const fileName = path.basename(item.uri);
        const file = imageMap.get(fileName);
        if (!file) {
          console.warn("⚠️ Missing image:", fileName);
          continue;
        }

        const destPath = path.join("uploads", fileName);
        const destFullPath = path.join("public", destPath);
        await fs.writeFile(destFullPath, file.buffer);
        imageUris.push("/" + destPath.replace(/\\/g, "/"));
      }

      if (imageUris.length > 0) {
        output.push({ postId, title, images: imageUris });
      }
    }

    const dataPath = path.join("public", "uploads", "uploadData.json");
    await fs.writeFile(dataPath, JSON.stringify(output, null, 2), "utf-8");

    res.status(200).json({ success: true, count: output.length });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ error: "Upload failed" });
  }
}