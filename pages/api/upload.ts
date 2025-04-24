import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs";
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

function decodeUtf8String(input: string): string {
  try {
    return decodeURIComponent(escape(input));
  } catch {
    return input;
  }
}

function formatTitle(title: string): string {
  let decoded = decodeUtf8String(title);
  decoded = decoded.replace(/\\n/g, "\n");
  return decoded;
}

declare global {
  var uploadLogs: Record<string, string[]> | undefined;
}
if (!global.uploadLogs) global.uploadLogs = {};

function pushLog(uploadId: string, message: string) {
  if (!global.uploadLogs![uploadId]) global.uploadLogs![uploadId] = [];
  global.uploadLogs![uploadId].push(message);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const uploadId = req.query.uploadId as string;
  if (!uploadId) return res.status(400).json({ error: "Missing uploadId" });

  try {
    await runMiddleware(req, res, upload);

    const files = (req as any).files as Express.Multer.File[];
    if (!files || files.length === 0) {
      pushLog(uploadId, "❌ No files received.");
      return res.status(400).json({ error: "No files received" });
    }

    // 📦 Filter alle post_*.json-Dateien
    const jsonFiles = files.filter((file) =>
      file.originalname.endsWith(".json") && file.originalname.includes("posts_")
    );

    if (jsonFiles.length === 0) {
      pushLog(uploadId, "❌ No matching JSON files found (must include 'post_').");
      return res.status(400).json({ error: "No matching JSON files found (must include 'post_')" });
    }

    // 📥 Kombiniere alle passenden JSON-Dateien
    let rawPosts: any[] = [];

    for (const jsonFile of jsonFiles) {
      try {
        const jsonText = jsonFile.buffer.toString("utf-8");
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed)) {
          rawPosts.push(...parsed);
        } else {
          rawPosts.push(parsed);
        }
        pushLog(uploadId, `✅ Loaded: ${jsonFile.originalname}`);
      } catch (err) {
        pushLog(uploadId, `❌ Failed to parse: ${jsonFile.originalname}`);
        console.error("JSON parse error:", err);
      }
    }

    // 🗺️ Map Bilder
    const imageMap = new Map<string, Express.Multer.File>();
    for (const file of files) {
      if (!file.originalname.endsWith(".json")) {
        const name = path.basename(file.originalname);
        imageMap.set(name, file);
      }
    }

    const uploadsDir = path.join(process.cwd(), "public/uploads");
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const output: {
      postId: string;
      title: string;
      hasMention: boolean;
      images: string[];
    }[] = [];

    for (const post of rawPosts) {
      const media = Array.isArray(post.media) ? post.media : [];
      const postId =
        post.creation_timestamp?.toString() || media[0]?.creation_timestamp?.toString() || uuidv4();

      const rawTitle =
        post.title?.trim() ||
        media.find((m: any) => m.title?.trim())?.title?.trim() ||
        "Untitled";

      const title = formatTitle(rawTitle);
      const hasMention = /@\w+/.test(title);

      const imageUris: string[] = [];

      for (const item of media) {
        const fileName = path.basename(item.uri);
        const file = imageMap.get(fileName);
        if (!file) {
          pushLog(uploadId, `⚠️ Missing file: ${fileName}`);
          continue;
        }

        const filePath = path.join(uploadsDir, fileName);
        if (fs.existsSync(filePath)) {
          pushLog(uploadId, `⏭️ Skipped (already exists): ${fileName}`);
        } else {
          await fs.promises.writeFile(filePath, file.buffer);
          pushLog(uploadId, `✅ Uploaded: ${fileName}`);
        }

        imageUris.push(`/uploads/${fileName}`);
      }

      if (imageUris.length > 0) {
        output.push({ postId, title, hasMention, images: imageUris });
      }
    }

    const outputPath = path.join(uploadsDir, "uploadData.json");
    await fs.promises.writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");
    pushLog(uploadId, "✅ uploadData.json saved locally");

    return res.status(200).json({ success: true, count: output.length });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    pushLog(uploadId, "❌ Upload failed");
    res.status(500).json({ error: "Upload failed" });
  }
}
